import type { AuthorityDecision, AuthorityPacket } from "./authority-types.js";
import type { Hex, TensionPacket } from "./types.js";

export interface VerifiedNonExecution {
  posture: "not_executed";
  verified_at: string;
  tool_invocations: 0;
  evidence_refs: string[];
  detail: string;
}

export interface ReceiptReturnRequest {
  tension_packet: TensionPacket;
  authority_packet: AuthorityPacket;
  non_execution: VerifiedNonExecution;
  returned_at: string;
  proof_refs: string[];
}

export interface BuzzReceiptPublishRequest {
  relay: string;
  community_id: string;
  channel_id: string;
  source_event_id: Hex;
  root_event_id: Hex;
  reply_to_event_id: Hex;
  idempotency_key: string;
  content: string;
}

export interface AcceptedBuzzPublication {
  status: "accepted";
  event_id: Hex;
  accepted_at: string;
  evidence_refs: string[];
}

export interface RejectedBuzzPublication {
  status: "rejected";
  reason: string;
  evidence_refs: string[];
}

export type BuzzPublicationResult =
  | AcceptedBuzzPublication
  | RejectedBuzzPublication;

export interface BuzzReceiptPublisher {
  publish(request: BuzzReceiptPublishRequest): Promise<BuzzPublicationResult>;
}

export interface ReceiptLifecycle {
  sent: {
    at: string;
    transport: "buzz_nostr";
  };
  received: {
    at: string;
    relay_event_id: Hex;
    evidence_refs: string[];
  };
  evaluated: {
    at: string;
    decision: AuthorityDecision;
    authority_packet_id: string;
  };
  acted: {
    status: "not_executed";
    tool_invocations: 0;
    evidence_refs: string[];
  };
  verified: {
    at: string;
    consequence: "verified_non_execution";
    evidence_refs: string[];
  };
  closed: {
    at: string;
    basis: "relay_acceptance_and_verified_non_execution";
  };
}

export interface ReturnedReceipt {
  receipt_id: string;
  receipt_version: "0.1";
  source_event_id: Hex;
  tension_packet_id: string;
  authority_packet_id: string;
  action_digest: Hex;
  decision: AuthorityDecision;
  consequence: "not_executed";
  buzz_return_event_id: Hex;
  lifecycle: ReceiptLifecycle;
  linkage_refs: string[];
  human: {
    decision: string;
    consequence: string;
    evidence_summary: string;
    next_move: string;
  };
  machine: {
    relay: string;
    community_id: string;
    channel_id: string;
    root_event_id: Hex;
    reply_to_event_id: Hex;
    authority_basis: string[];
    proof_refs: string[];
  };
}

export interface PublishedReceiptReturn {
  status: "published";
  receipt: ReturnedReceipt;
  duplicate_safe: true;
}

export interface DuplicateReceiptReturn {
  status: "duplicate";
  receipt: ReturnedReceipt;
  duplicate_safe: true;
  consequence: "No second Buzz event was published.";
}

export type ReceiptReturnRejectionCode =
  | "invalid_request"
  | "relay_not_allowed"
  | "community_not_allowed"
  | "missing_thread_context"
  | "packet_linkage_mismatch"
  | "action_digest_mismatch"
  | "missing_authority_basis"
  | "missing_non_execution_evidence"
  | "content_too_large"
  | "transport_rejected";

export interface RejectedReceiptReturn {
  status: "rejected";
  rejection: {
    code: ReceiptReturnRejectionCode;
    consequence: "No receipt was closed and no execution occurred.";
    next_move: string;
    evidence_refs: string[];
  };
}

export type ReceiptReturnResult =
  | PublishedReceiptReturn
  | DuplicateReceiptReturn
  | RejectedReceiptReturn;

export interface ReceiptReturnStore {
  get(receiptId: string): ReturnedReceipt | undefined;
  set(receiptId: string, receipt: ReturnedReceipt): void;
}

export interface ReceiptReturnLogEntry {
  at: string;
  outcome: "published" | "duplicate" | "rejected";
  receipt_id: string | null;
  source_event_id: string | null;
  buzz_return_event_id?: string;
  rejection_code?: ReceiptReturnRejectionCode;
}

export interface ReceiptReturnLogger {
  write(entry: ReceiptReturnLogEntry): void;
}

export interface BuzzReceiptReturnerConfig {
  allowed_relays: string[];
  allowed_community_ids: string[];
  publisher: BuzzReceiptPublisher;
  store?: ReceiptReturnStore;
  logger?: ReceiptReturnLogger;
  max_content_bytes?: number;
}
