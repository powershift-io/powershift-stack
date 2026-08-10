import {
  AuthorizedContextBroker,
  sha256Hex,
  type AuthorizedContextRequest,
  type AuthorizedContextSource,
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

const actorId = "thomas-thomison::orchestrator";
const roomId = "governance-room-alpha";
const laneId = "cross-mind-tensions";
const authoritySource = "authority-source:synthetic-governance-authority-v1";
const excerpts = {
  identity: "Human-Demo is Orchestrator. Mind-A fills Platform Lead. Mind-B fills General Lead.",
  contract: "Mentions and membership confer no authority. Consequential execution remains disabled.",
  evidence: "P3 passed with exact signers, lineage, Air/Pro presentation, and zero authority transfer.",
};

async function source(
  sourceId: string,
  content: string,
  overrides: Partial<AuthorizedContextSource> = {},
): Promise<AuthorizedContextSource> {
  return {
    source_id: sourceId,
    source_uri: `repo://pilot/${sourceId}.md`,
    source_version_ref: `git:3daa9504:${sourceId}`,
    content,
    content_sha256: await sha256Hex(content),
    canonical_actor_ids: [actorId],
    allowed_mind_ids: ["down", "dance"],
    allowed_role_ids: ["platform-circle-lead", "general-circle-lead"],
    allowed_lane_ids: [laneId],
    privacy_tier: "pilot_internal",
    sensitivity_tier: "low",
    retention_policy: "p4-pilot-evidence",
    required_authority_refs: [authoritySource],
    status: "active",
    ...overrides,
  };
}

function request(overrides: Partial<AuthorizedContextRequest> = {}): AuthorizedContextRequest {
  return {
    request_id: "ctx-p4-alpha-down",
    room_id: roomId,
    tension_packet_id: "tp-p4-alpha",
    canonical_actor_id: actorId,
    mind_id: "down",
    role_id: "platform-circle-lead",
    lane_id: laneId,
    requested_source_ids: ["identity", "contract", "evidence"],
    authority_refs: [authoritySource, "role:platform-circle-lead"],
    requested_at: "2026-08-05T10:00:00.000Z",
    max_bytes: 4_096,
    ...overrides,
  };
}

async function sources(): Promise<AuthorizedContextSource[]> {
  return Promise.all([
    source("identity", excerpts.identity),
    source("contract", excerpts.contract),
    source("evidence", excerpts.evidence),
  ]);
}

test("releases only exact allowlisted sources with complete governance metadata", async () => {
  const result = await new AuthorizedContextBroker({ sources: await sources() }).retrieve(request());
  assert(result.status === "authorized", "bounded request must authorize");
  equal(result.receipt.citations.length, 3, "all exact sources must be cited");
  equal(result.receipt.retrieval_count, 3, "retrieval count must be explicit");
  equal(result.receipt.promotion_count, 0, "retrieval must not promote context");
  equal(result.receipt.private_context_refs.length, 0, "private context must remain empty");
  equal(result.receipt.cross_mind_context_refs.length, 0, "cross-Mind context must remain empty");
  equal(result.receipt.execution_posture, "not_executed", "retrieval must not execute");
});

test("binds the same shared sources independently to each Mind and role", async () => {
  const broker = new AuthorizedContextBroker({ sources: await sources() });
  const down = await broker.retrieve(request());
  const dance = await broker.retrieve(request({
    request_id: "ctx-p4-alpha-dance",
    mind_id: "dance",
    role_id: "general-circle-lead",
    authority_refs: [authoritySource, "role:general-circle-lead"],
  }));
  assert(down.status === "authorized" && dance.status === "authorized", "both explicit roles must authorize");
  equal(down.receipt.citations[0]!.content_sha256, dance.receipt.citations[0]!.content_sha256, "shared source digest must match");
  assert(down.receipt.receipt_id !== dance.receipt.receipt_id, "Mind-role receipts must remain distinct");
});

test("missing or spoofed role authority fails closed", async () => {
  const broker = new AuthorizedContextBroker({ sources: await sources() });
  const missing = await broker.retrieve(request({ role_id: "observer" }));
  equal(missing.status, "rejected", "unknown role must reject");
  if (missing.status === "rejected") equal(missing.rejection.code, "role_not_allowed", "role rejection must be explicit");

  const noAuthority = await broker.retrieve(request({ authority_refs: ["role:platform-circle-lead"] }));
  equal(noAuthority.status, "rejected", "missing authority source must reject");
  if (noAuthority.status === "rejected") equal(noAuthority.rejection.code, "authority_missing", "authority rejection must be explicit");
});

test("unknown, unavailable, changed, and oversized context all fail closed", async () => {
  const approved = await sources();
  const broker = new AuthorizedContextBroker({ sources: approved, max_context_bytes: 4_096 });
  const unknown = await broker.retrieve(request({ requested_source_ids: ["unknown"] }));
  if (unknown.status === "rejected") equal(unknown.rejection.code, "source_unknown", "unknown source code");

  const unavailableSources = await sources();
  unavailableSources[0]!.status = "inactive";
  const unavailable = await new AuthorizedContextBroker({ sources: unavailableSources }).retrieve(request());
  if (unavailable.status === "rejected") equal(unavailable.rejection.code, "source_unavailable", "offline source code");

  const changedSources = await sources();
  changedSources[0]!.content = "changed after approval";
  const changed = await new AuthorizedContextBroker({ sources: changedSources }).retrieve(request());
  if (changed.status === "rejected") equal(changed.rejection.code, "source_digest_mismatch", "digest mismatch code");

  const oversized = await broker.retrieve(request({ max_bytes: 16 }));
  if (oversized.status === "rejected") equal(oversized.rejection.code, "context_budget_exceeded", "budget code");
});

test("identical replay produces the same receipt without writes", async () => {
  const broker = new AuthorizedContextBroker({ sources: await sources() });
  const first = await broker.retrieve(request());
  const replay = await broker.retrieve(request());
  assert(first.status === "authorized" && replay.status === "authorized", "both deterministic reads must authorize");
  equal(first.receipt.receipt_id, replay.receipt.receipt_id, "receipt identity must be deterministic");
  equal(replay.receipt.promotion_count, 0, "replay must write nothing");
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
