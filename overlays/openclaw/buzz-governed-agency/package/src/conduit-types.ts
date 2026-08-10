import type { AuthorityDecision, AuthorityPacket } from "./authority-types.js";
import type { TensionPacket } from "./types.js";

export interface MindConduitEndpoint {
  endpoint_id: string;
  mind_id: string;
  canonical_actor_id: string;
  role_context: string[];
  status: "active" | "inactive";
}

export interface MindConduitCharter {
  conduit_id: string;
  charter_version: "0.1";
  status: "active" | "inactive";
  purpose: string;
  convening_authority: string;
  allowed_scopes: string[];
  escalation_rules: string[];
  valid_from: string;
  valid_until: string;
  endpoints: MindConduitEndpoint[];
}

export interface ConduitSendRequest {
  conduit_id: string;
  from_endpoint_id: string;
  to_endpoint_id: string;
  purpose: string;
  scope: string[];
  tension_packet: TensionPacket;
  authority_packet: AuthorityPacket;
  sent_at: string;
  expires_at: string;
  proof_refs: string[];
}

export interface MindConduitPacket {
  packet_id: string;
  packet_version: "0.1";
  conduit_id: string;
  charter_version: "0.1";
  from: MindConduitEndpoint;
  to: MindConduitEndpoint;
  purpose: string;
  scope: string[];
  tension_packet_id: string;
  authority_packet_id: string;
  action_digest: string;
  sender_decision: AuthorityDecision;
  sender_authority_basis: string[];
  sender_authority_effect: "context_only";
  authority_transfer: "none";
  execution_posture: "not_executed";
  created_at: string;
  expires_at: string;
  escalation_rules: string[];
  proof_refs: string[];
}

export interface AcceptedConduitTransport {
  status: "received";
  transport_receipt_id: string;
  receiver_endpoint_id: string;
  received_at: string;
  evidence_refs: string[];
}

export interface RejectedConduitTransport {
  status: "rejected";
  reason: string;
  evidence_refs: string[];
}

export type ConduitTransportResult =
  | AcceptedConduitTransport
  | RejectedConduitTransport;

export interface MindConduitTransport {
  deliver(packet: MindConduitPacket): Promise<ConduitTransportResult>;
}

export interface ConduitDeliveryReceipt {
  delivery_id: string;
  receipt_version: "0.1";
  packet: MindConduitPacket;
  sender_receipt_id: string;
  receiver_receipt_id: string;
  transport_receipt_id: string;
  lifecycle: {
    sent: {
      at: string;
      endpoint_id: string;
    };
    received: {
      at: string;
      endpoint_id: string;
      evidence_refs: string[];
    };
    receiver_decision: "pending";
  };
  two_sided_linkage: true;
  authority_transfer: "none";
  execution_posture: "not_executed";
  tool_invocations: 0;
}

export interface DeliveredConduitPacket {
  status: "delivered";
  receipt: ConduitDeliveryReceipt;
  duplicate_safe: true;
}

export interface DuplicateConduitDelivery {
  status: "duplicate";
  receipt: ConduitDeliveryReceipt;
  duplicate_safe: true;
  consequence: "No second Conduit packet was delivered.";
}

export type ConduitRejectionCode =
  | "invalid_request"
  | "unknown_conduit"
  | "conduit_inactive_or_outside_window"
  | "unknown_endpoint"
  | "endpoint_inactive"
  | "endpoint_identity_not_distinct"
  | "sender_identity_mismatch"
  | "sender_role_mismatch"
  | "scope_not_allowed"
  | "packet_linkage_mismatch"
  | "action_digest_mismatch"
  | "authority_packet_expired"
  | "delivery_window_invalid"
  | "transport_rejected"
  | "transport_identity_mismatch";

export interface RejectedConduitDelivery {
  status: "rejected";
  rejection: {
    code: ConduitRejectionCode;
    consequence: "No Conduit delivery was recorded and no action was performed.";
    next_move: string;
    evidence_refs: string[];
  };
}

export type ConduitDeliveryResult =
  | DeliveredConduitPacket
  | DuplicateConduitDelivery
  | RejectedConduitDelivery;

export type ReceivingMindDisposition = "accept" | "decline" | "escalate";

export interface ReceivingMindDecisionRequest {
  delivery_id: string;
  receiver_endpoint_id: string;
  disposition: ReceivingMindDisposition;
  rationale: string;
  receiver_authority_basis: string[];
  decided_at: string;
  evidence_refs: string[];
  escalation_target: string | null;
}

export interface ReceivingMindDecisionReceipt {
  decision_id: string;
  decision_version: "0.1";
  delivery_id: string;
  conduit_packet_id: string;
  tension_packet_id: string;
  authority_packet_id: string;
  action_digest: string;
  receiver: MindConduitEndpoint;
  disposition: ReceivingMindDisposition;
  rationale: string;
  receiver_authority_basis: string[];
  sender_authority_effect: "context_only";
  authority_transfer: "none";
  execution_posture: "not_executed";
  tool_invocations: 0;
  consequence:
    | "accepted_for_independent_evaluation"
    | "declined_without_action"
    | "escalated_without_action";
  escalation_target: string | null;
  decided_at: string;
  evidence_refs: string[];
  linkage_refs: string[];
  next_authority_requirement:
    | "receiver_authority_packet_required_before_action"
    | "none"
    | "named_escalation_required";
}

export interface RecordedReceivingMindDecision {
  status: "recorded";
  decision: ReceivingMindDecisionReceipt;
  duplicate_safe: true;
}

export interface DuplicateReceivingMindDecision {
  status: "duplicate";
  decision: ReceivingMindDecisionReceipt;
  duplicate_safe: true;
  consequence: "No second receiver decision was recorded.";
}

export type ReceivingDecisionRejectionCode =
  | "invalid_request"
  | "unknown_delivery"
  | "receiver_identity_mismatch"
  | "decision_time_invalid"
  | "delivery_expired"
  | "missing_independent_decision_evidence"
  | "missing_escalation_target"
  | "unexpected_escalation_target"
  | "decision_conflict";

export interface RejectedReceivingMindDecision {
  status: "rejected";
  rejection: {
    code: ReceivingDecisionRejectionCode;
    consequence: "No receiver decision was recorded and no action was performed.";
    next_move: string;
    evidence_refs: string[];
  };
}

export type ReceivingMindDecisionResult =
  | RecordedReceivingMindDecision
  | DuplicateReceivingMindDecision
  | RejectedReceivingMindDecision;

export interface MindConduitStore {
  getDelivery(deliveryId: string): ConduitDeliveryReceipt | undefined;
  setDelivery(deliveryId: string, receipt: ConduitDeliveryReceipt): void;
  getDecision(deliveryId: string): ReceivingMindDecisionReceipt | undefined;
  setDecision(
    deliveryId: string,
    decision: ReceivingMindDecisionReceipt,
  ): void;
}

export interface SyntheticMindConduitConfig {
  charters: MindConduitCharter[];
  transport: MindConduitTransport;
  store?: MindConduitStore;
}
