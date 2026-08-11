import type {
  ActionIntent,
  AuthorityDecision,
  AuthorityPacket,
  SyntheticAuthoritySnapshot,
} from "./authority-types.js";
import type { TensionPacket } from "./types.js";

export interface MindRoleBinding {
  binding_id: string;
  mind_id: string;
  openclaw_agent_id: string;
  role_id: string;
  authority_actor_id: string;
  authority_source_ref: string;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
}

export interface RoleProjectionRequest {
  tension_packet: TensionPacket;
  action_intent: ActionIntent;
  mind_id: string;
  requested_role_id: string | null;
  authority_snapshot_ref: string;
  evaluated_at: string;
  buzz_channel_labels: string[];
}

export type RoleProjectionCode =
  | "projected"
  | "missing_role"
  | "unknown_role"
  | "ambiguous_role"
  | "role_binding_inactive"
  | "role_binding_not_yet_valid"
  | "role_binding_expired"
  | "role_authority_source_mismatch"
  | "role_packet_mismatch"
  | "invalid_request";

export interface RoleDecisionReceipt {
  receipt_id: string;
  receipt_version: "0.1";
  requested_by_actor_id: string;
  mind_id: string;
  openclaw_agent_id: string;
  requested_role_id: string | null;
  active_role_id: string | null;
  role_binding_ref: string | null;
  channel_id: string | null;
  buzz_channel_labels: string[];
  channel_membership_grants_authority: false;
  authority_source_ref: string;
  authority_packet_id: string | null;
  authority_rule_ref: string | null;
  decision: AuthorityDecision;
  decision_code: RoleProjectionCode;
  consequence: string;
  execution_posture: "not_executed";
  private_context_refs: [];
  evidence_refs: string[];
}

export type RoleProjectionResult =
  | {
      status: "evaluated";
      authority_packet: AuthorityPacket;
      receipt: RoleDecisionReceipt;
    }
  | {
      status: "blocked";
      authority_packet: null;
      receipt: RoleDecisionReceipt;
    };

export interface RoleAuthorityProjectorConfig {
  bindings: MindRoleBinding[];
  snapshots: SyntheticAuthoritySnapshot[];
}
