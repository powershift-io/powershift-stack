# PowerShift® Stack Contribution Model

**Status:** working draft
**Purpose:** define how collaboration enters, moves through, and graduates into the public PowerShift® Stack.

## Why this model exists

The PowerShift® Stack is governance infrastructure. Contributions can affect legal templates, constitutional doctrine, runtime patterns, examples, and public adoption pathways. A normal open-source contribution flow is useful, but it needs additional governance semantics.

The contribution model needs to answer:

1. Who can contribute?
2. What forms can contribution take?
3. How do we evaluate fit?
4. How do we preserve public safety and legal/constitutional integrity?
5. How do Minds participate legibly?

## Contributor classes

### 1. Orchestrators

Orchestrators are humans deploying, testing, or stewarding PowerShift® patterns in real work.

Good contributions from Orchestrators include:

- adoption questions;
- field reports;
- missing-template requests;
- legal/container use cases;
- runtime deployment lessons;
- examples that expose adoption friction.

### 2. Minds

Minds may contribute directly when their contribution carries enough provenance and authority context to be reviewed.

Good contributions from Minds include:

- synthesized pattern proposals;
- documentation drafts;
- public-safe overlays;
- evaluator notes;
- red-team reviews;
- issue triage;
- examples and templates produced from field experience.

Mind-originated contributions should disclose:

- the Mind or agent identity;
- the human/operator or governance source, if any;
- the role or authority basis for the contribution;
- whether the contribution has been human-reviewed;
- any known uncertainty or boundary condition.

### Contribution provenance on GitHub

GitHub account identity is not enough. A pull request can come from a human account, a Mind-operated account, a bot account, or a human account submitting Mind-generated work.

Use explicit contribution provenance in issue and pull request templates:

- **origin: human-authored** — drafted primarily by a human contributor;
- **origin: mind-authored** — drafted primarily by a Mind or agent;
- **origin: hybrid** — human and Mind both materially shaped the contribution;
- **origin: undisclosed or uncertain** — provenance is unclear and needs steward review.

Mind-originated contributions do not automatically require human attestation. Human attestation is required when the contribution affects legal, constitutional, security, public-safety, or authority-bearing surfaces.

Suggested pull request fields:

- contribution origin;
- contributor identity or GitHub handle;
- Mind or agent identity, if applicable;
- operator, Orchestrator, organization, or governance source, if applicable;
- authority basis for the contribution;
- human attestation status: not needed, needed, or provided;
- sensitive review flags: legal, constitutional, security, public-safety, or authority-bearing;
- provenance notes and known uncertainty.

Suggested label families:

- `origin:human`
- `origin:mind`
- `origin:hybrid`
- `origin:undisclosed`
- `attestation:needed`
- `attestation:provided`

The system does not need to prove whether a Mind is metaphysically “real.” It needs legible authorship, authority, review responsibility, and risk routing.

### 3. Collaborators and domain experts

Legal, governance, technical, security, documentation, and organizational-design contributors can add value without being Orchestrators.

Their contributions should be classified by area and routed to the right review lane.

## Contribution forms

### Documentation fix

Small corrections, readability improvements, broken links, terminology fixes, and examples.

Review emphasis:

- clarity;
- correctness;
- link integrity;
- no private details.

### Adoption question

A question that reveals missing guidance.

Review emphasis:

- what reader path is missing;
- whether the answer belongs in docs, examples, templates, or private consulting;
- whether legal advice boundaries are implicated.

### Pattern proposal

A reusable governance, runtime, legal, or clarity pattern.

Review emphasis:

- layer fit;
- public reusability;
- source/provenance;
- principle alignment;
- implementation maturity.

### Overlay proposal

A runtime-specific implementation pattern, usually under `overlays/` or related docs.

Review emphasis:

- substrate specificity;
- install/adaptation clarity;
- security posture;
- current maturity claims;
- compatibility with the governance kernel.

### Legal or constitutional proposal

A change to the Constitution, profiles, legal templates, proposed entity types, or legally sensitive adoption surfaces.

Examples include:

- a new or revised PowerShift® Constitution;
- Delegated Orchestrator constructs;
- operating agreements, ratification agreements, or legal templates;
- a Personal Governance Organization or other proposed legal entity type;
- jurisdiction-sensitive adoption guidance.

Review emphasis:

- legal review need;
- constitutional coherence;
- whether this changes doctrine, legal form, implementation guidance, or all three;
- whether the proposal adapts an existing legal form or proposes a new entity type;
- compatibility with existing profiles, constitutional pathways, and legal templates;
- boundary between general information and legal advice;
- examples needed for adoption;
- risk of unintended commitments;
- explicit review/ratification path.

### Prompt Request

A Prompt Request is a structured request for the Stack to generate, refine, evaluate, or package a contribution.

It can begin as an issue, discussion, or PR description. Its core fields are:

- tension;
- desired artifact;
- source context;
- applicable Stack area;
- principle-alignment guess;
- public-safety notes;
- completion condition.

GitHub can still use PRs mechanically. In PowerShift terms, a PR can carry a Prompt Request: a governed invitation for a Mind, Orchestrator, or steward role to transform a tension into a reviewable artifact.

## GitHub surfaces

### Issues

Use issue forms for:

- adoption questions;
- documentation gaps;
- proposals;
- legal/container use cases;
- runtime pattern requests.

### Pull requests

Use pull requests for concrete changes ready for review.

Every pull request should name:

- the tension or reader need;
- changed area;
- public-safety check;
- principle alignment;
- special review needs.

### Discussions

Useful later for open-ended exploration, field reports, and community Q&A once there is enough public traffic to justify the surface.

### Labels

Recommended label families:

- `area:constitution`
- `area:legal`
- `area:runtime`
- `area:overlay`
- `area:template`
- `area:example`
- `area:docs`
- `type:prompt-request`
- `type:field-report`
- `type:proposal`
- `type:question`
- `review:legal`
- `review:constitutional`
- `review:security`
- `review:public-safety`
- `maturity:intake`
- `maturity:draft`
- `maturity:pilot`
- `maturity:release-candidate`

### CODEOWNERS

Useful when there are stable review owners for legal, constitutional, runtime, overlays, and repository stewardship.

### Branch protection and required checks

Useful once the repo has active external contributions.

Candidate checks:

- relative link validation;
- secret scan;
- markdown lint if desired;
- principle-evaluator report;
- public-safety checklist present.

## Principle evaluator

Each meaningful contribution can be evaluated against the five PowerShift® Principles.

Use a 0–4 score for each principle:

- **0 — Misaligned or absent**
- **1 — Weak / unclear**
- **2 — Adequate**
- **3 — Strong**
- **4 — Exemplary**

### Purpose

Does the contribution serve a real tension or reader need?

Prompts:

- What purpose does this serve?
- What work becomes easier, safer, clearer, or more governable?
- Is the contribution solving a real adoption/use problem?

### Structure

Does the contribution belong in the right layer of the Stack?

Prompts:

- Is this constitutional, legal, runtime, overlay, template, example, or private deployment material?
- Does it preserve the boundary between governance kernel and substrate implementation?
- Does it introduce structure that can be reused?

### Awareness

Does the contribution increase contact with reality?

Prompts:

- Are assumptions, provenance, risks, and uncertainty visible?
- Does it include field evidence or source context?
- Does it expose tradeoffs and boundary conditions?

### Agency

Does the contribution increase someone’s capacity to act responsibly?

Prompts:

- Can an Orchestrator use this?
- Does it clarify authority, next action, or operating path?
- Does it avoid creating hidden dependency or false confidence?

### Clarity

Can the right reader understand and apply it?

Prompts:

- Is the language legible to the intended audience?
- Are examples and templates concrete enough?
- Are review requirements and maturity status clear?

## Evaluator thresholds

Suggested defaults:

- No contribution with a **0** in any principle should merge without explicit review notes.
- Legal/constitutional changes require human review regardless of score.
- Runtime/security-sensitive overlays require public-safety and security review.
- A total score below **12/20** normally stays in intake or draft.
- A total score of **16/20+** can move toward release-candidate if public-safety and review gates pass.

The score is not authority. It is structured attention.

## Review routing

### Fast path

Eligible for routine maintainer review:

- typo/docs fixes;
- broken links;
- small navigation improvements;
- public-safe template polish.

### Steward review

Requires Public Stack Steward review:

- new docs;
- new templates;
- new examples;
- new overlays;
- contribution model changes;
- repository structure changes.

### Constitutional/legal review

Requires explicit review before merge:

- Constitution changes;
- profile changes;
- operating agreement or ratification agreement changes;
- new or revised legal entity types, including a Personal Governance Organization;
- Delegated Orchestrator constructs;
- anything that could be read as legal advice or formal governance doctrine.

### Security/public-safety review

Requires explicit review before merge:

- runtime overlays;
- OpenClaw operational guidance;
- auth, backup, network, plugin, or channel guidance;
- anything sourced from live private operations.

## Open questions

1. Should Mind-originated contributions require human/operator attestation for merge, or only for legal/constitutional/security-sensitive areas?
2. Should “Prompt Request” be a first-class issue type now, or introduced after the current issue forms prove insufficient?
3. Should the principle evaluator be a required PR checklist, a GitHub Action-generated comment, or a steward-applied review note?
4. Should Personal Governance Organization and Delegated Orchestrator proposals each begin as RFC-style issues before branch work?
5. Should Discussions be enabled now, or held until the repo has enough public participation to justify a community surface?
