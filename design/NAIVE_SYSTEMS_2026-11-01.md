---
type: design-note
source: hybrid
created: 2026-11-01T09:29:48Z
ai-model: claude
status: DRAFT
authority: implementation
tags: [everything-ecosystem, naive, ontology, identity, functions, packages, phases, provenance, standards, prior-art]
description: "Naive, one system at a time: for each system, what kind of thing it is (its ontology), how it works in the code today, the standards it follows, and the prior art. Written before the single Naive record and the technical version, which are built from it."
---

# Naive, one system at a time

Naive describes a venture by asking six questions about it (who, what, when, where, why, how) at two scales. At the venture scale the answers describe the venture as it stands. At the record scale, asked of every record and every decision, the answers are provenance (R-01, R-02 in `docs/design/REQUIREMENTS_IDENTITY_FUNCTIONS_PHASES_PROVENANCE_2026-10-30.md`, PR #125).

Each question is answered by one system. This note takes the systems in order:

| Question | System | Section |
| --- | --- | --- |
| Who | Identity | 1 |
| How | Functions and function modules | 2 (next) |
| What | Packages | 3 |
| When | Phases | 4 |
| Where, Why | Where and why | 5 |
| Who, what, when, where, why, how of each record | Provenance | 6 |

Each section has the same parts: what kind of thing the system is, its parts, how it works in the code today, the standards it follows, prior art, conflicts with what is already on `main`, and what must be built. "Agreed" means Torian agreed it; "proposed" means it is not agreed yet.

## 1. Identity

### What kind of thing it is

A venture's identity is the set of its properties that hold in every state the venture can be in, and that decide whether two records describe the same venture.

The terms come from OntoClean (Guarino and Welty, 2002) and its successor UFO (Guizzardi, 2005):

- **Rigid property:** true of a thing in every state in which the thing exists. If it stops being true, the thing no longer exists. "Venture" is rigid for a venture.
- **Anti-rigid property:** true of a thing only for a time. Phases and roles are anti-rigid. A venture in Discovery can leave Discovery and remain the same venture.
- **Identity criterion:** the test that answers "is this the same venture as before?" A kind of thing that has one is a *sortal*. "Venture" is a sortal; "early-stage" is not.
- **Role:** an anti-rigid property that holds because of a relation to something else (founder *of* a venture, investor *in* it). A **phase** is an anti-rigid property that holds because of the thing's own state.

OntoClean's constraint that matters most here: an anti-rigid class cannot contain a rigid one. So "founder" (a role) can never be the kind a person belongs to, and "Discovery venture" can never be a subtype of venture that some venture is permanently.

In Naive, identity is a **rigid sortal**: the kind *venture*, with an identity criterion. Everything else about a venture is either a role, a phase, or a value that changes over time.

### Its parts

Agreed (R-03, R-04, R-16):

- The venture, its founders and every other person are **separate identities**, linked by roles. Roles are anti-rigid and relational. The reason for a role assignment (a hire, say) lives in that assignment's provenance.
- Identity is stored as JSON records in `identity/`, replacing `foundation/`. `venture.json` stays the manifest.

Proposed (identity research, 2026-10-31, https://claude.ai/artifact/6PbSQ93sHw2hKxDJcx5YJH):

| Part | Rigid? | Notes |
| --- | --- | --- |
| Venture id | Yes | Assigned once, never reused |
| Founding event | Yes | Date, original founders, the idea it came from (EE-092: a venture starts as a draft from an idea) |
| Essential why | Yes, by decision | The purpose and core promise. Changing it is either a refounding (a new venture that succeeds this one, recommended) or an amendment (open question) |
| Lineage | Yes | `parent_of`, `successor_of`, `resulted_from`: the events that made this venture from others |
| Name | No | A history of names, each with the dates it was true. The name is not the identity |
| Legal entity | No | A separate identity, linked by roles (below) |

The legal entity is a separate thing with its own identity:

- Its rigid core is its id and its creation event. Legal form, jurisdiction, legal name and status change over time and are stored as dated spans. (A Delaware conversion under DGCL §265 and §266 keeps the same entity while its form changes.)
- It links to the venture by anti-rigid roles: `operated_by`, `holds_ip_for`, `employs_for`, `parent_of`, `successor_of`. The links are many-to-many over time: one entity can operate two ventures, and a venture can move to a new entity.
- Formation and diligence documents are evidence for these records, not identity fields.

Proposed files: `identity/venture.json`, `identity/entities/<id>.json`, `identity/links.json`. The MVP needs only `identity/venture.json`.

### How it works in the code today

There is no `identity/` folder and no identity record type on `main` (checked at `2507d1a`). The parts listed above are spread across four places, mixed with things that are not identity:

| Where | What it holds | Which system it belongs to |
| --- | --- | --- |
| `venture.json` | `id`, `name`, `parent`, `opened` | Identity (id, lineage), except `name`, which should be a dated history |
| `venture.json` `core` | `promise`, `promised_to`, `must_not`, `competence` | `promise` is the essential why (identity). `promised_to` is where (segment). `competence` is how (functions) |
| `venture.json` | `phase`, `industry`, `form`, `ambition`, `departments` | Phase (when), market (where), legal form (legal entity), and departments, which EE-090 made optional |
| `foundation/` | `telos.draft.md`, `problem.json`, `icp/`, `goals/`, `alignment.json` | Mixed. The telos end state is essential why. Goals are contingent why. ICPs are where. The problem is research evidence. Alignment principles are policy |
| `console/lib/identity.ts` | The signed-in person | A different sense of "identity": the authenticated user of the console, not a venture's identity |

So replacing `foundation/` with `identity/` (EE-091) is not a rename. It is a split: only the telos end state and the core promise move into `identity/`. The rest moves to the system it belongs to.

`console/lib/identity.ts` uses "identity" in its security sense. That is a second meaning of the same word in one codebase, which the glossary's scoped meanings must record ("identity@console" against "identity@venture").

### Standards

| Standard | What Naive takes from it |
| --- | --- |
| OntoClean (Guarino and Welty, *Communications of the ACM* 45(2), 2002) | Rigid, anti-rigid, identity criteria, and the constraint that an anti-rigid class cannot contain a rigid one |
| UFO and OntoUML (Guizzardi, 2005) | Kind, role and phase as distinct categories: a role depends on a relation, a phase on the thing's own state |
| ISO/IEC 21838-2:2021, Basic Formal Ontology | The ISO top-level ontology. Naive's identity sits under its continuant category: a thing that persists through time while keeping its identity. I have not read the paywalled text; mapping Naive's kinds to its classes is still to do |
| W3C Organization Ontology (Recommendation, 2014) | `org:Organization` against `org:FormalOrganization` (an organization recognised in law) is the same split as venture against legal entity. `org:ChangeEvent`, with `org:originalOrganization` and `org:resultedFrom`, models lineage. Their property chain implies `prov:wasDerivedFrom`, which ties lineage to provenance |
| FIBO and OMG Commons (EDM Council) | "Legal entity" is a formal organization recognised in some jurisdiction as able to incur liability. Naive's legal entity record should use that definition |
| ISO 17442 (LEI), ISO 20275 (entity legal forms), ISO 3166 (country codes), GLEIF LEI-CDF | Field names and code lists for the legal entity record. LEI-CDF events carry an effective date and a recorded date, which matches Naive's two-times model (R-12) |
| ISO 704 and ISO 1087 | How each term above is defined: a genus, then the characteristics that separate it from its siblings |

### Prior art

- **Separating an organization from its legal entity** is established: W3C ORG (Organization and FormalOrganization) and FIBO (legal entity under formal organization) both do it.
- **Lineage as change events** is established: W3C ORG `ChangeEvent`, and GLEIF's relationship and successor records.
- **Rigid against anti-rigid** for kinds, roles and phases is established: OntoClean, UFO and OntoUML.
- **Not found in this search:** an identity record for a venture that exists *before* any legal entity does, kept as files a solo founder owns, with the essential why as a rigid part of its identity. W3C ORG and FIBO both start from organizations that already exist in law or in an organization chart. This is the part of identity that Naive adds. The claim rests on one round of searching and should be attacked before it goes into anything public.

### Conflicts with `main`

1. **"Who" means two different things.** `purpose/strategic-foundation.json` (EE-051, on `main`) asks "Who do you serve?" and answers with the ICP. R-02 (agreed 10-30, in unmerged PR #125) says "who" is the venture's own identity, and puts customers under "where" (segment and ICP). Zachman's "who" column is people and organizations, which supports R-02. Proposed resolution: R-02 is the model; the strategic foundation is a view for founders whose question "who do you serve?" reads from the where system. The strategic foundation also has a seventh question, "whether", that R-02 does not have; it maps to the contingent why (alignment principles and decision reasons).
2. **`foundation/` against `identity/`.** As shown above, EE-091 is in force but unbuilt, and it is a split, not a rename.
3. **The word "identity" has two meanings** in the codebase (venture and signed-in person).

### What must be built

| Item | Check that proves it |
| --- | --- |
| `schema/identity.schema.json` for `identity/venture.json`: id, founding event, essential why, lineage, name history | Schema check; every venture has exactly one |
| Split `foundation/` by the table above, with a route alias so old paths keep working during `naive upgrade` | `naive check` finds no record left in `foundation/` |
| A rigidity check: a change to a rigid field is refused unless it comes with a refounding decision | Generic test over every identity field; Lean theorem that a rigid property holds in every reachable state |
| Glossary scoped meanings for identity@venture and identity@console | Term engine run (definition tests, cross-run, Lean mirror) |
| Decide the "who" conflict (above) and record it as an EE decision with `affects` | Decision conformance check |

### Sources

- Guarino and Welty, "Evaluating Ontological Decisions with OntoClean", *CACM* 45(2): 61-65, 2002; overview at https://en.wikipedia.org/wiki/OntoClean and https://www.loa.istc.cnr.it/wp-content/uploads/2020/03/OverviewOntoClean-compresso.pdf
- Welty and Andersen, revised rigidity axiom: https://dominoweb.draco.res.ibm.com/reports/rc23754.pdf
- ISO/IEC 21838-2:2021: https://webstore.iec.ch/en/publication/72703
- W3C Organization Ontology: https://www.w3.org/TR/2014/REC-vocab-org-20140116/ ; PROV derivation discussion: https://lists.w3.org/Archives/Public/public-prov-wg/2012Nov/0236.html
- FIBO Legal Persons (archived snapshot): https://akswnc7.informatik.uni-leipzig.de/dstreitmatter/archivo/spec.edmcouncil.org/fibo--ontology--BE--LegalEntities--LegalPersons/2025.08.23-092319/fibo--ontology--BE--LegalEntities--LegalPersons_type=generatedDocu.html
- Identity research, 2026-10-31: https://claude.ai/artifact/6PbSQ93sHw2hKxDJcx5YJH

## 2. Functions and function modules

### What kind of thing it is

A function is a kind of work every venture has, whether or not anyone is doing it yet. A venture with no revenue still has finance; its value is $0. Functions answer "how" at the venture scale (R-02, Zachman remapped: function modules are the how).

In ontology terms a function is a **realizable property of the venture**: it exists while unexercised, and it is realized in activities. Basic Formal Ontology (ISO/IEC 21838-2) draws the same line between a realizable entity (a function or disposition, which its bearer has even when it is not acting) and the process that realizes it. In BFO a function exists because of how its bearer was made or designed. For a venture, that is its design as a venture, so every venture bears all of them. This mapping is proposed and has not been checked against the standard's text.

Against identity (section 1): a function is **rigid** (every venture has finance in every state) but it is **not identity**. Two ventures both have finance; finance does not tell them apart. The function's *state* (its value, its owner, its records) changes; the function does not.

The four tests (R-08, agreed) say when a candidate is a function:

| Test | Means | Fails for |
| --- | --- | --- |
| Total | Defined in every state of every venture; empty is a value | "Fundraising": a bootstrapped venture never has it |
| Rigid | No reachable change makes it undefined | "Discovery work": it ends when the phase ends |
| Independent | Not computed from other functions | "Profitability": finance computes it |
| Activity, not identity | Owns decisions that change hands when the owner changes | "Mission": it is identity, and strategy is the function that maintains it (R-11) |

A **function module** is the code that implements one function (R-05, R-06, agreed). It exports: how to read the function's state (a value, possibly empty), the decision classes it owns, its agenda in each phase, and its checks. `venture.json` declares which functions exist and who owns each; the module holds the behaviour. They reference each other the way `package.json` references code (R-07).

A **department** is not a function. It is an optional grouping of functions that a person adds, the way a team adds a folder (EE-090). A solo venture has all 13 functions and no departments.

### Its parts

The set is fixed at the 13 top-level categories of APQC's Process Classification Framework (EE-047's catalog, kept by EE-090): strategy, products, marketing-and-sales, supply-chain, service-delivery, customer-service, human-capital, it, finance, assets, risk-and-compliance, external-relationships, capabilities. Each is tagged with its place in Porter's value chain (primary or support).

Each function has, per R-06 and R-07:

| Part | Where it lives | Status |
| --- | --- | --- |
| Declaration and owner | `venture.json` `functions.<id>.owner` | Schema exists; owner defaults to the founder (R-10) |
| Function module | `functions/<id>` (R-06 says a file `functions/<id>.ts`; EE-090 says a folder per function) | Not built |
| State reader | Exported by the module | Not built |
| Owned decision classes | Exported by the module | Not built; decisions today are owned by nobody in code |
| Agenda per phase | Exported by the module; a phase sets it (R-13) | Not built; today the per-phase weights are on packages (`base` in each `package.json`) |
| Checks | Exported by the module; one generic test runs the four tests over every module (R-08) | Not built |
| Lean mirror | The four tests as `def`s returning `Prop` (R-09) | Not built; Lean lives in PR #135 |

### How it works in the code today

- `operations/departments.json` is the catalog: 13 entries, each with its APQC category, Porter value-chain place, and governance and operations notes. It is still named "departments" although EE-090 says these are functions.
- `schema/venture.schema.json` has both a `functions` map (owner per function id, EE-071) and a `departments` array (EE-047, superseded). The Everything Ecosystem venture uses the old one: `"departments": ["marketing-and-sales"]` and no `functions`.
- There is no `functions/` folder and no function module anywhere.
- Functions are reached only through packages: each core package names the function it belongs to in its `department` field. Ten core packages cover eight functions (strategy has two, `foundation` and `validation`; finance has two, `finance` and `fund`). Five functions have no package at all: supply-chain, customer-service, it, assets, capabilities. Data packages (`customers`, `deals`, `investors`, `money`) name no owning function, although R-11 says each is owned by one.

So the code treats a function as a label on a package. The agreed design treats it as a module with behaviour, and a package as data that a function owns.

### Standards

| Standard | What Naive takes from it |
| --- | --- |
| APQC Process Classification Framework, cross-industry, version 7.4 (2024) | The 13 Level 1 categories and their ids. The PCF continues down through process group, process, activity and task. APQC calls these *processes*, not functions (see conflicts) |
| Porter, *Competitive Advantage* (1985) | The value-chain tag on each function: primary or support |
| Fayol, *Administration industrielle et générale* (1916) | The claim that some groups of activity are present in every undertaking, whatever its size (his six: technical, commercial, financial, security, accounting, managerial). This is the "always present" property, and the oldest prior art for it |
| ArchiMate 3.2 (The Open Group) | "Business function": behaviour grouped by the resources or competences it needs, more stable than processes or the organization chart. Naive's function is this element |
| TOGAF and BIZBOK (Business Architecture Guild) | "Business capability": what a business is able to do, independent of its organization structure. Close to Naive's function; see conflicts |
| Basic Formal Ontology, ISO/IEC 21838-2:2021 | Realizable entity against its realization in a process: a function exists unexercised |
| ISO/IEC/IEEE 12207 and 15288 | Process, activity, task: the same decomposition MAD uses (R-22). A function module's agenda items should be activities in this sense |
| ISO 9001:2015, clause 4.4 | The process approach: each process has an owner, inputs, outputs and checks. Matches the module's owner, decisions and checks |

### Prior art

- **Functions present in every organization:** Fayol (1916) is the source. APQC's PCF is the modern cross-industry list.
- **Function against organization chart:** ArchiMate and TOGAF separate a business function from the organization units that perform it. Naive's "departments are an optional grouping" is the same separation.
- **Function against capability:** enterprise architecture argues about this. One common reading: a capability is what a business *can* do (its potential), and a function is what it *does* (its activities). Naive's "exists even when empty" sits closer to capability.
- **Not found in this search:** functions as executable modules with machine-checked membership tests (total, rigid, independent, activity not identity) and a proof that phases never add or remove one. APQC, ArchiMate and BIZBOK are reference models for people to read, not code that runs against a venture's records.

### Conflicts with `main` and with agreed decisions

1. **File or folder.** R-06 says `functions/<id>.ts`; EE-090 says one folder per function. Proposed: a folder `functions/<id>/` whose `index.ts` is the function module, so it can also hold the Lean mirror and the function's own README.
2. **"Function" or "process".** APQC's 13 categories are process categories. Naming them functions is our choice (R-05, agreed). It holds under the four tests, but the ontology entry should say we take APQC's *categories*, not its meaning of "process".
3. **"Function" or "capability".** "Capability" is already a glossary term, as a capability of a product (EE-098: precog is a capability). Using BIZBOK's "business capability" for the 13 would clash with that, so "function" stays. The ontology entry should cite the capability debate as a known alternative.
4. **R-11's "research" function.** R-11 says "the validation function is renamed research". There is no validation function in the 13; `validation` is a *package* under strategy. Proposed reading: rename the `validation` package to `research`, owned by strategy (or by capabilities). This needs Torian's confirmation.
5. **Communications.** The meta-schema asks whether publishing should be a 14th function or sit under marketing-and-sales. Open.
6. **`departments.json` and the `departments` field** still exist and are used, against EE-090.

### What must be built

| Item | Check that proves it |
| --- | --- |
| Rename `operations/departments.json` to the function catalog; drop `departments` from the venture schema (keep an alias for one release) | `check-nouns` lists "department" as retired for this meaning |
| `functions/<id>/index.ts` for each of the 13, exporting state, decision classes, agenda per phase and checks | One generic test runs the four tests on every module |
| Every package names its owning function, data packages included | Schema check: no package without a function |
| Every decision record names the function that owns its class | Docket check: no unowned decision |
| Lean: the four tests as `Prop`s, and the theorem that no phase transition adds or removes a function | `lake build` |
| Decide conflicts 1, 4 and 5 and record them with `affects` | Decision conformance check |

### Sources

- APQC PCF cross-industry 7.4: https://www.apqc.org/resource-library/resource-listing/apqc-process-classification-framework-pcf-cross-industry-pdf-12 ; levels: https://www.apqc.org/sites/default/files/files/PCF%20Collateral/Understanding%20the%20PCF%20Elements%20%20-%20FINAL.pdf
- Fayol's six activity groups: https://en.wikipedia.org/wiki/Henri_Fayol ; https://www.ebsco.com/research-starters/history/fayol-publishes-general-and-industrial-management
- Function against capability: https://bizzdesign.com/blog/capabilities-vs-business-functions-same-difference ; https://www.grahamberrisford.com/00EAframeworks/01Fundamentals/Business%20functions%20in%20TOGAF%20and%20ArchiMate.htm
- ISO/IEC 21838-2:2021: https://webstore.iec.ch/en/publication/72703

## 3. Packages

Next.
