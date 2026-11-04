---
name: ee-decisions-file-type
description: EE-054/057 decisions as a file type in everything-ecosystem (built 2026-10-28, PR #19 fc52786) and Torian's phase-firmness principle
metadata:
  type: project
  modified: 2026-10-28T17:21:53.894Z
---

Built 2026-10-28 on PR #19 (commit fc52786), from Torian's Decision Docket answers (all five dx-* recommendations).

- Decision records live in a `decisions/` folder beside what they decide: `<folder>/decisions/<record>[.<topic>].decision.json` decides `<folder>/<record>.json` (a sibling folder, because scripts read every *.json in products/, purpose/validation/, purpose/anatomy/). Schema `schema/decision-record.schema.json`; record type `decision-record` (governance kit). The EE/D log stays the history.
- `node schema/decisions.mjs <dir> [--json|--md]`, route `governance/decisions`: matrix by layer x phase; render now/waiting/later/stale/deferred/done. Venture root + foundation fail closed; product fails open; nearest boundary governs (a fail-open decision shields what is under it). Under an open fail-closed decision, agent writes become drafts (router `holding()`). venture.json `kind: "product"` fails open. A field `statement` lets a record stand in for a foundation statement.
- Not built yet: gathering need-now suggestions, failing checks and forecasts; writing decision records through the router (an agent could write one); per-phase guidelines and the study of earlier startups (Torian asked).

- EE-058 (2026-10-28 17:23Z, commit 46e3beb): decision records carry provenance (drafted_by agent/person, approved_by, approved_at, phase, wording approved/changed/own, authority, via), outcomes (projected vs actual, result) and unlocks (activities opened, for whom). Agent wording counts only after a person approves. Torian's later Mentura idea: decision analytics like Vercel observability (decision survival by scale, decision counts of successful teams, who/which departments make impactful decisions, projected vs actual outcomes). Investor Gordon Doughtery (talk Torian heard): asks for outcomes, not activities. Not built: activity gating by unlocks, outcome due prompts, analytics.

**Torian's principle (EE-057, 2026-10-28):** firmness depends on the phase. In Discovery even confirmed foundation statements and core promises are working drafts, tested again each phase ("hero's journey"). Decide for the current phase, only speculate on later ones; render a decision when it is needed (React analogy; signal vs noise). Persevere/pivot/pause/stop are draft frameworks, not the default.

**How to apply:** don't push Torian to lock in later-phase answers (funding, owner outcome, core promises); give them `needed_in` and let them render later. Related: [[ee-self-validation]], [[feedback-decision-docket]].
