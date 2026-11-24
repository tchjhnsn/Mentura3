# Architecture record prototype (proposed, 2026-10-31)

Sandbox only. Design doc: https://claude.ai/artifact/C52hTMWrqDoxvSJm1MPqtR ; map: https://claude.ai/artifact/NNcyZWNPS4dDiuA3akVQZ6

- `node derive.ts /home/user/ee-build` writes `as-built.json` (files, imports, effects, tests, models, proofs, cycles) and `drift.json` (layer manifests vs code).
- `node terms.ts` runs kernel (K1-K5) and engine (E1-E5) through the term engine (valid test, cross-run, verdicts on the repo).
- `lean Architecture.lean` proves leaf_not_in_cycle, leaf_reaches_nothing, ranked_acyclic, ranked_no_cycle.
- `graph.json` + `dependency-map.html` are the published map's data and page.
