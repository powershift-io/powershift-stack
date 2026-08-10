import { createHash } from "node:crypto";
import type { RootDispatchBinding, RootDispatchEnvelope } from "./root-dispatch-types.js";
import type { Hex } from "./types.js";

export interface RelayRootEvent { id: Hex; pubkey: Hex; kind: number; channel_id: string; content: string; tags: string[][]; received_at: string; }
export interface RelayRootQuery { roots(after?: string): Promise<RelayRootEvent[]> }
export interface RelayEventVerifier { verify(event: RelayRootEvent): Promise<boolean> }

export class RelayRootIntakeAdapter {
  readonly #query: RelayRootQuery; readonly #verifier: RelayEventVerifier; readonly #bindings: RootDispatchBinding[];
  constructor(input: { query: RelayRootQuery; verifier: RelayEventVerifier; bindings: RootDispatchBinding[] }) { this.#query = input.query; this.#verifier = input.verifier; this.#bindings = structuredClone(input.bindings); }
  async poll(at: string, after?: string): Promise<{ accepted: RootDispatchEnvelope[]; rejected: { event_id: Hex; code: string }[] }> {
    const accepted: RootDispatchEnvelope[] = []; const rejected: { event_id: Hex; code: string }[] = [];
    for (const event of await this.#query.roots(after)) {
      if (event.kind !== 45001 || !await this.#verifier.verify(event)) { rejected.push({ event_id: event.id, code: "invalid_event" }); continue; }
      const mentions = event.tags.filter((tag) => tag[0] === "p" && tag[1]).map((tag) => tag[1]);
      const matches = this.#bindings.filter((binding) => binding.status === "active" && binding.allowed_channel_ids.includes(event.channel_id) && binding.allowed_source_pubkeys.includes(event.pubkey));
      if (matches.length !== 1 || mentions.length !== 1) { rejected.push({ event_id: event.id, code: "ambiguous_routing" }); continue; }
      const binding = matches[0]!;
      const mention = event.tags.find((tag) => tag[0] === "p")?.[1];
      if (mention !== binding.openclaw_agent_id && mention !== binding.binding_id) { rejected.push({ event_id: event.id, code: "wrong_recipient" }); continue; }
      accepted.push({ protocol_version: binding.protocol_version, source_event_id: event.id, thread_root_event_id: event.id, source_pubkey: event.pubkey, channel_id: event.channel_id, binding_id: binding.binding_id, openclaw_agent_id: binding.openclaw_agent_id, openclaw_session_key_sha256: binding.openclaw_session_key_sha256, openclaw_session_id: binding.openclaw_session_id, payload_digest: createHash("sha256").update(event.content).digest("hex"), role_request_id: null, received_at: event.received_at, not_before: event.received_at, expires_at: new Date(Date.parse(at) + 15 * 60_000).toISOString(), execution_posture: "not_executed", authority_transfer: "none" });
    }
    return { accepted, rejected };
  }
}
