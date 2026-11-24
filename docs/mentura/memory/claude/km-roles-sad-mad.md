---
name: km-roles-sad-mad
description: G-033 (2026-10-26): SAD is a knowledge management method (personal + organizational deployments); MAD is not; km-role profile field
metadata:
  type: project
  modified: 2026-10-26T20:03:40.929Z
---

G-033, decided by Torian 2026-10-26: SAD is a knowledge management method with two deployments, personal (Torian/ vault, PKM) and organizational (each companies/<company>/ vault). It leans organizational because it handles knowledge that drives building. MAD is NOT knowledge management; it governs how work is run, its record lives in each repo's .mad/. Torian said "BKM"; the standard term is organizational knowledge management.

Formalized as a new `km-role:` profile field (method | personal-vault | company-vault | none, plus km-used-in / km-method; Torian rejected the word "deployment" 2026-10-26), in entity-profile-schema, SAD profile, 4 company profiles, Torian profile, a new vault projects/mad/entity-profile.md, vault-structure.md and myai-wiki/README.md; MAD README gets a Scope section.

Status 2026-10-26 ~20:10Z: edits made in the cloud clones only; committing was blocked (Torian controls git), awaiting Torian's explicit go-ahead to commit/push and open draft PRs on vault and MAD.

Related: [[core-product-framework]]

2026-10-26 ~20:30Z: Torian asked to rename myai-wiki back to SAD (done in clone: everything-ecosystem/sad/, 49 files rewritten; ee-private-holding left as is), and to move everything-ecosystem into Torian/ with all operational parts (SAD, MAD) synthesized into SAD and MAD folders kept in the workspace. Split plan: https://claude.ai/artifact/4MkzUBjrfzG8tFm7xQHYJt . Open decision card: where SAD/MAD folders live (recommended: vault/sad/ + MAD repo; sad-methodology repo is public). Still nothing committed.

2026-10-26 ~21:15Z: Torian chose "SAD in vault, MAD in its repo" (G-034 added to ledger json+md, plus G-033 row in md). Split executed in clones, staged not committed: vault/sad/ (root) holds SAD + frameworks/references/systems/skills/company-template; vault/Torian/everything-ecosystem/ holds vision (philosophy, artifacts, EE design, personal skills); MAD repo docs/ got catalog, methodology registers, research, handoff-v2, methodology-selection + linear-workflow skills, harness evals (MAD repo is private). 131 files' paths rewritten (history logs left). Still to do: synthesis pass (duplicates), publish.json + methodology-selection paths, Mac ~/.claude/skills symlinks, Mac-only everything-ecosystem/MAD clone. Needs Torian's "commit and push".

2026-10-26 ~21:30Z correction: Torian wants MAD in the vault too, with all concepts and principles. Now vault/mad/ (root, beside vault/sad/) holds README pointer to the private MAD repo, entity-profile (moved from projects/mad), catalog, methodology registers, register/, research, operations/handoff-v2, skills (methodology-selection ee.mjs validates OK), evals, pre-restart. MAD repo change is only the README Scope section. G-034 text updated. Still uncommitted.

2026-10-26 ~21:45Z G-035: Everything Ecosystem (name kept) = the whole methodology, one PRIVATE repo `everything-ecosystem` (local git init at /home/user/everything-ecosystem in the cloud clone, not on GitHub yet), layers purpose/ knowledge/(SAD) operations/(MAD concepts) execution/ evidence/ governance/ interface/ + docs/design/. Docs as code: method/skills/schemas/templates in repo; vault keeps Torian/everything-ecosystem/ (entity-profile, philosophy, ideas, idea dump), vault/sad/ and vault/mad/ (principles + pointers), sad/systems/agent-core-loop-team.md (Cursor rules read it). MAD tool stays in MAD repo, to fold into operations/ later. Nothing committed; awaiting Torian's OK to create the GitHub repo and commit/push all three.

2026-10-26 ~22:00Z: Torian on tooling selection: questions are opt-in (triggered, never default; people who know their tools just record them). Give agents principles plus example questions, not an enumeration the agent must follow. Scorer: Jev plus a reasoning model. Drafted (uncommitted) in EE repo: operations/skills/tool-selection/SKILL.md and knowledge/tooling/questions.md.
2026-10-26 22:12Z: tool-selection draft merged to everything-ecosystem main (PR #1, merge 75cbc7b) on Torian's say-so.

2026-10-27 00:05Z (Torian): Polity paused; focus is the "schema". EE described as "AI-Native OS for Builders". G-036: EE is a schema; ~/workspace is Torian's local instance of it. Edited (uncommitted): vault Torian/everything-ecosystem/entity-profile.md (description, section 4 Comparable frameworks: EOS, TOGAF, Rails, Agent OS (Builder Methods; name close to "AI-Native OS"), BMAD-METHOD, GitHub Spec Kit), ledger G-036, EE repo README line. Decision card open: move EE repo out of ~/workspace (recommended: repo to ~/everything-ecosystem, vault notes stay). Product Anatomy Matrix work sits uncommitted in EE repo purpose/frameworks/product-anatomy/ (parked).
2026-10-27 00:08Z: Torian chose to leave the EE repo where it is (~/workspace/code/projects/everything-ecosystem); no move.
