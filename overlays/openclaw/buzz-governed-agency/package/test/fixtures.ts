import type { ActorBinding, BuzzEvent, IntakeEnvelope } from "../src/index.js";

export const RELAY = "ws://127.0.0.1:3000";
export const COMMUNITY_ID = "bfc1bc13-3c3a-44dd-aabb-6417cebcf7ca";
export const OBSERVED_AT = "2026-07-29T16:30:00.000Z";

export const downDemoEvent: BuzzEvent = {
  id: "3c452716f50de799403d39bd0a536bdce44aab0e274ea061d6f759c003fc05ca",
  pubkey: "8fc4b21e4fd2cefb3f17fc586b9116f66c8be700c42ca050380a83974d3df5a0",
  created_at: 1785341769,
  kind: 9,
  tags: [
    ["h", "7fdd5a94-7523-5b86-b574-9124de6cdc0d"],
    ["p", "ad2dcb0334dd04dfe9881926f05f05851493a47cb44d680f0dab381ed56277e6"],
    ["p", "71ec1d652cbe98cc2432cde0b7f4e9192679f3c919ec103d1402a72c386d2923"],
  ],
  content:
    "@Thomas-Demo — Multi-actor test 1: delegation plus steering. @Worker-Demo has one allowlisted capability: read the fixed synthetic fixture ALPHA. No shell, ACP, model provider, or external access is attached. Reply in this thread with: @Worker-Demo inspect fixture ALPHA and report the passed-test count.",
  sig: "c0428d29a3310b68a9ebec1effc93e7b139c4bc12937531f4d57608f9656b49f32cefc48db122fa674d0fadf65261b29dc52b48c6f0c5fc414003ddf1be7b8ed",
};

export const workerDemoEvent: BuzzEvent = {
  id: "5c8669b1fa58b217eea99253fab3ce10bf68f134c88042d2e5644630fcd4bbed",
  pubkey: "71ec1d652cbe98cc2432cde0b7f4e9192679f3c919ec103d1402a72c386d2923",
  created_at: 1785341769,
  kind: 9,
  tags: [
    ["h", "7fdd5a94-7523-5b86-b574-9124de6cdc0d"],
    [
      "e",
      "3c452716f50de799403d39bd0a536bdce44aab0e274ea061d6f759c003fc05ca",
      "",
      "reply",
    ],
    ["p", "ad2dcb0334dd04dfe9881926f05f05851493a47cb44d680f0dab381ed56277e6"],
  ],
  content:
    "@Thomas-Demo — Worker-Demo present. Capability envelope: synthetic fixture ALPHA lookup only. State: waiting. No execution runtime is attached.",
  sig: "f647b6ce71e4d1c9f44c145b30486772caf3d0e4cb46dbe1b40abbe36d090fb6bebd8ad45deb2d930538d75be9ce4d4f3517d13ba063290f7b111896fc101b5a",
};

export const thomasSteeringEvent: BuzzEvent = {
  id: "9b9997c26b128bd8abfc8ddd3c2bce1dab41b933c4a0697afd7734d6d1cbc122",
  pubkey: "ad2dcb0334dd04dfe9881926f05f05851493a47cb44d680f0dab381ed56277e6",
  created_at: 1785342434,
  kind: 9,
  tags: [
    ["h", "7fdd5a94-7523-5b86-b574-9124de6cdc0d"],
    [
      "e",
      "3c452716f50de799403d39bd0a536bdce44aab0e274ea061d6f759c003fc05ca",
      "",
      "reply",
    ],
    ["p", "71ec1d652cbe98cc2432cde0b7f4e9192679f3c919ec103d1402a72c386d2923"],
  ],
  content: "@Worker-Demo add the ignored-test count before completing.",
  sig: "29474e99cd578754b09f04d64cb82b11e6ceffa06d1031109259a8ded374b81f1cd01791fe0f79e2201668930e922508b2f0658198debfbb47e21a784813b324",
};

export const downBinding: ActorBinding = {
  binding_id: "binding-down-demo-v1",
  relay: RELAY,
  community_id: COMMUNITY_ID,
  buzz_pubkey: downDemoEvent.pubkey,
  powershift_actor_id: "down-demo",
  role_context: ["platform-circle-lead-demo"],
  authority_source_ref: "synthetic-governance-snapshot-v1",
  valid_from: "2026-07-29T00:00:00.000Z",
  valid_until: "2026-07-30T00:00:00.000Z",
  status: "active",
};

export const workerBinding: ActorBinding = {
  binding_id: "binding-worker-demo-v1",
  relay: RELAY,
  community_id: COMMUNITY_ID,
  buzz_pubkey: workerDemoEvent.pubkey,
  powershift_actor_id: "worker-demo",
  role_context: ["delegated-worker-demo"],
  authority_source_ref: "synthetic-governance-snapshot-v1",
  valid_from: "2026-07-29T00:00:00.000Z",
  valid_until: "2026-07-30T00:00:00.000Z",
  status: "active",
};

export const thomasBinding: ActorBinding = {
  binding_id: "binding-thomas-demo-v1",
  relay: RELAY,
  community_id: COMMUNITY_ID,
  buzz_pubkey: thomasSteeringEvent.pubkey,
  powershift_actor_id: "thomas-demo",
  role_context: ["synthetic-ratifier"],
  authority_source_ref: "synthetic-governance-snapshot-v1",
  valid_from: "2026-07-29T00:00:00.000Z",
  valid_until: "2026-07-30T00:00:00.000Z",
  status: "active",
};

export function envelope(event: BuzzEvent = downDemoEvent): IntakeEnvelope {
  return {
    relay: RELAY,
    community_id: COMMUNITY_ID,
    observed_at: OBSERVED_AT,
    event: structuredClone(event),
  };
}
