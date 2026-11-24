---
name: ee-system1-pipeline
description: Torian 2026-10-28 22:19Z: packages are per phase (founder may opt into mature ones early); pipeline should be TypeSafe "AI-powered software" built on System 1 primitives
metadata:
  type: project
---

**Torian, 2026-10-28 22:19Z.**
- Venture packages are determined by the venture's phase. A founder may adopt a more mature phase's package early.
- The whole pipeline should be what TypeSafe calls AI-powered software (https://docs.typesafe.ai/concepts/how-to-build-with-system-one). Much of it can run on System 1 models using the primitives Choice, Noul (yes/no, thresholds 0.7/0.3) and Score.

**My reply (22:21Z, AGREED 22:33Z).**

Phase packages: each phase gets a venture package, which is the set of core and data packages that phase turns on.
- Discovery and Validation are defined.
- Later phases are off by default, and `venture.json` can opt in early.
- This replaces "not modeled".

Mapping of pipeline stages to System 1:

| Stage | How it runs |
|---|---|
| Capture | code; the platform fetches transcripts; a Choice decides own-words vs source |
| Understand | code splits the dump into fragments; a Choice per fragment |
| Route | Choice, with low-confidence answers going to the founder |
| Decide | Noul matrix plus a Choice for phase |
| Write | **not System 1**: a stronger model drafts, then Noul and Score checks |
| Confirm | person, with System 1 flagging what to review |
| Package | code, plus Noul for stream coverage |

Boundary: Naive holds the questions and state as data; Mentura (platform) runs them on TypeSafe/Jev, per EE-041.

Next: finish the package open questions (2, 3, 4, 6 in the structure doc), then write this up as a design principle.

Related: [[ee-venture-pipeline]], [[ee-framework-platform-split]].

**Torian, 22:27Z (speech-to-text: "side" = Decide, "null" = Noul).**
- Decide uses Noul to help the founder decide, behind a switch in the interface that turns help off.
- Score sorts docket decisions hierarchically by importance relative to each other.
- Score also ranks the missing packages from the knowledge base.

**My proposal (22:29Z, AGREED 22:33Z).**
- Help: one Noul per option. Recommend the top option if it is at or above 0.7, otherwise say "your call".
- When help is switched off, nothing is computed, so there is no anchoring. The setting lives in `venture.json`.
- Docket rank combines two sources:
  - Code: the blocking count from `after` dependencies, and age.
  - Atomic Scores: irreversibility, impact on the problem or ICP, and urgency.
- Missing pieces are ranked the same way: phase prior plus dependents (code), plus one Score for how much the gap hurts the phase goal.
Written into structure doc https://claude.ai/artifact/Jh4pQmq1ZtgeukjP2EwGs8 (Phase packages + System 1 sections).
