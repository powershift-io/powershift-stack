# Install, upgrade, removal, and rollback

## Clean installation

1. Install Node 22 and pnpm.
2. Clone the Stack and enter `package/`.
3. Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, and `pnpm test`.
4. Create a dedicated absolute runtime directory with `scripts/install-runtime.sh PATH`.
5. Supply deployment-owned bindings and injected port implementations.
6. Start in supervised, non-consequential mode and verify canonical transport readback.

The installer creates only an empty mode-`0700` directory and `.powershift-governed-adapter` marker. It does not install a service, edit OpenClaw configuration, create sessions, or write credentials.

## Upgrade

Pause intake, export all durable state, record the current release and protocol manifest, run the candidate conformance suite, and verify storage compatibility. Protocol `0.1` has no automatic storage migration. If schemas differ, use a separately reviewed migration with before/after evidence.

## Rollback

Stop the candidate, preserve its state separately, restore the prior package and matching state snapshot, acquire the lease, reconcile incomplete work, and resume under supervision. Never point an older release at newer state unless compatibility is explicitly documented and tested.

## Removal

Run `scripts/remove-runtime.sh PATH`. It removes only the marker and an otherwise empty exact directory. It refuses broad paths, a held supervisor lock, or any operational state. Export and deliberately archive or dispose of state outside this helper.

The clean proof harness copies the package to a temporary directory, performs a frozen install, typecheck, build, full conformance suite, runtime installation, and clean removal without touching a deployment.
