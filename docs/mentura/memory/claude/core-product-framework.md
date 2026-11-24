---
name: core-product-framework
description: The 2026-10-26 "Product Anatomy" core-product framework draft, its proposed home, and its Polity verdicts
metadata:
  type: project
  modified: 2026-10-26T19:42:44.704Z
---

Draft (Claude Doc, 2026-10-26): https://claude.ai/artifact/A8e5fEBS3AsszAB2iaBKvd . Not yet written to the vault.

Framework "Product Anatomy" (name confirmed by Torian 2026-10-26; Part 4 = "Succession Matrix"): a product card (job, core benefit, buyer/user, generic, expected, augmented, potential, whole product for beachhead, competence, role, revenue line) + a portfolio map with roles substrate / flagship / end product / wedge / feature, plus a platform flag, and five tests (product-or-feature, merge, substrate, flagship, platform). Separates three meanings of "core product": Kotler core benefit, business flagship, Prahalad-Hamel shared core product (= substrate).

Proposed home: vault/everything-ecosystem/methodology/frameworks/product-anatomy-framework.md (beside business-discovery-framework.md) + a SAD amendment making the card section 0 of every PRODUCT_SPEC. Not MAD (Torian wants MAD slim). Public catalog entry in sad-methodology site/.../catalog/artifact-types later.

Polity verdicts (drafts): core competence = a cited, structured public record; Polity Data = substrate + platform; Social = flagship today; Polity OS = flagship candidate; Docket = wedge; Nico = unassigned (no tie to competence). Proposed products.json fields for the TypeSafe product map: role, job, competence.

Open for Torian: framework name, second competence?, flagship now (Social vs OS), Nico's home.

Related: [[polity-vision-and-roadmap-draft]]

2026-10-26 22:35Z, Torian: the flagship must be deduced across the whole portfolio, not chosen by him, and the answer changes with company stage (Apple/Google/Tesla over time). Added "Part 4: deducing roles across the portfolio, by stage" to the doc: flagship vs revenue engine vs substrate; stage + binding constraint; flow graph; must-holds (allowed at stage, shippable, draws on competence); stage-weighted criteria (weights separate, Jev + reasoning model); snapshot with successor and handover condition; re-run at stage gates. Provisional Polity result: Social flagship now, Data substrate (later revenue engine), Docket wedge, Polity OS successor at Stage 2 (D-038), Nico unassigned.
2026-10-26 22:45Z: Torian likes Google's name "Strategic Transformation Matrix" (not settled). Doc gained "Part 4 research" section: Moore (Chasm/Tornado), McKinsey Three Horizons, BCG matrix, Zook Unstoppable, Wardley evolution, Greiner, Helmer power progression; review of Google's 4 phases (Wedge, Beachhead, Core Engine, Horizon = Moore + H3, Tesla-specific contents). Names offered; recommended Product Anatomy for whole + "Succession Matrix" for Part 4.
2026-10-26 22:40Z: Torian chose the names (Product Anatomy whole, Succession Matrix for Part 4) and the four phases Wedge / Beachhead / Core Engine / Horizon as the Succession Matrix stages; doc updated (weights table now 4 columns). Polity is in the Wedge phase.
2026-10-26 23:00Z, Torian: core product must be established first; flagship = the product that best delivers the core product promise; run all products through it with Jev like the old map.ts; likely name "Product Anatomy Matrix" (adopted as the working name). Built (uncommitted) in EE repo purpose/frameworks/product-anatomy/: questions.json (7 typed Qs), phases.json (Wedge/Beachhead/Core Engine/Horizon weights + flagship must-holds), anatomy.mjs (request / score --send / matrix), examples/polity.json (core = 2026-07-27 Vision/Mission/Promise lock), polity.answers.reasoned.json (Claude draft scores; no TYPESAFE_API_KEY in cloud). Result: Social flagship all phases, Data substrate (+revenue engine), Docket wedge, OS option then tied revenue engine, Nico unassigned. Doc gained Part 0 and Part 5.
