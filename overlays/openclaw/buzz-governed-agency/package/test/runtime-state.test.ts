import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SingleSupervisorRuntimeLease, governedAdapterRuntimePaths } from "../src/runtime-state.js";

const temporary = mkdtempSync(join(tmpdir(), "powershift-governed-adapter-"));
const runtime = join(temporary, "organization", "adapter-state");
try {
  const paths = governedAdapterRuntimePaths(runtime);
  assert.equal(paths.queue, join(runtime, "root-dispatch.json"));
  assert.throws(() => governedAdapterRuntimePaths("/"), /broad filesystem target/);
  assert.throws(() => governedAdapterRuntimePaths("relative"), /bounded absolute directory/);

  const first = new SingleSupervisorRuntimeLease(runtime);
  const second = new SingleSupervisorRuntimeLease(runtime);
  first.acquire("supervisor-a", "2026-08-10T10:00:00.000Z");
  assert.equal(statSync(runtime).mode & 0o777, 0o700);
  assert.equal(statSync(paths.lock).mode & 0o777, 0o600);
  assert.throws(() => second.acquire("supervisor-b"), /already holds/);
  first.release();
  second.acquire("supervisor-b", "2026-08-10T10:01:00.000Z");
  second.release();
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
process.stdout.write("runtime-state: 1/1 passed\n");
