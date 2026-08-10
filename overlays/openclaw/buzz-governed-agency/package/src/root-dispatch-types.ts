import type { Hex } from "./types.js";

export interface RootDispatchBinding {
  binding_id: string;
  protocol_version: "0.1";
  relay: string;
  community_id: string;
  openclaw_agent_id: string;
  openclaw_session_key: string;
  openclaw_session_key_sha256: Hex;
  openclaw_session_id: string;
  allowed_channel_ids: string[];
  allowed_source_pubkeys: Hex[];
  valid_from: string;
  valid_until: string;
  require_existing: true;
  reset_session: false;
  status: "active" | "inactive" | "revoked";
}

export interface RootDispatchEnvelope {
  protocol_version: string;
  source_event_id: Hex;
  thread_root_event_id: Hex;
  source_pubkey: Hex;
  channel_id: string;
  binding_id: string;
  openclaw_agent_id: string;
  openclaw_session_key_sha256: Hex;
  openclaw_session_id: string;
  payload_digest: Hex;
  role_request_id: string | null;
  received_at: string;
  not_before: string;
  expires_at: string;
  execution_posture: "not_executed";
  authority_transfer: "none";
}

export interface RootDispatchTransportRequest {
  envelope: RootDispatchEnvelope;
  binding: RootDispatchBinding;
  idempotency_key: string;
  dispatch_mode: "one_response_per_root";
}

export type RootDispatchTransportResult =
  | {
      status: "accepted";
      transport_ref: string;
      accepted_at: string;
      evidence_refs: string[];
    }
  | {
      status: "retryable";
      code: "gateway_unavailable" | "buzz_unavailable" | "relay_unavailable";
      detail: string;
      evidence_refs: string[];
    }
  | {
      status: "rejected";
      code: "transport_boundary" | "session_missing" | "version_mismatch";
      detail: string;
      evidence_refs: string[];
    };

export interface RootDispatchTransport {
  dispatch(request: RootDispatchTransportRequest): Promise<RootDispatchTransportResult>;
}

export type RootDispatchState = "queued" | "dispatching" | "dispatched" | "blocked";

export interface RootDispatchRecord {
  envelope: RootDispatchEnvelope;
  state: RootDispatchState;
  attempts: number;
  enqueued_at: string;
  updated_at: string;
  dispatch_started_at: string | null;
  dispatched_at: string | null;
  transport_ref_sha256: Hex | null;
  last_code: string | null;
  last_detail: string | null;
  response_closed: false;
  evidence_refs: string[];
}

export interface RootDispatchStore {
  get(sourceEventId: Hex): RootDispatchRecord | undefined;
  put(record: RootDispatchRecord): void;
  list(): RootDispatchRecord[];
  claim(sourceEventId: Hex, at: string): RootDispatchRecord | undefined;
}

export interface RootDispatchFileState {
  version: "0.1";
  records: RootDispatchRecord[];
}

export type RootDispatchRejectionCode =
  | "invalid_envelope"
  | "binding_not_found"
  | "binding_ambiguous"
  | "binding_inactive"
  | "identity_revoked"
  | "binding_expired"
  | "session_mismatch"
  | "channel_not_allowed"
  | "source_not_allowed"
  | "version_mismatch"
  | "message_expired"
  | "conflicting_duplicate"
  | "transport_rejected";

export type RootEnqueueResult =
  | { status: "queued"; record: RootDispatchRecord }
  | { status: "duplicate"; record: RootDispatchRecord }
  | {
      status: "rejected";
      code: RootDispatchRejectionCode;
      consequence: "No ACP turn, response closure, execution, or authority transfer occurred.";
    };

export interface RootDrainResult {
  status: "drained" | "paused";
  binding_id: string;
  dispatched_source_event_ids: Hex[];
  blocked_source_event_ids: Hex[];
  operator_held_source_event_ids: Hex[];
  remaining_queued_source_event_ids: Hex[];
  transport_calls: number;
  response_closures: 0;
}

export interface BuzzRootDispatchQueueConfig {
  bindings: RootDispatchBinding[];
  transport: RootDispatchTransport;
  store?: RootDispatchStore;
  max_queue_depth?: number;
  max_auto_transport_attempts?: number;
  auto_retry_backoff_ms?: number;
  operator_control?: {
    mayDispatch(sourceEventId: Hex): boolean;
    recordRetryable(sourceEventId: Hex, reasonCode: string, at: string): unknown;
    recordQuarantine(sourceEventId: Hex, reasonCode: string, at: string): unknown;
    recordAutomaticRetry?(sourceEventId: Hex, reasonCode: string, at: string): unknown;
  };
}
