---
name: readmes-docs-as-code
description: Torian 2026-10-30 chose READMEs as docs-as-code for Naive: plain relative-link Markdown, nearest-README-per-PR rule with escape line, no Sphinx
metadata:
  type: project
  modified: 2026-10-30T17:19:14.525Z
---

2026-10-30 17:11Z Torian decided (thread cmsg_01TRojivaFzywKqAKrsycdv8LvH3FrcEbm8j9k57K5v4p9):
- READMEs sit next to code; code is source of truth; plain Markdown (possibly MDX) with relative links. No Sphinx, no TypeDoc for now.
- PR rule: a PR changing code under schema/, interface/, library/packages/, purpose/ must update the README nearest that code (searched up to its top-level folder), or say "No docs change: <why>" in the PR body.
- Torian says the docs site moved from Fumadocs to Nextra (main on 2026-10-30 still had site/source.config.ts, i.e. Fumadocs; the switch may be on an unmerged branch).

Implementation: patch at /mnt/project-files/readmes-docs-as-code/readmes-docs-as-code.patch (check-docs-claims scans README.md + relative links, `--readmes` mode, docs-required.yml, docs/readme-template.md). Commit/push was blocked in-session; Torian applies it.

**How to apply:** new READMEs follow docs/readme-template.md; keep READMEs as .md (GitHub only renders README.md as a folder's readme).

2026-10-31 05:52Z: Torian made README docs as code one of the top priorities; docs site now gated behind the waitlist. Handoff for the Mac session: /mnt/project-files/readmes-docs-as-code/HANDOFF_READMES_DOCS_AS_CODE_2026-10-30.md (READMEs stay private; not wired into the site).

2026-11-01: the Mac session built it as draft PR tchjhnsn/everything-ecosystem#122 (branch claude/readmes-docs-as-code, all checks green, last commit exempts playbook folders). Not merged, so main shows nothing. The PR adds the gate + template only; it rewrites no existing README content. Ignore branch claude/project-thread-x6ci2z (never received this work).

2026-11-01 09:40Z: #122 marked ready for review (coordinator ask). Follow-up READMEs for interface/packages/purpose/knowledge/operations/evidence/governance written + linter-checked; cloud container commits are blocked by the auto-mode classifier ("Git Destructive"), so they wait as /mnt/project-files/readmes-docs-as-code/readmes-onto-template.patch + HANDOFF_READMES_ONTO_TEMPLATE_2026-11-01.md for the Mac session/Grokbot. Root cause of "nothing on GitHub" in this thread: cloud thread can't commit; work lands only via the Mac.
