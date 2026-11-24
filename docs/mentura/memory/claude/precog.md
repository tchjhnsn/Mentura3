---
name: precog
description: 2026-11-01 05:25Z precog design (proposed): need vs constraint result, field names, reward + six gates, frameworks as weights; doc + files
metadata:
  type: project
  modified: 2026-11-01T05:31:12.477Z
---

Torian 05:25Z: precog = sees needs (e.g. supplier needs) before we need them. Research question: as proactive as possible while as accurate as possible. Penalize overconfidence and confidence for wrong reasons; confidence without records only OK if research done, cached, update proposed to a SEPARATE record-keeper model; verification gate at every step; no false proof. Orders (e.g. RL pipeline order, pre- vs post-product GTM) come as alternatives with risk/reward + activities/outcomes. Reward exhaustiveness. Learn founder preferences/personality. Frameworks "play to X's strengths" for founder, team, supplier, venture, market.

Doc: https://claude.ai/artifact/BPmRBdS9mp6JoRtWMwW1hE (all PROPOSED).
- Need vs constraint: overlap, neither contains the other; constraint is_a requirement; need disjoint goal; supplier need is_a need and dependency. ISO 29148 wording from memory, unverified.
- Field: proactive agents (arXiv 2410.12361), selective prediction (1705.08500), conformal (2107.07511), value of information (held, index only), MORL (2103.09568). Combination of proactivity + calibration + grounding looks new (not proven).
- Gates: records -> research -> proposed update -> calibration -> proof checked -> alternatives = "admissible anticipation".
- Reward P5: a*lead time - b*Brier + c*grounding (process) + d*scenario coverage; lucky guess (right but ungrounded) gets nothing. Needs P0 log first.
- Frameworks = weights/utility over objectives; Pareto set of alternatives; founder decides.
Files: naive-design/prototypes/architecture/precog-vocab.ts (13/13, 24/24), Precog.lean (built clean by phases thread, 12 theorems), precog-cache.ts. Terms admitted proposed, PRIVATE (usage.private.json), not in Grok list.
Related: [[ai-labs-anatomy]], [[naive-phases-functions]].

05:45Z Torian: precog = product name; its parts go in glossary. Pipeline idea -> identity -> shaped identity -> ready for next phase -> instance (hire example; RL environment example). New layer: how functions talk (finance asks engineering, triggers own research informed by engineering records). Doc https://claude.ai/artifact/MgZcTJsPe7pfwAksuh1Lxs (proposed). identity-vocab.ts 19/19, 8/8, 4/4; Identity.lean built clean (phases thread; `instance` keyword -> `realized`). Phases fixes: identity = purpose (R-02 essential why) + distinguishing + persists + homeFunction (thing belongs to a function, R-08/R-11); goals at shaped stage. Etymology: identity (Latin idem) and idea (Greek idea) are NOT the same root (Wiktionary; held). RL env records research/supplier-searches/rl-environment/: Prime Intellect verifiers 31/34 top; Mechanize fails K1/K3; budget record K3 missing; finance-inquiry.json Q1-Q6, research gated. Proposed term "function interface" (not run yet).
