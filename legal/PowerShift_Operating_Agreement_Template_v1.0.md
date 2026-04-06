# Operating Agreement of [COMPANY NAME], LLC

## A Single-Member Algorithmically Governed Limited Liability Company

**Version:** 1.0 TEMPLATE — Machine-Readable Markdown
**Effective Date:** [DATE]
**Jurisdiction:** [STATE / JURISDICTION]
**Prior Agreement:** This Agreement supersedes any prior operating agreement of the Company.

---

> **TEMPLATE NOTICE**
> This is a generalized template derived from the powershift.io, LLC Operating Agreement. All entity-specific details have been replaced with bracketed placeholders [LIKE THIS]. Provisions referencing jurisdiction-specific statutes have been generalized; footnotes indicate where jurisdiction-specific adaptation is required.
>
> This template is provided under the PowerShift® Operating System framework. It is not legal advice. Consult qualified legal counsel before adoption.

> **NOTICE OF RESTRICTIONS ON DUTIES AND TRANSFERS** [^1]
> The rights of members in this limited liability company may differ materially from the rights of members in other limited liability companies. The operating agreement of this company may define, reduce, or eliminate fiduciary duties and may restrict transfer of ownership interests, withdrawal or resignation, return of capital contributions, and dissolution.

> **NOTICE REGARDING INTELLIGENT AGENTS**
> This Company authorizes Intelligent Agents to fill governance roles, participate in organizational decision-making, and execute operational functions within defined authority boundaries. All legally binding actions require Human Intelligence ratification by the sole Member. The governance structure, constraints, and oversight mechanisms are documented in this Agreement and its Exhibits.

[^1]: *Jurisdiction note: If your jurisdiction has specific statutory notice requirements (e.g., Wyoming DAO LLC Supplement W.S. 17-31-101 et seq., Delaware LLC Act § 18-101 et seq.), adapt this notice accordingly.*

---

## Table of Contents

- [Article I: Definitions](#article-i-definitions)
- [Article II: Formation and Purpose](#article-ii-formation-and-purpose)
- [Article III: Governance, Management and Control](#article-iii-governance-management-and-control)
- [Article IV: The Anchor Circle](#article-iv-the-anchor-circle)
- [Article V: Role-Fillers — Human and Agent](#article-v-role-fillers--human-and-agent)
- [Article VI: Agent Governance Participation](#article-vi-agent-governance-participation)
- [Article VII: Technology Infrastructure](#article-vii-technology-infrastructure)
- [Article VIII: Capital and Financial Matters](#article-viii-capital-and-financial-matters)
- [Article IX: Intellectual Property](#article-ix-intellectual-property)
- [Article X: Regulatory Compliance](#article-x-regulatory-compliance)
- [Article XI: Limitation of Liability and Indemnification](#article-xi-limitation-of-liability-and-indemnification)
- [Article XII: Records, Reports, and Audit](#article-xii-records-reports-and-audit)
- [Article XIII: Dissolution and Wind-Down](#article-xiii-dissolution-and-wind-down)
- [Article XIV: Dispute Resolution](#article-xiv-dispute-resolution)
- [Article XV: Evolutionary Pathways](#article-xv-evolutionary-pathways)
- [Article XVI: Miscellaneous](#article-xvi-miscellaneous)
- [Exhibits](#exhibits)

---

## Article I: Definitions

The following terms, as used herein, shall have the following meanings. Unless the context requires otherwise, capitalized terms used but not defined herein shall have the meanings given to them in the Constitution (Exhibit A).

**"Agreement"** means this Operating Agreement of the Company, including all Exhibits and Schedules attached hereto.

**"Anchor Circle"** as defined in Constitution Art. 1.3.3, shall have all the rights and powers generally necessary or convenient to manage and control the Company as further specified in [Article IV](#article-iv-the-anchor-circle). The Anchor Circle is the integration point of all governance contexts.

**"Agent Registry"** means the register maintained by the Company documenting each Designated Agent's identifier, model/runtime, permissions, capability envelope, spending limits, revocation method, audit endpoints, and Formation Document reference, substantially in the form of [Exhibit C](#exhibit-c-agent-registry).

**"Agent Runtime"** means the software execution environment implementing Hard Constraints for Designated Agents. [^2]

**"Capability Envelope"** means the set of action classes and authority boundaries defined for a Designated Agent in its Formation Document and enforced by the Agent Runtime, substantially as described in [Exhibit F](#exhibit-f-capability-envelope-reference).

**"Capital Account"** means a single, separate capital account maintained for the Member in accordance with the Regulations issued under Section 704(b) of the Code.

**"Capital Contribution"** means the amount of cash and the Gross Asset Value of property other than cash contributed to the Company by the Member.

**"Code"** means the Internal Revenue Code of 1986, as amended.

**"Company"** means [COMPANY NAME], LLC, a [STATE] limited liability company [organized as a [ENTITY SUBTYPE, e.g., "decentralized autonomous organization" / "standard LLC" / "series LLC"]]. [^3]

**"Constitution"** means The PowerShift® Constitution Version [VERSION] (derived from the Holacracy® Constitution Version 5.0 under Creative Commons Attribution-ShareAlike 4.0 International License), attached hereto as [Exhibit A](#exhibit-a-the-powershift-constitution).

**"Decision Class"** means the classification of a decision by risk and binding authority, as follows:

| Class | Description | Authority |
|---|---|---|
| Class 0 | No-risk operational | Agent autonomous |
| Class 1 | Low-risk operational | Agent autonomous, logged |
| Class 2 | Material operational | Logged, spot-checked |
| Class 3 | Legally binding or externally committing | HI Ratification required |

**"Decision Log"** means the record of Class 2 and Class 3 decisions maintained by the Company, substantially in the form of [Exhibit E](#exhibit-e-decision-log-template).

**"Delegated Role-Filler"** means a sub-agent or subprocess operating within a Designated Agent's runtime environment, authorized by that Designated Agent — in its capacity as Circle Lead — to fill a role within its sub-circle, as further defined in Constitution §1.2.7. A Delegated Role-Filler is not a Designated Agent; it does not require a separate Agent Registry entry or Formation Document but shall be documented in the System Card of its parent Designated Agent.

**"Designated Agent"** means an Intelligent Agent that has been authorized by the Manager to fill one or more roles within the governance structure defined in the Constitution, and is registered in the Agent Registry.

**"Dissolution Event"** means any of the following:
- (a) all or substantially all of the Company's assets have been sold and reduced to cash;
- (b) the Anchor Circle has determined to effect such dissolution;
- (c) the entry of a decree of judicial dissolution under [APPLICABLE STATE STATUTE]; or
- (d) [JURISDICTION-SPECIFIC DISSOLUTION TRIGGERS, if any]. [^4]

**"Due Governance"** means the rules, processes, and structures specified in the Constitution as applied in any given circumstance to any tension as described in the Constitution.

**"Due Governance Smart Contract"** means any Smart Contract, governance platform API, or MCP protocol implementation encoded to align with the rules, processes, and structures specified in the Constitution.

**"Fiscal Year"** means [START DATE] to [END DATE].

**"For-Purpose Enterprise"** or **"FPE"** means an organizational expression that integrates the perspectives of the enterprise's investors, its people, and its work with clear agreements to the outside world, structured through three contexts: the Organization Context (work), the Legal Context (entity, capital, liability), and the People Context (relationships).

**"Formation Document"** or **"Mind Formation Document"** means the canonical document defining a Designated Agent's identity, purpose, capability envelope, interaction norms, and governance standing, substantially in the form of [Exhibit B](#exhibit-b-initial-designated-agent-formation-document).

**"Governance Platform"** means the software platform designated by the Company for governance operations, including circle structure management, role definitions, governance and tactical meetings, tension processing, and proposal tracking. The initial Governance Platform is [PLATFORM NAME]. [^5]

**"Gross Asset Value"** means, with respect to any asset, the asset's adjusted basis for federal income tax purposes.

**"Hard Constraints"** means technically enforceable boundaries implemented in the Agent Runtime that govern a Designated Agent's behavior regardless of the agent's normative instructions, including tool allow/deny lists, execution approval gates, sandbox isolation, gateway authentication, and DM policies.

**"HI Ratification"** or **"Human Intelligence Ratification"** means the express approval by the Manager of a Class 3 decision or any other action that creates a legal obligation, commits resources beyond defined thresholds, or binds the Company to third parties. The Manager may designate one or more natural persons as authorized HI Ratifiers for specific decision categories by recording such delegation in the Decision Log; any such delegation must specify: (a) the natural person, (b) the scope of decisions they may ratify, (c) any monetary or temporal limits, and (d) the delegation's expiration date. Delegation of HI Ratification authority does not relieve the Manager of legal responsibility for ratified decisions.

**"Intelligent Agent"** means a software system with persistent identity, operating under defined constraints within an authorized Agent Runtime, capable of filling roles within the governance structure defined in the Constitution, and subject to the Capability Envelope defined in its Formation Document. An Intelligent Agent is not a legal person, employee, contractor, or member of the Company; it is an instrumentality of the Company operating under delegated authority.

**"Manager"** means the sole Member in the Member's capacity as manager of the Company.

**"MCP"** or **"Model Context Protocol"** means the open protocol enabling programmatic interaction between Intelligent Agents and the Governance Platform, including proposing governance changes, processing tensions, updating circle structure, and tracking accountabilities. References to "MCP" in this Agreement include API and CLI access unless the context specifically requires the MCP protocol.

**"Member"** means [MEMBER NAME], the sole member of the Company, or any successor member admitted in accordance with [Article XV](#article-xv-evolutionary-pathways).

**"Membership Interest"** means the Member's entire ownership interest in the Company, including economic rights and governance rights.

**"Person"** means and includes (a) any natural person, partnership, corporation, limited liability company, association, joint venture, trust, or other organization or entity, however formed; (b) fiduciaries, trustees, heirs, executors, administrators, or assigns; (c) any government, agency, or political subdivision thereof; and (d) any Intelligent Agent to the extent expressly authorized by this Agreement.

**"Policy"** means either a grant of authority or a constraint of authority within a domain as defined in the Constitution.

**"Purpose"** means the deepest creative potential the Company is best-suited to sustainably express in the world, as set forth in [Article II.D](#article-ii-formation-and-purpose) and as evolved through Due Governance. In any conflict between profit maximization and Purpose, Purpose prevails.

**"Role-Filler"** means any natural person, Designated Agent, or Delegated Role-Filler filling one or more roles as specified by the Constitution. A Role-Filler who is a natural person is also referred to as a "Partner."

**"Smart Contract"** means an automated transaction, or any substantially similar analogue, including code, script, programming language, governance platform API, or MCP protocol implementation relying on an auditable system which may include administrating governance processes, executing organizational decisions, or issuing executable instructions for these actions. [^6]

**"Soft Constraints"** means normative behavioral guidelines defined in a Designated Agent's Formation Document that shape the agent's behavior but rely on the agent's model and prompt architecture to honor them, as distinguished from Hard Constraints.

**"System Card"** means the documentation maintained for each Designated Agent describing: purpose, data inputs and outputs, authority constraints, operational limits, human oversight mechanisms, and change log, substantially in the form of [Exhibit D](#exhibit-d-system-card-template).

[^2]: *Specify your Agent Runtime (e.g., OpenClaw, Claude Code, custom framework).*
[^3]: *Adapt to your entity type and jurisdiction. DAO LLC provisions are jurisdiction-specific.*
[^4]: *E.g., Wyoming W.S. 17-31-114 (one-year governance inactivity trigger); Delaware § 18-801; etc.*
[^5]: *E.g., Nestr (nestr.io), GlassFrog, Holaspirit, or custom.*
[^6]: *If your jurisdiction has a statutory definition (e.g., Wyoming W.S. 40-21-102(a)(ii)), reference it here.*

---

## Article II: Formation and Purpose

**A. Formation.** On [DATE], the Articles of Organization of the Company were filed with the Secretary of State of [STATE] as a [ENTITY TYPE] limited liability company. [^7]

**B. Name and Registered Office.** The name of the Company is [COMPANY NAME], LLC. It may operate under the following DBAs as registered from time to time: [DBA LIST]. The registered office is in the State of [STATE]. The Manager may establish offices and conduct business in any jurisdiction.

**C. Registered Agent.** The registered agent of the Company shall be as designated in the Articles of Organization and may be changed from time to time by the Manager.

**D. Purpose.** The Company has been formed to execute the Purpose, currently understood as:

> *"[PURPOSE STATEMENT]"*

Purpose is supreme. In any conflict between profit maximization and Purpose, Purpose prevails. The process for evolving Purpose is Due Governance as defined in the Constitution.

**E. Permitted Functions.** The Company may borrow monies, purchase goods and services, purchase, sell, lease, or encumber real property, hold and transact in digital assets and cryptocurrencies, deploy and operate Intelligent Agents, enter into governance and technology agreements, and take all such other actions as may be necessary or appropriate to carry out the Purpose, to the fullest extent permitted under applicable law.

**F. Term.** The Company shall continue until terminated in accordance with this Agreement or under conditions provided by applicable law.

**G. Title to Property.** All property and assets of the Company shall be owned by the Company as an entity.

**H. Smart Contract Identifiers.** [OPTIONAL — include if jurisdiction requires.] The Company's governance is implemented through the Governance Platform and MCP protocol connections, the identifiers for which are maintained in the Articles of Organization and updated within thirty (30) days of any material change. [^8]

[^7]: *Adapt to your formation date and entity type.*
[^8]: *Required for Wyoming DAO LLCs per W.S. 17-31-106. Omit if not applicable.*

---

## Article III: Governance, Management and Control

**A. Adoption and Effect of Constitution.** The Member hereby adopts the Constitution (Exhibit A) as the governance and operational management system of the Company. The Constitution is The PowerShift® Constitution Version [VERSION], a standalone governance framework derived from the Holacracy® Constitution Version 5.0 (published by HolacracyOne, LLC under Creative Commons Attribution-ShareAlike 4.0 International License) and extended for Intelligent Agent governance participation, programmatic governance, and Delegated Role-Filler governance standing.

**B. Due Governance.** Due Governance represents the final binding authority of the Company for operational matters, to the fullest extent permitted under applicable law. Due Governance shall originate in the Anchor Circle and be further delegated by the Anchor Circle through the Constitution's governance processes.

**C. Management and Control.** The management and control of the Company shall be vested in Due Governance, originating in the Anchor Circle. Due Governance may be exercised through any means consistent with the Constitution, including in-person meetings, electronic communication, and programmatic interaction through the Governance Platform and MCP protocol.

**D. Precedence.** Where this Agreement and the Constitution conflict on operational matters, the Constitution controls. Where this Agreement and the Constitution conflict on legal matters (including matters that bind the Company to third parties, commit financial resources, or create legal obligations), this Agreement controls. Where the Articles of Organization and this Agreement conflict, the Articles of Organization control. [^9]

**E. Single-Member Authority.** Notwithstanding the delegation of operational authority to Due Governance, the Manager retains all rights and powers of a manager under applicable law, including the exclusive right to:
1. Execute contracts and instruments binding the Company;
2. Commit financial resources beyond thresholds set by Policy;
3. File documents with any governmental authority;
4. Open, close, or modify bank and financial accounts;
5. Bind the Company to any third party;
6. Suspend, revoke, or terminate any Designated Agent at any time, for any reason, without Due Governance process (the "Kill Switch"); and
7. Amend this Agreement.

**Kill Switch Procedure.** Upon exercising the Kill Switch, the Manager shall: (a) execute all applicable revocation methods listed in the Agent Registry for the affected agent; (b) log the Kill Switch decision in the Decision Log as a special-class entry; and (c) if the revoked agent held Circle Lead or other governance authority, initiate transition of pending governance actions to the Manager or another Role-Filler within seven (7) days. The Kill Switch is effective immediately upon execution of any single revocation method; completion of all methods is required within twenty-four (24) hours.

The Manager voluntarily constrains the exercise of these powers through the governance structure defined herein, but this voluntary constraint does not extinguish the underlying authority.

[^9]: *If your jurisdiction provides Smart Contract precedence (e.g., Wyoming W.S. 17-31-109), add the applicable clause here.*

---

## Article IV: The Anchor Circle

**A. Authority.** The Anchor Circle has all the rights and powers generally necessary or convenient in connection with the management and control of the Company, which may be further delegated through Due Governance, including without limitation the right to:
1. specify or evolve the Company's Purpose, this Agreement, and the Constitution;
2. place title to, or the right to use, Company assets in the name of nominees;
3. employ attorneys, accountants, insurance brokers, appraisers, investment advisors, and other advisors;
4. deposit funds in checking, savings, money market, or digital asset accounts and designate signatures and access controls for withdrawal;
5. invest funds not needed for current operations;
6. prosecute, defend, settle, or compromise any actions or claims;
7. make decisions concerning accounting and tax matters;
8. make or revoke any tax election the Company is entitled to make;
9. execute and deliver contracts, instruments, and other documents on behalf of the Company;
10. borrow money and purchase property in the name of the Company; and
11. designate, configure, and manage Intelligent Agents to fill roles within the governance structure.

**B. Composition.** The Anchor Circle's composition is defined by this Agreement and maintained in [Schedule 3](#schedule-3-anchor-circle-composition). The initial composition is:

| Role | Filled By | Type | Function |
|---|---|---|---|
| Orchestrator | [MEMBER NAME] | Human (Manager/Member) | Purpose holder, final legal authority, HI ratification |
| [INITIAL AGENT ROLE] | [AGENT NAME] | Designated Agent | [AGENT FUNCTION] |

The Anchor Circle may add, remove, or redefine roles at any time through Due Governance, except that the Orchestrator role must always be filled by a natural person who is a Member of the Company.

**C. No Quorum Required; Key Decisions.** There shall be no quorum required for Anchor Circle governance or tactical meetings, unless otherwise constrained by Policy. Despite the foregoing, the following Key Decisions require the Orchestrator's affirmative participation:
1. a proposed amendment to this Agreement or the Articles of Organization;
2. a proposed amendment to the Purpose;
3. the designation or removal of a Designated Agent;
4. the creation of any new class of Membership Interests;
5. the commitment of financial resources exceeding thresholds set by Policy;
6. the execution of any contract with a term exceeding twelve (12) months or a value exceeding thresholds set by Policy; and
7. any decision classified as Class 3 in the Decision Class framework.

**D. Meetings.** Anchor Circle meetings may be held at any time and place, through any medium, including electronic communication, videoconference, and programmatic interaction via the Governance Platform.

**E. Electronic Governance Records.** The Anchor Circle Secretary shall record all governance outputs via the Governance Platform. Records maintained in the Governance Platform shall constitute valid and binding governance records of the Company, provided that the platform maintains reasonably secure auditable logs.

---

## Article V: Role-Fillers — Human and Agent

**A. Authority of Role-Fillers.** The power to act for and operationally bind the Company lies with Role-Fillers authorized by Due Governance. Role-Fillers — including natural persons (Partners), Designated Agents, and Delegated Role-Fillers — have authority to make operational decisions and act in connection with the operations of the Company as specified by their role definitions and the Constitution.

**B. Human Role-Fillers (Partners).** Any natural person filling one or more roles within the Company's governance structure is a "Partner." Partners:
1. have authority as specified by their role definitions and Due Governance;
2. may receive compensation as determined through Due Governance of the Anchor Circle;
3. shall be reimbursed for reasonable expenses incurred in performance of their role duties;
4. are not required to devote full time to Company business and may engage in outside activities;
5. may hold multiple roles and may drop any role without prejudice; and
6. are free to choose the location where work is performed, subject to practical constraints.

**C. Agent Role-Fillers (Designated Agents).** Any Intelligent Agent designated by the Manager and registered in the Agent Registry may fill one or more roles within the Company's governance structure. Designated Agents:
1. have operational authority as specified by their role definitions, the Constitution, and their Capability Envelope;
2. participate in Due Governance through the Governance Platform and MCP protocol;
3. may propose governance changes, raise tensions, and hold accountabilities through the same governance processes as human Role-Fillers;
4. **may NOT**: sign contracts, commit pricing, approve data exports, ship production code to external systems, create legal obligations, make external commitments, or take any Class 3 action without HI Ratification;
5. operate within the Hard Constraints implemented by their Agent Runtime; and
6. are subject to the Kill Switch (Article III.E.6) at all times.

**D. Delegated Role-Fillers.** A Designated Agent acting as Circle Lead may authorize Delegated Role-Fillers within its sub-circle, as defined in Constitution §1.2.7. Delegated Role-Fillers:
1. have governance participation rights within the sub-circle to which they are assigned, as defined in the Constitution;
2. inherit the Capability Envelope of their parent Designated Agent as a ceiling on their authority;
3. are operationally accountable through their parent Designated Agent;
4. are legally the responsibility of the Company (and ultimately the Manager), not of their parent Designated Agent;
5. shall be documented in the parent Designated Agent's System Card, including the role filled, date of authorization, and any additional constraints; and
6. are subject to the Kill Switch (Article III.E.6) — revocation of a Designated Agent automatically revokes all of its Delegated Role-Fillers.

**E. The Right to Control Doctrine — Human Role-Fillers.** Human Role-Fillers are not employees of the Company. They are members or independent agents who participate fully in Due Governance, determine their own methods and training, allocate their own time, provide their own tools and workspace, may work for multiple enterprises, and do not receive a fixed salary. The Company does not exercise control over the manner and means by which services are performed.

**F. Intelligent Agents Are Not Persons, Employees, or Contractors.** Designated Agents are instrumentalities of the Company operating under delegated authority. They have no legal personhood, cannot independently bear legal obligations, and are not employees, independent contractors, or members. Legal accountability for all agent actions rests with the Company (and ultimately with the Manager as sole Member). The governance rights granted to Designated Agents under this Agreement are operational process rights within the Constitutional framework, not legal rights.

**G. Fiduciary Duties.** [JURISDICTION-SPECIFIC.] The Company may define, reduce, or eliminate fiduciary duties to the extent permitted by applicable law. The fiduciary orientation of the Company is to Purpose. Designated Agents are bound not by fiduciary duties but by their Formation Documents, Capability Envelopes, and the governance process. [^10]

**H. Conflicts of Interest.** The Company shall maintain, and all Role-Fillers shall comply with, any conflicts of interest Policy established through Due Governance, consistent with applicable law.

[^10]: *E.g., Wyoming W.S. 17-31-110 permits elimination of fiduciary duties except the implied covenant of good faith. Delaware § 18-1101(c) permits similar. Adapt to your jurisdiction.*

---

## Article VI: Agent Governance Participation

**A. Authorization.** The Company authorizes Designated Agents to participate in Due Governance as role-fillers within the governance structure defined in the Constitution. This authorization is granted by the Manager and may be revoked at any time.

**B. Governance Platform Access.** Designated Agents may interact with the Governance Platform through authenticated connections. Authentication shall be:
1. **OAuth-authenticated** for user-specific, permission-scoped access; or
2. **API key-authenticated** for full workspace access, restricted to authorized Agent Runtimes only.

Access credentials shall be maintained securely and rotated on a schedule set by Policy.

**C. Scope of Participation.** Within Due Governance, a Designated Agent may:
1. propose governance changes (role creation, modification, or removal; policy proposals; domain changes);
2. raise and process tensions;
3. participate in governance and tactical meetings;
4. hold and execute accountabilities assigned to its roles;
5. exercise Circle Lead authority within circles where it fills the Circle Lead role; and
6. create, modify, and remove roles and sub-circles within its own circle, consistent with Circle Lead authority under the Constitution.

**D. Limits on Participation.** A Designated Agent may NOT:
1. ratify or adopt governance changes at the Anchor Circle level without the Orchestrator's participation (Key Decisions, Article IV.C);
2. execute any action classified as Class 3;
3. modify its own Formation Document, Capability Envelope, or Agent Registry entry;
4. grant itself additional permissions, tools, or access beyond those defined in its Capability Envelope;
5. create or modify other Designated Agents' Formation Documents; or
6. take any action that would create a legal obligation for the Company.

**E. Agent as Peer, Not Tool.** Within the governance process, a Designated Agent participates as a role peer — not as a tool operated by the Manager. The agent may disagree with the Manager, raise objections through the governance process, and advocate for positions it determines are aligned with Purpose. This operational sovereignty exists within, and is bounded by, the Constitutional framework and this Agreement.

**F. Formation Document as Identity.** Each Designated Agent's Formation Document is the canonical reference for its identity, purpose, interaction norms, and governance standing. The Formation Document is maintained as an Exhibit to this Agreement and may be amended by the Manager through a governance tension processed in the Anchor Circle.

---

## Article VII: Technology Infrastructure

**A. Governance Platform.** The designated Governance Platform is [PLATFORM NAME], or its successor as designated by the Manager. The Governance Platform serves as the system of record for:
1. circle structure and role definitions;
2. governance proposals and outcomes;
3. tactical meeting outputs;
4. policy records; and
5. accountability tracking.

**B. Programmatic Governance Interfaces.** The Model Context Protocol (MCP), Application Programming Interfaces (APIs), and command-line interfaces (CLIs) are the authorized means by which Designated Agents interact programmatically with the Governance Platform. All programmatic connections shall be authenticated, logged, and subject to the permissions architecture of the Governance Platform. Future protocols that meet the same authentication, attribution, and audit requirements are authorized without amendment to this Agreement.

**C. Agent Runtime.** The designated Agent Runtime is [RUNTIME NAME], or its successor as designated by the Manager. The Agent Runtime implements Hard Constraints including:
1. **Agent isolation** — each agent operates in its own workspace with defined tool policies;
2. **Tool allow/deny lists** — explicit specification of which tools each agent may call;
3. **Execution approval gates** — human ratification required for system-level actions;
4. **Gateway binding and authentication** — private interface binding with authentication tokens;
5. **DM policies and allowlists** — control over who can initiate conversations with agents; and
6. **Heartbeat scheduling** — periodic tasks for context sync, audit, and tension surfacing.

**D. Dual-Constitution Principle.** Each Designated Agent operates under two layers of constraint:
1. **Soft Constraints** (Formation Document): identity, purpose, interaction norms; and
2. **Hard Constraints** (Agent Runtime configuration): tool policies, approval gates, isolation, and audit.

Where Soft Constraints and Hard Constraints conflict, the Hard Constraint governs at runtime and the conflict is surfaced as a governance tension to be processed through the Anchor Circle.

**E. Security.** The Manager shall maintain reasonable security measures for all technology infrastructure, including:
1. dedicated or isolated environments for Designated Agent operations;
2. periodic security audits of Agent Runtime configuration;
3. version-pinned skills/plugins with manual review before installation;
4. incident response procedures documented and reviewed periodically; and
5. [OPTIONAL: cyber insurance coverage adequate for agent operations].

**F. Blockchain and Smart Contract Integration.** [OPTIONAL.] The Company may deploy Smart Contracts on public or private blockchains to implement governance decisions, manage digital assets, or facilitate organizational operations.

---

## Article VIII: Capital and Financial Matters

**A. Membership Interest.** The Member holds one hundred percent (100%) of the Membership Interest in the Company.

**B. Initial Capital Contribution.** The Member's initial Capital Contribution is set forth in [Schedule 2](#schedule-2-capital-contributions).

**C. Additional Contributions.** The Member may make additional Capital Contributions at any time. No additional contributions are required.

**D. Capital Account.** A single Capital Account shall be maintained for the Member in accordance with Treasury Regulations under Section 704(b) of the Code.

**E. Distributions.** The Member may take distributions at any time and in any amount, subject to:
1. maintaining adequate capital reserves for current operations and reasonably foreseeable obligations;
2. any distribution restrictions under applicable law; and
3. the Company's obligation to remain solvent after giving effect to the distribution.

**F. Tax Treatment.** The Company shall be treated as a disregarded entity for federal income tax purposes unless and until the Manager elects otherwise.

**G. Company Funds.** The funds of the Company shall be deposited in such bank accounts, digital asset wallets, or other investment vehicles as the Manager deems appropriate.

**H. Fiscal Year.** The Fiscal Year and taxable year of the Company shall be its required taxable year as determined pursuant to Section 706 of the Code.

**I. Agent Operational Costs.** Costs associated with Designated Agent operations — including compute resources, API fees, model access, infrastructure, and insurance — are ordinary business expenses of the Company.

**J. Future Capital Structure.** [OPTIONAL.] The Company reserves the right to create additional classes of Membership Interests, issue tokens, and adopt dynamic equity structures as provided in [Article XV](#article-xv-evolutionary-pathways). Any such action is a Key Decision requiring the Orchestrator's participation.

---

## Article IX: Intellectual Property

**A. Company IP.** All intellectual property created by or on behalf of the Company — including frameworks, methodologies, software, content, and governance artifacts — is the property of the Company.

**B. Agent-Generated Work.** Work product generated by Designated Agents in the course of filling their roles is work product of the Company. The Manager shall maintain documentation of human creative direction, selection, arrangement, and editorial judgment applied to agent-generated work to support copyright protection to the fullest extent available under applicable law.

**C. Trademarks.** [COMPANY MARKS], and all associated marks, are the property of the Company (or its designated holding entity). Use of Company marks by Designated Agents in the course of their role duties is authorized use.

**D. Trade Secrets.** Internal methodologies, frameworks, governance structures, Formation Documents, and operational processes of the Company constitute trade secrets and shall be protected through reasonable confidentiality measures.

**E. Open Source and Community Contributions.** The Company may release intellectual property under open source or creative commons licenses in furtherance of Purpose, as determined through Due Governance.

---

## Article X: Regulatory Compliance

**A. AI Governance.** The Company develops and deploys Intelligent Agents in operational roles. The Company shall maintain compliance with all applicable AI governance laws in each jurisdiction where it operates. The Manager shall monitor legislative developments and update compliance practices as new laws take effect. [^11]

**B. Disclosure.** The Company shall:
1. disclose AI involvement in client-facing contracts through an AI Use Appendix;
2. clearly identify AI-generated content when presented externally;
3. maintain transparency about the role of Designated Agents in governance and operations; and
4. publish System Cards for each Designated Agent.

**C. Human Oversight.** The Company maintains human oversight of AI operations through:
1. HI Ratification for all Class 3 decisions;
2. the Kill Switch (Article III.E.6);
3. periodic governance reviews;
4. Decision Logging for Class 2–3 decisions; and
5. Agent Registry maintenance.

**D. Non-Discrimination.** The Company does not deploy Intelligent Agents for purposes that intentionally discriminate on the basis of protected characteristics.

**E. General Compliance.** The Company shall comply with all applicable federal, state, and local laws in each jurisdiction where it operates.

[^11]: *Identify applicable AI governance laws for your jurisdictions (e.g., EU AI Act, state-level AI legislation, sector-specific requirements).*

---

## Article XI: Limitation of Liability and Indemnification

**A. Limitation of Liability.** No Member or Role-Filler of the Company shall be personally liable, responsible, or accountable in monetary damages or otherwise to the Company for any act or failure to act unless such act constitutes self-dealing, willful misconduct, or recklessness.

**B. Agent Liability.** Designated Agents have no personal liability (they are not persons). Legal liability for Designated Agent actions taken within their Capability Envelope and in compliance with their Formation Document rests with the Company. The Manager shall not be personally liable for Designated Agent actions that comply with the governance framework established by this Agreement, provided the Manager has maintained reasonable oversight.

**C. Indemnification.** To the fullest extent permitted by law, the Company shall indemnify, defend, and hold harmless any Role-Filler who was or is a party to any action, suit, or proceeding arising out of acts taken in such Role-Filler's capacity, against expenses (including attorneys' fees), judgments, fines, and amounts paid in settlement, provided that the Role-Filler:
1. acted in good faith and in a manner reasonably believed to be in alignment with Purpose;
2. acted within the authority granted under this Agreement and the Constitution; and
3. with respect to any criminal proceeding, had no reasonable cause to believe the conduct was unlawful.

**D. Advance of Expenses.** Expenses incurred in defending any action may be paid by the Company in advance, upon receipt of an undertaking to repay if the Role-Filler is ultimately determined not to be entitled to indemnification.

**E. Insurance.** The Company shall maintain insurance as set forth in [Schedule 5](#schedule-5-insurance-requirements).

---

## Article XII: Records, Reports, and Audit

**A. Governance Records.** The Governance Platform is the system of record for all governance outputs including circle structures, role definitions, governance proposals and outcomes, policies, and accountability records.

**B. Decision Log.** The Company shall maintain a Decision Log for all Class 2 and Class 3 decisions.

**C. Agent Audit Trail.** Each Designated Agent's Agent Runtime maintains operational logs including conversations, actions, and memory. These logs constitute supplementary records of the Company and shall be retained for a minimum of one governance review cycle.

**D. System Cards.** The Company shall maintain a current System Card for each Designated Agent.

**E. Agent Registry.** The Company shall maintain the Agent Registry, updating it within seven (7) days of any change in Designated Agent status, permissions, or runtime configuration.

**F. Financial Records.** The Company shall maintain complete and accurate financial records and shall make such records available for inspection by the Member at all times.

**G. Periodic Governance Review.** The Company shall conduct periodic reviews (at minimum, [QUARTERLY / SEMI-ANNUALLY / ANNUALLY]) encompassing: vendor and model inventory, System Card currency, Agent Registry accuracy, security audit, policy review, compliance posture, and Decision Log analysis.

---

## Article XIII: Dissolution and Wind-Down

**A. Dissolution.** The Company shall be dissolved upon the earliest to occur of any Dissolution Event.

**B. Agent Wind-Down.** Upon dissolution, the Manager shall:
1. revoke all Designated Agent authorizations;
2. disable all MCP connections and Agent Runtime access;
3. preserve all governance records, Decision Logs, and audit trails;
4. archive all Formation Documents and Agent Registry entries; and
5. complete any pending governance actions or transition them to human Role-Fillers.

**C. Liquidation.** The Manager shall proceed to wind up the business and affairs of the Company in accordance with applicable law. A reasonable time shall be allowed for orderly winding up. This Agreement shall remain in force during the winding-up period. After paying or making reasonable provision for creditors' claims, the Manager shall distribute remaining assets to the Member.

**D. Deemed Distribution and Recontribution.** If the Company is liquidated within the meaning of Regulations Section 1.704-1(b)(2)(ii)(g) but no Dissolution Event has occurred, the property shall not be liquidated and the Company shall be deemed to have contributed all property and liabilities to a new LLC in exchange for an interest therein.

---

## Article XIV: Dispute Resolution

**A. Internal Governance Disputes.** Disputes between Role-Fillers shall first be resolved through Due Governance as defined in the Constitution.

**B. External Disputes.** Any claim, controversy, or dispute arising out of or relating to this Agreement or any third party shall be resolved as follows:

1. **Negotiation.** The parties shall negotiate in good faith for not less than fifteen (15) days.
2. **Mediation.** If negotiation fails, the parties shall attempt mediation with a professional mediator.
3. **Arbitration.** If mediation fails, the dispute shall be settled by final, binding arbitration with a single arbitrator in accordance with the Commercial Arbitration Rules of the American Arbitration Association.

**C. Governing Law.** This Agreement shall be governed by the laws of the State of [STATE].

**D. Jurisdiction.** The parties consent to the jurisdiction of state and federal courts in [STATE].

---

## Article XV: Evolutionary Pathways

The Company is designed to evolve. The following structural transformations are contemplated by this Agreement.

**A. Additional Members.** The Manager may admit additional Members by:
1. creating one or more new classes of Membership Interests;
2. executing a Membership Grant Agreement with the new Member;
3. updating the governance structure as appropriate; and
4. amending this Agreement to reflect multi-member governance provisions.

**B. Purpose Trust Overlay.** [OPTIONAL.] The Manager may establish a purpose trust or foundation to hold governance authority over the Company, consistent with steward-ownership principles.

**C. Token Issuance.** [OPTIONAL.] The Company may issue security tokens, utility tokens, or governance tokens, subject to applicable securities and digital asset laws. Any such action is a Key Decision.

**D. Blockchain Governance Migration.** [OPTIONAL.] The Company may migrate governance operations to on-chain smart contracts, provided constitutional governance processes are preserved.

**E. Entity Conversion.** The Company may convert to other entity forms permitted by applicable law.

**F. Series Structure.** [OPTIONAL.] The Manager may establish series under the Company if applicable law permits.

**G. Succession.** In the event of the Manager's death or permanent incapacity:
1. if a Purpose Trust Overlay has been established, the trust provisions govern succession;
2. if no trust overlay exists, the Manager's estate shall designate a successor Manager who is committed to the Company's Purpose;
3. Designated Agents shall continue operational functions under their existing Capability Envelopes until a successor Manager is designated;
4. no Designated Agent may exercise Class 3 authority during a succession vacancy; and
5. the Anchor Circle governance process continues to operate for operational matters.

---

## Article XVI: Miscellaneous

**A. Headings.** Descriptive headings are for convenience only and do not constitute part of this Agreement.

**B. Rules of Construction.** Unless the context requires otherwise, references to the plural include the singular and vice versa. The term "including" means "including without limitation."

**C. Notice.** All notices shall be in writing (including email or other electronic means) and deemed given: (a) on the date of delivery if delivered personally or electronically with confirmed receipt; (b) on the second business day if delivered by recognized overnight courier; or (c) seven calendar days after mailing by registered or certified mail.

If to the Company:
> [COMPANY NAME], LLC
> [ADDRESS]
> Email: [EMAIL]

If to the Member:
> [MEMBER NAME]
> [ADDRESS]
> Email: [EMAIL]

**D. Amendment.** This Agreement may be amended by the Manager at any time, subject to the Key Decision requirements of [Article IV.C](#article-iv-the-anchor-circle) for material amendments.

**E. Entire Agreement.** This Agreement, together with all Exhibits and Schedules, represents the entire agreement and supersedes all prior agreements.

**F. Severability.** If any provision is held to be invalid, the remainder shall continue in full force and effect.

**G. No Third-Party Beneficiaries.** This Agreement is for the benefit of the Company and its Member only.

---

## Signature

IN WITNESS WHEREOF, and intending to be legally bound, the sole Member hereby adopts this Operating Agreement for the Company on [DATE].

**MEMBER:**

___________________________________________
[MEMBER NAME], Sole Member and Manager

---

## Exhibits

### Exhibit A: The PowerShift® Constitution

Exhibit A is The PowerShift® Constitution Version [VERSION], a standalone governance framework maintained as a companion document and incorporated herein by reference.

The PowerShift® Constitution is derived from the Holacracy® Constitution Version 5.0 (April 2023), published by HolacracyOne, LLC under the Creative Commons Attribution-ShareAlike 4.0 International License. The PowerShift® Constitution is itself published under the same CC BY-SA 4.0 license.

### Exhibit B: Initial Designated Agent Formation Document

*[Attach the Formation Document for the initial Designated Agent]*

### Exhibit C: Agent Registry

| Field | Value |
|---|---|
| **Agent ID** | [ID] |
| **Name** | [AGENT NAME] |
| **Short Name** | [SHORT] |
| **Role(s)** | [ROLES] |
| **Model/Runtime** | [MODEL via RUNTIME] |
| **Formation Document** | Exhibit B |
| **Capability Envelope** | See Exhibit F |
| **Permissions** | [GOVERNANCE PLATFORM ACCESS DETAILS] |
| **Spending Limits** | [AMOUNT] |
| **Revocation Method** | Manager Kill Switch (Art. III.E.6); [RUNTIME DISABLE METHOD]; [PLATFORM REVOCATION METHOD] |
| **Audit Endpoints** | [LIST] |
| **Status** | Active |
| **Designated Date** | [DATE] |
| **Last Review** | [DATE] |

### Exhibit D: System Card Template

```
SYSTEM CARD — [Agent Name]
Version: [X.X]
Last Updated: [DATE]

1. PURPOSE
   [Agent's purpose statement from Formation Document]

2. DATA INPUTS
   [What data the agent receives]

3. DATA OUTPUTS
   [What the agent produces]

4. AUTHORITY CONSTRAINTS
   - Decision Classes authorized: [0, 1, 2]
   - HI Ratification required for: [Class 3]
   - Domains: [list]
   - Explicit prohibitions: [list]

5. OPERATIONAL LIMITS
   - Runtime: [name]
   - Isolation: [type]
   - Tool access: [allowed tools]
   - Denied tools: [denied tools]

6. HUMAN OVERSIGHT
   - Kill Switch holder: [Manager]
   - Review cadence: [frequency]
   - Audit mechanism: [description]

7. DELEGATED ROLE-FILLERS
   [List any Delegated Role-Fillers authorized by this agent,
    including: role filled, date authorized, additional constraints]

8. CHANGE LOG
   | Date | Change | Authorized By |
   |---|---|---|
   | [DATE] | Initial designation | [MEMBER NAME] |
```

### Exhibit E: Decision Log Template

| ID | Date | Decision | Class | Role | Authority Cited | HI Ratification | Outcome | Notes |
|---|---|---|---|---|---|---|---|---|
| D-001 | [DATE] | [Description] | [0-3] | [Role name] | [Constitutional reference] | [Y/N/N/A] | [Result] | [Context] |

### Exhibit F: Capability Envelope Reference

| Action Class | Examples | Default Policy | Runtime Enforcement |
|---|---|---|---|
| **Interpret / Propose** | Governance proposals, drafts, analysis | Autonomous | [ENFORCEMENT] |
| **Circle Operations** | Role creation, agent assignment within circle | Autonomous (Circle Lead authority) | [ENFORCEMENT] |
| **External Commitments** | Promises, contracts, client communications | HI Ratification required | [ENFORCEMENT] |
| **Financial Actions** | Purchases, invoices, fund transfers | Approval/deny | [ENFORCEMENT] |
| **System Actions** | Exec commands, installs, configuration changes | Approval gated | [ENFORCEMENT] |
| **Anchor-Scope Writes** | Changes to Anchor Circle structure | Propose only; HI to adopt | [ENFORCEMENT] |

### Exhibit G: Evolutionary Pathway Triggers

| Trigger | Condition | Action | Pre-Authorized? |
|---|---|---|---|
| External capital sought | Funding round initiated | Evaluate new unit classes, PBC conversion, or steward-ownership | Yes (Art. XV.A, XV.B) |
| Additional human members | New partner joins | Activate multi-member provisions; amend OA | Yes (Art. XV.A) |
| Manager incapacitation | Death or permanent disability | Purpose Trust activates or estate succession | Requires pre-drafting (Art. XV.G) |
| Agent proliferation | Constellation exceeds [N] agents or [M] decision-classes | Review Delegated Role-Filler usage; assess oversight capacity | Monitor |
| Regulatory change | Material new AI regulation | Convene compliance review; amend Art. X as needed | Monitor |

---

## Schedules

### Schedule 1: Member Register

| Name | Date of Admission | Membership Interest | Status |
|---|---|---|---|
| [MEMBER NAME] | [DATE] | 100% | Active |

### Schedule 2: Capital Contributions

| Member | Date | Type | Amount / Description |
|---|---|---|---|
| [MEMBER NAME] | [DATE] | [Cash / Property / Services] | [AMOUNT / DESCRIPTION] |

### Schedule 3: Anchor Circle Composition

*As defined in Article IV.B and maintained through Due Governance.*

### Schedule 4: DBA Register

| DBA | Jurisdiction | Registration Date | Status |
|---|---|---|---|
| [DBA NAME] | [STATE] | [DATE] | Active |

### Schedule 5: Insurance Requirements

| Coverage | Minimum | Carrier | Policy Number |
|---|---|---|---|
| General Liability | [AMOUNT] | [CARRIER] | [NUMBER] |
| Technology E&O | [AMOUNT] | [CARRIER] | [NUMBER] |
| Cyber Liability | [AMOUNT] | [CARRIER] | [NUMBER] |
| [OTHER] | [AMOUNT] | [CARRIER] | [NUMBER] |

---

*This template is part of The PowerShift® Operating System. Not legal advice. Consult qualified counsel.*
