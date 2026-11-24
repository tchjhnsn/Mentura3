---
name: feedback-seed-cases
description: Torian 2026-10-29 07:08Z: never use his own projects (EE, Polity, Vir, Idionautics...) as seed/training cases for agents; discuss seed sources with him first
metadata:
  type: feedback
---

Torian, 2026-10-29 07:08Z, on the frame agent pipeline: "do not use any of my projects as seed cases. we can have a discussion about what we will use as seed cases."

**Why:** not stated; likely confidentiality and bias (his ventures would skew the dataset).
**How to apply:** for datasets, evals and examples in training pipelines, never draw cases from his ventures; propose sources and get his OK first. Related: [[ee-decision-library]].

2026-10-29 09:12Z Torian's own proposal for seed sources: public deals (Shark Tank episodes, podcasts like David Senra's Founders, other materials) reconstructed into frames; also why Mentura will run its own podcasts/interviews. He is unsure of legal implications. Built e6240af (PR #34) platform/agents/cases/reconstruct.mjs: facts + links + short paraphrase only, no transcripts/media, drafts outside git (.cases/), human review of hindsight labels; counsel before training on them. First run: 4 cases, agents 11/20, dichotomy always "false" again.
