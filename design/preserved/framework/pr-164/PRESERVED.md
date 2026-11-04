---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-164/pr-164.patch
  - docs/design/preserved/framework/pr-164/pr-164.json
source: pull request #164 in tchjhnsn/everything-ecosystem, head 7da790900b734723ad4e7b1cecb867a5d739676d, base framework at cb502f9b8a68b8d90c72440e5e52a732c1bcef6e
sha256:
  pr-164.patch: a161f90ed48efef1c713a90bcc434d55d3dda45602b7e198bbf7e9c84e37c7c9
  pr-164.json: 0f676ca9619e9a8fd155abcc7bba0e1f72e5a6d67c9ffea3e31164bf74d956e8
ledger: N-114, N-115 (Grok audit ids M12, M13)
recorded-on: 2026-11-04
---

# Framework PR #164, preserved as a patch

Pull request #164, "EE-107: vocabulary objects, shapes, and a parent check", is stored here as data. It is not applied. Nothing in it runs: `schema/vocabulary.ts`, `schema/check-vocabulary.mjs` and the other files it adds or changes are not on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-164.patch` is the output of `gh pr diff 164`, byte for byte: 94328 bytes, 16 files, 1590 lines added and 6 removed. `git apply --check` of it on a checkout of the base commit `cb502f9` exits 0, so it is the pull request's real diff against `framework`.

`pr-164.json` holds the number, title, body, head commit, base branch, base commit and file list. It uses the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. `gh pr view` could not be used here, because it calls the GraphQL API, which this build environment blocks, so the record was built from the REST endpoints `pulls/164` and `pulls/164/files`.

#164 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Two ledger rows cite #164: N-114 (vocabulary objects with stable ids and shapes, and the parent check) and N-115 (each record type links to the noun it stands for, through `vocabulary_parent`). The decision text for both is EE-107, preserved from #163 beside this folder. This preservation follows option B of gate G9, the plan's default, which Torian confirmed on Nov 4, 2026.

The confidentiality scan finds the word `confidential` on patch lines 188, 190, 214 and 215. All four are unchanged context lines: they show the `confidential` field that `schema/data-model.schema.json` and `schema/types/records.d.ts` already carry on `main`. The patch adds no confidential content, and `FLAGS.tsv` has no row for it.

The patch uses the retired name `foundation` 10 times. Each names a noun or path that exists on `main` today: the noun "strategic foundation" in a context line, the modules `schema/foundation.mjs`, `schema/lint-foundation.mjs` and `purpose/features/strategic-foundation.steps.mjs`, the record type `strategic-foundation`, and records under `instance/ventures/everything-ecosystem/foundation/`, listed as baselined gaps. EE-091 decided that `foundation/` moves to `identity/` (not built yet).

`schema/data-model.json` ignores `pr-164.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-164.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-164.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
