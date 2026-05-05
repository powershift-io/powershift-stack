# Monthly OpenClaw Restore Drill

Drill date:
Operator:
Runtime/lane:
Backup set tested:

## Purpose

Prove that current backups can restore an OpenClaw-powered operation to a usable state.

## 1. Select restore target

- [ ] isolated host, VM, container, or alternate directory selected
- [ ] live production state protected from overwrite
- [ ] network/channel side effects disabled or explicitly controlled

Restore target notes:

```text
<target environment>
```

## 2. Verify backup readability

- [ ] hot-state backup readable
- [ ] cold-corpus backup readable if included
- [ ] offsite repository reachable if tested
- [ ] backup integrity/check command passed

Evidence:

```text
<short proof or archive/check ID>
```

## 3. Restore core state

- [ ] runtime config restored
- [ ] identity/doctrine surfaces restored
- [ ] durable memory/wiki surfaces restored
- [ ] scheduler/task definitions restored or intentionally skipped
- [ ] container/service definitions restored if applicable

## 4. Start runtime

- [ ] gateway/service starts
- [ ] health check passes
- [ ] expected version identified
- [ ] required plugins/tools load
- [ ] logs show no critical startup failures

## 5. Smoke test continuity

- [ ] memory/doctrine surfaces present
- [ ] session/task surfaces readable if applicable
- [ ] one safe interaction path works
- [ ] one safe tool path works if appropriate
- [ ] external dependency gaps named

## 6. Classify result

Choose one:

- [ ] pass — restore path proved
- [ ] pass with residue — usable, with follow-up items
- [ ] fail — recovery blocked
- [ ] partial — backup readable, runtime proof incomplete

## 7. Follow-up

- [ ] backup script/policy updated if needed
- [ ] missing state added to backup set or documented as external
- [ ] restore instructions corrected
- [ ] next drill date set

Notes:

```text
<what changed because of this drill>
```
