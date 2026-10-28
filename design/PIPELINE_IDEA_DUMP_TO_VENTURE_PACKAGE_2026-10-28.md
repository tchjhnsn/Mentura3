---
publish: false
type: design-note
source: hybrid
created: 2026-10-28T20:52:53Z
ai-model: claude-opus-5.5
authority: advisory
status: DRAFT
tags: [everything-ecosystem, pipeline, venture-package, packages, question-matrix, hackathon]
description: "The founder's pipeline from idea dump to venture package: each stage, what the founder gets from it, and what they walk away with. Packages by phase and the question matrix that picks them (EE-067). Version 0.1.0, unevaluated."
---

# From idea dump to venture package

Proposed in EE-067 and EE-068, ours and unevaluated. Torian, 2026-10-28: someone who starts with an idea dump should walk away with a full venture package of the business documents for their venture. Agents do not come in the package: an agent that works a package is a package enhancement. The hackathon demo includes routing.

## The pipeline

Each stage pays off on its own, so a founder can stop after any of them and still have something.

| # | Stage | What the founder does | What Naive does | What the founder gets | Where |
|---|---|---|---|---|---|
| 1 | Idea dump | Writes down every idea, as it comes | Keeps it verbatim | Everything out of their head, safe | `purpose/ideas/dump.md` |
| 2 | Idea map | Nothing | Tags each idea by pillar, department and record (Jev) | Their ideas on one canvas: strengths and gaps | `/map`, `purpose/ideas/map.mdx` |
| 3 | Idea graph | Nothing | Judges what builds on what; signal and lanes | What to develop first, and what moves on its own | `/graph`, `purpose/ideas/graph.json` |
| 4 | Routes | Nothing | Sends each idea to the records it feeds | Each record's next step, from the framework's state | `/kanban` |
| 5 | Decisions | Settles the decisions only they can make, in ranked order | Ranks the docket; agents propose wording | The strategic foundation, confirmed in their words | `/` (decision board) |
| 6 | Records | Accepts or edits drafts | An agent drafts each routed record from its ideas (demo: the harness passes) | Problem, ICP, products, solution, pricing, go to market, team... | the venture folder |
| 7 | Sitemap | Nothing until review | Plans the public site from the records (EE-064) | What goes where on the site, for whom and why, and the public variants to write | `/site`, `operations/marketing/sitemap.json` |
| 8 | Venture package | Reviews what is left | Picks the packages that fit and renders them | **The venture package**: every package that fits now, each record confirmed, to review or to write | `/package`, `package/` |

Site presence (EE-062 to EE-064, EE-068) sits beside stage 7 for a venture that already has a site: paste a link, and Naive reads who the site is for from the site itself and rates each route. A clarity score that compares the ICP the founder states with the ICP the site implies comes later.

## What the founder walks away with

`<venture>/package/`:

- `README.md`: the index. Which packages fit now and why, how complete each is, what is still to write or review, which packages come next phase and which are held, and the questions that decided it.
- One document per fitting package (`foundation.md`, `validation.md`, `marketing.md`...): each record rendered in full, marked confirmed, drafted by an agent or not written, with its next step.
- `venture-package.json`: the manifest, for the board and for whatever comes next.

A package is **ready to hand off** when a person has confirmed every required record. Handing off means to a person (an investor, a cofounder, engineering) or to an agent; the agent is the enhancement, not part of the package. The documents are internal: anything public goes through its public variant and the public gate (EE-064).

## Packages by phase

Priors for whether a venture needs each package, by phase. Bold is at or above the fit line (0.5). The conditions come from the venture's facts (need-now, EE-028) and from the question matrix. Source: `schema/packages.json`.

| Package | For | Discovery | Validation | Beachhead | Scale | Platform | Raised or lowered by |
|---|---|---|---|---|---|---|---|
| Strategic foundation | the founder, and anyone who joins | **0.95** | **0.95** | **0.95** | **0.95** | **0.95** | nothing |
| Validation | the founder and their advisors | **0.6** | **0.95** | **0.6** | 0.3 | 0.2 | ambition:hobby ≤ 0.4 |
| Marketing | engineering, who builds the site from it | 0.35 | **0.7** | **0.9** | **0.9** | **0.9** | site ≥ 0.75, publishes ≥ 0.8 |
| Investor | investors | 0.05 | 0.2 | 0.35 | 0.45 | 0.45 | raising ≥ 0.95, funding:venture-capital ≥ 0.7, funding:angel ≥ 0.6, funding:bootstrapped ≤ 0.1, ambition:hobby ≤ 0.05 |
| Cofounder and team | cofounders and first hires | 0.2 | 0.4 | **0.6** | **0.8** | **0.8** | team:looking ≥ 0.9, team:cofounders ≥ 0.8, hiring ≥ 0.85, path:cofounder-first ≥ 0.9 |
| Partner | the partners a product is offered to | 0.05 | 0.1 | 0.2 | 0.3 | **0.5** | partner_led ≥ 0.9 |
| Ownership and governance | counsel, the board and co-owners | 0 | 0.1 | 0.4 | **0.8** | **0.9** | founders>=2 ≥ 0.7, funding:venture-capital ≥ 0.8, regulated ≥ 0.6, exit_intent ≥ 0.9 (scale) |
| Operations | the team that runs the venture day to day | 0.05 | 0.3 | **0.7** | **0.9** | **0.95** | people>=3 ≥ 0.7, offering:service ≥ 0.55 (validation) |

## The question matrix

What a reasoning model answers to decide which packages fit. A question is asked only in its phases, and only when the venture's records do not already settle it. Jev answers each as a typed question over the venture's records and idea dump: at or above 0.7 sets the fact, at or below 0.3 clears it, and anything between stays open for the founder.

| Question | Sets | Asked in | Moves | Settled first by |
|---|---|---|---|---|
| Is the venture raising money from investors now, or about to? | `raising` | every phase | investor | the founder's flags (raising) |
| Does the venture have a public website, or plan one within the next month? | `site` | every phase | marketing | a site presence or sitemap record |
| Is the product offered to partners or intermediaries who serve customers of their own? | `partner_led` | every phase | partner | the ICP (reached_through) and products (offered_to) |
| Will the venture hire anyone, or bring on a cofounder, in the next three months? | `hiring` | every phase | team | the founder's flags (hiring) and the team decision |
| Does the venture work in a regulated field (health, finance, education, legal, children, public sector)? | `regulated` | validation, beachhead, scale, platform | governance | nothing yet: always asked |
| Does the founder mean to sell the venture or take it public one day? | `exit_intent` | beachhead, scale, platform | governance, investor | the exit record |

## Open

- Packages, priors and questions are ours (version 0.1.0). They need evaluating against real ventures and the venture-type research the marketing matrix also needs.
- More venture types should move packages: hardware, marketplaces, nonprofits and services each have their own documents.
- EE-066 (kit to package) is held. Kits are a layer's records, skills and checks; venture packages are the founder's deliverable. The names must be reconciled before the rename.
- The clarity score (EE-068).

Commands: `node schema/packages.mjs <venture> [--write]`, `node schema/packages.mjs request <venture>` (the Jev request), `node interface/harness/run.mjs discovery --dump <ideas.md>` (the whole pipeline; ends with stages 7 and 8).
