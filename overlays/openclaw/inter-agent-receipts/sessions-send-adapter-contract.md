# Sessions-Send Adapter Contract

This contract defines the local transport boundary beneath `handoff-send.py`.

Purpose:
- give the wrapper a stable local CLI surface
- keep OpenClaw transport details outside the receipt wrapper
- make different local implementations swappable without changing receipt payloads

## Why this exists

`handoff-send.py` should know how to:
- seed receipts deterministically
- verify receipt threads
- stay fail-open relative to transport

It should **not** need to know how a given machine actually performs `sessions_send`.
That transport detail belongs in a local adapter.

## Canonical adapter entrypoint

Recommended path:
- `scripts/sessions-send-adapter.py`

Canonical invocation shape:

```bash
python3 scripts/sessions-send-adapter.py --session agent:pd:main --message-file msg.txt
```

Alternative target mode:

```bash
python3 scripts/sessions-send-adapter.py --label "PD main" --message-file msg.txt
```

## Required inputs

Exactly one target selector:
- `--session <sessionKey>`
- `--label <label>`

Exactly one message selector:
- `--message-file <path>`
- `--message <text>`

## Optional inputs

- `--agent-id <agentId>`
- `--timeout-seconds <number>`
- `--dry-run`

## Implementation wiring

The packaged adapter reads:
- `OPENCLAW_SESSIONS_SEND_IMPL_JSON`

That variable should be a JSON argv template.

Example:

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

Supported placeholders:
- `{session}`
- `{label}`
- `{agent_id}`
- `{timeout_seconds}`
- `{message}`
- `{message_file}`

## Normalized output contract

The adapter should print JSON.

Minimum normalized shape:

```json
{
  "status": "ok",
  "delivery": "accepted",
  "session": "agent:pd:main",
  "label": null,
  "agentId": null,
  "messageChars": 123,
  "implArgv": ["python3", "..."],
  "stdoutPreview": "optional",
  "stderrPreview": null
}
```

## Status semantics

Recommended statuses:
- `ok` — transport succeeded or was accepted
- `dry_run` — no transport attempted by design
- `not_configured` — adapter exists but no local implementation was wired
- `timeout` — implementation timed out
- `error` — implementation failed

The receipt wrapper treats non-zero adapter exit as transport failure but can still emit a blocked receipt thread when configured to fail open.

## Layering rule

Keep these responsibilities separate:

### Receipt wrapper
- deterministic `receipt_id`
- sender-side receipt seed
- post-send thread verification
- fail-open behavior

### Sessions-send adapter
- target resolution contract
- local transport invocation
- normalized result shape

### Underlying implementation
- actual interaction with OpenClaw session transport on that machine
- any machine-specific auth, CLI, RPC, or bridge behavior

## Recommended next local implementation

For this deployment, the next useful step is a machine-local implementation that maps this adapter contract onto the actual OpenClaw `sessions_send` path used here.

That implementation should stay below the adapter boundary so the wrapper and Stack docs remain stable even if the transport mechanism changes later.
