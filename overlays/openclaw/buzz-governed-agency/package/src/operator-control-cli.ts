#!/usr/bin/env node
import { OperatorControlPlane } from "./operator-control.js";
import type { OperatorControlAction } from "./operator-control-types.js";
import type { Hex } from "./types.js";

const args = process.argv.slice(2);
const value = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const command = args[0];
const path = value("--state");

if (!path || !["inspect", "register", "pause", "resume", "cancel", "retry", "quarantine", "dead-letter", "reconcile"].includes(command ?? "")) {
  throw new Error("usage: operator-control <inspect|register|pause|resume|cancel|retry|quarantine|dead-letter|reconcile> --state PATH [--source HEX --binding ID --reason CODE --revision N --proof REF]");
}

const control = new OperatorControlPlane(path);
if (command === "inspect") {
  process.stdout.write(`${JSON.stringify(control.inspect(), null, 2)}\n`);
  process.exit(0);
}

const source = value("--source") as Hex | undefined;
const now = value("--at") ?? new Date().toISOString();
if (!source) throw new Error("--source is required");

if (command === "register") {
  const binding = value("--binding");
  if (!binding) throw new Error("--binding is required");
  process.stdout.write(`${JSON.stringify(control.register(source, binding, now))}\n`);
  process.exit(0);
}

const actionMap: Record<string, Exclude<OperatorControlAction, "register" | "mark_retryable" | "auto_retry">> = {
  pause: "pause", resume: "resume", cancel: "cancel", retry: "retry",
  quarantine: "quarantine", "dead-letter": "dead_letter", reconcile: "reconcile",
};
const reason = value("--reason");
const revision = Number(value("--revision"));
if (!reason || !Number.isInteger(revision)) throw new Error("--reason and integer --revision are required");
const proof = value("--proof");
const result = control.transition(source, actionMap[command!]!, reason, now, revision, proof);
process.stdout.write(`${JSON.stringify(result)}\n`);
if (result.status === "rejected") process.exitCode = 2;
