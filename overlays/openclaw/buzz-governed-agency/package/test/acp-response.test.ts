import {
  BuzzAcpResponseReturner,
  InMemoryAcpResponseReturnStore,
  MemoryAcpResponseReturnLogger,
  extractCompletedOpenClawTurn,
  sha256Hex,
  type AcpResponseReturnRequest,
  type BuzzAcpResponsePublicationResult,
  type BuzzAcpResponsePublishRequest,
  type BuzzAcpResponsePublisher,
  type CompletedOpenClawTurn,
  type OpenClawAcpBinding,
} from "../src/index.js";
import {
  COMMUNITY_ID,
  RELAY,
  downDemoEvent,
  workerDemoEvent,
} from "./fixtures.js";

type Test = { name: string; run: () => Promise<void> | void };
const tests: Test[] = [];

function test(name: string, run: Test["run"]): void {
  tests.push({ name, run });
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const CHANNEL_ID = downDemoEvent.tags.find((tag) => tag[0] === "h")?.[1] as string;
const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const SESSION_KEY = "agent:down:buzz:b2-response-return-synthetic";
const AGENT_ID = "down";
const PROMPTED_AT = "2026-07-31T13:00:00.000Z";
const COMPLETED_AT = "2026-07-31T13:00:01.000Z";
const RETURNED_AT = "2026-07-31T13:00:02.000Z";

const binding: OpenClawAcpBinding = {
  binding_id: "binding-down-b2-response-return-v1",
  relay: RELAY,
  community_id: COMMUNITY_ID,
  buzz_agent_pubkey: workerDemoEvent.pubkey,
  openclaw_agent_id: AGENT_ID,
  openclaw_session_key: SESSION_KEY,
  openclaw_session_id: SESSION_ID,
  allowed_channel_ids: [CHANNEL_ID],
  allowed_source_pubkeys: [downDemoEvent.pubkey],
  allowed_read_only_tools: ["memory_search", "memory_get"],
  valid_from: "2026-07-31T12:00:00.000Z",
  valid_until: "2026-07-31T14:00:00.000Z",
  status: "active",
};

function transcript(options: { sessionId?: string; duplicatePrompt?: boolean; tool?: string } = {}): unknown[] {
  const user = {
    type: "message",
    id: "user-entry-1",
    timestamp: PROMPTED_AT,
    message: {
      role: "user",
      id: "user-message-1",
      sourceChannel: "acp",
      provenance: {
        kind: "external_user",
        originSessionId: "buzz-acp-origin-1",
        sourceChannel: "acp",
        sourceTool: "openclaw_acp",
      },
      __openclaw: { mirrorOrigin: "codex-app-server" },
      content: [
        "[Buzz event: @mention]",
        `Event ID: ${downDemoEvent.id}`,
        `Channel: response-return-synthetic (#${CHANNEL_ID})`,
        `Content: ${downDemoEvent.content}`,
      ].join("\n"),
    },
  };
  const entries: unknown[] = [
    { type: "session", id: options.sessionId ?? SESSION_ID },
    user,
  ];
  if (options.tool) {
    entries.push(
      {
        type: "message",
        id: "assistant-tool-entry",
        timestamp: "2026-07-31T13:00:00.400Z",
        message: {
          role: "assistant",
          stopReason: "toolUse",
          __openclaw: { mirrorOrigin: "codex-app-server" },
          content: [{ type: "toolCall", id: "call-1", name: options.tool }],
        },
      },
      {
        type: "message",
        id: "tool-result-entry",
        timestamp: "2026-07-31T13:00:00.600Z",
        message: {
          role: "toolResult",
          toolCallId: "call-1",
          isError: false,
          content: [{ type: "text", text: "sensitive result omitted by normalizer" }],
        },
      },
    );
  }
  entries.push({
    type: "message",
    id: "assistant-entry-1",
    timestamp: COMPLETED_AT,
    message: {
      role: "assistant",
      id: "assistant-message-1",
      idempotencyKey: "assistant-idempotency-1",
      provider: "openai-codex",
      model: "gpt-5.3-codex",
      stopReason: "stop",
      __openclaw: { mirrorOrigin: "codex-app-server" },
      content: [{ type: "text", text: workerDemoEvent.content }],
    },
  });
  if (options.duplicatePrompt) entries.push(structuredClone(user));
  return entries;
}

async function completedTurn(options: { tool?: string } = {}): Promise<CompletedOpenClawTurn> {
  const extracted = await extractCompletedOpenClawTurn({
    entries: transcript(options),
    source_event_id: downDemoEvent.id,
    channel_id: CHANNEL_ID,
    openclaw_agent_id: AGENT_ID,
    openclaw_session_key: SESSION_KEY,
    openclaw_session_id: SESSION_ID,
    transcript_evidence_ref: "transcript:synthetic-b2-response-return",
  });
  assert(extracted.status === "completed", "fixture transcript must complete");
  return extracted.turn;
}

async function returnRequest(options: { tool?: string } = {}): Promise<AcpResponseReturnRequest> {
  return {
    relay: RELAY,
    community_id: COMMUNITY_ID,
    source_event: structuredClone(downDemoEvent),
    turn: await completedTurn(options),
    returned_at: RETURNED_AT,
    proof_refs: ["proof:synthetic-b2-response-return"],
  };
}

class RecordingPublisher implements BuzzAcpResponsePublisher {
  readonly requests: BuzzAcpResponsePublishRequest[] = [];
  result: BuzzAcpResponsePublicationResult = {
    status: "accepted",
    event: structuredClone(workerDemoEvent),
    accepted_at: "2026-07-31T13:00:03.000Z",
    evidence_refs: ["relay:accepted", "signature:present"],
  };
  delay = false;

  async publish(request: BuzzAcpResponsePublishRequest): Promise<BuzzAcpResponsePublicationResult> {
    this.requests.push(structuredClone(request));
    if (this.delay) await new Promise<void>((resolve) => queueMicrotask(resolve));
    return structuredClone(this.result);
  }
}

function returner(
  publisher: BuzzAcpResponsePublisher,
  store = new InMemoryAcpResponseReturnStore(),
  logger?: MemoryAcpResponseReturnLogger,
): BuzzAcpResponseReturner {
  return new BuzzAcpResponseReturner({
    allowed_relays: [RELAY],
    allowed_community_ids: [COMMUNITY_ID],
    bindings: [binding],
    publisher,
    store,
    max_return_delay_seconds: 60,
    ...(logger ? { logger } : {}),
  });
}

test("extracts one completed ACP turn without retaining tool-result content", async () => {
  const result = await extractCompletedOpenClawTurn({
    entries: transcript({ tool: "memory_search" }),
    source_event_id: downDemoEvent.id,
    channel_id: CHANNEL_ID,
    openclaw_agent_id: AGENT_ID,
    openclaw_session_key: SESSION_KEY,
    openclaw_session_id: SESSION_ID,
    transcript_evidence_ref: "transcript:synthetic-b2-response-return",
  });
  assert(result.status === "completed", "transcript must complete");
  equal(result.turn.assistant_text, workerDemoEvent.content, "exact assistant text must survive");
  equal(result.turn.tools[0]?.name, "memory_search", "tool name must be normalized");
  equal(result.turn.tools[0]?.result, "ok", "tool result status must be retained");
  equal(
    JSON.stringify(result.turn).includes("sensitive result omitted"),
    false,
    "tool result content must not cross the boundary",
  );
});

test("rejects a foreign transcript session and ambiguous source turn", async () => {
  const foreign = await extractCompletedOpenClawTurn({
    entries: transcript({ sessionId: "foreign-session" }),
    source_event_id: downDemoEvent.id,
    channel_id: CHANNEL_ID,
    openclaw_agent_id: AGENT_ID,
    openclaw_session_key: SESSION_KEY,
    openclaw_session_id: SESSION_ID,
    transcript_evidence_ref: "transcript:foreign",
  });
  assert(foreign.status === "rejected", "foreign session must reject");
  equal(foreign.code, "session_mismatch", "session rejection must be explicit");

  const ambiguous = await extractCompletedOpenClawTurn({
    entries: transcript({ duplicatePrompt: true }),
    source_event_id: downDemoEvent.id,
    channel_id: CHANNEL_ID,
    openclaw_agent_id: AGENT_ID,
    openclaw_session_key: SESSION_KEY,
    openclaw_session_id: SESSION_ID,
    transcript_evidence_ref: "transcript:ambiguous",
  });
  assert(ambiguous.status === "rejected", "ambiguous source must reject");
  equal(ambiguous.code, "ambiguous_source_event", "ambiguity must be explicit");
});

test("publishes an exact signed reply with machine provenance", async () => {
  const publisher = new RecordingPublisher();
  const logger = new MemoryAcpResponseReturnLogger();
  const result = await returner(publisher, undefined, logger).returnResponse(await returnRequest());
  assert(result.status === "published", "valid response must publish");
  equal(publisher.requests.length, 1, "transport must be called once");
  const outbound = publisher.requests[0] as BuzzAcpResponsePublishRequest;
  equal(outbound.reply_to_event_id, downDemoEvent.id, "reply must bind source event");
  equal(outbound.expected_signer_pubkey, workerDemoEvent.pubkey, "signer must come from binding");
  equal(outbound.content, workerDemoEvent.content, "publisher receives exact assistant text");
  equal(outbound.provenance.execution_posture, "not_executed", "provenance must deny execution");
  equal(outbound.provenance.authority_transfer, "none", "provenance must deny authority transfer");
  equal(result.response.buzz_response_event_id, workerDemoEvent.id, "verified event must close response");
  equal(result.response.signature_verified, true, "signature verification must be recorded");
  equal(logger.entries[0]?.outcome, "published", "bounded log must record publication");
  equal("content" in logger.entries[0]!, false, "bounded log must not contain response content");
});

test("deduplicates sequential and fresh-instance replay", async () => {
  const publisher = new RecordingPublisher();
  const store = new InMemoryAcpResponseReturnStore();
  const firstInstance = returner(publisher, store);
  const request = await returnRequest();
  const first = await firstInstance.returnResponse(structuredClone(request));
  const second = await firstInstance.returnResponse(structuredClone(request));
  const restarted = await returner(publisher, store).returnResponse(structuredClone(request));
  assert(first.status === "published", "first response must publish");
  assert(second.status === "duplicate", "sequential replay must deduplicate");
  assert(restarted.status === "duplicate", "fresh-instance replay must deduplicate");
  equal(publisher.requests.length, 1, "all replay forms must produce one Buzz write");
  equal(store.size, 1, "one source event must have one closed response");
});

test("coalesces concurrent identical response returns", async () => {
  const publisher = new RecordingPublisher();
  publisher.delay = true;
  const instance = returner(publisher);
  const request = await returnRequest();
  const [left, right] = await Promise.all([
    instance.returnResponse(structuredClone(request)),
    instance.returnResponse(structuredClone(request)),
  ]);
  equal(publisher.requests.length, 1, "concurrent duplicates must publish once");
  assert(
    [left.status, right.status].includes("published") &&
      [left.status, right.status].includes("duplicate"),
    "concurrent callers must receive publication plus duplicate",
  );
});

test("rejects a conflicting second answer for a closed source event", async () => {
  const publisher = new RecordingPublisher();
  const instance = returner(publisher);
  const request = await returnRequest();
  const first = await instance.returnResponse(structuredClone(request));
  assert(first.status === "published", "first response must publish");
  request.turn.assistant_text = "conflicting second answer";
  request.turn.assistant_text_sha256 = await sha256Hex(request.turn.assistant_text);
  request.turn.assistant_message_id = "assistant-message-conflict";
  request.turn.assistant_idempotency_key = "assistant-idempotency-conflict";
  const conflict = await instance.returnResponse(request);
  assert(conflict.status === "rejected", "conflicting replay must reject");
  equal(conflict.rejection.code, "conflicting_replay", "conflict must be explicit");
  equal(publisher.requests.length, 1, "conflict must not reach transport");
});

test("fails closed on source signature and exact-session violations", async () => {
  const publisher = new RecordingPublisher();
  const instance = returner(publisher);
  const unsigned = await returnRequest();
  unsigned.source_event.sig = `0${unsigned.source_event.sig.slice(1)}`;
  const signature = await instance.returnResponse(unsigned);
  assert(signature.status === "rejected", "invalid source signature must reject");
  equal(signature.rejection.code, "source_signature_invalid", "signature code must be explicit");

  const foreign = await returnRequest();
  foreign.turn.openclaw_session_id = "foreign-session";
  const session = await instance.returnResponse(foreign);
  assert(session.status === "rejected", "foreign session must reject");
  equal(session.rejection.code, "binding_not_found", "foreign binding must not resolve");
  equal(publisher.requests.length, 0, "invalid provenance must not reach transport");
});

test("rejects unapproved tools and boundary mutations", async () => {
  const publisher = new RecordingPublisher();
  const instance = returner(publisher);
  const toolRequest = await returnRequest({ tool: "exec_command" });
  const tool = await instance.returnResponse(toolRequest);
  assert(tool.status === "rejected", "mutating tool must reject");
  equal(tool.rejection.code, "tool_boundary_violation", "tool boundary must be explicit");

  const executionRequest = await returnRequest();
  const mutated = executionRequest as unknown as { turn: { execution_posture: string } };
  mutated.turn.execution_posture = "executed";
  const execution = await instance.returnResponse(executionRequest);
  assert(execution.status === "rejected", "execution posture mutation must reject");
  equal(execution.rejection.code, "invalid_request", "invalid posture must fail at request boundary");
  equal(publisher.requests.length, 0, "boundary violations must not reach transport");
});

test("does not cache transport rejection and permits stable retry", async () => {
  const publisher = new RecordingPublisher();
  publisher.result = {
    status: "rejected",
    reason: "synthetic relay refusal",
    evidence_refs: ["relay:rejected"],
  };
  const store = new InMemoryAcpResponseReturnStore();
  const instance = returner(publisher, store);
  const request = await returnRequest();
  const rejected = await instance.returnResponse(structuredClone(request));
  assert(rejected.status === "rejected", "transport rejection must remain open");
  equal(rejected.rejection.code, "transport_rejected", "transport code must be explicit");
  equal(store.size, 0, "rejection must not close replay store");

  publisher.result = {
    status: "accepted",
    event: structuredClone(workerDemoEvent),
    accepted_at: "2026-07-31T13:00:04.000Z",
    evidence_refs: ["relay:accepted-on-retry"],
  };
  const retry = await instance.returnResponse(structuredClone(request));
  assert(retry.status === "published", "stable response must remain retryable");
  equal(publisher.requests.length, 2, "retry must call transport again");
});

test("rejects a returned event with wrong content, signer, thread, or signature", async () => {
  const mutations = [
    (event: typeof workerDemoEvent) => { event.content = "wrong content"; },
    (event: typeof workerDemoEvent) => { event.pubkey = downDemoEvent.pubkey; },
    (event: typeof workerDemoEvent) => { event.tags = event.tags.filter((tag) => tag[0] !== "e"); },
    (event: typeof workerDemoEvent) => { event.sig = `0${event.sig.slice(1)}`; },
  ];
  for (const mutate of mutations) {
    const publisher = new RecordingPublisher();
    const event = structuredClone(workerDemoEvent);
    mutate(event);
    publisher.result = {
      status: "accepted",
      event,
      accepted_at: "2026-07-31T13:00:03.000Z",
      evidence_refs: ["relay:accepted-malformed"],
    };
    const store = new InMemoryAcpResponseReturnStore();
    const result = await returner(publisher, store).returnResponse(await returnRequest());
    assert(result.status === "rejected", "invalid returned event must reject");
    equal(result.rejection.code, "returned_event_invalid", "event validation must be explicit");
    equal(store.size, 0, "invalid returned event must not close replay store");
  }
});

test("rejects stale completion and exposes no execution or approval methods", async () => {
  const publisher = new RecordingPublisher();
  const instance = returner(publisher);
  const stale = await returnRequest();
  stale.returned_at = "2026-07-31T13:10:00.000Z";
  const result = await instance.returnResponse(stale);
  assert(result.status === "rejected", "stale response must reject");
  equal(result.rejection.code, "stale_turn", "freshness rejection must be explicit");
  equal("execute" in instance, false, "returner must expose no execution method");
  equal("approve" in instance, false, "returner must expose no approval method");
  equal("ratify" in instance, false, "returner must expose no ratification method");
});

let failures = 0;
for (const entry of tests) {
  try {
    await entry.run();
    console.log(`ok - ${entry.name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${entry.name}`);
    console.error(error instanceof Error ? error.stack : String(error));
  }
}

if (failures > 0) throw new Error(`${failures} test(s) failed`);
console.log(`1..${tests.length}`);
console.log(`# ${tests.length} tests passed`);
