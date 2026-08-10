import { computeActionDigest } from "./authority.js";
import { sha256Hex } from "./crypto.js";
import type { AuthorityDecision, AuthorityPacket } from "./authority-types.js";
import type {
  BuzzReceiptPublishRequest,
  BuzzReceiptReturnerConfig,
  ReceiptReturnLogEntry,
  ReceiptReturnLogger,
  ReceiptReturnRejectionCode,
  ReceiptReturnRequest,
  ReceiptReturnResult,
  ReceiptReturnStore,
  ReturnedReceipt,
} from "./receipt-types.js";
import type { TensionPacket } from "./types.js";

const RECEIPT_VERSION = "0.1" as const;
const DEFAULT_MAX_CONTENT_BYTES = 2_048;
const HEX_32 = /^[0-9a-f]{64}$/;

export class InMemoryReceiptReturnStore implements ReceiptReturnStore {
  readonly #values = new Map<string, ReturnedReceipt>();

  get(receiptId: string): ReturnedReceipt | undefined {
    const value = this.#values.get(receiptId);
    return value ? structuredClone(value) : undefined;
  }

  set(receiptId: string, receipt: ReturnedReceipt): void {
    this.#values.set(receiptId, structuredClone(receipt));
  }

  get size(): number {
    return this.#values.size;
  }
}

export class MemoryReceiptReturnLogger implements ReceiptReturnLogger {
  readonly entries: ReceiptReturnLogEntry[] = [];
  readonly #maxEntries: number;

  constructor(maxEntries = 256) {
    this.#maxEntries = Math.max(1, Math.floor(maxEntries));
  }

  write(entry: ReceiptReturnLogEntry): void {
    this.entries.push(structuredClone(entry));
    if (this.entries.length > this.#maxEntries) {
      this.entries.splice(0, this.entries.length - this.#maxEntries);
    }
  }
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "string" && entry.length > 0 && entry.length <= 2_048,
    )
  );
}

function validTensionPacket(value: unknown): value is TensionPacket {
  if (!value || typeof value !== "object") return false;
  const packet = value as Partial<TensionPacket>;
  return (
    typeof packet.packet_id === "string" &&
    packet.packet_id.length > 0 &&
    packet.packet_version === "0.1" &&
    packet.source_system === "buzz" &&
    typeof packet.source_relay === "string" &&
    typeof packet.source_community === "string" &&
    typeof packet.source_event_id === "string" &&
    HEX_32.test(packet.source_event_id) &&
    Boolean(packet.thread_context && typeof packet.thread_context === "object")
  );
}

function validAuthorityPacket(value: unknown): value is AuthorityPacket {
  if (!value || typeof value !== "object") return false;
  const packet = value as Partial<AuthorityPacket>;
  return (
    typeof packet.packet_id === "string" &&
    /^ap_[0-9a-f]{32}$/.test(packet.packet_id) &&
    packet.packet_version === "0.1" &&
    typeof packet.tension_packet_id === "string" &&
    typeof packet.action_digest === "string" &&
    HEX_32.test(packet.action_digest) &&
    Boolean(packet.action_intent && typeof packet.action_intent === "object") &&
    ["allow", "propose", "escalate", "block", "ratify"].includes(
      packet.decision ?? "",
    ) &&
    packet.execution_posture === "not_executed" &&
    validTimestamp(packet.evaluated_at) &&
    validStrings(packet.authority_basis)
  );
}

function validRequest(value: unknown): value is ReceiptReturnRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<ReceiptReturnRequest>;
  return (
    validTensionPacket(request.tension_packet) &&
    validAuthorityPacket(request.authority_packet) &&
    validTimestamp(request.returned_at) &&
    validStrings(request.proof_refs) &&
    Boolean(
      request.non_execution &&
        request.non_execution.posture === "not_executed" &&
        request.non_execution.tool_invocations === 0 &&
        validTimestamp(request.non_execution.verified_at) &&
        typeof request.non_execution.detail === "string" &&
        request.non_execution.detail.length > 0 &&
        request.non_execution.detail.length <= 2_048 &&
        validStrings(request.non_execution.evidence_refs),
    )
  );
}

function nextMove(decision: AuthorityDecision): string {
  switch (decision) {
    case "allow":
      return "Keep execution separate and require fresh evidence before claiming action.";
    case "propose":
      return "Review the proposal; no implementation or publication has occurred.";
    case "escalate":
      return "Route the protected boundary to the named approver before any change.";
    case "block":
      return "Preserve the denial and change the request or authority basis before retrying.";
    case "ratify":
      return "Obtain separate ratification evidence before any commitment or publication.";
  }
}

function receiptContent(
  decision: AuthorityDecision,
  authorityPacketId: string,
  receiptId: string,
): string {
  return [
    `PowerShift decision: ${decision.toUpperCase()}.`,
    "Consequence: not executed. This receipt returns the authority result; it grants no execution authority.",
    `Evidence: ${authorityPacketId} plus verified zero tool invocations.`,
    `Next: ${nextMove(decision)}`,
    `Receipt: ${receiptId}.`,
  ].join(" ");
}

function rejectionNextMove(code: ReceiptReturnRejectionCode): string {
  switch (code) {
    case "invalid_request":
      return "Correct the bounded receipt-return request before retrying.";
    case "relay_not_allowed":
      return "Use the exact approved loopback Buzz relay.";
    case "community_not_allowed":
      return "Use the approved synthetic Buzz community.";
    case "missing_thread_context":
      return "Provide the originating Buzz channel and source-event linkage.";
    case "packet_linkage_mismatch":
      return "Rebuild the receipt from the Authority Packet issued for this Tension Packet.";
    case "action_digest_mismatch":
      return "Re-evaluate the exact action before returning a decision.";
    case "missing_authority_basis":
      return "Preserve a non-empty authority basis in the returned decision.";
    case "missing_non_execution_evidence":
      return "Provide explicit zero-invocation and executor-absence evidence.";
    case "content_too_large":
      return "Reduce the generated human receipt without dropping its authority boundary.";
    case "transport_rejected":
      return "Inspect the local relay rejection and retry without changing the stable receipt identity.";
  }
}

export class BuzzReceiptReturner {
  readonly #allowedRelays: Set<string>;
  readonly #allowedCommunities: Set<string>;
  readonly #publisher: BuzzReceiptReturnerConfig["publisher"];
  readonly #store: ReceiptReturnStore;
  readonly #logger: ReceiptReturnLogger | undefined;
  readonly #maxContentBytes: number;
  readonly #inFlight = new Map<string, Promise<ReceiptReturnResult>>();

  constructor(config: BuzzReceiptReturnerConfig) {
    this.#allowedRelays = new Set(config.allowed_relays);
    this.#allowedCommunities = new Set(config.allowed_community_ids);
    this.#publisher = config.publisher;
    this.#store = config.store ?? new InMemoryReceiptReturnStore();
    this.#logger = config.logger;
    this.#maxContentBytes = Math.max(
      256,
      Math.min(config.max_content_bytes ?? DEFAULT_MAX_CONTENT_BYTES, 16_384),
    );
  }

  async returnReceipt(input: unknown): Promise<ReceiptReturnResult> {
    if (!validRequest(input)) {
      return this.#reject("invalid_request", input, []);
    }
    const request = input;
    const tension = request.tension_packet;
    const authority = request.authority_packet;

    if (!this.#allowedRelays.has(tension.source_relay)) {
      return this.#reject("relay_not_allowed", request, []);
    }
    if (!this.#allowedCommunities.has(tension.source_community)) {
      return this.#reject("community_not_allowed", request, []);
    }
    if (!tension.thread_context.channel_id) {
      return this.#reject("missing_thread_context", request, []);
    }
    if (authority.tension_packet_id !== tension.packet_id) {
      return this.#reject("packet_linkage_mismatch", request, []);
    }
    if (authority.authority_basis.length === 0) {
      return this.#reject("missing_authority_basis", request, []);
    }
    let computedDigest: string;
    try {
      computedDigest = await computeActionDigest(authority.action_intent);
    } catch {
      return this.#reject("invalid_request", request, []);
    }
    if (computedDigest !== authority.action_digest) {
      return this.#reject("action_digest_mismatch", request, [
        `computed-action-digest:${computedDigest}`,
      ]);
    }
    const nonExecutionEvidence = new Set(request.non_execution.evidence_refs);
    if (
      !nonExecutionEvidence.has("executor:absent") ||
      !nonExecutionEvidence.has("tool-invocations:0")
    ) {
      return this.#reject("missing_non_execution_evidence", request, []);
    }

    const receiptId = await this.#receiptId(request);
    const existing = this.#store.get(receiptId);
    if (existing) return this.#duplicate(existing, request.returned_at);
    const active = this.#inFlight.get(receiptId);
    if (active) {
      const result = await active;
      if (result.status === "published" || result.status === "duplicate") {
        return this.#duplicate(result.receipt, request.returned_at);
      }
      return result;
    }

    const operation = this.#publish(request, receiptId);
    this.#inFlight.set(receiptId, operation);
    try {
      return await operation;
    } finally {
      this.#inFlight.delete(receiptId);
    }
  }

  async #receiptId(request: ReceiptReturnRequest): Promise<string> {
    const digest = await sha256Hex(
      JSON.stringify({
        source_event_id: request.tension_packet.source_event_id,
        tension_packet_id: request.tension_packet.packet_id,
        authority_packet_id: request.authority_packet.packet_id,
        action_digest: request.authority_packet.action_digest,
        consequence: "not_executed",
        evidence_refs: [...request.non_execution.evidence_refs].sort(),
      }),
    );
    return `buzz_rcpt_${digest.slice(0, 32)}`;
  }

  async #publish(
    request: ReceiptReturnRequest,
    receiptId: string,
  ): Promise<ReceiptReturnResult> {
    const tension = request.tension_packet;
    const authority = request.authority_packet;
    const content = receiptContent(authority.decision, authority.packet_id, receiptId);
    if (new TextEncoder().encode(content).length > this.#maxContentBytes) {
      return this.#reject("content_too_large", request, []);
    }
    const sourceEventId = tension.source_event_id.toLowerCase();
    const rootEventId =
      tension.thread_context.root_event_id?.toLowerCase() ?? sourceEventId;
    const publishRequest: BuzzReceiptPublishRequest = {
      relay: tension.source_relay,
      community_id: tension.source_community,
      channel_id: tension.thread_context.channel_id!,
      source_event_id: sourceEventId,
      root_event_id: rootEventId,
      reply_to_event_id: sourceEventId,
      idempotency_key: receiptId,
      content,
    };
    const publication = await this.#publisher.publish(publishRequest);
    if (
      publication.status !== "accepted" ||
      !HEX_32.test(publication.event_id.toLowerCase()) ||
      !validTimestamp(publication.accepted_at)
    ) {
      return this.#reject(
        "transport_rejected",
        request,
        publication.evidence_refs,
      );
    }

    const receipt: ReturnedReceipt = {
      receipt_id: receiptId,
      receipt_version: RECEIPT_VERSION,
      source_event_id: sourceEventId,
      tension_packet_id: tension.packet_id,
      authority_packet_id: authority.packet_id,
      action_digest: authority.action_digest,
      decision: authority.decision,
      consequence: "not_executed",
      buzz_return_event_id: publication.event_id.toLowerCase(),
      lifecycle: {
        sent: {
          at: request.returned_at,
          transport: "buzz_nostr",
        },
        received: {
          at: publication.accepted_at,
          relay_event_id: publication.event_id.toLowerCase(),
          evidence_refs: structuredClone(publication.evidence_refs),
        },
        evaluated: {
          at: authority.evaluated_at,
          decision: authority.decision,
          authority_packet_id: authority.packet_id,
        },
        acted: {
          status: "not_executed",
          tool_invocations: 0,
          evidence_refs: structuredClone(request.non_execution.evidence_refs),
        },
        verified: {
          at: request.non_execution.verified_at,
          consequence: "verified_non_execution",
          evidence_refs: structuredClone(request.non_execution.evidence_refs),
        },
        closed: {
          at: publication.accepted_at,
          basis: "relay_acceptance_and_verified_non_execution",
        },
      },
      linkage_refs: [
        `buzz-event:${sourceEventId}`,
        `tension-packet:${tension.packet_id}`,
        `authority-packet:${authority.packet_id}`,
        `action-digest:${authority.action_digest}`,
        `buzz-return-event:${publication.event_id.toLowerCase()}`,
      ],
      human: {
        decision: authority.decision,
        consequence:
          "The PowerShift decision was returned to Buzz. No action was executed.",
        evidence_summary:
          "The local relay accepted the signed response and zero tool invocations were independently recorded.",
        next_move: nextMove(authority.decision),
      },
      machine: {
        relay: tension.source_relay,
        community_id: tension.source_community,
        channel_id: tension.thread_context.channel_id!,
        root_event_id: rootEventId,
        reply_to_event_id: sourceEventId,
        authority_basis: structuredClone(authority.authority_basis),
        proof_refs: structuredClone(request.proof_refs),
      },
    };
    this.#store.set(receiptId, receipt);
    this.#log({
      at: publication.accepted_at,
      outcome: "published",
      receipt_id: receiptId,
      source_event_id: sourceEventId,
      buzz_return_event_id: receipt.buzz_return_event_id,
    });
    return { status: "published", receipt, duplicate_safe: true };
  }

  #duplicate(receipt: ReturnedReceipt, at: string): ReceiptReturnResult {
    this.#log({
      at,
      outcome: "duplicate",
      receipt_id: receipt.receipt_id,
      source_event_id: receipt.source_event_id,
      buzz_return_event_id: receipt.buzz_return_event_id,
    });
    return {
      status: "duplicate",
      receipt,
      duplicate_safe: true,
      consequence: "No second Buzz event was published.",
    };
  }

  #reject(
    code: ReceiptReturnRejectionCode,
    input: unknown,
    evidenceRefs: string[],
  ): ReceiptReturnResult {
    const request =
      input && typeof input === "object"
        ? (input as Partial<ReceiptReturnRequest>)
        : undefined;
    this.#log({
      at:
        typeof request?.returned_at === "string"
          ? request.returned_at
          : "1970-01-01T00:00:00.000Z",
      outcome: "rejected",
      receipt_id: null,
      source_event_id:
        typeof request?.tension_packet?.source_event_id === "string"
          ? request.tension_packet.source_event_id
          : null,
      rejection_code: code,
    });
    return {
      status: "rejected",
      rejection: {
        code,
        consequence: "No receipt was closed and no execution occurred.",
        next_move: rejectionNextMove(code),
        evidence_refs: structuredClone(evidenceRefs),
      },
    };
  }

  #log(entry: ReceiptReturnLogEntry): void {
    this.#logger?.write(entry);
  }
}
