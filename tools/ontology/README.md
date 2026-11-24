# Ontology program tools

The ontology program's scripts, moved here from tchjhnsn/mentura's `scripts/` with their history when Reflect became the monorepo for Reflect and Mentura (2026-11-24). They read the founder's idea records from a folder exported from the company tenant's store (`--records <dir>` or `MENTURA_RECORDS`, see `records-folder.ts`) and the program's rulings, ledgers and reports in [`docs/mentura/`](../../docs/mentura/README.md). Their default root is the repository root.

| File | Does |
|---|---|
| `import-ledger.ts` | Writes one founder-idea record per row of the merged preservation ledger, verbatim, and flags rows to clean up in `FLAGS.tsv` |
| `reconcile-ideas.ts` | Gates proposed labels for idea records through the schema, the EE-095 term engine and the Lean agreement check, and moves each label through the idea record statechart |
| `agreement-report.ts` | Writes the agreement report between gated labels and Torian's rulings; `--check` fails when the committed report is stale |
| `closure-check.ts` | Says which program pull requests and frameworks are safe to close, read-only |
| `preservation-coverage.ts` | Lists ledger rows with no copy in the repository, grouped by source |
| `records-folder.ts` | Finds the exported records folder |
| `naive.ts` | Where the installed Naive sits |

## Running it

- `npm install` here, then `npm test` (`node test.ts`) runs the six tests. CI runs them in `.github/workflows/ontology.yml`.
- From the repository root, for example `node tools/ontology/reconcile-ideas.ts --records <dir>`.
- The glue that only served Mentura's repository (its type gate, docs-required check, install script and PR review agent, now in Naive) did not come along.
