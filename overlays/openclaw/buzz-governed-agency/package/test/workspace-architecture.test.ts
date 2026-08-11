import {
  BuzzWorkspaceArchitect,
  type CoordinationNeed,
  type WorkspaceArchitectureConfig,
  type WorkspaceContainer,
  type WorkspaceRouteRequest,
  type WorkspaceThreadBinding,
  type WorkspaceThreadKind,
} from "../src/index.js";

type Test = { name: string; run: () => void | Promise<void> };
const tests: Test[] = [];
function test(name: string, run: Test["run"]): void { tests.push({ name, run }); }
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function equal<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${message}\nexpected: ${String(expected)}\nactual: ${String(actual)}`);
  }
}

const channel = {
  down: "workspace-mind-down",
  dance: "workspace-mind-dance",
  platform: "workspace-platform-circle",
  general: "workspace-general-circle",
  engine: "workspace-engine-room",
  shared: "workspace-cross-mind",
} as const;

function container(
  containerId: string,
  label: string,
  kind: WorkspaceContainer["kind"],
  domain: string,
  threadKinds: WorkspaceThreadKind[],
  minds: string[],
): WorkspaceContainer {
  return {
    container_id: containerId,
    label,
    kind,
    governed_domain: domain,
    allowed_thread_kinds: threadKinds,
    allowed_mind_ids: minds,
    durable: true,
    channel_membership_grants_authority: false,
    status: "active",
  };
}

const containers: WorkspaceContainer[] = [
  container(channel.down, "Human ↔ Mind A", "mind_lane", "mind-a-lane", ["direct_exchange"], ["down"]),
  container(channel.dance, "Human ↔ Mind B", "mind_lane", "mind-b-lane", ["direct_exchange"], ["pd"]),
  container(channel.platform, "Platform Circle", "governance", "platform-circle", ["tension_packet", "work_packet"], ["down", "pd"]),
  container(channel.general, "General Circle", "governance", "general-circle", ["tension_packet", "work_packet"], ["down", "pd"]),
  container(channel.engine, "Engine Room", "operations", "engine-room", ["report_card", "work_packet"], ["down", "pd"]),
  container(channel.shared, "Cross-Mind Tensions", "shared_coordination", "anchor-circle", ["tension_packet", "work_packet"], ["down", "pd"]),
];

const roots = {
  platformTension: "11".repeat(32),
  platformWork: "12".repeat(32),
  generalTension: "13".repeat(32),
  engineReport: "14".repeat(32),
  sharedTension: "15".repeat(32),
} as const;

const threads: WorkspaceThreadBinding[] = [
  { thread_root_event_id: roots.platformTension, container_id: channel.platform, thread_kind: "tension_packet", work_packet_ref: "tension:B5-PLATFORM", created_by_actor_id: "thomas-b5", target_mind_ids: ["down"], status: "open" },
  { thread_root_event_id: roots.platformWork, container_id: channel.platform, thread_kind: "work_packet", work_packet_ref: "work:B5-IMPLEMENTATION", created_by_actor_id: "thomas-b5", target_mind_ids: ["down"], status: "open" },
  { thread_root_event_id: roots.generalTension, container_id: channel.general, thread_kind: "tension_packet", work_packet_ref: "tension:B5-GENERAL", created_by_actor_id: "thomas-b5", target_mind_ids: ["pd"], status: "open" },
  { thread_root_event_id: roots.engineReport, container_id: channel.engine, thread_kind: "report_card", work_packet_ref: "report:B5-ENGINE", created_by_actor_id: "thomas-b5", target_mind_ids: ["down", "pd"], status: "open" },
  { thread_root_event_id: roots.sharedTension, container_id: channel.shared, thread_kind: "tension_packet", work_packet_ref: "tension:B5-CROSS-MIND", created_by_actor_id: "thomas-b5", target_mind_ids: ["down", "pd"], status: "open" },
];

const needMap: Record<CoordinationNeed, string> = {
  human_mind_primary: channel.down,
  human_mind_secondary: channel.dance,
  platform_circle: channel.platform,
  general_circle: channel.general,
  engine_room: channel.engine,
  cross_mind_tension: channel.shared,
  time_bounded_implementation: channel.platform,
};

const config: WorkspaceArchitectureConfig = { containers, threads, need_map: needMap };
function architect(custom: WorkspaceArchitectureConfig = config): BuzzWorkspaceArchitect {
  return new BuzzWorkspaceArchitect(structuredClone(custom));
}
function request(overrides: Partial<WorkspaceRouteRequest> = {}): WorkspaceRouteRequest {
  return {
    source_event_id: "aa".repeat(32),
    requested_by_actor_id: "thomas-b5",
    container_id: channel.platform,
    requested_thread_kind: "tension_packet",
    reply_to_event_id: roots.platformTension,
    explicit_attention_targets: [],
    mentioned_mind_ids: [],
    buzz_channel_labels: [],
    ...structuredClone(overrides),
  };
}

test("maps seven Telegram needs into six durable containers without channel sprawl", () => {
  for (const need of Object.keys(needMap) as CoordinationNeed[]) {
    const mapped = architect().mapNeed(need);
    assert(mapped !== null, `${need} must map to one active container`);
    equal(mapped.durable, true, "mapped containers must be durable");
    equal(mapped.channel_membership_grants_authority, false, "membership must grant no authority");
  }
  equal(new Set(Object.values(needMap)).size, 6, "implementation work must nest in governance rather than create a seventh channel");
});

test("routes direct lanes, governance threads, operations reports, and shared tensions", async () => {
  const cases: WorkspaceRouteRequest[] = [
    request({ container_id: channel.down, requested_thread_kind: "direct_exchange", reply_to_event_id: null, explicit_attention_targets: ["down"] }),
    request({ container_id: channel.dance, requested_thread_kind: "direct_exchange", reply_to_event_id: null, explicit_attention_targets: ["pd"] }),
    request({ container_id: channel.platform, requested_thread_kind: "tension_packet", reply_to_event_id: roots.platformTension }),
    request({ container_id: channel.general, requested_thread_kind: "tension_packet", reply_to_event_id: roots.generalTension }),
    request({ container_id: channel.engine, requested_thread_kind: "report_card", reply_to_event_id: roots.engineReport }),
    request({ container_id: channel.shared, requested_thread_kind: "tension_packet", reply_to_event_id: roots.sharedTension }),
    request({ container_id: channel.platform, requested_thread_kind: "work_packet", reply_to_event_id: roots.platformWork }),
  ];
  for (const candidate of cases) {
    const result = await architect().route(candidate);
    equal(result.status, "routed", `${candidate.container_id}/${candidate.requested_thread_kind} must route`);
  }
});

test("mentions route attention but grant no role or authority", async () => {
  const result = await architect().route(request({
    container_id: channel.shared,
    requested_thread_kind: "tension_packet",
    reply_to_event_id: roots.sharedTension,
    mentioned_mind_ids: ["pd", "down"],
    buzz_channel_labels: ["anchor-circle", "admin", "general-circle-lead"],
  }));
  assert(result.status === "routed", "known mentions in a shared thread must route");
  equal(result.receipt.attention_targets.join(","), "down,pd", "mentions must route both Minds");
  equal(result.receipt.mentions_grant_authority, false, "mentions must grant no authority");
  equal(result.receipt.channel_membership_grants_authority, false, "membership must grant no authority");
  equal(result.receipt.active_role_id, null, "routing must project no role");
  equal(result.receipt.authority_effect, "none", "routing must have no authority effect");
});

test("role-shaped labels do not alter workspace routing", async () => {
  const plain = await architect().route(request());
  const labeled = await architect().route(request({ buzz_channel_labels: ["platform-circle-lead", "owner", "admin"] }));
  equal(plain.status, "routed", "plain route must pass");
  equal(labeled.status, "routed", "role-shaped labels must remain presentation metadata");
  equal(labeled.receipt.active_role_id, null, "labels must not project a role");
  equal(labeled.receipt.authority_effect, "none", "labels must not change authority");
});

test("unknown, ambiguous, and inactive containers fail closed", async () => {
  const unknown = await architect().route(request({ container_id: "unknown-channel" }));
  equal(unknown.status, "blocked", "unknown channel must block");
  equal(unknown.receipt.decision_code, "unknown_container", "unknown code must be exact");

  const ambiguousConfig = structuredClone(config);
  ambiguousConfig.containers.push(structuredClone(containers[2]!));
  const ambiguous = await architect(ambiguousConfig).route(request());
  equal(ambiguous.receipt.decision_code, "ambiguous_container", "duplicate binding must block");

  const inactiveConfig = structuredClone(config);
  inactiveConfig.containers[2]!.status = "inactive";
  const inactive = await architect(inactiveConfig).route(request());
  equal(inactive.receipt.decision_code, "container_inactive", "inactive channel must block");
});

test("thread kind and reply lineage are exact", async () => {
  const wrongKind = await architect().route(request({ requested_thread_kind: "work_packet" }));
  equal(wrongKind.receipt.decision_code, "thread_kind_mismatch", "thread-kind substitution must block");

  const unknownRoot = await architect().route(request({ reply_to_event_id: "ff".repeat(32) }));
  equal(unknownRoot.receipt.decision_code, "thread_not_found", "unknown root must block");

  const crossContainer = await architect().route(request({
    container_id: channel.general,
    reply_to_event_id: roots.platformTension,
  }));
  equal(crossContainer.receipt.decision_code, "thread_container_mismatch", "cross-channel root must block");

  const invalidKind = await architect().route(request({
    container_id: channel.down,
    requested_thread_kind: "report_card",
    reply_to_event_id: null,
    explicit_attention_targets: ["down"],
  }));
  equal(invalidKind.receipt.decision_code, "thread_kind_not_allowed", "container/thread mismatch must block");
});

test("unknown or cross-Mind attention cannot enter a direct lane", async () => {
  const foreign = await architect().route(request({
    container_id: channel.down,
    requested_thread_kind: "direct_exchange",
    reply_to_event_id: null,
    mentioned_mind_ids: ["pd"],
  }));
  equal(foreign.receipt.decision_code, "attention_target_not_allowed", "foreign Mind mention must block");

  const absent = await architect().route(request({
    container_id: channel.down,
    requested_thread_kind: "direct_exchange",
    reply_to_event_id: null,
  }));
  equal(absent.receipt.decision_code, "direct_lane_target_mismatch", "direct lane requires its exact Mind");
});

test("routing receipt is complete and carries no private context", async () => {
  const result = await architect().route(request());
  assert(result.status === "routed", "fixture must route");
  assert(result.receipt.receipt_id.startsWith("workspace_rcpt_"), "receipt must be deterministic");
  equal(result.receipt.requested_by_actor_id, "thomas-b5", "receipt must name requester");
  equal(result.receipt.container_kind, "governance", "receipt must name container type");
  equal(result.receipt.thread_root_event_id, roots.platformTension, "receipt must preserve root");
  equal(result.receipt.work_packet_ref, "tension:B5-PLATFORM", "receipt must name work object");
  equal(result.receipt.execution_posture, "not_executed", "routing must not execute");
  equal(result.receipt.private_context_refs.length, 0, "routing must copy no private context");
});

for (const entry of tests) {
  try {
    await entry.run();
    process.stdout.write(`ok - ${entry.name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${entry.name}\n${String(error)}\n`);
    process.exitCode = 1;
  }
}
process.stdout.write(`1..${tests.length}\n`);
if (!process.exitCode) process.stdout.write(`# ${tests.length} tests passed\n`);
