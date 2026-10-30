---
type: plan
source: ai-drafted
created: 2026-10-30T00:20:00Z
ai-model: claude-opus-5.5
tags: [naive, decisions, frames, roadmaps, playbooks, lifecycle]
---

# Decision roadmaps and lifecycle playbooks

These are Torian's decisions from 2026-10-29: roadmaps are installable on their own and are also bundled in playbooks; the evidence that clears a phase gate varies by lifecycle playbook.

## Decision roadmaps

A roadmap is an ordered set of **frames** from the decision library. Frames are problem-framing templates that carry no answers, are freshness-checked when used, and use the verdict ladder possible / available / acceptable / confirmed. Roadmaps reuse frames; they are not a parallel concept.

- **File:** `packages/<function>/roadmaps/<id>.json`, schema `schema/decision-roadmap.schema.json`.
- **Each step:**
  - `frame` (a frame id);
  - `order`;
  - `needed_in` (phase);
  - `depends_on` (step ids);
  - `door` (one-way or two-way);
  - `decided_by` and `merged_by` (roles, under the delegation suite);
  - `requires` (evidence or lint checks that must pass first).
- **Install:** `naive roadmap install <id>` runs `naive frame` for each step, which proposes open decisions. Nothing is decided. The docket and cross-function ranking decide what the founder sees first, and precog may pre-draft the next steps.
- **Check:** `schema/check-roadmap.mjs` rejects a roadmap with:
  - cycles;
  - unknown frames;
  - steps with no decider;
  - one-way doors delegated away from the founder.
- **Versioning:** a roadmap is versioned like a package. A venture can switch roadmaps mid-way: decisions already made are kept, and only the remaining steps are re-ordered.

## Lifecycle playbooks

The venture development lifecycle is the template. Lifecycle playbooks are orderings of it.

- **Fixed:** the five phases, each phase's question, and the set of frames.
- **Varies by playbook:**
  - the order of decisions;
  - which decisions gate which phase;
  - the evidence that clears each gate.
- **First two playbooks:**
  - `revenue-first`: pre-sales, a paid pilot or services before product. Validation clears on "people paid".
  - `product-first`: MVP, then retention, then pricing. Validation clears on "retention holds". This is what Naive does implicitly today.
- **Later playbooks:** community-first, sales-led, product-led, bootstrapped and venture-backed.
- **Choosing one:** rank playbooks by fit to the founder's answers (revenue model, capital, team, market), using MAD's fit-and-risk model as a shared substrate. The founder decides.
- **Where they come from:** the research engine (Mentura, confidential) orders researched ventures' decisions in time. Clusters of similar orderings become candidate playbooks. Only the public result, the playbook template, ships in Naive.

## Build order

1. The roadmap schema, the check, and the `naive roadmap install` command, using the existing frames.
2. The brand roadmap from the Nike playbook: ethos → audiences → tagline → visual identity → first campaign → stand (the stand is a one-way door).
3. The lifecycle playbook schema, plus `product-first` (codifying today's behavior) and `revenue-first`.
4. Phase gate evidence read from the venture's chosen playbook (builds on #73, where `mentura phase` passes the lifecycle gate).
