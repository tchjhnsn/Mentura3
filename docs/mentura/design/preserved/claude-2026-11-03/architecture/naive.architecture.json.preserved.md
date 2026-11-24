---
type: preserved
status: preserved, not reconciled
preserved-file: docs/design/preserved/claude-2026-11-03/architecture/naive.architecture.json
source: project-files/naive-design/architecture/naive.architecture.json on branch preserve/sources-2026-11-03 (commit acfb2329d4aff2eba84683b9dea50d730ca78df2)
sha256: 133c4e1b824cbc80afa65939507ef2c41929812cb988aa676b6b86b69011f624
ledger: N-003 (Claude audit ids C-087, C-S3-archcheck)
recorded-on: 2026-11-04
---

# Claude's Naive architecture record draft, preserved

`naive.architecture.json` in this folder is an agent's draft architecture record for Naive, copied byte for byte from the source above with `git show`. It has not been edited or reformatted. It is 54069 bytes, and its sha256 matches the source's line in `SHA256SUMS.txt` on `preserve/sources-2026-11-03`. Its first 12 hex characters, `133c4e1b824c`, are the prefix that ledger row N-003 cites.

It is an agent draft that Torian never confirmed. The file says so itself: `"status": "draft"`, `"confirmed": false` and `"drafted_by": "agent"`. It was derived from commit `359c454`. Nothing here makes it the architecture of record.

Four elements are marked `"confidential": true`: `library` (line 839), `library-curation` (line 880), `research-engine` (line 891) and `precog` (line 910). Its rule AK6 (line 1347) says these are never sent to outside models or handoffs. Torian decided gate G10 on Nov 3, 2026: commit the file as-is rather than as a pointer record.

The file is preserved and not reconciled. No checker loads it as an architecture record. The `docs/design/preserved/**/*.json` entry under `ignore` in `schema/data-model.json` exempts it without loading it. `scripts/architecture-inventory.ts` reads it whole and keeps its first 1200 characters, as it does for every text file of at most 400000 bytes outside `docs/reviews/`, and parses it as JSON because it is a `.json` file. The retired name `foundation` appears once, on line 2094, inside the file path `purpose/features/strategic-foundation.steps.mjs`, as the draft was written. EE-091 decided that `foundation/` moves to `identity/` (not built yet). The old name here is the text as written, not a reversal of EE-091.

`FLAGS.tsv` on `preserve/sources-2026-11-03`, on line 259 (the row for this path), flags the file `mentura-confidential`. Anyone who moves this file outside the private repo applies that row's cleanup first.
