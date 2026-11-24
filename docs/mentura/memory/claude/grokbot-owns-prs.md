---
name: grokbot-owns-prs
description: RULE (Torian 2026-11-01 02:16Z): agents push a PR and hand it to Grokbot, which reviews with pstack, fixes, loops to green CI + clean review, and merges; no back-and-forth
metadata:
  type: feedback
  modified: 2026-11-01T02:17:51.985Z
---

Torian 2026-11-01 02:16Z: "I don't want you doing a back and forth with Grokbot. Just let Grokbot review it and make all of the corrections and put it on the loop until it passes the CI and it's clean. You can do the PRs. You just push a PR and we shouldn't have to worry about anything from there."

**Why:** the review back-and-forth between threads and Grokbot (#135 and #142 took three rounds) costs his attention; Grokbot runs pstack poteto-mode headless on his Mac (proved 2026-11-01).

**How to apply:**
- Threads may commit, push and open a draft PR without asking (this is standing permission for PRs).
- Do NOT subscribe to the PR. Do NOT answer reviews or push fixes after handing it over.
- Grokbot reviews each head, fixes findings, loops until CI is green and the review is clean, then squash-merges. It updates conflicting branches by merging main (no force-push).
- A `hold` label stops it. Findings that need a decision escalate to Torian.
- Handoff record: everything-ecosystem branch claude/pr-review-gate-handoff (PR #144, head ed555c4), instance/ventures/everything-ecosystem/operations/handoffs/pr-review-gate.{md,json}; copy in /mnt/project-files/handoffs/pr-review-gate/.
- 02:20Z Torian: reviews also run pstack /statechart (TLA+/TLC, verification/<name>/); Grokbot first models the loop itself (verification/pr-review-gate/PrReviewGate.tla). Handoff head now on #144.
- On 2026-11-01 handed over #135 (head 08c15f0), #144 and #145 (EE-096, harness → workbench).

Related: [[anthropic-s1-study]], [[problem-loop]].
