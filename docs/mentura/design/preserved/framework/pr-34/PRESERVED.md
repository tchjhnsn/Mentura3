---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-34/pr-34.patch
  - docs/design/preserved/framework/pr-34/pr-34.json
source: pull request #34 in tchjhnsn/everything-ecosystem, head e6240aff349a4328fa1855e4c9b1fb7aaabe0544 on branch claude/project-thread-ympz7x, base main at 4bcbd0182ea9e6ec1dc65fa8250207e9a462e819
sha256:
  pr-34.patch: 154cf2eed2508728db8579b4fd6bf0eee49345eb601e0a0811ea6a8ef9c6488d
  pr-34.json: ada932189bdc71fdb1f50e27b49facfbd47aa9eee1ee2719727a461de41d59ba
ledger: N-133 (Claude audit id C-050)
recorded-on: 2026-11-04
---

# PR #34, preserved as a patch

Pull request #34, "Mentura: frame agents, training pipeline design and own-harness idea", is stored here as data. It is not applied. Nothing in it runs. Stage 2 of the ontology program decides whether and how to apply it.

`pr-34.patch` is not the output of `gh pr diff 34`, because GitHub refuses a diff of more than 300 files and #34 changes 329. It is `git diff 4bcbd01 e6240af`, the base commit and the head commit, which is the pull request's diff because the base commit is the merge base of the two. It is 1736187 bytes, 329 files, with no binary files. Its numstat matches the additions and deletions that the REST endpoint `pulls/34/files` gives for every one of the 329 files. `git apply --check` of it on a checkout of the base commit exits 0, and applying it there gives a tree equal to the head commit's tree.

`pr-34.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/34` and `pulls/34/files`, fetched one page at a time, because `gh pr view` calls the GraphQL API, which this build environment blocks.

#34 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Merged ledger row N-133, the frame-agent training pipeline and the idea of an own harness on home field, names #34 as where it lives. Its other source, the memory note `ee-decision-library.md`, is already on `main` at `docs/memory/claude/ee-decision-library.md`, so this patch was the last copy off `main`. The ledger marks the row confidential, as a Mentura item, and the pull request body says the same of all its work under `platform/`. Torian decided gate G14, on Nov 3, that every source is preserved as-is, confidential ones included. A pull request patch has no `FLAGS.tsv` row, so this note records the flag instead, and its cleanup rule applies before any public mirror.

The confidentiality scan matches the patch on many lines, as expected for a pull request that is Mentura work. Mentura appears on 805 lines, `foundation` on 376 (the name in use before its retirement), `_private` on 67, the word confidential on 18, LinkedIn on 31 (the outreach agent, where the agent prepares and the founder sends) and "home field" on 3. A search for the shapes of common API keys, tokens and private keys finds nothing, and the only address it holds is a made-up `example.com` one. One line, in `site/content/docs/get-started/first-venture.mdx`, holds an em dash, as written.

`schema/data-model.json` ignores `pr-34.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-34.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-34.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
