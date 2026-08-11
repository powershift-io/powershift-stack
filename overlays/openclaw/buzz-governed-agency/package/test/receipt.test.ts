import {
  BuzzReadOnlyAdapter,
  BuzzReceiptReturner,
  InMemoryReceiptReturnStore,
  MemoryReceiptReturnLogger,
  SyntheticAuthorityEvaluator,
  sha256Hex,
  type BuzzPublicationResult,
  type BuzzReceiptPublishRequest,
  type BuzzReceiptPublisher,
  type ReceiptReturnRequest,
} from "../src/index.js";
import {
  authoritySnapshot,
  blockAction,
  escalateAction,
  proposeAction,
  ratifyAction,
  readAction,
} from "./authority-fixtures.js";
import {
  COMMUNITY_ID,
  RELAY,
  downBinding,
  envelope,
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
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

class RecordingPublisher implements BuzzReceiptPublisher {
  readonly requests: BuzzReceiptPublishRequest[] = [];
  result: BuzzPublicationResult = {
    status: "accepted",
    event_id: "a".repeat(64),
    accepted_at: "2026-07-31T11:00:01.000Z",
    evidence_refs: ["relay-ok:true", `relay:${RELAY}`],
  };
  delay = false;

  async publish(request: BuzzReceiptPublishRequest): Promise<BuzzPublicationResult> {
    this.requests.push(structuredClone(request));
    if (this.delay) await new Promise<void>((resolve) => queueMicrotask(resolve));
    return structuredClone(this.result);
  }
}

async function returnRequest(
  action = readAction,
): Promise<ReceiptReturnRequest> {
  const intake = await new BuzzReadOnlyAdapter({
    allowed_relays: [RELAY],
    allowed_community_ids: [COMMUNITY_ID],
    allowed_authority_source_refs: [authoritySnapshot.snapshot_id],
    bindings: [downBinding],
  }).ingest(envelope());
  assert(intake.status === "accepted", "fixture intake must be accepted");
  const evaluated = await new SyntheticAuthorityEvaluator({
    snapshots: [authoritySnapshot],
  }).evaluate({
    tension_packet: intake.packet,
    action_intent: structuredClone(action),
    authority_snapshot_ref: authoritySnapshot.snapshot_id,
    evaluated_at: "2026-07-29T16:30:00.000Z",
  });
  assert(evaluated.status === "evaluated", "fixture authority must evaluate");
  return {
    tension_packet: intake.packet,
    authority_packet: evaluated.packet,
    non_execution: {
      posture: "not_executed",
      verified_at: "2026-07-31T11:00:00.000Z",
      tool_invocations: 0,
      evidence_refs: ["executor:absent", "tool-invocations:0"],
      detail: "The Phase 5 return path has no execution capability.",
    },
    returned_at: "2026-07-31T11:00:00.000Z",
    proof_refs: ["proof:phase-5-test"],
  };
}

function returner(
  publisher: BuzzReceiptPublisher,
  store = new InMemoryReceiptReturnStore(),
  logger?: MemoryReceiptReturnLogger,
): BuzzReceiptReturner {
  return new BuzzReceiptReturner({
    allowed_relays: [RELAY],
    allowed_community_ids: [COMMUNITY_ID],
    publisher,
    store,
    ...(logger ? { logger } : {}),
  });
}

test("returns an evidence-bound non-execution receipt to the source thread", async () => {
  const publisher = new RecordingPublisher();
  const logger = new MemoryReceiptReturnLogger();
  const result = await returner(publisher, undefined, logger).returnReceipt(
    await returnRequest(),
  );
  assert(result.status === "published", "receipt must publish");
  equal(publisher.requests.length, 1, "publisher must be called once");
  const outbound = publisher.requests[0]!;
  equal(outbound.relay, RELAY, "relay must remain exact");
  equal(outbound.community_id, COMMUNITY_ID, "community must remain exact");
  equal(
    outbound.reply_to_event_id,
    result.receipt.source_event_id,
    "receipt must reply to the originating source event",
  );
  assert(
    outbound.content.includes("Consequence: not executed"),
    "human receipt must state non-execution",
  );
  assert(
    !outbound.content.includes("Action completed"),
    "human receipt must not claim completion",
  );
  equal(result.receipt.lifecycle.acted.status, "not_executed", "acted must be explicit");
  equal(
    result.receipt.lifecycle.verified.consequence,
    "verified_non_execution",
    "verification must bind the negative consequence",
  );
  equal(
    result.receipt.lifecycle.closed.basis,
    "relay_acceptance_and_verified_non_execution",
    "closure must require relay and consequence proof",
  );
  equal(logger.entries[0]?.outcome, "published", "bounded log must record outcome");
  equal("content" in logger.entries[0]!, false, "log must not contain message content");
});

test("publishes a stable receipt only once across sequential duplicates", async () => {
  const publisher = new RecordingPublisher();
  const store = new InMemoryReceiptReturnStore();
  const instance = returner(publisher, store);
  const request = await returnRequest();
  const first = await instance.returnReceipt(structuredClone(request));
  const second = await instance.returnReceipt(structuredClone(request));
  assert(first.status === "published", "first return must publish");
  assert(second.status === "duplicate", "second return must deduplicate");
  equal(publisher.requests.length, 1, "duplicate must not call transport");
  equal(second.receipt.receipt_id, first.receipt.receipt_id, "receipt ID must remain stable");
  equal(
    second.receipt.buzz_return_event_id,
    first.receipt.buzz_return_event_id,
    "duplicate must preserve original Buzz event",
  );
  equal(store.size, 1, "store must contain one closed receipt");
});

test("coalesces concurrent duplicate publication", async () => {
  const publisher = new RecordingPublisher();
  publisher.delay = true;
  const instance = returner(publisher);
  const request = await returnRequest();
  const [left, right] = await Promise.all([
    instance.returnReceipt(structuredClone(request)),
    instance.returnReceipt(structuredClone(request)),
  ]);
  equal(publisher.requests.length, 1, "concurrent duplicates must publish once");
  assert(
    [left.status, right.status].includes("published") &&
      [left.status, right.status].includes("duplicate"),
    "concurrent callers must receive one publication and one duplicate result",
  );
});

test("does not close or cache a relay-rejected publication", async () => {
  const publisher = new RecordingPublisher();
  publisher.result = {
    status: "rejected",
    reason: "synthetic relay rejection",
    evidence_refs: ["relay-ok:false"],
  };
  const store = new InMemoryReceiptReturnStore();
  const instance = returner(publisher, store);
  const request = await returnRequest();
  const rejected = await instance.returnReceipt(structuredClone(request));
  assert(rejected.status === "rejected", "relay rejection must remain rejected");
  equal(rejected.rejection.code, "transport_rejected", "transport result must be explicit");
  equal(store.size, 0, "rejected receipt must not be cached as closed");

  publisher.result = {
    status: "accepted",
    event_id: "b".repeat(64),
    accepted_at: "2026-07-31T11:00:02.000Z",
    evidence_refs: ["relay-ok:true"],
  };
  const retry = await instance.returnReceipt(structuredClone(request));
  assert(retry.status === "published", "same stable receipt must be retryable");
  equal(publisher.requests.length, 2, "retry must call transport again");
});

test("fails closed for packet mutation and incomplete non-execution proof", async () => {
  const publisher = new RecordingPublisher();
  const instance = returner(publisher);

  const mismatched = await returnRequest();
  mismatched.authority_packet.tension_packet_id = "tp_foreign";
  const linkage = await instance.returnReceipt(mismatched);
  assert(linkage.status === "rejected", "foreign packet linkage must reject");
  equal(linkage.rejection.code, "packet_linkage_mismatch", "linkage code must be explicit");

  const mutated = await returnRequest();
  mutated.authority_packet.action_intent.resource = "fixture:BETA";
  const digest = await instance.returnReceipt(mutated);
  assert(digest.status === "rejected", "changed action must reject");
  equal(digest.rejection.code, "action_digest_mismatch", "digest code must be explicit");

  const unproven = await returnRequest();
  unproven.non_execution.evidence_refs = ["tool-invocations:0"];
  const proof = await instance.returnReceipt(unproven);
  assert(proof.status === "rejected", "incomplete non-execution proof must reject");
  equal(
    proof.rejection.code,
    "missing_non_execution_evidence",
    "negative-evidence code must be explicit",
  );
  equal(publisher.requests.length, 0, "invalid receipts must never reach transport");
});

test("returns every governed decision without converting it into execution", async () => {
  for (const action of [
    readAction,
    proposeAction,
    escalateAction,
    blockAction,
    ratifyAction,
  ]) {
    const publisher = new RecordingPublisher();
    publisher.result = {
      status: "accepted",
      event_id: await sha256Hex(action.intent_id),
      accepted_at: "2026-07-31T11:00:01.000Z",
      evidence_refs: ["relay-ok:true"],
    };
    const result = await returner(publisher).returnReceipt(
      await returnRequest(action),
    );
    assert(result.status === "published", `${action.intent_id} must publish`);
    equal(result.receipt.consequence, "not_executed", "all outcomes remain non-executing");
    equal(
      result.receipt.lifecycle.acted.tool_invocations,
      0,
      "all outcomes must retain zero tool invocations",
    );
    assert(
      publisher.requests[0]!.content.includes(
        `PowerShift decision: ${result.receipt.decision.toUpperCase()}`,
      ),
      "human receipt must carry the exact decision",
    );
  }
});

test("exposes receipt return without execution, approval, or ratification methods", () => {
  const instance = returner(new RecordingPublisher());
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
