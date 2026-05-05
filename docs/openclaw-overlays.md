# OpenClaw Overlays

The PowerShift® Stack is the governance kernel.
OpenClaw is the first reference runtime substrate documented here. Other runtime substrates can carry the same governance patterns through their own overlays.

OpenClaw overlays are runtime-specific extensions that make that kernel operational inside an OpenClaw deployment.

This is where modifications or extensions to a basic OpenClaw install belong when they are:
- useful across PowerShift deployments
- substrate-specific and outside the constitutional kernel
- more operational than doctrinal

## Where overlays sit in the lower stack

OpenClaw overlays mainly live in the lower operational layers of the broader Stack taxonomy.

### Runtime Reference Patterns

Overlays can carry reusable runtime patterns such as:
- tension processing protocol
- workspace architecture
- memory continuity surfaces
- metabolic safety support
- governed constellation coordination

### Authority Translation + Enforcement

Overlays can also expose machine-operational authority behavior such as:
- action preflight
- route / allow / escalate / block logic
- authority snapshot evaluation
- governance bus and routing helpers
- observability surfaces for governed decisions

### Substrate + Interfaces

And they can package substrate-facing implementation surfaces such as:
- models
- nodes
- cron
- Git / GitHub
- Telegram / Gmail / voice / web surfaces
- MCP servers
- external APIs

## Current overlays

The canonical tracker for implemented and planned runtime enhancements lives at:
- [`docs/openclaw-overlay-tracker.md`](openclaw-overlay-tracker.md)

### Inter-Agent Handoff Receipts

Path:
- `overlays/openclaw/inter-agent-receipts/`

Purpose:
- make cross-agent communication legible to the Orchestrator
- expose the chain from sent → received → acted → verified → closed
- create a shared markdown history of inter-agent communication over time

Includes:
- emit helper script
- additive handoff wrapper script
- canonical local sessions-send adapter contract
- shared index template
- per-thread template
- handoff payload template
- installation guidance

Current maturity:
- **implemented now:** manual receipt emission
- **implemented now:** wrapper-based sender-side automation via `handoff-send.py`
- **planned later:** hook-based lifecycle emission inside OpenClaw's plugin/event layer

This overlay is a concrete example of a clarity surface that spans runtime coordination, enforcement visibility, and substrate-specific implementation.

### Mind Conduits

Path:
- `overlays/openclaw/mind-conduits/`

Purpose:
- define governed interconnects between Minds / agents across a boundary
- provide a Tier 1 GitHub-backed packet exchange pattern that can be deployed without OpenClaw gateway changes
- preserve explicit scope, authority source, receipt, escalation, and audit trail for Mind-to-Mind coordination
- document the roadmap from Git-backed packets to OpenClaw-native Conduit tools and eventual remote Mind network / broker infrastructure

Includes:
- overlay guide
- packet template
- registry template
- lifecycle record template

Current maturity:
- **ready now:** Tier 1 Git-backed packet exchange using Markdown/JSON and Git commits
- **planned next:** OpenClaw-native Conduit operations such as `conduit_send`, `conduit_inbox`, `conduit_ack`, and `conduit_escalate`
- **planned later:** authenticated remote Mind network / broker for gateway-to-gateway or brokered delivery

This overlay is the public-safe form of the Mind Conduit primitive: a governed interconnect for Minds that carries signal without merging authority boundaries.


### Orchestrator operations guides

Paths:
- `docs/orchestrator-openclaw-upgrade-discipline.md`
- `docs/orchestrator-backup-restore-strategy.md`
- `docs/orchestrator-openclaw-pattern-inventory.md`
- `templates/openclaw-upgrade-runbook.md`
- `templates/pre-change-snapshot-checklist.md`
- `templates/monthly-restore-drill.md`

Purpose:
- give Orchestrators reusable operating discipline for upgrades, backups, restore drills, and public-stack pattern selection
- preserve evidence, rollback thinking, and recovery confidence around risky runtime changes
- turn live operating lessons into public-safe templates without exposing private deployment details

Current maturity:
- **ready now:** working guide/template surfaces for review
- **planned next:** filled redacted examples and retention-policy template

### Memory Architecture

Path:
- `docs/memory-architecture.md`

Purpose:
- define memory as part of the governed agent substrate: `Agent = LLM + Memory + bash`
- separate operational recall, Dreaming consolidation, compiled wiki knowledge, and explicit work-state surfaces
- keep `active-memory` and `lossless-claw` as measured pilots with explicit promotion criteria
- give Orchestrators a checklist for whether a deployment's memory system is actually governed

Current maturity:
- **implemented now:** architectural guide and baseline configuration pattern
- **planned next:** memory architecture ledger template and Dreaming audit protocol
- **planned later:** packaged pilot reports for `active-memory` and `lossless-claw` once measured in reference deployments

## Packaging rule

If a pattern is:
- a universal governance rule, it belongs in the primer, constitution, profiles, or core docs
- a runtime-specific operational implementation, it belongs in an overlay

That keeps the Stack clean while still making the working system portable.

## Installation stance

Do not assume one-command install.

For now, overlays are **manual OpenClaw quickstart components**:
- copy the files
- place them in the right runtime/shared-context locations
- adapt them to the local deployment

This matches the current repo strategy: clear pathways first, automation later.
