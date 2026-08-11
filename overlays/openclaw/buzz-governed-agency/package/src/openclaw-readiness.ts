export type OpenClawReadinessStatus =
  | "ready"
  | "gateway_unavailable"
  | "binary_unavailable"
  | "invalid_response";

export interface OpenClawHealthObservation {
  binary_path: string;
  gateway_port: number;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  spawn_error_code?: string;
}

export interface OpenClawReadinessResult {
  status: OpenClawReadinessStatus;
  binary_installed: boolean;
  gateway_reachable: boolean;
  acp_route_ready: boolean;
  gateway_port: number;
  health_duration_ms: number | null;
  failure_type: string | null;
  agent_launch_attempted: false;
  session_created: false;
}

interface GatewayHealthPayload {
  ok?: unknown;
  durationMs?: unknown;
  error?: {
    type?: unknown;
  };
}

function baseResult(
  observation: OpenClawHealthObservation,
): Pick<
  OpenClawReadinessResult,
  "gateway_port" | "agent_launch_attempted" | "session_created"
> {
  return {
    gateway_port: observation.gateway_port,
    agent_launch_attempted: false,
    session_created: false,
  };
}

/**
 * Classify the read-only result of `openclaw gateway health --json`.
 *
 * This evaluator is deliberately fail-closed. Only a zero exit code paired
 * with `{ "ok": true }` establishes ACP-route readiness. Binary discovery by
 * itself never does.
 */
export function classifyOpenClawGatewayHealth(
  observation: OpenClawHealthObservation,
): OpenClawReadinessResult {
  if (observation.spawn_error_code === "ENOENT") {
    return {
      ...baseResult(observation),
      status: "binary_unavailable",
      binary_installed: false,
      gateway_reachable: false,
      acp_route_ready: false,
      health_duration_ms: null,
      failure_type: "binary_not_found",
    };
  }

  let payload: GatewayHealthPayload;
  try {
    payload = JSON.parse(observation.stdout) as GatewayHealthPayload;
  } catch {
    return {
      ...baseResult(observation),
      status: "invalid_response",
      binary_installed: true,
      gateway_reachable: false,
      acp_route_ready: false,
      health_duration_ms: null,
      failure_type: "invalid_health_json",
    };
  }

  if (observation.exit_code === 0 && payload.ok === true) {
    return {
      ...baseResult(observation),
      status: "ready",
      binary_installed: true,
      gateway_reachable: true,
      acp_route_ready: true,
      health_duration_ms:
        typeof payload.durationMs === "number" ? payload.durationMs : null,
      failure_type: null,
    };
  }

  if (payload.ok === false) {
    return {
      ...baseResult(observation),
      status: "gateway_unavailable",
      binary_installed: true,
      gateway_reachable: false,
      acp_route_ready: false,
      health_duration_ms: null,
      failure_type:
        typeof payload.error?.type === "string"
          ? payload.error.type
          : "gateway_health_failed",
    };
  }

  return {
    ...baseResult(observation),
    status: "invalid_response",
    binary_installed: true,
    gateway_reachable: false,
    acp_route_ready: false,
    health_duration_ms: null,
    failure_type: "inconsistent_health_response",
  };
}
