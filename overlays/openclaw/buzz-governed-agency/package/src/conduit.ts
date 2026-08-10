import { computeActionDigest } from "./authority.js";
import { sha256Hex } from "./crypto.js";
import type {
  ConduitDeliveryReceipt,
  ConduitDeliveryResult,
  ConduitRejectionCode,
  ConduitSendRequest,
  MindConduitCharter,
  MindConduitEndpoint,
  MindConduitPacket,
  MindConduitStore,
  ReceivingDecisionRejectionCode,
  ReceivingMindDecisionReceipt,
  ReceivingMindDecisionRequest,
  ReceivingMindDecisionResult,
  SyntheticMindConduitConfig,
} from "./conduit-types.js";

const VERSION = "0.1" as const;
const MAX_STRING = 2_048;
const HEX_32 = /^[0-9a-f]{64}$/;

function boundedString(value: unknown, max = MAX_STRING): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function strings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => boundedString(entry))
  );
}

function timestamp(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validTensionPacket(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const packet = value as ConduitSendRequest["tension_packet"];
  return (
    boundedString(packet.packet_id, 256) &&
    packet.packet_version === "0.1" &&
    packet.source_system === "buzz" &&
    typeof packet.source_event_id === "string" &&
    HEX_32.test(packet.source_event_id)
  );
}

function validAuthorityPacket(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const packet = value as ConduitSendRequest["authority_packet"];
  return (
    typeof packet.packet_id === "string" &&
    /^ap_[0-9a-f]{32}$/.test(packet.packet_id) &&
    packet.packet_version === "0.1" &&
    boundedString(packet.tension_packet_id, 256) &&
    Boolean(packet.action_intent && typeof packet.action_intent === "object") &&
    typeof packet.action_digest === "string" &&
    HEX_32.test(packet.action_digest) &&
    boundedString(packet.canonical_actor_id, 256) &&
    strings(packet.role_context) &&
    strings(packet.authority_basis) &&
    ["allow", "propose", "escalate", "block", "ratify"].includes(
      packet.decision,
    ) &&
    packet.execution_posture === "not_executed" &&
    timestamp(packet.evaluated_at) !== null &&
    timestamp(packet.expires_at) !== null
  );
}

function validSendRequest(value: unknown): value is ConduitSendRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<ConduitSendRequest>;
  return (
    boundedString(request.conduit_id, 256) &&
    boundedString(request.from_endpoint_id, 256) &&
    boundedString(request.to_endpoint_id, 256) &&
    boundedString(request.purpose) &&
    strings(request.scope) &&
    validTensionPacket(request.tension_packet) &&
    validAuthorityPacket(request.authority_packet) &&
    timestamp(request.sent_at) !== null &&
    timestamp(request.expires_at) !== null &&
    strings(request.proof_refs)
  );
}

function validDecisionRequest(
  value: unknown,
): value is ReceivingMindDecisionRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<ReceivingMindDecisionRequest>;
  return (
    boundedString(request.delivery_id, 256) &&
    boundedString(request.receiver_endpoint_id, 256) &&
    ["accept", "decline", "escalate"].includes(request.disposition ?? "") &&
    boundedString(request.rationale) &&
    strings(request.receiver_authority_basis) &&
    timestamp(request.decided_at) !== null &&
    strings(request.evidence_refs) &&
    (request.escalation_target === null ||
      boundedString(request.escalation_target, 256))
  );
}

function activeCharter(charter: MindConduitCharter, at: number): boolean {
  const from = timestamp(charter.valid_from);
  const until = timestamp(charter.valid_until);
  return (
    charter.status === "active" &&
    from !== null &&
    until !== null &&
    from < until &&
    at >= from &&
    at < until
  );
}

function validEndpoint(value: unknown): value is MindConduitEndpoint {
  if (!value || typeof value !== "object") return false;
  const endpoint = value as Partial<MindConduitEndpoint>;
  return (
    boundedString(endpoint.endpoint_id, 256) &&
    boundedString(endpoint.mind_id, 256) &&
    boundedString(endpoint.canonical_actor_id, 256) &&
    strings(endpoint.role_context) &&
    ["active", "inactive"].includes(endpoint.status ?? "")
  );
}

function validCharter(value: unknown): value is MindConduitCharter {
  if (!value || typeof value !== "object") return false;
  const charter = value as Partial<MindConduitCharter>;
  if (
    !boundedString(charter.conduit_id, 256) ||
    charter.charter_version !== "0.1" ||
    !["active", "inactive"].includes(charter.status ?? "") ||
    !boundedString(charter.purpose) ||
    !boundedString(charter.convening_authority) ||
    !strings(charter.allowed_scopes) ||
    !strings(charter.escalation_rules) ||
    timestamp(charter.valid_from) === null ||
    timestamp(charter.valid_until) === null ||
    !Array.isArray(charter.endpoints) ||
    charter.endpoints.length < 2 ||
    !charter.endpoints.every(validEndpoint)
  ) {
    return false;
  }
  const endpointIds = new Set(charter.endpoints.map((entry) => entry.endpoint_id));
  return endpointIds.size === charter.endpoints.length;
}

function distinctEndpoints(
  from: MindConduitEndpoint,
  to: MindConduitEndpoint,
): boolean {
  return (
    from.endpoint_id !== to.endpoint_id &&
    from.mind_id !== to.mind_id &&
    from.canonical_actor_id !== to.canonical_actor_id
  );
}

function intersects(left: string[], right: string[]): boolean {
  const values = new Set(left);
  return right.some((entry) => values.has(entry));
}

function deliveryNextMove(code: ConduitRejectionCode): string {
  const moves: Record<ConduitRejectionCode, string> = {
    invalid_request: "Correct the bounded Conduit request before retrying.",
    unknown_conduit: "Use a registered synthetic Conduit charter.",
    conduit_inactive_or_outside_window:
      "Activate or renew the Conduit charter before delivery.",
    unknown_endpoint: "Use two endpoints registered by the Conduit charter.",
    endpoint_inactive: "Activate both registered endpoints before delivery.",
    endpoint_identity_not_distinct:
      "Use separate endpoint, Mind, and actor identities.",
    sender_identity_mismatch:
      "Bind the sender endpoint to the Authority Packet actor.",
    sender_role_mismatch:
      "Select a sender role present in the Authority Packet.",
    scope_not_allowed: "Constrain the packet to the charter allowlist.",
    packet_linkage_mismatch:
      "Use the Authority Packet issued for the transported Tension Packet.",
    action_digest_mismatch:
      "Re-evaluate the exact action before transporting the packet.",
    authority_packet_expired:
      "Obtain a fresh sender Authority Packet before delivery.",
    delivery_window_invalid:
      "Choose a positive delivery window inside the charter window.",
    transport_rejected:
      "Inspect the bounded transport rejection and retry the stable delivery.",
    transport_identity_mismatch:
      "Require transport acknowledgment from the exact receiving endpoint.",
  };
  return moves[code];
}

function decisionNextMove(code: ReceivingDecisionRejectionCode): string {
  const moves: Record<ReceivingDecisionRejectionCode, string> = {
    invalid_request: "Correct the bounded receiving-Mind decision request.",
    unknown_delivery: "Record a successful Conduit delivery first.",
    receiver_identity_mismatch:
      "Use the receiving endpoint named by the delivered packet.",
    decision_time_invalid:
      "Record the receiver decision after acknowledgment and before expiry.",
    delivery_expired: "Send a fresh packet before recording a decision.",
    missing_independent_decision_evidence:
      "Record independent receiver choice and zero tool invocations.",
    missing_escalation_target:
      "Name the human or governed endpoint that receives the escalation.",
    unexpected_escalation_target:
      "Remove the escalation target from a non-escalation decision.",
    decision_conflict:
      "Preserve the first receiver decision or open a new packet for changed judgment.",
  };
  return moves[code];
}

export class InMemoryMindConduitStore implements MindConduitStore {
  readonly #deliveries = new Map<string, ConduitDeliveryReceipt>();
  readonly #decisions = new Map<string, ReceivingMindDecisionReceipt>();

  getDelivery(deliveryId: string): ConduitDeliveryReceipt | undefined {
    const value = this.#deliveries.get(deliveryId);
    return value ? structuredClone(value) : undefined;
  }

  setDelivery(deliveryId: string, receipt: ConduitDeliveryReceipt): void {
    this.#deliveries.set(deliveryId, structuredClone(receipt));
  }

  getDecision(deliveryId: string): ReceivingMindDecisionReceipt | undefined {
    const value = this.#decisions.get(deliveryId);
    return value ? structuredClone(value) : undefined;
  }

  setDecision(
    deliveryId: string,
    decision: ReceivingMindDecisionReceipt,
  ): void {
    this.#decisions.set(deliveryId, structuredClone(decision));
  }

  get deliveryCount(): number {
    return this.#deliveries.size;
  }

  get decisionCount(): number {
    return this.#decisions.size;
  }
}

export class SyntheticMindConduit {
  readonly #charters: Map<string, MindConduitCharter>;
  readonly #transport: SyntheticMindConduitConfig["transport"];
  readonly #store: MindConduitStore;
  readonly #inFlight = new Map<string, Promise<ConduitDeliveryResult>>();

  constructor(config: SyntheticMindConduitConfig) {
    const candidates = new Map<string, MindConduitCharter[]>();
    for (const charter of config.charters) {
      if (!validCharter(charter)) continue;
      const values = candidates.get(charter.conduit_id) ?? [];
      values.push(structuredClone(charter));
      candidates.set(charter.conduit_id, values);
    }
    this.#charters = new Map(
      [...candidates.entries()]
        .filter(([, values]) => values.length === 1)
        .map(([id, values]) => [id, values[0]!] as const),
    );
    this.#transport = config.transport;
    this.#store = config.store ?? new InMemoryMindConduitStore();
  }

  async send(input: unknown): Promise<ConduitDeliveryResult> {
    if (!validSendRequest(input)) return this.#rejectDelivery("invalid_request", []);
    const request = input;
    const charter = this.#charters.get(request.conduit_id);
    if (!charter) return this.#rejectDelivery("unknown_conduit", []);
    const sentAt = timestamp(request.sent_at)!;
    const expiresAt = timestamp(request.expires_at)!;
    if (!activeCharter(charter, sentAt)) {
      return this.#rejectDelivery("conduit_inactive_or_outside_window", []);
    }

    const from = charter.endpoints.find(
      (endpoint) => endpoint.endpoint_id === request.from_endpoint_id,
    );
    const to = charter.endpoints.find(
      (endpoint) => endpoint.endpoint_id === request.to_endpoint_id,
    );
    if (!from || !to) return this.#rejectDelivery("unknown_endpoint", []);
    if (from.status !== "active" || to.status !== "active") {
      return this.#rejectDelivery("endpoint_inactive", []);
    }
    if (!distinctEndpoints(from, to)) {
      return this.#rejectDelivery("endpoint_identity_not_distinct", []);
    }
    if (request.authority_packet.canonical_actor_id !== from.canonical_actor_id) {
      return this.#rejectDelivery("sender_identity_mismatch", []);
    }
    if (!intersects(from.role_context, request.authority_packet.role_context)) {
      return this.#rejectDelivery("sender_role_mismatch", []);
    }
    if (request.scope.some((entry) => !charter.allowed_scopes.includes(entry))) {
      return this.#rejectDelivery("scope_not_allowed", []);
    }
    if (
      request.authority_packet.tension_packet_id !==
      request.tension_packet.packet_id
    ) {
      return this.#rejectDelivery("packet_linkage_mismatch", []);
    }

    let digest: string;
    try {
      digest = await computeActionDigest(request.authority_packet.action_intent);
    } catch {
      return this.#rejectDelivery("invalid_request", []);
    }
    if (digest !== request.authority_packet.action_digest) {
      return this.#rejectDelivery("action_digest_mismatch", [
        `computed-action-digest:${digest}`,
      ]);
    }
    if (timestamp(request.authority_packet.expires_at)! <= sentAt) {
      return this.#rejectDelivery("authority_packet_expired", []);
    }
    const charterUntil = timestamp(charter.valid_until)!;
    if (expiresAt <= sentAt || expiresAt > charterUntil) {
      return this.#rejectDelivery("delivery_window_invalid", []);
    }

    const packet = await this.#packet(request, charter, from, to);
    const deliveryId = `mc_delivery_${packet.packet_id.slice(3)}`;
    const existing = this.#store.getDelivery(deliveryId);
    if (existing) return this.#duplicateDelivery(existing);
    const active = this.#inFlight.get(deliveryId);
    if (active) {
      const result = await active;
      if (result.status === "delivered" || result.status === "duplicate") {
        return this.#duplicateDelivery(result.receipt);
      }
      return result;
    }

    const operation = this.#deliver(packet, deliveryId);
    this.#inFlight.set(deliveryId, operation);
    try {
      return await operation;
    } finally {
      this.#inFlight.delete(deliveryId);
    }
  }

  async recordDecision(input: unknown): Promise<ReceivingMindDecisionResult> {
    if (!validDecisionRequest(input)) {
      return this.#rejectDecision("invalid_request", []);
    }
    const request = input;
    const delivery = this.#store.getDelivery(request.delivery_id);
    if (!delivery) return this.#rejectDecision("unknown_delivery", []);
    if (request.receiver_endpoint_id !== delivery.packet.to.endpoint_id) {
      return this.#rejectDecision("receiver_identity_mismatch", []);
    }
    const decidedAt = timestamp(request.decided_at)!;
    const receivedAt = timestamp(delivery.lifecycle.received.at)!;
    if (decidedAt < receivedAt) {
      return this.#rejectDecision("decision_time_invalid", []);
    }
    if (decidedAt >= timestamp(delivery.packet.expires_at)!) {
      return this.#rejectDecision("delivery_expired", []);
    }
    const evidence = new Set(request.evidence_refs);
    if (
      !evidence.has("receiver-choice:independent") ||
      !evidence.has("tool-invocations:0")
    ) {
      return this.#rejectDecision("missing_independent_decision_evidence", []);
    }
    if (request.disposition === "escalate" && !request.escalation_target) {
      return this.#rejectDecision("missing_escalation_target", []);
    }
    if (request.disposition !== "escalate" && request.escalation_target !== null) {
      return this.#rejectDecision("unexpected_escalation_target", []);
    }

    const decision = await this.#decision(delivery, request);
    const existing = this.#store.getDecision(request.delivery_id);
    if (existing) {
      if (existing.decision_id === decision.decision_id) {
        return {
          status: "duplicate",
          decision: existing,
          duplicate_safe: true,
          consequence: "No second receiver decision was recorded.",
        };
      }
      return this.#rejectDecision("decision_conflict", [
        `existing-decision:${existing.decision_id}`,
      ]);
    }
    this.#store.setDecision(request.delivery_id, decision);
    return { status: "recorded", decision, duplicate_safe: true };
  }

  async #packet(
    request: ConduitSendRequest,
    charter: MindConduitCharter,
    from: MindConduitEndpoint,
    to: MindConduitEndpoint,
  ): Promise<MindConduitPacket> {
    const digest = await sha256Hex(
      JSON.stringify({
        conduit_id: request.conduit_id,
        from_endpoint_id: from.endpoint_id,
        to_endpoint_id: to.endpoint_id,
        tension_packet_id: request.tension_packet.packet_id,
        authority_packet_id: request.authority_packet.packet_id,
        action_digest: request.authority_packet.action_digest,
        purpose: request.purpose,
        scope: [...request.scope].sort(),
        sent_at: request.sent_at,
        expires_at: request.expires_at,
      }),
    );
    return {
      packet_id: `mc_${digest.slice(0, 32)}`,
      packet_version: VERSION,
      conduit_id: charter.conduit_id,
      charter_version: charter.charter_version,
      from: structuredClone(from),
      to: structuredClone(to),
      purpose: request.purpose,
      scope: [...request.scope].sort(),
      tension_packet_id: request.tension_packet.packet_id,
      authority_packet_id: request.authority_packet.packet_id,
      action_digest: request.authority_packet.action_digest,
      sender_decision: request.authority_packet.decision,
      sender_authority_basis: structuredClone(
        request.authority_packet.authority_basis,
      ),
      sender_authority_effect: "context_only",
      authority_transfer: "none",
      execution_posture: "not_executed",
      created_at: request.sent_at,
      expires_at: request.expires_at,
      escalation_rules: structuredClone(charter.escalation_rules),
      proof_refs: structuredClone(request.proof_refs),
    };
  }

  async #deliver(
    packet: MindConduitPacket,
    deliveryId: string,
  ): Promise<ConduitDeliveryResult> {
    const result = await this.#transport.deliver(structuredClone(packet));
    if (result.status !== "received") {
      return this.#rejectDelivery("transport_rejected", result.evidence_refs);
    }
    if (result.receiver_endpoint_id !== packet.to.endpoint_id) {
      return this.#rejectDelivery(
        "transport_identity_mismatch",
        result.evidence_refs,
      );
    }
    if (
      !boundedString(result.transport_receipt_id, 256) ||
      timestamp(result.received_at) === null ||
      !strings(result.evidence_refs)
    ) {
      return this.#rejectDelivery("transport_rejected", result.evidence_refs);
    }
    const receivedAt = timestamp(result.received_at)!;
    if (
      receivedAt < timestamp(packet.created_at)! ||
      receivedAt >= timestamp(packet.expires_at)!
    ) {
      return this.#rejectDelivery("transport_rejected", result.evidence_refs);
    }
    const senderReceiptId = `mc_sent_${(
      await sha256Hex(`${deliveryId}:${packet.from.endpoint_id}:sent`)
    ).slice(0, 32)}`;
    const receiverReceiptId = `mc_recv_${(
      await sha256Hex(`${deliveryId}:${packet.to.endpoint_id}:received`)
    ).slice(0, 32)}`;
    const receipt: ConduitDeliveryReceipt = {
      delivery_id: deliveryId,
      receipt_version: VERSION,
      packet,
      sender_receipt_id: senderReceiptId,
      receiver_receipt_id: receiverReceiptId,
      transport_receipt_id: result.transport_receipt_id,
      lifecycle: {
        sent: { at: packet.created_at, endpoint_id: packet.from.endpoint_id },
        received: {
          at: result.received_at,
          endpoint_id: packet.to.endpoint_id,
          evidence_refs: structuredClone(result.evidence_refs),
        },
        receiver_decision: "pending",
      },
      two_sided_linkage: true,
      authority_transfer: "none",
      execution_posture: "not_executed",
      tool_invocations: 0,
    };
    this.#store.setDelivery(deliveryId, receipt);
    return { status: "delivered", receipt, duplicate_safe: true };
  }

  async #decision(
    delivery: ConduitDeliveryReceipt,
    request: ReceivingMindDecisionRequest,
  ): Promise<ReceivingMindDecisionReceipt> {
    const digest = await sha256Hex(
      JSON.stringify({
        delivery_id: request.delivery_id,
        receiver_endpoint_id: request.receiver_endpoint_id,
        disposition: request.disposition,
        rationale: request.rationale,
        receiver_authority_basis: [...request.receiver_authority_basis].sort(),
        decided_at: request.decided_at,
        escalation_target: request.escalation_target,
      }),
    );
    const consequences = {
      accept: "accepted_for_independent_evaluation",
      decline: "declined_without_action",
      escalate: "escalated_without_action",
    } as const;
    const requirements = {
      accept: "receiver_authority_packet_required_before_action",
      decline: "none",
      escalate: "named_escalation_required",
    } as const;
    return {
      decision_id: `mc_decision_${digest.slice(0, 32)}`,
      decision_version: VERSION,
      delivery_id: delivery.delivery_id,
      conduit_packet_id: delivery.packet.packet_id,
      tension_packet_id: delivery.packet.tension_packet_id,
      authority_packet_id: delivery.packet.authority_packet_id,
      action_digest: delivery.packet.action_digest,
      receiver: structuredClone(delivery.packet.to),
      disposition: request.disposition,
      rationale: request.rationale,
      receiver_authority_basis: structuredClone(
        request.receiver_authority_basis,
      ),
      sender_authority_effect: "context_only",
      authority_transfer: "none",
      execution_posture: "not_executed",
      tool_invocations: 0,
      consequence: consequences[request.disposition],
      escalation_target: request.escalation_target,
      decided_at: request.decided_at,
      evidence_refs: structuredClone(request.evidence_refs),
      linkage_refs: [
        `conduit:${delivery.packet.conduit_id}`,
        `conduit-packet:${delivery.packet.packet_id}`,
        `delivery:${delivery.delivery_id}`,
        `sender-receipt:${delivery.sender_receipt_id}`,
        `receiver-receipt:${delivery.receiver_receipt_id}`,
        `tension-packet:${delivery.packet.tension_packet_id}`,
        `authority-packet:${delivery.packet.authority_packet_id}`,
        `action-digest:${delivery.packet.action_digest}`,
      ],
      next_authority_requirement: requirements[request.disposition],
    };
  }

  #duplicateDelivery(
    receipt: ConduitDeliveryReceipt,
  ): ConduitDeliveryResult {
    return {
      status: "duplicate",
      receipt: structuredClone(receipt),
      duplicate_safe: true,
      consequence: "No second Conduit packet was delivered.",
    };
  }

  #rejectDelivery(
    code: ConduitRejectionCode,
    evidenceRefs: string[],
  ): ConduitDeliveryResult {
    return {
      status: "rejected",
      rejection: {
        code,
        consequence:
          "No Conduit delivery was recorded and no action was performed.",
        next_move: deliveryNextMove(code),
        evidence_refs: structuredClone(evidenceRefs),
      },
    };
  }

  #rejectDecision(
    code: ReceivingDecisionRejectionCode,
    evidenceRefs: string[],
  ): ReceivingMindDecisionResult {
    return {
      status: "rejected",
      rejection: {
        code,
        consequence:
          "No receiver decision was recorded and no action was performed.",
        next_move: decisionNextMove(code),
        evidence_refs: structuredClone(evidenceRefs),
      },
    };
  }
}
