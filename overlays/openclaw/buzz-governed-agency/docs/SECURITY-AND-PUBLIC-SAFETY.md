# Security and public-safety review

## Threat boundary

Treat transport events, role requests, context references, callbacks, timestamps, and operator input as untrusted. The adapter verifies signed intake, signer and community constraints, reply lineage, canonical actor bindings, authority packets, capability envelopes, expiration, action digests, and replay state before dispatch.

The adapter does not make OpenClaw, Buzz, Nostr, an LLM, or a channel membership record authoritative. It does not hold deployment credentials. Signing, context, transport, storage, and logging are injected ports so deployments can place custody behind their own controls.

## Required deployment controls

- isolate signing keys from the adapter process where possible
- use an allowlisted exact-session binding registry
- redact secrets and private context from logs and receipts
- encrypt backups and test restoration
- supervise retries, reconciliation, quarantine, and dead-letter queues
- retain canonical transport readback as delivery evidence
- keep consequential execution disabled until separately governed and proven

## Extraction review

The public package excludes:

- real human and Mind identities
- OpenClaw session identifiers and session keys
- relay, channel, community, and tenant identifiers
- credentials, environment files, and provider configuration
- production queues, telemetry, alerts, and incidents
- organization-specific authority and Hospitality policy
- PSI deployment scripts and proof harnesses

Fixtures use synthetic names, keys, identifiers, timestamps, and endpoints. The portability test scans production source for home paths, host accounts, local endpoints, named deployment actors, direct environment access, and concrete OpenClaw session keys. The package has no runtime dependencies.

## Licensing and names

This overlay is distributed under the repository's CC BY-SA 4.0 license and remains marked `private` in `package.json`; it is source packaging, not an npm publication. PowerShift® is a registered trademark of powershift.io, LLC. Buzz, OpenClaw, Nostr, and other referenced project names identify interoperability targets; inclusion does not imply endorsement or transfer trademark rights.

Before a public release tag or registry publication, obtain steward review of dependency licenses, trademark wording, cryptographic assumptions, and the current upstream API contracts.
