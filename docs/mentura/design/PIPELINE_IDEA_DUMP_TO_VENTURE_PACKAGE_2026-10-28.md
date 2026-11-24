---
publish: false
type: design-note
source: hybrid
created: 2026-10-28T20:52:53Z
updated: 2026-10-28T21:45:00Z
ai-model: claude-opus-5.5
authority: advisory
status: DRAFT
tags: [everything-ecosystem, pipeline, venture-package, packages, question-matrix, hackathon]
description: "The founder's pipeline from idea dump to venture package, by what the founder does: capture, understand, route, decide, write, confirm, package. Core and handoff packages, what moves on its own, the gate to automation, and the governance model Naive assumes (EE-067, EE-069). Version 0.3.0, unevaluated."
---

# From idea dump to venture package

Proposed in EE-067 and EE-069, worked out with Torian on 2026-10-28 and unevaluated. The first draft of this note listed stages by the files they produce (a sitemap stage among them); that was wrong. The stages are what the founder does, and the sitemap is one record inside the marketing package. The inventory and its dependency diagram were agreed in a doc: [Venture packages: inventory and dependencies](https://claude.ai/artifact/Na3zCgYrxorBaDQMeHAmib).

## What Naive assumes

Naive is opinionated (2026-10-28, EE-069): it assumes one governance model. The founders decide, confirm every record and do everything in the venture, product management and engineering included. How packages split and which gates hold follow from that model; other structures (separate engineering teams, boards that gate decisions, enterprises) are not modeled. Packages that matter only for them, or only after Validation, are kept here marked not_modeled and are left out of the venture package.

## The pipeline

| # | Stage | What the founder does | What they get | Where |
|---|---|---|---|---|
| 1 | Capture | Writes down every idea, in their own words | Everything out of their head, kept verbatim | `purpose/ideas/dump.md` |
| 2 | Understand | Checks how Mentura read the ideas (map and graph), corrects it, confirms (`mentura understand`) | Their ideas organized for the first time, and Mentura's reading confirmed. **A gate** | `/map`, `/graph` |
| 3 | Route | Watches the ideas land in the venture's packages | The venture's structure taking shape: each package's bar, what moves now, what waits | `/kanban` |
| 4 | Decide | Settles the decisions only they can make, in ranked order; the foundation first, failing closed | The first gate they really feel | `/` |
| 5 | Write | Drafts records, or has an agent draft them (an enhancement) | Records written from their ideas and decisions | the venture folder |
| 6 | Confirm | Reviews each record and makes it theirs | Records that are the founder's, not an agent's. **A gate** | `/package` |
| 7 | Package | Nothing more: a package completes when its records are confirmed | The gate to automation opens for that package | `/package`, `package/` |

Capture to Understand and Understand to Route pay off quickly. Route to Package is the long stretch, so Route carries the most visual feedback: a bar per package that climbs as records are written and confirmed.

Stages 3 to 6 are a loop, not a line. They run for the foundation first, then for each package as the venture's phase and situation open it. A record moves on its own once everything it reads first is confirmed; until then it waits.

## The venture package

The venture package is the venture's business source of truth: the records in place, not a copy. Engineering may keep its own. It grows as work lands in it. For example, customer feedback gathered for a docket item is saved into the validation package, and that step is checked off. It gets a new version each time a package completes or the phase changes, with a tag to set in git (`package/<venture>/v<n>`); ordinary edits stay plain commits. `node interface/orchestration/venture-package.mjs <venture> --write` renders a readable view into `package/`: an index, one document per open package, and the manifest with its versions.

**A package is complete** when a person has confirmed its required records and every record it reads. Completion opens MAD's automation tier for the work that depends on that package, package by package. Marketing automation can run while the investor handoff is still being written. Agents never come in a package; an agent that works a package is an enhancement.

## Core packages

Where the records live, one per department (EE-047) plus the foundation. Each record has exactly one home; other packages read it. Priors per phase; bold opens the package (at or above 0.5).

| Package | Department | Holds | Reads | Discovery | Validation | Moved by | Unlocks |
|---|---|---|---|---|---|---|---|
| Foundation | strategy | validation-problem, icp; optional venture-profile, telos, alignment | product | **0.95** | **0.95** | nothing | agents may draft every other package, the near-daily review |
| Validation | strategy | validation-solution, validation-pricing, validation-go-to-market; optional validation-product-market-fit, evidence | validation-problem, icp | **0.6** | **0.95** | ambition:hobby ≤ 0.4 | interview scheduling, surveys, research runs |
| Product | products | product; optional anatomy-answers | icp | **0.6** | **0.9** | products>=1 ≥ 0.8 | the engineering handoff: build what is specified |
| Marketing and sales | marketing-and-sales | marketing-sitemap; optional marketing-content, site-presence | icp, product | 0.35 | **0.7** | site ≥ 0.75, publishes ≥ 0.8 | site build, campaigns, outreach sequences |
| Finance | finance | business-models | validation-pricing, product | 0.2 | **0.5** | raising ≥ 0.8 | pricing tests, invoicing, bookkeeping, financial models |
| People | human-capital | validation-team, team-plan; optional founder-agreement | nothing | 0.2 | 0.4 | team:looking ≥ 0.9, team:cofounders ≥ 0.8, hiring ≥ 0.85, path:cofounder-first ≥ 0.9 | recruiting outreach, onboarding |

## Handoff packages

Snapshots of core packages for one receiver, ready when every package they draw on is complete.

| Package | For | Draws on | Discovery | Validation | Moved by | Unlocks |
|---|---|---|---|---|---|---|
| Investor | investors | foundation, validation, finance, people, legal | 0.05 | 0.2 | raising ≥ 0.95, funding:venture-capital ≥ 0.7, funding:angel ≥ 0.6, funding:bootstrapped ≤ 0.1, ambition:hobby ≤ 0.05 | pitch deck, data room, investor updates |
| Partner | the partners a product is offered to | foundation, product, marketing | 0.05 | 0.1 | partner_led ≥ 0.9 | partner kit, co-marketing |
| Cofounder and hire | cofounders and first hires | foundation, people, legal | 0.1 | 0.2 | team:looking ≥ 0.9, hiring ≥ 0.85 | recruiting pitch, offer terms |
| Engineering | you, or your own coding agent, when you build the site and the product | product, marketing | 0.2 | **0.6** | software ≥ 0.7, site ≥ 0.7 | the site build, the product build |

## Not modeled yet

- Legal and governance: Matters after Validation or under another governance model; kept for later, not computed (EE-069).
- Operations: Matters after Validation or under another governance model; kept for later, not computed (EE-069).
- Relationships: Matters after Validation or under another governance model; kept for later, not computed (EE-069).
- Counsel: Matters with co-owners, outside money or a regulated field; kept for later, not computed (EE-069).

## What waits on what

A record moves on its own once every record it reads first is confirmed. Records not listed here wait on nothing.

| Record | Reads first |
|---|---|
| telos | validation-problem |
| alignment | telos |
| validation-solution | validation-problem |
| validation-pricing | validation-solution |
| validation-go-to-market | validation-pricing, icp |
| validation-product-market-fit | validation-solution |
| anatomy-answers | product |
| marketing-sitemap | icp, product |
| marketing-content | marketing-sitemap |
| business-models | product |
| team-plan | validation-team |
| founder-agreement | validation-team |
| ownership | validation-team |
| decision-rights | team-plan |
| board | ownership |
| exit | ownership |
| handoff | department, decision-rights |
| validation-operations-readiness | handoff |
| account | icp |

## The question matrix

What a reasoning model answers to decide which packages open. A question is asked only in its phases, and only when the venture's records do not already settle it. Jev answers each as a typed question over the venture's records and idea dump: at or above 0.7 sets the fact, at or below 0.3 clears it, and anything between stays open for the founder.

| Question | Sets | Asked in | Moves | Settled first by |
|---|---|---|---|---|
| Is the venture raising money from investors now, or about to? | `raising` | every phase | investor, finance | the founder's flags (raising) |
| Does the venture have a public website, or plan one within the next month? | `site` | every phase | marketing, engineering | a site presence record (a site Naive has read) |
| Is the product offered to partners or intermediaries who serve customers of their own? | `partner_led` | every phase | partner, relationships | the ICP (reached_through) and products (offered_to) |
| Will the venture hire anyone, or bring on a cofounder, in the next three months? | `hiring` | every phase | people, cofounder | the founder's flags (hiring) and the team decision |
| Does the venture work in a regulated field (health, finance, education, legal, children, public sector)? | `regulated` | validation, beachhead, scale, platform | legal, counsel | nothing yet: always asked |
| Does the founder mean to sell the venture or take it public one day? | `exit_intent` | beachhead, scale, platform | legal, investor | the exit record |

## Open

- Records Naive does not have yet: brand voice and guidelines, campaigns, sales pipeline, budget and runway, revenue, financial model, product specs and roadmap, customer feedback, partner and investor records.
- Kits (a layer's record types, skills and checks, for developers) and venture packages (the founder's records) are different things; reconcile the names before EE-066 renames kits.
- Priors, dependencies and questions are ours (version 0.3.0) and need evaluating against real ventures.

Commands: `mentura understand --venture <id>` (the Understand gate), `node interface/orchestration/venture-package.mjs <venture> [--write]`, `node interface/orchestration/venture-package.mjs request <venture>` (the Jev request), `node interface/harness/run.mjs discovery --dump <ideas.md>` (the whole pipeline).
