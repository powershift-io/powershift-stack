# Governed Collaboration Adapter for Buzz and OpenClaw

This overlay is a public-safe reference governance membrane between a signed collaboration transport and sovereign OpenClaw Minds.

It binds transport identities to canonical actors, evaluates explicit authority, projects request-scoped roles, releases only authorized context, dispatches to an exact existing OpenClaw session, and returns verifiable receipts. Buzz remains the interaction transport. OpenClaw remains the Mind, memory, and session runtime. The adapter owns neither identity nor organizational authority; it enforces the boundary between them.

## Release candidate scope

Version `0.1.0` implements protocol `0.1` as a dependency-free TypeScript core with injected transport, storage, signing, context, and logging ports. The supported operational profile is deliberately bounded:

- one supervised adapter process
- one local filesystem state directory per deployment, mode `0700`
- atomic, mode-`0600` JSON state for dispatch, operator control, and telemetry
- an exclusive supervisor lease; multi-process and network-filesystem operation are unsupported
- pre-existing OpenClaw sessions only; no session creation or reset
- consequential execution disabled unless a separate authority layer explicitly enables it

This is ready for review and supervised deployment. It is not a claim of unattended, horizontally scaled production readiness.

## Package contents

- `package/src/` — typed governance core and injected ports
- `package/test/` — conformance, negative-boundary, lifecycle, restart, and soak tests
- `docs/PROTOCOL.md` — compatibility and versioning contract
- `docs/OPERATIONS.md` — queue, storage, lifecycle, and recovery model
- `docs/SECURITY-AND-PUBLIC-SAFETY.md` — threat boundary and extraction review
- `docs/INSTALL-UPGRADE-ROLLBACK.md` — clean installation, removal, upgrade, and rollback
- `docs/WHAT-WE-BUILT.md` — constituent-facing field note for stakeholders, communities, and experimenters
- `scripts/` — refusal-safe runtime-directory helpers and clean proof harness
- `examples/` — deployment-neutral configuration shape

## Verify

Requires Node 22 and pnpm.

```bash
cd overlays/openclaw/buzz-governed-agency/package
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

For a clean-room package and runtime-directory proof:

```bash
./overlays/openclaw/buzz-governed-agency/scripts/prove-clean-install-removal.sh
```

## Governance boundary

Adopting this overlay does not grant a Mind authority, make channel membership authoritative, or make a transport an identity system. Deployers must supply their own actor registry, role bindings, authority source, session bindings, context broker, signing custody, operational telemetry, and human supervision.

The implementation is a sanitized extraction of a field-tested PowerShift® Intelligence integration. Deployment identities, session identifiers, endpoints, credentials, tenant policy, and PSI-specific proof harnesses are intentionally absent.
