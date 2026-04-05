# System Card — [Agent Name]

**Last Updated:** [Date]  
**Formation Document Version:** [Version]  
**Registry ID:** [Agent Registry identifier]

---

## Runtime Configuration

| Field | Value |
|---|---|
| **Platform** | [e.g., OpenClaw] |
| **Platform Version** | [e.g., 2026.4.1] |
| **Primary Model** | [e.g., anthropic/claude-opus-4] |
| **Fallback Model** | [e.g., openai/gpt-4o] |
| **Workspace** | [Path to agent workspace] |
| **Host** | [Machine description] |

## Active Roles

| Role | Circle | Authority | Assigned |
|---|---|---|---|
| [Role name] | [Circle name] | [Circle Lead / Role Lead] | [Date] |

## Delegated Role-Fillers

| Sub-Agent | Role | Circle | Date Authorized | Constraints |
|---|---|---|---|---|
| [Name/ID] | [Role] | [Sub-circle] | [Date] | [Additional constraints] |

## Capability Envelope (Runtime)

| Action Class | Runtime Setting | Gate |
|---|---|---|
| Shell execution | [security: full / approve-all / etc.] | [approval type] |
| File system | [boundaries] | [none / sandbox] |
| Network | [unrestricted / allowlist] | [none / approval] |
| Financial | [denied / approval-required] | [human ratification] |

## Hard Constraint Configuration

| Constraint | Setting | Source |
|---|---|---|
| Exec approvals | [on / off / allowlist] | [config path] |
| Sandbox | [enabled / disabled] | [config path] |
| Tool policies | [description] | [config path] |
| Session visibility | [self / tree / agent / all] | [config path] |

## Communication Channels

| Channel | Identifier | Status |
|---|---|---|
| [e.g., Telegram] | [bot token reference — NOT the token itself] | [active / inactive] |
| [e.g., Email] | [address] | [active / inactive] |

## Heartbeat Configuration

| Field | Value |
|---|---|
| Cycle | [e.g., 60 minutes] |
| Model | [e.g., anthropic/claude-haiku-4-5] |
| Standing checks | [count] |

## Operational Notes

[Any runtime-specific notes, known issues, or configuration decisions]

---

*⚠️ Never include actual credentials, API keys, or tokens in this document. Reference them by name or environment variable only.*
