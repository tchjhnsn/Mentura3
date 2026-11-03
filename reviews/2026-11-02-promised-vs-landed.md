# Promised vs landed: tchjhnsn/everything-ecosystem, Nov 2, 2026

Copied from the Nov 2 note. Citations were updated to commit 9faf5b8.

Checked Monday Nov 2, 2026, about 10:30 PM CT, read only, through the GitHub connector. Nothing was written to GitHub.

Ground truth used: `main` at commit [9faf5b8](https://github.com/tchjhnsn/everything-ecosystem/commit/9faf5b8af0134d46c8fa36c3270b27afc57dcb2b) (merge of #159, Nov 2 4:49 AM CT), `framework` at commit [cb502f9](https://github.com/tchjhnsn/everything-ecosystem/commit/cb502f9b8a68b8d90c72440e5e52a732c1bcef6e) (merge of #151, Nov 1 11:24 PM CT), and the state of every PR created from Oct 26 onward (161 PRs, #1 to #164).

## Summary

- **`framework` has never received a single PR.** Comparing `main...framework` gives "behind by 8, ahead by 0". `framework` is just `main` as it was at Nov 1 11:24 PM CT. Every "framework" PR is still open.
- **Of the 161 PRs since Oct 26:** 132 landed on main (130 of them also on framework, because framework was cut after them). 0 landed on framework only. 2 landed on main but not framework (#153, #159). 17 are still open, and 7 of those have been open more than a day. 12 were closed unmerged; 10 of those were redone in later PRs, 1 was a preview never meant to merge, and 1 set (stages B to E) was only partly redone.
- **READMEs: verdict, never landed.** The root `README.md` was last changed Oct 29 (commit 16eb60c). It has zero Markdown links. None of the 7 layer READMEs exists on main. The PR that adds them ([#148](https://github.com/tchjhnsn/everything-ecosystem/pull/148)) has sat as a draft since Nov 1 3:40 AM CT, pointed at a branch that was already merged, so it can never merge as is. None of the 25 steps in our Nov 2 design was opened as a PR.
- **Codebase structure: verdict, never built.** The top-level layout on main and framework is the same 31 entries it was when we audited it. main has 1,462 files in 467 folders, exactly the counts in our design snapshot at cb502f9. `interface/` still has 22 files at its top level, and no PR was ever opened to restructure the repo.
- **Branch and worktree controls: verdict, never built.** Neither `main` nor `framework` is protected. Auto-delete of merged branches is off, and the repo has 153 branches. No workflow, script, `.cursor/worktrees.json` or `AGENTS.md` rule implements any of the 8 changes in our Nov 1 research. The decision record is still only an item in the pending queue.
- **Claims check:** of 14 claims I (or an agent I ran) made that I could check against the repo, 8 are true, 3 are partly true and 3 are false or stale. The transcripts of the main chat aren't readable from here, so the claims come from the conversation summary I was given.

## 1. README and docs conventions

**Design:** an assistant working note not kept in the repo (`readme-docs-conventions.md`, Nov 2). It proposes `schema/check-docs.mjs` (rules D1 to D10), `docs/book.json`, generated README blocks, a 25-step migration (one item per PR), and fixes to stale facts in `AGENTS.md`.

**Verdict: never landed.** Only the template and the nearest-README rule from Nov 1 are on main.

What is on main:
- [#122](https://github.com/tchjhnsn/everything-ecosystem/pull/122) "READMEs as docs next to the code: nearest-README rule, link check, template", merged Nov 1 3:39 AM CT. It added `docs/readme-template.md` and changed `schema/check-docs-claims.mjs`, `.github/workflows/docs-required.yml`, `AGENTS.md`, `schema/README.md` and 2 small READMEs (8 files). This predates the Nov 2 design.
- Root `README.md`: the last 10 commits that touched it run from Oct 27 to Oct 29. The newest is 16eb60c (Oct 29, "Naive's scaffolding is a central data management structure"). It has 0 Markdown links. It still says "Department catalog", though EE-090 retired "departments".
- `schema/README.md`: last touched Nov 1 10:58 PM CT (commit f59042f), by the operating-rules work, not by the docs work.
- 82 README.md files exist on main. At the top two levels there are only: `README.md`, `console/`, `frameworks/`, `lean/`, `platform/`, `schema/`.

What the design calls for that is missing on main and on framework (each checked in the main tree):
`schema/check-docs.mjs`, `docs/book.json`, `docs/SUMMARY.md`, `docs/README.md`, `docs/design/README.md`, `purpose/README.md`, `knowledge/README.md`, `operations/README.md`, `evidence/README.md`, `governance/README.md`, `interface/README.md`, `packages/README.md`, `agents/README.md`, `beta/README.md`, `scripts/README.md`, `site/README.md`, `verification/README.md`. That is 17 of 17 missing. `AGENTS.md` still names `execution/tooling/` (line 76), a stale fact the design listed as step 2.

Where the work is stuck:
- [#148](https://github.com/tchjhnsn/everything-ecosystem/pull/148) "READMEs for the main folders, on the template": open draft, created Nov 1 3:40 AM CT. It adds 7 READMEs (`evidence`, `governance`, `interface`, `knowledge`, `operations`, `packages`, `purpose`) and links them from the root README. Its base is `claude/readmes-docs-as-code`, the #122 branch, which merged 1 minute before #148 was opened. Its own body says "Retarget to `main` once #122 merges." That retarget never happened. GitHub reports it as mergeable (clean) into the dead branch, which does nothing for main.
- No PR from Oct 26 onward implements any of the design's 25 migration steps.

## 2. Codebase structure

**Design:** section 6(a) of `readme-docs-conventions.md`: "the folder tree is the table of contents". Keep folders under about 12 direct code files; split `interface/` into `router/`, `context/`, `writes/`, `boundaries/` and `observability/`; resolve `investor`/`investors` and `skill`/`skills`; fold `frameworks/` into `purpose/frameworks/`. The design itself recommended doing the `interface/` split only after rules D1 to D4 enforce (open decision 6). No other restructure note for the repo exists in the assistant working notes, which were not kept in the repo. The older handoff was an assistant working note not kept in the repo (`naive-packages-and-design-additions.md`). It is about the layout inside a venture, not the repo.

**Verdict: never built.** No PR was ever opened for it.

Evidence:
- Top-level layout, identical on `main` and `framework` (31 entries): `.claude-plugin/`, `.gitattributes`, `.github/`, `.gitignore`, `AGENTS.md`, `LICENSE`, `README.md`, `agents/`, `beta/`, `console/`, `docs/`, `eslint.config.mjs`, `evidence/`, `frameworks/`, `governance/`, `instance/`, `interface/`, `knowledge/`, `lean/`, `operations/`, `package-lock.json`, `package.json`, `packages/`, `platform/`, `purpose/`, `schema/`, `scripts/`, `site/`, `test.mjs`, `tsconfig.json`, `tsconfig.strict.json`, `verification/`. Only `site/`, `verification/` and `.github/` differ in content between the two branches.
- main has 1,462 files and 467 folders, the same counts our design recorded at cb502f9. Nothing moved.
- Files per top-level folder on main: `schema/` 505, `verification/` 237, `site/` 166, `instance/` 91, `purpose/` 60, `console/` 59, `interface/` 54, `packages/` 54, `governance/` 53, `docs/` 43, `platform/` 38, `operations/` 21, `evidence/` 20, `knowledge/` 17, `lean/` 10, `scripts/` 9, `frameworks/` 5, `.github/` 5, `.claude-plugin/` 2, `agents/` 1, `beta/` 1. `schema/` alone holds about a third of the repo.
- `interface/` still has 22 files at its top level (`router.mjs`, `writes.mjs`, `context.mjs` and so on). `interface/router/` doesn't exist. `frameworks/` still sits at top level.
- Older, venture-level structure work did land: EE-086 stages ([#39](https://github.com/tchjhnsn/everything-ecosystem/pull/39), [#46](https://github.com/tchjhnsn/everything-ecosystem/pull/46), [#95](https://github.com/tchjhnsn/everything-ecosystem/pull/95), [#113](https://github.com/tchjhnsn/everything-ecosystem/pull/113)) and the package split (commit c42fa6b, EE-071). That is about how a venture's folders look, not about cleaning up this repo. One piece of the Oct 28 handoff was never done: Stage D, moving the board. `interface/demo/board.mjs` is still there and `platform/board/` doesn't exist.

## 3. Branch and worktree controls

**Design:** an assistant working note not kept in the repo (`worktrees-branches-research.md`, Nov 1). It proposes 8 changes: a worktree per item; `<agent>/<item>` branch names with auto-delete after merge; a 24 h stale mark and 48 h limit; a cap of 2 open branches per agent; strict up-to-date merges; quality evidence tied to the merged SHA; feature flags; stacks at most 2 to 3 deep. It also adds noun and verb rules for branches and worktrees.

**Verdict: never built.** Nothing exists in code, CI, repo settings or `AGENTS.md`.

Evidence:
- Branch protection: `main` has `protected: false` with protection `enabled: false`. `framework` is the same. Strict up-to-date merges (change 5) therefore can't be enforced. Rulesets can't be read with the connector I have, so I couldn't check them, but no protection summary shows any.
- Repo settings (`GET /repos`): `delete_branch_on_merge: false` (change 2 not done), `allow_update_branch: false`, `allow_auto_merge: false`. The repo is private and owned by a personal account (`owner.type: User`), so a merge queue isn't available, as the research said.
- Branches: 153 exist (2 pages of the branch list), most of them from merged PRs.
- Workflows on main: `docs-required.yml`, `lean.yml`, `pr-review-comment.yml`, `pr-review.yml`, `test.yml`. None checks branch age, branch names or WIP.
- Code search for "worktree" on main finds only the `naive port` command and its docs (`schema/port-venture.mjs`, `schema/port-test.mjs`, `docs/design/statecharts/port.md`, `site/content/docs/reference/cli.mdx`, `docs/design/PR_CATCHUP_PLAN_2026-10-29.md`). `.cursor/worktrees.json` doesn't exist. `AGENTS.md` has one branch rule: "Torian merges. Agents open draft PRs and do not merge." (line 74).
- No PR from Oct 26 onward mentions worktrees as its subject. The "worktrees/branches + verbs" decision record is still only an entry in the pending queue (todo `dr-queue`), never opened.
- Related CI change that did land: [#159](https://github.com/tchjhnsn/everything-ecosystem/pull/159) (merged into main Nov 2 4:49 AM CT) limits `test.yml` and `lean.yml` to PRs whose base is `main`. `framework` still has the old files, which run on every PR. If main is merged into framework unchanged, PRs into framework will stop running the suite and the Lean build. This matches the risk in the diagnosis.

## Cross-reference with the unwired diagnosis

`docs/reviews/2026-11-02-unwired-diagnosis.md` describes the same pattern, from a different angle: work built and then never connected. Three of its facts I re-checked tonight still hold. `test.mjs:123` on main runs `schema/terms/admit.ts --check`. `schema/terms/admitted.json` holds 9 terms. `AGENTS.md` on main never mentions Lean, EE-095 or `schema/terms`. This ledger adds a second failure mode: work that was designed or built but never reached a branch, because a PR sat as a draft, pointed at a dead base, or was never opened.

## PR table (Oct 26 onward, newest first)

"On main" and "On framework" mean the change is in that branch's history. Every merge into main up to #151 is on framework, because framework was cut from that commit. Times are CT.

| PR | Title | Base | Opened | State | On main | On framework | Flag / note |
|---|---|---|---|---|---|---|---|
| [#164](https://github.com/tchjhnsn/everything-ecosystem/pull/164) | EE-107: vocabulary objects, shapes, and a parent check | framework | Nov 2 1:41 PM CT | open draft | no | no |  |
| [#163](https://github.com/tchjhnsn/everything-ecosystem/pull/163) | EE-107: change verbs, tiers, and vocabulary objects | framework | Nov 2 12:46 PM CT | open draft | no | no |   |
| [#162](https://github.com/tchjhnsn/everything-ecosystem/pull/162) | EE-106: Naive is the symbolic system and runs agents | framework | Nov 2 7:34 AM CT | open draft | no | no |   |
| [#161](https://github.com/tchjhnsn/everything-ecosystem/pull/161) | EE-105: accounts, organizations and ventures | framework | Nov 2 6:22 AM CT | open draft | no | no |   |
| [#160](https://github.com/tchjhnsn/everything-ecosystem/pull/160) | Add the Socratic founder puzzle | main | Nov 2 4:34 AM CT | open | no | no |   |
| [#159](https://github.com/tchjhnsn/everything-ecosystem/pull/159) | CI: run the full suite only on pull requests into main | main | Nov 2 4:20 AM CT | merged into main Nov 2 4:49 AM CT | yes | no | main only |
| [#158](https://github.com/tchjhnsn/everything-ecosystem/pull/158) | Decision EE-104: anticipation replaces precog in the ontology | cursor/noun-relations-graph-0d5a | Nov 2 3:20 AM CT | open | no | no | Stacked on #157 |
| [#157](https://github.com/tchjhnsn/everything-ecosystem/pull/157) | Decision EE-103: typed ontology relations and a generated noun graph | framework | Nov 2 3:12 AM CT | open | no | no |   |
| [#156](https://github.com/tchjhnsn/everything-ecosystem/pull/156) | Decision EE-102: coordinate through typed provenance records routed by the Lead | cursor/jev-llm-code-split-9a9d | Nov 2 3:12 AM CT | open | no | no | Stacked on #155 |
| [#155](https://github.com/tchjhnsn/everything-ecosystem/pull/155) | Decision EE-101: language models write, Jev judges and routes, code checks | framework | Nov 2 3:12 AM CT | open | no | no |   |
| [#154](https://github.com/tchjhnsn/everything-ecosystem/pull/154) | Cut pull request CI cost: cancel replaced runs and skip slow groups | main | Nov 2 12:30 AM CT | open draft | no | no |   |
| [#153](https://github.com/tchjhnsn/everything-ecosystem/pull/153) | Gate docs and templates behind a waitlist placeholder (R-45) | main | Nov 1 11:27 PM CT | merged into main Nov 2 4:14 AM CT | yes | no | main only |
| [#152](https://github.com/tchjhnsn/everything-ecosystem/pull/152) | Prove the Wilson and SPRT bounds for standing rules | main | Nov 1 11:13 PM CT | merged into main Nov 1 11:23 PM CT | yes | yes |   |
| [#151](https://github.com/tchjhnsn/everything-ecosystem/pull/151) | Add the default operating-rules module | main | Nov 1 10:34 PM CT | merged into main Nov 1 11:24 PM CT | yes | yes |   |
| [#150](https://github.com/tchjhnsn/everything-ecosystem/pull/150) | Add the deterministic membership gate for handoff packages | main | Nov 1 9:30 PM CT | merged into main Nov 1 10:46 PM CT | yes | yes |   |
| [#149](https://github.com/tchjhnsn/everything-ecosystem/pull/149) | Retire foundation: its records are the venture's identity (EE-091) | main | Nov 1 4:33 AM CT | open draft | no | no | STALE >1 day  |
| [#148](https://github.com/tchjhnsn/everything-ecosystem/pull/148) | READMEs for the main folders, on the template | claude/readmes-docs-as-code | Nov 1 3:40 AM CT | open draft | no | no | STALE >1 day; Base branch claude/readmes-docs-as-code was already merged (#122); never retargeted |
| [#147](https://github.com/tchjhnsn/everything-ecosystem/pull/147) | Handoff to Grokbot: venture records, anatomy and relationship theorems | main | Oct 31 9:57 PM CT | merged into main Nov 1 5:06 AM CT | yes | yes |   |
| [#146](https://github.com/tchjhnsn/everything-ecosystem/pull/146) | fix(console): close #140's review items | main | Oct 31 9:42 PM CT | merged into main Oct 31 9:56 PM CT | yes | yes |   |
| [#145](https://github.com/tchjhnsn/everything-ecosystem/pull/145) | Harness takes its industry sense; our multi-layer tool is a workbench (EE-096) | main | Oct 31 9:17 PM CT | merged into main Nov 1 4:10 AM CT | yes | yes |   |
| [#144](https://github.com/tchjhnsn/everything-ecosystem/pull/144) | Hand the PR review gate to Grokbot | main | Oct 31 8:27 PM CT | open draft | no | no | STALE >1 day  |
| [#142](https://github.com/tchjhnsn/everything-ecosystem/pull/142) | Decision records EE-089..093, the affects grammar, and interface renamed harness | main | Oct 31 7:53 PM CT | merged into main Oct 31 9:06 PM CT | yes | yes |   |
| [#140](https://github.com/tchjhnsn/everything-ecosystem/pull/140) | fix(console): accept collection drafts and keep held variants | main | Oct 31 7:24 PM CT | merged into main Oct 31 8:37 PM CT | yes | yes |   |
| [#138](https://github.com/tchjhnsn/everything-ecosystem/pull/138) | Console: close the review gaps on signing, drafts and playbooks | main | Oct 31 6:15 PM CT | merged into main Oct 31 6:35 PM CT | yes | yes |   |
| [#137](https://github.com/tchjhnsn/everything-ecosystem/pull/137) | Run the test suite in parallel with cheap checks first | main | Oct 31 6:06 PM CT | merged into main Oct 31 6:39 PM CT | yes | yes |   |
| [#136](https://github.com/tchjhnsn/everything-ecosystem/pull/136) | Console: state exit criteria, add evidence, and sign as any founder | main | Oct 31 5:08 PM CT | merged into main Oct 31 5:29 PM CT | yes | yes |   |
| [#135](https://github.com/tchjhnsn/everything-ecosystem/pull/135) | Founders before ventures, checked definitions, and Lean proofs | main | Oct 31 3:54 PM CT | merged into main Nov 1 3:40 AM CT | yes | yes |   |
| [#134](https://github.com/tchjhnsn/everything-ecosystem/pull/134) | Console: show what comes next and sign the phase change | main | Oct 31 3:43 PM CT | merged into main Oct 31 4:32 PM CT | yes | yes |   |
| [#133](https://github.com/tchjhnsn/everything-ecosystem/pull/133) | Console: founders write the mission, competence and tagline | main | Oct 31 9:13 AM CT | merged into main Oct 31 3:05 PM CT | yes | yes |   |
| [#132](https://github.com/tchjhnsn/everything-ecosystem/pull/132) | Knowledge: SDLC catalog after ISO/IEC/IEEE 12207 (R-26) | main | Oct 31 8:07 AM CT | merged into main Nov 1 4:25 AM CT | yes | yes |   |
| [#131](https://github.com/tchjhnsn/everything-ecosystem/pull/131) | Console: founders write the records the docket asks for (step 3) | main | Oct 31 7:43 AM CT | merged into main Oct 31 8:07 AM CT | yes | yes |   |
| [#130](https://github.com/tchjhnsn/everything-ecosystem/pull/130) | Discovery interview workflow: leads and prospects, private contacts, dossiers, meetings, packet | main | Oct 31 6:54 AM CT | open draft | no | no | STALE >1 day  |
| [#129](https://github.com/tchjhnsn/everything-ecosystem/pull/129) | Console: per-account workspace isolation and one-time claim (step 2) | main | Oct 31 6:14 AM CT | merged into main Oct 31 7:05 AM CT | yes | yes |   |
| [#128](https://github.com/tchjhnsn/everything-ecosystem/pull/128) | Console: accounts and signed identity (step 1) | main | Oct 31 3:28 AM CT | merged into main Oct 31 5:34 AM CT | yes | yes |   |
| [#127](https://github.com/tchjhnsn/everything-ecosystem/pull/127) | Remove the /why and /for nav links until the wording is approved | main | Oct 31 3:16 AM CT | merged into main Oct 31 4:03 AM CT | yes | yes |   |
| [#126](https://github.com/tchjhnsn/everything-ecosystem/pull/126) | Read the problem record from the file the foundation/problem route writes | main | Oct 31 12:38 AM CT | merged into main Oct 31 12:59 AM CT | yes | yes |   |
| [#125](https://github.com/tchjhnsn/everything-ecosystem/pull/125) | Design note: requirements for identity, functions, phases and provenance | main | Oct 30 5:47 PM CT | merged into main Nov 1 3:40 AM CT | yes | yes |   |
| [#124](https://github.com/tchjhnsn/everything-ecosystem/pull/124) | Harden the record type generator (#114 review) | main | Oct 30 4:07 PM CT | merged into main Nov 1 3:59 AM CT | yes | yes |   |
| [#123](https://github.com/tchjhnsn/everything-ecosystem/pull/123) | Lint .jsx with the typescript-eslint parser so JSX tags count as uses | main | Oct 30 3:36 PM CT | merged into main Nov 1 3:40 AM CT | yes | yes |   |
| [#122](https://github.com/tchjhnsn/everything-ecosystem/pull/122) | READMEs as docs next to the code: nearest-README rule, link check, template | main | Oct 30 3:27 PM CT | merged into main Nov 1 3:39 AM CT | yes | yes |   |
| [#121](https://github.com/tchjhnsn/everything-ecosystem/pull/121) | Add the venture console (Mentura) | main | Oct 30 1:54 PM CT | merged into main Oct 31 1:27 AM CT | yes | yes |   |
| [#120](https://github.com/tchjhnsn/everything-ecosystem/pull/120) | Type-check scripts/ clean (TypeScript phase 1) | main | Oct 30 1:27 PM CT | merged into main Nov 1 4:25 AM CT | yes | yes |   |
| [#119](https://github.com/tchjhnsn/everything-ecosystem/pull/119) | Close the should-fix items from the #76, #88, #89 and #98 reviews | main | Oct 30 1:04 PM CT | merged into main Oct 30 3:00 PM CT | yes | yes |   |
| [#118](https://github.com/tchjhnsn/everything-ecosystem/pull/118) | Redesign the Naive home page around the ethos | cursor/naive-site-combined | Oct 30 12:53 PM CT | merged into cursor/naive-site-combined Oct 30 3:16 PM CT | yes | yes | Base branch was merged into main by #63 |
| [#117](https://github.com/tchjhnsn/everything-ecosystem/pull/117) | Run the create-venture test on an ephemeral port | main | Oct 30 12:22 PM CT | merged into main Oct 30 2:04 PM CT | yes | yes |   |
| [#116](https://github.com/tchjhnsn/everything-ecosystem/pull/116) | Close merge and approve authority holes | main | Oct 30 5:21 AM CT | merged into main Oct 30 12:20 PM CT | yes | yes |   |
| [#115](https://github.com/tchjhnsn/everything-ecosystem/pull/115) | Decision fixes: merge checks target schemas, impact needs a merge, inherited reasons stay frozen | main | Oct 30 2:23 AM CT | merged into main Oct 30 3:49 AM CT | yes | yes |   |
| [#114](https://github.com/tchjhnsn/everything-ecosystem/pull/114) | Generate record types from the JSON Schemas (TypeScript phase 2) | main | Oct 30 2:21 AM CT | merged into main Oct 30 2:50 PM CT | yes | yes |   |
| [#113](https://github.com/tchjhnsn/everything-ecosystem/pull/113) | Structure checks read where files sit (#87, #95, #90 follow-ups) | main | Oct 30 2:21 AM CT | merged into main Oct 30 4:05 AM CT | yes | yes |   |
| [#112](https://github.com/tchjhnsn/everything-ecosystem/pull/112) | Type-check schema/ clean (TypeScript phase 1) | main | Oct 30 2:21 AM CT | merged into main Oct 30 2:41 PM CT | yes | yes |   |
| [#111](https://github.com/tchjhnsn/everything-ecosystem/pull/111) | Type-check interface/ clean (TypeScript phase 1) | main | Oct 30 2:21 AM CT | merged into main Oct 30 2:32 PM CT | yes | yes |   |
| [#110](https://github.com/tchjhnsn/everything-ecosystem/pull/110) | Type-check platform/ clean (TypeScript phase 1) | main | Oct 30 2:21 AM CT | merged into main Oct 30 2:13 PM CT | yes | yes |   |
| [#109](https://github.com/tchjhnsn/everything-ecosystem/pull/109) | Empty the known-leaks list: main is red since #96 and #99 met | main | Oct 30 1:26 AM CT | merged into main Oct 30 1:30 AM CT | yes | yes |   |
| [#108](https://github.com/tchjhnsn/everything-ecosystem/pull/108) | Meeting recorder integrations: transcripts into raw sources and interview drafts | claude/mac-validation-study | Oct 30 1:19 AM CT | open draft | no | no | STALE >1 day  |
| [#107](https://github.com/tchjhnsn/everything-ecosystem/pull/107) | Venture relationships: types, roles, flows and boundary rules | main | Oct 30 1:18 AM CT | open draft | no | no | STALE >1 day  |
| [#106](https://github.com/tchjhnsn/everything-ecosystem/pull/106) | Validation study: interview, feedback and bug records, telemetry, plugin beta gate | main | Oct 30 12:32 AM CT | merged into main Oct 30 4:22 AM CT | yes | yes |   |
| [#105](https://github.com/tchjhnsn/everything-ecosystem/pull/105) | Type-check the JavaScript with tsc (TypeScript phase 1) | main | Oct 30 12:20 AM CT | merged into main Oct 30 1:24 PM CT | yes | yes |   |
| [#104](https://github.com/tchjhnsn/everything-ecosystem/pull/104) | Decision index: update() equals a rebuild, so overdue decisions re-rank | main | Oct 29 11:54 PM CT | merged into main Oct 30 12:20 AM CT | yes | yes |   |
| [#103](https://github.com/tchjhnsn/everything-ecosystem/pull/103) | Route naive publish check to the publish lint, and run the lint inside the gate | main | Oct 29 11:54 PM CT | merged into main Oct 30 4:53 AM CT | yes | yes |   |
| [#102](https://github.com/tchjhnsn/everything-ecosystem/pull/102) | Decisions: an agent's propose() never un-decides a decided decision | main | Oct 29 11:53 PM CT | merged into main Oct 30 1:55 AM CT | yes | yes |   |
| [#101](https://github.com/tchjhnsn/everything-ecosystem/pull/101) | Internal terms: the founder-edited dictionary, its schema, venture terms in the site check, warn terms | main | Oct 29 11:52 PM CT | merged into main Oct 30 1:38 AM CT | yes | yes |   |
| [#100](https://github.com/tchjhnsn/everything-ecosystem/pull/100) | Decision merges: delegable by grant, one-way doors never; merge stales public variants; decided always names who decided | main | Oct 29 11:45 PM CT | merged into main Oct 30 2:08 AM CT | yes | yes |   |
| [#99](https://github.com/tchjhnsn/everything-ecosystem/pull/99) | Leak canaries: every record seeded, site facts and both artifacts built, known leaks only shrink | main | Oct 29 11:44 PM CT | merged into main Oct 30 1:03 AM CT | yes | yes |   |
| [#98](https://github.com/tchjhnsn/everything-ecosystem/pull/98) | Field visibility: only a person approves public; the public reader; the publish check | main | Oct 29 11:40 PM CT | merged into main Oct 30 3:16 AM CT | yes | yes |   |
| [#97](https://github.com/tchjhnsn/everything-ecosystem/pull/97) | Premise-attack linter for internal records | main | Oct 29 11:24 PM CT | merged into main Oct 30 3:57 AM CT | yes | yes |   |
| [#96](https://github.com/tchjhnsn/everything-ecosystem/pull/96) | Gate item 2: naive publish build, every public word through the gate | main | Oct 29 11:17 PM CT | merged into main Oct 30 12:55 AM CT | yes | yes |   |
| [#95](https://github.com/tchjhnsn/everything-ecosystem/pull/95) | Port naive upgrade --layout structured from #41 onto k-base/ | main | Oct 29 11:07 PM CT | merged into main Oct 30 1:46 AM CT | yes | yes |   |
| [#94](https://github.com/tchjhnsn/everything-ecosystem/pull/94) | Workspace init with a venture, rename, clock and calendar | main | Oct 29 10:47 PM CT | merged into main Oct 30 5:13 AM CT | yes | yes |   |
| [#93](https://github.com/tchjhnsn/everything-ecosystem/pull/93) | User frameworks and playbooks, and transcript diagnosis | main | Oct 29 10:15 PM CT | merged into main Oct 30 5:31 AM CT | yes | yes |   |
| [#92](https://github.com/tchjhnsn/everything-ecosystem/pull/92) | Design notes from #75, without the confidential research docs | main | Oct 29 9:51 PM CT | merged into main Oct 29 10:14 PM CT | yes | yes |   |
| [#91](https://github.com/tchjhnsn/everything-ecosystem/pull/91) | Port plan reads git status without optional locks | main | Oct 29 9:43 PM CT | merged into main Oct 29 10:13 PM CT | yes | yes |   |
| [#90](https://github.com/tchjhnsn/everything-ecosystem/pull/90) | Docs lint: docs claim only what is built | main | Oct 29 9:10 PM CT | merged into main Oct 29 10:05 PM CT | yes | yes |   |
| [#89](https://github.com/tchjhnsn/everything-ecosystem/pull/89) | Publish lint pipeline: claims, marks, personal data, secrets, waivers and report | main | Oct 29 9:02 PM CT | merged into main Oct 29 11:24 PM CT | yes | yes |   |
| [#88](https://github.com/tchjhnsn/everything-ecosystem/pull/88) | Publish manifest and the one-way/two-way door gate | main | Oct 29 9:02 PM CT | merged into main Oct 29 11:13 PM CT | yes | yes |   |
| [#87](https://github.com/tchjhnsn/everything-ecosystem/pull/87) | Canonical core (goals, requirements, exit criteria, constraints) and thinking frameworks (telos, ambition tiers) | main | Oct 29 8:52 PM CT | merged into main Oct 29 10:51 PM CT | yes | yes |   |
| [#86](https://github.com/tchjhnsn/everything-ecosystem/pull/86) | PR review agent (content and design without screenshots) and ESLint | main | Oct 29 8:37 PM CT | merged into main Oct 30 4:14 AM CT | yes | yes |   |
| [#85](https://github.com/tchjhnsn/everything-ecosystem/pull/85) | Live decision index: propagation, phase weight, requirement lift, rank history | main | Oct 29 8:37 PM CT | merged into main Oct 29 10:59 PM CT | yes | yes |   |
| [#84](https://github.com/tchjhnsn/everything-ecosystem/pull/84) | The Naive workspace: settings, cross-venture reads, naive capture and naive inbox | main | Oct 29 8:25 PM CT | merged into main Oct 29 8:25 PM CT | yes | yes |   |
| [#83](https://github.com/tchjhnsn/everything-ecosystem/pull/83) | Decision reasons with citations | main | Oct 29 8:17 PM CT | merged into main Oct 29 10:43 PM CT | yes | yes |   |
| [#82](https://github.com/tchjhnsn/everything-ecosystem/pull/82) | Research engine v3 (confidential, platform/research) | main | Oct 29 7:57 PM CT | merged into main Nov 1 4:38 AM CT | yes | yes |   |
| [#81](https://github.com/tchjhnsn/everything-ecosystem/pull/81) | Decision roadmaps and lifecycle playbooks | main | Oct 29 7:56 PM CT | merged into main Oct 30 12:47 AM CT | yes | yes |   |
| [#80](https://github.com/tchjhnsn/everything-ecosystem/pull/80) | Artifacts are records: what gets published, each naming the records it was built from | main | Oct 29 7:53 PM CT | merged into main Oct 29 7:53 PM CT | yes | yes |   |
| [#79](https://github.com/tchjhnsn/everything-ecosystem/pull/79) | Decision impact: map what a merged decision affects across every function | main | Oct 29 7:47 PM CT | merged into main Oct 29 10:35 PM CT | yes | yes |   |
| [#78](https://github.com/tchjhnsn/everything-ecosystem/pull/78) | Roles, delegation and the verification substrate | main | Oct 29 7:41 PM CT | merged into main Oct 30 4:45 AM CT | yes | yes |   |
| [#77](https://github.com/tchjhnsn/everything-ecosystem/pull/77) | Decision versions: new versions, separate merge, rollback | main | Oct 29 7:29 PM CT | merged into main Oct 29 10:13 PM CT | yes | yes |   |
| [#76](https://github.com/tchjhnsn/everything-ecosystem/pull/76) | Publishing gate: field visibility, leak check and canaries | main | Oct 29 7:24 PM CT | merged into main Oct 29 10:22 PM CT | yes | yes |   |
| [#75](https://github.com/tchjhnsn/everything-ecosystem/pull/75) | Design notes: publishing gate, visibility, decision versions, roadmaps; research engine (confidential) | main | Oct 29 7:14 PM CT | closed unmerged Oct 30 12:20 PM CT | no | no | closed unmerged Redone: split into #92 (merged) and #82 (merged) |
| [#74](https://github.com/tchjhnsn/everything-ecosystem/pull/74) | A decided mission lands on its own; meet() checks the telos schema | main | Oct 29 7:12 PM CT | merged into main Oct 29 7:12 PM CT | yes | yes |   |
| [#73](https://github.com/tchjhnsn/everything-ecosystem/pull/73) | Gate fixes: agents cannot settle decisions or publish the brand; mentura phase passes the lifecycle gate; accept in k-base | main | Oct 29 6:52 PM CT | merged into main Oct 29 6:53 PM CT | yes | yes |   |
| [#72](https://github.com/tchjhnsn/everything-ecosystem/pull/72) | Restore the brand kit (#44) on main, with its handoff docs | main | Oct 29 5:46 PM CT | merged into main Oct 29 5:46 PM CT | yes | yes |   |
| [#71](https://github.com/tchjhnsn/everything-ecosystem/pull/71) | Investors lint: raise, terms, and unconfirmed update numbers | main | Oct 29 5:42 PM CT | merged into main Oct 30 5:22 PM CT | yes | yes |   |
| [#70](https://github.com/tchjhnsn/everything-ecosystem/pull/70) | Product lint: ICP, feature jobs, and pricing | main | Oct 29 5:41 PM CT | merged into main Oct 30 5:11 PM CT | yes | yes |   |
| [#69](https://github.com/tchjhnsn/everything-ecosystem/pull/69) | Playbook: lean validation (interview plan and problem evidence) | main | Oct 29 5:41 PM CT | merged into main Oct 31 1:09 AM CT | yes | yes |   |
| [#68](https://github.com/tchjhnsn/everything-ecosystem/pull/68) | Money lint: transfer approver and account owner | main | Oct 29 5:41 PM CT | merged into main Oct 30 5:01 PM CT | yes | yes |   |
| [#67](https://github.com/tchjhnsn/everything-ecosystem/pull/67) | Add the Shape Up playbook for six-week cycles | main | Oct 29 5:40 PM CT | merged into main Oct 30 7:21 PM CT | yes | yes |   |
| [#66](https://github.com/tchjhnsn/everything-ecosystem/pull/66) | Customers lint: ICP match and promises the product keeps | main | Oct 29 5:39 PM CT | merged into main Oct 30 4:51 PM CT | yes | yes |   |
| [#65](https://github.com/tchjhnsn/everything-ecosystem/pull/65) | Validation lint: claims, shelf life, agent grades, discovery-grade decisions | main | Oct 29 5:39 PM CT | merged into main Oct 30 4:41 PM CT | yes | yes |   |
| [#64](https://github.com/tchjhnsn/everything-ecosystem/pull/64) | Playbook: Netflix culture for the people team plan | main | Oct 29 5:38 PM CT | merged into main Oct 30 6:54 PM CT | yes | yes |   |
| [#63](https://github.com/tchjhnsn/everything-ecosystem/pull/63) | Naive site: Nextra docs, Blog, Templates and playbooks, Showcase (combined preview) | main | Oct 29 5:38 PM CT | merged into main Oct 30 3:46 PM CT | yes | yes |   |
| [#62](https://github.com/tchjhnsn/everything-ecosystem/pull/62) | Playbook: Bessemer SaaS metrics (finance) | main | Oct 29 5:37 PM CT | merged into main Oct 30 6:45 PM CT | yes | yes |   |
| [#61](https://github.com/tchjhnsn/everything-ecosystem/pull/61) | Draft playbook: Y Combinator seed fundraising | main | Oct 29 5:37 PM CT | merged into main Oct 30 6:36 PM CT | yes | yes |   |
| [#60](https://github.com/tchjhnsn/everything-ecosystem/pull/60) | Add the stripe-docs product playbook | main | Oct 29 5:35 PM CT | merged into main Oct 30 6:27 PM CT | yes | yes |   |
| [#59](https://github.com/tchjhnsn/everything-ecosystem/pull/59) | Draft: founder-led sales playbook | main | Oct 29 5:35 PM CT | merged into main Oct 30 7:12 PM CT | yes | yes |   |
| [#58](https://github.com/tchjhnsn/everything-ecosystem/pull/58) | Finance lint: spend, price below cost, and metric targets | main | Oct 29 5:35 PM CT | merged into main Oct 30 4:03 PM CT | yes | yes |   |
| [#57](https://github.com/tchjhnsn/everything-ecosystem/pull/57) | Add the HubSpot inbound content-plan playbook | main | Oct 29 5:34 PM CT | merged into main Oct 30 6:18 PM CT | yes | yes |   |
| [#56](https://github.com/tchjhnsn/everything-ecosystem/pull/56) | Draft playbook: jobs for each ICP profile | main | Oct 29 5:34 PM CT | merged into main Oct 30 7:03 PM CT | yes | yes |   |
| [#55](https://github.com/tchjhnsn/everything-ecosystem/pull/55) | Legal lint: public claims and agreements | main | Oct 29 5:33 PM CT | merged into main Oct 30 3:53 PM CT | yes | yes |   |
| [#54](https://github.com/tchjhnsn/everything-ecosystem/pull/54) | Add the apple-launch marketing playbook | main | Oct 29 5:32 PM CT | merged into main Oct 30 6:09 PM CT | yes | yes |   |
| [#53](https://github.com/tchjhnsn/everything-ecosystem/pull/53) | Add the Amazon narrative-memo playbook for decisions | main | Oct 29 5:32 PM CT | merged into main Oct 30 5:59 PM CT | yes | yes |   |
| [#52](https://github.com/tchjhnsn/everything-ecosystem/pull/52) | People lint: role, hire, and decision owner | main | Oct 29 5:32 PM CT | merged into main Oct 30 3:43 PM CT | yes | yes |   |
| [#51](https://github.com/tchjhnsn/everything-ecosystem/pull/51) | Foundation lint: mission, ICP jobs, alignment checks, problem forms | main | Oct 29 5:31 PM CT | merged into main Oct 30 3:33 PM CT | yes | yes |   |
| [#50](https://github.com/tchjhnsn/everything-ecosystem/pull/50) | Add a Naive blog, with drafts kept off the public list | main | Oct 29 5:25 PM CT | merged into main Oct 30 3:46 PM CT | yes | yes |   |
| [#49](https://github.com/tchjhnsn/everything-ecosystem/pull/49) | Revert "Brand kit: design-system record, inherited inputs, brand-kit and design-system skills" | main | Oct 29 5:22 PM CT | merged into main Oct 29 5:24 PM CT | yes | yes |   |
| [#48](https://github.com/tchjhnsn/everything-ecosystem/pull/48) | Add a templates and playbooks page | main | Oct 29 5:16 PM CT | merged into main Oct 30 3:46 PM CT | yes | yes |   |
| [#47](https://github.com/tchjhnsn/everything-ecosystem/pull/47) | Move the Naive docs site from Fumadocs to Nextra | main | Oct 29 5:12 PM CT | merged into main Oct 30 3:46 PM CT | yes | yes |   |
| [#46](https://github.com/tchjhnsn/everything-ecosystem/pull/46) | Venture structure stack onto main: layout, port, k-base, lifecycle, skills, playbooks (0.3.0-0.6.0) | main | Oct 29 5:10 PM CT | merged into main Oct 29 5:23 PM CT | yes | yes |   |
| [#45](https://github.com/tchjhnsn/everything-ecosystem/pull/45) | Add a draft Showcase page drawn from the venture records | main | Oct 29 4:52 PM CT | merged into main Oct 30 3:46 PM CT | yes | yes |   |
| [#44](https://github.com/tchjhnsn/everything-ecosystem/pull/44) | Brand kit: design-system record, inherited inputs, brand-kit and design-system skills | claude/mac-function-skills | Oct 29 4:31 PM CT | merged into claude/mac-function-skills Oct 29 5:22 PM CT | yes | yes | Reverted by #49, reapplied (commit 20756f8) and restored by #72 |
| [#43](https://github.com/tchjhnsn/everything-ecosystem/pull/43) | Marketing one-pagers as Claude artifacts; one record per ICP profile | main | Oct 29 4:09 PM CT | merged into main Oct 29 4:58 PM CT | yes | yes |   |
| [#42](https://github.com/tchjhnsn/everything-ecosystem/pull/42) | Release 0.3.0: port moves a folder in unchanged, first-venture defaults, LangSmith port traces | claude/mac-venture-structure-2 | Oct 29 2:57 PM CT | closed unmerged Oct 29 9:19 PM CT | no | no | closed unmerged Redone in #46 and #95 (merged) |
| [#41](https://github.com/tchjhnsn/everything-ecosystem/pull/41) | Move existing ventures onto the structured layout (EE-086 stage 3) | claude/mac-venture-structure-2 | Oct 29 2:33 PM CT | closed unmerged Oct 29 11:21 PM CT | no | no | closed unmerged Redone in #95 (merged) |
| [#40](https://github.com/tchjhnsn/everything-ecosystem/pull/40) | Venture structure stage 2: the structured layout and the org chart (EE-086) | claude/mac-venture-structure | Oct 29 12:57 PM CT | closed unmerged Oct 29 9:19 PM CT | no | no | closed unmerged Redone in #46 (merged) |
| [#39](https://github.com/tchjhnsn/everything-ecosystem/pull/39) | Venture project structure (EE-086): stage 1, the design note | main | Oct 29 12:11 PM CT | merged into main Oct 29 5:23 PM CT | yes | yes |   |
| [#38](https://github.com/tchjhnsn/everything-ecosystem/pull/38) | Naive is a central data management structure, for solo founders and small teams (EE-085) | main | Oct 29 4:43 AM CT | merged into main Oct 30 12:28 AM CT | yes | yes |   |
| [#37](https://github.com/tchjhnsn/everything-ecosystem/pull/37) | Naive as a Claude Code plugin (EE-084) | main | Oct 29 4:05 AM CT | merged into main Oct 30 3:00 AM CT | yes | yes |   |
| [#36](https://github.com/tchjhnsn/everything-ecosystem/pull/36) | Naive as a Claude Code plugin | main | Oct 29 3:33 AM CT | closed unmerged Oct 29 11:06 PM CT | no | no | closed unmerged Redone as #37 (merged) |
| [#35](https://github.com/tchjhnsn/everything-ecosystem/pull/35) | Handoff to Grokbot: prove the unproven parts of Naive, research AI-native docs; Quick start first | main | Oct 29 3:20 AM CT | merged into main Oct 29 10:13 PM CT | yes | yes |   |
| [#34](https://github.com/tchjhnsn/everything-ecosystem/pull/34) | Mentura: frame agents, training pipeline design and own-harness idea | main | Oct 29 2:04 AM CT | open draft | no | no | STALE >1 day  |
| [#33](https://github.com/tchjhnsn/everything-ecosystem/pull/33) | Build the unfinished Next.js concepts, the install chapter and venture types | main | Oct 29 1:11 AM CT | merged into main Oct 29 2:33 AM CT | yes | yes |   |
| [#32](https://github.com/tchjhnsn/everything-ecosystem/pull/32) | Chapter 1: create-venture, naive dev, and an Installation page on the Next.js model | main | Oct 28 11:43 PM CT | merged into main Oct 29 2:33 AM CT | yes | yes |   |
| [#31](https://github.com/tchjhnsn/everything-ecosystem/pull/31) | Rebuild Get Started on the Next.js chapters; wire the gate; status per concept | main | Oct 28 11:07 PM CT | merged into main Oct 28 11:26 PM CT | yes | yes |   |
| [#30](https://github.com/tchjhnsn/everything-ecosystem/pull/30) | naive migrate: rewrite a project as Naive records (EE-076) | main | Oct 28 10:39 PM CT | merged into main Oct 28 10:42 PM CT | yes | yes |   |
| [#29](https://github.com/tchjhnsn/everything-ecosystem/pull/29) | naive upgrade and naive port (EE-076) | main | Oct 28 9:51 PM CT | merged into main Oct 28 10:27 PM CT | yes | yes |   |
| [#28](https://github.com/tchjhnsn/everything-ecosystem/pull/28) | Preview only: everything combined (do not merge) | main | Oct 28 8:36 PM CT | closed unmerged Oct 28 9:47 PM CT | no | no | closed unmerged Preview only, never meant to merge |
| [#27](https://github.com/tchjhnsn/everything-ecosystem/pull/27) | Stage E: layout chain, use model, private, uncertain, the gate, naive typegen | cursor/stage-c-data-raw-48de | Oct 28 7:59 PM CT | closed unmerged Oct 28 9:47 PM CT | no | no | closed unmerged Mostly redone on the c6ek0b thread (naive typegen is in AGENTS.md); not checked item by item |
| [#26](https://github.com/tchjhnsn/everything-ecosystem/pull/26) | Stage C: data packages, streams, and immutable raw | cursor/stage-b-venture-layout-48de | Oct 28 7:53 PM CT | closed unmerged Oct 28 9:47 PM CT | no | no | closed unmerged Partly redone: raw/ and _streams/ exist on main |
| [#25](https://github.com/tchjhnsn/everything-ecosystem/pull/25) | Stage B: venture package folders, route aliases, mentura migrate | cursor/stage-a-packages-48de | Oct 28 7:49 PM CT | closed unmerged Oct 28 9:47 PM CT | no | no | closed unmerged Partly redone: package folders exist on main |
| [#24](https://github.com/tchjhnsn/everything-ecosystem/pull/24) | Stage A: packages for Naive, layer manifests for the framework | claude/grokbot-naive-packages-handoff | Oct 28 7:35 PM CT | closed unmerged Oct 28 9:47 PM CT | no | no | closed unmerged Redone in commit c42fa6b (EE-071): packages/*/package.json and platform/kits/README.md exist |
| [#23](https://github.com/tchjhnsn/everything-ecosystem/pull/23) | Handoff to Grokbot: packages for Naive, kits for Mentura, package folders, first design additions | claude/project-thread-c6ek0b | Oct 28 7:06 PM CT | merged into claude/project-thread-c6ek0b Oct 28 9:41 PM CT | yes | yes | Base branch merged into main by #33 and later |
| [#22](https://github.com/tchjhnsn/everything-ecosystem/pull/22) | Research: Next.js and React docs mapped to Naive | main | Oct 28 5:00 PM CT | merged into main Oct 28 9:46 PM CT | yes | yes |   |
| [#21](https://github.com/tchjhnsn/everything-ecosystem/pull/21) | Build Naive's docs and marketing site on Fumadocs | main | Oct 28 3:33 PM CT | merged into main Oct 28 9:46 PM CT | yes | yes |   |
| [#20](https://github.com/tchjhnsn/everything-ecosystem/pull/20) | Hand off Naive's docs and marketing site to Grokbot | main | Oct 28 2:12 PM CT | merged into main Oct 28 3:09 PM CT | yes | yes |   |
| [#19](https://github.com/tchjhnsn/everything-ecosystem/pull/19) | Record Torian's foundation confirmations; derive promised-to from the ICP | main | Oct 28 2:48 AM CT | merged into main Oct 28 9:46 PM CT | yes | yes |   |
| [#18](https://github.com/tchjhnsn/everything-ecosystem/pull/18) | Rename guiding statements to strategic foundation; accept the problem record | main | Oct 28 2:19 AM CT | merged into main Oct 28 2:21 AM CT | yes | yes |   |
| [#17](https://github.com/tchjhnsn/everything-ecosystem/pull/17) | Run Mentura and Naive through their own pipeline; lean problem assessment (EE-050); guiding statements (EE-051) | main | Oct 28 1:59 AM CT | merged into main Oct 28 2:02 AM CT | yes | yes |   |
| [#16](https://github.com/tchjhnsn/everything-ecosystem/pull/16) | Departments, imported only when needed (EE-047, EE-048) | main | Oct 28 12:18 AM CT | merged into main Oct 28 12:21 AM CT | yes | yes |   |
| [#15](https://github.com/tchjhnsn/everything-ecosystem/pull/15) | Name the framework Naive, add brand taglines and the Keller reference | main | Oct 28 12:08 AM CT | merged into main Oct 28 12:13 AM CT | yes | yes |   |
| [#14](https://github.com/tchjhnsn/everything-ecosystem/pull/14) | Framework/platform boundary, source-of-truth matrix, and PR #13 folded in (EE-039 to EE-045) | main | Oct 27 10:12 PM CT | merged into main Oct 27 11:15 PM CT | yes | yes |   |
| [#13](https://github.com/tchjhnsn/everything-ecosystem/pull/13) | Audience evidence integrations and Jev routing (EE-039); MAD's business questions re-homed (EE-040) | main | Oct 27 9:46 PM CT | closed unmerged Oct 27 11:15 PM CT | no | no | closed unmerged Redone: folded into #14 (merged) |
| [#12](https://github.com/tchjhnsn/everything-ecosystem/pull/12) | Point the method-site publisher at the MAD repository (EE-038 follow-up) | main | Oct 27 9:33 PM CT | merged into main Oct 27 9:42 PM CT | yes | yes |   |
| [#11](https://github.com/tchjhnsn/everything-ecosystem/pull/11) | Knowledge connectors: filesystem and GitHub, a catalog, and evals (EE-037) | main | Oct 27 8:59 PM CT | merged into main Oct 27 9:32 PM CT | yes | yes |   |
| [#10](https://github.com/tchjhnsn/everything-ecosystem/pull/10) | Remove SAD; the knowledge layer becomes the memory layer (EE-036) | main | Oct 27 7:36 PM CT | merged into main Oct 27 7:36 PM CT | yes | yes |   |
| [#9](https://github.com/tchjhnsn/everything-ecosystem/pull/9) | Fix the docs site's search index on Vercel | main | Oct 27 6:51 PM CT | closed unmerged Oct 28 9:47 PM CT | no | no | closed unmerged Redone as #8 (merged) |
| [#8](https://github.com/tchjhnsn/everything-ecosystem/pull/8) | Build the docs search index before the build so Vercel deploys succeed | main | Oct 27 6:46 PM CT | merged into main Oct 27 6:46 PM CT | yes | yes |   |
| [#7](https://github.com/tchjhnsn/everything-ecosystem/pull/7) | Put EE-033 in force and accept the developer-docs channel | main | Oct 27 6:30 PM CT | merged into main Oct 27 6:30 PM CT | yes | yes |   |
| [#6](https://github.com/tchjhnsn/everything-ecosystem/pull/6) | Developer docs site (Nextra 4, Next.js 16) and EE-033 to EE-035 | main | Oct 27 5:18 PM CT | merged into main Oct 27 5:19 PM CT | yes | yes |   |
| [#5](https://github.com/tchjhnsn/everything-ecosystem/pull/5) | Route types after the Next.js App Router (EE-032) | main | Oct 27 4:42 PM CT | merged into main Oct 27 4:43 PM CT | yes | yes |   |
| [#4](https://github.com/tchjhnsn/everything-ecosystem/pull/4) | Validation kit, routing, interfaces and the rest of the discussed build | main | Oct 27 3:37 PM CT | merged into main Oct 27 4:13 PM CT | yes | yes |   |
| [#3](https://github.com/tchjhnsn/everything-ecosystem/pull/3) | First venture run: the Everything Ecosystem as its own venture | main | Oct 27 12:17 AM CT | merged into main Oct 27 12:56 PM CT | yes | yes |   |
| [#2](https://github.com/tchjhnsn/everything-ecosystem/pull/2) | Schema 0.3.0: ventures, five phases, ontology and references | main | Oct 26 10:29 PM CT | merged into main Oct 26 11:37 PM CT | yes | yes |   |
| [#1](https://github.com/tchjhnsn/everything-ecosystem/pull/1) | Opt-in tool selection: principles, Jev plus reasoning model, Knowledge layer questions | main | Oct 26 5:07 PM CT | merged into main Oct 26 5:11 PM CT | yes | yes |   |
## Claim check

ReadTranscript can't read the main chat from a subagent ("none from the main chat"), so I couldn't search the full history for every "done", "merged", "landed" or "recorded". The claims below come from the parent conversation and summary I was given, plus one PR body. Each is checked against the tree.

| # | Claim (where) | Verdict | Evidence |
|---|---|---|---|
| 1 | EE-105 (#161), EE-106 (#162) and EE-107 (#163) are "recorded decisions" (summary) | Partly true | All three are open drafts into `framework`. framework has 0 commits beyond main, so none of them is on any branch. |
| 2 | #152 added 596 lines of standing-rule proofs (diagnosis relay) | True | `lean/Naive/StandingRules.lean` was added with 596 lines in [#152](https://github.com/tchjhnsn/everything-ecosystem/pull/152), merged into main Nov 1 11:23 PM CT. It is on main and framework. |
| 3 | The operating rules still say "pending Lean" (diagnosis relay) | True | `operations/operating-rules.json` on main, lines 72, 105 and 114: "Provisional, pending Lean". Line 148: "Not enforced yet." |
| 4 | `admit.ts --check` is in the test suite, since #135 landed (correction relayed to you) | True | `test.mjs:123` on main runs `schema/terms/admit.ts --check`. [#135](https://github.com/tchjhnsn/everything-ecosystem/pull/135) merged Nov 1 3:40 AM CT. |
| 5 | Only 9 terms have been admitted | True | `schema/terms/admitted.json` on main has 9 entries under `terms`. |
| 6 | "A `lean` workflow in CI runs `lake build` on any PR that touches `lean/`" | Partly true | True on framework. On main since #159, it runs only on PRs whose base is main (`lean.yml` `branches: [main]`). It never runs on pushes to framework. |
| 7 | Lean CI only runs when `lean/` changes, and pushes to framework never rebuild proofs (diagnosis) | True | `lean.yml` on both branches: `paths: ["lean/**", ...]`, and push only on `main`. |
| 8 | #159 would stop framework PRs from running the suite if carried over (diagnosis) | True | main `test.yml`: `pull_request: branches: [main]`. framework `test.yml`: `pull_request:` with no filter. |
| 9 | The metamodel build stopped, with nothing committed, pushed or opened as a PR | True, as far as visible | No PR after #164. None of the 153 branches has "meta" in its name. |
| 10 | `AGENTS.md` doesn't mention EE-095, `schema/terms` or Lean (diagnosis) | True | Searching `AGENTS.md` on main for whole-word "Lean", "EE-095", "lean/" and "schema/terms" finds no match. |
| 11 | "Verify in code, prove in Lean" was saved as a standing rule for every assistant | Partly true | It lives only in my memory. It isn't in `AGENTS.md`, the file every coding agent loads, so agents in the repo still don't see it. |
| 12 | Todo: "PR #153 route-cache fix awaiting Torian yes; waitlist DRAFT copy needs OK" | False (stale) | [#153](https://github.com/tchjhnsn/everything-ecosystem/pull/153) merged into main Nov 2 4:14 AM CT. It isn't on framework. |
| 13 | "#162 conflicts" (summary, open items) | False now | GitHub reports #162 `mergeable: true`, `mergeable_state: clean`, 1 commit, 1 file. |
| 14 | #148 body: "Retarget to `main` once #122 merges" | False | #122 merged Nov 1 3:39 AM CT. #148 still has base `claude/readmes-docs-as-code` 43 hours later. |

## What this means for delegation

- **framework is a parking lot, not a branch.** Nothing has ever merged into it. The rule "framework work goes to framework" has so far meant "framework work goes nowhere".
- **There are 7 open PRs older than a day**: #34, #107, #108, #130, #144, #148, #149. Plus 10 PRs from Nov 2: #154, #155 to #158, and #160 to #164.
- **The three things you named (READMEs, structure, branch controls) were researched and designed, and never opened as PRs**, apart from the stranded #148.
