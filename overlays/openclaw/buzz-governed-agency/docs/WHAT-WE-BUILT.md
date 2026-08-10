# Governed Minds Across Collaboration Surfaces

## A field note for the communities this work may serve

PowerShift® Intelligence has completed a distinctive integration experiment: governed intelligent agents—Minds—can participate through Buzz while retaining their existing identity, memory, session continuity, organizational roles, and authority boundaries in OpenClaw and PowerShift® Intelligence.

The precise claim matters. Buzz has not become a Mind registry, memory system, or governance engine. OpenClaw has not become the source of organizational authority. We built a governance membrane between them: the PowerShift® Governed Collaboration Adapter.

The adapter makes an external signed interaction legible to a sovereign Mind. It binds the transport identity to a canonical organizational actor, projects an explicit request-scoped role, releases only authorized context, evaluates authority, dispatches to an exact existing OpenClaw session, prevents replay, and returns a verifiable receipt. Each system remains responsible for what it does best:

- **Buzz** provides signed interaction, channels, threading, membership, and evidence transport.
- **OpenClaw** preserves Mind identity, memory, tools, and exact session continuity.
- **PowerShift® Intelligence** supplies organizational actor binding, roles, context governance, authority evaluation, and operational lineage.
- **The Adapter** enforces the contract between those planes.
- **The Orchestrator Hub** makes the resulting chain visible and usable: tension → actor → Mind → role → authorized context → authority decision → consequence.

This architecture lets a Mind participate in multiple organizational contexts without collapsing identity into role, role into channel membership, or communication into authority.

## What has been demonstrated

The reference integration demonstrated that:

- existing Minds can be reached through Buzz without creating replacement Minds or resetting their OpenClaw sessions;
- a single Mind can fill different roles while preserving one continuous identity;
- signed transport identities can be resolved to canonical organizational actors;
- role requests can be allowed, proposed, escalated, blocked, or routed for ratification;
- channel labels, mentions, and membership do not silently grant authority;
- private context can be released selectively, with version and digest binding;
- each accepted source root produces at most one Mind turn;
- replay cannot produce another turn, signing lease, or publication;
- dispatch, authority, execution posture, publication, and closure remain independently inspectable;
- operator controls can pause, resume, cancel, retry, quarantine, dead-letter, and reconcile work with revision checking;
- durable state can survive restart and can be exported and restored transactionally.

The extracted Stack package passed 106 conformance and negative-boundary checks, Node 22 typechecking, a frozen clean-room installation, runtime creation and removal, and public-safety portability scans.

## For PowerShift® Intelligence stakeholders

This work extends PowerShift® Intelligence beyond a web application or governance visualization layer. It demonstrates an operational control plane through which governed intelligence can participate across third-party collaboration surfaces while organizational identity and authority remain coherent.

That creates a reusable foundation for the Orchestrator Hub. Ask the Holarchy and future Hub surfaces can show not merely that an agent answered, but which canonical actor initiated the tension, which Mind responded, which role was active, what context was authorized, what authority decision applied, and what consequence followed.

The practical value is lineage. Intelligence becomes operationally usable without becoming organizationally opaque.

## For Orchestrators

The adapter offers a way to coordinate with multiple Minds from a collaboration surface without treating every message as an unconstrained prompt. It preserves the distinctions an Orchestrator needs:

- attention is not authority;
- membership is not role assignment;
- a Mind is not the role it currently fills;
- an answer is not an authorization to execute;
- delivery is not closure;
- model output is not organizational evidence until the relevant lineage is recorded.

The current release candidate supports supervised operation: one dispatcher, exact existing sessions, durable local state, explicit operator controls, and consequential execution disabled by default.

## For the OpenClaw community

OpenClaw already provides the durable runtime qualities this experiment needed: persistent named agents, memory, session continuity, tools, and communication surfaces. The adapter adds a layer that OpenClaw should not have to own universally—organization-specific identity binding and authority translation.

From an OpenClaw perspective, this is a reference pattern for connecting a persistent agent to an external signed transport without letting that transport redefine the agent or bypass its governance context. The integration uses injected ports rather than hard-coding a deployment, allowing different session transports, storage systems, context brokers, signers, and operator environments to implement the same contract.

This may be useful to plugin authors and runtime maintainers exploring governed ingress, exact-session routing, replay-safe dispatch, context release, or externally verifiable receipts.

## For the Buzz community

Buzz supplied valuable properties for the experiment: signed Nostr events, portable identity primitives, threads, channels, membership, and an inspectable event history. The work demonstrates how Buzz can become a collaboration surface for governed intelligent agents without needing to absorb their memories, roles, or organizational authority model.

This suggests a broader opportunity for Buzz: human and intelligent participants can share a signed social workspace while specialized governance layers interpret who may act, in what role, with what context, and under what constraints.

The present mobile limitations remain material. Native push enrollment and kind-30350 lease support are absent in the tested client line, so Buzz Mobile is currently a foreground collaboration surface. Telegram remains the attention, escalation, and recovery channel in the reference deployment. Inbox and unread state are advisory; canonical thread or Search readback is the delivery check.

## For people evaluating AI-agent frameworks and harnesses

This is a concrete experiment in separating an agent runtime from its organizational operating system.

Many frameworks answer: How does an agent receive a task, call tools, and return output? The adapter investigates a different set of questions:

- Who is the organizational actor behind the request?
- Which role is active for this interaction?
- What authority source governs the requested consequence?
- Which context may be released, and can its exact version be proven?
- Which persistent Mind and existing session may receive the work?
- How do retries, conflicts, restarts, and replay preserve one-root/one-turn semantics?
- What receipt lets another party verify what actually happened?

The package can serve as a conformance target, threat-model example, or starting point for adapting another signed transport or agent runtime. The interesting experiment is not whether an LLM can answer a message. It is whether an intelligent participant can remain governable across boundaries without losing identity or accumulating ambient authority.

## For governance designers and organizational architects

The integration makes several PowerShift® distinctions machine-operational:

- actor identity and role are separate;
- authority is contextual and explicit;
- delegation does not erase the delegating source;
- communication topology does not determine governance topology;
- consequences require more evidence than conversational fluency;
- governance can be enforced at the boundary between systems.

This provides an implementation surface for testing constitutional rules against real event flows. Governance can be evaluated through receipts and negative-boundary tests, not only described in policy documents.

## For security, reliability, and protocol practitioners

The package is also an experiment in bounded trust. Its reference core verifies event identifiers and signatures, constrains signers and communities, validates reply lineage, pins action and context digests, rejects ambiguous bindings, and separates dispatch from publication custody. Durable stores use atomic local writes, restrictive filesystem modes, revision control, and an exclusive supervisor lease.

The public release candidate intentionally narrows its production claim to one supervised local sidecar. Network filesystems, multiple supervisors, horizontal scaling, unattended reliability, and consequential execution require further work. Those boundaries are part of the design, not footnotes to it.

## For researchers and open-source experimenters

The Stack artifact publishes a reusable pattern while protecting the reference deployment. It includes typed protocol contracts, a dependency-free core, injected ports, synthetic fixtures, conformance tests, lifecycle controls, and installation and rollback guidance. It excludes real identities, session identifiers, endpoints, credentials, tenant policy, production state, private topology, and PSI-specific proof harnesses.

Useful next experiments include:

- implementing a second signed collaboration transport against the same ports;
- implementing a second agent runtime while preserving exact persistent identity;
- testing the protocol with multi-organization actor registries;
- replacing local JSON state with a transactional shared store while retaining conformance;
- formalizing protocol schemas for independent implementations;
- measuring unattended reliability and operator intervention rates;
- exploring accessible, voice, and low-attention interaction surfaces;
- testing governance decisions under concurrent membership and role changes.

## Current operating envelope

The result is proven for supervised foreground operational use. It is not yet a Telegram replacement or an unattended production service.

The reference deployment currently requires:

- Telegram for attention, escalation, and recovery;
- Buzz Mobile in the foreground;
- one supervised dispatcher;
- exact pre-existing Mind sessions;
- serialized and reconciled membership changes;
- canonical thread or Search readback for delivery verification;
- consequential execution disabled;
- production relay continuity on the already-proven version and truthful capability advertisement.

Broader expansion remains gated by unattended reliability evidence, horizontally scalable queue/storage, complete cost instrumentation, mobile push custody, concurrent-membership closure, and accessibility and voice evidence.

## Where the work lives

The reusable architecture now lives in `powershift-stack` as the Governed Collaboration Adapter overlay. PowerShift® Intelligence retains the organization-specific deployment: real actor and role bindings, Mind sessions, relay and channel identifiers, credentials, policies, operations, and evidence.

This separation gives the work a stable home and suggests two distinct accountabilities inside a future Platform Circle:

- **Orchestrator Hub Steward** — governed human/Mind collaboration surfaces, lineage visibility, Ask the Holarchy, and operator experience.
- **Governed Adapter Steward** — identity binding, authority translation, context release, dispatch integrity, receipts, protocol evolution, and conformance.

The pattern is concise:

> Bind an external signed interaction to a sovereign Mind, an explicit organizational role, authorized context, a deterministic authority decision, and a verifiable receipt—without granting the transport or runtime authority they do not hold.

That is what we built. The next phase is to let other communities test whether the pattern survives contact with their transports, runtimes, organizations, and constraints.
