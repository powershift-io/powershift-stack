import {
  classifyOpenClawGatewayHealth,
  type OpenClawHealthObservation,
} from "../src/index.js";

type Test = { name: string; run: () => void };
const tests: Test[] = [];

function test(name: string, run: Test["run"]): void {
  tests.push({ name, run });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\nexpected: ${String(expected)}\nactual: ${String(actual)}`,
    );
  }
}

function observation(
  overrides: Partial<OpenClawHealthObservation> = {},
): OpenClawHealthObservation {
  return {
    binary_path: "/opt/homebrew/bin/openclaw",
    gateway_port: 18789,
    exit_code: 0,
    stdout: JSON.stringify({ ok: true, durationMs: 17 }),
    stderr: "",
    ...overrides,
  };
}

test("marks a successful Gateway health RPC as ACP-route ready", () => {
  const result = classifyOpenClawGatewayHealth(observation());
  equal(result.status, "ready", "health success must be ready");
  equal(result.binary_installed, true, "binary must be installed");
  equal(result.gateway_reachable, true, "Gateway must be reachable");
  equal(result.acp_route_ready, true, "ACP route must be ready");
  equal(result.health_duration_ms, 17, "duration must be retained");
  equal(result.agent_launch_attempted, false, "preflight must not launch ACP");
  equal(result.session_created, false, "preflight must not create a session");
});

test("distinguishes an installed binary from an unavailable Gateway", () => {
  const result = classifyOpenClawGatewayHealth(
    observation({
      gateway_port: 9,
      exit_code: 1,
      stdout: JSON.stringify({
        ok: false,
        error: { type: "gateway_transport_error" },
      }),
    }),
  );
  equal(result.status, "gateway_unavailable", "closed Gateway must fail");
  equal(result.binary_installed, true, "binary remains installed");
  equal(result.gateway_reachable, false, "Gateway must be unreachable");
  equal(result.acp_route_ready, false, "ACP route must fail closed");
  equal(
    result.failure_type,
    "gateway_transport_error",
    "transport failure must be classified",
  );
});

test("reports a missing OpenClaw executable separately", () => {
  const result = classifyOpenClawGatewayHealth(
    observation({
      exit_code: null,
      stdout: "",
      spawn_error_code: "ENOENT",
    }),
  );
  equal(result.status, "binary_unavailable", "missing binary must be explicit");
  equal(result.binary_installed, false, "missing binary must not be installed");
  equal(result.acp_route_ready, false, "missing binary must fail closed");
});

test("fails closed on malformed health output", () => {
  const result = classifyOpenClawGatewayHealth(
    observation({ exit_code: 1, stdout: "not-json" }),
  );
  equal(result.status, "invalid_response", "malformed output must be invalid");
  equal(result.acp_route_ready, false, "malformed output must fail closed");
});

test("rejects a contradictory zero-exit health payload", () => {
  const result = classifyOpenClawGatewayHealth(
    observation({ stdout: JSON.stringify({ ok: "yes" }) }),
  );
  equal(
    result.status,
    "invalid_response",
    "contradictory response must be invalid",
  );
  assert(!result.acp_route_ready, "contradictory response must fail closed");
});

let passed = 0;
for (const entry of tests) {
  entry.run();
  passed += 1;
}

process.stdout.write(`openclaw-readiness: ${passed}/${tests.length} passed\n`);
