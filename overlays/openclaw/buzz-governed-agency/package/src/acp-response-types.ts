import type { BuzzEvent, Hex } from "./types.js";

export interface OpenClawAcpBinding {
  binding_id: string;
  relay: string;
  community_id: string;
  buzz_agent_pubkey: Hex;
  openclaw_agent_id: string;
  openclaw_session_key: string;
  openclaw_session_id: string;
  allowed_channel_ids: string[];
  allowed_source_pubkeys: Hex[];
  allowed_read_only_tools: string[];
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
}

export interface AcpToolObservation {
  call_id: string;
  name: string;
  result: "ok" | "error" | "missing";
}

export interface CompletedOpenClawTurn {
  source_event_id: Hex;
  channel_id: string;
  openclaw_agent_id: string;
  openclaw_session_key: string;
  openclaw_session_id: string;
  user_message_id: string;
  assistant_message_id: string;
  assistant_idempotency_key: string;
  assistant_text: string;
  assistant_text_sha256: Hex;
  provider: string;
  model: string;
  prompted_at: string;
  completed_at: string;
  stop_reason: "stop";
  provenance: {
    source_channel: "acp";
    source_tool: "openclaw_acp";
    mirror_origin: "codex-app-server";
    evidence_mode: "meta+receipt";
    transcript_evidence_ref: string;
  };
  tools: AcpToolObservation[];
  execution_posture: "not_executed";
  authority_transfer: "none";
}

export interface AcpTranscriptExtractionRequest {
  entries: unknown[];
  source_event_id: Hex;
  channel_id: string;
  openclaw_agent_id: string;
  openclaw_session_key: string;
  openclaw_session_id: string;
  transcript_evidence_ref: string;
}

export type AcpTranscriptExtractionResult =
  | { status: "completed"; turn: CompletedOpenClawTurn }
  | {
      status: "rejected";
      code:
        | "invalid_transcript"
        | "session_mismatch"
        | "source_event_not_found"
        | "ambiguous_source_event"
        | "transcript_provenance_invalid"
        | "incomplete_turn";
      detail: string;
    };

export interface AcpResponseReturnRequest {
  relay: string;
  community_id: string;
  source_event: BuzzEvent;
  turn: CompletedOpenClawTurn;
  returned_at: string;
  proof_refs: string[];
}

export interface AcpResponseMachineProvenance {
  version: "0.1";
  binding_id: string;
  source_event_id: Hex;
  openclaw_agent_id: string;
  openclaw_session_id: string;
  openclaw_session_key_sha256: Hex;
  user_message_id: string;
  assistant_message_id: string;
  assistant_idempotency_key: string;
  assistant_text_sha256: Hex;
  provider: string;
  model: string;
  transcript_evidence_ref: string;
  execution_posture: "not_executed";
  authority_transfer: "none";
  tool_observations: AcpToolObservation[];
}

export interface BuzzAcpResponsePublishRequest {
  relay: string;
  community_id: string;
  channel_id: string;
  source_event_id: Hex;
  reply_to_event_id: Hex;
  expected_signer_pubkey: Hex;
  idempotency_key: string;
  content: string;
  provenance: AcpResponseMachineProvenance;
}

export type BuzzAcpResponsePublicationResult =
  | {
      status: "accepted";
      event: BuzzEvent;
      accepted_at: string;
      evidence_refs: string[];
    }
  | {
      status: "rejected";
      reason: string;
      evidence_refs: string[];
    };

export interface BuzzAcpResponsePublisher {
  publish(
    request: BuzzAcpResponsePublishRequest,
  ): Promise<BuzzAcpResponsePublicationResult>;
}

export interface ReturnedAcpResponse {
  response_return_id: string;
  response_return_version: "0.1";
  binding_id: string;
  source_event_id: Hex;
  buzz_response_event_id: Hex;
  buzz_response_signer_pubkey: Hex;
  assistant_text_sha256: Hex;
  openclaw_agent_id: string;
  openclaw_session_id: string;
  openclaw_session_key_sha256: Hex;
  user_message_id: string;
  assistant_message_id: string;
  assistant_idempotency_key: string;
  event_id_verified: true;
  signature_verified: true;
  consequence: "response_published_without_execution_or_authority_transfer";
  lifecycle: {
    prompted_at: string;
    completed_at: string;
    evaluated_at: string;
    published_at: string;
    closed_at: string;
  };
  machine: {
    relay: string;
    community_id: string;
    channel_id: string;
    provider: string;
    model: string;
    transcript_evidence_ref: string;
    tool_observations: AcpToolObservation[];
    execution_posture: "not_executed";
    authority_transfer: "none";
    proof_refs: string[];
    publication_evidence_refs: string[];
  };
}

export type AcpResponseReturnRejectionCode =
  | "invalid_request"
  | "relay_not_allowed"
  | "community_not_allowed"
  | "channel_not_allowed"
  | "source_event_invalid"
  | "source_signature_invalid"
  | "binding_not_found"
  | "binding_ambiguous"
  | "binding_inactive"
  | "session_mismatch"
  | "transcript_provenance_invalid"
  | "assistant_digest_mismatch"
  | "incomplete_turn"
  | "tool_boundary_violation"
  | "execution_boundary_violation"
  | "stale_turn"
  | "content_too_large"
  | "conflicting_replay"
  | "transport_rejected"
  | "returned_event_invalid";

export type AcpResponseReturnResult =
  | {
      status: "published";
      response: ReturnedAcpResponse;
      duplicate_safe: true;
    }
  | {
      status: "duplicate";
      response: ReturnedAcpResponse;
      duplicate_safe: true;
      consequence: "No second Buzz event was published.";
    }
  | {
      status: "rejected";
      rejection: {
        code: AcpResponseReturnRejectionCode;
        consequence: "No Buzz response was closed and no execution occurred.";
        next_move: string;
        evidence_refs: string[];
      };
    };

export interface AcpResponseReturnStore {
  getBySourceEvent(sourceEventId: Hex): ReturnedAcpResponse | undefined;
  set(response: ReturnedAcpResponse): void;
}

export interface AcpResponseReturnLogEntry {
  at: string;
  outcome: "published" | "duplicate" | "rejected";
  source_event_id: string | null;
  response_return_id: string | null;
  buzz_response_event_id?: string;
  rejection_code?: AcpResponseReturnRejectionCode;
}

export interface AcpResponseReturnLogger {
  write(entry: AcpResponseReturnLogEntry): void;
}

export interface BuzzAcpResponseReturnerConfig {
  allowed_relays: string[];
  allowed_community_ids: string[];
  bindings: OpenClawAcpBinding[];
  publisher: BuzzAcpResponsePublisher;
  store?: AcpResponseReturnStore;
  logger?: AcpResponseReturnLogger;
  max_content_bytes?: number;
  max_return_delay_seconds?: number;
  response_event_kind?: number;
}
