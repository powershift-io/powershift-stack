export type Hex = string;

export interface BuzzEvent {
  id: Hex;
  pubkey: Hex;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: Hex;
}

export interface IntakeEnvelope {
  relay: string;
  community_id: string;
  observed_at: string;
  event: BuzzEvent;
}

export interface ActorBinding {
  binding_id: string;
  relay: string;
  community_id: string;
  buzz_pubkey: Hex;
  powershift_actor_id: string;
  role_context: string[];
  authority_source_ref: string;
  valid_from: string;
  valid_until: string;
  status: "active" | "inactive";
}

export type ReplySemantics = "none" | "root_only" | "nested";

export interface BuzzThreadContext {
  channel_id: string | null;
  root_event_id: Hex | null;
  direct_reply_event_id: Hex | null;
  reply_semantics: ReplySemantics;
  mentioned_pubkeys: Hex[];
}

export interface TensionPacket {
  packet_id: string;
  packet_version: "0.1";
  source_system: "buzz";
  source_relay: string;
  source_community: string;
  source_event_id: Hex;
  source_event_kind: number;
  source_pubkey: Hex;
  source_created_at: string;
  ingested_at: string;
  canonical_actor_id: string;
  binding_ref: string;
  raw_signal_digest: Hex;
  summary: string;
  classification: "buzz_message" | "buzz_event";
  affected_objects: string[];
  proposed_route: "authority_evaluator";
  provenance_refs: string[];
  freshness_state: "fresh";
  replay_state: "first_seen";
  thread_context: BuzzThreadContext;
}

export interface HumanReceipt {
  decision: "accepted_for_read_only_intake";
  evidence_summary: string;
  consequence: string;
  next_move: string;
}

export interface MachineReceipt {
  adapter_version: "0.1";
  receipt_id: string;
  source_event_id: Hex;
  source_pubkey: Hex;
  source_signature: Hex;
  source_created_at: string;
  ingested_at: string;
  source_tags: string[][];
  packet_id: string;
  packet_fields: TensionPacket;
  event_id_verified: true;
  signature_verified: true;
  binding_ref: string;
  replay_state: "first_seen";
  thread_context: BuzzThreadContext;
  evidence_refs: string[];
}

export interface DualGrainReceipt {
  human: HumanReceipt;
  machine: MachineReceipt;
}

export type RejectionCode =
  | "relay_not_allowed"
  | "community_not_allowed"
  | "invalid_event_shape"
  | "event_too_large"
  | "invalid_event_id"
  | "invalid_signature"
  | "event_too_old"
  | "event_from_future"
  | "unknown_binding"
  | "ambiguous_binding"
  | "binding_inactive"
  | "binding_not_yet_valid"
  | "binding_expired"
  | "unknown_authority_source";

export interface StructuredRejection {
  code: RejectionCode;
  human: {
    summary: string;
    consequence: "No packet was created and no action was performed.";
    next_move: string;
  };
  machine: {
    adapter_version: "0.1";
    relay: string;
    community_id: string;
    source_event_id: string | null;
    evidence_refs: string[];
  };
}

export interface AcceptedIntake {
  status: "accepted";
  packet: TensionPacket;
  receipt: DualGrainReceipt;
}

export interface ReplayIntake {
  status: "replay";
  packet: TensionPacket;
  receipt: DualGrainReceipt;
  replay: {
    duplicate_source_event_id: Hex;
    original_packet_id: string;
    original_receipt_id: string;
    consequence: "No duplicate packet or receipt was created.";
  };
}

export interface RejectedIntake {
  status: "rejected";
  rejection: StructuredRejection;
}

export type IntakeResult = AcceptedIntake | ReplayIntake | RejectedIntake;

export interface AdapterLogEntry {
  at: string;
  level: "info" | "warn";
  outcome: "accepted" | "replay" | "rejected";
  source_event_id: string | null;
  canonical_actor_id?: string;
  packet_id?: string;
  rejection_code?: RejectionCode;
}

export interface AdapterLogger {
  write(entry: AdapterLogEntry): void;
}

export interface ReplayStore {
  get(key: string): AcceptedIntake | undefined;
  set(key: string, value: AcceptedIntake): void;
}

export interface AdapterConfig {
  allowed_relays: string[];
  allowed_community_ids: string[];
  allowed_authority_source_refs: string[];
  bindings: ActorBinding[];
  max_content_bytes?: number;
  max_tags?: number;
  max_event_bytes?: number;
  max_event_age_seconds?: number;
  max_future_skew_seconds?: number;
  logger?: AdapterLogger;
  replay_store?: ReplayStore;
}
