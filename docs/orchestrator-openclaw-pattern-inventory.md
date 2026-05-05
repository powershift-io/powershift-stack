# Orchestrator OpenClaw Pattern Inventory

**Status:** working inventory for PowerShift® Stack publication planning  
**Audience:** Orchestrators deploying the PowerShift® Operating System on OpenClaw or adjacent agent runtimes  
**Publication posture:** public-safe summaries; source artifacts remain private until sanitized

## Purpose

This inventory names the OpenClaw-era operating patterns that appear useful to Orchestrators. It separates items already packaged in the Stack from candidate guides, templates, overlays, and future implementation surfaces.

Use it as a workbench: select the next public artifact, confirm the boundary, then polish into the repo.

## Already packaged or actively staged

### 1. OpenClaw overlay map

**Current surface:** `docs/openclaw-overlays.md`, `docs/openclaw-overlay-tracker.md`  
**Value:** gives Orchestrators a place to understand runtime-specific extensions without mixing them into the constitutional kernel.  
**Next move:** keep this as the canonical navigation surface for all runtime overlays.

### 2. Memory architecture for governed intelligence

**Current surface:** `docs/memory-architecture.md`  
**Value:** explains memory as operational continuity: recall, Dreaming consolidation, wiki canon, work-state boundaries, and pilot discipline for memory plugins.  
**Next move:** add a companion audit checklist and memory-ledger template.

### 3. Inter-agent handoff receipts

**Current surface:** `overlays/openclaw/inter-agent-receipts/`  
**Value:** makes cross-agent handoffs visible through receipt IDs, lifecycle records, and shared history.  
**Next move:** package an Orchestrator-facing example using generic endpoint names.

### 4. Mind Conduits

**Current surface:** `overlays/openclaw/mind-conduits/`  
**Value:** gives Minds a governed packet path across boundaries using scope, authority source, receipt, and escalation fields. Tier 1 works through Git/GitHub without gateway changes.  
**Next move:** add one tiny sample Conduit with safe fictional endpoints.

### 5. OpenClaw upgrade discipline

**Current surfaces:** `docs/orchestrator-openclaw-upgrade-discipline.md`, `templates/openclaw-upgrade-runbook.md`  
**Value:** gives Orchestrators a pre/mid/post update process with release classification, snapshot gates, proof matrix, rollback rules, and after-action capture.  
**Next move:** add a short filled example excerpt after review.

### 6. OpenClaw backup and restore strategy

**Current surfaces:** `docs/orchestrator-backup-restore-strategy.md`, `templates/pre-change-snapshot-checklist.md`, `templates/monthly-restore-drill.md`  
**Value:** gives Orchestrators a layered safety model: hot state, cold corpus, versioned identity, offsite recovery, and restore drills.  
**Next move:** add a retention-policy template.

## High-value candidates beyond the current staged set

### 7. Recovery Sentinel pattern

**Candidate surface:** `overlays/openclaw/recovery-sentinel/` or `docs/recovery-sentinel-pattern.md`  
**Value:** a low-agency secondary OpenClaw/VPS node checks backup freshness, restore viability, and exposure drift. This is a strong first distributed-node use case because it extends safety without expanding live authority.  
**Public-safe shape:** generic architecture note + checklist for snapshot age, repository checks, sample restore, and alert thresholds.  
**Maturity:** concept captured; needs public sanitization.

### 8. Orchestrator Template Lab

**Candidate surface:** `examples/hosted-openclaw-template/`  
**Value:** turns a VPS/container OpenClaw deployment into a reproducible reference path for future Orchestrators.  
**Public-safe shape:** Docker/Traefik/config categories, hardening gates, restore drill proof, and first-login checklist.  
**Maturity:** internal experience exists; public example needs fictional paths and endpoints.

### 9. Remote Runner / federated field node

**Candidate surface:** future Conduit companion or `overlays/openclaw/federated-nodes/`  
**Value:** lets a secondary OpenClaw node accept bounded work packets and return receipts/artifacts. It keeps work state explicit and avoids muddy shared live state.  
**Public-safe shape:** task-packet contract, receipt contract, authority boundary, and allowed-job classes.  
**Maturity:** candidate after Recovery Sentinel and Conduit Tier 1 are proven.

### 10. OpenClaw security baseline and lane separation

**Candidate surface:** `docs/openclaw-security-baseline.md` or `templates/runtime-trust-surface-review.md`  
**Value:** helps Orchestrators distinguish a trusted operator lab from customer/prospect-facing service lanes.  
**Public-safe shape:** audit checklist for channel exposure, exec posture, filesystem tools, plugin trust, reverse proxy trust, and service-lane separation.  
**Maturity:** strong internal audit exists; needs careful wording so it teaches posture without exposing live config details.

### 11. Observability and evidence mesh

**Candidate surface:** `docs/openclaw-observability-map.md`  
**Value:** maps the many record layers OpenClaw creates: gateway logs, sessions, memory indexes, cron state, wiki, handoffs, receipts, and ACP logs. Orchestrators need this map when reconstructing incidents.  
**Public-safe shape:** layer map + retention/control worksheet.  
**Maturity:** internal map exists; ready for public-safe condensation.

### 12. Google Workspace access for Docker-hosted Minds

**Candidate surface:** `overlays/openclaw/google-workspace-gog-docker/`  
**Value:** a hosted Mind often needs Gmail, Calendar, Drive, Docs, Sheets, and Contacts. The durable Docker keyring/config pattern prevents lost OAuth state after container recreation.  
**Public-safe shape:** prerequisite checklist, Docker environment variables with placeholders, OAuth hygiene rules, verification commands.  
**Maturity:** operational procedure exists; must be scrubbed for private account paths and example credentials.

### 13. ACP coding-harness delegation pattern

**Candidate surface:** `overlays/openclaw/acp-coding-harnesses/`  
**Value:** explains when OpenClaw-native subagents and external ACP harnesses serve different purposes, especially for repo work, file edits, and subscription/API auth separation.  
**Public-safe shape:** architecture guide + authority/sandbox warning + task selection checklist.  
**Maturity:** internal research exists; needs current-doc verification before publication.

### 14. Model routing policy

**Candidate surface:** `templates/model-routing-policy.md`  
**Value:** Orchestrators need a legible way to choose models by trust, cost, latency, capability, and task risk. This moves model choice into governance practice.  
**Public-safe shape:** routing table template, escalation rule, fallback rule, and after-action capture for bad routes.  
**Maturity:** repeated operating practice exists; needs explicit template.

### 15. Cron / heartbeat truthfulness pattern

**Candidate surface:** `overlays/openclaw/heartbeat-receipts/` or `docs/automation-truthfulness.md`  
**Value:** scheduled agents can create false confidence if runs are invisible, stale, or silently skipped. Receipts, failure alerts, and visible impact loops make automation accountable.  
**Public-safe shape:** heartbeat receipt format, failed-check taxonomy, summary rules, and escalation thresholds.  
**Maturity:** live practice exists; public artifact would be highly useful.

### 16. Tension packet specification

**Candidate surface:** `templates/tension-packet.md` and `docs/tension-processing-runtime.md`  
**Value:** a simple packet shape lets humans, Minds, and workers capture gaps without needing a full governance ceremony at every sensing moment.  
**Public-safe shape:** packet fields, lifecycle states, routing rules, and examples.  
**Maturity:** named in readiness planning; still needs first clean template.

### 17. Authority preflight / action gate

**Candidate surface:** `overlays/openclaw/authority-preflight/`  
**Value:** before a Mind acts, it can produce a machine-readable authority snapshot: route, allow, escalate, block, or request interpretation.  
**Public-safe shape:** advisory packet schema + examples for external communication, financial action, system action, and governance writes.  
**Maturity:** prototype-level; publish as candidate pattern, not enforcement claim.

### 18. Metabolic override protocol

**Candidate surface:** `docs/metabolic-override-protocol.md`  
**Value:** Orchestrators running high-intensity cognitive systems need rhythm protection, especially when long agent sessions create open-loop pressure.  
**Public-safe shape:** signs, intervention moves, end-of-day handoff template, and boundary-repair procedure.  
**Maturity:** durable internal doctrine exists; public version should be humane and non-clinical.

### 19. Voice memo capture and reciprocity

**Candidate surface:** `docs/voice-capture-pattern.md`  
**Value:** voice is a low-friction capture path for Orchestrators and collaborators. It needs transcription, routing, memory promotion, and reply-mode norms.  
**Public-safe shape:** capture pipeline, classification, consent/privacy notes, and “when to answer by voice” rule.  
**Maturity:** practice exists; template would help adoption.

### 20. Public Stack Steward operating discipline

**Current surface:** `docs/public-stack-steward-operating-model.md`  
**Value:** shows how an agent-held steward role can maintain a public repo with bounded authority, review gates, and source-backed publication discipline.  
**Next move:** add a small “repo work queue” template for other Orchestrators.

## Suggested publication order

1. **Upgrade discipline + backup/restore safety** — immediate value, already sourced, directly useful after OpenClaw release turbulence.
2. **Mind Conduits sample + Conduit Tier 1 checklist** — already staged and strategically important for Orchestrator collaboration.
3. **Security baseline + lane separation** — essential before broader customer/prospect deployment.
4. **Observability/evidence mesh** — makes incidents reconstructable and strengthens trust.
5. **Recovery Sentinel / Template Lab** — turns backup work into a deployment archetype.
6. **Tension packets + authority preflight** — begins the runtime governance bus.

## Boundary review before publication

Before any candidate leaves local staging:

- replace private people, domains, repo names, account IDs, chat IDs, hostnames, and filesystem paths with fictional examples or placeholders;
- remove secrets, token names, credential formats, callback URLs, bucket names, raw logs, and process identifiers;
- avoid claims that a pattern is enforced by OpenClaw unless the enforcement exists in the packaged artifact;
- keep internal incident details out unless the reusable lesson survives on its own;
- route external publication through the appropriate review/ratification path.
