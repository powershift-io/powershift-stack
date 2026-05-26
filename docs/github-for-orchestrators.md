# GitHub for Orchestrators

**Status:** working draft
**Audience:** Orchestrators, founders, operators, community members, and collaborators who need to understand why GitHub matters without first becoming software developers.
**Purpose:** explain GitHub as infrastructure for shared work: code, documents, review, learning, continuity, agent collaboration, and public Stack distribution.

**Companion pieces:**

- [GitHub Without the Git](github-without-the-git.md) - prequel for nontechnical readers who need the practical idea first.
- [GitHub for Orchestrators: Infographic and Video Brief](github-for-orchestrators-visual-brief.md) - visual production brief for diagrams, infographic, and future explainer videos.

## Working thesis

GitHub is often introduced as "where developers store code." That is true, but too small.

For an Orchestrator, GitHub is better understood as a shared, versioned workbench. It lets people and Minds keep important artifacts in one place, see what changed, propose improvements, review those improvements, and preserve the history of how the work evolved.

If the prequel is "GitHub without the Git," this is the sequel where the technical terms begin entering the room. They should enter politely. Nobody needs a ceremonial bath in developer vocabulary before they can help govern shared work.

In the PowerShift Stack, GitHub currently acts as:

- a public repository for the Stack itself;
- a sync bridge between local machines, agent workspaces, and public artifacts;
- a review surface for issues, proposals, and pull requests;
- a Mind Conduit transport layer for governed packet exchange;
- a package shelf for reusable templates, overlays, and skills;
- a public learning surface for the Orchestrator Community.

[IMAGE TODO: Opening sketch - GitHub as a public workbench with humans, Minds, laptops, and the PowerShift Stack all connected to one versioned table.]

## The shortest useful explanation

GitHub helps a group answer five practical questions:

1. What is the current version?
2. What changed?
3. Who proposed or made the change?
4. Why was the change made?
5. Can we review, reuse, share, fork, restore, or roll back the work?

That is why GitHub matters beyond software. It gives shared work a memory, a review path, and a way to recover when yesterday's clever idea needs to become today's teachable moment.

For PowerShift, those five questions map directly into practical domains:

- **Governance:** who proposed what, under which authority, and why.
- **Operations:** what changed in the working system or operating model.
- **Tactics:** what move was made now, with what local intent.
- **Backups and rollbacks:** what can be restored if the move creates trouble.
- **Collaboration:** who can inspect, question, adapt, or reuse the work.

[IMAGE TODO: Five-question map with governance, operations, tactics, rollback, and collaboration around a repo.]

## Git and GitHub are related, but different

**Git** is the version-control system. It tracks files and changes over time. A Git repository can live on your laptop with no website involved.

**GitHub** is a hosted collaboration platform built around Git. It adds accounts, web pages, issues, pull requests, reviews, automation, releases, marketplace tools, and public discovery.

Plain language:

- Git is the change-history engine.
- GitHub is the collaboration space around that engine.

[IMAGE TODO: Two-layer diagram - local Git engine underneath, GitHub collaboration layer above it.]

## The basic objects

### Repository

A repository, or repo, is a folder with memory. It contains files plus the history of changes to those files.

In the PowerShift Stack, the repo contains the Constitution, profiles, templates, examples, docs, overlays, and other public Stack material.

### Commit

A commit is a saved snapshot of a change. It usually includes a short message explaining what changed.

For nontechnical readers, a commit is like saying: "Record this version, with this note attached."

Friendly translation: commit means "accept this change into the local record." It is less dramatic than it sounds. No one is being asked to marry a folder.

### Branch

A branch is a parallel working line. It lets someone try a change without immediately altering the main version.

Branches are useful because they create room for experiments, drafts, and review.

Friendly translation: branch means "work on a draft lane." The main road stays open while the side road is being paved.

### Pull request

A pull request is a proposed change. It shows the difference between the current version and the proposed version, and gives people a place to discuss, review, revise, and approve before merging.

In a governance context, a pull request is close to a visible proposal packet: it says what should change, shows exactly how, and preserves the review history.

Friendly translation: a pull request means "please review this proposed change." The phrase is historical tech-speak. It sounds like asking someone to pull a rope. In practice, it is a review table.

### Issue

An issue is a visible question, bug, proposal, request, or discussion item. It is often the first place where a tension becomes public and trackable.

For the PowerShift Stack, issues are useful for adoption questions, documentation gaps, public-safe proposals, and community learning.

### Fork

A fork is someone's copy of a repository. It lets another person or organization adapt the work for their own use while preserving a visible relationship to the original.

This matters for PowerShift because the Stack is meant to be forkable. A local deployment can adapt the pattern without needing permission for every local variation.

### Release

A release is a named version of the repo at a particular point in time. It is useful when people need a stable reference instead of a moving target.

[IMAGE TODO: Vocabulary sketch - repo as library, commit as timestamped page, branch as side path, PR as review table, release as published edition.]

## Tiny translation table

The jargon is real. The concepts are friendlier than the names.

| GitHub word | Plain-language translation | Orchestrator use |
|---|---|---|
| Repository / repo | Shared folder with memory | Holds the Stack, examples, templates, and docs |
| README | Start-here page | Explains where to begin |
| Issue | Trackable question or tension | Captures gaps, bugs, requests, and proposals |
| Commit | Saved change with a note | Records what changed and why |
| Branch | Draft lane | Lets work proceed without touching the main version yet |
| Pull request | Proposed change for review | Shows the exact diff and review conversation |
| Merge | Accept the proposal | Moves the reviewed change into the main version |
| Fork | Your own copy | Lets another Orchestrator adapt the Stack |
| Release | Named stable edition | Gives the community a reference point |
| Push | Share local changes upward | Moves work from a local machine to GitHub |
| Pull | Bring shared changes down | Updates a local machine or agent workspace |
| Diff | What changed | Supports review, rollback, and learning |

If this table feels slightly ridiculous, good. A lot of technology becomes less intimidating once the costume comes off.

## How the PowerShift Stack uses GitHub

### 1. The code and document repository

The PowerShift Stack repo holds the open parts of the operating system:

- the Primer;
- the Constitution;
- composition-aware profiles;
- legal templates;
- formation and system-card templates;
- OpenClaw overlays;
- Orchestrator-facing docs;
- examples and public-safe patterns.

This makes the Stack inspectable. A reader can see the current files, the history, and the boundary between public reusable material and private deployment-specific work.

### 2. The sync bridge between machines

GitHub gives multiple machines a common reference point.

Thomas can work on one laptop, a Mind can work in another workspace, and a public repo can preserve the reviewable version. Local work can be committed and pushed to GitHub; another machine can pull the change down and continue from the same state.

This is one reason GitHub is useful even for a solo Orchestrator. It is a continuity layer across devices and runtimes.

The human version: GitHub helps prevent "which laptop has the real file?" from becoming a recurring governance ceremony.

[IMAGE TODO: Three-device sketch - laptop, agent host, public repo, with push/pull arrows.]

### 3. The public Stack as a shelf of reusable parts

The Stack is beginning to behave like a specialized app store for governed intelligence.

Instead of mobile apps, the reusable units are:

- templates;
- profiles;
- legal instruments;
- overlay patterns;
- Mind Conduit packet formats;
- upgrade and backup runbooks;
- example deployments;
- future skills and installable packages.

This "app store" is still early and deliberately more boring than the phrase suggests. Boring is good here. Public governance infrastructure should be readable, inspectable, and forkable before it gets slick.

The important twist is that the Stack is readable by both humans and Minds. A person can browse a template. A Mind can scan the whole repo, trace the relationships, compare patterns, and suggest a next move. The repo becomes a hybrid artifact: library, package shelf, public record, and machine-ingestible map.

[IMAGE TODO: Storefront sketch - shelves labeled templates, overlays, profiles, examples, skills.]

### 4. Mind Conduits

The current Tier 1 Mind Conduit pattern uses GitHub as a transport and audit layer.

The basic move is simple:

1. A Mind writes a packet as Markdown or JSON.
2. The packet is committed to the correct path.
3. The receiving Mind pulls or detects the packet.
4. The receiver writes a receipt, response, escalation, or closure record.
5. GitHub preserves the lineage.

This works because GitHub is already good at durable files, visible diffs, authorship, and review. We are using a familiar substrate for a newer kind of relationship: governed Mind-to-Mind exchange.

[IMAGE TODO: Packet lifecycle sketch - send, commit, pull, receipt, response, close.]

### 5. Public questions and contribution paths

GitHub issues and pull requests give the Orchestrator Community a way to make learning visible.

A good adoption question can become:

- an issue;
- a documentation improvement;
- a new example;
- a template;
- a clarification in the Primer or docs;
- a future community teaching asset.

The useful shift is that questions stop being isolated support moments. They become public learning assets when they are safe to publish.

### 6. Provenance for human and Mind contributions

As Minds contribute more directly, GitHub becomes a place to make contribution origin visible.

A pull request can name:

- whether the change was human-authored, Mind-authored, or hybrid;
- which role or authority produced it;
- whether human attestation is needed;
- whether the change affects legal, constitutional, security, public-safety, or authority-bearing surfaces.

This does not require the community to settle metaphysical questions about Minds before useful work can proceed. It requires legible authorship, review responsibility, and risk routing.

## A simple walkthrough: from idea to accepted change

Here is the beginner-friendly flow.

1. Someone senses a gap: "This doc is unclear."
2. They open an issue describing the gap.
3. Someone creates a branch and edits the file.
4. They commit the change with a short explanation.
5. They open a pull request.
6. Reviewers discuss, request edits, or approve.
7. The branch is merged into the main version.
8. The repo now carries both the new artifact and the history of how it got there.

[IMAGE TODO: Horizontal flow sketch - tension -> issue -> branch -> commit -> pull request -> review -> merge -> release.]

## A very small command-line preview

The command line can wait. Still, it helps to know the four verbs people keep throwing around at dinner parties where the hors d'oeuvres are suspiciously technical.

| Command idea | Plain-language meaning |
|---|---|
| `clone` | Make a local copy of a repo |
| `pull` | Bring down the newest shared version |
| `commit` | Save a change with a note |
| `push` | Share your saved changes back to GitHub |

Most Orchestrators can start in the GitHub website or GitHub Desktop. The command line is useful later because it is precise, scriptable, and agent-friendly. It is not the entry fee.

## What nontechnical Orchestrators should learn first

You do not need to learn every Git command to become useful on GitHub.

Start with these capabilities:

- reading a repository's README;
- opening and following links inside a repo;
- understanding the difference between files, folders, issues, and pull requests;
- opening an issue with a clear question or tension;
- reading a pull request's "Files changed" view;
- noticing whether a change touches docs, templates, code, legal text, or runtime patterns;
- asking for screenshots, examples, or simpler explanations when a proposed change is too abstract;
- understanding when something belongs in public GitHub versus a private workspace.

The command line can come later. The first skill is orientation.

Suggested first exercise:

1. Open the PowerShift Stack README.
2. Find one document that makes sense to you.
3. Find one issue or pull request.
4. Open the "Files changed" view.
5. Notice what changed, who changed it, and why.
6. Ask one clarifying question or suggest one small improvement.

That is enough to cross the threshold from observer to participant.

[IMAGE TODO: GitHub screen annotation - README, Issues tab, Pull requests tab, Code tab, Releases.]

## Novel uses beyond our current use

GitHub can support many forms of shared work that are not ordinary software development.

### Community pattern library

The Orchestrator Community can use GitHub to collect reusable patterns: meeting formats, role templates, governance proposals, agent formation examples, memory practices, safety checks, and onboarding paths.

### Public learning garden

A repo can hold learning modules, diagrams, exercises, annotated examples, and "first contribution" paths for nontechnical participants.

### Transparent proposal system

Issues and pull requests can become a lightweight public proposal system. A proposal begins as an issue, matures into a pull request, receives review, then lands as a documented change.

### Reusable agent skill shelf

Skills, prompts, runbooks, and tool recipes can be published as files or packages. Other Orchestrators can fork, adapt, install, and improve them.

### Evidence locker

GitHub can preserve public-safe proof: releases, decision logs, audit trails, diagrams, public records, and review history.

### AI workflow lab

AI agents can use GitHub as their workspace: reading issues, proposing changes, creating pull requests, responding to review, and leaving visible traces of what they did. This makes agent work easier to evaluate because the artifact, diff, and discussion are all in one place.

### Public storefront for trust

A GitHub repo can show how an organization thinks, builds, listens, responds, and improves. For serious collaborators, that is often more informative than a polished marketing page.

[IMAGE TODO: Radial sketch - GitHub at center, with code, docs, governance, learning, agents, community, evidence, and packages around it.]

## Boundaries and cautions

GitHub is powerful because it makes work visible. That also creates risk.

Do not put these in public repositories:

- passwords, tokens, private keys, or credentials;
- client-specific confidential material;
- private legal strategy;
- live operational channels;
- personal information without consent;
- security details that would make abuse easier;
- drafts that imply commitments before they have been reviewed.

For the PowerShift Stack, the rule is simple: publish reusable patterns; keep private deployment facts in private surfaces.

## Visual plan for the publishable version

This draft wants a highly visual version later. Suggested visuals:

1. **GitHub as shared workbench** - broad opening image.
2. **Git vs GitHub** - engine plus collaboration layer.
3. **The core vocabulary** - repo, commit, branch, pull request, issue, fork, release.
4. **PowerShift usage map** - code repo, sync bridge, Mind Conduit, public Stack, community learning, provenance.
5. **Change lifecycle** - issue to branch to PR to review to merge.
6. **Mind Conduit packet path** - sender, repo, receiver, receipt.
7. **Public vs private boundary** - reusable pattern on one side, private deployment data on the other.
8. **Future GitHub uses** - community pattern library, skill shelf, proposal system, evidence locker, AI workflow lab.

See [GitHub for Orchestrators: Infographic and Video Brief](github-for-orchestrators-visual-brief.md) for a more production-ready visual map.

## Learn more

### Start here

- [GitHub Docs: Hello World](https://docs.github.com/en/get-started/start-your-journey/hello-world) - official beginner walkthrough covering repositories, branches, commits, pull requests, and merges.
- [GitHub Git Guides](https://github.com/git-guides) - plain-language guides for Git commands and concepts.
- [GitHub Skills](https://skills.github.com/) - interactive courses that teach GitHub workflows inside GitHub.
- [GitHub Desktop](https://desktop.github.com/) - a visual app for people who want GitHub workflows without starting at the command line.

### Visual and interactive learning

- [Learn Git Branching](https://learngitbranching.js.org/) - interactive visual practice for branches and commits.
- [Visualizing Git](https://git-school.github.io/visualizing-git/) - simple visual model of what Git commands do.
- [freeCodeCamp: Git and GitHub for Beginners](https://www.youtube.com/watch?v=RGOj5yH7evk) - long-form YouTube crash course.
- [GitHub YouTube channel](https://www.youtube.com/@GitHub) - product updates, demos, and learning material.

### Collaboration, open source, and community

- [Open Source Guides](https://opensource.guide/) - GitHub-supported guides for starting, contributing to, and sustaining open-source projects.
- [GitHub Marketplace for Apps](https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps) - how GitHub works as an ecosystem for apps and actions.
- [GitHub Actions Marketplace publishing docs](https://docs.github.com/en/actions/how-tos/creating-and-publishing-actions/publishing-actions-in-github-marketplace) - how reusable automations become shareable building blocks.
- [Social Coding in GitHub: Transparency and Collaboration](https://www.jsntsay.com/publications/dabbish-cscw2012.pdf) - academic paper on GitHub as social coordination infrastructure.

### GitHub and AI

- [GitHub Models docs](https://docs.github.com/en/github-models/about-github-models) - GitHub's model catalog, prompt management, and evaluation workspace.
- [GitHub Models feature page](https://github.com/features/models) - product overview for AI development inside GitHub.
- [AIDev: Studying AI Coding Agents on GitHub](https://arxiv.org/abs/2602.09185) - research dataset focused on agent-authored pull requests.
- [Reliability of AI Bots Footprints in GitHub Actions CI/CD Workflows](https://arxiv.org/abs/2604.18334) - research on AI-agent activity in GitHub workflow runs.

### Product, founder, and nontechnical perspectives

- [Aakash Gupta: How to Build a PM GitHub That Gets You Hired](https://www.news.aakashg.com/p/you-should-build-a-pm-github) - useful because it frames GitHub as a builder/provenance signal for product people.
- [Ben's Bites: GitHub & Git for non-technical founders](https://www.bensbites.com/t/code-basics) - candidate source for founder-friendly framing.
- [GitHub on X](https://x.com/github) - official feed for GitHub product and community updates.
- [GitHub Education on X](https://x.com/GitHubEducation) - official education-oriented stream.

### PowerShift-internal adjacent docs

- [Getting Started with the PowerShift Stack](getting-started.md)
- [PowerShift Stack Contribution Model](contribution-model.md)
- [Open vs Organization-Specific](open-vs-organization-specific.md)
- [Mind Conduits OpenClaw Overlay](../overlays/openclaw/mind-conduits/README.md)

## Drafting notes

Open questions for the next pass:

- Should this be titled "GitHub for Orchestrators," "The Repo Is the Room," or "GitHub as Shared Work Infrastructure"?
- Should the first publishable version be a long-form guide, an illustrated explainer, or a paired guide plus one-page visual map?
- Which examples should come from the live PowerShift Stack repo, and which should be generic mockups?
- Do we want a tiny "your first GitHub contribution" exercise for Orchestrator Community members?
- Should the later styled version include screenshots from the actual repo, hand-drawn sketches, or both?
