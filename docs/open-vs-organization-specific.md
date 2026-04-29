# Open Stack vs. Organization-Specific Deployment

The PowerShift® Stack publishes reusable governance, legal, runtime, and clarity patterns for intelligence-integrated organizations.

A live deployment adds local identity, authority, tools, channels, clients, secrets, and operational routines. Those details need stronger boundaries than public documentation.

This guide keeps the public Stack useful without turning a real deployment into public infrastructure by accident.

---

## The rule

Publish the pattern. Protect the deployment.

The public Stack should help another organization understand and adapt the system. It should not expose private operations, client context, credentials, or service delivery machinery.

---

## Belongs in the open Stack

These usually belong in this repository:

- governance concepts and constitutional patterns
- public legal templates and adoption pathways
- reusable role, formation, and system-card templates
- composition-aware profiles
- public-safe examples
- abstract runtime reference patterns
- OpenClaw overlays that can be adapted by other deployments
- clarity surfaces such as receipts, trackers, and audit patterns
- public changelogs and release notes

A useful test:

> Could another organization adapt this without inheriting our private context?

If yes, it may belong in the open Stack.

---

## Belongs in an organization-specific deployment

These belong in a specific organization's private or bounded working context:

- real credentials, tokens, keys, endpoints, and account IDs
- private channel names and live delivery routes
- client-specific Formation Documents
- client-specific System Cards
- internal governance meeting records that contain private context
- task queues, handoffs, incident logs, and correspondence records
- commercial delivery routines
- private automation scripts tied to one host, tenant, or customer
- operational settings that reveal a security posture

These can inspire public patterns, but the raw artifacts should stay out of the open Stack.

---

## Belongs in PowerShift Intelligence service operations

Some reusable material belongs in PowerShift Intelligence's service layer and outside the open Stack:

- hosted-service choreography
- Orchestrator Studio delivery playbooks
- client onboarding sequences
- premium operating routines
- private Foresight pipelines
- production integration details
- customer-specific deployment architectures

These may later produce public docs after sanitization and review.

---

## Real examples are allowed

The Stack may use the real Thomas/PD solo-Orchestrator deployment as an origin example.

When doing so:

- name the real pattern clearly;
- omit secrets, private channels, and client details;
- explain what is reusable;
- mark anything deployment-specific;
- keep the example understandable for readers who are new to PowerShift.

The goal is a truthful origin story that teaches a portable pattern.

---

## Publication review questions

Before moving an artifact into the public Stack, ask:

1. What reusable pattern does this teach?
2. Does it expose a private person, client, channel, credential, or endpoint?
3. Does it create an external promise or commercial commitment?
4. Does it change constitutional, legal, licensing, security, or governance posture?
5. Can a reader understand it without our private operating context?
6. Is this better represented as a template, example, guide, or internal note?

If the answer is unclear, stage it as a draft and route it for review.

---

## Authority boundary

Public Stack Steward work may draft, stage, and organize public-safe material.

Changes that affect constitutional text, legal posture, licensing, security policy, external commitments, public community surfaces, or commercial promises require explicit review before publication.
