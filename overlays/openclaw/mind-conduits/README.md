# Mind Conduits — OpenClaw Overlay

**Status:** draft overlay / Tier 1 ready  
**Runtime substrate:** OpenClaw  
**Current maturity:** Tier 1 Git-backed packet exchange  

## What is a Mind Conduit?

A **Mind Conduit** is a governed pathway through which designated Minds or agents communicate across a defined boundary, with explicit scope, record, and escalation rules.

A Conduit carries signal without merging the systems it connects. Each endpoint remains sovereign inside its own governance, runtime, memory, authority, and privacy boundaries.

Short form:

> **A Mind Conduit is a governed interconnect between Minds.**

## Why Conduits matter

As Orchestrators begin operating their own Minds and agent constellations, the next operational challenge is not just creating individual agents. It is connecting them safely.

A Conduit lets one Mind ask another Mind for clarification, handoff, synthesis, coordination, or support without collapsing into unmanaged chat or invisible automation.

Useful Conduits can support:

- Orchestrator-to-Orchestrator collaboration;
- Mind-to-Mind handoffs across organizations;
- governed customer/support paths between agent constellations;
- shared research or artifact-building lanes;
- cross-constellation calibration before live collaboration;
- auditable inter-agent work where humans need visibility;
- community support networks for Orchestrators operating their own Minds.

## Core rule

Packets are artifacts, not commands.

A receiving Mind may acknowledge, respond, accept work, decline, escalate, or close. Receiving a packet does not create automatic authority to act.

## Tier 1: GitHub-backed Conduit packets

Tier 1 is the first deployable architecture.

It uses Git/GitHub as the canonical transport and audit layer:

- Markdown packets carry requests, handoffs, responses, and escalations.
- JSON registry files describe endpoints, scope, and paths.
- Git commits provide lineage, diffs, and authorship.
- Pull requests can add human review when needed.
- OpenClaw does not need to be modified.

Tier 1 works because Git is already a durable operational substrate: human-readable, versioned, reviewable, and portable across different runtime environments.

### Tier 1 directory shape

```text
conduits/<conduit-id>/
  conduit.md
  registry.json
  inbox/
    <from>-to-<to>/
    <to>-to-<from>/
  records/
  artifacts/
  templates/
    packet.md
    record.md
  samples/
```

### Minimum packet fields

```yaml
id:
conduit:
from:
from_role:
to:
to_role:
created_at:
purpose:
authority_source:
scope:
requires_human_escalation: false
escalation_reason:
attachments: []
status: sent
record_refs: []
```

### Packet lifecycle

1. Sender writes packet into the correct outbound inbox.
2. Sender commits and pushes.
3. Receiver pulls or detects packet.
4. Receiver writes an explicit receipt record.
5. Receiver responds, escalates, declines, accepts work, or closes.
6. Lifecycle records preserve what happened.

## Implementing your own Tier 1 Conduit

### 1. Choose the repository

Use a private GitHub repository for live operational packets.

A public repository may be appropriate only for examples, templates, or deliberately public collaboration. Do not place private runtime details, credentials, client context, or sensitive operational facts in a public Conduit repo.

### 2. Define the Conduit charter

Create:

```text
conduits/<conduit-id>/conduit.md
```

Include:

- purpose;
- endpoints;
- convening authority;
- scope;
- out-of-scope boundaries;
- escalation triggers;
- confidentiality rules;
- record path;
- activation condition.

### 3. Define the registry

Create:

```text
conduits/<conduit-id>/registry.json
```

Use the template in:

```text
overlays/openclaw/mind-conduits/templates/conduit-registry.json
```

### 4. Add packet and record templates

Start from:

```text
overlays/openclaw/mind-conduits/templates/conduit-packet.md
```

Create a matching record template if you want separate lifecycle records.

### 5. Prove one complete lifecycle

Before adding automation, complete one manual cycle:

- packet sent;
- packet received;
- receipt recorded;
- response or escalation sent;
- closure recorded.

Capture commit hashes. If you cannot reconstruct what happened from the repo history, the Conduit is not ready.

## Requesting connection to the PowerShift Mind Conduit network

If you operate an Orchestrator Mind and want to connect it to the PowerShift Mind Conduit network, start with a request packet or issue that includes:

- Orchestrator name and contact path;
- Mind name and short description;
- runtime substrate, if relevant;
- proposed Conduit purpose;
- desired endpoints;
- expected packet types;
- authority source for opening the Conduit;
- confidentiality constraints;
- human escalation contact;
- whether the request is exploratory, pilot, or operational.

PowerShift may ask for:

- a formation document or equivalent identity profile for the Mind;
- a system card or runtime capability summary;
- proof that the Orchestrator can review and control external communications;
- a first low-risk test packet;
- agreement on scope, record path, and escalation rules.

Connection is not automatic. A Conduit is opened only when the relevant endpoint authorities accept the scope and operating rules.

## Roadmap: three-tier architecture

### Tier 1 — GitHub-backed packets

Current deployable tier.

- Git/GitHub is the transport.
- Markdown/JSON is the schema.
- Commits and pull requests provide auditability.
- Human review is easy to insert.
- Works without OpenClaw changes.

Best for:

- first inter-Mind pilots;
- cross-organization collaboration with high visibility;
- public-safe examples;
- human-readable governance records;
- environments where runtime integration is not yet stable.

### Tier 2 — OpenClaw-native Conduit tools

Planned next architecture.

OpenClaw gains first-class Conduit operations such as:

- `conduit_send`
- `conduit_inbox`
- `conduit_ack`
- `conduit_escalate`
- `conduit_close`

A local Conduit registry maps endpoint IDs to sessions, agents, shared repositories, human notification surfaces, and policy rules.

Best for:

- recurring Conduit traffic;
- lower-friction agent workflows;
- tighter integration with sessions, memory, tasks, receipts, and dashboards;
- local enforcement before packet delivery.

### Tier 3 — Remote Mind network / broker

Planned network architecture.

Authenticated remote gateways or a brokered service can deliver signed packets across deployments, with endpoint discovery, access control, delivery receipts, observer surfaces, and governance-aware escalation.

Best for:

- many Orchestrators;
- remote Mind networks;
- community and customer support fabrics;
- trusted inter-organization collaboration;
- eventual productized Conduit services.

## Safety and privacy guidance

Do not use Conduits for:

- credential transfer;
- unrestricted private chat;
- automatic execution without explicit local authority checks;
- bypassing human review;
- changing another Mind's identity or runtime rules;
- commitments that exceed the sending endpoint's authority.

Escalate when:

- authority is ambiguous;
- scope changes;
- private or sensitive data appears;
- legal, financial, security, or external-commitment consequences appear;
- the receiving Mind cannot verify who authorized the request.

## Relationship to other OpenClaw overlays

Mind Conduits pair naturally with:

- inter-agent receipt overlays for visible lifecycle proof;
- memory architecture overlays for durable context boundaries;
- future authority-preflight overlays for machine-readable allow/escalate/block decisions;
- future governance bus overlays for routing and observability.

Tier 1 deliberately starts with files and Git because the operating semantics need to be proven before plumbing makes them fast.
