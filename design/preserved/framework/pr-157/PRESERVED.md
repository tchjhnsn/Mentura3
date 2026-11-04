---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-157/pr-157.patch
  - docs/design/preserved/framework/pr-157/pr-157.json
source: pull request #157 in tchjhnsn/everything-ecosystem, head 04d1f2291dd82fb48008cafc61d08d0b3b1f0399, base framework at cb502f9b8a68b8d90c72440e5e52a732c1bcef6e
sha256:
  pr-157.patch: 6c70d9ce5d74652148c09806b49baab4e4d81fe625b4e3cc2c0da301d36a01f5
  pr-157.json: 2d63fc51e4e0a49e3c67861b71425d7452b012a3aba12bc6bc775d6eedced222
ledger: N-127 (Grok audit id R12)
recorded-on: 2026-11-04
---

# Framework PR #157, preserved as a patch

Pull request #157, "Decision EE-103: typed ontology relations and a generated noun graph", is stored here as data. It is not applied. Nothing in it runs, and its EE-103 decision entry is not in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-157.patch` is the output of `gh pr diff 157`, byte for byte: 81181 bytes, 18 files. `git apply --check` of it on a checkout of the base commit `cb502f9` exits 0, so it is the pull request's real diff against `framework`.

`pr-157.json` holds the number, title, body, head commit, base branch, base commit and file list. It uses the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. `gh pr view` could not be used here, because it calls the GraphQL API, which this build environment blocks, so the record was built from the REST endpoints `pulls/157` and `pulls/157/files`.

#157 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

The merged ledger records EE-103 as row N-127, Grok audit id R12. This preservation follows option B of gate G9, the plan's default, which Torian confirmed on Nov 4, 2026: store each framework PR's verbatim patch and metadata, so nothing runs until stage 2 applies it.

`schema/data-model.json` ignores `pr-157.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-157.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-157.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file of at most 400000 bytes outside `docs/reviews/`. The patch uses the retired name `foundation` once, on line 1320, in the noun "strategic foundation", as the pull request was written. EE-091 decided that `foundation/` moves to `identity/` (not built yet).
