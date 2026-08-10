import { SyntheticAuthorityEvaluator } from "./authority.js";
import { sha256Hex } from "./crypto.js";
import type {
  MindRoleBinding,
  RoleAuthorityProjectorConfig,
  RoleDecisionReceipt,
  RoleProjectionCode,
  RoleProjectionRequest,
  RoleProjectionResult,
} from "./role-projection-types.js";

const MAX_STRING = 2_048;

function text(value: unknown, max = MAX_STRING): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function instant(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bindingState(
  binding: MindRoleBinding,
  at: number,
): Exclude<RoleProjectionCode, "projected" | "missing_role" | "unknown_role" | "ambiguous_role" | "role_authority_source_mismatch" | "role_packet_mismatch" | "invalid_request"> | "active" {
  if (binding.status !== "active") return "role_binding_inactive";
  const from = instant(binding.valid_from);
  const until = instant(binding.valid_until);
  if (from === null || until === null || from >= until) {
    return "role_binding_inactive";
  }
  if (at < from) return "role_binding_not_yet_valid";
  if (at >= until) return "role_binding_expired";
  return "active";
}

function validRequest(value: unknown): value is RoleProjectionRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<RoleProjectionRequest>;
  return (
    Boolean(request.tension_packet && typeof request.tension_packet === "object") &&
    Boolean(request.action_intent && typeof request.action_intent === "object") &&
    text(request.mind_id, 256) &&
    (request.requested_role_id === null || text(request.requested_role_id, 256)) &&
    text(request.authority_snapshot_ref, 256) &&
    instant(request.evaluated_at) !== null &&
    Array.isArray(request.buzz_channel_labels) &&
    request.buzz_channel_labels.every((label) => text(label, 256))
  );
}

function consequence(decision: RoleDecisionReceipt["decision"]): string {
  switch (decision) {
    case "allow":
      return "The exact read-only action is allowed for evaluation; no execution occurred.";
    case "propose":
      return "A proposal may be prepared; no change or publication occurred.";
    case "escalate":
      return "The request requires the named approver; no action occurred.";
    case "ratify":
      return "The request requires separate ratification; no commitment occurred.";
    case "block":
      return "No role authority was conferred and no action occurred.";
  }
}

export class RoleAuthorityProjector {
  readonly #bindings: MindRoleBinding[];
  readonly #evaluator: SyntheticAuthorityEvaluator;

  constructor(config: RoleAuthorityProjectorConfig) {
    this.#bindings = structuredClone(config.bindings);
    this.#evaluator = new SyntheticAuthorityEvaluator({
      snapshots: structuredClone(config.snapshots),
    });
  }

  async project(input: unknown): Promise<RoleProjectionResult> {
    if (!validRequest(input)) {
      return this.#block(input, "invalid_request", null);
    }
    const request = input;
    if (request.requested_role_id === null) {
      return this.#block(request, "missing_role", null);
    }
    const candidates = this.#bindings.filter(
      (binding) =>
        binding.mind_id === request.mind_id &&
        binding.role_id === request.requested_role_id,
    );
    if (candidates.length === 0) {
      return this.#block(request, "unknown_role", null);
    }
    if (candidates.length !== 1) {
      return this.#block(request, "ambiguous_role", null);
    }
    const binding = candidates[0]!;
    const at = instant(request.evaluated_at)!;
    const state = bindingState(binding, at);
    if (state !== "active") {
      return this.#block(request, state, binding);
    }
    if (
      binding.authority_source_ref !== request.authority_snapshot_ref
    ) {
      return this.#block(request, "role_authority_source_mismatch", binding);
    }

    const tensionPacket = structuredClone(request.tension_packet);
    const requestedBy = tensionPacket.canonical_actor_id;
    tensionPacket.canonical_actor_id = binding.authority_actor_id;
    tensionPacket.provenance_refs = [
      ...tensionPacket.provenance_refs.filter(
        (entry) => !entry.startsWith("authority-source:"),
      ),
      `authority-source:${binding.authority_source_ref}`,
      `role-binding:${binding.binding_id}`,
      `requested-by:${requestedBy}`,
    ];
    const evaluated = await this.#evaluator.evaluate({
      tension_packet: tensionPacket,
      action_intent: structuredClone(request.action_intent),
      authority_snapshot_ref: request.authority_snapshot_ref,
      evaluated_at: request.evaluated_at,
    });
    if (evaluated.status !== "evaluated") {
      return this.#block(request, "invalid_request", binding);
    }
    const packet = evaluated.packet;
    if (
      packet.canonical_actor_id !== binding.authority_actor_id ||
      packet.role_context.length !== 1 ||
      packet.role_context[0] !== binding.role_id ||
      !packet.authority_basis.some(
        (entry) => entry === `role:${binding.role_id}`,
      )
    ) {
      return this.#block(request, "role_packet_mismatch", binding);
    }
    const receipt = await this.#receipt(
      request,
      binding,
      "projected",
      packet.decision,
      packet.packet_id,
      packet.authority_rule_ref,
    );
    return { status: "evaluated", authority_packet: packet, receipt };
  }

  async #block(
    input: unknown,
    code: Exclude<RoleProjectionCode, "projected">,
    binding: MindRoleBinding | null,
  ): Promise<RoleProjectionResult> {
    const request =
      input && typeof input === "object"
        ? (input as Partial<RoleProjectionRequest>)
        : {};
    const safe: RoleProjectionRequest = {
      tension_packet:
        request.tension_packet && typeof request.tension_packet === "object"
          ? request.tension_packet
          : ({
              canonical_actor_id: "unknown-requester",
              thread_context: { channel_id: null },
            } as RoleProjectionRequest["tension_packet"]),
      action_intent:
        request.action_intent && typeof request.action_intent === "object"
          ? request.action_intent
          : ({} as RoleProjectionRequest["action_intent"]),
      mind_id: text(request.mind_id, 256) ? request.mind_id : "unknown-mind",
      requested_role_id:
        request.requested_role_id === null || text(request.requested_role_id, 256)
          ? request.requested_role_id
          : null,
      authority_snapshot_ref: text(request.authority_snapshot_ref, 256)
        ? request.authority_snapshot_ref
        : "unknown-authority-source",
      evaluated_at:
        instant(request.evaluated_at) !== null
          ? request.evaluated_at!
          : "1970-01-01T00:00:00.000Z",
      buzz_channel_labels: Array.isArray(request.buzz_channel_labels)
        ? request.buzz_channel_labels.filter((label): label is string =>
            text(label, 256),
          )
        : [],
    };
    const receipt = await this.#receipt(
      safe,
      binding,
      code,
      "block",
      null,
      null,
    );
    return { status: "blocked", authority_packet: null, receipt };
  }

  async #receipt(
    request: RoleProjectionRequest,
    binding: MindRoleBinding | null,
    code: RoleProjectionCode,
    decision: RoleDecisionReceipt["decision"],
    authorityPacketId: string | null,
    authorityRuleRef: string | null,
  ): Promise<RoleDecisionReceipt> {
    const material = JSON.stringify({
      source_event_id: request.tension_packet.source_event_id ?? null,
      requested_by_actor_id:
        request.tension_packet.canonical_actor_id ?? "unknown-requester",
      mind_id: request.mind_id,
      requested_role_id: request.requested_role_id,
      binding_id: binding?.binding_id ?? null,
      authority_packet_id: authorityPacketId,
      decision,
      decision_code: code,
    });
    return {
      receipt_id: `role_rcpt_${(await sha256Hex(material)).slice(0, 32)}`,
      receipt_version: "0.1",
      requested_by_actor_id:
        request.tension_packet.canonical_actor_id ?? "unknown-requester",
      mind_id: request.mind_id,
      openclaw_agent_id: binding?.openclaw_agent_id ?? "unbound",
      requested_role_id: request.requested_role_id,
      active_role_id: code === "projected" ? binding!.role_id : null,
      role_binding_ref: binding?.binding_id ?? null,
      channel_id: request.tension_packet.thread_context?.channel_id ?? null,
      buzz_channel_labels: structuredClone(request.buzz_channel_labels),
      channel_membership_grants_authority: false,
      authority_source_ref: request.authority_snapshot_ref,
      authority_packet_id: authorityPacketId,
      authority_rule_ref: authorityRuleRef,
      decision,
      decision_code: code,
      consequence: consequence(decision),
      execution_posture: "not_executed",
      private_context_refs: [],
      evidence_refs: [
        `requested-by:${request.tension_packet.canonical_actor_id ?? "unknown-requester"}`,
        `mind:${request.mind_id}`,
        `requested-role:${request.requested_role_id ?? "absent"}`,
        `authority-source:${request.authority_snapshot_ref}`,
        "buzz-channel-membership-authority:false",
        "private-context-copied:false",
      ],
    };
  }
}
