---
name: venture-folder-knowledge-beside-code
description: Torian's 2026-10-29 proposal that a venture folder holds knowledge/ and code/ side by side, with pointers to remote systems of record
metadata:
  type: project
  modified: 2026-10-29T04:06:04.076Z
---

Torian (2026-10-29 04:03Z) wants to consider: venture folder at top, then `knowledge/` and `code/` as the top-level dirs. Knowledge base sits next to the code base; the knowledge base always knows where every system of record is (GitHub, cloud, CRM) via pointers. Default on create-venture: code/ as a monorepo with GitHub source control. Distinguish system of record (many per venture) from source of truth (one): one local disk can be both, but at scale every SoR must back up to / be hosted on the same source of truth; hosting that is a future Mentura service. Ties to the four MDM styles (registry, consolidation, coexistence, centralized).

Not decided or built. Visualization: https://claude.ai/artifact/3NTFW3tmJaTFxQVvhqmgSo (layouts A today, B proposal, C remote SoR, D hosted truth; open questions: one monorepo or many, knowledge in same git repo or own, default backup, first MDM style for Mentura).

**Why:** keeps agents in the code aware of venture decisions and vice versa.
**How to apply:** if adopted, amend translation row P-1 and route resolution under knowledge/ with aliases. See [[ee-packages-kits-clock]].

2026-10-29 04:32-04:38Z Torian: go-ahead to publish create-venture to npm, and chose "Publish both, MIT": naive-framework (bins naive, mentura) + create-venture, 0.1.0, public, MIT, files allowlist. Mac RC session publishes after npm login (Torian must run it) and a clean dry run. Groups 2-10 (140 unfinished translation concepts) being built by a 9-agent workflow (run wf_c0f78da0-400, branches wf/<group>); group 1 (I-* rows, create-venture at interface/create-venture/) on the Mac, branch claude/mac-ch1-install.

2026-10-29 05:3xZ: create-venture 0.1.1 live on npm (latest), 0.1.0 deprecated; clean-folder npx create-venture@latest + npx naive check verified passing.
