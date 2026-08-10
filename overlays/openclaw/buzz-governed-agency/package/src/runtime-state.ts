import { closeSync, constants, mkdirSync, openSync, rmSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

export interface GovernedAdapterRuntimePaths {
  root: string;
  queue: string;
  operator_control: string;
  telemetry: string;
  lock: string;
}

function boundedAbsoluteDirectory(value: string): string {
  if (!value || value.length > 4_096 || !isAbsolute(value)) {
    throw new Error("Runtime state requires a bounded absolute directory.");
  }
  const normalized = resolve(value);
  if (normalized === "/" || normalized.split("/").filter(Boolean).length < 3) {
    throw new Error("Runtime state refuses a broad filesystem target.");
  }
  return normalized;
}

export function governedAdapterRuntimePaths(directory: string): GovernedAdapterRuntimePaths {
  const root = boundedAbsoluteDirectory(directory);
  return {
    root,
    queue: join(root, "root-dispatch.json"),
    operator_control: join(root, "operator-control.json"),
    telemetry: join(root, "operational-telemetry.json"),
    lock: join(root, "supervisor.lock"),
  };
}

export class SingleSupervisorRuntimeLease {
  readonly paths: GovernedAdapterRuntimePaths;
  #descriptor: number | null = null;

  constructor(directory: string) {
    this.paths = governedAdapterRuntimePaths(directory);
  }

  acquire(identity: string, acquiredAt = new Date().toISOString()): void {
    if (this.#descriptor !== null) throw new Error("Runtime lease is already held by this process.");
    if (!identity || identity.length > 128 || !Number.isFinite(Date.parse(acquiredAt))) {
      throw new Error("A bounded supervisor identity and timestamp are required.");
    }
    mkdirSync(this.paths.root, { recursive: true, mode: 0o700 });
    const mode = statSync(this.paths.root).mode & 0o777;
    if (mode !== 0o700) throw new Error("Runtime state directory must have mode 0700.");
    try {
      this.#descriptor = openSync(
        this.paths.lock,
        constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
        0o600,
      );
      writeFileSync(this.#descriptor, `${JSON.stringify({ identity, acquired_at: acquiredAt })}\n`, "utf8");
    } catch (error) {
      this.#descriptor = null;
      throw new Error("Another governed-adapter supervisor already holds the runtime lease.", { cause: error });
    }
  }

  release(): void {
    if (this.#descriptor === null) return;
    closeSync(this.#descriptor);
    this.#descriptor = null;
    rmSync(this.paths.lock, { force: true });
  }
}
