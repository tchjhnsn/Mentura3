<!-- exported 2026-11-03 from https://claude.ai/artifact/NXGKHQxfVRpTwBoYiaMeNw (Claude Docs id ae49a9ce-260c-47eb-995f-a61a93a4a6bc) -->
# What a venture is: the model, its proofs, and conversation intake

Oct 31, 2026 · @Torian

Torian asked (2026-10-31 08:24Z): how do we define a venture so far, through every parent, sibling and child level; how a test suite could prove, for any venture type, what it needs; and how conversations like this one become records instead of loose documents. This is read from everything-ecosystem main (752da5d) and tonight's decisions. Architecture only.

## How a venture is defined today, in code

| Piece | Where | What it holds |
| --- | --- | --- |
| The venture | `schema/venture.schema.json` | id, name, kind, type, layout, functions, parent, phase, industry, form, regulation, packages, kits, owner, members, governed\_by, status, links, repos and more |
| Packages | `packages/` (22 folders) and `packages/catalog.json` | Record types grouped into packages, with order (`after`), and the assumption: founder-led, solo or up to five people, Discovery and Validation only |
| Venture types | `schema/venture-types.json` | 9 types: software startup, VC fund, services business, local business, e-commerce, creator media, nonprofit, holding company, side project |
| Phases | `purpose/frameworks/product-anatomy/phases.json` | Discovery, Validation, Beachhead, Scale, Platform |
| Record schemas | `schema/*.schema.json` | 93 schemas |
| Roles | `schema/venture-role.schema.json`, `role-template.schema.json` | Roles and templates for them |
| Conversation intake | `naive capture`, `naive inbox`, `naive diagnose` | Capture keeps text in `raw/` and files chunks into the venture they fit; diagnose finds frameworks, ideas and decisions in agent transcripts (redacted first) and drafts them as a raw source |
| Provenance | `provenance.jsonl` (EE-031) | Append-only, hash-chained log of who did what to which record |

## What tonight agreed the model should be

From the requirements on PR #125 (R-01 to R-68) and tonight's cards:

| Level | Kind | Children | Status |
| --- | --- | --- | --- |
| Workspace | Container | Ventures, people, the founder's raw inbox | Exists |
| Venture | Identity (rigid) | id, founding, founders, essential why, name history, lineage | Agreed; `identity/` not built |
| Legal entity | Separate identity, linked by roles | Form, jurisdiction, officers, tax ids, as dated spans | Researched |
| Function | Rigid, total, may be null | Function modules, then record types, then records; decision classes; checks; playbooks | Agreed; modules not built |
| Phase | Anti-rigid, bitemporal | Sub-phases; per function, an agenda and exit criteria | Agreed; phase log is single-event today |
| Market | Anti-rigid, needs evidence | Segments, then ICPs, then personas; accounts and channels | Designed tonight; ICP records lack the market link |
| Industry | Classification by activity | Codes from NAICS or ISIC, as dated references | Designed tonight |
| Role | Anti-rigid relation | Person or agent, function, decision rights, delegation | Partly built |
| Provenance, decisions, evidence, raw | Cross-cutting | Every record points into them | Built |

## Gaps, found by the rigidity test

1. **"Venture type" mixes four separate axes.** A VC fund is an industry (finance), a nonprofit is a legal form, a side project is an ambition, and a software startup is a business model plus an industry. Each can change independently, so a single `type` cannot be proved. It should split into independent facts: industry, business model, legal form (on the entity), ambition, and markets.
2. **The 22 package folders mix three kinds.** Some are functions (product, marketing, finance, legal, people, operations), some are data owned by a function (customers, investors, money), and some are handoffs named for who receives them (cofounder, counsel, investor, partner, fund). "investor" and "investors" sit side by side. The meta-model needs each kind named and each package filed under one.
3. **No record modules exist for much of tonight's design:** market, segment, engagement (Mentura's contract), waitlist entry, blind spot, policy, writing framework, conversation.
4. **Generated documents are not records.** Tonight's docs and playbooks are artifacts with no route into a package, exactly as you noticed. Records versus artifacts is already agreed (2026-10-29); the route from artifact back to record proposals is missing.
5. **There is no complete venture schema** that says, for a venture as a whole, which functions, record types and gates exist. The catalog covers Discovery and Validation for one governance model.

## A meta-schema for a whole venture

Before any instance, one schema describes every venture:

- **Identity:** the six rigid fields, and links to entities and people by role.
- **Classification:** industry, business model, ambition, markets (each fact with evidence and dates).
- **Functions:** every function, always declared, each with its modules, and each module with the record types it owns, the decision classes, the checks and the phase where its preconditions first hold.
- **Phases:** the five, with sub-phases and the function-by-phase matrix of agendas and exit criteria.
- **Roles:** who owns each function and decision class.
- **Rules:** which obligations follow from which facts (the compliance model: facts, rules, obligations, evidence).

An instance is then a venture's actual records. A missing module is visible as a function with an obligation and no module to meet it.

## The proof suite: any venture in, its needs out

Treat "what a venture needs" as a function of its facts: obligations(venture) = the records, research, roles and gates it needs now. Then test properties for every venture, not examples:

| Property | Statement | How it is checked |
| --- | --- | --- |
| Total | Every venture has every function declared, even with zero modules | Lean, over the shared venture model; and generated ventures in code |
| Deterministic | The same facts always give the same obligations | Property tests (generated venture specs, run twice) |
| Traced | Every obligation names the rule and the source it came from | Code check over the rules library |
| Covered or reported | Every obligation is met by a module, or reported as `E_MODULE_MISSING` with the function, phase and record type | Code check; the zero-modules case you named |
| Monotone in identity | Moving phase never removes an identity or function obligation | Lean |
| Classified on evidence | Industry and market membership pass only on activity and buyer evidence | Code check using the evidence ladder |

Generating ventures means drawing every combination of the axes (industry, business model, ambition, markets, phase, team size) and checking the properties on each. In TypeScript this is property-based testing (the fast-check library is the standard tool); the structural properties also go in Lean.

### How the core improves itself

Every `E_MODULE_MISSING` or untraced obligation becomes an open decision on the docket, the way `naive lint premises --propose` already files findings. That decision can start the research pipeline (fetch, define, run, verify, compile), whose result is a candidate module. The candidate goes through the module admission gate. A person confirms before it joins the catalog. So the suite finds its own gaps, research proposes fixes, and a person decides: self-improving, but never self-approving.

## Conversations as parent records

Your point, and I agree: a conversation is the parent of everything it produces.

- **A conversation record:** id, where it happened (a Claude project thread, a recorder), participants, started and resolved times, and the transcript stored in `raw/` by hash, never copied into records.
- **Input records:** each thing the founder said, verbatim, with its time and hash. Your messages tonight are these.
- **Children:** every record, decision, requirement and artifact made from it cites the input ids it came from, in provenance. So "why does R-63 exist?" answers with your 07:15Z message.
- **Triage is the agreed pipeline.** Capture, understand, route, decide, write, confirm, package (agreed 2026-10-28). `naive capture` and `naive diagnose` already do the first two. The route stage files each element of a conversation into its function and record type; confirm keeps you as the one who accepts.
- **Resolving a thread means triage is complete:** every element was routed to a record or explicitly dropped. That is why resolving threads feels valuable: it is the moment a transcript becomes records.
- **Storage is a setting:** on the founder's own machine, or held by Mentura. Transcripts are private by default and redacted before any model reads them (`diagnose` already redacts).

The Deluminator comparison works: it captures the light from a place and returns it where it belongs.

## Proposed order

1. Write the venture meta-schema, starting with the fixes to venture type and package kinds.
2. Write the property suite against it, with zero modules, so it reports every missing module as an error. That list becomes the real backlog.
3. Run triage on this thread as the first conversation record: tonight produced about 68 requirements, about 25 decisions and 12 documents, which is a good test.
