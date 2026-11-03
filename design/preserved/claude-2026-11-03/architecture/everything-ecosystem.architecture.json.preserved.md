---
type: preserved
status: preserved, not reconciled
preserved-file: docs/design/preserved/claude-2026-11-03/architecture/everything-ecosystem.architecture.json
source: project-files/naive-design/architecture/everything-ecosystem.architecture.json on branch preserve/sources-2026-11-03 (commit acfb2329d4aff2eba84683b9dea50d730ca78df2)
sha256: 15f2b801cb6e19558d82be9143a583e33b01e7a672f931c7b443dc358504f73a
ledger: N-003 (Claude audit ids C-087, C-S3-archcheck)
recorded-on: 2026-11-03
---

# Claude's everything-ecosystem architecture record draft, preserved

`everything-ecosystem.architecture.json` in this folder is an agent's draft architecture record for this repo, copied byte for byte from the source above with `git show`. It has not been edited or reformatted. It is 26349 bytes, and its sha256 matches the source's line in `SHA256SUMS.txt` on `preserve/sources-2026-11-03`.

It is an agent draft that Torian never confirmed. The file says so itself: `"status": "draft"`, `"confirmed": false` and `"drafted_by": "agent"`. It was derived from commit `359c454`. Nothing here makes it the architecture of record.

The merged ledger lists this file in the export column of row N-003, Claude audit ids C-087 and C-S3-archcheck. The sha256 prefix that row cites, `133c4e1b824c`, belongs to the other architecture record, `naive.architecture.json`, not to this file.

The file is preserved and not reconciled. No checker loads it as an architecture record. `schema/data-model.json` lists its path under `ignore`, so `check-data-model` exempts it without loading it. `scripts/architecture-inventory.ts` reads it whole and keeps its first 1200 characters, as it does for every text file under 400000 bytes outside `docs/reviews/`, and parses it as JSON because it is a `.json` file. The retired name `foundation` appears only inside one file path, `verification/lint-foundation/FoundationLint.tla`, listed on lines 1161 and 1325, as the draft was written. EE-091 decided that `foundation/` moves to `identity/` (not built yet). The old name here is the text as written, not a reversal of EE-091.

The file trips two flags in `FLAGS.tsv` on `preserve/sources-2026-11-03`, on line 257 (the row for this path): `mentura-confidential` and `investor-relations`. Torian ruled on Nov 3, 2026 to hold nothing back, so it is committed as-is. Anyone who moves this file outside the private repo applies that row's cleanup first.
