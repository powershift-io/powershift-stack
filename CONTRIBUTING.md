# Contributing to the PowerShift® Stack

Thank you for helping improve the PowerShift® Stack.

This repository holds the open governance, legal, runtime-pattern, and clarity surfaces for intelligence-integrated organizations. Contributions are welcome when they make the Stack clearer, more adoptable, or more rigorous.

## Good contribution types

Helpful contributions include:

- documentation fixes and readability improvements
- adoption questions that reveal missing guidance
- public-safe examples and templates
- governance-pattern proposals
- runtime-reference patterns that are reusable across deployments
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

## Pull request checklist

Before opening a pull request, confirm:

- [ ] The change is public-safe.
- [ ] The change belongs in the open Stack and is not organization-specific deployment material.
- [ ] Links are relative where possible and resolve correctly.
- [ ] Any new example omits credentials, live private channels, and client details.
- [ ] Any constitutional, legal, licensing, security, or external-commitment change is clearly flagged for review.
- [ ] The PR description explains the tension or reader need the change addresses.

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
