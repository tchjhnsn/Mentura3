# Sample of gated labels for Torian to rule on

This is the first sample of model labels for Torian's rulings in stage 3 of the ontology program (docs/design/CLAUDE_HANDOFF_ONTOLOGY_PROGRAM.md, S3-PR4). A model proposed status, importance, scope and a few relations for all 218 ideas in `instance/people/p-54697df9/ideas/`. `node scripts/reconcile-ideas.ts` gated every proposal through the schema, the EE-095 term engine and the Lean agreement check. The 25 labels below all reached Labeled. Each row has a single answer: agree, or the value you rule instead. Your rulings become golden records in `docs/reviews/ontology-golden/`. The model never writes there.

Sources: `proposals.jsonl` holds what was proposed, `state.jsonl` holds where each label ended, and `queue.jsonl` holds the 579 labels waiting on a ruling. Confidential ideas are left out of the sample.

## How the sample was drawn

The sample is stratified by field and, inside each field, by the value or the path that produced it.

- Status, 6 rows. One row for each way the status rule decides: preserved on main but not adopted, not in any repo, built on main, decided on main, out of reach (dropped), and on hold (shelved).
- Importance, 5 rows. Two high, two medium, one low.
- Scope, 10 rows. One for each scope the proposals use outside the confidential ideas, plus the three attachment kinds for shared (appends_to, amends, derives_from) and one amends inside a function scope.
- Relation, 4 rows. contradicts, part-of, broader and supports. For each one the target idea's text follows the line break.

A relation reads from the idea in the row to the idea it names. `a broader b` uses the SKOS reading: b is the broader idea, so a specializes b.

## The sample

| # | idea | field | proposed value | idea text, verbatim |
|---|---|---|---|---|
| 1 | n-110 | status | `open` | Provenance is a separate append-only, hash-chained log linked to records by id (EE-031), with one route table (EE-030), and a separate redaction path for history |
| 2 | n-087 | status | `open` | Naive is closed source; Discovery is a free tier through a waitlist; no more npm publishing (0.6.0 stays MIT). |
| 3 | n-189 | status | `in-venture` | Naive is a Claude Code plugin; a public tchjhnsn/naive-plugins repo is the install path. |
| 4 | n-158 | status | `in-venture` | Every venture has a top-level functions/ folder with the 13 catalog functions; departments are an optional add-on. |
| 5 | n-039 | status | `dropped` | naive-dogfood ventures on the Mac |
| 6 | n-063 | status | `shelved` | Palantir 8 (on hold) |
| 7 | n-004 | importance | `high` | Naive as built is a framework, not a platform; only the hosted library plus tenants passes "platform", so it goes under Mentura. |
| 8 | n-188 | importance | `high` | Symbolic layer verified in code and proven in Lean through EE-095; never bypass |
| 9 | n-061 | importance | `medium` | Records link through routes with functions attached, so code (not an LM) triggers agents on change (leaning) |
| 10 | n-121 | importance | `medium` | No branching or merging of knowledge yet; draft and accepted are enough |
| 11 | n-076 | importance | `low` | Queued decision record (title only): Jev calibration |
| 12 | n-036 | scope | `shared via appends_to` | A gate chain before building: G0 vocabulary, G1 design, G2 conformance, G3 verification, G4 proof. |
| 13 | n-178 | scope | `shared via amends` | "Harness" takes its industry sense; our tool is a "workbench". |
| 14 | n-066 | scope | `shared via derives_from` | Research notes that open decision PRs cite as their basis (Jev vs LLM, coalition and transaction cost, symbolic-system ontology, agent runtime, venture vs organization) |
| 15 | n-031 | scope | `naive@strategy via appends_to` | Research the whole industry as one venture; the venture library and industry graph belong to Mentura. |
| 16 | n-179 | scope | `naive@marketing-and-sales via appends_to` | Anything published goes through a gate with a publication policy per venture. |
| 17 | n-218 | scope | `naive@products via appends_to` | Product Anatomy Matrix runs every product against the core promise; Naive and Mentura each need their own anatomy. |
| 18 | n-024 | scope | `naive@human-capital via appends_to` | Roles are derived by tests over relationship facts (employee, contractor, advisor, coach). |
| 19 | n-012 | scope | `naive@risk-and-compliance via appends_to` | Compliance gates use a rule model (Catala, LegalRuleML, OPA deny sets as error codes); Naive's edge is deriving which frameworks apply from facts. |
| 20 | n-102 | scope | `naive@service-delivery via appends_to` | Mentura services: headshots, scholarships for waitlisted founders, banking and legal, merch. |
| 21 | n-087 | scope | `naive@products via amends` | Naive is closed source; Discovery is a free tier through a waitlist; no more npm publishing (0.6.0 stays MIT). |
| 22 | n-095 | relation | `contradicts n-096` | Rename the knowledge layer to "source of truth layer".<br>n-096: "Layer" is reserved for the technical sense; our purpose, knowledge, operations groupings are "areas". |
| 23 | n-048 | relation | `part-of n-047` | Metamodel in JSON Schema with SKOS and OWL names mapped; models only propose schema-valid change lines; changing it is a one-way-door amend<br>n-047: Three ontology layers: metamodel, upper ontology, catalog of name@function ontologies; built one at a time, metamodel first |
| 24 | n-054 | relation | `broader n-051` | Origin "adopted" only with a quoted source definition, otherwise "adapted"<br>n-051: Term labels: scope, origin (adopted, adapted, narrowed, broadened, borrowed, operationally coined), grade (standard + regulatory/codified; convention + seminal; none). "Scoped sense" and "invention" dropped |
| 25 | n-202 | relation | `supports n-201` | A docket evidence set of 8 cited scenarios, whose right-order labels are Claude's draft awaiting Torian.<br>n-201: The decision docket ranks within and across functions; one decision can outweigh a whole function. |

## Ideas whose scope is mixed

Gate G6 asks whether the 9 mixed-scope ideas are placed right. No committed file lists those 9. The model's rule finds 11. An idea counts as mixed when its own text names concerns that belong to two or more function scopes in `operations/departments.json`, so no single scope holds all of it. Each one is placed where its leading clause points, and the other scopes it touches are listed. Two of them are confidential, so their text stays out of this file.

| idea | placed in | also touches |
|---|---|---|
| n-011 | shared via appends_to | risk-and-compliance (business formation, policies, compliance), finance (monetization), marketing-and-sales (publishing as a "communications" function) |
| n-033 (confidential) | naive@capital via creates | finance, external-relationships |
| n-079 | shared via derives_from | finance and products (finance@engineering gating) |
| n-087 | naive@products via amends | marketing-and-sales (a free tier through a waitlist) |
| n-102 | naive@service-delivery via appends_to | finance (banking), risk-and-compliance (legal), marketing-and-sales (headshots, merch) |
| n-124 | naive@human-capital via appends_to | it (accounts and access) |
| n-137 (confidential) | naive@marketing-and-sales via appends_to | external-relationships |
| n-144 | shared via appends_to | strategy (competitor), supply-chain (supplier), external-relationships (partner) |
| n-162 | shared via appends_to | products (MVP re-cut), strategy (research), marketing-and-sales (publishing) |
| n-171 | shared via appends_to | marketing-and-sales (customers), external-relationships (investors), finance (money) |
| n-206 | naive@marketing-and-sales via appends_to | strategy (the beachhead) |

Four mixed ideas did not reach Labeled for scope. n-011, n-137, n-162 and n-171 are RoutedToScope because their terms (module, lead, requirement, package) are not nouns in `docs/ontology.json`. Their placement still waits on that gap, not only on G6.
