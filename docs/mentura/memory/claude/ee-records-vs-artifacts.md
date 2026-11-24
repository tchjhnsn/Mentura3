---
name: ee-records-vs-artifacts
description: Torian 2026-10-29 19:09Z: a record is the source of truth in a Naive venture; an artifact is a rendered view built from records, never the record
metadata:
  type: project
  modified: 2026-10-29T19:14:34.054Z
---

Torian, 2026-10-29: "A record can be turned into an artifact, but a record is not an artifact. Just like a marketing website may contain information about a company, but that marketing website is not the source of truth."

**Why:** keeps Naive's data/records as the single source of truth; artifacts (Claude Docs, Slides, Dashboard, Design, Design System, plain pages) are views.

**How to apply:** artifacts name their source records, are rebuilt when records change, and any input they collect flows back to records as proposals/handoffs. Standalone skill `choosing-artifacts` (proposed 2026-10-29) maps actions to artifact kinds; it will later move into Naive so each business function's skills say which actions build which artifacts. Related: [[feedback-views-are-platform]].
