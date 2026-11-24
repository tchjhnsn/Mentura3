---
type: handoff
source: ai-drafted
created: 2026-11-01T03:05:00Z
ai-model: claude-opus-5.5
tags: [naive, mentura, handoff, grok, product-anatomy, venture-anatomy, relationships, glossary]
description: "Handoff to Grokbot: build the record types, schemas and relationship theorems that let ventures be described and compared, plus the Product Anatomy fixes. Comparisons themselves are out of scope."
---

# Handoff to Grokbot: venture records, anatomy and relationship theorems

Planned in Torian's project thread "Design venture comparison pipeline" (2026-11-01). Grokbot builds, verifies and reviews; Torian merges. Draft PRs only.

## Decided by Torian

- **Records first, comparisons later.** No comparison, similarity matrix or competitor verdict about a real company is built in this handoff. Comparisons are derived only once venture anatomy records exist (02:49Z).
- **Three record types, then artifacts:** venture record, product anatomy record and venture anatomy record. Artifacts are views rendered from records, never the source of truth (records-vs-artifacts rule, 2026-10-29).
- **Cursor and Grok are suppliers to us, not competitors.** We build every product with them. On the value net that makes them suppliers (an engineering dependency). Feature-level competition stays an open claim, never a default (02:55Z).

## Definitions the build must use

These are proposed and have been run through the term engine (sandbox, `proof-vocab.ts` 30/30, `anatomy-vocab.ts` 25/25, Lean clean). Use them exactly; a word not here is not a term yet.

| Term | Meaning | Source |
|---|---|---|
| venture | An undertaking with its own identity (founders, essential why), one core promise, and all 13 functions (a function's state may be null). It may hold ventures. | R-02, R-03, R-08 |
| group | A venture holding ventures with different cores; has its own control, capital and related-party parts. "Holding" is the open alternative name. | IFRS 10 |
| matrix | Records arranged as items by attributes; every cell is a typed value with evidence and an as-of date. Computed, never stored. | m-by-n array |
| decision matrix | A matrix whose attributes are weighted criteria, used to rank items | Pugh (1981) |
| similarity matrix | Items by the same items; each cell a distance or similarity | Gower (1971) |
| vector | One matrix row read as an ordered list of values | linear algebra |
| embedding | A vector a model computes from text or data; it may nominate candidates, never prove a relation | ML usage |
| competitor | A role, never a kind of company. B competes with A, for a customer, job and segment at a date, when that customer values A less because B is available (substitution). | Brandenburger and Nalebuff (1996); SSNIP test |
| complementor | B complements A when the customer values A more because B is available | same |
| supplier, customer, channel | B supplies A's inputs; buys A's output; brings A's customers | Porter (1980); R-68 |
| partner | A complementor, supplier or channel with whom an agreement exists. A fact about a contract. | business usage |
| prove | `prove@math`: derivation in Lean. `prove@law`: meeting a stated standard of proof. Naive's default for claims about the world is `prove@law`, so a verdict is "established to standard S on this evidence", never "true". | engine run 02:55Z |
| verify / validate | Meets its specification / the specification meets the need | IEEE 1012 |

One player can hold several roles toward us at once (co-opetition). A relation holds at one level (group, venture, product or feature) and is never inherited across levels.

## Work items

One branch and one draft PR per item, in this order. Each item must leave `node test.mjs` green.

### 1. Schemas

- `schema/product.schema.json`: add `parent` (product or venture id). Add `schema/feature.schema.json` with `parent` (a product id), `job`, `served` (people-served ids).
- An `unknown` cell value: `{ "unknown": true, "reason": "..." }`. It is distinct from `null`, which means the function does not exist. Add a shared `$defs/cell` with `value | unknown`, `ref` (reference id), `evidence` (`demonstrated | inferred | assumed`), `as_of` (date).
- A `contested` cell value: `{ "contested": true, "values": [cell, ...], "note": "..." }` for two sources that disagree. It never resolves to one value by itself.
- Reference records gain `tier` (`primary | reputable-reporting | index`) and `read` (boolean). A cell citing an unread reference or an `index` reference cannot carry `evidence: demonstrated`.
- `schema/venture-anatomy.schema.json`: one record per venture with the 13 parts below. Each part has a ladder level (0 absent, 1 stated, 2 cited evidence, 3 verified by an outsider) as a cell.
- `schema/relationship.schema.json`: `{ id, from, to, level, relation, job, segment, as_of, theorem, standard, evidence: [ref ids], verdict: established | not-established | open, open_obligations: [] }`. A relationship record is derived by code, never typed by hand.
- Study layout: `research/ventures/<id>/` inside the studying venture holds `venture.json`, `products/`, `features/` and `anatomy.json` for an outside venture, with the same schemas.
- Register every new record type in `schema/data-model.json` and regenerate `schema/types/records.d.ts` (`node schema/record-types.ts`).

Venture anatomy parts (part, Naive function, the S-1 section it mirrors, ladder level 1 by, level 2 by):

| Part | Function | S-1 section | L1 by | L2 by |
|---|---|---|---|---|
| core | why | Prospectus summary | Discovery | Validation |
| defined-terms | what | Select Defined Terms | Discovery | Beachhead |
| risk-register | when | Risk Factors | Discovery | Validation |
| customers | who (demand) | Business: customers | Validation | Beachhead |
| market | where | Industry; Competition | Validation | Beachhead |
| products | what | Business (Product Anatomy) | Validation | Beachhead |
| people | who (supply) | Management | Validation | Scale |
| control | who decides | Governance; Capital stock; Principal stockholders | Beachhead | Scale |
| dependencies | how | Suppliers and partners | Beachhead | Scale |
| financials | how much | Selected financial data; MD&A | Beachhead | Scale |
| capital | how funded | Use of proceeds; Capitalization; Dilution | Beachhead | Scale |
| regulation | where (rules) | Regulation; Legal proceedings | Scale | Platform |
| related-parties | who else | Related-party transactions | Scale | Platform |

A decision record may carry `implies: [{ part, level }]`, which raises a part's required level from the day the decision is made (for example "we may go public" raises every part to 2).

For a study of an outside venture the level measures the public record: a part that surely exists but is not public (a confidential draft S-1) is `unknown`, and 0 means it does not exist.

Done when: the schemas validate the fixtures below, `node schema/check-data-model.mjs` holds, and a fixture with `unknown` in a cell passes while one with a bare missing value fails.

### 2. Relationship theorems in code and Lean

- `purpose/frameworks/relationships/theorems.mjs`: `competes`, `complements`, `supplies`, `channels`. Each takes two nodes, a level, a job, a segment and a date, reads only records, and returns `{ verdict, open_obligations }`. Example: `competes` needs both nodes to serve the segment at the date, both to do the job, and substitution evidence from the customer side (switching, side-by-side evaluation, or the customer naming both). The last premise is usually an open obligation, and the function must say so rather than guess.
- `lean/Relationships.lean` (the `lean/` folder arrives with PR #135; core Lean, no Mathlib, the `spct-lean` pattern): the four relations as `def`s returning `Prop` over a finite structure; prove `no_inheritance` (a relation at one level implies nothing at another) and `roles_coexist` (competitor and complementor can hold for the same pair at once).
- Tests with fixture ventures only. No real company in this item.

Done when: the generic test shows each theorem returns `open` (not `established`) when substitution evidence is missing, and the Lean file builds.

### 3. Product Anatomy fixes (`purpose/frameworks/product-anatomy/`)

- **Defined before scored.** `anatomy.mjs score` and `matrix` refuse a product whose `job`, `market` (or `served`) and `offering` are absent and not marked `unknown` with a reason. Print the missing fields as obligations.
- **Questions tied to rules.** Each entry in `questions.json` names the role rule or must-hold it serves (`serves: [...]`). `test.mjs` fails on a question that serves nothing.
- **Evidence per answer.** Answers files accept the cell shape (value, ref, evidence, as_of). Bare numbers still load, with a warning.
- **Weighted spillover.** Flows carry a weight. Add a stability test: removing any one edge must not change the flagship unless the report says it is edge-sensitive. Anthropic's run on 2026-11-01 was edge-sensitive, which prompted this test.
- **Internal substrate.** A product with `offered_to: none` can be substrate.
- Regression: `examples/ai-labs/` (Anthropic, OpenAI, SpaceX, Thinking Machines) still render; record the role changes in the PR body.

### 4. Venture anatomy runner

`purpose/frameworks/venture-anatomy/anatomy.mjs check <venture dir>` reads `anatomy.json` and the venture's phase, and reports each part below its required level, including levels raised by `implies` on decisions, and counts the `unknown` and `contested` cells inside every part, since a part can pass its level with key figures missing. It works the same on a study under `research/ventures/<id>/`. Fixtures only.

## Learned from the first studies (2026-11-01)

The Anthropic and OpenAI studies were run by hand in Mentura's research folder on the draft shapes above. They are not in this repo. They showed four needs, now written into items 1 and 4: the `contested` cell, reference `tier` and `read`, the public-record reading of the ladder, and counting unknown cells inside a part (Anthropic passes all 13 parts while its preliminary S-1 leaves Q3 revenue, committed compute spend and dilution blank).

## Out of scope

- Running the research. This handoff builds the engine that performs studies and stores their records; studying a real company with it, and any comparison, similarity matrix, embedding or competitor verdict, come after it is built and wait for Torian's go-ahead.
- The term-harvest skill and the founder glossary. They are designed in the plan and run in the sandbox term engine, not in this repo yet.
- Polity.

## Confidentiality

Mentura's research engine and any founder glossary are confidential. Nothing in this handoff needs them. The only glossary input is the public term list in `docs/design/term-harvest/TERM_LIST_2026-11-01.json` (199 terms, 36 already run). Run its pending terms through the term engine in the order its `how` field gives, contested terms first. The sandbox files it names under `naive-design/prototypes/architecture/` are not in this repo; follow the pattern it describes instead.

## Review

Each PR names which definition above each schema field implements. Reviewers check that no relationship can be written without a theorem id, and that `unknown` never counts as zero anywhere.
