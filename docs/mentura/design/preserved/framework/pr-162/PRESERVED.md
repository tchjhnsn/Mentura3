---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-162/pr-162.patch
  - docs/design/preserved/framework/pr-162/pr-162.json
source: pull request #162 in tchjhnsn/everything-ecosystem, head dd014058b5dc38a31c5f6ac3f46e7eb1bb9d5529, base framework at cb502f9b8a68b8d90c72440e5e52a732c1bcef6e
sha256:
  pr-162.patch: 6192134d62de44ef2a9fda484131ba11a002ce9aca4d7f19d6f659aa761c1d0b
  pr-162.json: d369ce84ad56271135cafd1258bd41c17c4284d8a92548b53cebbe2139541085
ledger: N-066, N-110, N-111, N-113, N-117, N-118, N-120, N-121, N-122, N-123, N-125, N-126 (Grok audit ids R25, R27, M11, M23, M24, M25, M26, M28, M29, M30, M31, M33, M36; Claude ids C-013, C-026)
recorded-on: 2026-11-04
---

# Framework PR #162, preserved as a patch

Pull request #162, "EE-106: Naive is the symbolic system and runs agents", is stored here as data. It is not applied. Nothing in it runs, and its EE-106 decision entry is not in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-162.patch` is the output of `gh pr diff 162`, byte for byte: 23788 bytes, 1 file (`docs/decisions/decisions.json`, 25 lines added). `git apply --check` of it on a checkout of the base commit `cb502f9` exits 0, so it is the pull request's real diff against `framework`.

`pr-162.json` holds the number, title, body, head commit, base branch, base commit and file list. It uses the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. `gh pr view` could not be used here, because it calls the GraphQL API, which this build environment blocks, so the record was built from the REST endpoints `pulls/162` and `pulls/162/files`.

#162 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

The merged ledger has no row of its own for EE-106. Eleven rows cite #162 as where an idea lives: N-110 (the redaction path), N-111 (agents only propose), N-113, N-117, N-118, N-120, N-121, N-122, N-123, N-125 and N-126. N-066 names #162 among the open pull requests that cite private research notes, which live outside any repo and are not preserved here. This preservation follows option B of gate G9, the plan's default, which Torian confirmed on Nov 4, 2026.

The EE-106 entry's `related` field names sixteen decisions. Fifteen are on `main`. The sixteenth, EE-105, is in open draft pull request #161. Its `why` text also notes that ids EE-101 to EE-104 are claimed by open pull requests #155 to #158 and, for different decisions, by #160. Gate G12 makes this unit wait on those, and its default preserves them in later stage 1 units, so under option B nothing here waits on them.

The confidentiality scan finds nothing in either file. The patch uses the retired name `foundation` once, in the entry's own text, where it says that `schema/venture-core.mjs` `statementsIn` "names foundation fields on venture.json". EE-091 decided that `foundation/` moves to `identity/` (not built yet).

`schema/data-model.json` ignores `pr-162.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-162.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-162.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
