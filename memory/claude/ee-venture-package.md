---
name: ee-venture-package
description: EE-067/068 (2026-10-28): the pipeline's end outcome is the venture package; packages by phase via a question matrix; agents excluded
metadata:
  type: project
---

2026-10-28 21:00Z: EE-067/068 pushed (833af53, c5281c0 on PR #19). Pipeline end outcome = venture package (schema/packages.json + packages.mjs): 8 packages by receiver, priors per phase + question matrix (Jev answers only what records leave open), rendered to <venture>/package/; agents excluded (package enhancement); board /package; harness step 5 plans sitemap + writes package. Site presence ICP now read from the site (no textarea); clarity score deferred. Design doc docs/design/PIPELINE_IDEA_DUMP_TO_VENTURE_PACKAGE_2026-10-28.md. Kit vs venture package names must be reconciled before EE-066 rename.

**Why:** Torian 20:43Z wants founders to walk away with a full venture package of business documents; agents are a package enhancement, routing shown in the demo. 20:45Z: packages per phase depend on venture type; a question matrix for a reasoning model picks them.
**How to apply:** extend schema/packages.json (packages, priors, questions) rather than adding new mechanisms. Related: [[ee-hackathon-aitx-2026]].

2026-10-28 21:45Z: EE-069 built and pushed (f87eca4, PR #19). packages.json 0.3.0: assumes (founder-led, discovery+validation), core packages by department (one home per record, refs, after-dependencies), handoff packages by receiver, not_modeled legal/operations/relationships/counsel, versions. `mentura understand` = Understand gate; route.mjs gives understood + destination package. Board /package shows 7 stages; /kanban has package bars. Inventory doc agreed: https://claude.ai/artifact/Na3zCgYrxorBaDQMeHAmib
