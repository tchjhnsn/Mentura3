---
name: mentura-discovery-workflow
description: 2026-10-31 discovery workflow build (prospects, private contacts, dossiers, meetings, LinkedIn export import, meeting packet) in schema/discovery.ts; uncommitted, awaiting Torian's commit/push OK
metadata:
  type: project
  modified: 2026-10-31T11:51:47.513Z
---

Built 2026-10-31 11:50Z in a detached worktree /home/user/ee-build at origin/main 752c483 (tchjhnsn/everything-ecosystem). Not committed; patch at /mnt/project-files/naive-design/discovery-workflow-2026-10-31.patch.

- Records: validation/discovery/prospects/<p-id>.json (opaque id, icp, group own-network|community|cold, money raising|bootstrapping|stopped, outreach log), _private/people/<p-id>.json (name, link; private: true; never routed — router now skips _private/), validation/discovery/dossiers/<p-id>.json (facts each sourced, draft until a person confirms), validation/discovery/meetings/<id>.json (script tagged H1/H2/price-anchor, prediction, recording, interview link).
- schema/discovery.ts: import (official LinkedIn Connections.csv; columns inferred, verify on a real export), plan, packet [--names], funnel, check. Checks fail: agent-sourced linkedin.com facts, self-confirmed facts, names outside _private, pitch/hypothetical-price questions, held meeting without prediction.
- Note: "stage" is a retired noun in check-nouns; used "money" instead.
- Open: Torian's answer on LinkedIn (official export vs agents reading it); Grokbot agents not built (they would write dossier drafts).

Related: [[mentura-discovery-strategy]], [[mentor-coach-definitions]].

2026-10-31 12:20Z: Torian uploaded a Grokbot-compiled connections list (name, headline, profile_url, connected_on; 404 rows, he says 3 missing). Importer extended to read it (source connections-list; uncommitted, card asks to push to PR #130). Imported 124 founder-titled prospects into working venture /mnt/project-files/mentura-discovery/mentura (outside repos; _private holds names); 10 dropped as non-founders; 8 drafted as shortlist (notes "Shortlist draft 2026-10-31"). All own-network; community and cold still to source from events. Torian used an agent on LinkedIn himself, so the "no LinkedIn scraping" rule question is still open; check still fails agent linkedin.com dossier facts.
12:40Z Torian: these are LEADS, not clients; identify all the best leads before deeper Grokbot research. Only push code with no internal data (lead data stays out of repos). Naming lead vs prospect on a card (rec: one record, lead until he qualifies -> prospect). All 404 imported as leads (validation/discovery/leads/), fit rank drafted by agent: 35 high, 169 medium, 190 low, 10 dropped; private list _private/lead-ranking-2026-10-31.md. Notes: Jiyi Liu = Datafeel engineer (haptics, 2 FT); PARTNER for Torian's basketball haptics product (Datafeel hardware, our software; Datafeel may run on Naive/Mentura). Giorgio Villani: Grok-video signal of the economics-of-intelligence thesis.
