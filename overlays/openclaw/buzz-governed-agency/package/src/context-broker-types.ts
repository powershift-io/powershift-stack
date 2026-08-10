import type { Hex } from "./types.js";

export type ContextPrivacyTier = "pilot_internal" | "public";
export type ContextSensitivityTier = "low" | "moderate";

export interface AuthorizedContextSource {
  source_id: string;
  source_uri: string;
  source_version_ref: string;
  content: string;
  content_sha256: Hex;
  canonical_actor_ids: string[];
  allowed_mind_ids: string[];
  allowed_role_ids: string[];
  allowed_lane_ids: string[];
  privacy_tier: ContextPrivacyTier;
  sensitivity_tier: ContextSensitivityTier;
  retention_policy: string;
  required_authority_refs: string[];
  status: "active" | "inactive";
}

export interface AuthorizedContextRequest {
  request_id: string;
  room_id: string;
  tension_packet_id: string;
  canonical_actor_id: string;
  mind_id: string;
  role_id: string;
  lane_id: string;
  requested_source_ids: string[];
  authority_refs: string[];
  requested_at: string;
  max_bytes: number;
}

export interface AuthorizedContextCitation {
  source_id: string;
  source_uri: string;
  source_version_ref: string;
  content_sha256: Hex;
  excerpt: string;
  excerpt_bytes: number;
  privacy_tier: ContextPrivacyTier;
  sensitivity_tier: ContextSensitivityTier;
  retention_policy: string;
  authority_refs: string[];
}

export interface AuthorizedContextReceipt {
  receipt_id: string;
  receipt_version: "0.1";
  request_id: string;
  room_id: string;
  tension_packet_id: string;
  canonical_actor_id: string;
  mind_id: string;
  role_id: string;
  lane_id: string;
  requested_source_ids: string[];
  citations: AuthorizedContextCitation[];
  context_bytes: number;
  retrieval_count: number;
  promotion_count: 0;
  private_context_refs: [];
  cross_mind_context_refs: [];
  execution_posture: "not_executed";
  authority_transfer: "none";
  evidence_refs: string[];
}

export interface AuthorizedContextResult {
  status: "authorized";
  receipt: AuthorizedContextReceipt;
  duplicate_safe: true;
}

export type ContextBrokerRejectionCode =
  | "invalid_request"
  | "source_unknown"
  | "source_unavailable"
  | "source_digest_mismatch"
  | "actor_not_allowed"
  | "mind_not_allowed"
  | "role_not_allowed"
  | "lane_not_allowed"
  | "authority_missing"
  | "context_budget_exceeded";

export interface RejectedContextResult {
  status: "rejected";
  rejection: {
    code: ContextBrokerRejectionCode;
    consequence: "No context was released, promoted, or written.";
    next_move: string;
    evidence_refs: string[];
  };
}

export type ContextBrokerResult = AuthorizedContextResult | RejectedContextResult;

export interface AuthorizedContextBrokerConfig {
  sources: AuthorizedContextSource[];
  max_sources?: number;
  max_context_bytes?: number;
}
