---
name: feedback-decisions-as-cards
description: Torian 2026-10-28: anything awaiting his accept/approve must be put plainly in front of him as a decision card, never left as "drafts waiting" in prose
metadata:
  type: feedback
  modified: 2026-10-28T07:09:31.652Z
---

When a draft or record needs Torian's acceptance, show its content plainly in the thread and post a decision card (request_decision) per decision. Saying "3 drafts are waiting for you to accept" with a CLI command is a bad behavior.

**Why:** Torian, 2026-10-28: "if I'm going to accept them, I need them put plainly in my face. This is a decision, so it should be triggering a decision card since we're inside of Claude Code." In Mentura's own platform the surface may differ, but the principle holds: a decision is surfaced as a decision.

**How to apply:** content first (short, readable), then one card per draft (accept / edit first / not yet). The framework itself should do the same: a pending draft of a gated record is surfaced to the person as a decision by whatever harness is running. Related: [[ee-self-validation]], [[ee-publication-gate]].
