import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OperatorControlPlane } from "../src/operator-control.js";
import { DurableOperatorSupervisor } from "../src/operator-supervisor.js";
import { BuzzRootDispatchQueue, JsonFileRootDispatchStore } from "../src/root-dispatch.js";
import type { RootDispatchBinding, RootDispatchEnvelope, RootDispatchFileState } from "../src/root-dispatch-types.js";

const total = 24; const startMs = Date.parse("2026-08-08T14:00:00.000Z"); const key = "agent:down:buzz:soak";
const binding: RootDispatchBinding = { binding_id: "down", protocol_version: "0.1", relay: "wss://relay", community_id: "community", openclaw_agent_id: "down", openclaw_session_key: key, openclaw_session_key_sha256: createHash("sha256").update(key).digest("hex"), openclaw_session_id: "existing", allowed_channel_ids: ["engine"], allowed_source_pubkeys: ["aa".repeat(32)], valid_from: new Date(startMs).toISOString(), valid_until: new Date(startMs + 86_400_000).toISOString(), require_existing: true, reset_session: false, status: "active" };
const ids = Array.from({ length: total }, (_, index) => (index + 1).toString(16).padStart(64, "0"));
const envelope = (id: string, index: number): RootDispatchEnvelope => ({ protocol_version: "0.1", source_event_id: id, thread_root_event_id: id, source_pubkey: "aa".repeat(32), channel_id: "engine", binding_id: "down", openclaw_agent_id: "down", openclaw_session_key_sha256: binding.openclaw_session_key_sha256, openclaw_session_id: "existing", payload_digest: createHash("sha256").update(id).digest("hex"), role_request_id: null, received_at: new Date(startMs + index).toISOString(), not_before: new Date(startMs).toISOString(), expires_at: binding.valid_until, execution_posture: "not_executed", authority_transfer: "none" });
const dir = mkdtempSync(join(tmpdir(), "buzz-soak-")); const controlPath = join(dir, "control.json"); const queuePath = join(dir, "queue.json");
const transportCalls = new Map<string, number>(); const completionCalls = new Map<string, number>(); let cycleAt = new Date(startMs).toISOString();
const build = () => { const control = new OperatorControlPlane(controlPath); const store = new JsonFileRootDispatchStore(queuePath, cycleAt); const queue = new BuzzRootDispatchQueue({ bindings: [binding], operator_control: control, store, auto_retry_backoff_ms: 1_000, max_auto_transport_attempts: 3, transport: { async dispatch(request) { const id = request.envelope.source_event_id; const calls = (transportCalls.get(id) ?? 0) + 1; transportCalls.set(id, calls); const index = ids.indexOf(id); if (index % 5 === 0 && calls === 1) return { status: "retryable", code: "gateway_unavailable", detail: "synthetic outage", evidence_refs: [] }; return { status: "accepted", transport_ref: `turn:${id}`, accepted_at: cycleAt, evidence_refs: [] }; } } }); const supervisor = new DurableOperatorSupervisor({ queue, control, completion: { async reconcile(id) { const calls = (completionCalls.get(id) ?? 0) + 1; completionCalls.set(id, calls); const index = ids.indexOf(id); if (index % 7 === 0 && calls === 1) return { status: "retryable", code: "provider_unavailable", observed_at: cycleAt }; return { status: "verified", proof_ref: `reply:${id}`, verified_at: cycleAt }; } } }); return { control, supervisor }; };

const initial = build(); ids.forEach((id, index) => assert.equal(initial.supervisor.accept(envelope(id, index), cycleAt).status, "queued"));
const raw = JSON.parse(readFileSync(queuePath, "utf8")) as RootDispatchFileState; raw.records[0]!.state = "dispatching"; raw.records[0]!.dispatch_started_at = cycleAt; writeFileSync(queuePath, `${JSON.stringify(raw, null, 2)}\n`);
let cycles = 0;
while (cycles < 64) { cycleAt = new Date(startMs + (cycles + 1) * 60_000).toISOString(); const runtime = build(); await runtime.supervisor.cycle("down", cycleAt); cycles++; if (runtime.control.inspect().records.every((record) => record.disposition === "reconciled")) break; }
const final = build(); assert.equal(final.control.inspect().records.filter((record) => record.disposition === "reconciled").length, total); assert(cycles < 64);
ids.forEach((id, index) => { assert.equal(transportCalls.get(id), index % 5 === 0 ? 2 : 1); assert.equal(completionCalls.get(id), index % 7 === 0 ? 2 : 1); assert.equal(final.supervisor.accept(envelope(id, index), cycleAt).status, "duplicate"); });
const before = [Array.from(transportCalls.values()).reduce((a, b) => a + b, 0), Array.from(completionCalls.values()).reduce((a, b) => a + b, 0)]; await final.supervisor.cycle("down", cycleAt); const after = [Array.from(transportCalls.values()).reduce((a, b) => a + b, 0), Array.from(completionCalls.values()).reduce((a, b) => a + b, 0)]; assert.deepEqual(after, before);
rmSync(dir, { recursive: true, force: true }); console.log("1..1\n# 1 accelerated multi-root restart/stale-claim soak passed");
