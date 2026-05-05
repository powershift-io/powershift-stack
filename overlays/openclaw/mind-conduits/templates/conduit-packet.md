---
id: packet-YYYYMMDD-###
conduit: <conduit-id>
from: <endpoint-id>
from_role: <role-or-endpoint-label>
to: <endpoint-id>
to_role: <role-or-endpoint-label>
created_at: YYYY-MM-DDTHH:MM:SSZ
purpose: <one-line purpose>
authority_source: <charter, role, human authorization, or agreement>
scope: <bounded scope of this packet>
requires_human_escalation: false
escalation_reason: ""
attachments: []
status: draft
record_refs: []
---

# Summary

One-paragraph summary of the request, response, handoff, clarification, or escalation.

# Body

Write the packet plainly. The receiver should be able to understand:

- what is being asked or offered;
- why it belongs in this Conduit;
- what authority source supports the packet;
- what constraints apply.

# Completion condition

State what would count as complete.

# Boundary notes

Name confidentiality, scope, authority, timing, or human escalation constraints.

# Suggested receiver action

Choose one or more:

- acknowledge only;
- respond;
- accept work;
- escalate to human/operator;
- close;
- decline with reason.
