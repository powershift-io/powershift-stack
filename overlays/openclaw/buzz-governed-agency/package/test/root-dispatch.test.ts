import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BuzzRootDispatchQueue,
  InMemoryRootDispatchStore,
  JsonFileRootDispatchStore,
} from "../src/root-dispatch.js";
import type {
  RootDispatchBinding,
  RootDispatchEnvelope,
  RootDispatchTransportRequest,
  RootDispatchTransportResult,
} from "../src/root-dispatch-types.js";

const NOW = "2026-07-31T19:00:00.000Z";
const LATER = "2026-07-31T19:05:00.000Z";
const VALID_UNTIL = "2026-08-01T00:00:00.000Z";
const sourcePubkey = "aa".repeat(32);
const sessionKey = "agent:down:buzz:b2-continuity-20260731";
const sessionKeySha256 = createHash("sha256").update(sessionKey, "utf8").digest("hex");

function binding(overrides: Partial<RootDispatchBinding> = {}): RootDispatchBinding {
  return {
    binding_id: "binding-down-b7",
    protocol_version: "0.1",
    relay: "ws://127.0.0.1:3000",
    community_id: "00000000-0000-4000-8000-0000000000b7",
    openclaw_agent_id: "down",
    openclaw_session_key: sessionKey,
    openclaw_session_key_sha256: sessionKeySha256,
    openclaw_session_id: "00000000-0000-4000-8000-000000000001",
    allowed_channel_ids: ["00000000-0000-4000-8000-0000000000c7"],
    allowed_source_pubkeys: [sourcePubkey],
    valid_from: "2026-07-31T18:00:00.000Z",
    valid_until: VALID_UNTIL,
    require_existing: true,
    reset_session: false,
    status: "active",
    ...overrides,
  };
}

function envelope(index: number, overrides: Partial<RootDispatchEnvelope> = {}): RootDispatchEnvelope {
  const source = index.toString(16).padStart(2, "0").repeat(32);
  return {
    protocol_version: "0.1",
    source_event_id: source,
    thread_root_event_id: source,
    source_pubkey: sourcePubkey,
    channel_id: "00000000-0000-4000-8000-0000000000c7",
    binding_id: "binding-down-b7",
    openclaw_agent_id: "down",
    openclaw_session_key_sha256: sessionKeySha256,
    openclaw_session_id: "00000000-0000-4000-8000-000000000001",
    payload_digest: (index + 32).toString(16).padStart(2, "0").repeat(32),
    role_request_id: null,
    received_at: new Date(Date.parse(NOW) + index * 1_000).toISOString(),
    not_before: NOW,
    expires_at: VALID_UNTIL,
    execution_posture: "not_executed",
    authority_transfer: "none",
    ...overrides,
  };
}

class ControlledTransport {
  readonly calls: RootDispatchTransportRequest[] = [];
  results: RootDispatchTransportResult[] = [];

  async dispatch(request: RootDispatchTransportRequest): Promise<RootDispatchTransportResult> {
    this.calls.push(structuredClone(request));
    return this.results.shift() ?? {
      status: "accepted",
      transport_ref: `acp-turn:${request.envelope.source_event_id}`,
      accepted_at: LATER,
      evidence_refs: ["acp:accepted"],
    };
  }
}

async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  await run();
  console.log(`ok - ${name}`);
}

await test("dispatches simultaneous roots as independent ordered ACP turns", async () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  assert.equal(queue.enqueue(envelope(1), NOW).status, "queued");
  assert.equal(queue.enqueue(envelope(2), NOW).status, "queued");
  const result = await queue.drain("binding-down-b7", LATER);
  assert.deepEqual(result.dispatched_source_event_ids, [envelope(1).source_event_id, envelope(2).source_event_id]);
  assert.equal(result.transport_calls, 2);
  assert.equal(result.response_closures, 0);
  assert.deepEqual(transport.calls.map((call) => call.envelope.source_event_id), result.dispatched_source_event_ids);
  assert(transport.calls.every((call) => call.dispatch_mode === "one_response_per_root"));
});

await test("deduplicates identical roots and rejects conflicting replays", () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  assert.equal(queue.enqueue(envelope(3), NOW).status, "queued");
  assert.equal(queue.enqueue(envelope(3), NOW).status, "duplicate");
  assert.deepEqual(queue.enqueue(envelope(3, { payload_digest: "ff".repeat(32) }), NOW), {
    status: "rejected",
    code: "conflicting_duplicate",
    consequence: "No ACP turn, response closure, execution, or authority transfer occurred.",
  });
});

await test("coalesces concurrent drains without duplicate transport", async () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  queue.enqueue(envelope(4), NOW);
  const [left, right] = await Promise.all([
    queue.drain("binding-down-b7", LATER),
    queue.drain("binding-down-b7", LATER),
  ]);
  assert.deepEqual(left, right);
  assert.equal(transport.calls.length, 1);
});

await test("relay outage leaves the exact root queued and closes no response", async () => {
  const transport = new ControlledTransport();
  transport.results.push({
    status: "retryable",
    code: "relay_unavailable",
    detail: "Connection refused.",
    evidence_refs: ["relay:closed-port"],
  });
  const store = new InMemoryRootDispatchStore();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport, store });
  queue.enqueue(envelope(5), NOW);
  const first = await queue.drain("binding-down-b7", LATER);
  assert.equal(first.status, "paused");
  assert.equal(first.response_closures, 0);
  assert.equal(store.get(envelope(5).source_event_id)?.state, "queued");
  const recovered = await queue.drain("binding-down-b7", "2026-07-31T19:06:00.000Z");
  assert.equal(recovered.status, "drained");
  assert.equal(transport.calls.length, 2);
  assert.equal(store.get(envelope(5).source_event_id)?.state, "dispatched");
});

await test("gateway restart resumes from a durable store without creating a session", async () => {
  const transport = new ControlledTransport();
  transport.results.push({
    status: "retryable",
    code: "gateway_unavailable",
    detail: "Gateway restarting.",
    evidence_refs: ["gateway:restart-window"],
  });
  const directory = mkdtempSync(join(tmpdir(), "buzz-root-dispatch-"));
  const statePath = join(directory, "queue.json");
  const store = new JsonFileRootDispatchStore(statePath, NOW);
  const before = new BuzzRootDispatchQueue({ bindings: [binding()], transport, store });
  before.enqueue(envelope(6), NOW);
  await before.drain("binding-down-b7", LATER);
  const recoveredStore = new JsonFileRootDispatchStore(statePath, "2026-07-31T19:06:00.000Z");
  const after = new BuzzRootDispatchQueue({ bindings: [binding()], transport, store: recoveredStore });
  const result = await after.drain("binding-down-b7", "2026-07-31T19:06:00.000Z");
  assert.equal(result.dispatched_source_event_ids.length, 1);
  assert.equal(transport.calls[1]?.binding.require_existing, true);
  assert.equal(transport.calls[1]?.binding.reset_session, false);
  const exported = readFileSync(statePath, "utf8");
  assert(!exported.includes(sessionKey));
  assert(!exported.includes("Gateway restarting."));
  assert(!exported.includes("acp-turn:"));
  assert(exported.includes(sessionKeySha256));
  rmSync(directory, { recursive: true, force: true });
});

await test("Buzz restart preserves queued state and root identity on disk", async () => {
  const transport = new ControlledTransport();
  const directory = mkdtempSync(join(tmpdir(), "buzz-root-restart-"));
  const statePath = join(directory, "queue.json");
  const store = new JsonFileRootDispatchStore(statePath, NOW);
  const first = new BuzzRootDispatchQueue({ bindings: [binding()], transport, store });
  first.enqueue(envelope(7, { not_before: "2026-07-31T19:07:00.000Z" }), NOW);
  const before = await first.drain("binding-down-b7", LATER);
  assert.equal(before.remaining_queued_source_event_ids.length, 1);
  const restarted = new BuzzRootDispatchQueue({
    bindings: [binding()],
    transport,
    store: new JsonFileRootDispatchStore(statePath, "2026-07-31T19:08:00.000Z"),
  });
  const after = await restarted.drain("binding-down-b7", "2026-07-31T19:08:00.000Z");
  assert.deepEqual(after.dispatched_source_event_ids, [envelope(7).source_event_id]);
  const finalState = readFileSync(statePath, "utf8");
  assert(!finalState.includes(sessionKey));
  assert(!finalState.includes("acp-turn:"));
  rmSync(directory, { recursive: true, force: true });
});

await test("revoked identity blocks before transport", () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding({ status: "revoked" })], transport });
  assert.equal(queue.enqueue(envelope(8), NOW).status, "rejected");
  assert.equal(transport.calls.length, 0);
});

await test("stale session key cannot redirect an existing-session binding", () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  const result = queue.enqueue(envelope(9, { openclaw_session_key_sha256: "ff".repeat(32) }), NOW);
  assert.equal(result.status, "rejected");
  if (result.status === "rejected") assert.equal(result.code, "session_mismatch");
});

await test("delayed messages wait until not-before and preserve order", async () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  queue.enqueue(envelope(10, { not_before: "2026-07-31T19:07:00.000Z" }), NOW);
  const early = await queue.drain("binding-down-b7", LATER);
  assert.equal(early.transport_calls, 0);
  const ready = await queue.drain("binding-down-b7", "2026-07-31T19:07:00.000Z");
  assert.equal(ready.transport_calls, 1);
});

await test("expired delayed messages block with no false closure", async () => {
  const transport = new ControlledTransport();
  const store = new InMemoryRootDispatchStore();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport, store });
  queue.enqueue(envelope(11, { expires_at: "2026-07-31T19:01:00.000Z" }), NOW);
  const result = await queue.drain("binding-down-b7", LATER);
  assert.deepEqual(result.blocked_source_event_ids, [envelope(11).source_event_id]);
  assert.equal(result.response_closures, 0);
  assert.equal(transport.calls.length, 0);
});

await test("protocol version mismatch fails before Mind traffic", () => {
  const transport = new ControlledTransport();
  const incompatible = { ...envelope(12), protocol_version: "0.2" };
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  const result = queue.enqueue(incompatible, NOW);
  assert.equal(result.status, "rejected");
  if (result.status === "rejected") assert.equal(result.code, "version_mismatch");
  assert.equal(transport.calls.length, 0);
});

await test("unknown binding cannot silently create a session", () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  const result = queue.enqueue(envelope(13, { binding_id: "binding-unknown" }), NOW);
  assert.equal(result.status, "rejected");
  assert.equal(transport.calls.length, 0);
});

await test("concurrent role requests remain separate root turns", async () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  queue.enqueue(envelope(14, { role_request_id: "platform-circle-lead" }), NOW);
  queue.enqueue(envelope(15, { role_request_id: "platform-observer" }), NOW);
  const result = await queue.drain("binding-down-b7", LATER);
  assert.equal(result.transport_calls, 2);
  assert.deepEqual(transport.calls.map((call) => call.envelope.role_request_id), [
    "platform-circle-lead",
    "platform-observer",
  ]);
});

await test("a reset-capable binding is rejected by the exact-session boundary", () => {
  const transport = new ControlledTransport();
  const unsafe = { ...binding(), require_existing: false, reset_session: true } as unknown as RootDispatchBinding;
  const queue = new BuzzRootDispatchQueue({ bindings: [unsafe], transport });
  const result = queue.enqueue(envelope(16), NOW);
  assert.equal(result.status, "rejected");
  if (result.status === "rejected") assert.equal(result.code, "session_mismatch");
});

await test("rejects non-root events and impossible timing before queue state", () => {
  const transport = new ControlledTransport();
  const queue = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  assert.equal(
    queue.enqueue(envelope(17, { thread_root_event_id: "fe".repeat(32) }), NOW).status,
    "rejected",
  );
  assert.equal(
    queue.enqueue(envelope(18, { not_before: VALID_UNTIL, expires_at: NOW }), NOW).status,
    "rejected",
  );
  assert.equal(
    queue.enqueue({ ...envelope(19), assistant_text: "must never enter durable state" }, NOW).status,
    "rejected",
  );
  assert.equal(transport.calls.length, 0);

  const directory = mkdtempSync(join(tmpdir(), "buzz-root-malformed-"));
  const statePath = join(directory, "queue.json");
  const isolated = new BuzzRootDispatchQueue({ bindings: [binding()], transport });
  const queued = isolated.enqueue(envelope(20), NOW);
  assert.equal(queued.status, "queued");
  if (queued.status !== "queued") throw new Error("expected queued fixture");
  writeFileSync(statePath, JSON.stringify({
    version: "0.1",
    records: [{ ...queued.record, assistant_text: "must fail closed on reload" }],
  }));
  assert.throws(() => new JsonFileRootDispatchStore(statePath, NOW), /Malformed root-dispatch record/);
  rmSync(directory, { recursive: true, force: true });
});

console.log("1..15");
console.log("# 15 tests passed");
