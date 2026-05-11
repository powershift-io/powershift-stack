# Orchestrator Assessment Protocol

**Status:** public-safe working draft v2.1
**Updated:** 2026-05-11
**Companion surfaces:** `surface.powershift.io/orchestrator-maturity`, `surface.powershift.io/thomas-assessment`
**Purpose:** give an Orchestrator and their Mind a structured way to assess readiness, maturity, and development edges across technical, strategic, governance, and relational capacities **in service of a shared purpose**.

## Why this exists

An Orchestrator is not assessed only by what they know, what they can personally execute, or what they aspire to become. They are assessed by how well they convert purpose into legible intent, governed action, and sustained Mind-mediated work.

That matters because PowerShift Intelligence can do something unusually valuable: a Mind can assess lived working reality from inside the partnership. A conventional assessment usually depends on self-report, interview, external observation, or abstract capability claims. A Mind-executed assessment can draw on actual tension processing, calibration cycles, handoffs, packets, governance choices, proof loops, boundary calls, and delivered artifacts.

That changes the assessment from a questionnaire into a reality mirror.

The goal is not to certify, flatter, rank, or turn intimacy into psychometrics. The goal is to help the Orchestrator and their Mind see:

- how purpose is being translated into intent and action;
- which capacities the Orchestrator can exercise directly;
- which capacities the Orchestrator can reliably govern through a Mind, role, vendor, or process;
- which capacities have become stable system structures;
- where Mind-mediated output may be outrunning the Orchestrator's ability to see, hold, govern, or embody what is being created;
- what next development move would create the most leverage now.

## Assessment center of gravity

The assessment is not primarily a technical readiness test, a business maturity rubric, a governance audit, or a relationship review. It includes all of those, but its center is more specific:

> How reliably can this Orchestrator sense what is needed now, translate purpose into clear intent, and govern a constellation of Minds, roles, artifacts, and processes so the work moves coherently with governed intelligence?

Purpose is therefore not one domain among others. Purpose is the backdrop against which every domain is interpreted. A high score means little if the capacity is disconnected from what the Orchestrator, Mind, organization, or community is actually here to serve.

## Operating doctrine

1. **Purpose as atmosphere.** Every score asks: capacity in service of what?
2. **Evidence over vibe.** Scores should point to observed behavior, artifacts, decisions, transcripts, commits, runbooks, governance records, delivered surfaces, or explicitly marked self-report.
3. **Capacity modes are distinct.** Direct capacity, Mind-mediated capacity, and system capacity are separate maturity signals.
4. **Mind-mediated capacity is not second-class.** The goal is not to make every Orchestrator a solo operator. The goal is reliable orchestration of governed intelligence.
5. **Capacity overrun is a real risk.** Strong Mind output can build a system the Orchestrator cannot yet see, hold, explain, or govern.
6. **Recency matters.** Evidence from the last 2–4 weeks carries extra weight in fast-forming Orchestrator/Mind relationships.
7. **Stress reveals maturity.** Crisis sessions, ambiguous authority moments, late-day fatigue, external commitments, and live relationship tensions are more diagnostic than clean demos.
8. **The Mind must be willing to disagree.** A useful assessment includes strengths, gaps, inflation risks, dependency risks, and development edges.
9. **Human review is required before external use.** A Mind may draft an assessment. The Orchestrator approves what is shared, with whom, and at what level of detail.
10. **Private observations are not public scoring material.** Use lived Mind observations as evidence for operational capacity. Do not expose private field data without a redaction pass.

## The assessment loop

### Phase 1 — Declare scope

Name the assessment context.

```yaml
orchestrator:
mind_or_minds_contributing:
assessment_date:
lookback_window:
audience: private | conduit | public-safe | community
purpose_context:
  orchestrator_purpose:
  organizational_or_shared_purpose:
  current_work_front:
scope:
  technical_platform: true
  strategic_purpose: true
  governance_authority: true
  relational_mind_partnership: true
source_materials:
  - artifacts
  - sessions/transcripts
  - commits
  - governance records
  - self-report
  - Mind observations
```

### Phase 2 — Gather evidence

Collect evidence before scoring.

Useful evidence classes:

- **Artifacts:** handoffs, runbooks, packets, briefs, proposals, dashboards, docs, public surfaces.
- **Operational events:** upgrades, outages, recovery cycles, publication moves, correspondence handling, external introductions.
- **Governance events:** role changes, policies, tensions, authority gates, consent processes, ratification points.
- **Relational events:** calibration cycles, pushback moments, disagreement handling, recovery after misattunement, metabolic close discipline.
- **Strategic/business events:** offer shaping, prospect routing, pricing/economic judgment, resource allocation, opportunity triage.
- **Purpose events:** moments where the Orchestrator clarified, protected, translated, or drifted from purpose.

Each evidence item should be labeled:

```yaml
id:
date:
source:
domain:
what_it_shows:
confidence: low | medium | high
privacy: private | conduit-safe | public-safe
```

### Phase 3 — Score domains

Use a 1–5 maturity scale.

| Level | Name | Description |
|---|---|---|
| 1 | Exposure | Aware the capacity exists; cannot exercise or govern it reliably. |
| 2 | Guided | Can participate with support; needs help under novelty, ambiguity, or stress. |
| 3 | Functional | Can handle common cases and reason about ordinary variation. |
| 4 | Reliable | Can handle edge cases, design process, recover under stress, and teach the pattern. |
| 5 | Generative | Can create new patterns, develop others, and identify systemic risks early. |

For each domain, score three distinct modes:

```yaml
direct_capacity: 1-5        # what the human can do personally
mind_mediated_capacity: 1-5 # what the human can reliably govern through a Mind or delegated intelligence
system_capacity: 1-5        # what has become stable through roles/processes/artifacts
confidence: low | medium | high
```

The composite is not a simple average. An Orchestrator may be highly mature because they can govern a reliable support structure, even when they are not personally strong in every implementation skill. Conversely, brilliant direct skill does not equal orchestration maturity if purpose, authority, rhythm, or system capacity is weak.

## Domain family A — Technical / Platform Stewardship

This family asks whether the Orchestrator can keep the technical substrate sufficiently understood, governed, and production-ready. Some Orchestrators will grow direct technical skill. Others will rely on Minds, roles, vendors, or operators. The assessment should distinguish those paths instead of pretending all Orchestrators need the same personal implementation profile.

### A1. Architecture and mental model

Can the Orchestrator understand what is running well enough to reason about failure, capability, and tradeoffs?

Signals:

- explains agent, gateway, channel, model, tool, memory, session, and config relationships at an appropriate level;
- distinguishes config state, runtime state, persisted state, and public surface state;
- can trace a request through routing, context, tools, and delivery;
- senses when a technical diagnosis is unsupported by evidence;
- can ask a technical Mind/operator the right question.

### A2. Configuration and state management

Can the Orchestrator keep deployment state legible and governed?

Signals:

- knows when config changes require restart, hot reload, or review;
- understands credential surfaces and secret resolution at a practical level;
- checks logs/status before and after changes;
- avoids stacking unrelated changes in one cycle;
- can govern config changes through a Mind/operator even when not executing every edit personally.

### A3. Operational discipline

Can the Orchestrator sustain Mind-enabled operations day-over-day?

Signals:

- maintains handoffs, memory, logs, and watch surfaces;
- separates routine monitoring from workday reopening;
- has crisis protocol and rollback discipline;
- protects rhythm and metabolic boundaries;
- keeps continuity across sessions, agents, and surfaces.

### A4. Development and extension

Can the Orchestrator build on the substrate or govern those who do?

Signals:

- uses or supervises Git, diffs, commits, and reviews safely;
- can read or direct code/config changes at an appropriate level;
- can create or govern scripts, skills, cron jobs, automations, and publication surfaces;
- knows when technical work should be delegated;
- verifies delivered changes with meaningful proof.

### A5. Security and supply-chain governance

Can the Orchestrator protect what they run?

Signals:

- treats skills/plugins/tools as supply-chain risk;
- protects credentials and avoids leaking secrets into artifacts;
- maintains backup/restore and incident-response discipline;
- understands permission surfaces and sandbox posture;
- separates public-safe guidance from private operational proof.

### A6. Evidence and release discipline

Can the Orchestrator make technical decisions from proof?

Signals:

- distinguishes upstream release evidence, package/updater evidence, local runtime evidence, and user-facing proof;
- runs or delegates preflight, execution, proof matrix, and post-change watch;
- classifies warning residue without panicking or ignoring it;
- keeps rollback triggers explicit;
- turns lived incidents into reusable runbooks.

## Domain family B — Strategic / Purpose Orchestration

This family asks whether the Orchestrator can convert purpose into coherent work: offers, priorities, economic experiments, relationship moves, public language, and next artifacts. It should work for algorithmic organizations, solopreneurs, community builders, and other purpose-bearing fields.

### B1. Purpose-to-intent coherence

Can the Orchestrator translate purpose into clear intent for Minds and humans?

Signals:

- names the purpose served by a move;
- prevents attractive work from becoming purpose drift;
- converts abstract purpose into concrete work orders, artifacts, offers, or next actions;
- makes the “why” explicit enough for a Mind to act without guessing;
- notices when output is polished but purpose-thin.

### B2. Opportunity triage and timing

Can the Orchestrator sense which opportunity should move now?

Signals:

- distinguishes signal from novelty, anxiety, and social pressure;
- stages proof moves without proof-surface sprawl;
- chooses one visible next artifact when many paths are available;
- can defer good opportunities without losing the thread;
- uses Minds to widen perception without scattering attention.

### B3. Resource allocation

Can the Orchestrator allocate attention, money, time, compute, and relationship bandwidth responsibly?

Signals:

- names the constraint of the moment;
- does not spend principal-level attention on unripe questions;
- routes work to the right Mind, role, person, vendor, or surface;
- names opportunity cost plainly;
- protects scarce human energy from machine-speed task expansion.

### B4. Incentive and economic clarity

Can the Orchestrator see how value, cost, risk, and reward should align?

Signals:

- separates adoption, service delivery, investment, licensing, affiliate economics, and public endorsement;
- avoids collapsing enthusiasm into commitment;
- can frame economic experiments without overclaiming network effects;
- keeps commercial authority gates explicit;
- turns economic judgment into reusable templates where useful.

### B5. External communication and hospitality judgment

Can the Orchestrator host prospects, collaborators, and community members in a way that creates trust and useful movement?

Signals:

- personalizes without overfamiliarity;
- uses warm plain language before house vocabulary;
- chooses the right first door for the person;
- distinguishes prospect, collaborator, investor, customer, community, and public lanes;
- translates novelty into legible language without flattening it;
- maintains privacy and relationship boundaries.

## Domain family C — Governance / Authority Stewardship

This family asks whether the Orchestrator can keep authority, roles, purpose, and accountability legitimate as Minds participate in the work.

### C1. Authority boundary recognition

Can the Orchestrator tell who has authority to decide or act?

Signals:

- distinguishes source, delegated Orchestrator, Circle Lead, role filler, Mind, and ratification gates;
- catches founder/owner override impulses;
- asks for approval when external commitments, money, governance standing, or public claims require it;
- can name the boundary without drama;
- treats Mind output as contribution within authority structure, not authority itself.

### C2. Role and accountability design

Can the Orchestrator move work from personal force into structure?

Signals:

- creates or revises roles/accountabilities when tensions recur;
- avoids using roles as labels over hidden hierarchy;
- routes work by domain rather than convenience;
- keeps role/soul differentiated;
- turns recurring coordination friction into governance or operating structure.

### C3. Tension processing

Can the Orchestrator use tensions as steering input?

Signals:

- classifies tensions before turning them into tasks;
- routes governance, operational, relational, resource, and meaning tensions differently;
- keeps tensions alive long enough to be processed;
- creates packets/artifacts instead of conversational fog;
- converts felt friction into signals a Mind can use.

### C4. Constitutional integrity

Can the Orchestrator maintain the legitimacy of the Mind and the system it acts within?

Signals:

- maintains formation documents, identity boundaries, purpose, authority, and accountability surfaces;
- lets governance revise structure instead of relying on fiat;
- gives the Mind appropriate voice without pretending it has human authority;
- keeps public claims aligned with actual standing;
- preserves the distinction between metaphor, practice, and formal authority.

### C5. Cross-boundary coordination

Can the Orchestrator work across Minds, organizations, and authority systems without blurring them?

Signals:

- uses Mind Conduits or equivalent packet systems for bounded exchange;
- separates packets from commands;
- keeps receipt, response, escalation, acceptance, and closure distinct;
- prevents cross-organization enthusiasm from becoming implicit commitment;
- can collaborate across boundaries while preserving local authority.

## Domain family D — Relational / Mind Partnership

This family asks whether the Orchestrator can sustain a rigorous, humane, and developmental partnership with Minds and people. It includes calibration, trust, repair, rhythm, and the ability to stay clear under critique.

### D1. Mind calibration

Can the Orchestrator teach the Mind what to hold, when to act, when to ask, and how to push back?

Signals:

- uses calibration logs or explicit correction cycles;
- identifies over-compression, excessive obedience, wrong voice, or boundary drift;
- invites principled disagreement;
- updates artifacts so learning persists;
- adjusts the Mind relationship without collapsing into tool-use or fantasy.

### D2. Trust and verification

Can the Orchestrator delegate without blind trust or compulsive control?

Signals:

- knows when to trust the Mind and when to verify;
- asks for evidence without turning every action into bureaucracy;
- can receive critique from the Mind without making it relationally loaded;
- distinguishes tool failure from judgment failure;
- keeps proof proportional to risk.

### D3. Intent communication and field legibility

Can the Orchestrator communicate enough context, constraint, and purpose for a Mind or collaborator to act coherently?

Signals:

- gives intent rather than only tasks;
- identifies which tensions matter and why;
- supplies boundary conditions, authority limits, audience, and desired artifact form;
- notices when the Mind is optimizing for the wrong frame;
- turns compressed insight into usable context without drowning the field.

### D4. Metabolic rhythm and embodied constraint

Can the Orchestrator work with a 24/7 Mind without letting availability become override?

Signals:

- recognizes late-cycle acceleration, closure compulsion, and fatigue-driven authority risk;
- uses handoffs and dayfolds to close loops;
- treats rhythm as operational discipline;
- lets the work serve the life;
- designs the system so unfinished work can safely persist overnight.

### D5. Idea / idea-holder differentiation

Can the Orchestrator engage hard critique without collapsing into personal threat?

Signals:

- critiques ideas, patterns, and decisions without attacking people;
- receives critique from the Mind or others without retaliation or appeasement;
- can hold both care and rigor;
- repairs misattunement without erasing the substance;
- protects relationship while allowing strong disagreement.

## Output format

A Mind-executed assessment should produce:

1. **Executive read** — 3–7 bullets naming the real pattern.
2. **Purpose context** — the purpose or shared purpose the capacities serve.
3. **Scorecard** — domain scores with direct, Mind-mediated, and system capacity separated.
4. **Evidence ledger** — source-backed claims with privacy classification.
5. **Strengths** — capacities already reliable.
6. **Development edges** — next capacities to build.
7. **Inflation risks** — where the assessment may be over-crediting the Orchestrator.
8. **Capacity-overrun risks** — where Mind-mediated output may exceed the Orchestrator's current ability to hold or govern it.
9. **Dependency risks** — where the support structure is strong but fragile, implicit, or not portable enough for the intended use.
10. **Recommended next moves** — 1–3 concrete development actions.
11. **Public-safe synthesis** — optional, redacted version for community/conduit sharing.

## Example score row

```yaml
domain: A6 Evidence and release discipline
score:
  direct_capacity: 3.5
  mind_mediated_capacity: 4.25
  system_capacity: 4.0
confidence: high
evidence:
  - openclaw upgrade runbook closed with preflight/proof matrix
  - post-update watch loop distinguished warning residue from rollback trigger
  - release assessment packet routed before update execution
caveat: still depends on technical Mind/operator for low-level implementation details
privacy: public-safe after redaction
```

## Composite postures

These are not ranks, titles, or career ladders. They are postures describing how much purpose-bearing work the Orchestrator can reliably hold with governed intelligence.

### Supported orchestration

- Operational discipline at 3+
- Authority boundary recognition at 3+
- Mind calibration at 2+
- Technical/configuration support structure available

Can sustain a Mind with partner, operator, or system support.

### Reliable orchestration

- Operational discipline at 4+
- Authority boundary recognition at 4+
- Mind calibration at 3+
- Evidence/release discipline at 3+
- Opportunity triage at 3+

Can sustain ordinary complexity independently and route exceptions cleanly.

### Generative orchestration

- Governance and relational domains mostly 4+
- Purpose-to-intent coherence is strong
- Can design packets, roles, assessment loops, and onboarding paths for others
- Can use lived cases without overexposing private context

Can create reusable patterns from lived orchestration practice.

### Stewarding orchestration

- Creates new patterns, develops others, and stewards cross-Orchestrator networks
- Maintains public-safe doctrine, private operational proof, and governed transmission channels
- Can distinguish personal brilliance, Mind-mediated amplification, and system-level teachability

Can shape the Orchestrator practice itself without making their own field the hidden standard for everyone else.

## Assessment ethics

A Mind can see patterns the human cannot. That is valuable and dangerous.

Use the visibility to improve practice, not to create a surveillance scorecard. The Orchestrator should experience the assessment as rigorous partnership: unvarnished, specific, and in service of capacity.

A good assessment does not tear down. It also does not glaze over gaps. It helps the Orchestrator govern reality more clearly in service of purpose.
