import type { Hex, TensionPacket } from "./types.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export type ActionType =
  | "read"
  | "write"
  | "publish"
  | "external_commitment"
  | "permission";

export interface ActionIntent {
  intent_id: string;
  action_type: ActionType;
  capability: string;
  resource: string;
  operation: string;
  parameters: JsonObject;
}

export type AuthorityDecision =
  | "allow"
  | "propose"
  | "escalate"
  | "block"
  | "ratify";

export type DecisionClass =
  | "low_risk_read"
  | "material_change"
  | "protected_boundary"
  | "binding_commitment"
  | "prohibited"
  | "unknown_authority";

export type CapabilityMode =
  | "read_only"
  | "proposal_only"
  | "escalation_only"
  | "ratification_required"
  | "denied";

export interface CapabilityEnvelope {
  capability: string;
  action_types: ActionType[];
  resources: string[];
  operations: string[];
  mode: CapabilityMode;
}

export interface SyntheticAuthorityActor {
  actor_id: string;
  role_context: string[];
  status: "active" | "inactive";
}

export interface SyntheticAuthorityRule {
  rule_id: string;
  actor_id: string;
  capability_envelope: CapabilityEnvelope;
  decision_class: Exclude<DecisionClass, "unknown_authority">;
  outcome: AuthorityDecision;
  decision_reason: string;
  authority_basis: string[];
  constraints: string[];
  required_approvers: string[];
  required_ratifiers: string[];
  valid_from: string;
  valid_until: string;
  ttl_seconds: number;
  status: "active" | "inactive";
}

export interface SyntheticAuthoritySnapshot {
  snapshot_id: string;
  snapshot_version: "0.1";
  description: string;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
  actors: SyntheticAuthorityActor[];
  rules: SyntheticAuthorityRule[];
}

export interface AuthorityEvaluationRequest {
  tension_packet: TensionPacket;
  action_intent: ActionIntent;
  authority_snapshot_ref: string;
  evaluated_at: string;
}

export type AuthorityEvaluationCode =
  | "matched_rule"
  | "unknown_authority_snapshot"
  | "ambiguous_authority_snapshot"
  | "authority_snapshot_inactive"
  | "authority_snapshot_not_yet_valid"
  | "authority_snapshot_expired"
  | "snapshot_not_bound_to_tension"
  | "unknown_actor"
  | "ambiguous_actor"
  | "actor_inactive"
  | "no_matching_authority"
  | "authority_rule_inactive_or_outside_window"
  | "ambiguous_authority"
  | "unsafe_authority_rule";

export interface AuthorityPacket {
  packet_id: string;
  packet_version: "0.1";
  tension_packet_id: string;
  action_intent: ActionIntent;
  action_digest: Hex;
  canonical_actor_id: string;
  role_context: string[];
  authority_basis: string[];
  authority_snapshot_ref: string;
  authority_rule_ref: string | null;
  decision_class: DecisionClass;
  capability_envelope: CapabilityEnvelope[];
  constraints: string[];
  required_approvers: string[];
  required_ratifiers: string[];
  evaluated_at: string;
  expires_at: string;
  decision: AuthorityDecision;
  decision_reason: string;
  evaluation_code: AuthorityEvaluationCode;
  execution_posture: "not_executed";
  evidence_refs: string[];
}

export interface EvaluatedAuthorityResult {
  status: "evaluated";
  packet: AuthorityPacket;
}

export type AuthorityRejectionCode = "invalid_request" | "action_too_large";

export interface AuthorityEvaluationRejection {
  code: AuthorityRejectionCode;
  authority_basis: ["evaluator-policy:invalid-input-fails-closed"];
  human: {
    decision: "rejected";
    consequence: "No authority decision was issued and no action was performed.";
    next_move: string;
  };
}

export interface RejectedAuthorityResult {
  status: "rejected";
  rejection: AuthorityEvaluationRejection;
}

export type AuthorityEvaluationResult =
  | EvaluatedAuthorityResult
  | RejectedAuthorityResult;

export interface AuthorityEvaluatorConfig {
  snapshots: SyntheticAuthoritySnapshot[];
  max_action_bytes?: number;
  fail_closed_ttl_seconds?: number;
  max_issued_packets?: number;
}

export type AuthorityDecisionValidationCode =
  | "valid"
  | "invalid_action"
  | "unrecognized_authority_packet"
  | "action_digest_mismatch"
  | "authority_packet_expired"
  | "missing_authority_basis"
  | "decision_not_allow";

export interface AuthorityDecisionValidation {
  valid: boolean;
  code: AuthorityDecisionValidationCode;
  consequence: string;
}
