---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-161/pr-161.patch
  - docs/design/preserved/framework/pr-161/pr-161.json
source: pull request #161 in tchjhnsn/everything-ecosystem, head 33c1ae70448ab0b9409479e3385d6bce1b7e714f, base framework at cb502f9b8a68b8d90c72440e5e52a732c1bcef6e
sha256:
  pr-161.patch: ddefce025ca206579eb9f978e1f65691b963a499044238baa6071225dd71ebc7
  pr-161.json: 43fbf837f0ab7a66e5c4dff7543a964a27627916686b32d1dafb53834789b6cd
ledger: N-116 (Grok audit id M15), N-124 (Grok audit id M32)
recorded-on: 2026-11-04
---

# Framework PR #161, preserved as a patch

Pull request #161, "EE-105: accounts, organizations and ventures", is stored here as data. It is not applied. Nothing in it runs, and its EE-105 decision entry is not in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-161.patch` is the output of `gh pr diff 161`, byte for byte: 21461 bytes, 1 file (`docs/decisions/decisions.json`, 20 lines added). `git apply --check` of it on a checkout of the base commit `cb502f9` exits 0, so it is the pull request's real diff against `framework`.

`pr-161.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/161` and `pulls/161/files`, because `gh pr view` calls the GraphQL API, which this build environment blocks.

#161 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Merged ledger rows N-116 (business and company are labels, not records) and N-124 (memberships, roles, teams, projects, accounts and transfers) both name #161, EE-105's glossary and decisions, as where they live. Gate G12 lists EE-105 among the decisions that #162 cites and that are off `main`; its default preserves them in S1-PR10 units, and this is that unit for EE-105. The entry's `related` field names EE-002, EE-009, EE-011, EE-020, EE-021, EE-086, EE-092 and EE-094, all on `main`.

A third row points at #161 for the content of a step whose order lives only in an agent's memory. That row is not named here, because its memory source is not preserved yet and the coverage script counts every row id a marker holds.

The confidentiality scan matches one line of the patch, line 14, the decision text, in three places. None is confidential content. One describes `mayKnow` in `schema/visibility.mjs`, which hides a confidential record from an actor not on its access list. Two name the path `founders/<handle>/_private/`, where another decision keeps the founder puzzle. The patch does not use the retired name `foundation` or an em dash.

`schema/data-model.json` ignores `pr-161.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-161.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-161.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
