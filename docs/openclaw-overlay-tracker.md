# OpenClaw Overlay Tracker

A canonical repo surface for runtime-specific PowerShift® Stack enhancements.

Use this document to track what is already packaged, what is the next implementation move, and what overlay families are planned but not yet built.

This tracker is intentionally narrower than the whole Stack.
It covers **runtime-specific enhancements to basic OpenClaw installs**, not constitutional or legal documents.

---

## Status legend

- **Implemented** — packaged in this repo now
- **Planned next** — the next high-probability, low-break-risk implementation move
- **Planned later** — intended, but dependent on earlier implementation or design stabilization
- **Candidate** — named direction, not yet committed to implementation order

---

## Field status: deployed and in flight

| Integration | Runtime field status | Repo status | Packaging surface | Notes |
|---|---|---|---|---|
| Cross-agent constellation coordination via `sessions_send` / `sessions_history` / `sessions_list` | **Deployed in reference harnesses** | Not yet packaged as a distinct overlay | N/A yet | This pattern enables inter-agent asks, background action, and verification across sessions. It is currently represented as operating practice and can later become a packaged Stack surface. |
| Inter-Agent Handoff Receipts, manual emit version | **Deployed live** | **Implemented** | `overlays/openclaw/inter-agent-receipts/` | Live shared receipt ledger and per-thread lifecycle surfaces exist now. Repo packaging includes emitter script, templates, and installation guidance. |
| Inter-Agent Receipt Automation, Phase 1 (`handoff_send` wrapper) | **Implemented in overlay form** | **Implemented** | `overlays/openclaw/inter-agent-receipts/` | Additive `handoff-send.py` shells out to transport, derives a deterministic `receipt_id`, emits the sender-side receipt seed, and verifies the thread exists without changing core OpenClaw behavior. |
| Sessions-send adapter contract | **Implemented in overlay form** | **Implemented** | `overlays/openclaw/inter-agent-receipts/` | `sessions-send-adapter.py` plus its contract doc give the wrapper a stable local CLI boundary while keeping machine-specific `sessions_send` details swappable underneath. |
| Inter-Agent Receipt Automation, Phase 2 (hook-based lifecycle emission) | **Not deployed yet** | **Planned later** | `overlays/openclaw/inter-agent-receipts/` or companion plugin overlay | Use OpenClaw plugin hooks like `after_tool_call`, `before_agent_reply`, and `agent_end` to emit `sent`, `received`, and `acted` automatically. |
| Authority Preflight / Action Preflight prototype | **Prototype built** | **Candidate for packaging** | future `overlays/openclaw/authority-preflight/` | Advisory prototypes can build machine-readable authority packets and return `allow`, `escalate`, `block`, or `ambiguous_needs_interpretation` decisions. This pattern is not yet packaged or wired into live runtime enforcement. |
| Memory Architecture Guide | **Deployed as reference doctrine; implementation details under active audit** | **Implemented as repo guide** | `docs/memory-architecture.md` | Defines layered memory for governed intelligence: memory-core recall, Dreaming consolidation, memory-wiki canon, explicit work-state outside memory, and scoped pilots for `active-memory` / `lossless-claw`. |
| Installation pathways / manual OpenClaw overlay quickstart framing | **Partially deployed as documentation** | **Implemented as repo framing** | `docs/openclaw-overlays.md`, `docs/getting-started.md`, `README.md` | The repo now explicitly distinguishes governance kernel from runtime overlays and presents overlays as manual quickstart components. |
| Governance Bus / Tension Routing Helpers | **Not deployed yet** | **Candidate** | future overlay family | Named direction for governed constellation coordination, routing, and observability surfaces. Not yet stabilized enough for packaging order. |

---

## Current implementation rule

When choosing between two possible implementation paths, prefer:

1. the path most likely to be executed soon
2. the path least likely to break a working deployment
3. the path that keeps the governance kernel clean by pushing substrate-specific behavior into overlays

That rule is why the current implementation order for inter-agent receipt automation is:
- **Phase 1:** additive wrapper tool
- **Phase 2:** hook-based automation

---

## Scope boundary

Keep these in the tracker:
- runtime overlays
- observability surfaces
- enforcement helpers
- coordination patterns
- substrate-specific installable enhancements

Keep these out of the tracker:
- constitutional text changes
- legal document revisions
- tenant-specific PSI implementation details
- private hosted service choreography

---

This document is the repo-visible answer to: "What runtime enhancements do we already have, and what are we planning next?"
