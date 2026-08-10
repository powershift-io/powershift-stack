import {
  BuzzReadOnlyAdapter,
  SyntheticAuthorityEvaluator,
  computeActionDigest,
  type ActionIntent,
  type AuthorityDecision,
  type AuthorityEvaluationRequest,
  type AuthorityPacket,
  type SyntheticAuthoritySnapshot,
  type TensionPacket,
} from "../src/index.js";
import {
  authoritySnapshot,
  blockAction,
  escalateAction,
  proposeAction,
  ratifyAction,
  readAction,
} from "./authority-fixtures.js";
import {
  COMMUNITY_ID,
  RELAY,
  downBinding,
  downDemoEvent,
  envelope,
} from "./fixtures.js";

type Test = { name: string; run: () => void | Promise<void> };
const tests: Test[] = [];

function test(name: string, run: Test["run"]): void {
  tests.push({ name, run });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\nexpected: ${String(expected)}\nactual: ${String(actual)}`,
    );
  }
}

async function tensionPacket(): Promise<TensionPacket> {
  const adapter = new BuzzReadOnlyAdapter({
    allowed_relays: [RELAY],
    allowed_community_ids: [COMMUNITY_ID],
    allowed_authority_source_refs: [authoritySnapshot.snapshot_id],
    bindings: [downBinding],
  });
  const result = await adapter.ingest(envelope(downDemoEvent));
  assert(result.status === "accepted", "fixture intake must be accepted");
  return result.packet;
}

function evaluator(
  snapshots: SyntheticAuthoritySnapshot[] = [authoritySnapshot],
  maxActionBytes?: number,
): SyntheticAuthorityEvaluator {
  return new SyntheticAuthorityEvaluator({
    snapshots,
    ...(maxActionBytes ? { max_action_bytes: maxActionBytes } : {}),
  });
}

async function request(
  action: ActionIntent,
  overrides: Partial<AuthorityEvaluationRequest> = {},
): Promise<AuthorityEvaluationRequest> {
  return {
    tension_packet: await tensionPacket(),
    action_intent: structuredClone(action),
    authority_snapshot_ref: authoritySnapshot.snapshot_id,
    evaluated_at: "2026-07-29T16:30:00.000Z",
    ...overrides,
  };
}

async function authorityPacket(
  action: ActionIntent,
  instance = evaluator(),
  overrides: Partial<AuthorityEvaluationRequest> = {},
): Promise<AuthorityPacket> {
  const result = await instance.evaluate(await request(action, overrides));
  assert(result.status === "evaluated", "evaluation must return a packet");
  return result.packet;
}

test("emits all five governed outcomes from the synthetic authority source", async () => {
  const cases: Array<[ActionIntent, AuthorityDecision]> = [
    [readAction, "allow"],
    [proposeAction, "propose"],
    [escalateAction, "escalate"],
    [blockAction, "block"],
    [ratifyAction, "ratify"],
  ];
  for (const [action, expected] of cases) {
    const packet = await authorityPacket(action);
    equal(packet.decision, expected, `${action.intent_id} decision must match`);
    equal(
      packet.evaluation_code,
      "matched_rule",
      `${action.intent_id} must name its matched rule`,
    );
    assert(
      packet.authority_basis.length >= 3,
      `${action.intent_id} must name an authority basis`,
    );
    equal(
      packet.execution_posture,
      "not_executed",
      "evaluation cannot claim execution",
    );
  }
});

test("routes approval and ratification without converting them into execution", async () => {
  const proposed = await authorityPacket(proposeAction);
  equal(
    proposed.required_approvers[0],
    "thomas-demo",
    "material change must route to its synthetic approver",
  );
  const escalated = await authorityPacket(escalateAction);
  equal(
    escalated.required_approvers[0],
    "thomas-demo",
    "protected boundary must route to its synthetic approver",
  );
  const ratification = await authorityPacket(ratifyAction);
  equal(
    ratification.required_ratifiers[0],
    "thomas-demo",
    "external commitment must name its synthetic ratifier",
  );
  equal(
    ratification.execution_posture,
    "not_executed",
    "ratification request must not claim ratification or execution",
  );
});

test("fails closed for unknown snapshot, actor, capability, and provenance", async () => {
  const unknownSnapshot = await authorityPacket(readAction, evaluator([]));
  equal(
    unknownSnapshot.evaluation_code,
    "unknown_authority_snapshot",
    "unknown snapshot must be explicit",
  );
  equal(unknownSnapshot.decision, "block", "unknown snapshot must block");

  const unknownActorRequest = await request(readAction);
  unknownActorRequest.tension_packet.canonical_actor_id = "unbound-demo";
  const unknownActor = await evaluator().evaluate(unknownActorRequest);
  assert(unknownActor.status === "evaluated", "unknown actor must get a block packet");
  equal(unknownActor.packet.decision, "block", "unknown actor must block");
  equal(
    unknownActor.packet.evaluation_code,
    "unknown_actor",
    "unknown actor must be explicit",
  );

  const unknownCapability: ActionIntent = {
    ...structuredClone(readAction),
    capability: "synthetic.ungranted.read",
  };
  const noAuthority = await authorityPacket(unknownCapability);
  equal(noAuthority.decision, "block", "unknown capability must block");
  equal(
    noAuthority.evaluation_code,
    "no_matching_authority",
    "no implicit capability may be inferred",
  );

  const unboundSourceRequest = await request(readAction);
  unboundSourceRequest.tension_packet.provenance_refs =
    unboundSourceRequest.tension_packet.provenance_refs.filter(
      (entry) => !entry.startsWith("authority-source:"),
    );
  const unboundSource = await evaluator().evaluate(unboundSourceRequest);
  assert(unboundSource.status === "evaluated", "unbound source must get block packet");
  equal(
    unboundSource.packet.evaluation_code,
    "snapshot_not_bound_to_tension",
    "Tension Packet must carry the authority-source binding",
  );
});

test("fails closed for ambiguous and unsafe authority rules", async () => {
  const duplicateSnapshot = structuredClone(authoritySnapshot);
  duplicateSnapshot.rules.push({
    ...structuredClone(duplicateSnapshot.rules[0]!),
    rule_id: "rule-read-alpha-status-conflict",
  });
  const ambiguous = await authorityPacket(readAction, evaluator([duplicateSnapshot]));
  equal(ambiguous.decision, "block", "ambiguous authority must block");
  equal(
    ambiguous.evaluation_code,
    "ambiguous_authority",
    "ambiguity must be explicit",
  );

  const unsafeSnapshot = structuredClone(authoritySnapshot);
  unsafeSnapshot.rules[0]!.required_approvers = ["thomas-demo"];
  const unsafe = await authorityPacket(readAction, evaluator([unsafeSnapshot]));
  equal(unsafe.decision, "block", "unsafe allow rule must block");
  equal(
    unsafe.evaluation_code,
    "unsafe_authority_rule",
    "unsafe rule must be explicit",
  );
});

test("canonical action digest ignores object key order but detects mutation", async () => {
  const left: ActionIntent = {
    ...structuredClone(readAction),
    parameters: { beta: 2, alpha: 1 },
  };
  const right: ActionIntent = {
    ...structuredClone(readAction),
    parameters: { alpha: 1, beta: 2 },
  };
  equal(
    await computeActionDigest(left),
    await computeActionDigest(right),
    "JSON object key order must not change the digest",
  );

  const changed: ActionIntent = {
    ...structuredClone(right),
    resource: "fixture:BETA",
  };
  assert(
    (await computeActionDigest(right)) !== (await computeActionDigest(changed)),
    "material action mutation must change the digest",
  );
});

test("validates only an unchanged, unexpired allow decision", async () => {
  const instance = evaluator();
  const packet = await authorityPacket(readAction, instance);
  const valid = await instance.validate(
    packet,
    structuredClone(readAction),
    "2026-07-29T16:34:59.000Z",
  );
  equal(valid.valid, true, "unchanged allow must validate before expiry");

  const changed: ActionIntent = {
    ...structuredClone(readAction),
    operation: "export",
  };
  const mutation = await instance.validate(
    packet,
    changed,
    "2026-07-29T16:31:00.000Z",
  );
  equal(mutation.valid, false, "changed action must invalidate decision");
  equal(
    mutation.code,
    "action_digest_mismatch",
    "mutation must report digest mismatch",
  );

  const expired = await instance.validate(
    packet,
    structuredClone(readAction),
    "2026-07-29T16:35:00.000Z",
  );
  equal(expired.valid, false, "expired packet must not validate");
  equal(
    expired.code,
    "authority_packet_expired",
    "expiry must require re-evaluation",
  );
});

test("non-allow outcomes never validate as execution authority", async () => {
  for (const action of [
    proposeAction,
    escalateAction,
    blockAction,
    ratifyAction,
  ]) {
    const instance = evaluator();
    const packet = await authorityPacket(action, instance);
    const validation = await instance.validate(
      packet,
      structuredClone(action),
      "2026-07-29T16:31:00.000Z",
    );
    equal(
      validation.code,
      "decision_not_allow",
      `${packet.decision} must not confer execution authority`,
    );
  }
});

test("rejects forged, modified, or foreign Authority Packets", async () => {
  const issuingEvaluator = evaluator();
  const packet = await authorityPacket(readAction, issuingEvaluator);

  const modified = structuredClone(packet);
  modified.constraints.push("forged constraint");
  const modifiedResult = await issuingEvaluator.validate(
    modified,
    structuredClone(readAction),
    "2026-07-29T16:31:00.000Z",
  );
  equal(
    modifiedResult.code,
    "unrecognized_authority_packet",
    "modified packet must fail the issuance registry",
  );

  const foreignResult = await evaluator().validate(
    packet,
    structuredClone(readAction),
    "2026-07-29T16:31:00.000Z",
  );
  equal(
    foreignResult.code,
    "unrecognized_authority_packet",
    "a fresh evaluator must not trust an unregistered packet",
  );
});

test("produces deterministic packets for the same bounded request", async () => {
  const input = await request(readAction);
  const instance = evaluator();
  const first = await instance.evaluate(structuredClone(input));
  const second = await instance.evaluate(structuredClone(input));
  assert(
    first.status === "evaluated" && second.status === "evaluated",
    "both evaluations must return packets",
  );
  equal(
    first.packet.packet_id,
    second.packet.packet_id,
    "same request must yield same Authority Packet ID",
  );
  equal(
    first.packet.action_digest,
    second.packet.action_digest,
    "same request must yield same action digest",
  );
});

test("rejects malformed and oversized evaluation input", async () => {
  const malformed = await evaluator().evaluate(null);
  assert(malformed.status === "rejected", "malformed input must reject");
  equal(
    malformed.rejection.code,
    "invalid_request",
    "malformed input must be explicit",
  );
  assert(
    malformed.rejection.authority_basis.length > 0,
    "rejection must name fail-closed basis",
  );

  const oversizedAction: ActionIntent = {
    ...structuredClone(readAction),
    parameters: { value: "x".repeat(1_000) },
  };
  const oversized = await evaluator([authoritySnapshot], 128).evaluate(
    await request(oversizedAction),
  );
  assert(oversized.status === "rejected", "oversized action must reject");
  equal(
    oversized.rejection.code,
    "action_too_large",
    "oversized action must be explicit",
  );
});

test("exposes evaluation and validation without an execution bypass", () => {
  const instance = evaluator();
  equal(
    "execute" in instance,
    false,
    "authority evaluator must expose no execution method",
  );
  equal(
    "approve" in instance,
    false,
    "authority evaluator must expose no approval override",
  );
  equal(
    "ratify" in instance,
    false,
    "authority evaluator must expose no ratification override",
  );
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

if (failures > 0) {
  throw new Error(`${failures} test(s) failed`);
}

console.log(`1..${tests.length}`);
console.log(`# ${tests.length} tests passed`);
