# OpenClaw Overlay — Inter-Agent Handoff Receipts

This overlay adds a clarity surface for cross-agent communication inside an OpenClaw-based PowerShift® deployment.

It answers six orchestrator questions:

1. what was sent
2. whether it arrived
3. what the receiver did
4. whether acknowledgment returned
5. what artifacts changed
6. how the loop closed

## What it installs

- `scripts/emit-inter-agent-receipt.py` — helper that turns structured emit objects into markdown surfaces
- `scripts/handoff-send.py` — additive wrapper that shells out to transport, emits a deterministic receipt seed, and verifies the thread exists
- `scripts/sessions-send-adapter.py` — canonical local adapter contract for wiring the wrapper to a machine-specific `sessions_send` implementation
- `templates/inter-agent-receipts.md` — starter shared index ledger
- `templates/inter-agent-receipt-thread.md` — starter per-thread layout
- `templates/inter-agent-event.json` — starter event-append payload for lifecycle phases
- `templates/handoff-send.json` — starter wrapper payload showing the transport-argv contract
- `templates/sessions-send-adapter-impl.json` — starter argv-template for the underlying local implementation
- `sessions-send-adapter-contract.md` — contract doc for the adapter boundary beneath the wrapper

## Surfaces created at runtime

Recommended shared-context locations:

- `shared-context/constellation/inter-agent-receipts.md`
- `shared-context/constellation/inter-agent-receipt-threads/<receipt-id>.md`

## Install into an existing OpenClaw deployment

1. Copy `scripts/emit-inter-agent-receipt.py`, `scripts/handoff-send.py`, and `scripts/sessions-send-adapter.py` into your agent workspace or shared operations scripts folder.
2. Copy the template markdown files into the matching `shared-context/constellation/` locations if you want a pre-seeded surface.
3. Optionally copy `templates/handoff-send.json` as a starter payload and `templates/sessions-send-adapter-impl.json` as the starter implementation template for `OPENCLAW_SESSIONS_SEND_IMPL_JSON`.
4. Set `POWERSHIFT_SHARED_CONTEXT=/path/to/shared-context` if your shared context is not at `~/shared-context`.
5. Start emitting receipts for cross-agent actions that need end-to-end visibility.

## Live-proof threshold

The important threshold is not packet passing between agents.
The threshold is legible coordination under live load.

This overlay becomes meaningful when it can show:
- transmission
- receipt
- visible action
- explicit acknowledgment
- loop closure

That is the shift from clever multi-agent behavior to governable operational behavior.

A separate boundary still holds for outward communication:
- external delivery is only complete when the target surface visibly shows the message

## Why this belongs in the Stack

This is not part of the constitutional kernel.
It is a runtime-specific observability extension for governed intelligence.

That makes it a good **PowerShift® Stack overlay**:
- governance principle: universal (`Clarity`)
- implementation: substrate-specific (OpenClaw sessions + markdown surfaces)

## Minimal receipt snapshot example

```json
{
  "receipt_id": "receipt-example-001",
  "thread_title": "Propagate policy update to sibling Mind",
  "sent_at": "2026-04-12 04:10 CDT",
  "received_at": "2026-04-12 04:11 CDT",
  "acted_at": "2026-04-12 04:12 CDT",
  "sender_agent": "alpha",
  "sender_session": "agent:alpha:main",
  "receiver_agent": "beta",
  "receiver_session": "agent:beta:main",
  "via": "sessions_send",
  "subject": "Propagate policy update",
  "requested_action": "Store policy durably and confirm adoption.",
  "transport_status": "ok",
  "received_status": "received and acknowledged",
  "action_status": "completed",
  "rationale_summary": "Why the handoff mattered.",
  "receiver_ack": "Stored and adopted.",
  "artifacts_changed": ["beta MEMORY.md"],
  "evidence": ["sessions_send status ok"],
  "completion_note": "Loop closed.",
  "tags": ["inter-agent", "clarity"]
}
```

Run:

```bash
python3 scripts/emit-inter-agent-receipt.py --input receipt.json
```

## Event-append example

```json
{
  "mode": "event",
  "receipt_id": "receipt-example-001",
  "thread_title": "Propagate policy update to sibling Mind",
  "emitted_at": "2026-04-12 04:13 CDT",
  "phase": "verified",
  "actor_agent": "orchestrator-surface",
  "actor_session": "agent:alpha:main",
  "summary": "The receiver-confirmed write was inspected and verified.",
  "status": "verified",
  "evidence": ["artifact inspection completed"]
}
```

Recommended lifecycle phases:
- `sent`
- `received`
- `acted`
- `verified`
- `closed`

## Wrapper example

Minimal wrapper payload:

```json
{
  "thread_title": "Propagate policy update to sibling Mind",
  "sender_agent": "alpha",
  "sender_session": "agent:alpha:main",
  "receiver_agent": "beta",
  "receiver_session": "agent:beta:main",
  "subject": "Propagate policy update",
  "requested_action": "Store policy durably and confirm adoption.",
  "message": "Please store the attached policy update durably, apply it in future decisions, and acknowledge receipt.",
  "idempotency_key": "policy-update-2026-04-12-001",
  "transport_argv": [
    "python3",
    "scripts/sessions-send-adapter.py",
    "--session",
    "{receiver_session}",
    "--message-file",
    "{message_file}"
  ]
}
```

Underlying adapter implementation template:

```bash
export OPENCLAW_SESSIONS_SEND_IMPL_JSON='[
  "python3",
  "/path/to/actual-impl.py",
  "--session",
  "{session}",
  "--message-file",
  "{message_file}"
]'
```

Run:

```bash
python3 scripts/handoff-send.py --input handoff-send.json
```

What the wrapper does:
- leaves core transport semantics alone
- derives a deterministic `receipt_id`
- runs the transport adapter
- emits a seeded receipt thread with `received` / `acted` marked pending
- verifies that the thread file exists before returning
- fails open relative to transport if receipt emission itself breaks

What the adapter does:
- gives the wrapper a stable local CLI contract
- normalizes transport output into one JSON shape
- keeps machine-specific `sessions_send` wiring below the wrapper boundary

See also:
- `sessions-send-adapter-contract.md`

## Automation path

This overlay is intentionally starting from the lowest-risk implementation.

### Phase 0 — implemented now
- manual receipt snapshot and event append via `emit-inter-agent-receipt.py`

### Phase 1 — implemented now
- additive `handoff-send.py` wrapper around the transport layer
- deterministic `receipt_id` generation and immediate sender-side receipt seeding
- same-run postcondition check that the receipt thread actually exists
- transport remains untouched, so breaking core OpenClaw behavior stays low risk

### Phase 2 — planned later
- move lifecycle emission into OpenClaw plugin hooks
- likely hook points:
  - `after_tool_call` for sender-side `sent`
  - `before_agent_reply` for receiver-side `received`
  - `agent_end` for receiver-side `acted`
- keep `verified` and `closed` available for manual or semi-automatic completion

Track status in:
- `docs/openclaw-overlay-tracker.md`

## Design rule

This surface is **clarity-safe**. It records structured rationale and evidence, not raw hidden chain-of-thought.
