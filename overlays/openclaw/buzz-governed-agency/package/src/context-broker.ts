import { sha256Hex } from "./crypto.js";
import type {
  AuthorizedContextBrokerConfig,
  AuthorizedContextCitation,
  AuthorizedContextRequest,
  ContextBrokerRejectionCode,
  ContextBrokerResult,
} from "./context-broker-types.js";

const DEFAULT_MAX_SOURCES = 8;
const DEFAULT_MAX_CONTEXT_BYTES = 16_384;
const MAX_STRING = 2_048;
const HEX_32 = /^[0-9a-f]{64}$/;

function text(value: unknown, max = MAX_STRING): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function instant(value: unknown): boolean {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function boundedStrings(value: unknown, maxItems: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= maxItems &&
    value.every((entry) => text(entry, 512)) &&
    new Set(value).size === value.length
  );
}

function validRequest(value: unknown, maxSources: number, maxBytes: number): value is AuthorizedContextRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<AuthorizedContextRequest>;
  return (
    text(request.request_id, 256) &&
    text(request.room_id, 256) &&
    text(request.tension_packet_id, 256) &&
    text(request.canonical_actor_id, 256) &&
    text(request.mind_id, 256) &&
    text(request.role_id, 256) &&
    text(request.lane_id, 256) &&
    boundedStrings(request.requested_source_ids, maxSources) &&
    boundedStrings(request.authority_refs, 32) &&
    instant(request.requested_at) &&
    Number.isInteger(request.max_bytes) &&
    Number(request.max_bytes) > 0 &&
    Number(request.max_bytes) <= maxBytes
  );
}

function nextMove(code: ContextBrokerRejectionCode): string {
  switch (code) {
    case "source_unknown":
      return "Remove the unknown source or add it through a separately reviewed source contract.";
    case "source_unavailable":
      return "Restore the exact approved source before retrying the same bounded request.";
    case "source_digest_mismatch":
      return "Reconcile the source version and approve its new digest before retrieval.";
    case "actor_not_allowed":
    case "mind_not_allowed":
    case "role_not_allowed":
    case "lane_not_allowed":
    case "authority_missing":
      return "Correct the explicit actor, Mind, role, lane, or authority contract; do not infer access.";
    case "context_budget_exceeded":
      return "Reduce the approved source set or issue a separately reviewed larger budget.";
    case "invalid_request":
      return "Submit a complete, bounded context request.";
  }
}

export class AuthorizedContextBroker {
  readonly #sources = new Map<string, AuthorizedContextBrokerConfig["sources"][number]>();
  readonly #maxSources: number;
  readonly #maxContextBytes: number;

  constructor(config: AuthorizedContextBrokerConfig) {
    this.#maxSources = Math.max(1, Math.min(config.max_sources ?? DEFAULT_MAX_SOURCES, DEFAULT_MAX_SOURCES));
    this.#maxContextBytes = Math.max(
      1,
      Math.min(config.max_context_bytes ?? DEFAULT_MAX_CONTEXT_BYTES, DEFAULT_MAX_CONTEXT_BYTES),
    );
    for (const source of structuredClone(config.sources)) {
      if (!text(source.source_id, 256) || this.#sources.has(source.source_id)) {
        throw new Error("Context source identifiers must be unique and bounded.");
      }
      this.#sources.set(source.source_id, source);
    }
  }

  async retrieve(input: unknown): Promise<ContextBrokerResult> {
    if (!validRequest(input, this.#maxSources, this.#maxContextBytes)) {
      return this.#reject("invalid_request", null);
    }
    const request = structuredClone(input);
    const citations: AuthorizedContextCitation[] = [];
    let contextBytes = 0;

    for (const sourceId of request.requested_source_ids) {
      const source = this.#sources.get(sourceId);
      if (!source) return this.#reject("source_unknown", request);
      if (source.status !== "active") return this.#reject("source_unavailable", request, sourceId);
      if (!HEX_32.test(source.content_sha256) || (await sha256Hex(source.content)) !== source.content_sha256) {
        return this.#reject("source_digest_mismatch", request, sourceId);
      }
      if (!source.canonical_actor_ids.includes(request.canonical_actor_id)) {
        return this.#reject("actor_not_allowed", request, sourceId);
      }
      if (!source.allowed_mind_ids.includes(request.mind_id)) {
        return this.#reject("mind_not_allowed", request, sourceId);
      }
      if (!source.allowed_role_ids.includes(request.role_id)) {
        return this.#reject("role_not_allowed", request, sourceId);
      }
      if (!source.allowed_lane_ids.includes(request.lane_id)) {
        return this.#reject("lane_not_allowed", request, sourceId);
      }
      if (!source.required_authority_refs.every((entry) => request.authority_refs.includes(entry))) {
        return this.#reject("authority_missing", request, sourceId);
      }

      const excerptBytes = Buffer.byteLength(source.content, "utf8");
      contextBytes += excerptBytes;
      if (contextBytes > request.max_bytes || contextBytes > this.#maxContextBytes) {
        return this.#reject("context_budget_exceeded", request, sourceId);
      }
      citations.push({
        source_id: source.source_id,
        source_uri: source.source_uri,
        source_version_ref: source.source_version_ref,
        content_sha256: source.content_sha256,
        excerpt: source.content,
        excerpt_bytes: excerptBytes,
        privacy_tier: source.privacy_tier,
        sensitivity_tier: source.sensitivity_tier,
        retention_policy: source.retention_policy,
        authority_refs: structuredClone(source.required_authority_refs),
      });
    }

    const receiptMaterial = JSON.stringify({ request, citations });
    const receiptId = `context_rcpt_${(await sha256Hex(receiptMaterial)).slice(0, 32)}`;
    return {
      status: "authorized",
      duplicate_safe: true,
      receipt: {
        receipt_id: receiptId,
        receipt_version: "0.1",
        request_id: request.request_id,
        room_id: request.room_id,
        tension_packet_id: request.tension_packet_id,
        canonical_actor_id: request.canonical_actor_id,
        mind_id: request.mind_id,
        role_id: request.role_id,
        lane_id: request.lane_id,
        requested_source_ids: structuredClone(request.requested_source_ids),
        citations,
        context_bytes: contextBytes,
        retrieval_count: citations.length,
        promotion_count: 0,
        private_context_refs: [],
        cross_mind_context_refs: [],
        execution_posture: "not_executed",
        authority_transfer: "none",
        evidence_refs: [
          `context-request:${request.request_id}`,
          `room:${request.room_id}`,
          `actor:${request.canonical_actor_id}`,
          `mind:${request.mind_id}`,
          `role:${request.role_id}`,
          `lane:${request.lane_id}`,
          "context-promotion:none",
          "private-context:none",
          "cross-mind-context:none",
        ],
      },
    };
  }

  #reject(
    code: ContextBrokerRejectionCode,
    request: AuthorizedContextRequest | null,
    sourceId?: string,
  ): ContextBrokerResult {
    return {
      status: "rejected",
      rejection: {
        code,
        consequence: "No context was released, promoted, or written.",
        next_move: nextMove(code),
        evidence_refs: [
          `context-request:${request?.request_id ?? "invalid"}`,
          `context-source:${sourceId ?? "none"}`,
          "context-release:none",
          "context-promotion:none",
        ],
      },
    };
  }
}
