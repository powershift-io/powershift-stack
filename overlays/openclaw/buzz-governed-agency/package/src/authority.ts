import { sha256Hex } from "./crypto.js";
import type {
  ActionIntent,
  AuthorityDecision,
  AuthorityDecisionValidation,
  AuthorityEvaluationCode,
  AuthorityEvaluationRequest,
  AuthorityEvaluationResult,
  AuthorityEvaluatorConfig,
  AuthorityPacket,
  CapabilityEnvelope,
  DecisionClass,
  JsonValue,
  SyntheticAuthorityActor,
  SyntheticAuthorityRule,
  SyntheticAuthoritySnapshot,
} from "./authority-types.js";
import type { TensionPacket } from "./types.js";

const PACKET_VERSION = "0.1" as const;
const DEFAULT_MAX_ACTION_BYTES = 16_384;
const DEFAULT_FAIL_CLOSED_TTL_SECONDS = 60;
const DEFAULT_MAX_ISSUED_PACKETS = 512;
const MAX_STRING_LENGTH = 2_048;
const HEX_32 = /^[0-9a-f]{64}$/;

function boundedString(value: unknown, max = MAX_STRING_LENGTH): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function boundedPositiveInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
): number {
  return Number.isSafeInteger(value) && value! > 0
    ? Math.min(value!, maximum)
    : fallback;
}

function timestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isJsonValue(
  value: unknown,
  ancestors: WeakSet<object> = new WeakSet(),
): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return typeof value !== "string" || value.length <= MAX_STRING_LENGTH;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (ancestors.has(value)) return false;
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  ) {
    return false;
  }
  ancestors.add(value);
  const valid = Array.isArray(value)
    ? value.every((entry) => isJsonValue(entry, ancestors))
    : Object.entries(value).every(
        ([key, entry]) =>
          key.length > 0 &&
          key.length <= 256 &&
          isJsonValue(entry, ancestors),
      );
  ancestors.delete(value);
  return valid;
}

function validActionIntent(value: unknown): value is ActionIntent {
  if (!value || typeof value !== "object") return false;
  const action = value as Partial<ActionIntent>;
  const allowedKeys = new Set([
    "intent_id",
    "action_type",
    "capability",
    "resource",
    "operation",
    "parameters",
  ]);
  return (
    Object.keys(action).length === allowedKeys.size &&
    Object.keys(action).every((key) => allowedKeys.has(key)) &&
    boundedString(action.intent_id, 256) &&
    ["read", "write", "publish", "external_commitment", "permission"].includes(
      action.action_type ?? "",
    ) &&
    boundedString(action.capability) &&
    boundedString(action.resource) &&
    boundedString(action.operation) &&
    Boolean(
      action.parameters &&
        typeof action.parameters === "object" &&
        !Array.isArray(action.parameters) &&
        isJsonValue(action.parameters),
    )
  );
}

function validAuthorityPacket(value: unknown): value is AuthorityPacket {
  if (!isJsonValue(value) || Array.isArray(value) || value === null) {
    return false;
  }
  const packet = value as unknown as Partial<AuthorityPacket>;
  return (
    typeof packet.packet_id === "string" &&
    /^ap_[0-9a-f]{32}$/.test(packet.packet_id) &&
    packet.packet_version === "0.1" &&
    boundedString(packet.tension_packet_id, 256) &&
    validActionIntent(packet.action_intent) &&
    typeof packet.action_digest === "string" &&
    HEX_32.test(packet.action_digest) &&
    boundedString(packet.canonical_actor_id, 256) &&
    Array.isArray(packet.authority_basis) &&
    packet.authority_basis.every((entry) => boundedString(entry)) &&
    boundedString(packet.authority_snapshot_ref, 256) &&
    typeof packet.evaluated_at === "string" &&
    timestamp(packet.evaluated_at) !== null &&
    typeof packet.expires_at === "string" &&
    timestamp(packet.expires_at) !== null &&
    ["allow", "propose", "escalate", "block", "ratify"].includes(
      packet.decision ?? "",
    ) &&
    packet.execution_posture === "not_executed"
  );
}

function validTensionPacket(value: unknown): value is TensionPacket {
  if (!value || typeof value !== "object") return false;
  const packet = value as Partial<TensionPacket>;
  return (
    boundedString(packet.packet_id, 256) &&
    packet.packet_version === "0.1" &&
    packet.source_system === "buzz" &&
    boundedString(packet.source_event_id, 64) &&
    HEX_32.test(packet.source_event_id) &&
    boundedString(packet.canonical_actor_id, 256) &&
    packet.proposed_route === "authority_evaluator" &&
    Array.isArray(packet.provenance_refs) &&
    packet.provenance_refs.every((entry) => boundedString(entry))
  );
}

function validEvaluationRequest(
  value: unknown,
): value is AuthorityEvaluationRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<AuthorityEvaluationRequest>;
  return (
    validTensionPacket(request.tension_packet) &&
    validActionIntent(request.action_intent) &&
    boundedString(request.authority_snapshot_ref, 256) &&
    boundedString(request.evaluated_at, 64) &&
    timestamp(request.evaluated_at) !== null
  );
}

function canonicalize(value: JsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key]!)}`)
    .join(",")}}`;
}

export async function computeActionDigest(action: ActionIntent): Promise<string> {
  if (!validActionIntent(action)) {
    throw new TypeError("Action intent does not match the bounded contract.");
  }
  return sha256Hex(canonicalize(action as unknown as JsonValue));
}

function activeAt(
  value: {
    status: "active" | "inactive";
    valid_from: string;
    valid_until: string;
  },
  at: number,
): "active" | "inactive" | "not_yet_valid" | "expired" | "invalid" {
  if (value.status !== "active") return "inactive";
  const from = timestamp(value.valid_from);
  const until = timestamp(value.valid_until);
  if (from === null || until === null || from >= until) return "invalid";
  if (at < from) return "not_yet_valid";
  if (at >= until) return "expired";
  return "active";
}

function ruleMatchesAction(
  rule: SyntheticAuthorityRule,
  action: ActionIntent,
): boolean {
  const envelope = rule.capability_envelope;
  return (
    envelope.capability === action.capability &&
    envelope.action_types.includes(action.action_type) &&
    envelope.resources.includes(action.resource) &&
    envelope.operations.includes(action.operation)
  );
}

function safeRule(rule: SyntheticAuthorityRule): boolean {
  const expectedModes = {
    allow: "read_only",
    propose: "proposal_only",
    escalate: "escalation_only",
    block: "denied",
    ratify: "ratification_required",
  } as const;
  if (
    !boundedString(rule.rule_id, 256) ||
    !boundedString(rule.actor_id, 256) ||
    !boundedString(rule.decision_reason) ||
    rule.authority_basis.length === 0 ||
    !rule.authority_basis.every((entry) => boundedString(entry)) ||
    !rule.constraints.every((entry) => boundedString(entry)) ||
    !rule.required_approvers.every((entry) => boundedString(entry, 256)) ||
    !rule.required_ratifiers.every((entry) => boundedString(entry, 256)) ||
    rule.capability_envelope.mode !== expectedModes[rule.outcome] ||
    !Number.isSafeInteger(rule.ttl_seconds) ||
    rule.ttl_seconds <= 0 ||
    rule.ttl_seconds > 86_400
  ) {
    return false;
  }
  if (
    rule.outcome === "allow" &&
    (rule.required_approvers.length > 0 ||
      rule.required_ratifiers.length > 0)
  ) {
    return false;
  }
  if (
    (rule.outcome === "propose" || rule.outcome === "escalate") &&
    rule.required_approvers.length === 0
  ) {
    return false;
  }
  if (rule.outcome === "ratify" && rule.required_ratifiers.length === 0) {
    return false;
  }
  return true;
}

function deniedEnvelope(action: ActionIntent): CapabilityEnvelope {
  return {
    capability: action.capability,
    action_types: [action.action_type],
    resources: [action.resource],
    operations: [action.operation],
    mode: "denied",
  };
}

function clampExpiry(
  evaluatedAt: number,
  ttlSeconds: number,
  ...limits: string[]
): string {
  const timestamps = limits
    .map((value) => timestamp(value))
    .filter((value): value is number => value !== null);
  return new Date(
    Math.min(evaluatedAt + ttlSeconds * 1_000, ...timestamps),
  ).toISOString();
}

interface PacketDecision {
  decision: AuthorityDecision;
  decisionClass: DecisionClass;
  decisionReason: string;
  evaluationCode: AuthorityEvaluationCode;
  roleContext: string[];
  authorityBasis: string[];
  rule: SyntheticAuthorityRule | null;
  expiresAt: string;
}

export class SyntheticAuthorityEvaluator {
  readonly #snapshots: SyntheticAuthoritySnapshot[];
  readonly #maxActionBytes: number;
  readonly #failClosedTtlSeconds: number;
  readonly #maxIssuedPackets: number;
  readonly #issuedPacketDigests = new Map<string, string>();

  constructor(config: AuthorityEvaluatorConfig) {
    this.#snapshots = structuredClone(config.snapshots);
    this.#maxActionBytes = boundedPositiveInteger(
      config.max_action_bytes,
      DEFAULT_MAX_ACTION_BYTES,
      1_048_576,
    );
    this.#failClosedTtlSeconds = boundedPositiveInteger(
      config.fail_closed_ttl_seconds,
      DEFAULT_FAIL_CLOSED_TTL_SECONDS,
      86_400,
    );
    this.#maxIssuedPackets = boundedPositiveInteger(
      config.max_issued_packets,
      DEFAULT_MAX_ISSUED_PACKETS,
      10_000,
    );
  }

  async validate(
    packetInput: unknown,
    candidateAction: unknown,
    checkedAt: unknown,
  ): Promise<AuthorityDecisionValidation> {
    if (
      !validAuthorityPacket(packetInput) ||
      !validActionIntent(candidateAction) ||
      typeof checkedAt !== "string" ||
      timestamp(checkedAt) === null
    ) {
      return {
        valid: false,
        code: "invalid_action",
        consequence:
          "No action may execute from malformed authority-validation input.",
      };
    }
    const packet = packetInput;
    const { packet_id: packetId, ...packetWithoutId } = packet;
    const packetDigest = await sha256Hex(
      canonicalize(packetWithoutId as unknown as JsonValue),
    );
    if (
      packetId !== `ap_${packetDigest.slice(0, 32)}` ||
      this.#issuedPacketDigests.get(packetId) !== packetDigest
    ) {
      return {
        valid: false,
        code: "unrecognized_authority_packet",
        consequence:
          "The packet was not issued unchanged by this evaluator; no action may execute.",
      };
    }
    return validateIssuedAuthorityDecision(packet, candidateAction, checkedAt);
  }

  async evaluate(input: unknown): Promise<AuthorityEvaluationResult> {
    if (!validEvaluationRequest(input)) {
      return this.#reject(
        "invalid_request",
        "Correct the bounded evaluation request before retrying.",
      );
    }
    const request = input;
    const actionBytes = new TextEncoder().encode(
      canonicalize(request.action_intent as unknown as JsonValue),
    ).length;
    if (actionBytes > this.#maxActionBytes) {
      return this.#reject(
        "action_too_large",
        "Reduce the synthetic action intent before retrying.",
      );
    }

    const evaluatedAt = timestamp(request.evaluated_at)!;
    const actionDigest = await computeActionDigest(request.action_intent);
    const snapshots = this.#snapshots.filter(
      (snapshot) =>
        snapshot.snapshot_id === request.authority_snapshot_ref,
    );
    const failClosedExpiry = new Date(
      evaluatedAt + this.#failClosedTtlSeconds * 1_000,
    ).toISOString();

    if (snapshots.length === 0) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "unknown_authority_snapshot",
          "No trusted synthetic authority snapshot matches the request.",
          ["evaluator-policy:unknown-authority-fails-closed"],
          failClosedExpiry,
        ),
      );
    }
    if (snapshots.length > 1) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "ambiguous_authority_snapshot",
          "Multiple synthetic authority snapshots match the request.",
          ["evaluator-policy:ambiguous-authority-fails-closed"],
          failClosedExpiry,
        ),
      );
    }

    const snapshot = snapshots[0]!;
    const snapshotBasis = `authority-snapshot:${snapshot.snapshot_id}`;
    const snapshotState = activeAt(snapshot, evaluatedAt);
    if (snapshotState !== "active") {
      const codes: Record<
        Exclude<typeof snapshotState, "active">,
        AuthorityEvaluationCode
      > = {
        inactive: "authority_snapshot_inactive",
        invalid: "authority_snapshot_inactive",
        not_yet_valid: "authority_snapshot_not_yet_valid",
        expired: "authority_snapshot_expired",
      };
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          codes[snapshotState],
          `The synthetic authority snapshot is ${snapshotState.replaceAll("_", " ")}.`,
          [snapshotBasis, "evaluator-policy:stale-authority-fails-closed"],
          failClosedExpiry,
        ),
      );
    }

    if (
      !request.tension_packet.provenance_refs.includes(
        `authority-source:${snapshot.snapshot_id}`,
      )
    ) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "snapshot_not_bound_to_tension",
          "The requested authority snapshot is not bound to the Tension Packet provenance.",
          [snapshotBasis, "evaluator-policy:source-binding-required"],
          failClosedExpiry,
        ),
      );
    }

    const actors = snapshot.actors.filter(
      (actor) =>
        actor.actor_id === request.tension_packet.canonical_actor_id,
    );
    if (actors.length === 0) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "unknown_actor",
          "The canonical actor is absent from the synthetic authority snapshot.",
          [snapshotBasis, "evaluator-policy:unknown-actor-fails-closed"],
          failClosedExpiry,
        ),
      );
    }
    if (actors.length > 1) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "ambiguous_actor",
          "The canonical actor has multiple authority records.",
          [snapshotBasis, "evaluator-policy:ambiguous-actor-fails-closed"],
          failClosedExpiry,
        ),
      );
    }

    const actor = actors[0]!;
    if (actor.status !== "active") {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "actor_inactive",
          "The canonical actor is inactive in the synthetic authority snapshot.",
          [snapshotBasis, "evaluator-policy:inactive-actor-fails-closed"],
          failClosedExpiry,
          actor,
        ),
      );
    }

    const actionRules = snapshot.rules.filter(
      (rule) =>
        rule.actor_id === actor.actor_id &&
        ruleMatchesAction(rule, request.action_intent),
    );
    if (actionRules.length === 0) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "no_matching_authority",
          "No authority rule covers the exact action capability, resource, and operation.",
          [snapshotBasis, "evaluator-policy:no-implicit-authority"],
          failClosedExpiry,
          actor,
        ),
      );
    }

    const activeRules = actionRules.filter(
      (rule) => activeAt(rule, evaluatedAt) === "active",
    );
    if (activeRules.length === 0) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "authority_rule_inactive_or_outside_window",
          "Matching authority exists only outside its active validity window.",
          [snapshotBasis, "evaluator-policy:stale-authority-fails-closed"],
          failClosedExpiry,
          actor,
        ),
      );
    }
    if (activeRules.length > 1) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "ambiguous_authority",
          "Multiple active authority rules cover the exact action.",
          [snapshotBasis, "evaluator-policy:ambiguous-authority-fails-closed"],
          failClosedExpiry,
          actor,
        ),
      );
    }

    const rule = activeRules[0]!;
    if (!safeRule(rule)) {
      return this.#evaluated(
        request,
        actionDigest,
        this.#blocked(
          "unsafe_authority_rule",
          "The matching authority rule violates evaluator safety invariants.",
          [snapshotBasis, `authority-rule:${rule.rule_id}`],
          failClosedExpiry,
          actor,
        ),
      );
    }

    return this.#evaluated(request, actionDigest, {
      decision: rule.outcome,
      decisionClass: rule.decision_class,
      decisionReason: rule.decision_reason,
      evaluationCode: "matched_rule",
      roleContext: structuredClone(actor.role_context),
      authorityBasis: [
        snapshotBasis,
        `authority-rule:${rule.rule_id}`,
        ...rule.authority_basis,
      ],
      rule,
      expiresAt: clampExpiry(
        evaluatedAt,
        rule.ttl_seconds,
        snapshot.valid_until,
        rule.valid_until,
      ),
    });
  }

  #blocked(
    code: AuthorityEvaluationCode,
    reason: string,
    basis: string[],
    expiresAt: string,
    actor?: SyntheticAuthorityActor,
  ): PacketDecision {
    return {
      decision: "block",
      decisionClass: "unknown_authority",
      decisionReason: reason,
      evaluationCode: code,
      roleContext: actor ? structuredClone(actor.role_context) : [],
      authorityBasis: basis,
      rule: null,
      expiresAt,
    };
  }

  async #evaluated(
    request: AuthorityEvaluationRequest,
    actionDigest: string,
    result: PacketDecision,
  ): Promise<AuthorityEvaluationResult> {
    const rule = result.rule;
    const envelope = rule
      ? structuredClone(rule.capability_envelope)
      : deniedEnvelope(request.action_intent);
    const packetWithoutId = {
      packet_version: PACKET_VERSION,
      tension_packet_id: request.tension_packet.packet_id,
      action_intent: structuredClone(request.action_intent),
      action_digest: actionDigest,
      canonical_actor_id: request.tension_packet.canonical_actor_id,
      role_context: result.roleContext,
      authority_basis: result.authorityBasis,
      authority_snapshot_ref: request.authority_snapshot_ref,
      authority_rule_ref: rule?.rule_id ?? null,
      decision_class: result.decisionClass,
      capability_envelope: [envelope],
      constraints: rule
        ? structuredClone(rule.constraints)
        : ["No capability was conferred; no action may execute."],
      required_approvers: rule
        ? structuredClone(rule.required_approvers)
        : [],
      required_ratifiers: rule
        ? structuredClone(rule.required_ratifiers)
        : [],
      evaluated_at: new Date(request.evaluated_at).toISOString(),
      expires_at: result.expiresAt,
      decision: result.decision,
      decision_reason: result.decisionReason,
      evaluation_code: result.evaluationCode,
      execution_posture: "not_executed" as const,
      evidence_refs: [
        `tension-packet:${request.tension_packet.packet_id}`,
        `buzz-event:${request.tension_packet.source_event_id}`,
        `action-digest:${actionDigest}`,
        ...result.authorityBasis,
      ],
    };
    const packetDigest = await sha256Hex(
      canonicalize(packetWithoutId as unknown as JsonValue),
    );
    const packet: AuthorityPacket = {
      packet_id: `ap_${packetDigest.slice(0, 32)}`,
      ...packetWithoutId,
    };
    this.#issuedPacketDigests.set(packet.packet_id, packetDigest);
    while (this.#issuedPacketDigests.size > this.#maxIssuedPackets) {
      const oldest = this.#issuedPacketDigests.keys().next().value as
        | string
        | undefined;
      if (!oldest) break;
      this.#issuedPacketDigests.delete(oldest);
    }
    return { status: "evaluated", packet };
  }

  #reject(
    code: "invalid_request" | "action_too_large",
    nextMove: string,
  ): AuthorityEvaluationResult {
    return {
      status: "rejected",
      rejection: {
        code,
        authority_basis: ["evaluator-policy:invalid-input-fails-closed"],
        human: {
          decision: "rejected",
          consequence:
            "No authority decision was issued and no action was performed.",
          next_move: nextMove,
        },
      },
    };
  }
}

async function validateIssuedAuthorityDecision(
  packet: AuthorityPacket,
  candidateAction: ActionIntent,
  checkedAt: string,
): Promise<AuthorityDecisionValidation> {
  const candidateDigest = await computeActionDigest(candidateAction);
  if (candidateDigest !== packet.action_digest) {
    return {
      valid: false,
      code: "action_digest_mismatch",
      consequence:
        "The action changed after evaluation; a new Authority Packet is required.",
    };
  }
  if (packet.authority_basis.length === 0) {
    return {
      valid: false,
      code: "missing_authority_basis",
      consequence:
        "The decision has no authority basis; no action may execute.",
    };
  }
  const expiresAt = timestamp(packet.expires_at);
  if (expiresAt === null || timestamp(checkedAt)! >= expiresAt) {
    return {
      valid: false,
      code: "authority_packet_expired",
      consequence:
        "The Authority Packet expired; a new evaluation is required.",
    };
  }
  if (packet.decision !== "allow") {
    return {
      valid: false,
      code: "decision_not_allow",
      consequence: `Decision ${packet.decision} does not confer execution authority.`,
    };
  }
  return {
    valid: true,
    code: "valid",
    consequence:
      "The action digest and unexpired allow decision match. Execution remains outside this evaluator.",
  };
}
