import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  OperatorAuditEntry,
  OperatorControlAction,
  OperatorControlFileState,
  OperatorControlRecord,
  OperatorDisposition,
  OperatorTransitionResult,
} from "./operator-control-types.js";
import type { Hex } from "./types.js";

const HEX_32 = /^[0-9a-f]{64}$/;
const SAFE_CODE = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const transitions: Record<OperatorDisposition, Partial<Record<OperatorControlAction, OperatorDisposition>>> = {
  active: { pause: "paused", cancel: "cancelled", mark_retryable: "retryable", quarantine: "quarantined", dead_letter: "dead_letter", reconcile: "reconciled" },
  paused: { resume: "active", cancel: "cancelled", quarantine: "quarantined", dead_letter: "dead_letter", reconcile: "reconciled" },
  cancelled: { reconcile: "reconciled" },
  retryable: { retry: "active", auto_retry: "active", cancel: "cancelled", quarantine: "quarantined", dead_letter: "dead_letter", reconcile: "reconciled" },
  quarantined: { retry: "active", cancel: "cancelled", dead_letter: "dead_letter", reconcile: "reconciled" },
  dead_letter: { reconcile: "reconciled" },
  reconciled: {},
};

function timestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function sha256(value: string): Hex {
  return createHash("sha256").update(value, "utf8").digest("hex") as Hex;
}

function validRecord(value: unknown): value is OperatorControlRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OperatorControlRecord>;
  return Boolean(
    typeof item.source_event_id === "string" && HEX_32.test(item.source_event_id) &&
    typeof item.binding_id === "string" && item.binding_id.length > 0 && item.binding_id.length <= 256 &&
    ["active", "paused", "cancelled", "retryable", "quarantined", "dead_letter", "reconciled"].includes(String(item.disposition)) &&
    typeof item.reason_code === "string" && SAFE_CODE.test(item.reason_code) &&
    timestamp(item.updated_at) && Number.isInteger(item.revision) && Number(item.revision) >= 1 &&
    (item.reconciliation_ref_sha256 === null || (typeof item.reconciliation_ref_sha256 === "string" && HEX_32.test(item.reconciliation_ref_sha256)))
  );
}

export class OperatorControlPlane {
  readonly #filePath: string;
  readonly #records = new Map<Hex, OperatorControlRecord>();
  readonly #audit: OperatorAuditEntry[] = [];

  constructor(filePath: string) {
    if (!filePath || filePath.length > 4_096) throw new Error("A bounded control-plane path is required.");
    this.#filePath = filePath;
    if (!existsSync(filePath)) return;
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<OperatorControlFileState>;
    if (parsed.version !== "0.1" || !Array.isArray(parsed.records) || !Array.isArray(parsed.audit)) {
      throw new Error("Unsupported or malformed operator-control state.");
    }
    for (const record of parsed.records) {
      if (!validRecord(record) || this.#records.has(record.source_event_id)) throw new Error("Malformed operator-control record.");
      this.#records.set(record.source_event_id, structuredClone(record));
    }
    for (const entry of parsed.audit) this.#audit.push(structuredClone(entry));
  }

  register(sourceEventId: Hex, bindingId: string, at: string): OperatorTransitionResult {
    if (!HEX_32.test(sourceEventId) || !bindingId || bindingId.length > 256 || !timestamp(at)) return { status: "rejected", code: "invalid_input" };
    const existing = this.#records.get(sourceEventId);
    if (existing) return { status: "already_applied", record: structuredClone(existing) };
    const record: OperatorControlRecord = {
      source_event_id: sourceEventId, binding_id: bindingId, disposition: "active",
      reason_code: "registered", updated_at: at, revision: 1, reconciliation_ref_sha256: null,
    };
    this.#records.set(sourceEventId, record);
    this.#audit.push({ source_event_id: sourceEventId, action: "register", from: null, to: "active", reason_code: "registered", occurred_at: at, revision: 1 });
    this.#persist();
    return { status: "applied", record: structuredClone(record) };
  }

  transition(sourceEventId: Hex, action: Exclude<OperatorControlAction, "register">, reasonCode: string, at: string, expectedRevision: number, reconciliationRef?: string): OperatorTransitionResult {
    if (!HEX_32.test(sourceEventId) || !SAFE_CODE.test(reasonCode) || !timestamp(at) || !Number.isInteger(expectedRevision)) return { status: "rejected", code: "invalid_input" };
    const current = this.#records.get(sourceEventId);
    if (!current) return { status: "rejected", code: "not_found" };
    if (current.revision !== expectedRevision) return { status: "rejected", code: "revision_conflict" };
    const next = transitions[current.disposition][action];
    if (!next) return { status: "rejected", code: "invalid_transition" };
    if (action === "reconcile" && !reconciliationRef) return { status: "rejected", code: "invalid_input" };
    const record: OperatorControlRecord = {
      ...current, disposition: next, reason_code: reasonCode, updated_at: at,
      revision: current.revision + 1,
      reconciliation_ref_sha256: action === "reconcile" ? sha256(reconciliationRef as string) : current.reconciliation_ref_sha256,
    };
    this.#records.set(sourceEventId, record);
    this.#audit.push({ source_event_id: sourceEventId, action, from: current.disposition, to: next, reason_code: reasonCode, occurred_at: at, revision: record.revision });
    this.#persist();
    return { status: "applied", record: structuredClone(record) };
  }

  recordRetryable(sourceEventId: Hex, reasonCode: string, at: string): OperatorTransitionResult {
    const current = this.#records.get(sourceEventId);
    if (!current) return { status: "rejected", code: "not_found" };
    if (current.disposition === "retryable" && current.reason_code === reasonCode) {
      return { status: "already_applied", record: structuredClone(current) };
    }
    return this.transition(sourceEventId, "mark_retryable", reasonCode, at, current.revision);
  }

  recordQuarantine(sourceEventId: Hex, reasonCode: string, at: string): OperatorTransitionResult {
    const current = this.#records.get(sourceEventId);
    if (!current) return { status: "rejected", code: "not_found" };
    if (current.disposition === "quarantined" && current.reason_code === reasonCode) {
      return { status: "already_applied", record: structuredClone(current) };
    }
    return this.transition(sourceEventId, "quarantine", reasonCode, at, current.revision);
  }

  recordAutomaticRetry(sourceEventId: Hex, reasonCode: string, at: string): OperatorTransitionResult {
    const current = this.#records.get(sourceEventId);
    if (!current) return { status: "rejected", code: "not_found" };
    return this.transition(sourceEventId, "auto_retry", reasonCode, at, current.revision);
  }

  recordReconciled(sourceEventId: Hex, reasonCode: string, at: string, proofRef: string): OperatorTransitionResult {
    const current = this.#records.get(sourceEventId);
    if (!current) return { status: "rejected", code: "not_found" };
    const proofHash = sha256(proofRef);
    if (current.disposition === "reconciled" && current.reconciliation_ref_sha256 === proofHash) {
      return { status: "already_applied", record: structuredClone(current) };
    }
    return this.transition(sourceEventId, "reconcile", reasonCode, at, current.revision, proofRef);
  }

  get(sourceEventId: Hex): OperatorControlRecord | undefined {
    const record = this.#records.get(sourceEventId);
    return record ? structuredClone(record) : undefined;
  }

  mayDispatch(sourceEventId: Hex): boolean {
    return this.#records.get(sourceEventId)?.disposition === "active";
  }

  inspect(): { records: OperatorControlRecord[]; audit: OperatorAuditEntry[] } {
    return {
      records: Array.from(this.#records.values(), (record) => structuredClone(record)),
      audit: this.#audit.map((entry) => structuredClone(entry)),
    };
  }

  #persist(): void {
    mkdirSync(dirname(this.#filePath), { recursive: true, mode: 0o700 });
    const temporary = `${this.#filePath}.tmp`;
    const state: OperatorControlFileState = { version: "0.1", ...this.inspect() };
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    chmodSync(temporary, 0o600);
    renameSync(temporary, this.#filePath);
    chmodSync(this.#filePath, 0o600);
  }
}
