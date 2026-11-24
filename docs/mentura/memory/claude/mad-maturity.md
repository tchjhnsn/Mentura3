---
name: mad-maturity
description: MAD maturity thread (2026-10-30): MAD = SDLC method router; 12207 process modules as a 2nd axis; Naive-MAD contract; draft PR MAD#24
metadata:
  type: project
  modified: 2026-10-30T22:53:13.824Z
---

Thread cmsg_01TRojivaFzywKqAKrsycdv8STDMg8EkRCUShpLSEGNRwD, started 2026-10-30 22:48Z. Design doc: tchjhnsn/MAD docs/design/MAD_MATURITY_METHOD_ROUTER_2026-10-30.md (draft PR #24; copy at /mnt/project-files/mad-design/). README gained requirements 17-21 from Naive R-20..R-28.

Key design (proposed): layers (how work is run) and 12207 process modules (which work) are two crossing axes; templates gain `processes`. Business/mission analysis stays in Naive's product function. Naive k-base owns the SDLC catalog (knowledge/sdlc/), MAD reads a pinned version. Contract = method-request (Naive->MAD) + method-plan (MAD->Naive, incl. task plan with verifier_role); tasks go to executors via Naive's existing handoff record. MAD governance layer = SDLC governance; venture governance is Naive's (closes the 2026-10-29 open item). Maturity levels M0-M4; MAD is at M1.

Decided 2026-10-31 (cards): A pstack templates kept as a practice (renamed proof-driven-agent-work 0.2.0); B agent router lives in Naive beside delegation; C MVP cut = M2 + contract schemas.

Related: [[km-roles-sad-mad]]

2026-10-31 05:55Z: design doc gained section 8 "Docs as code" (Torian's README docs-as-code rule): processes/<module>/{process.json,README.md}, generated lower halves via scripts/readmes.mjs, READMEs updated per PR, linked, never in publish.json. Pushed as 9fac2fd on PR #24.

2026-10-31 13:05Z: MVP cut built on PR #24 (c47cbe2): processes/<module>/{process.json,README.md}, templates' required `processes` field (ids or "all"), schema/{process,method-request,method-plan}.schema.json + schema/README.md + examples on Naive, scripts/contract.mjs check. Not done: Naive's knowledge/sdlc catalog (everything-ecosystem), router code, decide skill unchanged (1.0.2 eval), Torian's review of .mad/record.json.

2026-10-31 14:30Z: gap review (design note section 10, G1-G19) against meta-schema, R-52/R-62-68, systems map, self-improving loop, PR #130. Built: contract 0.2.0 on MAD#24 (6522aad: protected/editable/checked_by/held_out, provenance drafts, no _private/, enumeration, gaps+totality, ranking, certificate; README reqs 22-24) and catalog 0.2.0 on EE#132 (004853b: `function` per process, `--phase` projection). Cards open: offering axes vs product.type (rec: wait for venture v2); rename "process module" -> "process" + MAD-scoped senses in docs/ontology.json (rec: yes). G15 asked of phases thread. Later items (G10 cites, G11 temporal classes, G13 anchored change, G14 admission gate, G16 market/ICP, G18 trajectories, G19 Lean) wait on the meta-schema build order. M3 now = Naive or any client venture (G17).
