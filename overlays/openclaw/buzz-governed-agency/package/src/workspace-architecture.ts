import { sha256Hex } from "./crypto.js";
import type {
  CoordinationNeed,
  WorkspaceArchitectureConfig,
  WorkspaceContainer,
  WorkspaceRouteCode,
  WorkspaceRouteRequest,
  WorkspaceRouteResult,
  WorkspaceRoutingReceipt,
  WorkspaceThreadBinding,
  WorkspaceThreadKind,
} from "./workspace-architecture-types.js";

const HEX_32 = /^[0-9a-f]{64}$/;
const MAX_TEXT = 2_048;

function text(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function uniqueStrings(value: unknown, max = 32): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= max &&
    value.every((entry) => text(entry, 256)) &&
    new Set(value).size === value.length
  );
}

function validThreadKind(value: unknown): value is WorkspaceThreadKind {
  return ["direct_exchange", "tension_packet", "work_packet", "report_card"].includes(
    String(value),
  );
}

function validRequest(value: unknown): value is WorkspaceRouteRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<WorkspaceRouteRequest>;
  return (
    typeof request.source_event_id === "string" &&
    HEX_32.test(request.source_event_id) &&
    text(request.requested_by_actor_id, 256) &&
    text(request.container_id, 256) &&
    validThreadKind(request.requested_thread_kind) &&
    (request.reply_to_event_id === null ||
      (typeof request.reply_to_event_id === "string" &&
        HEX_32.test(request.reply_to_event_id))) &&
    uniqueStrings(request.explicit_attention_targets) &&
    uniqueStrings(request.mentioned_mind_ids) &&
    uniqueStrings(request.buzz_channel_labels)
  );
}

function consequence(decision: "route" | "block"): string {
  return decision === "route"
    ? "Attention was routed inside the declared workspace container; no authority or role was granted."
    : "No workspace route, role, authority, or execution was created."
}

export class BuzzWorkspaceArchitect {
  readonly #containers: WorkspaceContainer[];
  readonly #threads: WorkspaceThreadBinding[];
  readonly #needMap: Record<CoordinationNeed, string>;

  constructor(config: WorkspaceArchitectureConfig) {
    this.#containers = structuredClone(config.containers);
    this.#threads = structuredClone(config.threads);
    this.#needMap = structuredClone(config.need_map);
  }

  mapNeed(need: CoordinationNeed): WorkspaceContainer | null {
    const containerId = this.#needMap[need];
    const matches = this.#containers.filter(
      (container) => container.container_id === containerId && container.status === "active",
    );
    return matches.length === 1 ? structuredClone(matches[0]!) : null;
  }

  async route(input: unknown): Promise<WorkspaceRouteResult> {
    if (!validRequest(input)) return this.#block(input, "invalid_request", null, null);
    const request = input;
    const containers = this.#containers.filter(
      (container) => container.container_id === request.container_id,
    );
    if (containers.length === 0) return this.#block(request, "unknown_container", null, null);
    if (containers.length !== 1) return this.#block(request, "ambiguous_container", null, null);
    const container = containers[0]!;
    if (container.status !== "active") {
      return this.#block(request, "container_inactive", container, null);
    }
    if (!container.allowed_thread_kinds.includes(request.requested_thread_kind)) {
      return this.#block(request, "thread_kind_not_allowed", container, null);
    }

    let thread: WorkspaceThreadBinding | null = null;
    if (request.reply_to_event_id !== null) {
      const threads = this.#threads.filter(
        (candidate) => candidate.thread_root_event_id === request.reply_to_event_id,
      );
      if (threads.length !== 1) {
        return this.#block(request, "thread_not_found", container, null);
      }
      thread = threads[0]!;
      if (thread.container_id !== container.container_id) {
        return this.#block(request, "thread_container_mismatch", container, thread);
      }
      if (thread.thread_kind !== request.requested_thread_kind) {
        return this.#block(request, "thread_kind_mismatch", container, thread);
      }
      if (thread.status !== "open") {
        return this.#block(request, "thread_closed", container, thread);
      }
    }

    const targets = Array.from(
      new Set([
        ...request.explicit_attention_targets,
        ...request.mentioned_mind_ids,
        ...(thread?.target_mind_ids ?? []),
      ]),
    ).sort();
    if (targets.some((target) => !container.allowed_mind_ids.includes(target))) {
      return this.#block(request, "attention_target_not_allowed", container, thread);
    }
    if (
      container.kind === "mind_lane" &&
      (container.allowed_mind_ids.length !== 1 ||
        targets.length !== 1 ||
        targets[0] !== container.allowed_mind_ids[0])
    ) {
      return this.#block(request, "direct_lane_target_mismatch", container, thread);
    }

    const receipt = await this.#receipt(request, container, thread, "routed", "route", targets);
    return { status: "routed", receipt };
  }

  async #block(
    input: unknown,
    code: Exclude<WorkspaceRouteCode, "routed">,
    container: WorkspaceContainer | null,
    thread: WorkspaceThreadBinding | null,
  ): Promise<WorkspaceRouteResult> {
    const partial = input && typeof input === "object" ? (input as Partial<WorkspaceRouteRequest>) : {};
    const safe: WorkspaceRouteRequest = {
      source_event_id:
        typeof partial.source_event_id === "string" && HEX_32.test(partial.source_event_id)
          ? partial.source_event_id
          : "00".repeat(32),
      requested_by_actor_id: text(partial.requested_by_actor_id, 256)
        ? partial.requested_by_actor_id
        : "unknown-requester",
      container_id: text(partial.container_id, 256) ? partial.container_id : "unknown-container",
      requested_thread_kind: validThreadKind(partial.requested_thread_kind)
        ? partial.requested_thread_kind
        : "direct_exchange",
      reply_to_event_id:
        partial.reply_to_event_id === null ||
        (typeof partial.reply_to_event_id === "string" && HEX_32.test(partial.reply_to_event_id))
          ? partial.reply_to_event_id
          : null,
      explicit_attention_targets: uniqueStrings(partial.explicit_attention_targets)
        ? partial.explicit_attention_targets
        : [],
      mentioned_mind_ids: uniqueStrings(partial.mentioned_mind_ids)
        ? partial.mentioned_mind_ids
        : [],
      buzz_channel_labels: uniqueStrings(partial.buzz_channel_labels)
        ? partial.buzz_channel_labels
        : [],
    };
    const receipt = await this.#receipt(safe, container, thread, code, "block", []);
    return { status: "blocked", receipt };
  }

  async #receipt(
    request: WorkspaceRouteRequest,
    container: WorkspaceContainer | null,
    thread: WorkspaceThreadBinding | null,
    code: WorkspaceRouteCode,
    decision: "route" | "block",
    attentionTargets: string[],
  ): Promise<WorkspaceRoutingReceipt> {
    const material = JSON.stringify({
      source_event_id: request.source_event_id,
      container_id: container?.container_id ?? null,
      thread_root_event_id: thread?.thread_root_event_id ?? request.reply_to_event_id,
      thread_kind: request.requested_thread_kind,
      attention_targets: attentionTargets,
      decision,
      decision_code: code,
    });
    return {
      receipt_id: `workspace_rcpt_${(await sha256Hex(material)).slice(0, 32)}`,
      receipt_version: "0.1",
      source_event_id: HEX_32.test(request.source_event_id) ? request.source_event_id : null,
      requested_by_actor_id: request.requested_by_actor_id,
      container_id: container?.container_id ?? null,
      container_kind: container?.kind ?? null,
      governed_domain: container?.governed_domain ?? null,
      thread_root_event_id: thread?.thread_root_event_id ?? request.reply_to_event_id,
      thread_kind: validThreadKind(request.requested_thread_kind)
        ? request.requested_thread_kind
        : null,
      work_packet_ref: thread?.work_packet_ref ?? null,
      attention_targets: structuredClone(attentionTargets),
      mentioned_mind_ids: structuredClone(request.mentioned_mind_ids),
      decision,
      decision_code: code,
      consequence: consequence(decision),
      mentions_grant_authority: false,
      channel_membership_grants_authority: false,
      active_role_id: null,
      authority_effect: "none",
      execution_posture: "not_executed",
      private_context_refs: [],
      evidence_refs: [
        `requested-by:${request.requested_by_actor_id}`,
        `container:${container?.container_id ?? "unbound"}`,
        `thread-kind:${request.requested_thread_kind}`,
        `attention:${attentionTargets.join(",") || "none"}`,
        "mentions-authority:false",
        "channel-membership-authority:false",
        "role-projection:none",
        "private-context-copied:false",
      ],
    };
  }
}
