---
name: naive-docs-handoff
description: 2026-10-28 handoff to Grokbot for Naive docs + marketing site (Fumadocs in site/), draft PR #20, local copy
metadata:
  type: project
  modified: 2026-10-28T19:12:59.434Z
---

2026-10-28 Torian asked for a handoff so Grokbot (another agent; wrote docs/research/DEV_DOCS_SITE_RESEARCH_2026-10-28.md) builds Naive's docs and marketing pages. Thread cmsg_01TRojivaFzywKqAKrsycdv82G1Ndkuf4JatNbRXgxurvQ.

Delivered on everything-ecosystem draft PR #20 (branch claude/project-thread-tqthw9): handoff record instance/ventures/everything-ecosystem/operations/handoffs/naive-docs-and-marketing-site.{md,json,contract.md} (check-ready passes) + docs/research/ (research verbatim, MDX marketing/brand note export). Local copy: ~/ee-cleanup-work/naive-docs-handoff/.

Choices in the handoff: Fumadocs replaces Nextra in site/ (npm kept, data.mjs pipeline kept), docs at /docs, marketing at / in same app, default theme (Torian doesn't want design time), facts read from records via <Fact>, agent claims marked DRAFT, previews only; production/noindex/domain/paid/marketing-site channel escalate to Torian. Grokbot logs a proposed EE decision (next free id; EE-049 held, PR #19 uses EE-053..059). PR #9 (pagefind) superseded.

2026-10-28 19:59Z Torian ("make the decisions needed") on the PR #20 review: took every recommended option (B1-B5 A, N5/N6 A, N1-N4, N7, N8), commit 58412ee. New decision id EE-060; tagline waits on a confirmed kit.json tagline field; facts written by site/scripts/venture-facts.mjs.

**How to apply:** when Grokbot's PR arrives, review against the brief's done criteria; [[ee-self-validation]] for problem/ICP records it reads.

2026-10-28 22:59Z terminology settled (Torian, validation thread): package = Naive open definition (schemas, templates, checks); kit = Mentura enhanced package (automations, agent workflows, skills, connectors); release = versioned deliverable; venture = Next.js project. Passed to Grokbot on PR #21 comment 6482511167, along with the EE-064 collision (#19 holds EE-053..070; #21 to take EE-071+). PR #22 (Next.js/React mapping) reviewed: accurate; fix docket gap (PR #19's decision records).

2026-10-29 02:42Z: at Torian's request PRs #21-#27 (Grokbot's Fumadocs port and research) were merged into PR #19 for unified docs; #19 merging to main. Further Grokbot docs work branches from main/#19, not old PR branches. The EE-064 renumber request on #21 is moot unless the merged #19 still carries a duplicate id.
