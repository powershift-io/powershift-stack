# Operations

## Supported state profile

The release candidate supports a single supervisor with local durable state. `governedAdapterRuntimePaths()` assigns three stores and one exclusive lease beneath an absolute, bounded runtime directory:

- `root-dispatch.json` — idempotent dispatch queue and completion state
- `operator-control.json` — revision-controlled lifecycle decisions
- `operational-telemetry.json` — durable operator-visible evidence
- `supervisor.lock` — exclusive process lease

The directory must be mode `0700`; files and lock are created mode `0600`. Stores use write-then-rename persistence. Use a locally mounted filesystem whose rename and exclusive-create semantics are reliable. Do not share the directory across hosts or processes.

## Lifecycle controls

The included `powershift-operator-control` CLI supports:

- `inspect` and `register`
- `pause` and `resume`
- `cancel`
- `retry`
- `quarantine`
- `dead-letter`
- `reconcile`

Every mutation requires the source event, a reason code, and the expected revision. Stale revisions are rejected. Reconciliation requires an evidence reference. Queue transitions, delayed retry, expiry, restart recovery, publication custody, and operator actions are covered by the conformance suite.

Example:

```bash
powershift-operator-control inspect --state /srv/powershift-adapter/operator-control.json
powershift-operator-control pause --state /srv/powershift-adapter/operator-control.json \
  --source SOURCE_EVENT_HEX --reason operator_review --revision 2
```

## Startup and shutdown

1. Validate configuration and protocol compatibility.
2. Acquire `SingleSupervisorRuntimeLease` before opening stores or accepting intake.
3. Reconcile incomplete dispatch and publication records.
4. Start intake only after the control plane and telemetry sink are ready.
5. Stop intake, drain or pause work, flush evidence, then release the lease.

A lock that remains after an unclean exit requires human verification that no supervisor is active before removal. The removal helper refuses to proceed while a lock or durable state exists.

## Deployment responsibilities

The deployer supplies monitoring, backup/restore, retention, alert routing, signing custody, and service management. Export all three JSON stores together while intake is paused. Restore into an empty directory with the same release, verify file modes and protocol version, acquire the lease, reconcile, then resume.
