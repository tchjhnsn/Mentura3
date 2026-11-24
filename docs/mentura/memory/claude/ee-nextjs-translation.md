---
name: ee-nextjs-translation
description: Status of the Next.js-to-Naive translation doc (Getting Started done 2026-10-28), its open words and next scope
metadata:
  type: project
  modified: 2026-10-28T23:51:49.473Z
---

Translation doc (Claude Doc): https://claude.ai/artifact/XUWNP7MZ1uTNP4uSY6pwgu . Goes line by line through the Next.js App Router docs and maps each concept to Naive (converts / converts with changes / does not convert / AI-native), with a word decision per term.

2026-10-28 ~23:55Z: all 18 Getting Started chapters done. Row prefixes: I installation, P project structure, L layouts, N linking, S server/client, F fetching, M mutating, C caching, V revalidating, E errors, Y CSS, J images, T fonts, O metadata, H route handlers, X proxy, Z deploying, U upgrading, R React concepts. A "What Getting Started adds to the design" list (11 build items) closes it.

Decided words: AGENTS.md (file) + layout (concept), naive typegen, agent vitals, context budget, "use model", private, gate, release card.
23:54Z Torian also decided: uncertain (E-1), brand tokens (Y-3), action (H-1), export (Z-3), adapter (Z-4). Still open: what plays React's role.
Next (Torian 23:54Z): Claude does not implement the design; it opens a PR with instructions for Grokbot to implement it (handoff pattern as in [[naive-docs-handoff]]).

Next scope if Torian wants it: Guides, then API Reference. Not started. See [[ee-venture-structure]], [[feedback-views-are-platform]].

2026-10-29 00:10Z: Grokbot handoff on draft PR #23 (branch claude/grokbot-naive-packages-handoff, stacked on #19; retarget to main after #19 merges). Handoff id naive-packages-and-design-additions; stages A kit->package, B package folder layout + functions, C data packages + raw, D board to platform/, E design additions 1-5 + 9. EE-073 logged there. 00:14Z Torian: Grokbot starts now (he tells it himself); stage branches off c6ek0b, PRs target it, never push to it; Torian merges.
