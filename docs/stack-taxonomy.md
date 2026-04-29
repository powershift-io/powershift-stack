# PowerShift® Stack Taxonomy

A deeper architecture view of the PowerShift® Stack, from governance grammar down to runtime substrate.

This document exists to keep the repo surface taxonomically clean.
The Stack is more than constitutional text, and it is broader than one runtime implementation.

---

## Participants / Role-Fillers

These sit **above** the stack, not inside it as a numbered layer.

- Orchestrators
- Sovereign Minds
- delegated agents
- delegated role-fillers

Authority is exercised by participants filling roles, inside a governed system.

---

## Canonical Layers

### 1. Governance Kernel

The formal authority grammar.

Includes:
- Primer
- Constitution
- Profiles
- roles
- circles
- domains
- policies
- accountabilities

### 2. Business-Semantic Layer

The business-facing language that keeps governance legible to humans while staying close to machine-compilable structure.

Includes:
- purpose
- roles
- circles
- domains
- policies
- accountabilities
- tensions

### 3. Legal Adoption Pathways

The bridge that lets the governance kernel become real inside an actual organization.

Includes:
- Ratification Agreement
- Operating Agreement template
- profile-aware constitutional adoption patterns

### 4. Runtime Reference Patterns

Reusable patterns for how a governed intelligence system runs.

Includes:
- tension processing protocol
- workspace architecture
- memory continuity pattern
- metabolic override protocol
- governed agent constellation pattern

### 5. Authority Translation + Enforcement

Where governance-defined authority becomes machine-checkable runtime action.

Includes:
- classification
- compilation
- routing
- action preflight
- enforcement and gating
- escalation logic
- authority snapshot evaluation

Core pattern:

`signal or intent -> tension primitive -> evaluated against authority primitive -> route / allow / escalate / block`

### 6. Organization-Specific Implementation

The deployment layer for a particular organization.

Includes:
- formation documents
- system cards
- runtime configuration
- skills and plugins
- orchestration routines
- sensing handlers
- service surfaces

### 7. Substrate + Interfaces

The concrete systems the runtime routes through.

Includes:
- models
- nodes
- cron
- Git / GitHub
- Telegram / Gmail / voice / web surfaces
- MCP servers
- external APIs and services

---

## Signature Primitives

### Tension Primitive

A machine-legible representation of a sensed gap, signal, risk, opportunity, or governance issue.

Example fields:
- source
- sensed-by
- category
- description
- target container
- priority or urgency
- proposed route
- provenance metadata

### Authority Primitive

A machine-legible representation of what a role may do and under what conditions.

Example fields:
- purpose
- domains
- accountabilities
- policies
- delegation chain
- capability envelope
- ratification requirements
- escalation rules
- provenance or snapshot metadata

---

## Cross-Cutting Loops

These are loops across the stack, not stack layers.

1. **Signal -> Tension -> Route**
2. **Session -> Handoff -> Memory**
3. **Tension -> Proposal -> Objection -> Integration**

---

## Design Rule

The familiar implementation frame:

`cron / loops + filesystem / markdown + shell + llms`

is useful as a current harness idiom.
It should not be treated as the universal essence of an agent.

---

## What Belongs Where

### Open-source Stack

Keep here:
- the canonical layers
- participants band
- cross-cutting loops
- abstract Tension and Authority primitives
- generic runtime reference patterns

### OpenClaw overlays

Put here:
- runtime-specific observability and coordination surfaces
- concrete action-preflight and enforcement patterns
- receipts, handoff wrappers, authority packets, tension routing, governance-bus examples
- substrate-specific install pathways

### PSI / service-specific docs

Keep out of the Stack repo:
- tenant-specific runtime topology
- exact nodes, bots, channels, and MCP endpoints
- hosted Minds service choreography
- proprietary studio operations

---

This taxonomy is the architectural map behind the current diagram surface.
It helps the repo stay coherent as the runtime and service layers continue to evolve.
