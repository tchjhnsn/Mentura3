---
name: ee-publication-gate
description: Torian 2026-10-27 wants every EE publication gated (esp. AI-authored), per-venture rights by team/layer, destination-specific guidelines
metadata:
  type: project
  modified: 2026-10-27T17:16:05.461Z
---

Torian, 2026-10-27, in the EE core-product thread: anything published to the public must go through a gate, especially when an AI publishes. The gate manages quality and lets a publication be tested before it goes out. Ventures structure publishing rights differently (a governance team, marketing teams, teams at different layers). The destination ("where it is published") decides which guidelines apply. Industry concept: company publishing guidelines.

Decided 2026-10-27 (card, EE-025; pushed bb439ee; PR #3 merged eb01faa on his explicit OK 2026-10-27): a governance-layer "publication policy" per venture. Its channels each carry audience, guidelines (brand and editorial plus external rules), checks and approvers by role or team. Each publication is a public-commitment handoff; agents draft and check, and a named human approves. publish.json (now filed as operations publish-config) becomes the method-site channel config.

Same day: R1 in publish.mjs changed to "inside the repository" (founder-approved), pushed in bb439ee. Channels also carry platform (must cite platform rules) and replies (gated, delegated to people, or none).

**Why:** an opinionated system, quality control over agent output.
**How to apply:** don't add publishing paths that bypass a gate; tie publication to decision-rights class public-commitment.

Related: [[ee-spheres-model]] [[feedback-standard-nouns]]
