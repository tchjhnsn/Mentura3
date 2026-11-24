---
name: pstack-default
description: Torian 2026-11-01 03:10Z wants pstack used by default for most work, especially architecting (its architect skill), by Claude threads and Grokbot
metadata:
  type: feedback
---

Torian 2026-11-01 03:10Z: "we should pretty much always defer to using PStack for pretty much most things, especially architecting" (its architect skill), and Grokbot should use it too. He is reviewing all pstack skills himself.

**Why:** he wants one standard toolkit for planning and building; earlier rule already had pstack poteto-mode for builds and reviews (see PR REVIEW RULE in MEMORY.md).

**How to apply:** at the start of any architecting or build task, check whether pstack skills are loaded (skill list shows `pstack:*`). In cloud sessions on 2026-11-01 they were NOT installed (only a comparison doc at MAD/operations/methodology/PSTACK_AND_SAD_COMPARISON_2026-10-14.md). If missing, say so in one line and proceed; don't ask him to write a skill. Related: [[ai-labs-anatomy]].
