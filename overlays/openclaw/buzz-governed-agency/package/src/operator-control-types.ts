import type { Hex } from "./types.js";

export type OperatorDisposition =
  | "active"
  | "paused"
  | "cancelled"
  | "retryable"
  | "quarantined"
  | "dead_letter"
  | "reconciled";

export type OperatorControlAction =
  | "register"
  | "pause"
  | "resume"
  | "cancel"
  | "mark_retryable"
  | "auto_retry"
  | "retry"
  | "quarantine"
  | "dead_letter"
  | "reconcile";

export interface OperatorControlRecord {
  source_event_id: Hex;
  binding_id: string;
  disposition: OperatorDisposition;
  reason_code: string;
  updated_at: string;
  revision: number;
  reconciliation_ref_sha256: Hex | null;
}

export interface OperatorAuditEntry {
  source_event_id: Hex;
  action: OperatorControlAction;
  from: OperatorDisposition | null;
  to: OperatorDisposition;
  reason_code: string;
  occurred_at: string;
  revision: number;
}

export interface OperatorControlFileState {
  version: "0.1";
  records: OperatorControlRecord[];
  audit: OperatorAuditEntry[];
}

export type OperatorTransitionResult =
  | { status: "applied"; record: OperatorControlRecord }
  | { status: "already_applied"; record: OperatorControlRecord }
  | { status: "rejected"; code: "not_found" | "invalid_transition" | "revision_conflict" | "invalid_input" };
