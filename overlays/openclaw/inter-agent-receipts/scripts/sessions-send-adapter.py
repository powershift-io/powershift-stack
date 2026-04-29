#!/usr/bin/env python3
"""Canonical CLI contract for a local sessions_send adapter.

This script gives the receipt wrapper a stable transport surface without coupling
it to any single OpenClaw implementation path.

Normal usage:
  python3 sessions-send-adapter.py --session agent:pd:main --message-file msg.txt

Implementation wiring:
  export OPENCLAW_SESSIONS_SEND_IMPL_JSON='["python3","/path/to/impl.py","--session","{session}","--message-file","{message_file}"]'

The implementation command may also use:
  {label}
  {agent_id}
  {timeout_seconds}
  {message}
  {message_file}

The implementation is expected to return JSON when possible, but plain text is tolerated.
This adapter normalizes the result into a consistent JSON contract.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


def preview(value: str | None, limit: int = 500) -> str | None:
    if not value:
        return None
    compact = value.strip()
    if len(compact) <= limit:
        return compact
    return compact[: limit - 3] + "..."


def load_impl_template(raw: str | None) -> list[str] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"OPENCLAW_SESSIONS_SEND_IMPL_JSON must be valid JSON: {exc}")
    if not isinstance(parsed, list) or not all(isinstance(item, str) for item in parsed):
        raise SystemExit("OPENCLAW_SESSIONS_SEND_IMPL_JSON must be a JSON array of strings.")
    return parsed


def classify(stdout: str, stderr: str, returncode: int) -> tuple[str, dict[str, Any] | None]:
    parsed: dict[str, Any] | None = None
    text = stdout.strip()
    if text:
        try:
            maybe = json.loads(text)
            if isinstance(maybe, dict):
                parsed = maybe
        except json.JSONDecodeError:
            parsed = None

    if returncode != 0:
        if parsed and isinstance(parsed.get("status"), str):
            return parsed["status"], parsed
        return "error", parsed

    if parsed:
        for key in ("status", "result", "outcome"):
            value = parsed.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip(), parsed
    return "ok", parsed


def main() -> None:
    parser = argparse.ArgumentParser()
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--session")
    target.add_argument("--label")
    parser.add_argument("--agent-id")
    message_group = parser.add_mutually_exclusive_group(required=True)
    message_group.add_argument("--message")
    message_group.add_argument("--message-file")
    parser.add_argument("--timeout-seconds", type=float)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    message_text = args.message
    temp_message_file: Path | None = None
    if args.message_file:
        message_file = Path(args.message_file)
        message_text = message_file.read_text()
    else:
        handle = tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False)
        handle.write(args.message)
        handle.close()
        temp_message_file = Path(handle.name)
        message_file = temp_message_file

    try:
        if args.dry_run:
            print(json.dumps({
                "status": "dry_run",
                "delivery": "not_attempted",
                "session": args.session,
                "label": args.label,
                "agentId": args.agent_id,
                "messageChars": len(message_text or ""),
            }, indent=2))
            return

        template = load_impl_template(__import__("os").environ.get("OPENCLAW_SESSIONS_SEND_IMPL_JSON"))
        if not template:
            print(json.dumps({
                "status": "not_configured",
                "delivery": "not_attempted",
                "session": args.session,
                "label": args.label,
                "agentId": args.agent_id,
                "messageChars": len(message_text or ""),
                "error": "Set OPENCLAW_SESSIONS_SEND_IMPL_JSON to a JSON argv template for your local sessions_send implementation.",
            }, indent=2))
            raise SystemExit(78)

        substitutions = {
            "session": args.session or "",
            "label": args.label or "",
            "agent_id": args.agent_id or "",
            "timeout_seconds": "" if args.timeout_seconds is None else str(args.timeout_seconds),
            "message": message_text or "",
            "message_file": str(message_file),
        }
        argv = [part.format(**substitutions) for part in template]
        completed = subprocess.run(argv, capture_output=True, text=True)
        status, parsed = classify(completed.stdout, completed.stderr, completed.returncode)

        result = {
            "status": status,
            "delivery": (parsed.get("delivery") if parsed else None) or ("accepted" if completed.returncode == 0 else "failed"),
            "session": args.session,
            "label": args.label,
            "agentId": args.agent_id,
            "messageChars": len(message_text or ""),
            "implArgv": argv,
            "stdoutPreview": preview(completed.stdout),
            "stderrPreview": preview(completed.stderr),
        }
        if parsed:
            result["parsed"] = parsed
        print(json.dumps(result, indent=2))

        if completed.returncode != 0:
            raise SystemExit(completed.returncode)
    finally:
        if temp_message_file:
            temp_message_file.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
