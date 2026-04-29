#!/usr/bin/env python3
"""Additive wrapper for inter-agent handoffs with receipt emission.

This script is intentionally userland and fail-open with respect to transport.
It does not modify OpenClaw core behavior. It shells out to a caller-provided
transport command, emits a deterministic receipt snapshot, and verifies that the
thread file exists afterward.

Input JSON fields:
  sender_agent           required
  sender_session         required
  receiver_agent         required
  receiver_session       required
  subject                required
  requested_action       required
  message                required

Optional:
  thread_title
  sent_at
  rationale_summary
  tags                   array
  transport_argv         array of args with placeholders
  idempotency_key
  receipt_id
  index_path
  thread_dir
  receiver_ack
  emit_on_transport_error  bool, default true
  dry_run                  bool, default false

Supported placeholders inside transport_argv:
  {sender_agent}
  {sender_session}
  {receiver_agent}
  {receiver_session}
  {subject}
  {requested_action}
  {message}
  {message_file}
  {receipt_id}
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

DEFAULT_TAGS = ["inter-agent", "clarity", "handoff-send"]
REQUIRED_FIELDS = [
    "sender_agent",
    "sender_session",
    "receiver_agent",
    "receiver_session",
    "subject",
    "requested_action",
    "message",
]


def utc_now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_payload(args: argparse.Namespace) -> dict[str, Any]:
    if args.input:
        return json.loads(Path(args.input).read_text())
    raw = sys.stdin.read().strip()
    if not raw:
        raise SystemExit("No JSON input provided. Use --input or pipe JSON via stdin.")
    return json.loads(raw)


def ensure_required(payload: dict[str, Any]) -> None:
    missing = [field for field in REQUIRED_FIELDS if not payload.get(field)]
    if missing:
        raise SystemExit(f"Missing required fields: {', '.join(missing)}")


def slugify(value: str) -> str:
    chars = []
    last_dash = False
    for ch in value.lower().strip():
        if ch.isalnum():
            chars.append(ch)
            last_dash = False
        elif not last_dash:
            chars.append("-")
            last_dash = True
    return "".join(chars).strip("-") or "receipt"


def build_receipt_id(payload: dict[str, Any]) -> str:
    if payload.get("receipt_id"):
        return str(payload["receipt_id"])
    stable_seed = "|".join([
        str(payload.get("idempotency_key") or ""),
        str(payload["sender_session"]),
        str(payload["receiver_session"]),
        str(payload["subject"]),
        str(payload["requested_action"]),
        str(payload["message"]),
    ])
    digest = hashlib.sha1(stable_seed.encode("utf-8")).hexdigest()[:10]
    subject_slug = slugify(str(payload["subject"]))[:48]
    return f"receipt-{subject_slug}-{digest}"


def build_thread_title(payload: dict[str, Any]) -> str:
    return str(payload.get("thread_title") or payload["subject"])


def build_transport_argv(payload: dict[str, Any], receipt_id: str, message_file: Path) -> list[str]:
    raw = payload.get("transport_argv")
    if not raw:
        return []
    if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
        raise SystemExit("transport_argv must be an array of strings.")

    substitutions = {
        "sender_agent": str(payload["sender_agent"]),
        "sender_session": str(payload["sender_session"]),
        "receiver_agent": str(payload["receiver_agent"]),
        "receiver_session": str(payload["receiver_session"]),
        "subject": str(payload["subject"]),
        "requested_action": str(payload["requested_action"]),
        "message": str(payload["message"]),
        "message_file": str(message_file),
        "receipt_id": receipt_id,
    }
    return [part.format(**substitutions) for part in raw]


def preview(value: str | None, limit: int = 500) -> str | None:
    if not value:
        return None
    compact = value.strip()
    if len(compact) <= limit:
        return compact
    return compact[: limit - 3] + "..."


def classify_transport(stdout: str, stderr: str, returncode: int) -> tuple[str, dict[str, Any] | None]:
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
        return (parsed.get("status") if parsed and parsed.get("status") else "transport_error", parsed)

    if parsed:
        status = parsed.get("status") or parsed.get("result") or parsed.get("outcome")
        if isinstance(status, str) and status.strip():
            return (status.strip(), parsed)
    return ("ok", parsed)


def run_transport(argv: list[str], dry_run: bool) -> dict[str, Any]:
    if dry_run or not argv:
        return {
            "status": "dry_run" if dry_run else "skipped",
            "returncode": 0,
            "stdout": "",
            "stderr": "",
            "parsed": None,
            "argv": argv,
        }

    completed = subprocess.run(argv, capture_output=True, text=True)
    status, parsed = classify_transport(completed.stdout, completed.stderr, completed.returncode)
    return {
        "status": status,
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "parsed": parsed,
        "argv": argv,
    }


def emit_receipt(payload: dict[str, Any], emitter_path: Path) -> dict[str, Any]:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
        json.dump(payload, handle, indent=2)
        temp_path = Path(handle.name)
    try:
        completed = subprocess.run(
            [sys.executable, str(emitter_path), "--input", str(temp_path)],
            capture_output=True,
            text=True,
        )
    finally:
        temp_path.unlink(missing_ok=True)

    if completed.returncode != 0:
        raise RuntimeError(preview(completed.stderr) or "receipt emitter failed")

    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"receipt emitter returned non-JSON output: {completed.stdout!r}") from exc


def verify_thread(thread_path: Path, receipt_id: str) -> bool:
    return thread_path.exists() and receipt_id in thread_path.read_text()


def build_receipt_payload(source: dict[str, Any], receipt_id: str, transport: dict[str, Any]) -> dict[str, Any]:
    sent_at = str(source.get("sent_at") or utc_now_iso())
    ok = transport["returncode"] == 0 or transport["status"] in {"dry_run", "skipped"}
    received_status = "pending" if ok else "not delivered"
    action_status = "pending" if ok else "blocked"
    receiver_ack = source.get("receiver_ack") or ("Awaiting receiver acknowledgment." if ok else "Transport did not complete.")
    completion_note = (
        "Transport completed; receipt thread seeded and awaiting receiver-side lifecycle events."
        if ok
        else "Transport failed; receipt thread records the failed handoff attempt for visibility."
    )

    evidence = [
        f"transport argv: {json.dumps(transport['argv'])}" if transport.get("argv") else "transport argv: []",
        f"transport returncode: {transport['returncode']}",
    ]
    stdout_preview = preview(transport.get("stdout"))
    stderr_preview = preview(transport.get("stderr"))
    if stdout_preview:
        evidence.append(f"transport stdout: {stdout_preview}")
    if stderr_preview:
        evidence.append(f"transport stderr: {stderr_preview}")

    tags = []
    for tag in DEFAULT_TAGS + list(source.get("tags") or []):
        if tag not in tags:
            tags.append(tag)

    return {
        "receipt_id": receipt_id,
        "thread_title": build_thread_title(source),
        "sent_at": sent_at,
        "sender_agent": source["sender_agent"],
        "sender_session": source["sender_session"],
        "receiver_agent": source["receiver_agent"],
        "receiver_session": source["receiver_session"],
        "via": "handoff_send",
        "subject": source["subject"],
        "requested_action": source["requested_action"],
        "transport_status": transport["status"],
        "received_status": received_status,
        "action_status": action_status,
        "rationale_summary": source.get("rationale_summary") or "Additive wrapper around transport with deterministic receipt emission and immediate post-send verification.",
        "receiver_ack": receiver_ack,
        "artifacts_changed": source.get("artifacts_changed") or [],
        "evidence": evidence,
        "completion_note": completion_note,
        "tags": tags,
        **({"index_path": source["index_path"]} if source.get("index_path") else {}),
        **({"thread_dir": source["thread_dir"]} if source.get("thread_dir") else {}),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", help="Path to handoff JSON payload")
    args = parser.parse_args()

    payload = load_payload(args)
    ensure_required(payload)

    receipt_id = build_receipt_id(payload)
    dry_run = bool(payload.get("dry_run"))
    emit_on_transport_error = payload.get("emit_on_transport_error", True)

    with tempfile.TemporaryDirectory(prefix="handoff-send-") as temp_dir:
        message_file = Path(temp_dir) / "message.txt"
        message_file.write_text(str(payload["message"]))
        transport_argv = build_transport_argv(payload, receipt_id, message_file)
        transport = run_transport(transport_argv, dry_run=dry_run)

        emitter_path = Path(__file__).with_name("emit-inter-agent-receipt.py")
        emitted: dict[str, Any] | None = None
        emit_error: str | None = None
        verified = False

        if transport["returncode"] == 0 or transport["status"] in {"dry_run", "skipped"} or emit_on_transport_error:
            try:
                receipt_payload = build_receipt_payload(payload, receipt_id, transport)
                emitted = emit_receipt(receipt_payload, emitter_path)
                verified = verify_thread(Path(emitted["thread_path"]), receipt_id)
                if not verified:
                    emit_error = "Receipt emitter returned success but the thread file was not verifiable afterward."
            except Exception as exc:  # fail-open relative to transport
                emit_error = str(exc)

    result = {
        "receipt_id": receipt_id,
        "transport_status": transport["status"],
        "transport_returncode": transport["returncode"],
        "thread_path": emitted.get("thread_path") if emitted else None,
        "index_path": emitted.get("index_path") if emitted else None,
        "receipt_verified": verified,
        "emit_error": emit_error,
        "transport_stdout_preview": preview(transport.get("stdout")),
        "transport_stderr_preview": preview(transport.get("stderr")),
    }
    print(json.dumps(result, indent=2))

    if transport["returncode"] != 0:
        raise SystemExit(transport["returncode"])


if __name__ == "__main__":
    main()
