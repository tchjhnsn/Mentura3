---
type: preserved
status: preserved, not reconciled
preserved-file: docs/design/preserved/claude-2026-11-03/VENTURE_META_SCHEMA_2026-10-31.md
source: project-files/naive-design/VENTURE_META_SCHEMA_2026-10-31.md on branch preserve/sources-2026-11-03 (commit acfb2329d4aff2eba84683b9dea50d730ca78df2)
sha256: 02f38f70689994068a3755368559c72dccbc6e2c83f11e55ed0cd0a76c46c896
ledger: N-010 (Claude audit id C-028)
recorded-on: 2026-11-03
---

# Claude's venture meta-schema, preserved

`VENTURE_META_SCHEMA_2026-10-31.md` in this folder is Claude's draft whole-venture meta-schema and the design of its property suite, copied byte for byte from the source above with `git show`. It has not been edited. It is 63059 bytes, and its sha256 matches the source's line in `SHA256SUMS.txt` on `preserve/sources-2026-11-03`.

Its own front matter says `status: DRAFT` and that nothing in it is built. The merged ledger records it as row N-010, Claude audit id C-028, learned 2026-10-31, and not in any repo before this copy.

The file is preserved and not reconciled. No checker loads it. `scripts/architecture-inventory.ts` reads the whole file and keeps its first 1200 characters for the inventory, like every text file under 400 KB outside `docs/reviews/`. The text uses the retired name `foundation` 6 times, on lines 30, 121 and 277, as the draft was written. EE-091 moved `foundation/` to `identity/`. The old name here is the text as written, not a reversal of EE-091.

The file trips three flags in `FLAGS.tsv` on `preserve/sources-2026-11-03`: `mentura-confidential`, `investor-relations` and `founder-personal`. Torian ruled on Nov 3, 2026 to hold nothing back, so it is committed as-is. Anyone who moves this file outside the private repo applies that row's cleanup first.
