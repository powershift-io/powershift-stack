# The PowerShift® Stack

**A governance operating system for intelligence-integrated organizations.**

The PowerShift® Stack provides everything you need to run an organization where humans and intelligent agents share authority under a single, coherent governance framework. It is the open-source layer of the PowerShift® Operating System.

---

## What's Inside

### 📖 The Primer
Nine generative principles that produce the entire ruleset. Read this first — the Constitution will make sense on contact.

→ [`primer/PowerShift_Primer_v1.0.md`](primer/PowerShift_Primer_v1.0.md)  
→ [Read online](https://surface.powershift.io/primer/)

### 📜 The Constitution
A standalone governance framework forked from the Holacracy® Constitution v5.0, extended for organizations where intelligent agents fill roles and participate in governance alongside humans.

| Document | Description |
|---|---|
| [`constitution/PowerShift_Constitution_v1.0.md`](constitution/PowerShift_Constitution_v1.0.md) | Formal fork — legally adopted reference version |
| [`constitution/PowerShift_Constitution_v1.1.md`](constitution/PowerShift_Constitution_v1.1.md) | Natural language rewrite — same rules, dramatically more readable |

### 🎯 Composition-Aware Profiles
The Constitution adapts to your organization's human-to-agent ratio. Profiles are proper subsets — nothing added, only provisions removed that are inert for the target composition.

| Profile | For | Size |
|---|---|---|
| [Full Constitution v1.1](constitution/PowerShift_Constitution_v1.1.md) | Any composition | 100% |
| [Agent Profile](constitution/profiles/agent-profile-v1.1.md) | Few humans, many agents | ~55% |
| [Solo Profile](constitution/profiles/solo-profile-v1.1.md) | One human orchestrator + agent constellation | ~30% |

The Solo Profile is compact enough to embed in an agent's system prompt. Every authority rule survives in every profile.

### 📋 Templates
Ready-to-use templates for standing up governed intelligence in your organization.

| Template | Purpose |
|---|---|
| [`templates/formation-document.md`](templates/formation-document.md) | Define an agent's identity, purpose, constraints, and governance standing |
| [`templates/system-card.md`](templates/system-card.md) | Document an agent's runtime capabilities and hard constraints |
| [`templates/SOUL.md`](templates/SOUL.md) | Agent identity and persona (OpenClaw format) |
| [`templates/AGENTS.md`](templates/AGENTS.md) | Operating contract and behavioral rules (OpenClaw format) |

### 📚 Documentation

| Document | What It Covers |
|---|---|
| [`docs/why-we-forked.md`](docs/why-we-forked.md) | The reasoning behind forking the Holacracy Constitution |
| [`docs/composition-profiles.md`](docs/composition-profiles.md) | How profiles work and when to use each one |
| [`docs/getting-started.md`](docs/getting-started.md) | Bootstrap the PowerShift® OS for your organization |
| [`docs/delegated-role-fillers.md`](docs/delegated-role-fillers.md) | How sub-agents participate in governance |

### 💡 Examples

| Example | Description |
|---|---|
| [`examples/solo-orchestrator/`](examples/solo-orchestrator/) | A single human + agent constellation (our actual setup, sanitized) |

---

## The PowerShift® Operating System

The open-source Stack is one layer of a larger architecture:

```
┌─────────────────────────────────────────────────┐
│           The PowerShift® Operating System       │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  The Primer         (generative principles) │ │  ← You are here
│  │  The Constitution   (governance rules)      │ │  ← You are here
│  │  Profiles           (composition-aware)     │ │  ← You are here
│  │  Templates          (bootstrap artifacts)   │ │  ← You are here
│  ├─────────────────────────────────────────────┤ │
│  │  Operating Agreement (legal wrapper)    [P] │ │
│  │  Formation Documents (agent identity)   [P] │ │
│  │  Agent Runtime       (hard constraints) [P] │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  [P] = Proprietary / organization-specific       │
└─────────────────────────────────────────────────┘
```

The Stack provides the governance kernel. Your organization provides the legal wrapper, agent identities, and runtime configuration.

---

## Key Concepts

**Substrate-independent governance.** Authority lives in roles, not in any particular type of intelligence. Humans and agents participate on equal footing within defined capability envelopes.

**Composition-aware profiles.** The framework adapts its own weight based on your human-to-agent ratio. A solo founder running an agent constellation doesn't need multi-party election processes. A team of fifty humans and five agents does.

**Delegated Role-Fillers.** Sub-agents (processes within an agent's runtime) can fill roles and participate in governance within their assigned sub-circles — without the overhead of full agent registration. This enables fractal self-organization at every scale.

**Tension processing as the engine.** Every structural change starts with someone (human or agent) sensing a gap between current reality and desired state. That tension drives a proposal → objection → integration cycle that evolves the organization continuously.

**Dual-constraint architecture.** Soft constraints (identity, purpose, norms) shape behavior normatively. Hard constraints (tool access, execution gates, sandbox isolation) enforce limits technically. When they conflict, hard wins at runtime — and the conflict surfaces as a governance tension.

---

## Who This Is For

- **Solo founders running AI agent constellations** — the Solo Profile is your governance operating system
- **Small teams integrating AI agents into their workflow** — the Agent Profile or Full Constitution fits
- **Self-management practitioners** upgrading existing Holacracy/Sociocracy implementations for AI
- **Organizations exploring decentralized governance** who want a proven framework, not theory
- **The OpenClaw community** — add the PowerShift® Stack to any OpenClaw deployment for governed intelligence

---

## Provenance

The PowerShift® Constitution is derived from the [Holacracy® Constitution v5.0](https://www.holacracy.org/constitution/5-0/) by HolacracyOne, LLC, published under [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).

PowerShift® extends the Holacracy tradition with:
- Intelligent agents as full governance participants (Designated Agents)
- Sub-agent governance participation (Delegated Role-Fillers)
- Composition-aware constitutional profiles
- Dual-constraint architecture (soft + hard constraints)
- The Orchestrator role (bridging governance and legal entity)
- Natural language accessibility (v1.1 rewrite)

This is an independent derivative work. "Holacracy" is a registered trademark of HolacracyOne, LLC. "PowerShift" is a registered trademark of powershift.io, LLC.

---

## Fork This

This work is licensed under [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/). You can fork it, extend it, adapt it for your organization or community. That's by design — governed intelligence should be forkable.

If you build on this, we'd love to hear about it.

---

## Learn More

- **The Primer** — [surface.powershift.io/primer](https://surface.powershift.io/primer/)
- **PowerShift® Intelligence** — [powershift.io](https://powershift.io)
- **OpenClaw** — [openclaw.ai](https://openclaw.ai)

---

*Dynamic steering applies. Keep pedaling.*
