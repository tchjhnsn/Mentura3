---
type: preserved
status: preserved, not reconciled
preserved-files:
  - docs/design/preserved/claude-2026-11-03/prototypes/architecture-folder/architecture.patch
  - docs/design/preserved/claude-2026-11-03/prototypes/architecture-folder/SHA256SUMS.txt
source: project-files/naive-design/prototypes/architecture/ in Claude's project files (the shared project folder), read on 2026-11-04
sha256:
  architecture.patch: ea493d6c62841720a968ce96baa4679125072997d67350eceeebc28a2f5c6a1d
  SHA256SUMS.txt: adf409af2e6ef2fdb2ef2a304df598fee34c16f427891eb13851aa93834c119d
ledger: N-002 (Claude audit id C-S3-sandbox)
recorded-on: 2026-11-04
---

# Claude's architecture sandbox, preserved as a patch

The whole folder `project-files/naive-design/prototypes/architecture/` is stored here as data, in one patch. Nothing in it is applied, and nothing in it runs. It is the auto ontology sandbox: the `*-vocab.ts` term runs and their `.out.txt` results, the `*.lean` files, the generators, `usage.json`, the run records (`placement-run.json`, `offering-run.json`, `stage-run.json` and others) and the two map pages.

`architecture.patch` is `git diff` from the empty tree to a commit that holds the folder at the path `project-files/naive-design/prototypes/architecture/`. It is 1158070 bytes and adds 120 files: 43 `.ts`, 28 `.lean`, 16 `.json` and 33 others (`.py`, `.mjs`, `.html`, `.txt`, `.md`). None is binary. Applying it with `git apply` in an empty folder writes the 120 files back byte for byte. `SHA256SUMS.txt` lists the sha256 of each of the 120 source files, in `sha256sum` format. It was taken twice, before and after the patch was made, and both readings were the same. The newest file in the folder was last changed on 2026-11-01.

The folder is stored as a patch, not as loose files, for the same reason as the framework pull requests under gate G9 option B. Loose `.ts` files under `docs/` would be type-checked by `tsconfig.json`, which includes every `**/*.ts`, and loose `.json` and `.lean` files would be read as live by other checks. A patch keeps every byte and runs none of them.

Merged ledger row N-002 lists eight of these files by name: `proof-vocab.ts`, `anatomy-vocab.ts`, `s1-vocab.ts`, `S1.lean`, `offering-vocab.ts`, `placement.ts`, `Placement.lean` and `generator-vocab.ts`. All eight are in the patch. The row's location class is "partly exported (rest only in Claude's project)". Gate G8 in the plan says Torian has to supply `usage.json` and this prototype code. Both are in the shared project folder, so this unit copies them from there. `GLOSSARY.agent.md` and `README.md` from the same folder are already preserved next door in `architecture/`. The patch holds them too, and their sha256 values match the ones recorded there.

The confidentiality scan matches the patch in these ways, and it is kept as written under gate G14, as gates G10, G11 and G17 did for the same kinds of content. Mentura appears on 182 lines and precog on 79. `usage.private.json` begins with the line "Usage notes for confidential Mentura terms (precog and similar). Never send to an outside model or include in the Grok term list." That is the same restriction G17 ruled on for `TERM_LIST_2026-11-01.json`, and it was committed as-is. The retired name `foundation` appears on 37 lines, as it was used before EE-091. Polity is named in `GLOSSARY.agent.md`, `research-vocab.ts`, `research-vocab.out.txt`, `usage.json` and `vocabulary.ts`. A search for API key, token and private key shapes finds nothing. One line of `dependency-map.html` holds an em dash, as written. Anyone who moves these files outside the private repo removes the confidential terms first.

`scripts/architecture-inventory.ts` records the size of `architecture.patch` but does not read it, because `.patch` is not one of the text extensions it reads. It reads `SHA256SUMS.txt` whole and keeps its first 1200 characters.
