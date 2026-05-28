# OpenClaw Backup Retention Policy

Policy date:
Operator:
Runtime/lane:
Review cadence:

## Purpose

Name what gets backed up, how long it is retained, and what evidence proves the policy is still true.

## 1. Backup classes

### Hot state

Examples:

- runtime configuration;
- identity/doctrine surfaces;
- durable memory/wiki surfaces;
- scheduler/task definitions;
- channel and tool connection metadata that is safe to back up.

Cadence:
Retention:
Storage target:
Encryption method:
Verification cadence:

### Cold corpus

Examples:

- archived sessions;
- historical transcripts;
- forensic bundles;
- long-term source material.

Cadence:
Retention:
Storage target:
Encryption method:
Verification cadence:

### Versioned identity surfaces

Examples:

- public Stack material;
- operating contracts;
- templates;
- governance-facing doctrine.

Cadence:
Retention:
Storage target:
Secret hygiene rule:

### Regenerable or excluded state

Examples:

- dependency caches;
- generated media;
- temporary logs after retention;
- local backup outputs;
- quarantines after investigation closes.

Exclusion rule:

```text
<what is intentionally excluded and why>
```

## 2. Independence rule

- [ ] scheduler is outside the runtime being protected
- [ ] backup can run without an unlocked desktop session
- [ ] required secrets are available through a service-safe non-interactive path
- [ ] offsite copies survive loss of the primary host

Notes:

```text
<scheduler, secret access, and offsite independence notes>
```

## 3. Pruning rule

Pruning cadence:
Minimum protected window:
Manual hold rule:

```text
<when backups must not be pruned, such as during incident review or active migration>
```

## 4. Freshness evidence

Receipt location:
Receipt format:
Review owner:
Alert threshold:

Minimum receipt fields:

- run start and completion timestamps;
- backup class covered;
- outcome;
- verification status;
- snapshot or archive identifier;
- retention/pruning summary.

## 5. Restore proof

Restore drill cadence:
Last successful drill:
Next scheduled drill:

Evidence location:

```text
<restore drill receipt, ticket, or audit note>
```

## 6. Open questions

- [ ] external dependencies named
- [ ] recovery credentials controlled
- [ ] restore target identified
- [ ] publication/private boundary reviewed

Notes:

```text
<remaining policy gaps>
```
