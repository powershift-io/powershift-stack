import {
  computeNostrEventId,
  sha256Hex,
  verifySchnorrSignature,
} from "./crypto.js";
import type {
  AcceptedIntake,
  ActorBinding,
  AdapterConfig,
  AdapterLogEntry,
  AdapterLogger,
  BuzzEvent,
  BuzzThreadContext,
  DualGrainReceipt,
  IntakeEnvelope,
  IntakeResult,
  RejectionCode,
  ReplayStore,
  StructuredRejection,
  TensionPacket,
} from "./types.js";

const ADAPTER_VERSION = "0.1" as const;
const DEFAULT_MAX_CONTENT_BYTES = 8_192;
const DEFAULT_MAX_TAGS = 64;
const DEFAULT_MAX_EVENT_BYTES = 65_536;
const DEFAULT_MAX_EVENT_AGE_SECONDS = 86_400;
const DEFAULT_MAX_FUTURE_SKEW_SECONDS = 300;
const HEX_32 = /^[0-9a-f]{64}$/;
const HEX_64 = /^[0-9a-f]{128}$/;

export class InMemoryReplayStore implements ReplayStore {
  readonly #values = new Map<string, AcceptedIntake>();

  get(key: string): AcceptedIntake | undefined {
    return this.#values.get(key);
  }

  set(key: string, value: AcceptedIntake): void {
    this.#values.set(key, value);
  }

  get size(): number {
    return this.#values.size;
  }
}

export class MemoryAdapterLogger implements AdapterLogger {
  readonly entries: AdapterLogEntry[] = [];
  readonly #maxEntries: number;

  constructor(maxEntries = 256) {
    this.#maxEntries = Math.max(1, Math.floor(maxEntries));
  }

  write(entry: AdapterLogEntry): void {
    this.entries.push(structuredClone(entry));
    if (this.entries.length > this.#maxEntries) {
      this.entries.splice(0, this.entries.length - this.#maxEntries);
    }
  }
}

function eventIdOrNull(event: unknown): string | null {
  if (!event || typeof event !== "object" || !("id" in event)) return null;
  return typeof event.id === "string" && HEX_32.test(event.id.toLowerCase())
    ? event.id.toLowerCase()
    : null;
}

function validIntakeEnvelope(value: unknown): value is IntakeEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<IntakeEnvelope>;
  return (
    typeof candidate.relay === "string" &&
    candidate.relay.length > 0 &&
    candidate.relay.length <= 2_048 &&
    typeof candidate.community_id === "string" &&
    candidate.community_id.length > 0 &&
    candidate.community_id.length <= 256 &&
    typeof candidate.observed_at === "string" &&
    candidate.observed_at.length > 0 &&
    candidate.observed_at.length <= 64 &&
    validEventShape(candidate.event)
  );
}

function rejectionSource(value: unknown): {
  relay: string;
  community_id: string;
} {
  if (!value || typeof value !== "object") {
    return { relay: "<invalid>", community_id: "<invalid>" };
  }
  const candidate = value as Partial<IntakeEnvelope>;
  return {
    relay:
      typeof candidate.relay === "string"
        ? candidate.relay.slice(0, 2_048)
        : "<invalid>",
    community_id:
      typeof candidate.community_id === "string"
        ? candidate.community_id.slice(0, 256)
        : "<invalid>",
  };
}

function validEventShape(event: unknown): event is BuzzEvent {
  if (!event || typeof event !== "object") return false;
  const candidate = event as Partial<BuzzEvent>;
  return (
    typeof candidate.id === "string" &&
    HEX_32.test(candidate.id) &&
    typeof candidate.pubkey === "string" &&
    HEX_32.test(candidate.pubkey) &&
    Number.isSafeInteger(candidate.created_at) &&
    candidate.created_at! >= 0 &&
    Number.isSafeInteger(candidate.kind) &&
    candidate.kind! >= 0 &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every(
      (tag) =>
        Array.isArray(tag) &&
        tag.every((value) => typeof value === "string"),
    ) &&
    typeof candidate.content === "string" &&
    typeof candidate.sig === "string" &&
    HEX_64.test(candidate.sig)
  );
}

function parseObservedAt(value: string): number | null {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? Math.floor(milliseconds / 1_000) : null;
}

function bindingState(
  binding: ActorBinding,
  observedAt: number,
):
  | "active"
  | "inactive"
  | "not_yet_valid"
  | "expired"
  | "invalid_dates" {
  if (binding.status !== "active") return "inactive";
  const validFrom = parseObservedAt(binding.valid_from);
  const validUntil = parseObservedAt(binding.valid_until);
  if (validFrom === null || validUntil === null || validFrom >= validUntil) {
    return "invalid_dates";
  }
  if (observedAt < validFrom) return "not_yet_valid";
  if (observedAt >= validUntil) return "expired";
  return "active";
}

function parseThreadContext(event: BuzzEvent): BuzzThreadContext {
  const channelId =
    event.tags.find((tag) => tag[0] === "h" && tag[1])?.[1] ?? null;
  const eventTags = event.tags.filter(
    (tag) => tag[0] === "e" && typeof tag[1] === "string" && HEX_32.test(tag[1]),
  );
  const explicitRoot =
    eventTags.find((tag) => tag[3] === "root")?.[1] ?? null;
  const explicitReply =
    eventTags.find((tag) => tag[3] === "reply")?.[1] ?? null;
  const rootEventId = explicitRoot ?? explicitReply;
  const nested = Boolean(
    explicitRoot && explicitReply && explicitRoot !== explicitReply,
  );
  return {
    channel_id: channelId,
    root_event_id: rootEventId,
    direct_reply_event_id: nested ? explicitReply : null,
    reply_semantics: nested ? "nested" : rootEventId ? "root_only" : "none",
    mentioned_pubkeys: [
      ...new Set(
        event.tags
          .filter(
            (tag) =>
              tag[0] === "p" &&
              typeof tag[1] === "string" &&
              HEX_32.test(tag[1].toLowerCase()),
          )
          .map((tag) => tag[1]!.toLowerCase()),
      ),
    ],
  };
}

function rejectionMessage(code: RejectionCode): {
  summary: string;
  nextMove: string;
} {
  switch (code) {
    case "relay_not_allowed":
      return {
        summary: "The source relay is outside the adapter allowlist.",
        nextMove: "Use the exact approved local relay.",
      };
    case "community_not_allowed":
      return {
        summary: "The source community is outside the adapter allowlist.",
        nextMove: "Use an approved synthetic community.",
      };
    case "invalid_event_shape":
      return {
        summary: "The source event does not match the bounded Buzz event contract.",
        nextMove: "Correct the event envelope before retrying.",
      };
    case "event_too_large":
      return {
        summary: "The source event exceeds the adapter's bounded intake limits.",
        nextMove: "Reduce content or tag count before retrying.",
      };
    case "invalid_event_id":
      return {
        summary: "The source event ID does not match its serialized payload.",
        nextMove: "Reject the event and inspect transport integrity.",
      };
    case "invalid_signature":
      return {
        summary: "The source event signature is invalid.",
        nextMove: "Reject the event and verify the signing identity.",
      };
    case "event_too_old":
      return {
        summary: "The source event is outside the accepted freshness window.",
        nextMove: "Submit a fresh signed event.",
      };
    case "event_from_future":
      return {
        summary: "The source event timestamp is beyond the allowed clock skew.",
        nextMove: "Correct clock state before retrying.",
      };
    case "unknown_binding":
      return {
        summary: "The signed Buzz identity has no canonical PowerShift binding.",
        nextMove: "Create and review an exact synthetic actor binding.",
      };
    case "ambiguous_binding":
      return {
        summary: "The signed Buzz identity resolves to multiple active bindings.",
        nextMove: "Resolve the binding conflict before retrying.",
      };
    case "binding_inactive":
      return {
        summary: "The canonical actor binding is inactive or malformed.",
        nextMove: "Review the binding status and validity window.",
      };
    case "binding_not_yet_valid":
      return {
        summary: "The canonical actor binding is not yet valid.",
        nextMove: "Wait for the reviewed validity window.",
      };
    case "binding_expired":
      return {
        summary: "The canonical actor binding has expired.",
        nextMove: "Review and renew the binding before retrying.",
      };
    case "unknown_authority_source":
      return {
        summary: "The actor binding references an unapproved authority source.",
        nextMove: "Review the synthetic authority-source allowlist.",
      };
  }
}

export class BuzzReadOnlyAdapter {
  readonly #allowedRelays: Set<string>;
  readonly #allowedCommunities: Set<string>;
  readonly #allowedAuthoritySources: Set<string>;
  readonly #bindings: ActorBinding[];
  readonly #maxContentBytes: number;
  readonly #maxTags: number;
  readonly #maxEventBytes: number;
  readonly #maxEventAgeSeconds: number;
  readonly #maxFutureSkewSeconds: number;
  readonly #logger: AdapterLogger | undefined;
  readonly #replayStore: ReplayStore;

  constructor(config: AdapterConfig) {
    this.#allowedRelays = new Set(config.allowed_relays);
    this.#allowedCommunities = new Set(config.allowed_community_ids);
    this.#allowedAuthoritySources = new Set(
      config.allowed_authority_source_refs,
    );
    this.#bindings = structuredClone(config.bindings);
    this.#maxContentBytes =
      config.max_content_bytes ?? DEFAULT_MAX_CONTENT_BYTES;
    this.#maxTags = config.max_tags ?? DEFAULT_MAX_TAGS;
    this.#maxEventBytes = config.max_event_bytes ?? DEFAULT_MAX_EVENT_BYTES;
    this.#maxEventAgeSeconds =
      config.max_event_age_seconds ?? DEFAULT_MAX_EVENT_AGE_SECONDS;
    this.#maxFutureSkewSeconds =
      config.max_future_skew_seconds ?? DEFAULT_MAX_FUTURE_SKEW_SECONDS;
    this.#logger = config.logger;
    this.#replayStore = config.replay_store ?? new InMemoryReplayStore();
  }

  async ingest(input: unknown): Promise<IntakeResult> {
    const candidate =
      input && typeof input === "object"
        ? (input as Partial<IntakeEnvelope>)
        : undefined;
    const sourceEventId = eventIdOrNull(candidate?.event);
    if (!validIntakeEnvelope(input)) {
      return this.#reject(
        "invalid_event_shape",
        rejectionSource(input),
        sourceEventId,
        typeof candidate?.observed_at === "string"
          ? candidate.observed_at
          : "1970-01-01T00:00:00.000Z",
      );
    }

    const envelope = input;
    const observedAt = parseObservedAt(envelope.observed_at);
    if (!this.#allowedRelays.has(envelope.relay)) {
      return this.#reject(
        "relay_not_allowed",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (!this.#allowedCommunities.has(envelope.community_id)) {
      return this.#reject(
        "community_not_allowed",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (observedAt === null) {
      return this.#reject(
        "invalid_event_shape",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }

    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(envelope.event.content).length;
    const eventBytes = encoder.encode(
      JSON.stringify([
        0,
        envelope.event.pubkey,
        envelope.event.created_at,
        envelope.event.kind,
        envelope.event.tags,
        envelope.event.content,
      ]),
    ).length;
    if (
      contentBytes > this.#maxContentBytes ||
      envelope.event.tags.length > this.#maxTags ||
      eventBytes > this.#maxEventBytes
    ) {
      return this.#reject(
        "event_too_large",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }

    const computedEventId = await computeNostrEventId(envelope.event);
    if (computedEventId !== envelope.event.id.toLowerCase()) {
      return this.#reject(
        "invalid_event_id",
        envelope,
        sourceEventId,
        envelope.observed_at,
        [`computed-event-id:${computedEventId}`],
      );
    }
    if (!(await verifySchnorrSignature(envelope.event))) {
      return this.#reject(
        "invalid_signature",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }

    const age = observedAt - envelope.event.created_at;
    if (age > this.#maxEventAgeSeconds) {
      return this.#reject(
        "event_too_old",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (age < -this.#maxFutureSkewSeconds) {
      return this.#reject(
        "event_from_future",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }

    const exactBindings = this.#bindings.filter(
      (binding) =>
        binding.relay === envelope.relay &&
        binding.community_id === envelope.community_id &&
        binding.buzz_pubkey.toLowerCase() === envelope.event.pubkey.toLowerCase(),
    );
    if (exactBindings.length === 0) {
      return this.#reject(
        "unknown_binding",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (exactBindings.length > 1) {
      return this.#reject(
        "ambiguous_binding",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }

    const binding = exactBindings[0]!;
    const state = bindingState(binding, observedAt);
    if (state === "inactive" || state === "invalid_dates") {
      return this.#reject(
        "binding_inactive",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (state === "not_yet_valid") {
      return this.#reject(
        "binding_not_yet_valid",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (state === "expired") {
      return this.#reject(
        "binding_expired",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }
    if (!this.#allowedAuthoritySources.has(binding.authority_source_ref)) {
      return this.#reject(
        "unknown_authority_source",
        envelope,
        sourceEventId,
        envelope.observed_at,
      );
    }

    const replayKey = `${envelope.relay}|${envelope.community_id}|${envelope.event.id.toLowerCase()}`;
    const existing = this.#replayStore.get(replayKey);
    if (existing) {
      this.#log({
        at: envelope.observed_at,
        level: "info",
        outcome: "replay",
        source_event_id: envelope.event.id.toLowerCase(),
        canonical_actor_id: binding.powershift_actor_id,
        packet_id: existing.packet.packet_id,
      });
      return {
        status: "replay",
        packet: existing.packet,
        receipt: existing.receipt,
        replay: {
          duplicate_source_event_id: envelope.event.id.toLowerCase(),
          original_packet_id: existing.packet.packet_id,
          original_receipt_id: existing.receipt.machine.receipt_id,
          consequence: "No duplicate packet or receipt was created.",
        },
      };
    }

    const packet = await this.#createPacket(envelope, binding);
    const receipt = await this.#createReceipt(packet, envelope.event);
    const accepted: AcceptedIntake = {
      status: "accepted",
      packet,
      receipt,
    };
    this.#replayStore.set(replayKey, accepted);
    this.#log({
      at: envelope.observed_at,
      level: "info",
      outcome: "accepted",
      source_event_id: envelope.event.id.toLowerCase(),
      canonical_actor_id: binding.powershift_actor_id,
      packet_id: packet.packet_id,
    });
    return accepted;
  }

  async #createPacket(
    envelope: IntakeEnvelope,
    binding: ActorBinding,
  ): Promise<TensionPacket> {
    const threadContext = parseThreadContext(envelope.event);
    const identityMaterial = JSON.stringify({
      source_relay: envelope.relay,
      source_community: envelope.community_id,
      source_event_id: envelope.event.id.toLowerCase(),
      binding_ref: binding.binding_id,
      authority_source_ref: binding.authority_source_ref,
    });
    const packetDigest = await sha256Hex(identityMaterial);
    const channelSummary = threadContext.channel_id
      ? `channel ${threadContext.channel_id}`
      : "an unscoped channel";
    return {
      packet_id: `tp_${packetDigest.slice(0, 32)}`,
      packet_version: ADAPTER_VERSION,
      source_system: "buzz",
      source_relay: envelope.relay,
      source_community: envelope.community_id,
      source_event_id: envelope.event.id.toLowerCase(),
      source_event_kind: envelope.event.kind,
      source_pubkey: envelope.event.pubkey.toLowerCase(),
      source_created_at: new Date(
        envelope.event.created_at * 1_000,
      ).toISOString(),
      ingested_at: new Date(envelope.observed_at).toISOString(),
      canonical_actor_id: binding.powershift_actor_id,
      binding_ref: binding.binding_id,
      raw_signal_digest: await sha256Hex(envelope.event.content),
      summary: `Verified Buzz signal from ${binding.powershift_actor_id} in ${channelSummary}.`,
      classification: envelope.event.kind === 9 ? "buzz_message" : "buzz_event",
      affected_objects: [],
      proposed_route: "authority_evaluator",
      provenance_refs: [
        `buzz-relay:${envelope.relay}`,
        `buzz-community:${envelope.community_id}`,
        `buzz-event:${envelope.event.id.toLowerCase()}`,
        `actor-binding:${binding.binding_id}`,
        `authority-source:${binding.authority_source_ref}`,
      ],
      freshness_state: "fresh",
      replay_state: "first_seen",
      thread_context: threadContext,
    };
  }

  async #createReceipt(
    packet: TensionPacket,
    sourceEvent: BuzzEvent,
  ): Promise<DualGrainReceipt> {
    const receiptDigest = await sha256Hex(
      JSON.stringify({
        packet_id: packet.packet_id,
        source_event_id: packet.source_event_id,
        outcome: "accepted",
      }),
    );
    return {
      human: {
        decision: "accepted_for_read_only_intake",
        evidence_summary: `Verified a signed Buzz signal from ${packet.canonical_actor_id} against an active synthetic actor binding.`,
        consequence:
          "A read-only Tension Packet was created; no action was executed.",
        next_move: "Evaluate authority in a separate fail-closed phase.",
      },
      machine: {
        adapter_version: ADAPTER_VERSION,
        receipt_id: `rcpt_${receiptDigest.slice(0, 32)}`,
        source_event_id: packet.source_event_id,
        source_pubkey: packet.source_pubkey,
        source_signature: sourceEvent.sig.toLowerCase(),
        source_created_at: packet.source_created_at,
        ingested_at: packet.ingested_at,
        source_tags: structuredClone(sourceEvent.tags),
        packet_id: packet.packet_id,
        packet_fields: structuredClone(packet),
        event_id_verified: true,
        signature_verified: true,
        binding_ref: packet.binding_ref,
        replay_state: "first_seen",
        thread_context: packet.thread_context,
        evidence_refs: packet.provenance_refs,
      },
    };
  }

  #reject(
    code: RejectionCode,
    source: { relay: string; community_id: string },
    sourceEventId: string | null,
    at: string,
    evidenceRefs: string[] = [],
  ): IntakeResult {
    const copy = rejectionMessage(code);
    const rejection: StructuredRejection = {
      code,
      human: {
        summary: copy.summary,
        consequence: "No packet was created and no action was performed.",
        next_move: copy.nextMove,
      },
      machine: {
        adapter_version: ADAPTER_VERSION,
        relay: source.relay,
        community_id: source.community_id,
        source_event_id: sourceEventId,
        evidence_refs: evidenceRefs,
      },
    };
    this.#log({
      at,
      level: "warn",
      outcome: "rejected",
      source_event_id: sourceEventId,
      rejection_code: code,
    });
    return { status: "rejected", rejection };
  }

  #log(entry: AdapterLogEntry): void {
    const parsedAt = Date.parse(entry.at);
    this.#logger?.write({
      ...entry,
      at: Number.isFinite(parsedAt)
        ? new Date(parsedAt).toISOString()
        : "1970-01-01T00:00:00.000Z",
      ...(entry.canonical_actor_id
        ? { canonical_actor_id: entry.canonical_actor_id.slice(0, 128) }
        : {}),
    });
  }
}
