---
name: problem-loop
description: Torian 2026-10-31 23:23Z wants a problem loop agents always run (set out, did, found, solving) as provenance; problem graph root->function problems; latency, bottlenecks, hiring view
metadata:
  type: project
---

Torian 23:23Z (phases thread): document every issue found and solved (GitHub best practice), as a framework agents run constantly on a loop; it is a form of provenance. Problems form a graph from the venture's root problem into function problems (technical, marketing, hiring); track time to identify and time to solve; flag bottlenecks (recurring problems); this feeds hiring (he isn't against recruiting Rohith but can't name problems for him yet). Problems are not agents-only: he sets goals/requirements; owners are humans.

Done: issue tchjhnsn/everything-ecosystem#139 (term engine rng/validTest defects, written in set out / did / identified / solving form). Doc "Problem loop (proposed)" https://claude.ai/artifact/5sWFAuBtJv2KJqc7iyXjJE . Prototype problem-vocab.ts (problem, root problem, function problem, technical problem, decision, bottleneck; exhaustive 24,576 cases, 11/11 predictions; problem~decision overlap) + Problems.lean in /mnt/project-files/naive-design/prototypes/architecture/.
Proposed next (unbuilt): issue template, problem-record.schema.json as provenance entries, loop skill for building threads.
Related: [[architecture-record]], [[founder-suite]].
- 23:42Z: CI case from Mac session "Local Mac catchup handoff" = pipeline example (Owen post 21:20 -> audit 22:04 -> PR #137 merged 23:39; 545s->341s). Pipeline stages 1 signal..8 close added to doc. NEW PROBLEM seen 23:39: CI on main jobs not started (GitHub Actions billing/spending limit) - only Torian can fix. PR #135 is still OPEN (not merged); engine fix staged on claude/founder-suite.
- generator-vocab.ts: generator + case/project/code generator (11/11). glossary-query.ts: node:sqlite in-memory over admitted.json + sandbox vocabularies; get/sql/similar; regexp(), vowels(), similar() (lexical TF-IDF, real semantic needs embeddings index as derived view).
- 23:55Z Torian (IDEA ONLY, "don't have to do this now"): Grokbot "ethos searcher" agent on X: semantically search X for people solving or voicing his venture + personal problems; likely a Mentura agent (confidential). Note at /mnt/project-files/naive-design/agents/ethos-searcher.md. GitHub Actions billing sorted 23:55Z.

2026-11-01 00:45Z: issue everything-ecosystem#141 "Decisions decay before they reach the code" filed in the convention format after Torian caught that I hadn't filed it (cause 6: agents don't run the loop). Skills proposed to him: problem-loop, decision-record. Branch claude/decision-records-handshake (EE-089..092, affects field) still uncommitted, waiting for an explicit commit/push OK.
