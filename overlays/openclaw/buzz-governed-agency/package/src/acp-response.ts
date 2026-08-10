import {
  sha256Hex,
  verifyNostrEventId,
  verifySchnorrSignature,
} from "./crypto.js";
import type {
  AcpResponseReturnLogEntry,
  AcpResponseReturnLogger,
  AcpResponseReturnRejectionCode,
  AcpResponseReturnRequest,
  AcpResponseReturnResult,
  AcpResponseReturnStore,
  AcpTranscriptExtractionRequest,
  AcpTranscriptExtractionResult,
  BuzzAcpResponseReturnerConfig,
  CompletedOpenClawTurn,
  OpenClawAcpBinding,
  ReturnedAcpResponse,
} from "./acp-response-types.js";
import type { BuzzEvent } from "./types.js";

const HEX_32 = /^[0-9a-f]{64}$/;
const DEFAULT_MAX_CONTENT_BYTES = 16_384;
const DEFAULT_MAX_RETURN_DELAY_SECONDS = 300;

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object"
    ? (value as RecordValue)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isoTimestamp(value: unknown): string | null {
  const text = asString(value);
  return text && Number.isFinite(Date.parse(text)) ? text : null;
}

function messageText(message: RecordValue): string | null {
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return null;
  const values = message.content
    .map((item) => asRecord(item))
    .filter((item): item is RecordValue => Boolean(item))
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string);
  return values.length > 0 ? values.join("") : null;
}

function messageId(entry: RecordValue, message: RecordValue): string | null {
  return (
    asString(message.id) ??
    asString(entry.id) ??
    asString(message.idempotencyKey)
  );
}

function entryTimestamp(entry: RecordValue, message: RecordValue): string | null {
  const raw = entry.timestamp ?? message.timestamp;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(raw < 10_000_000_000 ? raw * 1_000 : raw).toISOString();
  }
  return isoTimestamp(raw);
}

function provenanceMatches(message: RecordValue): boolean {
  const provenance = asRecord(message.provenance);
  const openclaw = asRecord(message.__openclaw);
  return (
    message.sourceChannel === "acp" &&
    provenance?.kind === "external_user" &&
    provenance.sourceChannel === "acp" &&
    provenance.sourceTool === "openclaw_acp" &&
    openclaw?.mirrorOrigin === "codex-app-server"
  );
}

function contentCarriesChannel(content: string, channelId: string): boolean {
  return (
    content.includes(`Channel ID: ${channelId}`) ||
    content.includes(`(#${channelId})`) ||
    content.includes(`[\"h\",\"${channelId}\"]`)
  );
}

function assistantMirrorMatches(message: RecordValue): boolean {
  const openclaw = asRecord(message.__openclaw);
  return openclaw?.mirrorOrigin === "codex-app-server";
}

function collectToolCalls(message: RecordValue): { call_id: string; name: string }[] {
  if (!Array.isArray(message.content)) return [];
  const calls: { call_id: string; name: string }[] = [];
  for (const raw of message.content) {
    const item = asRecord(raw);
    if (!item || item.type !== "toolCall") continue;
    const callId = asString(item.id);
    const name = asString(item.name);
    if (callId && name) calls.push({ call_id: callId, name });
  }
  return calls;
}

function toolResult(entry: RecordValue): { call_id: string; result: "ok" | "error" } | null {
  const message = asRecord(entry.message);
  if (!message || message.role !== "toolResult") return null;
  const callId = asString(message.toolCallId) ?? asString(message.call_id);
  if (!callId) return null;
  return {
    call_id: callId,
    result: message.isError === true ? "error" : "ok",
  };
}

export async function extractCompletedOpenClawTurn(
  input: AcpTranscriptExtractionRequest,
): Promise<AcpTranscriptExtractionResult> {
  if (
    !input ||
    !Array.isArray(input.entries) ||
    !HEX_32.test(input.source_event_id) ||
    !input.channel_id ||
    !input.openclaw_agent_id ||
    !input.openclaw_session_key ||
    !input.openclaw_session_id ||
    !input.transcript_evidence_ref
  ) {
    return { status: "rejected", code: "invalid_transcript", detail: "The extraction request is incomplete." };
  }

  const entries = input.entries.map(asRecord);
  const header = entries.find((entry) => entry?.type === "session");
  if (!header || header.id !== input.openclaw_session_id) {
    return { status: "rejected", code: "session_mismatch", detail: "The transcript header does not match the bound session ID." };
  }

  const marker = `Event ID: ${input.source_event_id}`;
  const candidates: number[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const message = entry ? asRecord(entry.message) : null;
    if (message?.role === "user" && messageText(message)?.includes(marker)) {
      candidates.push(index);
    }
  }
  if (candidates.length === 0) {
    return { status: "rejected", code: "source_event_not_found", detail: "No ACP user turn contains the exact source event ID." };
  }
  if (candidates.length !== 1) {
    return { status: "rejected", code: "ambiguous_source_event", detail: "More than one ACP user turn contains the source event ID." };
  }

  const userIndex = candidates[0] as number;
  const userEntry = entries[userIndex] as RecordValue;
  const userMessage = asRecord(userEntry.message) as RecordValue;
  if (!provenanceMatches(userMessage)) {
    return { status: "rejected", code: "transcript_provenance_invalid", detail: "The source turn did not arrive through the required OpenClaw ACP mirror." };
  }
  const userContent = messageText(userMessage) as string;
  if (!contentCarriesChannel(userContent, input.channel_id)) {
    return { status: "rejected", code: "transcript_provenance_invalid", detail: "The transcript channel does not match the expected Buzz channel." };
  }

  const calls = new Map<string, { call_id: string; name: string; result: "ok" | "error" | "missing" }>();
  let finalEntry: RecordValue | null = null;
  let finalMessage: RecordValue | null = null;
  for (let index = userIndex + 1; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    const message = asRecord(entry.message);
    if (!message) continue;
    if (message.role === "user") break;
    if (message.role === "assistant") {
      for (const call of collectToolCalls(message)) {
        calls.set(call.call_id, { ...call, result: "missing" });
      }
      if (message.stopReason === "stop" && messageText(message)) {
        finalEntry = entry;
        finalMessage = message;
      }
    }
    const result = toolResult(entry);
    if (result && calls.has(result.call_id)) {
      const call = calls.get(result.call_id) as { call_id: string; name: string; result: "ok" | "error" | "missing" };
      calls.set(result.call_id, { ...call, result: result.result });
    }
  }

  if (!finalEntry || !finalMessage || !assistantMirrorMatches(finalMessage)) {
    return { status: "rejected", code: "incomplete_turn", detail: "No completed mirrored assistant turn follows the source event." };
  }
  const assistantText = messageText(finalMessage) as string;
  const promptedAt = entryTimestamp(userEntry, userMessage);
  const completedAt = entryTimestamp(finalEntry, finalMessage);
  const userMessageId = messageId(userEntry, userMessage);
  const assistantMessageId = messageId(finalEntry, finalMessage);
  const idempotencyKey = asString(finalMessage.idempotencyKey);
  const provider = asString(finalMessage.provider);
  const model = asString(finalMessage.model);
  if (!promptedAt || !completedAt || !userMessageId || !assistantMessageId || !idempotencyKey || !provider || !model) {
    return { status: "rejected", code: "incomplete_turn", detail: "The completed turn lacks stable IDs, timestamps, provider, or model evidence." };
  }

  const turn: CompletedOpenClawTurn = {
    source_event_id: input.source_event_id,
    channel_id: input.channel_id,
    openclaw_agent_id: input.openclaw_agent_id,
    openclaw_session_key: input.openclaw_session_key,
    openclaw_session_id: input.openclaw_session_id,
    user_message_id: userMessageId,
    assistant_message_id: assistantMessageId,
    assistant_idempotency_key: idempotencyKey,
    assistant_text: assistantText,
    assistant_text_sha256: await sha256Hex(assistantText),
    provider,
    model,
    prompted_at: promptedAt,
    completed_at: completedAt,
    stop_reason: "stop",
    provenance: {
      source_channel: "acp",
      source_tool: "openclaw_acp",
      mirror_origin: "codex-app-server",
      evidence_mode: "meta+receipt",
      transcript_evidence_ref: input.transcript_evidence_ref,
    },
    tools: Array.from(calls.values()),
    execution_posture: "not_executed",
    authority_transfer: "none",
  };
  return { status: "completed", turn };
}

export class InMemoryAcpResponseReturnStore implements AcpResponseReturnStore {
  readonly #values = new Map<string, ReturnedAcpResponse>();

  getBySourceEvent(sourceEventId: string): ReturnedAcpResponse | undefined {
    const value = this.#values.get(sourceEventId);
    return value ? structuredClone(value) : undefined;
  }

  set(response: ReturnedAcpResponse): void {
    this.#values.set(response.source_event_id, structuredClone(response));
  }

  get size(): number {
    return this.#values.size;
  }
}

export class MemoryAcpResponseReturnLogger implements AcpResponseReturnLogger {
  readonly entries: AcpResponseReturnLogEntry[] = [];
  readonly #maxEntries: number;

  constructor(maxEntries = 256) {
    this.#maxEntries = Math.max(1, Math.floor(maxEntries));
  }

  write(entry: AcpResponseReturnLogEntry): void {
    this.entries.push(structuredClone(entry));
    if (this.entries.length > this.#maxEntries) {
      this.entries.splice(0, this.entries.length - this.#maxEntries);
    }
  }
}

function validEventShape(event: unknown): event is BuzzEvent {
  const value = asRecord(event);
  return Boolean(
    value &&
      HEX_32.test(String(value.id)) &&
      HEX_32.test(String(value.pubkey)) &&
      typeof value.created_at === "number" &&
      Number.isInteger(value.kind) &&
      Array.isArray(value.tags) &&
      typeof value.content === "string" &&
      /^[0-9a-f]{128}$/.test(String(value.sig)),
  );
}

function validTurn(turn: unknown): turn is CompletedOpenClawTurn {
  const value = asRecord(turn);
  const provenance = value ? asRecord(value.provenance) : null;
  return Boolean(
    value &&
      HEX_32.test(String(value.source_event_id)) &&
      asString(value.channel_id) &&
      asString(value.openclaw_agent_id) &&
      asString(value.openclaw_session_key) &&
      asString(value.openclaw_session_id) &&
      asString(value.user_message_id) &&
      asString(value.assistant_message_id) &&
      asString(value.assistant_idempotency_key) &&
      typeof value.assistant_text === "string" &&
      value.assistant_text.length > 0 &&
      HEX_32.test(String(value.assistant_text_sha256)) &&
      asString(value.provider) &&
      asString(value.model) &&
      isoTimestamp(value.prompted_at) &&
      isoTimestamp(value.completed_at) &&
      value.stop_reason === "stop" &&
      provenance?.source_channel === "acp" &&
      provenance.source_tool === "openclaw_acp" &&
      provenance.mirror_origin === "codex-app-server" &&
      provenance.evidence_mode === "meta+receipt" &&
      asString(provenance.transcript_evidence_ref) &&
      Array.isArray(value.tools) &&
      value.tools.every((tool) => {
        const observation = asRecord(tool);
        return Boolean(
          observation &&
            asString(observation.call_id) &&
            asString(observation.name) &&
            ["ok", "error", "missing"].includes(String(observation.result)),
        );
      }) &&
      value.execution_posture === "not_executed" &&
      value.authority_transfer === "none",
  );
}

function exactBindingMatches(binding: OpenClawAcpBinding, request: AcpResponseReturnRequest): boolean {
  const turn = request.turn;
  return (
    binding.relay === request.relay &&
    binding.community_id === request.community_id &&
    binding.openclaw_agent_id === turn.openclaw_agent_id &&
    binding.openclaw_session_key === turn.openclaw_session_key &&
    binding.openclaw_session_id === turn.openclaw_session_id
  );
}

function hasTag(event: BuzzEvent, name: string, value: string, marker?: string): boolean {
  return event.tags.some(
    (tag) => tag[0] === name && tag[1] === value && (marker === undefined || tag[3] === marker),
  );
}

function nextMove(code: AcpResponseReturnRejectionCode): string {
  const moves: Record<AcpResponseReturnRejectionCode, string> = {
    invalid_request: "Correct the bounded response-return request before retrying.",
    relay_not_allowed: "Use the exact approved loopback Buzz relay.",
    community_not_allowed: "Use the approved synthetic Buzz community.",
    channel_not_allowed: "Use a Buzz channel explicitly allowed by the session binding.",
    source_event_invalid: "Supply the exact valid originating Buzz event.",
    source_signature_invalid: "Reject the source and recover it from the trusted Buzz relay.",
    binding_not_found: "Create one explicit Mind-to-session binding before retrying.",
    binding_ambiguous: "Retire overlapping bindings so one exact session owns the response.",
    binding_inactive: "Activate a time-valid binding under the gate card.",
    session_mismatch: "Return only the completed turn from the exact bound OpenClaw session.",
    transcript_provenance_invalid: "Provide ACP mirror provenance and the transcript evidence reference.",
    assistant_digest_mismatch: "Recompute the digest from the exact completed assistant text.",
    incomplete_turn: "Wait for a terminal assistant turn with stable IDs before publishing.",
    tool_boundary_violation: "Remove mutating or unapproved tools from the read-only turn.",
    execution_boundary_violation: "Preserve not-executed posture and no authority transfer.",
    stale_turn: "Return the response within the binding and freshness windows.",
    content_too_large: "Reduce the response without weakening its governance boundary.",
    conflicting_replay: "Investigate the second result for the already-closed source event.",
    transport_rejected: "Inspect the Buzz transport rejection and retry the same stable response.",
    returned_event_invalid: "Reject the publication and require a correctly signed, threaded Buzz event.",
  };
  return moves[code];
}

export class BuzzAcpResponseReturner {
  readonly #allowedRelays: Set<string>;
  readonly #allowedCommunities: Set<string>;
  readonly #bindings: OpenClawAcpBinding[];
  readonly #publisher: BuzzAcpResponseReturnerConfig["publisher"];
  readonly #store: AcpResponseReturnStore;
  readonly #logger: AcpResponseReturnLogger | undefined;
  readonly #maxContentBytes: number;
  readonly #maxReturnDelaySeconds: number;
  readonly #responseEventKind: number;
  readonly #inFlight = new Map<string, { fingerprint: string; operation: Promise<AcpResponseReturnResult> }>();

  constructor(config: BuzzAcpResponseReturnerConfig) {
    this.#allowedRelays = new Set(config.allowed_relays);
    this.#allowedCommunities = new Set(config.allowed_community_ids);
    this.#bindings = structuredClone(config.bindings);
    this.#publisher = config.publisher;
    this.#store = config.store ?? new InMemoryAcpResponseReturnStore();
    this.#logger = config.logger;
    this.#maxContentBytes = Math.max(256, Math.min(config.max_content_bytes ?? DEFAULT_MAX_CONTENT_BYTES, 65_536));
    this.#maxReturnDelaySeconds = Math.max(1, config.max_return_delay_seconds ?? DEFAULT_MAX_RETURN_DELAY_SECONDS);
    this.#responseEventKind = config.response_event_kind ?? 9;
  }

  async returnResponse(input: unknown): Promise<AcpResponseReturnResult> {
    if (!input || typeof input !== "object") return this.#reject("invalid_request", null, []);
    const request = input as AcpResponseReturnRequest;
    if (
      !asString(request.relay) ||
      !asString(request.community_id) ||
      !validEventShape(request.source_event) ||
      !validTurn(request.turn) ||
      !isoTimestamp(request.returned_at) ||
      !Array.isArray(request.proof_refs) ||
      !request.proof_refs.every((ref) => typeof ref === "string" && ref.length > 0)
    ) {
      return this.#reject("invalid_request", request, []);
    }
    const sourceId = request.source_event.id;
    if (!this.#allowedRelays.has(request.relay)) return this.#reject("relay_not_allowed", request, []);
    if (!this.#allowedCommunities.has(request.community_id)) return this.#reject("community_not_allowed", request, []);
    if (!(await verifyNostrEventId(request.source_event))) return this.#reject("source_event_invalid", request, []);
    if (!(await verifySchnorrSignature(request.source_event))) return this.#reject("source_signature_invalid", request, []);
    if (request.turn.source_event_id !== sourceId) return this.#reject("session_mismatch", request, []);

    const matches = this.#bindings.filter((binding) => exactBindingMatches(binding, request));
    if (matches.length === 0) return this.#reject("binding_not_found", request, []);
    if (matches.length > 1) return this.#reject("binding_ambiguous", request, []);
    const binding = matches[0] as OpenClawAcpBinding;
    const returnedAt = Date.parse(request.returned_at);
    if (
      !HEX_32.test(binding.buzz_agent_pubkey) ||
      !isoTimestamp(binding.valid_from) ||
      !isoTimestamp(binding.valid_until) ||
      binding.status !== "active" ||
      returnedAt < Date.parse(binding.valid_from) ||
      returnedAt > Date.parse(binding.valid_until)
    ) {
      return this.#reject("binding_inactive", request, []);
    }
    if (!binding.allowed_channel_ids.includes(request.turn.channel_id)) return this.#reject("channel_not_allowed", request, []);
    if (!hasTag(request.source_event, "h", request.turn.channel_id)) return this.#reject("channel_not_allowed", request, []);
    if (!binding.allowed_source_pubkeys.includes(request.source_event.pubkey)) return this.#reject("binding_not_found", request, []);
    if (
      request.turn.provenance.source_channel !== "acp" ||
      request.turn.provenance.source_tool !== "openclaw_acp" ||
      request.turn.provenance.mirror_origin !== "codex-app-server" ||
      request.turn.provenance.evidence_mode !== "meta+receipt"
    ) {
      return this.#reject("transcript_provenance_invalid", request, []);
    }
    if ((await sha256Hex(request.turn.assistant_text)) !== request.turn.assistant_text_sha256) {
      return this.#reject("assistant_digest_mismatch", request, []);
    }
    if (new TextEncoder().encode(request.turn.assistant_text).length > this.#maxContentBytes) {
      return this.#reject("content_too_large", request, []);
    }
    const promptedAt = Date.parse(request.turn.prompted_at);
    const completedAt = Date.parse(request.turn.completed_at);
    if (
      promptedAt > completedAt ||
      completedAt > returnedAt ||
      (returnedAt - completedAt) / 1_000 > this.#maxReturnDelaySeconds
    ) {
      return this.#reject("stale_turn", request, []);
    }
    if (request.turn.execution_posture !== "not_executed" || request.turn.authority_transfer !== "none") {
      return this.#reject("execution_boundary_violation", request, []);
    }
    const allowedTools = new Set(binding.allowed_read_only_tools);
    if (request.turn.tools.some((tool) => !allowedTools.has(tool.name) || tool.result === "missing")) {
      return this.#reject("tool_boundary_violation", request, []);
    }

    const fingerprint = await this.#fingerprint(request);
    const existing = this.#store.getBySourceEvent(sourceId);
    if (existing) {
      return existing.binding_id === binding.binding_id &&
        existing.openclaw_agent_id === request.turn.openclaw_agent_id &&
        existing.openclaw_session_id === request.turn.openclaw_session_id &&
        existing.assistant_text_sha256 === request.turn.assistant_text_sha256 &&
        existing.assistant_message_id === request.turn.assistant_message_id &&
        existing.assistant_idempotency_key === request.turn.assistant_idempotency_key
        ? this.#duplicate(existing, request.returned_at)
        : this.#reject("conflicting_replay", request, [`closed-response:${existing.response_return_id}`]);
    }
    const active = this.#inFlight.get(sourceId);
    if (active) {
      if (active.fingerprint !== fingerprint) return this.#reject("conflicting_replay", request, ["source-event:in-flight"]);
      const result = await active.operation;
      return result.status === "published" || result.status === "duplicate"
        ? this.#duplicate(result.response, request.returned_at)
        : result;
    }

    const operation = this.#publish(request, binding, fingerprint);
    this.#inFlight.set(sourceId, { fingerprint, operation });
    try {
      return await operation;
    } finally {
      this.#inFlight.delete(sourceId);
    }
  }

  async #fingerprint(request: AcpResponseReturnRequest): Promise<string> {
    return sha256Hex(JSON.stringify([
      request.source_event.id,
      request.turn.openclaw_session_id,
      request.turn.assistant_message_id,
      request.turn.assistant_idempotency_key,
      request.turn.assistant_text_sha256,
    ]));
  }

  async #publish(
    request: AcpResponseReturnRequest,
    binding: OpenClawAcpBinding,
    fingerprint: string,
  ): Promise<AcpResponseReturnResult> {
    const sessionKeyDigest = await sha256Hex(request.turn.openclaw_session_key);
    const responseReturnId = `acp_response_${fingerprint.slice(0, 32)}`;
    const provenance = {
      version: "0.1" as const,
      binding_id: binding.binding_id,
      source_event_id: request.source_event.id,
      openclaw_agent_id: request.turn.openclaw_agent_id,
      openclaw_session_id: request.turn.openclaw_session_id,
      openclaw_session_key_sha256: sessionKeyDigest,
      user_message_id: request.turn.user_message_id,
      assistant_message_id: request.turn.assistant_message_id,
      assistant_idempotency_key: request.turn.assistant_idempotency_key,
      assistant_text_sha256: request.turn.assistant_text_sha256,
      provider: request.turn.provider,
      model: request.turn.model,
      transcript_evidence_ref: request.turn.provenance.transcript_evidence_ref,
      execution_posture: "not_executed" as const,
      authority_transfer: "none" as const,
      tool_observations: structuredClone(request.turn.tools),
    };
    const publication = await this.#publisher.publish({
      relay: request.relay,
      community_id: request.community_id,
      channel_id: request.turn.channel_id,
      source_event_id: request.source_event.id,
      reply_to_event_id: request.source_event.id,
      expected_signer_pubkey: binding.buzz_agent_pubkey,
      idempotency_key: responseReturnId,
      content: request.turn.assistant_text,
      provenance,
    });
    if (publication.status === "rejected") {
      return this.#reject("transport_rejected", request, publication.evidence_refs);
    }
    const event = publication.event;
    if (
      !isoTimestamp(publication.accepted_at) ||
      Date.parse(publication.accepted_at) < Date.parse(request.returned_at) ||
      !validEventShape(event) ||
      event.pubkey !== binding.buzz_agent_pubkey ||
      event.kind !== this.#responseEventKind ||
      event.content !== request.turn.assistant_text ||
      !hasTag(event, "h", request.turn.channel_id) ||
      !hasTag(event, "e", request.source_event.id, "reply") ||
      !(await verifyNostrEventId(event)) ||
      !(await verifySchnorrSignature(event))
    ) {
      return this.#reject("returned_event_invalid", request, publication.evidence_refs);
    }

    const response: ReturnedAcpResponse = {
      response_return_id: responseReturnId,
      response_return_version: "0.1",
      binding_id: binding.binding_id,
      source_event_id: request.source_event.id,
      buzz_response_event_id: event.id,
      buzz_response_signer_pubkey: event.pubkey,
      assistant_text_sha256: request.turn.assistant_text_sha256,
      openclaw_agent_id: request.turn.openclaw_agent_id,
      openclaw_session_id: request.turn.openclaw_session_id,
      openclaw_session_key_sha256: sessionKeyDigest,
      user_message_id: request.turn.user_message_id,
      assistant_message_id: request.turn.assistant_message_id,
      assistant_idempotency_key: request.turn.assistant_idempotency_key,
      event_id_verified: true,
      signature_verified: true,
      consequence: "response_published_without_execution_or_authority_transfer",
      lifecycle: {
        prompted_at: request.turn.prompted_at,
        completed_at: request.turn.completed_at,
        evaluated_at: request.returned_at,
        published_at: publication.accepted_at,
        closed_at: publication.accepted_at,
      },
      machine: {
        relay: request.relay,
        community_id: request.community_id,
        channel_id: request.turn.channel_id,
        provider: request.turn.provider,
        model: request.turn.model,
        transcript_evidence_ref: request.turn.provenance.transcript_evidence_ref,
        tool_observations: structuredClone(request.turn.tools),
        execution_posture: "not_executed",
        authority_transfer: "none",
        proof_refs: structuredClone(request.proof_refs),
        publication_evidence_refs: structuredClone(publication.evidence_refs),
      },
    };
    this.#store.set(response);
    this.#logger?.write({
      at: publication.accepted_at,
      outcome: "published",
      source_event_id: response.source_event_id,
      response_return_id: response.response_return_id,
      buzz_response_event_id: response.buzz_response_event_id,
    });
    return { status: "published", response: structuredClone(response), duplicate_safe: true };
  }

  #duplicate(response: ReturnedAcpResponse, at: string): AcpResponseReturnResult {
    this.#logger?.write({
      at,
      outcome: "duplicate",
      source_event_id: response.source_event_id,
      response_return_id: response.response_return_id,
      buzz_response_event_id: response.buzz_response_event_id,
    });
    return {
      status: "duplicate",
      response: structuredClone(response),
      duplicate_safe: true,
      consequence: "No second Buzz event was published.",
    };
  }

  #reject(
    code: AcpResponseReturnRejectionCode,
    request: Partial<AcpResponseReturnRequest> | null,
    evidenceRefs: string[],
  ): AcpResponseReturnResult {
    const sourceEvent = request?.source_event;
    this.#logger?.write({
      at: isoTimestamp(request?.returned_at) ?? new Date().toISOString(),
      outcome: "rejected",
      source_event_id: validEventShape(sourceEvent) ? sourceEvent.id : null,
      response_return_id: null,
      rejection_code: code,
    });
    return {
      status: "rejected",
      rejection: {
        code,
        consequence: "No Buzz response was closed and no execution occurred.",
        next_move: nextMove(code),
        evidence_refs: structuredClone(evidenceRefs),
      },
    };
  }
}
