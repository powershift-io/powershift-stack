# OpenClaw Backup Freshness Receipt

Use this as a human-readable receipt shape, or translate the same fields into JSON, YAML, a database row, or another machine-readable surface.

Receipt ID:
Runtime/lane:
Backup class:
Run source:

## Run timing

Started at:
Completed at:
Duration:

## Outcome

Choose one:

- [ ] success
- [ ] success with warnings
- [ ] failed
- [ ] skipped by policy
- [ ] incomplete

Outcome summary:

```text
<short result summary>
```

## Backup artifact

Artifact type:
Artifact ID:
Storage target:
Encryption status:

Private locator:

```text
<private path, repository ID, or provider locator; omit from public copies>
```

## Verification

Choose all that apply:

- [ ] integrity check passed
- [ ] repository/list command passed
- [ ] sample restore passed
- [ ] full restore drill passed
- [ ] verification skipped by policy
- [ ] verification failed

Verification evidence:

```text
<check ID, command summary, receipt link, or restore drill reference>
```

## Retention action

Choose one:

- [ ] no pruning due
- [ ] pruning completed
- [ ] pruning skipped by policy
- [ ] pruning failed

Retention summary:

```text
<what was kept, pruned, or held>
```

## Freshness decision

Choose one:

- [ ] fresh
- [ ] stale
- [ ] unknown
- [ ] needs operator review

Reason:

```text
<why this run does or does not satisfy current policy>
```

## Follow-up

- [ ] no follow-up
- [ ] repair backup job
- [ ] repair verification job
- [ ] update retention policy
- [ ] run restore drill
- [ ] escalate to operator

Notes:

```text
<next action, owner, and target date>
```
