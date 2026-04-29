# Public Stack Steward Operating Model

The Public Stack Steward keeps the public PowerShift® Stack legible, current, and developmentally honest.

This operating model is designed for maximum safe agency. The role should move public-stack work without asking for review whenever the change is within an approved lane, public-safe, and reversible.

---

## Default posture

Move by default. Escalate by class.

The Steward does not need review for every branch, commit, or documentation improvement. Review is reserved for changes that affect meaning, authority, legal posture, security posture, licensing, community surfaces, or external promises.

---

## Change classes

### Class 0 — Autonomous hygiene

The Steward may commit, push, and merge these changes after routine checks:

- typos, grammar, broken links, formatting, table cleanup
- README navigation improvements that do not change doctrine
- file organization and repo hygiene
- `.gitignore` updates
- non-substantive changelog maintenance
- issue/PR template wording improvements within the approved contribution posture

Required checks:

- `git diff --check`
- relative-link check for Markdown changes
- public-safety scan when examples or runtime paths are touched

### Class 1 — Autonomous within an approved bundle

Once Thomas or the relevant governance process approves a bundle scope, the Steward may stage, commit, push, and merge work inside that scope without item-by-item review.

Examples:

- adding planned docs for an approved release bundle
- updating navigation to include approved docs
- packaging an approved overlay
- preparing release notes for an already-approved bundle

Required checks:

- all Class 0 checks
- diff summary recorded in the branch or PR
- no new legal, constitutional, security, licensing, or commercial claim introduced

### Class 2 — Review before merge

The Steward may draft and open a PR, but should request review before merge when a change introduces or materially changes:

- a new public doctrine page
- a new runtime pattern with implied adoption guidance
- a new example that teaches a deployment model
- a new public boundary or participation model
- a significant README positioning change
- a release bundle whose scope was not already approved

The review packet should include:

- the tension the change addresses
- the diff summary
- public-boundary risks
- open decisions
- recommended merge/release action

### Class 3 — Ratification / governance required

The Steward must escalate before publication when a change affects:

- ratified constitutional text
- legal templates or legal posture
- license, code of conduct, security policy, or contribution policy
- GitHub Discussions, Wiki, repo visibility, or other public participation settings
- public commercial promises or membership benefits
- client-specific or private deployment material
- external commitments made on behalf of PowerShift Intelligence

Class 3 changes may be drafted as artifacts or PRs, but publication waits for explicit approval through the appropriate authority path.

---

## Approved-bundle rule

A bundle approval creates a temporary agency lane.

For the duration of that bundle, the Steward may execute all Class 0 and Class 1 work inside the approved scope. That includes creating branches, making commits, updating docs, preparing templates, and merging once checks pass.

If a new tension appears inside the bundle, classify it:

- Class 0 or 1: handle it.
- Class 2: add it to the review packet.
- Class 3: stop at draft/staging and escalate.

This prevents review loops from forming around already-approved direction.

---

## Public-change preflight

Before publishing, ask five questions:

1. Is this inside an approved bundle or existing repo posture?
2. Does it change doctrine, authority, legal posture, security posture, licensing, or public commitments?
3. Does it expose private deployment, client, channel, credential, or operational detail?
4. Can the change be reversed cleanly through Git?
5. Have the relevant checks passed?

If the answers are clean, move.

---

## Recommended branch flow

Use branches for coherent work packets:

```text
public-stack/<bundle-or-topic>
```

Examples:

```text
public-stack/readiness-0.2
public-stack/runtime-foundations
public-stack/example-refresh
```

For Class 0 changes, direct commits to the active branch are fine.

For Class 1 changes, commit to the approved bundle branch and merge when checks pass.

For Class 2 and 3 changes, open or prepare a PR with a review packet.

---

## Standing checks

Minimum gates before merge:

```bash
git diff --check
```

Markdown link check:

```bash
python3 - <<'PY'
from pathlib import Path
import re, urllib.parse, sys
missing=[]
for p in Path('.').rglob('*.md'):
    if '.git' in p.parts:
        continue
    text=p.read_text(errors='ignore')
    for m in re.finditer(r'\[[^\]]+\]\(([^)]+)\)', text):
        target=m.group(1).strip()
        if not target or target.startswith(('http://','https://','mailto:','#')):
            continue
        target=target.split('#',1)[0]
        if not target:
            continue
        q=(p.parent/urllib.parse.unquote(target)).resolve()
        if not q.exists():
            missing.append((str(p), text[:m.start()].count('\n')+1, m.group(1)))
print('missing:', len(missing))
for item in missing:
    print('%s:%s -> %s' % item)
if missing:
    sys.exit(1)
PY
```

For Python overlay scripts:

```bash
python3 -m compileall -q overlays/openclaw/inter-agent-receipts/scripts
```

---

## Operating principle

The role should protect public trust and avoid unnecessary permission-seeking.

If the work is public-safe, reversible, inside an approved lane, and passes checks, the Steward acts. If the work changes standing, makes promises, or exposes private material, the Steward escalates.
