# OpenClaw Upgrade Discipline for Orchestrators

**Status:** public-safe working guide  
**Companion template:** `templates/openclaw-upgrade-runbook.md`

## Why this matters

For an Orchestrator, OpenClaw is part of the operating control plane. It carries channels, memory, tools, scheduled jobs, agent identity surfaces, and delegation paths. Upgrades deserve more visibility than a successful command line.

A disciplined upgrade process answers four questions:

1. What release is actually available?
2. What state did we preserve before touching the runtime?
3. What evidence proves the runtime moved cleanly?
4. What residue or follow-up remains after the update?

## The operating rhythm

Use one runbook per upgrade. Open it before the update, fill it during the update, and close it after verification.

Recommended private path:

```text
operations/runbooks/openclaw-updates/YYYY-MM-DD-openclaw-<target-version>-runbook.md
```

Keep private runbooks in your operations repo. Publish only generalized templates and redacted lessons.

## Phase 0 — Intake and release classification

Record why the upgrade is being considered.

Classify three surfaces separately:

- **Upstream release evidence:** the public release tag, release notes, and published version.
- **Package/updater evidence:** what the local updater or package manager can actually install.
- **Local runtime evidence:** current CLI version, gateway/app version, service status, and known risks.

Useful classifications:

- no release available;
- release visible upstream, updater pending;
- release available to updater;
- prerelease only;
- local updater/config mismatch.

The goal is clear timing: proceed, defer, wait for propagation, or investigate mismatch.

## Phase 1 — Release assessment

Name why this release matters. Capture likely fixes, likely regressions, and any current operating tensions it might affect.

A useful assessment is short and specific:

- which current issue this release may improve;
- which working surface needs extra watching;
- which conditions must be true before proceeding.

## Phase 2 — Preflight snapshot and backout plan

Before the update, preserve the recovery surfaces that would let you return to a known-good state.

At minimum, capture:

- current version/status output;
- config backup;
- scheduler/task list when relevant;
- service manager state;
- auth/profile backup if applicable and safe;
- current public/control-surface health checks;
- the intended rollback trigger.

Write the backout plan before starting the update. A backout plan written during failure is usually a stress artifact.

## Phase 3 — Update execution

Let the human operator or authorized operations role run the update. Record the command family and final visible result.

Typical command family:

```sh
openclaw update --dry-run --json
openclaw update
```

If the update is ambiguous, hold and diagnose. Avoid stacking unrelated config or auth edits onto an uncertain runtime state.

## Phase 4 — During-update observations

Capture operator-experience anomalies while they are fresh:

- long delays or stalled typing indicators;
- restart/drain window;
- unexpected warning lines;
- routing oddities;
- log residue that needs later classification.

A single scary line is a data point. The proof matrix decides the final status.

## Phase 5 — Post-update proof matrix

Verify at the level the system actually serves.

### Version alignment

- CLI version matches expected target.
- Gateway/app version matches expected target.
- Dry-run after update shows no pending same-version move.

### Service provenance

- Service manager reports loaded/running.
- Process path matches the expected install tree.
- Port owner is the expected process.
- Gateway connectivity check passes.

### Channel and interaction health

- Configured channel accounts report healthy.
- Current lane can receive and respond.
- A low-risk smoke test works where appropriate.

### Control plane

- Task/session list is readable.
- Cron/scheduler list is readable.
- A low-risk scheduled-job proof works where appropriate.
- Required tools/plugins still load.

### External/control surfaces

- Any configured dashboard or public control surface loads.
- Any critical external integration check passes or is marked deferred.

## Phase 6 — Close report

Close every upgrade with a short report:

- before version;
- target version;
- after version;
- command family;
- proof matrix result;
- rollback trigger review;
- known residue;
- next action.

Use one of these statuses:

- `closed successful`;
- `rollback triggered`;
- `deferred`;
- `closed with residue`.

## Phase 7 — After-action follow-through

Preserve what the run taught you:

- what worked;
- what surprised you;
- what should change in the template;
- what public-safe lesson could help other Orchestrators.

## Publication boundary

Private upgrade runbooks may contain machine names, paths, accounts, process IDs, logs, and incident context. Public PowerShift® Stack material should publish the shape of the proof, the template, and reusable lessons.
