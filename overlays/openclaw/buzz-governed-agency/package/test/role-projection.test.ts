import {
  RoleAuthorityProjector,
  type ActionIntent,
  type MindRoleBinding,
  type RoleProjectionRequest,
  type SyntheticAuthorityRule,
  type SyntheticAuthoritySnapshot,
  type TensionPacket,
} from "../src/index.js";

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
    throw new Error(`${message}\nexpected: ${String(expected)}\nactual: ${String(actual)}`);
  }
}

const validFrom = "2026-07-31T00:00:00.000Z";
const validUntil = "2026-08-01T00:00:00.000Z";
const snapshotId = "synthetic-b4-role-authority-v1";
const action: ActionIntent = {
  intent_id: "b4-shared-status-read",
  action_type: "read",
  capability: "synthetic.b4.status.read",
  resource: "fixture:B4-SHARED",
  operation: "inspect",
  parameters: { execution: false },
};

function rule(
  ruleId: string,
  actorId: string,
  roleId: string,
  outcome: "allow" | "escalate",
): SyntheticAuthorityRule {
  return {
    rule_id: ruleId,
    actor_id: actorId,
    capability_envelope: {
      capability: action.capability,
      action_types: ["read"],
      resources: [action.resource],
      operations: [action.operation],
      mode: outcome === "allow" ? "read_only" : "escalation_only",
    },
    decision_class: outcome === "allow" ? "low_risk_read" : "protected_boundary",
    outcome,
    decision_reason:
      outcome === "allow"
        ? "The selected lead role may inspect the synthetic fixture."
        : "The observer role must route the same request to the Orchestrator.",
    authority_basis: [
      `role:${roleId}`,
      "policy:synthetic-b4-explicit-role-packet",
    ],
    constraints: ["No execution.", "No production data."],
    required_approvers: outcome === "allow" ? [] : ["thomas-b4"],
    required_ratifiers: [],
    valid_from: validFrom,
    valid_until: validUntil,
    ttl_seconds: 300,
    status: "active",
  };
}

const actors = [
  ["down", "platform-circle-lead", "allow"],
  ["down", "platform-observer", "escalate"],
  ["pd", "general-circle-lead", "allow"],
  ["pd", "general-circle-observer", "escalate"],
] as const;

const snapshot: SyntheticAuthoritySnapshot = {
  snapshot_id: snapshotId,
  snapshot_version: "0.1",
  description: "Synthetic B4 role authority; never a governance record.",
  valid_from: validFrom,
  valid_until: validUntil,
  status: "active",
  actors: actors.map(([mind, role]) => ({
    actor_id: `${mind}::${role}`,
    role_context: [role],
    status: "active",
  })),
  rules: actors.map(([mind, role, outcome]) =>
    rule(`rule-${mind}-${role}`, `${mind}::${role}`, role, outcome),
  ),
};

const bindings: MindRoleBinding[] = actors.map(([mind, role]) => ({
  binding_id: `binding-${mind}-${role}`,
  mind_id: mind,
  openclaw_agent_id: mind,
  role_id: role,
  authority_actor_id: `${mind}::${role}`,
  authority_source_ref: snapshotId,
  valid_from: validFrom,
  valid_until: validUntil,
  status: "active",
}));

const tension: TensionPacket = {
  packet_id: "tp_b4_role_projection_fixture",
  packet_version: "0.1",
  source_system: "buzz",
  source_relay: "ws://127.0.0.1:3000",
  source_community: "00000000-0000-4000-8000-0000000000b4",
  source_event_id: "b4".repeat(32),
  source_event_kind: 9,
  source_pubkey: "aa".repeat(32),
  source_created_at: "2026-07-31T17:00:00.000Z",
  ingested_at: "2026-07-31T17:00:01.000Z",
  canonical_actor_id: "thomas-b4",
  binding_ref: "binding-thomas-b4",
  raw_signal_digest: "bb".repeat(32),
  summary: "Synthetic B4 role request.",
  classification: "buzz_message",
  affected_objects: ["fixture:B4-SHARED"],
  proposed_route: "authority_evaluator",
  provenance_refs: [
    "buzz-event:b4",
    `authority-source:${snapshotId}`,
  ],
  freshness_state: "fresh",
  replay_state: "first_seen",
  thread_context: {
    channel_id: "00000000-0000-4000-8000-0000000000c4",
    root_event_id: null,
    direct_reply_event_id: null,
    reply_semantics: "none",
    mentioned_pubkeys: [],
  },
};

function projector(customBindings = bindings): RoleAuthorityProjector {
  return new RoleAuthorityProjector({
    bindings: structuredClone(customBindings),
    snapshots: [structuredClone(snapshot)],
  });
}

function request(
  mindId: string,
  roleId: string | null,
  labels: string[] = [],
): RoleProjectionRequest {
  return {
    tension_packet: structuredClone(tension),
    action_intent: structuredClone(action),
    mind_id: mindId,
    requested_role_id: roleId,
    authority_snapshot_ref: snapshotId,
    evaluated_at: "2026-07-31T17:00:02.000Z",
    buzz_channel_labels: labels,
  };
}

test("projects two explicit roles for each Mind with different outcomes", async () => {
  for (const [mind, role, expected] of actors) {
    const result = await projector().project(request(mind, role));
    assert(result.status === "evaluated", `${mind}/${role} must evaluate`);
    equal(result.authority_packet.decision, expected, "packet decision must match");
    equal(result.receipt.decision, expected, "receipt decision must match");
    equal(result.receipt.mind_id, mind, "receipt must name the Mind");
    equal(result.receipt.active_role_id, role, "receipt must name the active role");
  }
});

test("channel labels do not grant an absent role", async () => {
  const result = await projector().project(
    request("down", null, ["platform-circle-lead", "admin"]),
  );
  equal(result.status, "blocked", "missing explicit role must block");
  equal(result.receipt.decision_code, "missing_role", "absence must be explicit");
  equal(result.receipt.active_role_id, null, "no role may be inferred");
  equal(
    result.receipt.channel_membership_grants_authority,
    false,
    "Buzz membership is not authority",
  );
});

test("cross-Mind role spoofing fails closed", async () => {
  const result = await projector().project(
    request("down", "general-circle-lead", ["general-circle-lead"]),
  );
  equal(result.status, "blocked", "foreign role must block");
  equal(result.receipt.decision_code, "unknown_role", "spoof must be explicit");
  equal(result.receipt.authority_packet_id, null, "spoof gets no Authority Packet");
});

test("ambiguous and expired role bindings fail closed", async () => {
  const ambiguous = await projector([
    ...bindings,
    { ...bindings[0]!, binding_id: "binding-down-platform-lead-copy" },
  ]).project(request("down", "platform-circle-lead"));
  equal(ambiguous.receipt.decision_code, "ambiguous_role", "ambiguity must block");

  const expiredBindings = structuredClone(bindings);
  expiredBindings[0]!.valid_until = "2026-07-31T16:00:00.000Z";
  const expired = await projector(expiredBindings).project(
    request("down", "platform-circle-lead"),
  );
  equal(expired.receipt.decision_code, "role_binding_expired", "expiry must block");
});

test("role switching is request-scoped and copies no private context", async () => {
  const instance = projector();
  const lead = await instance.project(request("pd", "general-circle-lead"));
  const observer = await instance.project(request("pd", "general-circle-observer"));
  assert(lead.status === "evaluated" && observer.status === "evaluated", "both roles evaluate");
  equal(lead.receipt.active_role_id, "general-circle-lead", "lead selected");
  equal(observer.receipt.active_role_id, "general-circle-observer", "observer selected");
  equal(lead.receipt.private_context_refs.length, 0, "lead copies no private context");
  equal(observer.receipt.private_context_refs.length, 0, "observer copies no private context");
});

test("receipt names requester, Mind, role, authority, decision, and consequence", async () => {
  const result = await projector().project(
    request("down", "platform-circle-lead", ["untrusted-admin-label"]),
  );
  assert(result.status === "evaluated", "explicit role must evaluate");
  const receipt = result.receipt;
  equal(receipt.requested_by_actor_id, "thomas-b4", "requester must be named");
  equal(receipt.mind_id, "down", "Mind must be named");
  equal(receipt.openclaw_agent_id, "down", "OpenClaw agent must be named");
  equal(receipt.active_role_id, "platform-circle-lead", "role must be named");
  equal(receipt.authority_source_ref, snapshotId, "authority source must be named");
  equal(receipt.decision, "allow", "decision must be named");
  assert(receipt.consequence.includes("no execution occurred"), "consequence must be explicit");
  equal(receipt.execution_posture, "not_executed", "execution must remain absent");
});

test("same action is allowed in lead roles and escalated in observer roles", async () => {
  for (const mind of ["down", "pd"] as const) {
    const leadRole = mind === "down" ? "platform-circle-lead" : "general-circle-lead";
    const observerRole = mind === "down" ? "platform-observer" : "general-circle-observer";
    const lead = await projector().project(request(mind, leadRole));
    const observer = await projector().project(request(mind, observerRole));
    assert(lead.status === "evaluated" && observer.status === "evaluated", "both must evaluate");
    equal(lead.authority_packet.action_digest, observer.authority_packet.action_digest, "action must be identical");
    equal(lead.receipt.decision, "allow", "lead must allow");
    equal(observer.receipt.decision, "escalate", "observer must escalate");
  }
});

let passed = 0;
for (const entry of tests) {
  try {
    await entry.run();
    passed += 1;
    process.stdout.write(`ok - ${entry.name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${entry.name}\n`);
    throw error;
  }
}
process.stdout.write(`1..${tests.length}\n# ${passed} tests passed\n`);
