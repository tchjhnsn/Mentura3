---
name: feedback-views-are-platform
description: Torian 2026-10-28 23:21Z: Naive (framework) produces data and routes only; any rendered view is Mentura (platform) or a visualization skill for another harness
metadata:
  type: feedback
---

Torian, 2026-10-28 23:21Z: "let's actually not build any views right now, because all of the views we've been creating are technically for the platform. If they're not for the platform, then they would be skills, specifically visualization skills for certain elements of Naive whenever rendering it inside of another harness like Claude Code, Codex, or Cursor."

**Why:** the framework/platform split (EE-041). Naive is conventions and data. Rendering is either the platform's product or a skill a harness uses.

**How to apply:**
- Framework work returns JSON through routes.
- Never add pages or HTML to framework code.
- Put a requested view in platform/, or write it as a visualization skill.
- The demo board (interface/demo/board.mjs) is platform work that is in the wrong place.

Related: [[ee-framework-platform-split]], [[ee-venture-structure]].
