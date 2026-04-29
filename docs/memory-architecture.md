# Memory Architecture for Governed Intelligence

PowerShift® treats memory as part of the agent substrate, not as an optional convenience feature.

The working definition is:

> Agent = LLM + Memory + bash

An agent without governed memory can still answer questions and run tools, but it cannot reliably participate in organizational continuity. Memory is what lets a role-filler carry context across session boundaries, metabolize experience, preserve decisions, and expose what it knows for review.

This guide describes the memory architecture pattern for an OpenClaw harness running the PowerShift® Operating System.

---

## Architectural posture

OpenClaw is strongest as **layered memory**, not as shared live state.

The core rules:

- OpenClaw is stronger as **layered memory** than as **shared live state**.
- OpenClaw is isolation-first: agents, sessions, workspaces, and transcripts are lane-bound.
- Memory should support recall, consolidation, and knowledge compilation.
- Memory should not carry work state, approvals, queues, or commitments. Those belong in explicit task, governance, receipt, and handoff surfaces.

The mistake to avoid is treating memory as a mystical shared consciousness. In an OpenClaw deployment, memory works best as a set of explicit layers with different jobs, review surfaces, and failure modes.

---

## Layer model

| Layer | Purpose | Typical OpenClaw surface | Status in the PowerShift reference harness |
|---|---|---|---|
| Operational recall | Retrieve prior facts, preferences, decisions, dates, people, todos, and relevant context on demand | `memory-core`, `memory_search`, `memory_get`, indexed `MEMORY.md`, `memory/*.md`, sessions, selected shared docs | Baseline |
| Metabolic consolidation | Convert repeated or high-signal traces into durable memory candidates | Dreaming phases: Light, REM, Deep; `DREAMS.md`; `memory/dreaming/*`; `memory/.dreams/*` | Baseline, governed by audit |
| Compiled knowledge | Turn durable knowledge into inspectable claims, evidence, contradictions, questions, entities, concepts, and syntheses | `memory-wiki`, `wiki_search`, `wiki_get`, wiki vault | Baseline candidate / canon layer |
| Explicit work state | Carry commitments, queues, approvals, active decisions, handoffs, and next actions | handoff docs, receipt threads, task flows, governance records, issue trackers | Required outside memory |
| Hot-path edge recall | Pre-reply personalization in human-facing conversations | `active-memory` plugin | Scoped experiment only |
| Transcript archaeology | Preserve and re-expand long, tool-heavy session history | `lossless-claw` context engine / LCM tools | Scoped experiment only |

---

## Source-of-truth boundaries

Memory can help an agent remember. It must not become the authority surface for commitments.

Use memory for:

- stable preferences
- durable operating rules
- named decisions and their context
- recurring relationship facts
- long-lived platform watchpoints
- source-backed organizational knowledge

Do not use memory as the primary carrier for:

- open work queues
- approvals
- unresolved objections
- commitments to external people
- financial actions
- deployment state
- active incident response
- secrets or credentials

Those belong in explicit artifacts: task ledgers, governance records, handoff files, issue trackers, deployment logs, receipt threads, and secure secret stores.

---

## Baseline OpenClaw configuration pattern

A PowerShift OpenClaw harness should start with the boring memory stack first.

### 1. `memory-core` recall

`memory-core` is the baseline memory capability. It owns the normal recall tools and memory prompt integration.

Recommended posture:

- keep `memory-core` active
- keep durable facts in `MEMORY.md` and dated `memory/*.md` files
- index session transcripts only where the continuity value outweighs noise
- index selected shared docs with bounded retrieval
- require explicit recall before answering questions about prior work, dates, people, preferences, decisions, or todos

### 2. Dreaming

Dreaming is the background consolidation layer. It is not an interactive recall feature and it is not a source of truth by itself.

Typical config shape:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "frequency": "0 3 * * *"
          }
        }
      }
    }
  }
}
```

Dreaming artifacts to monitor:

| Artifact | Purpose |
|---|---|
| `DREAMS.md` | Narrative observability / diary surface |
| `memory/dreaming/light/*.md` | Candidate staging |
| `memory/dreaming/rem/*.md` | Reflection and theme extraction |
| `memory/dreaming/deep/*.md` | Ranking and durable promotion reports |
| `memory/.dreams/*` | Machine state, recall traces, ingestion cursors, phase signals |

Governance rule: Dreaming may propose durable memory. It does not make something true. Durable facts must land in `MEMORY.md`, dated memory files, wiki pages, or explicit operational artifacts.

### 3. `memory-wiki`

`memory-wiki` is the compiled knowledge layer. It should turn memory sediment into a source-backed canon.

Recommended initial posture:

```json
{
  "plugins": {
    "entries": {
      "memory-wiki": {
        "enabled": true,
        "config": {
          "vaultMode": "isolated",
          "ingest": {
            "autoCompile": true,
            "maxConcurrentJobs": 1
          },
          "search": {
            "backend": "shared",
            "corpus": "wiki"
          },
          "context": {
            "includeCompiledDigestPrompt": false
          }
        }
      }
    }
  }
}
```

Start in `isolated` mode unless bridge behavior has been verified on the target host. Bridge mode can be valuable later, but only after confirming artifact visibility, warm-load behavior, and provenance quality.

---

## Experimental layers

### `active-memory`

`active-memory` is a bounded, blocking pre-reply memory sub-agent. Its job is hot-path personalization: surfacing relevant memory before an eligible conversational reply.

It is useful when:

- the lane is human-facing
- continuity and personalization matter
- a small amount of added latency is acceptable
- false positives are rare

It is a poor fit for:

- cron jobs
- background workers
- sub-agents
- one-shot tool tasks
- internal automation
- group/forum lanes before direct-lane proof

Recommended pilot posture:

```json
{
  "plugins": {
    "entries": {
      "active-memory": {
        "enabled": true,
        "config": {
          "enabled": true,
          "agents": ["<frontdoor-agent-id>"],
          "allowedChatTypes": ["direct"],
          "queryMode": "recent",
          "promptStyle": "balanced",
          "timeoutMs": 15000,
          "maxSummaryChars": 220,
          "persistTranscripts": false,
          "logging": true
        }
      }
    }
  }
}
```

Pilot metrics:

- added latency per eligible reply
- useful / harmless / distracting / wrong memory hits
- false-positive rate
- false-negative rate on known preference/context prompts
- timeout or embedded-run warnings
- transcript lifecycle warnings
- user-visible weirdness

Decision rule: `active-memory` may earn a scoped frontdoor role. It should not become a global default without strong evidence.

### `lossless-claw`

`lossless-claw` is a context-engine replacement for transcript archaeology. It is not the same category as durable organizational memory.

It is useful when:

- exact long-session history matters
- tool traces and file details need re-expansion
- coding, research, investigation, or legal/operational traceability depends on process history

It is a poor fit for:

- default organization-wide memory
- lightweight chat lanes
- heartbeat / cron lanes
- live flagship sessions before disposable-lane proof

Recommended pilot posture:

```json
{
  "plugins": {
    "slots": {
      "contextEngine": "lossless-claw"
    },
    "entries": {
      "lossless-claw": {
        "enabled": true,
        "config": {
          "summaryModel": "<reliable-funded-summary-model>",
          "freshTailCount": 64,
          "contextThreshold": 0.75,
          "incrementalMaxDepth": 1,
          "ignoreSessionPatterns": [
            "agent:*:cron:**"
          ]
        }
      }
    }
  }
}
```

Do not pilot this with an unreliable summarization provider. A context engine whose summary model cannot consistently authenticate or bill is an operational liability.

Pilot metrics:

- coherence after compaction
- quality of earlier-detail retrieval
- preservation of tool-call consequences and file facts
- database growth
- gateway warnings/errors
- compaction latency
- restart/bootstrap behavior

Decision rule: `lossless-claw` may earn a selected coding/research/investigation role. It should not become the default memory substrate unless the deployment actually depends on transcript archaeology.

---

## Dreaming governance policy

Dreaming should be reviewed, not merely enabled.

### Dreaming may promote

- stable human preferences
- durable operating rules
- named decisions
- recurring relationship or stakeholder context
- long-lived blockers or release watchpoints
- concepts that repeatedly shape action

### Dreaming must not promote

- poetic diary language as fact
- raw transcript residue
- one-off implementation details with no durable consequence
- temporary work state
- open loops that belong in task/handoff systems
- secrets, credentials, or sensitive raw payloads

### Review cadence

A mature harness should keep a lightweight Dreaming review loop:

1. inspect recent Light / REM / Deep reports
2. classify promotions as useful, too granular, duplicate, misleading, or misplaced
3. move misplaced material into the right surface: memory, wiki, task, handoff, receipt, or deletion
4. tune config or operating rules only after evidence

Dreaming earns its baseline role if durable promotions are mostly useful and failures become visible quickly.

### Audit rubric

Classify Dreaming promotions and high-signal candidates into five buckets:

| Classification | Meaning | Action |
|---|---|---|
| Durable and useful | A stable fact, rule, preference, decision, or pattern that should shape future behavior | Keep; polish into one atomic claim if needed |
| True but too granular | Accurate, but too detailed for durable memory | Distill, move to dated notes, or compile into wiki |
| Duplicate / noisy | Restates existing memory or captures transport/status residue | Suppress or remove after backup |
| Misleading / unsafe | Wrong, stale, secret-bearing, or likely to produce bad action | Correct or remove urgently |
| Wrong surface | Belongs in task, handoff, receipt, issue, repo doc, or governance record | Route to the proper explicit artifact |

A repeated REM motif should force a routing decision after two appearances: promote, compile into wiki, convert to task/handoff, or suppress as already-known/noise.

---

## Memory-wiki as organizational canon

The wiki layer is where memory becomes inspectable institutional knowledge.

A mature PowerShift deployment should eventually maintain source-backed pages for:

- the memory architecture itself
- agent identities and role boundaries
- operating protocols
- recurring governance patterns
- long-lived tensions and decisions
- active contradictions and open questions
- deployment-specific runtime facts that are safe to expose

The wiki should not replace active memory. It should compile it.

---

## Anti-patterns

Avoid these patterns:

1. **Prompt stuffing** — increasing bootstrap size instead of improving retrieval and compiled knowledge.
2. **Shared-context pseudo-consciousness** — injecting mutable shared files every turn as if they were shared live state.
3. **Memory as task manager** — hiding queues, commitments, or approvals in memory notes.
4. **Global plugin optimism** — enabling every promising memory plugin across every lane.
5. **Diary truthmaking** — treating Dreaming narrative output as durable fact.
6. **Unreviewed consolidation** — letting Dreaming promote memory indefinitely without audit.
7. **Transcript maximalism** — preserving every conversational trace when a handoff, receipt, or wiki page would be cleaner.

---

## Implementation sequence

Use this order when maturing a PowerShift OpenClaw harness:

1. Make the current memory stack visible and auditable.
2. Audit Dreaming first, because it is already active in many deployments.
3. Tighten durable memory and bootstrap discipline.
4. Build or update wiki canon pages for memory architecture.
5. Pilot `active-memory` narrowly in direct/frontdoor lanes.
6. Pilot `lossless-claw` only in disposable coding/research lanes.
7. Promote only the layers that prove their value under measured use.

This sequence keeps memory architecture rational: observe the running metabolism first, then test hot-path recall, then test context-engine replacement.

---

## Minimal Orchestrator checklist

Before declaring a deployment memory-ready, an Orchestrator should be able to answer:

- What memory systems are active?
- Which agents and lanes do they affect?
- What is the source of truth for durable facts?
- Where do commitments and approvals live?
- What Dreaming artifacts are being produced?
- When were promotions last reviewed?
- Is `active-memory` enabled anywhere? Why?
- Is `lossless-claw` the context engine anywhere? Why?
- What is the rollback path if memory behavior degrades?

If those answers are not visible, the memory system is not governed yet.
