---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/claude-2026-11-03/prototypes/architecture/GLOSSARY.agent.md
  - docs/design/preserved/claude-2026-11-03/prototypes/architecture/README.md
source: project-files/naive-design/prototypes/architecture/ on branch preserve/sources-2026-11-03 (commit acfb2329d4aff2eba84683b9dea50d730ca78df2)
sha256:
  GLOSSARY.agent.md: 0e2694badb3481ac03db7cf78ce4f12df4132f0cf48e7297d0e8ee580b81b30b
  README.md: 94a44bce68090c27a3dea1a2d0d8ada36143989a210c6c0e34ee77f2ab02789a
ledger: N-001 (Claude audit id C-084)
recorded-on: 2026-11-03
---

# Claude's agent glossary and its prototype README, preserved

`GLOSSARY.agent.md` and `README.md` in this folder come from Claude's architecture record prototype. Both were copied byte for byte from the source folder above with `git show`. Neither has been edited. `GLOSSARY.agent.md` is 76987 bytes with 174 `## ` term headings, and `README.md` is 667 bytes. Each sha256 matches its source line in `SHA256SUMS.txt` on `preserve/sources-2026-11-03`.

The README calls the prototype a sandbox, proposed on 2026-10-31. The scripts it names (`derive.ts`, `terms.ts`, `glossary-query.ts`) and `Architecture.lean` are not in this repo. The glossary's first lines say it was generated from the term records and `usage.json`. `usage.json` is missing: only Claude's project or Torian's Mac holds it, with the prototype code. Gate G8 in the plan waits on Torian to supply them.

The merged ledger lists the glossary under `export:` in the location column of row N-001, whose Claude audit id is C-084. The plan names the row C-084.

The files are preserved and not reconciled. No checker loads the glossary as a term list, and `docs/ontology.json` stays the canonical noun list. `scripts/architecture-inventory.ts` reads each file whole and keeps its first 1200 characters, as it does for every text file of at most 400000 bytes outside `docs/reviews/`. The glossary uses the retired name `foundation` 7 times, on lines 606, 1368, 1370, 1372 and 1373, as it was generated. EE-091 decided that `foundation/` moves to `identity/` (not built yet). The old name here is the text as written, not a reversal of EE-091.

`FLAGS.tsv` on `preserve/sources-2026-11-03`, on line 260 (the row for this path), flags the glossary `names-polity`, `mentura-confidential` and `investor-relations`. The paused civic venture is named on line 1229. Torian decided gate G11 on Nov 3, 2026: commit as-is. Anyone who moves these files outside the private repo applies that row's cleanup first.
