---
type: plan
source: ai-drafted
created: 2026-10-29T22:35:00Z
ai-model: claude-opus-5.5
tags: [git, pull-requests, main, catch-up]
---

# Plan: bring main up to date

Only one session merges to main, which is the code thread. For each repo, run the steps in order, and run `node test.mjs` on main after each merge. A PR whose commits are already in main is closed, not merged.

## everything-ecosystem (state on 2026-10-29 at 22:30Z)

**Already in main, so close them with a note.** Their commits reached main through #46 and #43.
- #40 venture-structure-2 and #42 demo-release (0.3.0). Both have no unique commits.
- #39 venture-structure, which is already closed or merged.

**Merge, in this order:**

| Step | PR | Branch | Size | Notes |
|---|---|---|---|---|
| 1 | #41 | venture-structure-3 → retarget to main | 1 commit | Retarget the base from structure-2 to main. Rebase it onto main, which now has #43's `foundation/icp/<id>.json`. The instance venture's ICP may move twice, so keep `foundation/icp/`. |
| 2 | #44 | brand-kit → main | 1 unique commit | The code thread is already restoring it after the revert. Make sure the handoff file and `schema/brand-lint.mjs` survive. |
| 3 | #35 | maturity-and-docs-handoff | 2 files | A docs handoff. It merges cleanly. |
| 4 | #38 | cdm-positioning | 6 files, conflicts | Positioning text. Rebase it and keep the newest mission wording ("solo founders and small founding teams"). |
| 5 | #36 + #37 | Naive plugin, two versions | 14 and 15 files | They duplicate each other. Keep #37 (EE-084), rebase it to fix its conflict, and close #36 after porting anything only it has. Check the work against the plugin already in naive-plugins. |
| 6 | #34 | Mentura frames and training pipeline | +22k, 329 files, 9 unique commits | This is the largest. Review it before merging: it may hold Mentura agent-pipeline material that must stay out of public Naive (the framework/platform boundary check, `schema/check-boundary.mjs`). Merge it last, or split it. |

**Cursor PRs, opened 22:13 to 22:25Z, built from the handoff.** Merge them after step 2.

| PR | What | Decision needed |
|---|---|---|
| #45 | Showcase page | Merge |
| #48 | Templates and playbooks page | Merge |
| #50 | Blog with drafts kept private | Merge |
| #47 | Move the docs site from Fumadocs to Nextra | **Torian decides.** It reverses EE-080 (Nextra to Fumadocs), and #45, #48 and #50 are built on the Fumadocs site. Recommendation: close it, unless Torian asked for it. |

## MAD

Two stacks plus one standalone PR. Merge each stack bottom-up and retarget each child to main after its parent lands.
- #15 test against existing organisations, then #16 "Used in" sections, then #17 Kubernetes case, then #18 project tests.
- #19 pilot templates as chains, then #20 automation layer.
- #21 README scope (G-033) on its own. Merge it first.

## naive-plugins

- #19 Ledger G-039 (harness meaning). It merges cleanly.
- #15, #16 and #17 are weekly Polity pulse docs that look misfiled in naive-plugins. Move them to the Polity repo or close them, Torian's call.

## After

- Delete merged branches. Run `git worktree prune` and remove the worktrees under `~/workspace/.worktrees/everything-ecosystem/` whose branches are merged: marketing-site, brand-kit, main-baseline, baseline-s2, demo-release, first-venture-defaults and port-move.
- Bump and publish `naive-framework` and `create-venture` from main once steps 1 and 2 are in.
