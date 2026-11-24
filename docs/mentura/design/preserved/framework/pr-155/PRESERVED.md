---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-155/pr-155.patch
  - docs/design/preserved/framework/pr-155/pr-155.json
source: pull request #155 in tchjhnsn/everything-ecosystem, head e6a26f02e5df7444e267302e8b28314a8df12fc1, base framework at cb502f9b8a68b8d90c72440e5e52a732c1bcef6e
sha256:
  pr-155.patch: 8aac2cda299b5d41e6ae6ef7d32daae5591cfa6f67b138c980ffb5d3f9019590
  pr-155.json: c622cb3ea827085303934827aeed9c9752f0e899d354d1c7f5a0e1122945bace
ledger: N-128 (Grok audit id R14), N-015 (Claude id C-066)
recorded-on: 2026-11-04
---

# Framework PR #155, preserved as a patch

Pull request #155, "Decision EE-101: language models write, Jev judges and routes, code checks", is stored here as data. It is not applied. Nothing in it runs, and its EE-101 decision entry is not in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-155.patch` is the output of `gh pr diff 155`, byte for byte: 4081 bytes, 1 file (`docs/decisions/decisions.json`, 12 lines added). `git apply --check` of it on a checkout of the base commit `cb502f9` exits 0, so it is the pull request's real diff against `framework`.

`pr-155.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/155` and `pulls/155/files`, because `gh pr view` calls the GraphQL API, which this build environment blocks. The same method made the S1-PR5 records.

#155 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Merged ledger row N-128 records EE-101 and names #155 as where it lives. Row N-015, already on main through Claude's artifacts, points to #155 as related. Gate G12 lists EE-101 among the decisions that #162 and #163 cite and that are off `main`; its default preserves them in S1-PR10 units, and this is that unit for EE-101. The EE-101 entry's `related` field names EE-007, EE-039 and EE-042, which are all on `main`.

The confidentiality scan finds nothing in either file, and neither uses the retired name `foundation` or an em dash.

`schema/data-model.json` ignores `pr-155.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-155.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-155.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
