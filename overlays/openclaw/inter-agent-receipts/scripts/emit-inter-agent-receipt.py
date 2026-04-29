#!/usr/bin/env python3
"""Emit structured inter-agent handoff receipts into shared markdown surfaces.

Subsystem surfaces:
- index ledger: one shared markdown file for visibility
- thread files: one markdown file per receipt id for lifecycle history

Usage:
  python3 scripts/emit-inter-agent-receipt.py --input receipt.json
  cat receipt.json | python3 scripts/emit-inter-agent-receipt.py

Payload mode 1: receipt snapshot (default)
  Required fields:
    thread_title, sent_at, sender_agent, sender_session,
    receiver_agent, receiver_session, via, subject,
    requested_action, transport_status, received_status, action_status

Payload mode 2: event append
  Set "mode": "event"
  Required fields:
    receipt_id, thread_title, emitted_at, phase,
    actor_agent, actor_session, summary

This is a clarity surface, not a raw chain-of-thought dump.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

DEFAULT_SHARED_CONTEXT = Path(os.environ.get("POWERSHIFT_SHARED_CONTEXT", str(Path.home() / "shared-context")))
DEFAULT_INDEX_PATH = str(Path(os.environ.get("POWERSHIFT_RECEIPT_INDEX", str(DEFAULT_SHARED_CONTEXT / "constellation" / "inter-agent-receipts.md"))))
DEFAULT_THREAD_DIR = str(Path(os.environ.get("POWERSHIFT_RECEIPT_THREAD_DIR", str(DEFAULT_SHARED_CONTEXT / "constellation" / "inter-agent-receipt-threads"))))

INDEX_HEADER = """# Inter-Agent Handoff Receipts

A shared historical ledger for inter-agent communications that need end-to-end visibility.

This is a clarity surface, not a raw chain-of-thought dump.
It records structured intent, transport, receipt, action, and evidence.

## Subsystem surfaces

- `inter-agent-receipts.md` → shared index ledger
- `inter-agent-receipt-threads/<receipt-id>.md` → one lifecycle thread per handoff

## Emit object shapes

### Receipt snapshot

```json
{
  "receipt_id": "optional-string",
  "thread_title": "required",
  "sent_at": "required",
  "received_at": "optional",
  "acted_at": "optional",
  "sender_agent": "required",
  "sender_session": "required",
  "receiver_agent": "required",
  "receiver_session": "required",
  "via": "required",
  "subject": "required",
  "requested_action": "required",
  "transport_status": "required",
  "received_status": "required",
  "action_status": "required",
  "rationale_summary": "optional",
  "receiver_ack": "optional",
  "artifacts_changed": ["optional", "array"],
  "evidence": ["optional", "array"],
  "completion_note": "optional",
  "tags": ["optional", "array"]
}
```

### Event append

```json
{
  "mode": "event",
  "receipt_id": "required",
  "thread_title": "required",
  "emitted_at": "required",
  "phase": "sent|received|acted|verified|closed|other",
  "actor_agent": "required",
  "actor_session": "required",
  "summary": "required",
  "status": "optional",
  "artifacts_changed": ["optional", "array"],
  "evidence": ["optional", "array"],
  "next_step": "optional"
}
```

---
"""

RECEIPT_REQUIRED_FIELDS = [
    "thread_title",
    "sent_at",
    "sender_agent",
    "sender_session",
    "receiver_agent",
    "receiver_session",
    "via",
    "subject",
    "requested_action",
    "transport_status",
    "received_status",
    "action_status",
]

EVENT_REQUIRED_FIELDS = [
    "receipt_id",
    "thread_title",
    "emitted_at",
    "phase",
    "actor_agent",
    "actor_session",
    "summary",
]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "receipt"


def load_payload(args: argparse.Namespace) -> dict[str, Any]:
    if args.input:
        return json.loads(Path(args.input).read_text())
    raw = sys.stdin.read().strip()
    if not raw:
        raise SystemExit("No JSON input provided. Use --input or pipe JSON via stdin.")
    return json.loads(raw)


def ensure_required(payload: dict[str, Any], required_fields: list[str]) -> None:
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        raise SystemExit(f"Missing required fields: {', '.join(missing)}")


def list_block(items: list[str] | None) -> str:
    if not items:
        return "- none\n"
    return "".join(f"- {item}\n" for item in items)


def value_or_default(value: str | None, default: str = "not recorded") -> str:
    return value if value else default


def get_receipt_id(payload: dict[str, Any]) -> str:
    if payload.get("receipt_id"):
        return str(payload["receipt_id"])
    seed = f"{payload.get('thread_title', 'receipt')}-{payload.get('sent_at', '')}"
    return f"receipt-{slugify(seed)}"


def ensure_index(index_path: Path) -> None:
    index_path.parent.mkdir(parents=True, exist_ok=True)
    if not index_path.exists():
        index_path.write_text(INDEX_HEADER)


def ensure_thread_dir(thread_dir: Path) -> None:
    thread_dir.mkdir(parents=True, exist_ok=True)


def append_index_entry(index_path: Path, payload: dict[str, Any], thread_rel_path: str, receipt_id: str) -> None:
    existing = index_path.read_text() if index_path.exists() else ""
    if receipt_id in existing:
        return

    tags = payload.get("tags") or []
    tag_line = f"- **Tags:** {', '.join(tags)}\n" if tags else ""
    entry = f"""
## {payload['thread_title']}

- **Receipt ID:** `{receipt_id}`
- **Sent:** {payload.get('sent_at', payload.get('emitted_at', 'not recorded'))}
- **Sender:** `{payload.get('sender_agent', payload.get('actor_agent', 'not recorded'))}`
- **Receiver:** `{payload.get('receiver_agent', 'not recorded')}`
- **Subject:** {payload.get('subject', payload.get('summary', 'not recorded'))}
- **Status:** `{payload.get('action_status', payload.get('status', 'open'))}`
- **Thread:** `{thread_rel_path}`
{tag_line}
---
""".lstrip()
    with index_path.open("a") as f:
        f.write(entry)


def render_receipt_thread(payload: dict[str, Any], receipt_id: str) -> str:
    tags = payload.get("tags") or []
    tag_line = f"- **Tags:** {', '.join(tags)}\n" if tags else ""

    parts = [
        f"# {payload['thread_title']}\n\n",
        f"- **Receipt ID:** `{receipt_id}`\n",
        f"- **Sent:** {payload['sent_at']}\n",
        f"- **Received:** {value_or_default(payload.get('received_at'))}\n",
        f"- **Acted:** {value_or_default(payload.get('acted_at'))}\n",
        f"- **Sender:** `{payload['sender_agent']}` via `{payload['sender_session']}`\n",
        f"- **Receiver:** `{payload['receiver_agent']}` via `{payload['receiver_session']}`\n",
        f"- **Transport:** `{payload['via']}`\n",
        f"- **Subject:** {payload['subject']}\n",
        f"- **Requested action:** {payload['requested_action']}\n",
        f"- **Transport status:** `{payload['transport_status']}`\n",
        f"- **Received status:** `{payload['received_status']}`\n",
        f"- **Action status:** `{payload['action_status']}`\n",
    ]
    if tag_line:
        parts.append(tag_line)
    parts.append("\n## Snapshot\n\n")
    parts.append(f"### Rationale summary\n{payload.get('rationale_summary', 'No rationale summary recorded.')}\n\n")
    parts.append(f"### Receiver acknowledgment\n{payload.get('receiver_ack', 'No acknowledgment recorded.')}\n\n")
    parts.append("### Artifacts changed\n")
    parts.append(list_block(payload.get('artifacts_changed')))
    parts.append("\n### Evidence\n")
    parts.append(list_block(payload.get('evidence')))
    parts.append(f"\n### Completion note\n{payload.get('completion_note', 'No completion note recorded.')}\n\n")
    parts.append("## Lifecycle events\n\n")

    parts.append(render_event_block({
        "emitted_at": payload["sent_at"],
        "phase": "sent",
        "actor_agent": payload["sender_agent"],
        "actor_session": payload["sender_session"],
        "status": payload["transport_status"],
        "summary": f"Sent handoff: {payload['subject']}",
        "evidence": [f"Transport via {payload['via']}", f"Requested action: {payload['requested_action']}"]
    }))

    if payload.get("received_at"):
        parts.append(render_event_block({
            "emitted_at": payload["received_at"],
            "phase": "received",
            "actor_agent": payload["receiver_agent"],
            "actor_session": payload["receiver_session"],
            "status": payload["received_status"],
            "summary": payload.get("receiver_ack") or "Receipt acknowledged.",
        }))

    if payload.get("acted_at") or payload.get("completion_note") or payload.get("artifacts_changed"):
        parts.append(render_event_block({
            "emitted_at": value_or_default(payload.get("acted_at"), payload.get("received_at") or payload["sent_at"]),
            "phase": "acted",
            "actor_agent": payload["receiver_agent"],
            "actor_session": payload["receiver_session"],
            "status": payload["action_status"],
            "summary": payload.get("completion_note") or "Action completed.",
            "artifacts_changed": payload.get("artifacts_changed"),
            "evidence": payload.get("evidence"),
        }))

    return "".join(parts)


def render_event_block(payload: dict[str, Any]) -> str:
    status_line = f"- **Status:** `{payload['status']}`\n" if payload.get("status") else ""
    next_step_line = f"### Next step\n{payload['next_step']}\n\n" if payload.get("next_step") else ""
    return f"""
### {payload['phase']} — {payload['emitted_at']}

- **Actor:** `{payload['actor_agent']}` via `{payload['actor_session']}`
{status_line}
### Summary
{payload['summary']}

### Artifacts changed
{list_block(payload.get('artifacts_changed'))}
### Evidence
{list_block(payload.get('evidence'))}
{next_step_line}---

""".lstrip()


def append_event(thread_path: Path, payload: dict[str, Any]) -> None:
    if not thread_path.exists():
        bootstrap = [
            f"# {payload['thread_title']}\n\n",
            f"- **Receipt ID:** `{payload['receipt_id']}`\n",
            "\n## Lifecycle events\n\n",
        ]
        thread_path.write_text("".join(bootstrap))

    with thread_path.open("a") as f:
        f.write(render_event_block(payload))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Path to JSON emit object")
    args = parser.parse_args()

    payload = load_payload(args)
    mode = payload.get("mode", "receipt")

    index_path = Path(payload.get("index_path") or DEFAULT_INDEX_PATH)
    thread_dir = Path(payload.get("thread_dir") or DEFAULT_THREAD_DIR)
    ensure_index(index_path)
    ensure_thread_dir(thread_dir)

    if mode == "event":
        ensure_required(payload, EVENT_REQUIRED_FIELDS)
        receipt_id = get_receipt_id(payload)
        payload["receipt_id"] = receipt_id
        thread_path = thread_dir / f"{receipt_id}.md"
        append_event(thread_path, payload)
        append_index_entry(index_path, payload, f"inter-agent-receipt-threads/{thread_path.name}", receipt_id)
        print(json.dumps({"index_path": str(index_path), "thread_path": str(thread_path), "receipt_id": receipt_id}))
        return

    ensure_required(payload, RECEIPT_REQUIRED_FIELDS)
    receipt_id = get_receipt_id(payload)
    thread_path = thread_dir / f"{receipt_id}.md"
    if not thread_path.exists():
        thread_path.write_text(render_receipt_thread(payload, receipt_id))
    append_index_entry(index_path, payload, f"inter-agent-receipt-threads/{thread_path.name}", receipt_id)
    print(json.dumps({"index_path": str(index_path), "thread_path": str(thread_path), "receipt_id": receipt_id}))


if __name__ == "__main__":
    main()
