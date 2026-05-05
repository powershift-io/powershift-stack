# OpenClaw <target-version> Upgrade Runbook

Status: draft / in progress / closed successful / rollback triggered / deferred / closed with residue  
Created: <YYYY-MM-DD>  
Operator: <human operator or operations role>  
Agent support: <agent or support role, if any>

## Phase 0 — Intake and release classification

Trigger: <what caused this release to be considered>

### Current baseline

- Current local CLI version:
- Current gateway/app version:
- Current service state:
- Known active risks or tensions:

### Upstream evidence

- Release source:
- Release tag:
- Release status: stable / prerelease / draft / unknown
- Published at:
- Release notes URL:

### Package/updater evidence

- Package registry latest version:
- Local updater target version:
- Channel/tag used:

### Local dry-run evidence

```json
{
  "currentVersion": "<current>",
  "targetVersion": "<target>",
  "effectiveChannel": "<channel>",
  "downgradeRisk": false
}
```

### Classification

Choose one:

- no release available
- release visible upstream, updater pending
- release available to updater
- prerelease only
- local updater/config mismatch

Decision: proceed / defer / wait for propagation / investigate mismatch.

## Phase 1 — Release assessment

Why this release matters:

- <relevance to current operating tensions>

Potential improvements:

- <what it may improve>

Potential regressions:

- <what could break or require closer watch>

Proceeding rule:

- <conditions required before update>

## Phase 2 — Preflight snapshot and backout plan

Preflight snapshot path or archive ID:

```text
<private recovery location or backup ID>
```

Captured before update:

- [ ] status / deep status
- [ ] security or permissions posture
- [ ] task/cron list where relevant
- [ ] update dry-run JSON
- [ ] config backup
- [ ] auth/profile backup if applicable
- [ ] service metadata if applicable
- [ ] critical public/control-surface proof if applicable

### Backout plan

Known-good target:

- OpenClaw version:
- gateway/app version:
- service path or service manager:
- channel health expected after restore:

Backout procedure:

1. Stop stacking unrelated edits onto the failed update.
2. Restore backed-up config/auth files if failure indicates config ambiguity.
3. If package rollback is required, use an explicit known-good package target after confirming availability.
4. Restart service only through the normal service manager or supported OpenClaw service command.
5. Run the post-update proof matrix against the restored state.

Rollback decision rule:

- <conditions that trigger rollback>

## Phase 3 — Human/operator update

Command family used:

```sh
openclaw update --dry-run --json
openclaw update
```

Operator completion note:

```text
Update complete — resume verification. Result: <final updater line or short outcome>
```

If ambiguous:

```text
Update ambiguous — hold and diagnose. Last visible line: <line>
```

## Phase 4 — During-update observations

- Long typing indicator or delayed reply:
- Service restart/drain window:
- Updater warning/error:
- Unexpected routing or channel behavior:
- Log lines requiring follow-up:

## Phase 5 — Post-update proof matrix

### Version alignment

- CLI version:
- Gateway/app version:
- Local updater dry-run after update:
- Dashboard/control panel visible, if applicable:

### Service provenance

- Service manager reports loaded/running:
- Process path matches expected install tree:
- Node/runtime path expected:
- Configured port owner is expected process:
- Deep probe/connectivity proof:

### Channel / interaction health

- Configured channels healthy:
- Account/profile health:
- Current-lane reply proof:
- Outbound/inbound smoke proof if safe:

### Control-plane proof

- Tasks list readable:
- Cron/scheduler list readable:
- Low-risk scheduled job proof:
- Tool/plugin compatibility:

### Doctor / health residue

- Doctor exit:
- Critical findings:
- Non-blocking residue:
- Housekeeping items:

### External or public surface spot checks

- Configured public/control surface A:
- Configured public/control surface B:

## Phase 6 — Report

Status: closed successful / rollback triggered / deferred / closed with residue

Summary:

- Before version:
- Target version:
- After CLI version:
- After gateway/app version:
- Command family used:
- Proof matrix result:
- Rollback trigger review:
- Known residue:
- Next action:

## Phase 7 — After-action follow-through

What worked:

- <process practices worth keeping>

What surprised us:

- <unexpected behavior or operator-experience issue>

Follow-up items:

- [ ] update the template/protocol if needed
- [ ] address non-blocking residue
- [ ] file public-safe lessons if useful
- [ ] commit/archive the final runbook
