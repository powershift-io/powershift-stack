# Protocol and compatibility

The adapter has three independent version surfaces:

- **release:** package evolution, currently `0.1.0`
- **protocol:** externally exchanged packet and receipt contract, currently `0.1`
- **storage schemas:** embedded version fields in durable queue, control, and telemetry documents

`governedAdapterProtocolManifest()` is the machine-readable source of release, protocol, capabilities, and safety defaults. Entrypoints must call `assertCompatibleProtocol()` before accepting a remote peer's contract.

## Compatibility rule

Protocol `0.1` accepts only `0.1`. Unknown versions fail closed. A release may add optional fields without changing the protocol only when old readers ignore them safely and the authority outcome cannot change. Required fields, semantics, signature inputs, digest construction, or authority consequences require a protocol version change.

Storage schemas are not protocol versions. A release that changes durable state must provide an explicit, tested migration and preserve a rollback copy. This release performs no implicit migration.

## Stable invariants

- one accepted source root creates at most one Mind turn
- replay cannot create another dispatch, signing lease, or publication
- transport identity is resolved to a canonical actor before authority evaluation
- role projection is request-scoped and does not replace Mind identity
- context release is versioned and digest-pinned
- dispatch targets an exact existing OpenClaw session
- authority, execution, and publication decisions remain independently visible
- all unsupported versions and ambiguous bindings fail closed

Protocol `0.x` is a review-stage contract. Pin the exact version in supervised deployments.
