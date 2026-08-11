import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { sha256Hex } from "./crypto.js";
import type {
  BuzzRootDispatchQueueConfig,
  RootDispatchBinding,
  RootDispatchEnvelope,
  RootDispatchFileState,
  RootDispatchRecord,
  RootDispatchRejectionCode,
  RootDispatchStore,
  RootDrainResult,
  RootEnqueueResult,
} from "./root-dispatch-types.js";
import type { Hex } from "./types.js";

const HEX_32 = /^[0-9a-f]{64}$/;
const MAX_QUEUE_DEPTH = 1_024;
const SAFE_EVIDENCE_REF = /^[a-z0-9][a-z0-9:._/-]{0,255}$/i;
const ENVELOPE_KEYS = [
  "authority_transfer",
  "binding_id",
  "channel_id",
  "execution_posture",
  "expires_at",
  "not_before",
  "openclaw_agent_id",
  "openclaw_session_id",
  "openclaw_session_key_sha256",
  "payload_digest",
  "protocol_version",
  "received_at",
  "role_request_id",
  "source_event_id",
  "source_pubkey",
  "thread_root_event_id",
] as const;
const RECORD_KEYS = [
  "attempts",
  "dispatch_started_at",
  "dispatched_at",
  "enqueued_at",
  "envelope",
  "evidence_refs",
  "last_code",
  "last_detail",
  "response_closed",
  "state",
  "transport_ref_sha256",
  "updated_at",
] as const;

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function sha256HexSync(value: string): Hex {
  return createHash("sha256").update(value, "utf8").digest("hex") as Hex;
}

function safeEvidenceRefs(values: string[]): string[] {
  return values.filter((value) => SAFE_EVIDENCE_REF.test(value)).slice(0, 64);
}

function timestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function nonempty(value: unknown, max = 2_048): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function envelopeValid(value: unknown): value is RootDispatchEnvelope {
  if (!value || typeof value !== "object") return false;
  if (!exactKeys(value, ENVELOPE_KEYS)) return false;
  const item = value as Partial<RootDispatchEnvelope>;
  const shapeValid = (
    nonempty(item.protocol_version, 16) &&
    typeof item.source_event_id === "string" && HEX_32.test(item.source_event_id) &&
    typeof item.thread_root_event_id === "string" && HEX_32.test(item.thread_root_event_id) &&
    typeof item.source_pubkey === "string" && HEX_32.test(item.source_pubkey) &&
    nonempty(item.channel_id, 256) &&
    nonempty(item.binding_id, 256) &&
    nonempty(item.openclaw_agent_id, 256) &&
    typeof item.openclaw_session_key_sha256 === "string" && HEX_32.test(item.openclaw_session_key_sha256) &&
    nonempty(item.openclaw_session_id, 256) &&
    typeof item.payload_digest === "string" && HEX_32.test(item.payload_digest) &&
    (item.role_request_id === null || nonempty(item.role_request_id, 256)) &&
    timestamp(item.received_at) &&
    timestamp(item.not_before) &&
    timestamp(item.expires_at) &&
    item.execution_posture === "not_executed" &&
    item.authority_transfer === "none"
  );
  if (!shapeValid) return false;
  return (
    item.thread_root_event_id === item.source_event_id &&
    Date.parse(item.received_at as string) <= Date.parse(item.expires_at as string) &&
    Date.parse(item.not_before as string) <= Date.parse(item.expires_at as string)
  );
}

function recordValid(value: unknown): value is RootDispatchRecord {
  if (!value || typeof value !== "object" || !exactKeys(value, RECORD_KEYS)) return false;
  const item = value as Partial<RootDispatchRecord>;
  return Boolean(
    envelopeValid(item.envelope) &&
    ["queued", "dispatching", "dispatched", "blocked"].includes(String(item.state)) &&
    Number.isInteger(item.attempts) && Number(item.attempts) >= 0 &&
    timestamp(item.enqueued_at) &&
    timestamp(item.updated_at) &&
    (item.dispatch_started_at === null || timestamp(item.dispatch_started_at)) &&
    (item.dispatched_at === null || timestamp(item.dispatched_at)) &&
    (item.transport_ref_sha256 === null || (typeof item.transport_ref_sha256 === "string" && HEX_32.test(item.transport_ref_sha256))) &&
    (item.last_code === null || nonempty(item.last_code, 128)) &&
    (item.last_detail === null || nonempty(item.last_detail, 512)) &&
    item.response_closed === false &&
    Array.isArray(item.evidence_refs) &&
    item.evidence_refs.length <= 64 &&
    item.evidence_refs.every((value) => typeof value === "string" && SAFE_EVIDENCE_REF.test(value))
  );
}

function sameEnvelope(left: RootDispatchEnvelope, right: RootDispatchEnvelope): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function reject(code: RootDispatchRejectionCode): RootEnqueueResult {
  return {
    status: "rejected",
    code,
    consequence: "No ACP turn, response closure, execution, or authority transfer occurred.",
  };
}

export class InMemoryRootDispatchStore implements RootDispatchStore {
  readonly #records = new Map<Hex, RootDispatchRecord>();

  get(sourceEventId: Hex): RootDispatchRecord | undefined {
    const record = this.#records.get(sourceEventId);
    return record ? structuredClone(record) : undefined;
  }

  put(record: RootDispatchRecord): void {
    this.#records.set(record.envelope.source_event_id, structuredClone(record));
  }

  list(): RootDispatchRecord[] {
    return Array.from(this.#records.values(), (record) => structuredClone(record));
  }

  claim(sourceEventId: Hex, at: string): RootDispatchRecord | undefined {
    const record = this.#records.get(sourceEventId);
    if (!record || record.state !== "queued") return undefined;
    const claimed: RootDispatchRecord = {
      ...structuredClone(record),
      state: "dispatching",
      attempts: record.attempts + 1,
      dispatch_started_at: at,
      updated_at: at,
    };
    this.#records.set(sourceEventId, structuredClone(claimed));
    return claimed;
  }

  get size(): number {
    return this.#records.size;
  }
}

export class JsonFileRootDispatchStore implements RootDispatchStore {
  readonly #filePath: string;
  readonly #records = new Map<Hex, RootDispatchRecord>();

  constructor(filePath: string, recoveredAt = new Date().toISOString()) {
    if (!nonempty(filePath, 4_096) || !timestamp(recoveredAt)) {
      throw new Error("A bounded file path and recovery timestamp are required.");
    }
    this.#filePath = filePath;
    if (!existsSync(filePath)) return;
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<RootDispatchFileState>;
    if (!exactKeys(parsed, ["records", "version"]) || parsed.version !== "0.1" || !Array.isArray(parsed.records)) {
      throw new Error("Unsupported or malformed root-dispatch state.");
    }
    let recovered = false;
    for (const candidate of parsed.records) {
      if (!recordValid(candidate)) {
        throw new Error("Malformed root-dispatch record.");
      }
      const record = structuredClone(candidate);
      if (record.state === "dispatching") {
        record.state = "queued";
        record.updated_at = recoveredAt;
        record.dispatch_started_at = null;
        record.last_code = "interrupted_dispatch_recovered";
        record.last_detail = "An interrupted dispatch was returned to the durable queue.";
        record.evidence_refs = safeEvidenceRefs([
          ...record.evidence_refs,
          "queue:interrupted-dispatch-recovered",
        ]);
        recovered = true;
      }
      this.#records.set(record.envelope.source_event_id, record);
    }
    if (recovered) this.#persist();
  }

  get(sourceEventId: Hex): RootDispatchRecord | undefined {
    const record = this.#records.get(sourceEventId);
    return record ? structuredClone(record) : undefined;
  }

  put(record: RootDispatchRecord): void {
    this.#records.set(record.envelope.source_event_id, structuredClone(record));
    this.#persist();
  }

  list(): RootDispatchRecord[] {
    return Array.from(this.#records.values(), (record) => structuredClone(record));
  }

  claim(sourceEventId: Hex, at: string): RootDispatchRecord | undefined {
    const record = this.#records.get(sourceEventId);
    if (!record || record.state !== "queued") return undefined;
    const claimed: RootDispatchRecord = {
      ...structuredClone(record),
      state: "dispatching",
      attempts: record.attempts + 1,
      dispatch_started_at: at,
      updated_at: at,
    };
    this.#records.set(sourceEventId, structuredClone(claimed));
    this.#persist();
    return claimed;
  }

  #persist(): void {
    const parent = dirname(this.#filePath);
    mkdirSync(parent, { recursive: true, mode: 0o700 });
    const temporary = `${this.#filePath}.tmp`;
    const state: RootDispatchFileState = {
      version: "0.1",
      records: this.list(),
    };
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    chmodSync(temporary, 0o600);
    renameSync(temporary, this.#filePath);
    chmodSync(this.#filePath, 0o600);
  }
}

export class BuzzRootDispatchQueue {
  readonly #bindings: RootDispatchBinding[];
  readonly #transport: BuzzRootDispatchQueueConfig["transport"];
  readonly #store: RootDispatchStore;
  readonly #maxQueueDepth: number;
  readonly #operatorControl: BuzzRootDispatchQueueConfig["operator_control"];
  readonly #maxAutoTransportAttempts: number;
  readonly #autoRetryBackoffMs: number;
  readonly #locks = new Map<string, Promise<RootDrainResult>>();

  constructor(config: BuzzRootDispatchQueueConfig) {
    this.#bindings = structuredClone(config.bindings);
    this.#transport = config.transport;
    this.#store = config.store ?? new InMemoryRootDispatchStore();
    this.#maxQueueDepth = Math.max(
      1,
      Math.min(config.max_queue_depth ?? MAX_QUEUE_DEPTH, MAX_QUEUE_DEPTH),
    );
    this.#operatorControl = config.operator_control;
    this.#maxAutoTransportAttempts = Math.max(1, Math.min(config.max_auto_transport_attempts ?? 3, 10));
    this.#autoRetryBackoffMs = Math.max(0, Math.min(config.auto_retry_backoff_ms ?? 1_000, 300_000));
  }

  enqueue(input: unknown, at: string): RootEnqueueResult {
    if (!envelopeValid(input) || !timestamp(at)) return reject("invalid_envelope");
    const envelope = structuredClone(input);
    const existing = this.#store.get(envelope.source_event_id);
    if (existing) {
      return sameEnvelope(existing.envelope, envelope)
        ? { status: "duplicate", record: existing }
        : reject("conflicting_duplicate");
    }
    if (this.#store.list().filter((record) => record.state === "queued").length >= this.#maxQueueDepth) {
      return reject("invalid_envelope");
    }
    const validation = this.#validate(envelope, at);
    if (validation) return reject(validation);
    const record: RootDispatchRecord = {
      envelope,
      state: "queued",
      attempts: 0,
      enqueued_at: at,
      updated_at: at,
      dispatch_started_at: null,
      dispatched_at: null,
      transport_ref_sha256: null,
      last_code: null,
      last_detail: null,
      response_closed: false,
      evidence_refs: [
        `source-event:${envelope.source_event_id}`,
        `thread-root:${envelope.thread_root_event_id}`,
        `binding:${envelope.binding_id}`,
        "dispatch-mode:one-response-per-root",
        "require-existing:true",
        "reset-session:false",
      ],
    };
    this.#store.put(record);
    return { status: "queued", record: structuredClone(record) };
  }

  drain(bindingId: string, at: string): Promise<RootDrainResult> {
    const active = this.#locks.get(bindingId);
    if (active) return active;
    const promise = this.#drain(bindingId, at).finally(() => {
      if (this.#locks.get(bindingId) === promise) this.#locks.delete(bindingId);
    });
    this.#locks.set(bindingId, promise);
    return promise;
  }

  dispatchedRecords(bindingId: string): RootDispatchRecord[] {
    return this.#store.list().filter((record) => record.envelope.binding_id === bindingId && record.state === "dispatched");
  }

  async #drain(bindingId: string, at: string): Promise<RootDrainResult> {
    const dispatched: Hex[] = [];
    const blocked: Hex[] = [];
    const operatorHeld: Hex[] = [];
    let transportCalls = 0;
    let paused = false;
    const ordered = this.#store
      .list()
      .filter((record) => record.envelope.binding_id === bindingId && record.state === "queued")
      .sort((left, right) =>
        left.envelope.received_at.localeCompare(right.envelope.received_at) ||
        left.envelope.source_event_id.localeCompare(right.envelope.source_event_id),
      );

    for (const candidate of ordered) {
      const dependencyRetry = candidate.state === "queued" && ["gateway_unavailable", "buzz_unavailable", "relay_unavailable"].includes(candidate.last_code ?? "") && candidate.attempts < this.#maxAutoTransportAttempts && Date.parse(at) - Date.parse(candidate.updated_at) >= this.#autoRetryBackoffMs;
      if (dependencyRetry) this.#operatorControl?.recordAutomaticRetry?.(candidate.envelope.source_event_id, "automatic_dependency_retry", at);
      if (this.#operatorControl && !this.#operatorControl.mayDispatch(candidate.envelope.source_event_id)) {
        operatorHeld.push(candidate.envelope.source_event_id);
        continue;
      }
      if (Date.parse(candidate.envelope.not_before) > Date.parse(at)) continue;
      const validation = this.#validate(candidate.envelope, at);
      if (validation) {
        const claimed = this.#store.claim(candidate.envelope.source_event_id, at);
        if (!claimed) continue;
        this.#store.put({
          ...claimed,
          state: "blocked",
          updated_at: at,
          last_code: validation,
          last_detail: "The queued root no longer satisfies the exact binding boundary.",
        });
        blocked.push(candidate.envelope.source_event_id);
        continue;
      }
      const queueDepthAtClaim = this.#store.list().filter((record) => record.envelope.binding_id === bindingId && record.state === "queued").length;
      const claimed = this.#store.claim(candidate.envelope.source_event_id, at);
      if (!claimed) continue;
      const binding = this.#exactBinding(candidate.envelope);
      if (!binding) {
        this.#store.put({
          ...claimed,
          state: "blocked",
          updated_at: at,
          last_code: "binding_not_found",
          last_detail: "The exact existing-session binding disappeared.",
        });
        blocked.push(candidate.envelope.source_event_id);
        continue;
      }
      transportCalls += 1;
      const result = await this.#transport.dispatch({
        envelope: structuredClone(candidate.envelope),
        binding,
        idempotency_key: await sha256Hex(
          `root-dispatch:${candidate.envelope.source_event_id}:${candidate.envelope.payload_digest}`,
        ),
        dispatch_mode: "one_response_per_root",
      });
      if (result.status === "accepted") {
        const transportRefSha256 = await sha256Hex(result.transport_ref);
        this.#store.put({
          ...claimed,
          state: "dispatched",
          updated_at: result.accepted_at,
          dispatched_at: result.accepted_at,
          transport_ref_sha256: transportRefSha256,
          last_code: null,
          last_detail: null,
          evidence_refs: safeEvidenceRefs([...claimed.evidence_refs, `queue-depth-at-claim:${queueDepthAtClaim}`, ...result.evidence_refs]),
        });
        dispatched.push(candidate.envelope.source_event_id);
        continue;
      }
      if (result.status === "retryable") {
        this.#operatorControl?.recordRetryable(candidate.envelope.source_event_id, result.code, at);
        this.#store.put({
          ...claimed,
          state: "queued",
          updated_at: at,
          dispatch_started_at: null,
          last_code: result.code,
          last_detail: "A required dependency was unavailable; the exact root remains queued.",
          evidence_refs: safeEvidenceRefs([...claimed.evidence_refs, ...result.evidence_refs]),
        });
        paused = true;
        break;
      }
      this.#operatorControl?.recordQuarantine(candidate.envelope.source_event_id, result.code, at);
      this.#store.put({
        ...claimed,
        state: "blocked",
        updated_at: at,
        last_code: result.code,
        last_detail: "The transport rejected the root before response closure.",
        evidence_refs: safeEvidenceRefs([...claimed.evidence_refs, ...result.evidence_refs]),
      });
      blocked.push(candidate.envelope.source_event_id);
    }

    const remaining = this.#store
      .list()
      .filter((record) => record.envelope.binding_id === bindingId && record.state === "queued")
      .map((record) => record.envelope.source_event_id)
      .sort();
    return {
      status: paused ? "paused" : "drained",
      binding_id: bindingId,
      dispatched_source_event_ids: dispatched,
      blocked_source_event_ids: blocked,
      operator_held_source_event_ids: operatorHeld,
      remaining_queued_source_event_ids: remaining,
      transport_calls: transportCalls,
      response_closures: 0,
    };
  }

  #exactBinding(envelope: RootDispatchEnvelope): RootDispatchBinding | null {
    const matches = this.#bindings.filter((binding) => binding.binding_id === envelope.binding_id);
    return matches.length === 1 ? structuredClone(matches[0]!) : null;
  }

  #validate(envelope: RootDispatchEnvelope, at: string): RootDispatchRejectionCode | null {
    const matches = this.#bindings.filter((binding) => binding.binding_id === envelope.binding_id);
    if (matches.length === 0) return "binding_not_found";
    if (matches.length !== 1) return "binding_ambiguous";
    const binding = matches[0]!;
    if (binding.protocol_version !== envelope.protocol_version) return "version_mismatch";
    if (binding.status === "revoked") return "identity_revoked";
    if (binding.status !== "active") return "binding_inactive";
    if (
      Date.parse(at) < Date.parse(binding.valid_from) ||
      Date.parse(at) > Date.parse(binding.valid_until)
    ) return "binding_expired";
    if (Date.parse(at) > Date.parse(envelope.expires_at)) return "message_expired";
    if (
      binding.require_existing !== true ||
      binding.reset_session !== false ||
      binding.openclaw_agent_id !== envelope.openclaw_agent_id ||
      binding.openclaw_session_key_sha256 !== envelope.openclaw_session_key_sha256 ||
      sha256HexSync(binding.openclaw_session_key) !== binding.openclaw_session_key_sha256 ||
      binding.openclaw_session_id !== envelope.openclaw_session_id
    ) return "session_mismatch";
    if (!binding.allowed_channel_ids.includes(envelope.channel_id)) return "channel_not_allowed";
    if (!binding.allowed_source_pubkeys.includes(envelope.source_pubkey)) return "source_not_allowed";
    return null;
  }
}
