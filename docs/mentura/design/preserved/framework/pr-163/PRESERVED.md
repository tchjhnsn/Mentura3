---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-163/pr-163.patch
  - docs/design/preserved/framework/pr-163/pr-163.json
source: pull request #163 in tchjhnsn/everything-ecosystem, head 2a1367268378160dcb6ef2ea514eeabcdf9f51a2, base framework at cb502f9b8a68b8d90c72440e5e52a732c1bcef6e
sha256:
  pr-163.patch: a0d5da398516daddf43212c3bd594af06c16ecafe8520a8f452533f0be0e80be
  pr-163.json: 8afce87c007c50f730068d99b30c511099e489f4dc8fd367b65a5c05adc4dc51
ledger: N-104, N-114, N-115, N-119, N-130, N-131 (Grok audit ids M12, M13, M27, R16, R17; Claude id C-137)
recorded-on: 2026-11-04
---

# Framework PR #163, preserved as a patch

Pull request #163, "EE-107: change verbs, tiers, and vocabulary objects", is stored here as data. It is not applied. Nothing in it runs, and its EE-107 decision entry is not in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-163.patch` is the output of `gh pr diff 163`, byte for byte: 4577 bytes, 1 file (`docs/decisions/decisions.json`, 14 lines added). `git apply --check` of it on a checkout of the base commit `cb502f9` exits 0, so it is the pull request's real diff against `framework`.

`pr-163.json` holds the number, title, body, head commit, base branch, base commit and file list. It uses the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. `gh pr view` could not be used here, because it calls the GraphQL API, which this build environment blocks, so the record was built from the REST endpoints `pulls/163` and `pulls/163/files`.

#163 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

The merged ledger has no row of its own for EE-107. Six rows cite #163 as where an idea lives: N-104 (verbs), N-114 (vocabulary objects, item 7), N-115 (record types link to nouns, item 4), N-119 (change-line tier, item 2), N-130 (question types and standing answer rules, item 3) and N-131 (security labels, item 6). This preservation follows option B of gate G9, the plan's default, which Torian confirmed on Nov 4, 2026.

The EE-107 entry's `related` field names EE-105 and EE-106, which are in open pull requests #161 and #162, not on `main`. Its `why` text notes that ids EE-101 to EE-104 are claimed by open pull requests #155 to #158 and, for different decisions, by #160. Gate G12's default preserves those decisions in later stage 1 units, so under option B nothing here waits on them.

`schema/data-model.json` ignores `pr-163.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-163.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-163.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`. Neither file uses the retired name `foundation`.
