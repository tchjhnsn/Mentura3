---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-130/pr-130.patch
  - docs/design/preserved/framework/pr-130/pr-130.json
source: pull request #130 in tchjhnsn/everything-ecosystem, head faaa1bdf336eee6b976abe36eee06fdc49b0a130, base main at 752c483e94b0e840e904ac48a3eb6325ce117c8f
sha256:
  pr-130.patch: f19397e8c89e95befea989180fa1115de8d16da19a7a14e3e8ff99d532dce3b3
  pr-130.json: 23b637602e339a2c58ef4427a3b0c96eceacb31c3c2be17a4a3ca8961460fa3f
ledger: N-137 (Claude audit id C-106)
recorded-on: 2026-11-04
---

# PR #130, preserved as a patch

Pull request #130, "Discovery interview workflow: leads and prospects, private contacts, dossiers, meetings, packet", is stored here as data. It is not applied. Nothing in it runs, and none of its schemas, routes or nouns are in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-130.patch` is the output of `gh pr diff 130`, byte for byte: 91317 bytes, 18 files. `git apply --check` of it on a checkout of the base commit `752c483` exits 0, so it is the pull request's real diff against `main` at that commit.

`pr-130.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/130` and `pulls/130/files`, because `gh pr view` calls the GraphQL API, which this build environment blocks.

#130 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Merged ledger row N-137 names #130 as where the discovery workflow records live. Its other source, the memory note `mentura-discovery-workflow.md`, is already on `main` at `docs/memory/claude/mentura-discovery-workflow.md`, so this patch was the last copy off `main`. The ledger marks the row confidential, as a Mentura item. Torian decided gate G14, on Nov 3, that every source is preserved as-is, confidential ones included. A pull request patch has no `FLAGS.tsv` row, so this note records the flag instead, and its cleanup rule applies before any public mirror.

The confidentiality scan matches the patch in four ways. Mentura is named on 11 lines, where the code cites the Mentura discovery playbook and refuses a script that pitches Naive or Mentura. `_private` appears on 25 lines, the folder where the workflow keeps a person's real name apart from the opaque lead record. LinkedIn appears on 36 lines, for the import of a founder's own LinkedIn connections export; the people and addresses in its test fixtures are made up, with `example.com` addresses. `foundation` appears on 14 lines, the name in use before its retirement: route names in `docs/reference/ROUTES.md` and `packages/validation/package.json`, and the record path `foundation/icp/` once in each of four new discovery files (schema, code, test and types). The patch holds no em dash.

`schema/data-model.json` ignores `pr-130.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-130.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-130.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
