export const GOVERNED_ADAPTER_RELEASE = "0.1.0" as const;
export const GOVERNED_ADAPTER_PROTOCOL = "0.1" as const;

export const GOVERNED_ADAPTER_CAPABILITIES = [
  "signed-intake",
  "canonical-actor-binding",
  "authority-packets",
  "role-projection",
  "authorized-context",
  "exact-existing-openclaw-session",
  "one-root-one-turn",
  "signed-receipt-return",
  "operator-control",
  "portable-custody",
] as const;

export type GovernedAdapterCapability = typeof GOVERNED_ADAPTER_CAPABILITIES[number];

export interface GovernedAdapterProtocolManifest {
  release: typeof GOVERNED_ADAPTER_RELEASE;
  protocol: typeof GOVERNED_ADAPTER_PROTOCOL;
  compatible_protocols: readonly [typeof GOVERNED_ADAPTER_PROTOCOL];
  capabilities: readonly GovernedAdapterCapability[];
  execution_default: "not_executed";
  authority_transfer_default: "none";
  session_policy: "require_existing_no_reset";
}

export function governedAdapterProtocolManifest(): GovernedAdapterProtocolManifest {
  return {
    release: GOVERNED_ADAPTER_RELEASE,
    protocol: GOVERNED_ADAPTER_PROTOCOL,
    compatible_protocols: [GOVERNED_ADAPTER_PROTOCOL],
    capabilities: GOVERNED_ADAPTER_CAPABILITIES,
    execution_default: "not_executed",
    authority_transfer_default: "none",
    session_policy: "require_existing_no_reset",
  };
}

export function assertCompatibleProtocol(version: string): asserts version is typeof GOVERNED_ADAPTER_PROTOCOL {
  if (version !== GOVERNED_ADAPTER_PROTOCOL) {
    throw new Error(`Unsupported governed-adapter protocol: ${version}`);
  }
}
