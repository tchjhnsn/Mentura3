---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-41/pr-41.patch
  - docs/design/preserved/framework/pr-41/pr-41.json
source: pull request #41 in tchjhnsn/everything-ecosystem (closed, not merged), head ea52e12bf010b841e3f651e95efad27316276c2f on branch claude/mac-venture-structure-3, base claude/mac-venture-structure-2 at fc35bb003d7f4aa408a8ac8aee415042f75a78bc
sha256:
  pr-41.patch: 8d56e015b70679e15e68e56c4272ee250a8ac34ce87679464a8ea3308dcdc06d
  pr-41.json: 0b1f75c78102c1b70174af429a52b9c1879bd698e41fbdcaa5686b5f2222ca20
ledger: N-109 (Grok audit id G-C-vs3)
recorded-on: 2026-11-04
---

# Closed PR #41, preserved as a patch

Pull request #41, "Move existing ventures onto the structured layout (EE-086 stage 3)", is stored here as data. It was closed without merging, and it is not applied here. Nothing in it runs. The ledger row says EE-086 and EE-090 superseded it. Stage 2 of the ontology program decides whether any of it is still wanted.

`pr-41.patch` is the output of `gh pr diff 41`, byte for byte: 355120 bytes, 250 files, no binary files. `git apply --check` of it on a checkout of the base commit `fc35bb0` exits 0, so it is the pull request's real diff against its base. That base is the head of branch `claude/mac-venture-structure-2`, the branch of #40, which #41 was stacked on. #40 is closed and not merged too, so this patch holds only #41's own changes, not #40's.

`pr-41.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/41` and `pulls/41/files`, fetched one page at a time, because `gh pr view` calls the GraphQL API, which this build environment blocks.

Merged ledger row N-109 names branch `claude/mac-venture-structure-3` and #41 as the only place this work lives. Only Grok's audit listed it.

The confidentiality scan matches the patch in three ways, and none is confidential content. Mentura appears on 70 lines, as the name of the command line tool of that time (`interface/cli/mentura.mjs`, `mentura init`) in code, tests and docs. `foundation` appears on 76 lines, the name in use before its retirement, in context, added and removed lines. `_private` appears on 15 lines, as the folder name in tests, the layout migration and the docs on project structure. The patch holds no em dash.

`schema/data-model.json` ignores `pr-41.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-41.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-41.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
