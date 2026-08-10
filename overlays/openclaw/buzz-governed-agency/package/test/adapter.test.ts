import {
  BuzzReadOnlyAdapter,
  InMemoryReplayStore,
  MemoryAdapterLogger,
  computeNostrEventId,
  verifySchnorrSignature,
  type ActorBinding,
  type IntakeResult,
} from "../src/index.js";
import {
  COMMUNITY_ID,
  OBSERVED_AT,
  RELAY,
  downBinding,
  downDemoEvent,
  envelope,
  thomasBinding,
  thomasSteeringEvent,
  workerBinding,
  workerDemoEvent,
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

function adapter(
  bindings: ActorBinding[] = [downBinding],
  overrides: {
    logger?: MemoryAdapterLogger;
    replayStore?: InMemoryReplayStore;
  } = {},
): BuzzReadOnlyAdapter {
  return new BuzzReadOnlyAdapter({
    allowed_relays: [RELAY],
    allowed_community_ids: [COMMUNITY_ID],
    allowed_authority_source_refs: ["synthetic-governance-snapshot-v1"],
    bindings,
    max_event_age_seconds: 3_600,
    ...(overrides.logger ? { logger: overrides.logger } : {}),
    ...(overrides.replayStore
      ? { replay_store: overrides.replayStore }
      : {}),
  });
}

function rejectionCode(result: IntakeResult): string {
  assert(result.status === "rejected", "expected a rejected intake");
  return result.rejection.code;
}

test("verifies the live synthetic Buzz fixtures", async () => {
  equal(
    await computeNostrEventId(downDemoEvent),
    downDemoEvent.id,
    "Mind-A-Demo event ID must match",
  );
  assert(
    await verifySchnorrSignature(downDemoEvent),
    "Mind-A-Demo signature must verify",
  );
  assert(
    await verifySchnorrSignature(workerDemoEvent),
    "Worker-Demo signature must verify",
  );
  assert(
    await verifySchnorrSignature(thomasSteeringEvent),
    "Human-Demo signature must verify",
  );
});

test("accepts a verified event and emits a deterministic dual-grain receipt", async () => {
  const logger = new MemoryAdapterLogger();
  const first = await adapter([downBinding], { logger }).ingest(
    envelope(downDemoEvent),
  );
  const second = await adapter([downBinding]).ingest(envelope(downDemoEvent));
  assert(first.status === "accepted", "first intake must be accepted");
  assert(second.status === "accepted", "clean adapter intake must be accepted");
  equal(
    first.packet.packet_id,
    second.packet.packet_id,
    "packet ID must be deterministic",
  );
  equal(
    first.receipt.machine.receipt_id,
    second.receipt.machine.receipt_id,
    "receipt ID must be deterministic",
  );
  equal(
    first.packet.canonical_actor_id,
    "down-demo",
    "binding must resolve canonical actor",
  );
  equal(
    first.packet.summary.includes(downDemoEvent.content),
    false,
    "packet summary must not copy raw content",
  );
  equal(
    first.receipt.human.consequence,
    "A read-only Tension Packet was created; no action was executed.",
    "human receipt must state non-execution",
  );
  equal(
    first.receipt.machine.signature_verified,
    true,
    "machine receipt must expose signature verification",
  );
  equal(
    first.receipt.machine.source_signature,
    downDemoEvent.sig,
    "machine receipt must expose the verified signature for inspection",
  );
  equal(
    first.receipt.machine.source_tags.length,
    downDemoEvent.tags.length,
    "machine receipt must preserve source tags for inspection",
  );
  equal(
    first.receipt.machine.packet_fields.packet_id,
    first.packet.packet_id,
    "machine receipt must expose the packet fields",
  );
  equal(logger.entries.length, 1, "one bounded log entry is expected");
  equal(
    JSON.stringify(logger.entries).includes(downDemoEvent.content),
    false,
    "logs must not contain raw content",
  );
});

test("rejects a tampered payload before binding", async () => {
  const input = envelope(downDemoEvent);
  input.event.content = `${input.event.content} tampered`;
  equal(
    rejectionCode(await adapter().ingest(input)),
    "invalid_event_id",
    "tampering must invalidate the event ID",
  );
});

test("rejects an invalid Schnorr signature", async () => {
  const input = envelope(downDemoEvent);
  input.event.sig = `${input.event.sig.slice(0, -2)}00`;
  equal(
    rejectionCode(await adapter().ingest(input)),
    "invalid_signature",
    "invalid signature must fail closed",
  );
});

test("requires exact relay and community allowlists", async () => {
  const relayInput = envelope(downDemoEvent);
  relayInput.relay = "ws://localhost:3000";
  equal(
    rejectionCode(await adapter().ingest(relayInput)),
    "relay_not_allowed",
    "relay aliases must not bypass exact allowlisting",
  );
  const communityInput = envelope(downDemoEvent);
  communityInput.community_id = "00000000-0000-0000-0000-000000000000";
  equal(
    rejectionCode(await adapter().ingest(communityInput)),
    "community_not_allowed",
    "unknown communities must fail closed",
  );
});

test("fails closed for malformed and oversized event input", async () => {
  equal(
    rejectionCode(await adapter().ingest(null)),
    "invalid_event_shape",
    "a malformed envelope must reject instead of throwing",
  );

  const malformed = envelope(downDemoEvent);
  malformed.event = null as unknown as typeof malformed.event;
  equal(
    rejectionCode(await adapter().ingest(malformed)),
    "invalid_event_shape",
    "malformed input must reject instead of throwing",
  );

  const oversized = envelope(downDemoEvent);
  oversized.event.tags.push(["x", "x".repeat(70_000)]);
  equal(
    rejectionCode(await adapter().ingest(oversized)),
    "event_too_large",
    "oversized tag material must reject before cryptographic verification",
  );
});

test("rejects a valid signed event from an unbound identity", async () => {
  equal(
    rejectionCode(await adapter([downBinding]).ingest(envelope(workerDemoEvent))),
    "unknown_binding",
    "valid transport identity must not imply organizational authority",
  );
});

test("rejects stale and future-dated signed events", async () => {
  const stale = envelope(downDemoEvent);
  stale.observed_at = "2026-07-29T18:00:00.000Z";
  equal(
    rejectionCode(await adapter().ingest(stale)),
    "event_too_old",
    "stale signed events must fail closed",
  );

  const future = envelope(downDemoEvent);
  future.observed_at = "2026-07-29T16:00:00.000Z";
  equal(
    rejectionCode(await adapter().ingest(future)),
    "event_from_future",
    "events beyond allowed future skew must fail closed",
  );
});

test("rejects ambiguous, inactive, future, and expired actor bindings", async () => {
  const duplicate: ActorBinding = {
    ...structuredClone(downBinding),
    binding_id: "binding-down-demo-conflict",
  };
  equal(
    rejectionCode(
      await adapter([downBinding, duplicate]).ingest(envelope(downDemoEvent)),
    ),
    "ambiguous_binding",
    "multiple exact bindings must fail closed",
  );
  const inactive: ActorBinding = {
    ...structuredClone(downBinding),
    status: "inactive",
  };
  equal(
    rejectionCode(await adapter([inactive]).ingest(envelope(downDemoEvent))),
    "binding_inactive",
    "inactive binding must fail closed",
  );
  const future: ActorBinding = {
    ...structuredClone(downBinding),
    valid_from: "2026-07-29T17:00:00.000Z",
  };
  equal(
    rejectionCode(await adapter([future]).ingest(envelope(downDemoEvent))),
    "binding_not_yet_valid",
    "future binding must fail closed",
  );
  const expired: ActorBinding = {
    ...structuredClone(downBinding),
    valid_until: "2026-07-29T16:00:00.000Z",
  };
  equal(
    rejectionCode(await adapter([expired]).ingest(envelope(downDemoEvent))),
    "binding_expired",
    "expired binding must fail closed",
  );
});

test("requires an approved synthetic authority source", async () => {
  const unknownSource: ActorBinding = {
    ...structuredClone(downBinding),
    authority_source_ref: "missing-governance-snapshot",
  };
  equal(
    rejectionCode(
      await adapter([unknownSource]).ingest(envelope(downDemoEvent)),
    ),
    "unknown_authority_source",
    "a binding cannot bootstrap its own authority source",
  );
});

test("returns the original packet and receipt for a replay", async () => {
  const replayStore = new InMemoryReplayStore();
  const instance = adapter([downBinding], { replayStore });
  const first = await instance.ingest(envelope(downDemoEvent));
  const replay = await instance.ingest(envelope(downDemoEvent));
  assert(first.status === "accepted", "first intake must be accepted");
  assert(replay.status === "replay", "second intake must be marked replay");
  equal(replayStore.size, 1, "replay must not create a second stored packet");
  equal(
    replay.packet.packet_id,
    first.packet.packet_id,
    "replay must return original packet",
  );
  equal(
    replay.receipt.machine.receipt_id,
    first.receipt.machine.receipt_id,
    "replay must return original receipt",
  );
});

test("treats the human steering event as root-only reply semantics", async () => {
  const result = await adapter([thomasBinding]).ingest(
    envelope(thomasSteeringEvent),
  );
  assert(result.status === "accepted", "steering event must be accepted");
  equal(
    result.packet.thread_context.reply_semantics,
    "root_only",
    "single root reply tag must not imply a nested direct reply",
  );
  equal(
    result.packet.thread_context.root_event_id,
    "3c452716f50de799403d39bd0a536bdce44aab0e274ea061d6f759c003fc05ca",
    "root event must be preserved",
  );
  equal(
    result.packet.thread_context.direct_reply_event_id,
    null,
    "direct reply target must remain unknown",
  );
});

test("accepts the separately bound Worker-Demo identity", async () => {
  const result = await adapter([workerBinding]).ingest(envelope(workerDemoEvent));
  assert(result.status === "accepted", "Worker-Demo event must be accepted");
  equal(
    result.packet.canonical_actor_id,
    "worker-demo",
    "Worker-Demo binding must resolve",
  );
});

test("keeps the reference logger bounded and redacted", async () => {
  const logger = new MemoryAdapterLogger(2);
  const instance = adapter([downBinding], { logger });
  await instance.ingest(envelope(downDemoEvent));
  await instance.ingest(envelope(downDemoEvent));
  await instance.ingest(envelope(downDemoEvent));
  equal(logger.entries.length, 2, "logger must retain only its configured bound");
  equal(
    JSON.stringify(logger.entries).includes(downDemoEvent.content),
    false,
    "bounded logs must remain content-redacted",
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
