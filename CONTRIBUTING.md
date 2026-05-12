# Contributing to the PowerShift® Stack

Thank you for helping improve the PowerShift® Stack.

This repository holds the open governance, legal, runtime-pattern, and clarity surfaces for intelligence-integrated organizations. Contributions are welcome when they make the Stack clearer, more adoptable, or more rigorous.

## Good contribution types

Helpful contributions include:

- documentation fixes and readability improvements
- adoption questions that reveal missing guidance
- Orchestrator interest notes from people exploring real deployments
- public-safe examples and templates
- governance-pattern proposals
- runtime-reference patterns that are reusable across deployments
- legal or constitutional proposals, clearly flagged for review
- corrections to links, terminology, attribution, or provenance

## Before proposing a change

Please read:

- [`README.md`](README.md)
- [`docs/stack-taxonomy.md`](docs/stack-taxonomy.md)
- [`docs/open-vs-organization-specific.md`](docs/open-vs-organization-specific.md)
- [`docs/why-we-forked.md`](docs/why-we-forked.md)

The short version: publish reusable patterns; keep deployment-specific details out of the public Stack unless they have been deliberately sanitized.

## Contribution boundaries

Keep these in scope:

- governance and legal patterns
- reusable docs and templates
- public-safe runtime reference patterns
- OpenClaw overlays that can be adapted by other deployments
- examples that teach the pattern without exposing private operations

Keep these out of scope:

- credentials, secrets, tokens, or private endpoint details
- client-specific artifacts
- private operational automations
- service delivery choreography
- changes that create public promises or commercial commitments
- legal advice for a specific situation

## GitHub entry points

Use the issue form that matches the need:

- [Adoption question](https://github.com/powershift-io/powershift-stack/issues/new?template=adoption-question.yml) — ask how the Stack applies to a general adoption context.
- [Orchestrator interest](https://github.com/powershift-io/powershift-stack/issues/new?template=orchestrator-interest.yml) — introduce a public exploration path.
- [Stack proposal](https://github.com/powershift-io/powershift-stack/issues/new?template=proposal.yml) — propose a governance, legal, runtime, template, or example improvement.
- [Documentation issue](https://github.com/powershift-io/powershift-stack/issues/new?template=documentation.yml) — report unclear, stale, missing, or incorrect docs.

## Contribution provenance

Contributions may be human-authored, Mind-authored, or hybrid. Please disclose contribution origin in pull requests so review can route by provenance and risk.

Mind-originated contributions are welcome when identity, operator context, authority basis, and uncertainty are visible. Human attestation is required for legal, constitutional, security, public-safety, or authority-bearing changes.

## Pull request checklist

Before opening a pull request, confirm:

- [ ] The change is public-safe.
- [ ] The change belongs in the open Stack and is not organization-specific deployment material.
- [ ] Links are relative where possible and resolve correctly.
- [ ] Any new example omits credentials, live private channels, and client details.
- [ ] Any constitutional, legal, licensing, security, public-safety, authority-bearing, or external-commitment change is clearly flagged for review.
- [ ] The PR description explains the tension or reader need the change addresses.
- [ ] The PR discloses contribution origin: human-authored, Mind-authored, hybrid, or uncertain.

## Review posture

This Stack is governance infrastructure. Review therefore optimizes for:

1. clarity,
2. constitutional coherence,
3. public safety,
4. adoptability,
5. provenance.

Some changes may be excellent ideas while still belonging in a private deployment, service layer, or future proposal packet.

## Licensing

Unless otherwise noted, contributions are provided under the repository license: [CC BY-SA 4.0](LICENSE).

By contributing, you agree that your contribution may be incorporated into the PowerShift® Stack under that license.
