import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OperatorControlPlane } from "../src/operator-control.js";
import { BuzzRootDispatchQueue } from "../src/root-dispatch.js";
import type { RootDispatchBinding, RootDispatchEnvelope } from "../src/root-dispatch-types.js";

const EVENT = "ab".repeat(32);
const NOW = "2026-08-08T12:30:00.000Z";
const LATER = "2026-08-08T12:31:00.000Z";

const directory = mkdtempSync(join(tmpdir(), "buzz-operator-control-"));
const statePath = join(directory, "control.json");
const control = new OperatorControlPlane(statePath);

assert.equal(control.register(EVENT, "binding-down-engine-room", NOW).status, "applied");
assert.equal(control.register(EVENT, "binding-down-engine-room", NOW).status, "already_applied");
assert.equal(control.mayDispatch(EVENT), true);

const paused = control.transition(EVENT, "pause", "operator_hold", LATER, 1);
assert.equal(paused.status, "applied");
assert.equal(control.mayDispatch(EVENT), false);
assert.deepEqual(control.transition(EVENT, "retry", "unsafe_retry", LATER, 2), { status: "rejected", code: "invalid_transition" });
assert.deepEqual(control.transition(EVENT, "resume", "stale_operator", LATER, 1), { status: "rejected", code: "revision_conflict" });

assert.equal(control.transition(EVENT, "resume", "operator_resume", LATER, 2).status, "applied");
assert.equal(control.transition(EVENT, "mark_retryable", "gateway_unavailable", LATER, 3).status, "applied");
assert.equal(control.transition(EVENT, "retry", "dependency_recovered", LATER, 4).status, "applied");
assert.equal(control.transition(EVENT, "quarantine", "indeterminate_publication", LATER, 5).status, "applied");
assert.equal(control.transition(EVENT, "reconcile", "relay_receipt_verified", LATER, 6, "buzz-event:verified").status, "applied");
assert.equal(control.mayDispatch(EVENT), false);

const recovered = new OperatorControlPlane(statePath);
assert.equal(recovered.get(EVENT)?.disposition, "reconciled");
assert.equal(recovered.inspect().audit.length, 7);
assert(!readFileSync(statePath, "utf8").includes("buzz-event:verified"));
assert.deepEqual(recovered.transition(EVENT, "resume", "terminal_resume", LATER, 7), { status: "rejected", code: "invalid_transition" });

const key = "agent:down:buzz:operator-control";
const keyHash = "f1".repeat(32);
const binding: RootDispatchBinding = {
  binding_id: "binding-down-control", protocol_version: "0.1", relay: "wss://relay.example",
  community_id: "community", openclaw_agent_id: "down", openclaw_session_key: key,
  openclaw_session_key_sha256: keyHash, openclaw_session_id: "session-down",
  allowed_channel_ids: ["engine-room"], allowed_source_pubkeys: ["cd".repeat(32)],
  valid_from: NOW, valid_until: "2026-08-08T13:30:00.000Z", require_existing: true,
  reset_session: false, status: "active",
};
// Bind the fixture hash to the actual key while retaining an intentionally local test identity.
binding.openclaw_session_key_sha256 = (await import("node:crypto")).createHash("sha256").update(key).digest("hex");
const envelope: RootDispatchEnvelope = {
  protocol_version: "0.1", source_event_id: "ef".repeat(32), thread_root_event_id: "ef".repeat(32),
  source_pubkey: "cd".repeat(32), channel_id: "engine-room", binding_id: binding.binding_id,
  openclaw_agent_id: "down", openclaw_session_key_sha256: binding.openclaw_session_key_sha256,
  openclaw_session_id: "session-down", payload_digest: "de".repeat(32), role_request_id: null,
  received_at: NOW, not_before: NOW, expires_at: binding.valid_until,
  execution_posture: "not_executed", authority_transfer: "none",
};
const dispatchCalls: string[] = [];
const integrated = new OperatorControlPlane(join(directory, "integrated.json"));
integrated.register(envelope.source_event_id, binding.binding_id, NOW);
integrated.transition(envelope.source_event_id, "pause", "operator_hold", LATER, 1);
const queue = new BuzzRootDispatchQueue({
  bindings: [binding], operator_control: integrated,
  transport: { async dispatch(request) { dispatchCalls.push(request.envelope.source_event_id); return { status: "accepted", transport_ref: "turn", accepted_at: LATER, evidence_refs: [] }; } },
});
assert.equal(queue.enqueue(envelope, NOW).status, "queued");
const held = await queue.drain(binding.binding_id, LATER);
assert.deepEqual(held.operator_held_source_event_ids, [envelope.source_event_id]);
assert.equal(dispatchCalls.length, 0);
integrated.transition(envelope.source_event_id, "resume", "operator_resume", LATER, 2);
const released = await queue.drain(binding.binding_id, LATER);
assert.deepEqual(released.dispatched_source_event_ids, [envelope.source_event_id]);
assert.equal(dispatchCalls.length, 1);

const outcomeControl = new OperatorControlPlane(join(directory, "outcomes.json"));
const retryEnvelope = { ...envelope, source_event_id: "fa".repeat(32), thread_root_event_id: "fa".repeat(32) };
outcomeControl.register(retryEnvelope.source_event_id, binding.binding_id, NOW);
let retryTransportCalls = 0;
const retryQueue = new BuzzRootDispatchQueue({
  bindings: [binding], operator_control: outcomeControl, auto_retry_backoff_ms: 1_000, max_auto_transport_attempts: 3,
  transport: { async dispatch() { retryTransportCalls++; return retryTransportCalls === 1 ? { status: "retryable", code: "gateway_unavailable", detail: "offline", evidence_refs: [] } : { status: "accepted", transport_ref: "recovered-turn", accepted_at: "2026-08-08T12:32:00.000Z", evidence_refs: [] }; } },
});
retryQueue.enqueue(retryEnvelope, NOW);
await retryQueue.drain(binding.binding_id, LATER);
assert.equal(outcomeControl.get(retryEnvelope.source_event_id)?.disposition, "retryable");
assert.equal(outcomeControl.recordRetryable(retryEnvelope.source_event_id, "gateway_unavailable", LATER).status, "already_applied");
const autoRecovered = await retryQueue.drain(binding.binding_id, "2026-08-08T12:32:00.000Z");
assert.deepEqual(autoRecovered.dispatched_source_event_ids, [retryEnvelope.source_event_id]); assert.equal(retryTransportCalls, 2); assert.equal(outcomeControl.get(retryEnvelope.source_event_id)?.disposition, "active"); assert.equal(outcomeControl.inspect().audit.at(-1)?.action, "auto_retry");

const cappedControl = new OperatorControlPlane(join(directory, "capped.json")); const cappedEnvelope = { ...envelope, source_event_id: "fc".repeat(32), thread_root_event_id: "fc".repeat(32) }; cappedControl.register(cappedEnvelope.source_event_id, binding.binding_id, NOW); let cappedCalls = 0;
const cappedQueue = new BuzzRootDispatchQueue({ bindings: [binding], operator_control: cappedControl, max_auto_transport_attempts: 3, auto_retry_backoff_ms: 1_000, transport: { async dispatch() { cappedCalls++; return { status: "retryable", code: "relay_unavailable", detail: "offline", evidence_refs: [] }; } } });
cappedQueue.enqueue(cappedEnvelope, NOW); await cappedQueue.drain(binding.binding_id, LATER); await cappedQueue.drain(binding.binding_id, "2026-08-08T12:32:00.000Z"); await cappedQueue.drain(binding.binding_id, "2026-08-08T12:33:00.000Z"); const capped = await cappedQueue.drain(binding.binding_id, "2026-08-08T12:34:00.000Z");
assert.equal(cappedCalls, 3); assert.deepEqual(capped.operator_held_source_event_ids, [cappedEnvelope.source_event_id]); assert.equal(cappedControl.get(cappedEnvelope.source_event_id)?.disposition, "retryable");

const rejectedEnvelope = { ...envelope, source_event_id: "fb".repeat(32), thread_root_event_id: "fb".repeat(32) };
outcomeControl.register(rejectedEnvelope.source_event_id, binding.binding_id, NOW);
const rejectedQueue = new BuzzRootDispatchQueue({
  bindings: [binding], operator_control: outcomeControl,
  transport: { async dispatch() { return { status: "rejected", code: "transport_boundary", detail: "refused", evidence_refs: [] }; } },
});
rejectedQueue.enqueue(rejectedEnvelope, NOW);
await rejectedQueue.drain(binding.binding_id, LATER);
assert.equal(outcomeControl.get(rejectedEnvelope.source_event_id)?.disposition, "quarantined");

const reconciled = outcomeControl.recordReconciled(rejectedEnvelope.source_event_id, "relay_reply_verified", LATER, "buzz-event:reply-1");
assert.equal(reconciled.status, "applied");
assert.equal(outcomeControl.recordReconciled(rejectedEnvelope.source_event_id, "relay_reply_verified", LATER, "buzz-event:reply-1").status, "already_applied");

rmSync(directory, { recursive: true, force: true });
console.log("1..1");
console.log("# 1 operator-control test passed");
