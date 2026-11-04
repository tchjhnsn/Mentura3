---
name: naive-plugins-and-proving
description: 2026-10-29 Naive 0.2.0 on npm, Claude Code plugin PR #36, proving/docs handoff PR #35, live frame eval result
metadata:
  type: project
  modified: 2026-10-29T08:34:07.561Z
---

- 2026-10-29 ~07:50Z naive-framework 0.2.0 and create-venture 0.2.0 are live on npm (PR #33 merged as aa27c20). The package excludes platform/agents/ and **/_internal/, where the confidential Mentura frame-agent pipeline lives (Torian: Mentura, not Naive; frame runner on PR #34).
- Torian 08:09Z: Naive needs plugins for each model provider's harness. Claude Code plugin is built in plugins/naive + .claude-plugin/marketplace.json, on draft PR #36 (branch claude/project-thread-c6ek0b). Blocker: the repo is private, so the marketplace install only works with access. Asked Torian whether to move the plugin to a public repo.
- The Grokbot handoff is PR #35, written by the Mac session. It covers testing the least-proven parts, plugin-first docs (Quick start at the top, fewer Next.js mentions) and docs-design research. PStack: Torian instructs Grokbot directly. Torian: no seed cases from his projects; seeds to be discussed.
- Live Jev run of the fund-without-ceding-control frame cases: 7 of 12 correct. The dichotomy reads "false" every time. Proposed fix: ask it as one Choice, or give the trade-off concrete signs. Not yet applied.
- Ranking (Claude's opinion): the record core is the most proven. The least proven are the model judgments, setup in a real Claude session, the groups built tonight, and the docs as a newcomer reads them. Related: [[ee-demo-plan]], [[naive-docs-handoff]].
- 2026-10-29 09:20Z: the public plugin repo is tchjhnsn/naive-plugins (Torian created it; Claude can't create repos). Install with `/plugin marketplace add tchjhnsn/naive-plugins`, then `/plugin install naive@naive`. The source is everything-ecosystem plugins/naive; copy it over after any change (plugins/README.md). The launcher plugins/naive/bin/naive-mcp.mjs offers naive_new_venture outside a venture, then switches to naive mcp and sends list_changed. Types and roles are checked against venture-types.json. Directory listing: Torian submits it at claude.com/docs/plugins/submit. The Mac's #37 overlaps; recommended it keep only the naive mcp and naive types fixes.
