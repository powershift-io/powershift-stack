# Pre-Change Snapshot Checklist

Use before OpenClaw upgrades, config edits, auth repairs, service rewiring, plugin changes, or other runtime surgery.

Change:

- Date/time:
- Operator:
- Runtime/lane:
- Trigger:
- Expected target state:

## 1. Name the snapshot

Snapshot ID:

```text
<YYYY-MM-DD-change-name>
```

Private storage location or backup ID:

```text
<private path or archive identifier>
```

## 2. Capture current runtime state

- [ ] CLI version captured
- [ ] Gateway/app version captured
- [ ] Service manager state captured
- [ ] Port/process ownership captured if relevant
- [ ] Health/doctor output captured if relevant
- [ ] Known warnings recorded

## 3. Capture operational control state

- [ ] Current config backed up
- [ ] Agent/profile metadata backed up if relevant
- [ ] Scheduler/cron list captured
- [ ] Active task/session index captured if relevant
- [ ] Plugin list/config captured if relevant

## 4. Capture continuity surfaces

- [ ] Identity/doctrine surfaces committed or backed up
- [ ] Durable memory/wiki surfaces backed up
- [ ] Work-state surfaces backed up
- [ ] Handoffs/receipts/logs backed up where relevant

## 5. Capture external smoke proof

- [ ] Current lane reply proof or equivalent control-plane proof
- [ ] Critical channel health captured if safe
- [ ] Public/control surface checked if relevant

## 6. Write the backout rule

Rollback trigger:

```text
<conditions that require restore or rollback>
```

Known-good target:

```text
<version/config/service state expected after recovery>
```

## 7. Proceed / hold

Decision:

- [ ] proceed
- [ ] hold
- [ ] escalate for human/operator review

Notes:

```text
<brief notes>
```
