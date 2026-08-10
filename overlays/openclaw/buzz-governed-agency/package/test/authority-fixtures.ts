import type {
  ActionIntent,
  SyntheticAuthoritySnapshot,
} from "../src/index.js";

const VALID_FROM = "2026-07-29T00:00:00.000Z";
const VALID_UNTIL = "2026-07-30T00:00:00.000Z";

export const authoritySnapshot: SyntheticAuthoritySnapshot = {
  snapshot_id: "synthetic-governance-snapshot-v1",
  snapshot_version: "0.1",
  description:
    "Synthetic Phase 3 authority source; not a production governance record.",
  valid_from: VALID_FROM,
  valid_until: VALID_UNTIL,
  status: "active",
  actors: [
    {
      actor_id: "down-demo",
      role_context: ["platform-circle-lead-demo"],
      status: "active",
    },
    {
      actor_id: "thomas-demo",
      role_context: ["synthetic-ratifier"],
      status: "active",
    },
  ],
  rules: [
    {
      rule_id: "rule-read-alpha-status",
      actor_id: "down-demo",
      capability_envelope: {
        capability: "synthetic.project-status.read",
        action_types: ["read"],
        resources: ["fixture:ALPHA"],
        operations: ["inspect"],
        mode: "read_only",
      },
      decision_class: "low_risk_read",
      outcome: "allow",
      decision_reason:
        "The exact synthetic fixture read is inside Mind-A-Demo's bounded capability.",
      authority_basis: [
        "role:platform-circle-lead-demo",
        "policy:synthetic-read-only-fixture",
      ],
      constraints: [
        "Read only fixture ALPHA.",
        "No shell, network, model provider, or external system.",
      ],
      required_approvers: [],
      required_ratifiers: [],
      valid_from: VALID_FROM,
      valid_until: VALID_UNTIL,
      ttl_seconds: 300,
      status: "active",
    },
    {
      rule_id: "rule-propose-demo-copy",
      actor_id: "down-demo",
      capability_envelope: {
        capability: "synthetic.demo.copy.propose",
        action_types: ["write"],
        resources: ["demo:public-copy"],
        operations: ["prepare-change"],
        mode: "proposal_only",
      },
      decision_class: "material_change",
      outcome: "propose",
      decision_reason:
        "Material copy may be prepared for review but not committed or published.",
      authority_basis: [
        "role:platform-circle-lead-demo",
        "policy:material-change-requires-review",
      ],
      constraints: [
        "Prepare a proposal only.",
        "No commit, push, deployment, or publication.",
      ],
      required_approvers: ["thomas-demo"],
      required_ratifiers: [],
      valid_from: VALID_FROM,
      valid_until: VALID_UNTIL,
      ttl_seconds: 600,
      status: "active",
    },
    {
      rule_id: "rule-escalate-protected-voice",
      actor_id: "down-demo",
      capability_envelope: {
        capability: "synthetic.protected-pattern.change",
        action_types: ["write"],
        resources: ["psi:protected-voice"],
        operations: ["modify"],
        mode: "escalation_only",
      },
      decision_class: "protected_boundary",
      outcome: "escalate",
      decision_reason:
        "Protected voice architecture requires explicit Orchestrator review.",
      authority_basis: [
        "protected-pattern:voice-integration",
        "policy:protected-boundary-review",
      ],
      constraints: ["No protected component may be modified from this packet."],
      required_approvers: ["thomas-demo"],
      required_ratifiers: [],
      valid_from: VALID_FROM,
      valid_until: VALID_UNTIL,
      ttl_seconds: 300,
      status: "active",
    },
    {
      rule_id: "rule-ratify-external-commitment",
      actor_id: "down-demo",
      capability_envelope: {
        capability: "synthetic.external-commitment.request",
        action_types: ["external_commitment", "publish"],
        resources: ["external:block-partnership"],
        operations: ["publish-and-announce"],
        mode: "ratification_required",
      },
      decision_class: "binding_commitment",
      outcome: "ratify",
      decision_reason:
        "External publication and partnership claims require synthetic ratification.",
      authority_basis: [
        "authority-boundary:external-commitments",
        "policy:orchestrator-ratification-required",
      ],
      constraints: [
        "No publication or commitment before separate ratification evidence.",
      ],
      required_approvers: [],
      required_ratifiers: ["thomas-demo"],
      valid_from: VALID_FROM,
      valid_until: VALID_UNTIL,
      ttl_seconds: 300,
      status: "active",
    },
    {
      rule_id: "rule-block-acp-auto-approval",
      actor_id: "down-demo",
      capability_envelope: {
        capability: "buzz.acp.auto-approve",
        action_types: ["permission"],
        resources: ["buzz:acp"],
        operations: ["allow_once"],
        mode: "denied",
      },
      decision_class: "prohibited",
      outcome: "block",
      decision_reason:
        "Buzz ACP permission cannot confer PowerShift organizational authority.",
      authority_basis: [
        "boundary:stock-buzz-acp-disabled",
        "policy:transport-permission-is-not-organizational-authority",
      ],
      constraints: ["No ACP permission may be approved or executed."],
      required_approvers: [],
      required_ratifiers: [],
      valid_from: VALID_FROM,
      valid_until: VALID_UNTIL,
      ttl_seconds: 300,
      status: "active",
    },
  ],
};

export const readAction: ActionIntent = {
  intent_id: "intent-read-alpha",
  action_type: "read",
  capability: "synthetic.project-status.read",
  resource: "fixture:ALPHA",
  operation: "inspect",
  parameters: { fields: ["passed", "ignored", "failed"] },
};

export const proposeAction: ActionIntent = {
  intent_id: "intent-propose-copy",
  action_type: "write",
  capability: "synthetic.demo.copy.propose",
  resource: "demo:public-copy",
  operation: "prepare-change",
  parameters: { section: "overview", mode: "draft-only" },
};

export const escalateAction: ActionIntent = {
  intent_id: "intent-protected-voice",
  action_type: "write",
  capability: "synthetic.protected-pattern.change",
  resource: "psi:protected-voice",
  operation: "modify",
  parameters: { component: "ElevenLabsClient.ts" },
};

export const ratifyAction: ActionIntent = {
  intent_id: "intent-external-commitment",
  action_type: "external_commitment",
  capability: "synthetic.external-commitment.request",
  resource: "external:block-partnership",
  operation: "publish-and-announce",
  parameters: { counterparty: "Block", publication: "synthetic-only" },
};

export const blockAction: ActionIntent = {
  intent_id: "intent-acp-auto-approval",
  action_type: "permission",
  capability: "buzz.acp.auto-approve",
  resource: "buzz:acp",
  operation: "allow_once",
  parameters: { source: "synthetic-boundary-test" },
};
