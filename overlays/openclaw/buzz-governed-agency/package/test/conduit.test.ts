import {
  BuzzReadOnlyAdapter,
  InMemoryMindConduitStore,
  SyntheticAuthorityEvaluator,
  SyntheticMindConduit,
  type ConduitSendRequest,
  type ConduitTransportResult,
  type MindConduitCharter,
  type MindConduitPacket,
  type MindConduitTransport,
  type ReceivingMindDecisionRequest,
} from "../src/index.js";
import { authoritySnapshot, readAction } from "./authority-fixtures.js";
import { COMMUNITY_ID, RELAY, downBinding, envelope } from "./fixtures.js";

type Test = { name: string; run: () => Promise<void> | void };
const tests: Test[] = [];

function test(name: string, run: Test["run"]): void {
  tests.push({ name, run });
}

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const charter: MindConduitCharter = {
  conduit_id: "buzz-synthetic-mind-conduit-v1",
  charter_version: "0.1",
  status: "active",
  purpose: "Carry one governed synthetic packet without merging Minds or authority.",
  convening_authority: "agreement:synthetic-phase-6",
  allowed_scopes: ["synthetic-fixture-status"],
  escalation_rules: [
    "Escalate authority ambiguity to thomas-demo.",
    "Do not execute from packet receipt or sender authority.",
  ],
  valid_from: "2026-07-29T00:00:00.000Z",
  valid_until: "2026-07-30T00:00:00.000Z",
  endpoints: [
    {
      endpoint_id: "down-demo-endpoint",
      mind_id: "down-demo-mind",
      canonical_actor_id: "down-demo",
      role_context: ["platform-circle-lead-demo"],
      status: "active",
    },
    {
      endpoint_id: "worker-demo-endpoint",
      mind_id: "worker-demo-mind",
      canonical_actor_id: "worker-demo",
      role_context: ["delegated-worker-demo"],
      status: "active",
    },
  ],
};

class RecordingTransport implements MindConduitTransport {
  readonly packets: MindConduitPacket[] = [];
  result: ConduitTransportResult = {
    status: "received",
    transport_receipt_id: "buzz-synthetic-receipt-1",
    receiver_endpoint_id: "worker-demo-endpoint",
    received_at: "2026-07-29T16:31:01.000Z",
    evidence_refs: ["transport:synthetic-loopback", "receiver:acknowledged"],
  };
  delay = false;

  async deliver(packet: MindConduitPacket): Promise<ConduitTransportResult> {
    this.packets.push(structuredClone(packet));
    if (this.delay) await new Promise<void>((resolve) => queueMicrotask(resolve));
    return structuredClone(this.result);
  }
}

async function sendRequest(): Promise<ConduitSendRequest> {
  const intake = await new BuzzReadOnlyAdapter({
    allowed_relays: [RELAY],
    allowed_community_ids: [COMMUNITY_ID],
    allowed_authority_source_refs: [authoritySnapshot.snapshot_id],
    bindings: [downBinding],
  }).ingest(envelope());
  assert(intake.status === "accepted", "fixture intake must pass");
  const authority = await new SyntheticAuthorityEvaluator({
    snapshots: [authoritySnapshot],
  }).evaluate({
    tension_packet: intake.packet,
    action_intent: structuredClone(readAction),
    authority_snapshot_ref: authoritySnapshot.snapshot_id,
    evaluated_at: "2026-07-29T16:30:00.000Z",
  });
  assert(authority.status === "evaluated", "fixture authority must evaluate");
  return {
    conduit_id: charter.conduit_id,
    from_endpoint_id: "down-demo-endpoint",
    to_endpoint_id: "worker-demo-endpoint",
    purpose: "Ask Worker-Demo to independently evaluate the ALPHA status packet.",
    scope: ["synthetic-fixture-status"],
    tension_packet: intake.packet,
    authority_packet: authority.packet,
    sent_at: "2026-07-29T16:31:00.000Z",
    expires_at: "2026-07-29T16:34:00.000Z",
    proof_refs: ["proof:phase-6-test"],
  };
}

function conduit(
  transport: MindConduitTransport,
  store = new InMemoryMindConduitStore(),
  selectedCharter = charter,
): SyntheticMindConduit {
  return new SyntheticMindConduit({
    charters: [selectedCharter],
    transport,
    store,
  });
}

function decision(
  deliveryId: string,
  disposition: "accept" | "decline" | "escalate" = "accept",
): ReceivingMindDecisionRequest {
  return {
    delivery_id: deliveryId,
    receiver_endpoint_id: "worker-demo-endpoint",
    disposition,
    rationale:
      disposition === "accept"
        ? "The packet is in scope for independent receiver evaluation."
        : disposition === "decline"
          ? "The receiving Mind declines this bounded request."
          : "The receiving Mind cannot resolve the authority boundary alone.",
    receiver_authority_basis: [
      "role:delegated-worker-demo",
      "charter:buzz-synthetic-mind-conduit-v1",
    ],
    decided_at: "2026-07-29T16:32:00.000Z",
    evidence_refs: ["receiver-choice:independent", "tool-invocations:0"],
    escalation_target: disposition === "escalate" ? "thomas-demo" : null,
  };
}

test("delivers one packet with distinct endpoints and no authority transfer", async () => {
  const transport = new RecordingTransport();
  const result = await conduit(transport).send(await sendRequest());
  assert(result.status === "delivered", "packet must deliver");
  equal(transport.packets.length, 1, "transport must receive one packet");
  equal(result.receipt.packet.from.mind_id, "down-demo-mind", "sender Mind must bind");
  equal(result.receipt.packet.to.mind_id, "worker-demo-mind", "receiver Mind must bind");
  equal(result.receipt.authority_transfer, "none", "authority must not transfer");
  equal(
    result.receipt.packet.sender_authority_effect,
    "context_only",
    "sender authority must remain contextual",
  );
  equal(result.receipt.tool_invocations, 0, "delivery must invoke no tools");
  equal(
    result.receipt.lifecycle.receiver_decision,
    "pending",
    "receipt alone must not decide",
  );
  assert(
    result.receipt.sender_receipt_id !== result.receipt.receiver_receipt_id,
    "two-sided receipts must remain distinct",
  );
});

test("records an independent accept without converting it into action", async () => {
  const instance = conduit(new RecordingTransport());
  const delivered = await instance.send(await sendRequest());
  assert(delivered.status === "delivered", "packet must deliver");
  const result = await instance.recordDecision(
    decision(delivered.receipt.delivery_id),
  );
  assert(result.status === "recorded", "accept must record");
  equal(
    result.decision.consequence,
    "accepted_for_independent_evaluation",
    "accept must mean evaluation, not action",
  );
  equal(result.decision.authority_transfer, "none", "authority must stay local");
  equal(result.decision.tool_invocations, 0, "decision must execute nothing");
  equal(
    result.decision.next_authority_requirement,
    "receiver_authority_packet_required_before_action",
    "receiver must obtain its own authority packet",
  );
  assert(
    result.decision.linkage_refs.includes(
      `sender-receipt:${delivered.receipt.sender_receipt_id}`,
    ) &&
      result.decision.linkage_refs.includes(
        `receiver-receipt:${delivered.receipt.receiver_receipt_id}`,
      ),
    "receiver decision must preserve both endpoint receipts",
  );
});

test("records independent decline and escalation outcomes", async () => {
  for (const disposition of ["decline", "escalate"] as const) {
    const instance = conduit(new RecordingTransport());
    const request = await sendRequest();
    request.purpose += ` ${disposition}`;
    const delivered = await instance.send(request);
    assert(delivered.status === "delivered", `${disposition} packet must deliver`);
    const result = await instance.recordDecision(
      decision(delivered.receipt.delivery_id, disposition),
    );
    assert(result.status === "recorded", `${disposition} must record`);
    equal(result.decision.disposition, disposition, "choice must remain exact");
    equal(result.decision.tool_invocations, 0, "choice must execute nothing");
    if (disposition === "escalate") {
      equal(
        result.decision.next_authority_requirement,
        "named_escalation_required",
        "escalation must name the next authority path",
      );
      equal(result.decision.escalation_target, "thomas-demo", "target must bind");
    }
  }
});

test("suppresses sequential and concurrent duplicate deliveries", async () => {
  const transport = new RecordingTransport();
  transport.delay = true;
  const instance = conduit(transport);
  const request = await sendRequest();
  const [left, right] = await Promise.all([
    instance.send(structuredClone(request)),
    instance.send(structuredClone(request)),
  ]);
  equal(transport.packets.length, 1, "concurrent duplicate must deliver once");
  assert(
    [left.status, right.status].includes("delivered") &&
      [left.status, right.status].includes("duplicate"),
    "concurrent results must contain delivery and duplicate",
  );
  const third = await instance.send(structuredClone(request));
  assert(third.status === "duplicate", "sequential duplicate must deduplicate");
  equal(transport.packets.length, 1, "sequential duplicate must not redeliver");
});

test("preserves the first receiver decision and rejects a conflict", async () => {
  const store = new InMemoryMindConduitStore();
  const instance = conduit(new RecordingTransport(), store);
  const delivered = await instance.send(await sendRequest());
  assert(delivered.status === "delivered", "packet must deliver");
  const acceptedRequest = decision(delivered.receipt.delivery_id);
  const first = await instance.recordDecision(structuredClone(acceptedRequest));
  const duplicate = await instance.recordDecision(structuredClone(acceptedRequest));
  const conflict = await instance.recordDecision(
    decision(delivered.receipt.delivery_id, "decline"),
  );
  assert(first.status === "recorded", "first choice must record");
  assert(duplicate.status === "duplicate", "same choice must deduplicate");
  assert(conflict.status === "rejected", "changed choice must conflict");
  equal(conflict.rejection.code, "decision_conflict", "conflict code must bind");
  equal(store.decisionCount, 1, "only one receiver judgment may be stored");
});

test("fails closed for merged identities and sender role mismatch", async () => {
  const transport = new RecordingTransport();
  const merged = structuredClone(charter);
  merged.endpoints[1]!.mind_id = merged.endpoints[0]!.mind_id;
  const identity = await conduit(transport, undefined, merged).send(
    await sendRequest(),
  );
  assert(identity.status === "rejected", "merged Mind identities must reject");
  equal(
    identity.rejection.code,
    "endpoint_identity_not_distinct",
    "identity boundary code must bind",
  );

  const roleRequest = await sendRequest();
  roleRequest.authority_packet.role_context = ["foreign-role"];
  const role = await conduit(transport).send(roleRequest);
  assert(role.status === "rejected", "foreign sender role must reject");
  equal(role.rejection.code, "sender_role_mismatch", "role code must bind");
  equal(transport.packets.length, 0, "invalid identities must not reach transport");
});

test("fails closed for packet mutation, expired authority, and scope widening", async () => {
  const transport = new RecordingTransport();

  const mutated = await sendRequest();
  mutated.authority_packet.action_intent.resource = "fixture:BETA";
  const digest = await conduit(transport).send(mutated);
  assert(digest.status === "rejected", "mutated action must reject");
  equal(digest.rejection.code, "action_digest_mismatch", "digest code must bind");

  const expired = await sendRequest();
  expired.sent_at = "2026-07-29T16:36:00.000Z";
  expired.expires_at = "2026-07-29T16:37:00.000Z";
  const authority = await conduit(transport).send(expired);
  assert(authority.status === "rejected", "expired authority must reject");
  equal(
    authority.rejection.code,
    "authority_packet_expired",
    "expiration code must bind",
  );

  const widened = await sendRequest();
  widened.scope = ["synthetic-fixture-status", "production-write"];
  const scope = await conduit(transport).send(widened);
  assert(scope.status === "rejected", "scope widening must reject");
  equal(scope.rejection.code, "scope_not_allowed", "scope code must bind");
  equal(transport.packets.length, 0, "invalid packets must not reach transport");
});

test("does not record transport rejection or mismatched receiver acknowledgment", async () => {
  const rejectedTransport = new RecordingTransport();
  rejectedTransport.result = {
    status: "rejected",
    reason: "synthetic refusal",
    evidence_refs: ["transport:refused"],
  };
  const store = new InMemoryMindConduitStore();
  const rejected = await conduit(rejectedTransport, store).send(await sendRequest());
  assert(rejected.status === "rejected", "transport refusal must reject");
  equal(rejected.rejection.code, "transport_rejected", "transport code must bind");
  equal(store.deliveryCount, 0, "rejection must not create delivery state");

  const wrongReceiver = new RecordingTransport();
  wrongReceiver.result = {
    status: "received",
    transport_receipt_id: "foreign-receipt",
    receiver_endpoint_id: "foreign-endpoint",
    received_at: "2026-07-29T16:31:01.000Z",
    evidence_refs: ["transport:wrong-endpoint"],
  };
  const mismatch = await conduit(wrongReceiver, store).send(await sendRequest());
  assert(mismatch.status === "rejected", "foreign acknowledgment must reject");
  equal(
    mismatch.rejection.code,
    "transport_identity_mismatch",
    "transport identity code must bind",
  );
  equal(store.deliveryCount, 0, "foreign acknowledgment must not create state");
});

test("requires independent choice evidence and bounded escalation", async () => {
  const instance = conduit(new RecordingTransport());
  const delivered = await instance.send(await sendRequest());
  assert(delivered.status === "delivered", "packet must deliver");

  const unproven = decision(delivered.receipt.delivery_id);
  unproven.evidence_refs = ["tool-invocations:0"];
  const evidence = await instance.recordDecision(unproven);
  assert(evidence.status === "rejected", "unproven choice must reject");
  equal(
    evidence.rejection.code,
    "missing_independent_decision_evidence",
    "choice evidence code must bind",
  );

  const escalation = decision(delivered.receipt.delivery_id, "escalate");
  escalation.escalation_target = null;
  const target = await instance.recordDecision(escalation);
  assert(target.status === "rejected", "targetless escalation must reject");
  equal(
    target.rejection.code,
    "missing_escalation_target",
    "escalation code must bind",
  );
});

test("rejects ambiguous charter configuration and impossible decision timing", async () => {
  const request = await sendRequest();
  const ambiguous = new SyntheticMindConduit({
    charters: [charter, structuredClone(charter)],
    transport: new RecordingTransport(),
  });
  const configuration = await ambiguous.send(request);
  assert(configuration.status === "rejected", "duplicate charter IDs must reject");
  equal(
    configuration.rejection.code,
    "unknown_conduit",
    "ambiguous charter must not be selected",
  );

  const instance = conduit(new RecordingTransport());
  const delivered = await instance.send(await sendRequest());
  assert(delivered.status === "delivered", "packet must deliver");
  const early = decision(delivered.receipt.delivery_id);
  early.decided_at = "2026-07-29T16:30:59.000Z";
  const timing = await instance.recordDecision(early);
  assert(timing.status === "rejected", "pre-receipt decision must reject");
  equal(
    timing.rejection.code,
    "decision_time_invalid",
    "decision timing code must bind",
  );
});

test("exposes no execution, approval, ratification, or real-Mind attachment", () => {
  const instance = conduit(new RecordingTransport());
  equal("execute" in instance, false, "Conduit must expose no execution method");
  equal("approve" in instance, false, "Conduit must expose no approval method");
  equal("ratify" in instance, false, "Conduit must expose no ratification method");
  equal("attachMind" in instance, false, "Conduit must not attach a real Mind");
});

let failures = 0;
for (const entry of tests) {
  try {
    await entry.run();
    console.log(`ok - ${entry.name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${entry.name}`);
    console.error(error instanceof Error ? error.stack : String(error));
  }
}

if (failures > 0) throw new Error(`${failures} test(s) failed`);
console.log(`1..${tests.length}`);
console.log(`# ${tests.length} tests passed`);
