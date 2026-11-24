---
name: research-engine-andtruth
description: Torian links his research agent to &Truth (formal verification) and to forming questions from theorems at the point of inquiry
metadata:
  type: project
  modified: 2026-10-30T05:11:56.056Z
---

Torian (2026-10-30 05:08Z) said the &Truth blog (andtruth.com, Lean-based AI verification: AI proposes, small trusted checker verifies) is partly the idea behind his research agent (Mentura research engine, PR #82, confidential). He also wants questions formulated from theorems at the point of inquiry, not prefabricated.

Synthesis (confidential, unpublished): /mnt/project-files/research/ANDTRUTH_AND_THE_RESEARCH_AGENT_2026-10-30.md. Key proposals: goal-directed question generation (state a claim/phase-gate theorem, derive open obligations from verdict rules) instead of only the cells.mjs grid; a mechanical kernel checker plus re-checkable certificates for the verifier (run.mjs currently uses model agreement on a 30% sample). Decided 2026-10-30 05:12Z: question generation is goal-directed, grid kept for coverage sweeps. Also decided 05:12Z: add a mechanical checker plus re-checkable certificates to the verifier.

**Why:** links [[premise-lint]] and the research engine under one method.
**How to apply:** any future build of these goes in TypeScript and should honour the chosen options.
