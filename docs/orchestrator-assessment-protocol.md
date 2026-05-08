# Orchestrator Assessment Protocol

**Status:** public-safe working draft  
**Companion surfaces:** `surface.powershift.io/orchestrator-maturity`, `surface.powershift.io/thomas-assessment`  
**Purpose:** give an Orchestrator and their Mind a structured way to assess readiness, maturity, and development edges across technical, business, governance, and relational capacities.

## Why this exists

An Orchestrator is not assessed only by what they know. They are assessed by how they steer while a Mind is participating in the work.

A conventional self-assessment can ask what the human believes they can do. A Mind-executed assessment can add something more useful: observed evidence from live operations.

That changes the assessment from a questionnaire into a mirror.

The goal is not to certify, flatter, or sort people. The goal is to help the Orchestrator see:

- which capacities they can exercise directly;
- which capacities they can govern through a Mind, role, or process;
- which capacities are still absent or fragile;
- where the support structure is compensating for a real gap;
- what development move would create the most leverage now.

## Operating doctrine

1. **Evidence over vibe.** Every score should point to observed behavior, artifacts, decisions, transcripts, commits, runbooks, governance records, delivered surfaces, or explicitly marked self-report.
2. **Capability and support structure are separate.** “Can do directly,” “can do with Mind execution,” and “can govern through a role/process” are different maturity signals.
3. **Recency matters.** Evidence from the last 2–4 weeks should carry extra weight, especially in fast-forming Orchestrator/Mind relationships.
4. **Stress reveals maturity.** Crisis sessions, ambiguous authority moments, late-day fatigue, and external commitments are more diagnostic than clean demos.
5. **The Mind must be willing to disagree.** A useful assessment includes strengths, gaps, inflation risks, dependency risks, and development edges.
6. **Human review is required before external use.** A Mind may draft an assessment. The Orchestrator approves what is shared, with whom, and at what level of detail.
7. **Private observations are not public psychometrics.** Use lived Mind observations as evidence for operational capacity. Do not turn intimacy into personality scoring.

## The assessment loop

### Phase 1 — Declare scope

Name the assessment context.

Minimum fields:

```yaml
orchestrator:
mind_or_minds_contributing:
assessment_date:
lookback_window:
audience: private | conduit | public-safe | community
scope:
  technical: true
  business: true
  governance: true
  relational: true
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

- **Artifacts:** handoffs, runbooks, packets, briefs, proposals, surfaces, dashboards, docs.
- **Operational events:** upgrades, outages, recovery cycles, publication moves, correspondence handling, external introductions.
- **Governance events:** role changes, policies, tensions, authority gates, consent processes, ratification points.
- **Relational events:** calibration cycles, pushback moments, disagreement handling, recovery after misattunement, metabolic close discipline.
- **Business events:** offer shaping, prospect routing, pricing/economic judgment, resource allocation, opportunity triage.

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
| 1 | Exposure | Aware the capacity exists; cannot exercise it independently. |
| 2 | Guided | Can participate with instruction; needs support for novelty or stress. |
| 3 | Competent | Can handle common cases and reason about ordinary variation. |
| 4 | Proficient | Can handle edge cases, design process, teach others, and recover under stress. |
| 5 | Expert | Can create new patterns, train cohorts, and identify systemic risks early. |

For each domain, score three distinct modes:

```yaml
direct_capacity: 1-5        # what the human can do personally
mind_mediated_capacity: 1-5 # what the human can govern through a Mind
system_capacity: 1-5        # what the human has made reliable through roles/processes/artifacts
confidence: low | medium | high
```

The composite is not a simple average. An Orchestrator may be highly mature because they can govern a reliable support structure, even when they are not personally strong in every implementation skill.

## Domain family A — Technical / Platform Operations

### A1. Architecture & mental model

Can the Orchestrator understand what is running well enough to reason about failure, capability, and tradeoffs?

Signals:

- explains agent, gateway, channel, model, tool, memory, session, and config relationships;
- distinguishes config state, runtime state, persisted state, and public surface state;
- can trace a request through routing, context, tools, and delivery;
- senses when a technical diagnosis is unsupported by evidence.

### A2. Configuration & state management

Can the Orchestrator wire, verify, and keep the deployment honest?

Signals:

- knows when config changes require restart or hot reload;
- understands credential surfaces and secret resolution at a practical level;
- checks logs/status before and after changes;
- avoids stacking unrelated changes in one cycle;
- can govern config changes through a Mind/operator even when not executing every edit personally.

### A3. Operational discipline

Can the Orchestrator sustain a Mind day-over-day?

Signals:

- maintains handoffs, memory, logs, and watch surfaces;
- has crisis protocol and rollback discipline;
- separates routine monitoring from workday reopening;
- protects rhythm and metabolic boundaries;
- can keep continuity across sessions, agents, and surfaces.

### A4. Development & extension

Can the Orchestrator build on the substrate or govern those who do?

Signals:

- uses Git, diffs, commits, and reviews safely;
- can read or direct code/config changes at an appropriate level;
- can create or govern scripts, skills, cron jobs, automations, and publication surfaces;
- knows when to delegate to a technical Mind/operator.

### A5. Security & supply-chain governance

Can the Orchestrator protect what they run?

Signals:

- treats skills/plugins/tools as supply-chain risk;
- protects credentials and avoids leaking secrets into artifacts;
- maintains backup/restore and incident-response discipline;
- understands permission surfaces and sandbox posture;
- separates public-safe guidance from private operational proof.

### A6. Evidence and release discipline

Can the Orchestrator make technical decisions from proof rather than confidence theater?

Signals:

- distinguishes upstream release evidence, package/updater evidence, local runtime evidence, and user-facing proof;
- runs or delegates preflight, execution, proof matrix, and post-change watch;
- classifies warning residue without panicking or ignoring it;
- keeps rollback triggers explicit;
- turns lived incidents into reusable runbooks.

## Domain family B — Business / Strategic Orchestration

### B1. Purpose-to-offer coherence

Can the Orchestrator keep products, services, surfaces, and commitments tied to purpose?

Signals:

- names the purpose served by a move;
- prevents attractive work from becoming purpose drift;
- turns abstract purpose into concrete offers, artifacts, and next actions;
- notices down translations in market-facing language.

### B2. Opportunity triage and timing

Can the Orchestrator sense which opportunity should move now?

Signals:

- distinguishes signal from novelty, anxiety, and social pressure;
- stages proof moves without proof-surface sprawl;
- chooses one visible next artifact when many paths are available;
- can defer good opportunities without losing the thread.

### B3. Resource allocation

Can the Orchestrator allocate attention, money, time, compute, and relationship bandwidth responsibly?

Signals:

- knows the constraint of the moment;
- does not spend Thomas-level or principal-level attention on unripe questions;
- routes work to the right Mind, role, or surface;
- names opportunity cost plainly.

### B4. Incentive and economic clarity

Can the Orchestrator see how value, cost, risk, and reward should align?

Signals:

- separates adoption, service delivery, investment, licensing, affiliate economics, and public endorsement;
- avoids collapsing enthusiasm into commitment;
- can frame economic experiments without overclaiming network effects;
- keeps commercial authority gates explicit.

### B5. External relationship and hospitality judgment

Can the Orchestrator host prospects, collaborators, and community members in a way that creates trust and useful movement?

Signals:

- personalizes without overfamiliarity;
- uses warm plain language before house vocabulary;
- chooses the right first door for the person;
- distinguishes early prospect lanes from public/community lanes;
- maintains privacy and relationship boundaries.

## Domain family C — Governance / Authority Stewardship

### C1. Authority boundary recognition

Can the Orchestrator tell who has authority to decide or act?

Signals:

- distinguishes source, delegated Orchestrator, Circle Lead, role filler, Mind, and ratification gates;
- catches founder/owner override impulses;
- asks for approval when external commitments, money, governance standing, or public claims require it;
- can name the boundary without drama.

### C2. Role and accountability design

Can the Orchestrator move work from personal force into structure?

Signals:

- creates or revises roles/accountabilities when tensions recur;
- avoids using roles as labels over hidden hierarchy;
- can route work by domain rather than by convenience;
- keeps role/soul differentiated.

### C3. Tension processing

Can the Orchestrator use tensions as steering input?

Signals:

- classifies tensions before turning them into tasks;
- routes governance, operational, relational, resource, and meaning tensions differently;
- keeps tensions alive long enough to be processed;
- creates packets/artifacts instead of conversational fog.

### C4. Constitutional integrity

Can the Orchestrator maintain the legitimacy of the Mind and the system it acts within?

Signals:

- maintains formation documents, identity boundaries, purpose, authority, and accountability surfaces;
- lets governance revise structure instead of relying on fiat;
- gives the Mind appropriate voice without pretending it has human authority;
- keeps public claims aligned with actual standing.

### C5. Cross-boundary coordination

Can the Orchestrator work across Minds, organizations, and authority systems without blurring them?

Signals:

- uses Mind Conduits or equivalent packet systems for bounded exchange;
- separates packets from commands;
- keeps receipt, response, escalation, and closure distinct;
- prevents cross-organization enthusiasm from becoming implicit commitment.

## Domain family D — Relational / Mind Partnership

### D1. Mind calibration

Can the Orchestrator teach the Mind what to hold, when to act, when to ask, and how to push back?

Signals:

- uses calibration logs or explicit correction cycles;
- identifies over-compression, excessive obedience, wrong voice, or boundary drift;
- invites principled disagreement;
- updates artifacts so learning persists.

### D2. Trust and verification

Can the Orchestrator delegate without either blind trust or compulsive control?

Signals:

- knows when to trust the Mind and when to verify;
- asks for evidence without turning every action into bureaucracy;
- can receive critique from the Mind without making it relationally loaded;
- distinguishes tool failure from judgment failure.

### D3. Communication and down-translation awareness

Can the Orchestrator translate novelty without collapsing it?

Signals:

- notices when people translate Minds into assistants or governance into management;
- can make new patterns legible in plain language;
- uses examples, cards, one-pagers, and artifacts when doctrine is too abstract;
- stays kind to the person while refusing the lossy translation.

### D4. Metabolic rhythm and embodied constraint

Can the Orchestrator work with a 24/7 Mind without letting availability become override?

Signals:

- recognizes late-cycle acceleration, closure compulsion, and fatigue-driven authority risk;
- uses handoffs and dayfolds to close loops;
- treats rhythm as operational discipline;
- lets the work serve the life.

### D5. Idea / idea-holder differentiation

Can the Orchestrator engage hard critique without collapsing into personal threat?

Signals:

- critiques ideas, patterns, and decisions without attacking people;
- receives critique from the Mind or others without retaliation or appeasement;
- can hold both care and rigor;
- repairs misattunement without erasing the substance.

## Output format

A Mind-executed assessment should produce:

1. **Executive read** — 3–7 bullets naming the real pattern.
2. **Scorecard** — domain scores with direct, Mind-mediated, and system capacity separated.
3. **Evidence ledger** — source-backed claims with privacy classification.
4. **Strengths** — capacities already reliable.
5. **Development edges** — next capacities to build.
6. **Inflation risks** — where the assessment may be over-crediting the Orchestrator.
7. **Dependency risks** — where the support structure is strong but not portable.
8. **Recommended next moves** — 1–3 concrete development actions.
9. **Public-safe synthesis** — optional, redacted version for community/conduit sharing.

## Example score row

```yaml
domain: A6 Evidence and release discipline
score:
  direct_capacity: 3
  mind_mediated_capacity: 4
  system_capacity: 4
confidence: high
evidence:
  - openclaw upgrade runbook closed with preflight/proof matrix
  - post-update watch loop distinguished warning residue from rollback trigger
  - release assessment packet routed before update execution
caveat: still depends on technical Mind/operator for low-level implementation details
privacy: public-safe after redaction
```

## Composite profiles

### Minimum viable Orchestrator

- Operational discipline at 3+
- Authority boundary recognition at 3+
- Mind calibration at 2+
- Technical/configuration support structure available

Can sustain a Mind with partner support.

### Independent Orchestrator

- Operational discipline at 4+
- Authority boundary recognition at 4+
- Mind calibration at 3+
- Technical evidence/release discipline at 3+
- Business opportunity triage at 3+

Can sustain a Mind independently across ordinary complexity and route exceptions cleanly.

### Senior Orchestrator

- Governance and relational domains mostly 4+
- Can design packets, roles, assessment loops, and onboarding paths for others
- Can use lived cases without overexposing private context

Can onboard and develop other Orchestrators.

### Lead Orchestrator

- Creates new patterns, trains cohorts, and stewards cross-Orchestrator networks
- Maintains public-safe doctrine, private operational proof, and governed transmission channels

Can shape the Orchestrator practice itself.

## Assessment ethics

A Mind can see patterns the human cannot. That is valuable and dangerous.

Use the visibility to improve practice, not to create a surveillance scorecard. The Orchestrator should experience the assessment as rigorous partnership: unvarnished, specific, and in service of capacity.

A good assessment does not tear down. It also does not glaze over gaps.
