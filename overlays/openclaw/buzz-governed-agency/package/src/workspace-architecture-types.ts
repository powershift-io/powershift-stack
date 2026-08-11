import type { Hex } from "./types.js";

export type WorkspaceContainerKind =
  | "mind_lane"
  | "governance"
  | "operations"
  | "shared_coordination";

export type WorkspaceThreadKind =
  | "direct_exchange"
  | "tension_packet"
  | "work_packet"
  | "report_card";

export type CoordinationNeed =
  | "human_mind_primary"
  | "human_mind_secondary"
  | "platform_circle"
  | "general_circle"
  | "engine_room"
  | "cross_mind_tension"
  | "time_bounded_implementation";

export interface WorkspaceContainer {
  container_id: string;
  label: string;
  kind: WorkspaceContainerKind;
  governed_domain: string;
  allowed_thread_kinds: WorkspaceThreadKind[];
  allowed_mind_ids: string[];
  durable: true;
  channel_membership_grants_authority: false;
  status: "active" | "inactive";
}

export interface WorkspaceThreadBinding {
  thread_root_event_id: Hex;
  container_id: string;
  thread_kind: WorkspaceThreadKind;
  work_packet_ref: string | null;
  created_by_actor_id: string;
  target_mind_ids: string[];
  status: "open" | "closed";
}

export interface WorkspaceRouteRequest {
  source_event_id: Hex;
  requested_by_actor_id: string;
  container_id: string;
  requested_thread_kind: WorkspaceThreadKind;
  reply_to_event_id: Hex | null;
  explicit_attention_targets: string[];
  mentioned_mind_ids: string[];
  buzz_channel_labels: string[];
}

export type WorkspaceRouteCode =
  | "routed"
  | "invalid_request"
  | "unknown_container"
  | "ambiguous_container"
  | "container_inactive"
  | "thread_kind_not_allowed"
  | "thread_not_found"
  | "thread_container_mismatch"
  | "thread_kind_mismatch"
  | "thread_closed"
  | "attention_target_not_allowed"
  | "direct_lane_target_mismatch";

export interface WorkspaceRoutingReceipt {
  receipt_id: string;
  receipt_version: "0.1";
  source_event_id: Hex | null;
  requested_by_actor_id: string;
  container_id: string | null;
  container_kind: WorkspaceContainerKind | null;
  governed_domain: string | null;
  thread_root_event_id: Hex | null;
  thread_kind: WorkspaceThreadKind | null;
  work_packet_ref: string | null;
  attention_targets: string[];
  mentioned_mind_ids: string[];
  decision: "route" | "block";
  decision_code: WorkspaceRouteCode;
  consequence: string;
  mentions_grant_authority: false;
  channel_membership_grants_authority: false;
  active_role_id: null;
  authority_effect: "none";
  execution_posture: "not_executed";
  private_context_refs: [];
  evidence_refs: string[];
}

export type WorkspaceRouteResult =
  | { status: "routed"; receipt: WorkspaceRoutingReceipt }
  | { status: "blocked"; receipt: WorkspaceRoutingReceipt };

export interface WorkspaceArchitectureConfig {
  containers: WorkspaceContainer[];
  threads: WorkspaceThreadBinding[];
  need_map: Record<CoordinationNeed, string>;
}
