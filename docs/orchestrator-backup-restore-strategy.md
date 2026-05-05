# Orchestrator Backup and Restore Strategy for OpenClaw-Powered Operations

**Status:** public-safe working guide  
**Companion templates:** `templates/pre-change-snapshot-checklist.md`, `templates/monthly-restore-drill.md`

## Why this matters

An OpenClaw-powered operation carries identity, memory, channels, configuration, scheduled work, and governance doctrine. Losing that state can interrupt more than chat. It can sever continuity.

A serious backup posture lets an Orchestrator answer four questions:

1. What must be preserved for operational continuity?
2. What can be rebuilt or regenerated?
3. What cadence and retention pattern fits this deployment?
4. How do we prove recovery works?

## Core doctrine

- Memory is operational continuity.
- Sessions are evidence and training ore with different heat levels.
- Backups are part of the operating immune system.
- Restore drills prove what archives merely promise.
- Risky runtime changes deserve a named pre-change snapshot.
- Backup scheduling should survive trouble in the runtime it protects.

## State classification model

Classify state before building a backup script.

### Identity and doctrine

Examples:

- agent identity files;
- operating contracts;
- curated memory policy;
- governance scaffolding;
- public/private boundary notes.

### Hot operational state

Examples:

- primary runtime config;
- auth state required to reconnect channels and models;
- active agent/session indexes needed for continuity;
- scheduler and cron definitions;
- role or task state without another canonical home;
- memory/wiki surfaces used as operational canon;
- container or compose definitions for alternate runtimes.

### Cold corpus

Examples:

- historical transcripts;
- archived sessions;
- forensic captures;
- incident evidence;
- long-term source material.

Cold corpus usually needs different retention and storage economics than hot state.

### Generated or regenerable bulk

Examples:

- dependency caches;
- browser automation caches;
- bulky generated media;
- temporary logs past their retention window;
- local backup outputs;
- quarantines after investigation closes.

### External dependencies

Examples:

- offsite repositories;
- object storage;
- DNS and domain configuration;
- hosted runtime wiring;
- secrets manager records;
- provider accounts and billing access.

Backups should document these dependencies even when they cannot copy them.

## Layered backup strategy

### Layer 0 — Pre-change snapshots

Use before upgrades, config edits, service wiring changes, auth repairs, or runtime surgery.

A pre-change snapshot should be named, timestamped, and tied to the change that triggered it.

### Layer 1 — Encrypted hot-state backups

This is the daily recovery backbone. It should capture the minimum state needed to restore a working lane quickly.

Recommended cadence: daily.

### Layer 2 — Cold-corpus backups

Historical sessions and forensic material can become large. Give cold corpus its own backup policy, storage target, and retention shape.

Recommended cadence: daily or weekly, depending on corpus movement.

### Layer 3 — Versioned identity surfaces

Use Git or a similar versioned system for human-readable doctrine, templates, roles, and public-stack material.

This layer needs strict secret hygiene.

### Layer 4 — Offsite disaster recovery

Keep encrypted offsite copies independent from the machine running the live gateway.

A backup that only survives while the original host survives is a convenience copy.

### Layer 5 — Restore drills

Schedule proof that the backup can rebuild a working lane.

Recommended cadence: monthly for serious operations, plus a drill after major backup architecture changes.

## Baseline cadence and retention

A practical starting point:

- daily encrypted hot-state backup;
- daily or weekly cold-corpus backup depending on volume;
- named pre-change snapshot before risky operations;
- weekly backup freshness review;
- monthly restore drill;
- longer retention for cold corpus than for hot-state snapshots.

Tune this to the deployment’s risk, budget, and operating tempo.

## Restore drill standard

A restore drill should prove:

- config and identity surfaces restore cleanly;
- the gateway can start;
- health checks succeed;
- canonical memory/doctrine surfaces are present;
- at least one communication lane or equivalent smoke path works;
- alternate runtime/container restore works if the operator uses one;
- missing external dependencies are named.

## What belongs outside public examples

Public guides should never include:

- secrets, tokens, keys, callback URLs, bucket names, or credential formats;
- host-specific paths, user names, machine names, or process IDs;
- private tenant topology;
- raw transcripts or personal correspondence;
- incident details that expose protected internals.

Publish reusable structure, checklists, and doctrine. Keep private recovery instructions private.
