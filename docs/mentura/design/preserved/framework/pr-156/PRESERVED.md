---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/framework/pr-156/pr-156.patch
  - docs/design/preserved/framework/pr-156/pr-156.json
source: pull request #156 in tchjhnsn/everything-ecosystem, head f08b7f2e5719f9f4d5fd52c5f8cdbbebb18cb2e5, base cursor/jev-llm-code-split-9a9d (the head of #155) at e6a26f02e5df7444e267302e8b28314a8df12fc1
sha256:
  pr-156.patch: 1893cb4a76e3bd79315ae078147edfbaa969c8a7b0bb7567c8a0cab9174f0f72
  pr-156.json: f80723aee0041df5b8308c4799a921619b03888d2f5a3bac5393bfb5e3ddab69
ledger: N-129 (Grok audit id R15)
recorded-on: 2026-11-04
---

# Framework PR #156, preserved as a patch

Pull request #156, "Decision EE-102: coordinate through typed provenance records routed by the Lead", is stored here as data. It is not applied. Nothing in it runs, and its EE-102 decision entry is not in force on `main`. Stage 2 of the ontology program decides whether and how to apply it.

`pr-156.patch` is the output of `gh pr diff 156`, byte for byte: 2473 bytes, 1 file (`docs/decisions/decisions.json`, 11 lines added). #156 is stacked on #155, so its base is #155's branch, not `framework`. `git apply --check` of it on a checkout of #155's head `e6a26f0` exits 0, so it is the pull request's real diff against that base. To apply both, apply `../pr-155/pr-155.patch` on `framework` first, then this one.

`pr-156.json` holds the number, title, body, head commit, base branch, base commit and file list, with the field names of `gh pr view --json number,title,body,headRefOid,baseRefName,files` plus `baseRefOid`. It was built from the REST endpoints `pulls/156` and `pulls/156/files`, because `gh pr view` calls the GraphQL API, which this build environment blocks.

#156 stays open. Stage 4 closes it only after the closure check confirms its ideas are on `main`.

Merged ledger row N-129 records EE-102 and names #156 as where it lives. It also notes that EE-109, on `main`, keeps the medium and the Lead but not the temporary child-agent rule, so that rule exists only in this patch. Gate G12's default preserves the off-main decisions in S1-PR10 units, and this is that unit for EE-102. The entry's `related` field names EE-029 and EE-031, both on `main`.

The confidentiality scan finds nothing in either file, and neither uses the retired name `foundation` or an em dash.

`schema/data-model.json` ignores `pr-156.json` through its `docs/design/preserved/**/*.json` entry and never loads it. `scripts/architecture-inventory.ts` records the size of `pr-156.patch` but never reads it, because `.patch` is not one of the text extensions it reads. It reads `pr-156.json` whole, keeps its first 1200 characters and parses it as JSON, as it does for every `.json` file under 400000 bytes outside `docs/reviews/`.
