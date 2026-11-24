---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-158/pr-158.patch
  - docs/design/preserved/framework/pr-158/pr-158.json
source: pull request #158 in tchjhnsn/everything-ecosystem, head 5e24e94aba92683362305f35ce5647a6efcaaed4, base cursor/noun-relations-graph-0d5a (the head of #157) at 04d1f2291dd82fb48008cafc61d08d0b3b1f0399
sha256:
  pr-158.patch: 379a046ae8635f65876ec3643c17d392203f108574fdb1b7ea731a1cc8028203
  pr-158.json: 23809c34b654cace7e8c6707f7733b1681284752af59c71ebda7948ef1b1f956
ledger: N-112 (Grok audit id R13, Claude id C-096)
recorded-on: 2026-11-04
---

# Framework PR #158, preserved as a patch

Pull request #158, "Decision EE-104: anticipation replaces precog in the ontology", is stored here as data. It is not applied. Nothing in it runs: its EE-104 decision entry is not in force on `main`, and its changes to `docs/ontology.json`, `schema/ontology-gate.ts`, `schema/noun-relations.ts`, `schema/check-nouns.mjs` and their tests do not take effect. Stage 2 of the ontology program decides whether and how to apply it.

`pr-158.patch` is the output of `gh pr diff 158`, byte for byte: 49820 bytes, 10 files. #158 is stacked on #157, so its base is #157's branch, not `framework`. `git apply --check` of it on a checkout of #157's head `04d1f22` exits 0, so it is the pull request's real diff against that base. #157 is preserved in `../pr-157/` with that same head, so applying `../pr-157/pr-157.patch` on `framework` and then this patch rebuilds #158.

`pr-158.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/158` and `pulls/158/files`, because `gh pr view` calls the GraphQL API, which this build environment blocks.

#158 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Merged ledger row N-112, a confidential row, records EE-104, anticipation replacing precog with the codename Deluminator. The full ledger, `grok-store/merged-ledger.full.md` on `preserve/sources-2026-11-03`, names three sources: this pull request, the Claude artifact `BPmRBdS9mp6JoRtWMwW1hE` and the memory note `precog.md`. It also names a Grok copy, section 3 of Grok's `at-risk.md`, which is a copy of EE-104 and not a separate source. The artifact and the memory note are on `main` in `docs/design/preserved/claude-2026-11-03/artifacts/` and `docs/memory/claude/`, so with this copy every source of N-112 is on `main`. Gate G12 lists EE-104 among the off-main decisions that #162 and #163 cite; its default preserves them in S1-PR10 units, and this is that unit for EE-104. The ledger's conflict notes record that Claude's memory keeps precog as a Mentura capability while EE-104 retires the word; that conflict is for stage 3.

The confidentiality scan matches the word precog on five lines of the patch and three times in the record, because retiring that word is the subject of the pull request. It matches Mentura on four lines of the patch (33, 34, 280 and 399) and once in the record, where EE-104 and the new ontology entry call anticipation Mentura's anticipatory capability. Mentura is already a public name on `main`, in `AGENTS.md` and `console/`. Nothing else matches. The patch uses the retired name `foundation` only on its line 404, an unchanged context line of `docs/ontology.md` as it stood on the base, and has no em dash.

`schema/data-model.json` ignores `pr-158.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-158.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-158.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
