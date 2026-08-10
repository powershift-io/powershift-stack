import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { OperatorAuditEntry } from "./operator-control-types.js";
import type { OperatorControlPlane } from "./operator-control.js";
import type { ReconciledTelemetrySink } from "./operator-supervisor.js";
import type { RootDispatchRecord, RootDispatchStore } from "./root-dispatch-types.js";
import type { Hex } from "./types.js";

const HEX_32 = /^[0-9a-f]{64}$/;
const SAFE = /^[a-z0-9][a-z0-9._:/-]{0,255}$/i;
const sha256 = (value: string): Hex => createHash("sha256").update(value, "utf8").digest("hex") as Hex;
const timestamp = (value: string): boolean => Number.isFinite(Date.parse(value));
const integer = (value: number | null): boolean => value === null || (Number.isSafeInteger(value) && value >= 0);
const number = (value: number | null): boolean => value === null || (Number.isFinite(value) && value >= 0);

export interface TurnOperationalTelemetry {
  source_event_id: Hex; binding_id: string; openclaw_session_id_sha256: Hex; provider: string; model: string;
  started_at: string; completed_at: string; published_at: string | null;
  input_tokens: number | null; output_tokens: number | null; cache_read_tokens: number | null; cache_write_tokens: number | null;
  quota_remaining: number | null; estimated_cost_usd: number | null;
  queue_latency_ms: number; provider_latency_ms: number; publication_latency_ms: number | null;
  retry_count: number; queue_depth_at_claim: number; operator_interventions: number;
  terminal_state: "reconciled" | "retryable" | "quarantined" | "dead_letter"; proof_ref_sha256: Hex;
}
interface TelemetryState { version: "0.1"; records: TurnOperationalTelemetry[]; }
export type TelemetryWriteResult = { status: "recorded" | "already_recorded"; record: TurnOperationalTelemetry } | { status: "rejected"; code: "invalid_record" | "conflicting_record" };

function valid(record: TurnOperationalTelemetry): boolean {
  return Boolean(HEX_32.test(record.source_event_id) && SAFE.test(record.binding_id) && HEX_32.test(record.openclaw_session_id_sha256) && SAFE.test(record.provider) && SAFE.test(record.model) && timestamp(record.started_at) && timestamp(record.completed_at) && Date.parse(record.completed_at) >= Date.parse(record.started_at) && (record.published_at === null || timestamp(record.published_at)) && integer(record.input_tokens) && integer(record.output_tokens) && integer(record.cache_read_tokens) && integer(record.cache_write_tokens) && number(record.quota_remaining) && number(record.estimated_cost_usd) && integer(record.queue_latency_ms) && integer(record.provider_latency_ms) && integer(record.publication_latency_ms) && integer(record.retry_count) && integer(record.queue_depth_at_claim) && integer(record.operator_interventions) && ["reconciled", "retryable", "quarantined", "dead_letter"].includes(record.terminal_state) && HEX_32.test(record.proof_ref_sha256));
}

export function turnTelemetry(input: Omit<TurnOperationalTelemetry, "openclaw_session_id_sha256" | "proof_ref_sha256"> & { openclaw_session_id: string; proof_ref: string }): TurnOperationalTelemetry {
  const { openclaw_session_id, proof_ref, ...record } = input;
  return { ...record, openclaw_session_id_sha256: sha256(openclaw_session_id), proof_ref_sha256: sha256(proof_ref) };
}

export interface CompletionMetricEvidence {
  openclaw_session_id: string; provider: string; model: string; completed_at: string;
  input_tokens?: number; output_tokens?: number; cache_read_tokens?: number; cache_write_tokens?: number;
  quota_remaining?: number; estimated_cost_usd?: number;
}
export interface PublicationMetricEvidence {
  published_at: string | null; proof_ref: string; terminal_state: TurnOperationalTelemetry["terminal_state"];
}

export function composeTurnTelemetry(input: { dispatch: RootDispatchRecord; queue_depth_at_claim: number; completion: CompletionMetricEvidence; publication: PublicationMetricEvidence; operator_audit: OperatorAuditEntry[] }): TurnOperationalTelemetry {
  const startedAt = input.dispatch.dispatch_started_at;
  if (!startedAt || !timestamp(startedAt) || !timestamp(input.completion.completed_at)) throw new Error("Incomplete telemetry lifecycle evidence.");
  const queueLatency = Date.parse(startedAt) - Date.parse(input.dispatch.enqueued_at);
  const providerLatency = Date.parse(input.completion.completed_at) - Date.parse(startedAt);
  const publicationLatency = input.publication.published_at === null ? null : Date.parse(input.publication.published_at) - Date.parse(input.completion.completed_at);
  if (queueLatency < 0 || providerLatency < 0 || (publicationLatency !== null && publicationLatency < 0)) throw new Error("Non-monotonic telemetry lifecycle evidence.");
  const interventionActions = new Set(["pause", "resume", "cancel", "retry", "dead_letter"]);
  return turnTelemetry({ source_event_id: input.dispatch.envelope.source_event_id, binding_id: input.dispatch.envelope.binding_id, openclaw_session_id: input.completion.openclaw_session_id, provider: input.completion.provider, model: input.completion.model, started_at: startedAt, completed_at: input.completion.completed_at, published_at: input.publication.published_at, input_tokens: input.completion.input_tokens ?? null, output_tokens: input.completion.output_tokens ?? null, cache_read_tokens: input.completion.cache_read_tokens ?? null, cache_write_tokens: input.completion.cache_write_tokens ?? null, quota_remaining: input.completion.quota_remaining ?? null, estimated_cost_usd: input.completion.estimated_cost_usd ?? null, queue_latency_ms: queueLatency, provider_latency_ms: providerLatency, publication_latency_ms: publicationLatency, retry_count: Math.max(0, input.dispatch.attempts - 1), queue_depth_at_claim: input.queue_depth_at_claim, operator_interventions: input.operator_audit.filter((entry) => entry.source_event_id === input.dispatch.envelope.source_event_id && interventionActions.has(entry.action)).length, terminal_state: input.publication.terminal_state, proof_ref: input.publication.proof_ref });
}

export class OperationalTelemetryLedger {
  readonly #filePath: string; readonly #records = new Map<Hex, TurnOperationalTelemetry>();
  constructor(filePath: string) {
    if (!filePath || filePath.length > 4_096) throw new Error("A bounded telemetry path is required."); this.#filePath = filePath;
    if (!existsSync(filePath)) return;
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<TelemetryState>;
    if (parsed.version !== "0.1" || !Array.isArray(parsed.records)) throw new Error("Malformed telemetry ledger.");
    for (const record of parsed.records) { if (!valid(record) || this.#records.has(record.source_event_id)) throw new Error("Malformed telemetry record."); this.#records.set(record.source_event_id, structuredClone(record)); }
  }
  record(record: TurnOperationalTelemetry): TelemetryWriteResult {
    if (!valid(record)) return { status: "rejected", code: "invalid_record" };
    const existing = this.#records.get(record.source_event_id);
    if (existing) return JSON.stringify(existing) === JSON.stringify(record) ? { status: "already_recorded", record: structuredClone(existing) } : { status: "rejected", code: "conflicting_record" };
    this.#records.set(record.source_event_id, structuredClone(record)); this.#persist(); return { status: "recorded", record: structuredClone(record) };
  }
  inspect(): TurnOperationalTelemetry[] { return Array.from(this.#records.values(), (record) => structuredClone(record)); }
  #persist(): void {
    mkdirSync(dirname(this.#filePath), { recursive: true, mode: 0o700 }); const temporary = `${this.#filePath}.tmp`;
    writeFileSync(temporary, `${JSON.stringify({ version: "0.1", records: this.inspect() } satisfies TelemetryState, null, 2)}\n`, { mode: 0o600 }); chmodSync(temporary, 0o600); renameSync(temporary, this.#filePath); chmodSync(this.#filePath, 0o600);
  }
}

export interface CompletionMetricReader { read(sourceEventId: Hex): Promise<CompletionMetricEvidence | null>; }
export class SupervisorTelemetryIntegrator implements ReconciledTelemetrySink {
  readonly #dispatch: RootDispatchStore; readonly #control: OperatorControlPlane; readonly #completion: CompletionMetricReader; readonly #ledger: OperationalTelemetryLedger;
  constructor(input: { dispatch: RootDispatchStore; control: OperatorControlPlane; completion: CompletionMetricReader; ledger: OperationalTelemetryLedger }) { this.#dispatch = input.dispatch; this.#control = input.control; this.#completion = input.completion; this.#ledger = input.ledger; }
  async recordReconciled(sourceEventId: Hex, result: { status: "verified"; proof_ref: string; verified_at: string }): Promise<void> {
    const dispatch = this.#dispatch.get(sourceEventId); const completion = await this.#completion.read(sourceEventId);
    if (!dispatch || !completion) throw new Error("Telemetry evidence unavailable for reconciled turn.");
    const depthRefs = dispatch.evidence_refs.filter((ref) => /^queue-depth-at-claim:\d+$/.test(ref)); const depth = Number(depthRefs.at(-1)?.split(":").at(-1));
    if (!Number.isSafeInteger(depth) || depth < 1) throw new Error("Claim-time queue depth evidence unavailable.");
    const telemetry = composeTurnTelemetry({ dispatch, queue_depth_at_claim: depth, completion, publication: { published_at: result.verified_at, proof_ref: result.proof_ref, terminal_state: "reconciled" }, operator_audit: this.#control.inspect().audit });
    const written = this.#ledger.record(telemetry); if (written.status === "rejected") throw new Error(`Telemetry write rejected: ${written.code}`);
  }
}
