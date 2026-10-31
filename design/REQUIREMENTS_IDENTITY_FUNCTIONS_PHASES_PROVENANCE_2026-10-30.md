---
publish: false
type: design-note
source: hybrid
created: 2026-10-30T22:08:43Z
updated: 2026-10-31T03:30:00Z
ai-model: claude-opus-5.5
authority: implementation
status: DRAFT
tags: [everything-ecosystem, naive, mad, requirements, system-design, identity, functions, phases, provenance]
description: "System design requirements from the 2026-10-30 discussion of identity, functions, phases and provenance. Each requirement says whether Torian agreed it or it is still proposed. The discussion doc: https://claude.ai/artifact/QEkh15Up6HGcS5HaXmy4Zq"
---

# Requirements: identity, functions, phases and provenance

These are the system design requirements from the discussion of 2026-10-30 (discussion doc: https://claude.ai/artifact/QEkh15Up6HGcS5HaXmy4Zq). Every requirement serves the current goal: a stable Naive MVP that Torian can use every day. Each has a status:

- **agreed**: Torian agreed to it, on a decision card or in his own words.
- **proposed**: recommended and awaiting his answer. Not to be built until agreed. (On 2026-10-30 22:46Z Torian agreed every recommendation then open.)

Nothing here is built yet. When a requirement is built, its `verified_by` names the check or proof.

## The model

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-01 | Naive models a venture by six questions asked at two scales: of the venture as it stands, and of every record or decision as made. The record-scale answers are provenance. Prior art: Zachman (1987) for the venture; W7 (Ram and Liu, 2009) and W3C PROV for records. | agreed 22:04Z | person (design review) |
| R-02 | Who is the venture's identity. What is its packages (records and data). How is its functions. When is its phase. Where is its markets, geography, jurisdiction and channels. Why is split into the essential why (purpose, core promise; part of identity) and the contingent why (goals, exit criteria, decision reasons). | agreed 22:04Z | person |
| R-03 | Identity, functions and phases are distinct kinds. Identity and functions are rigid (true in every state); a phase is anti-rigid (true for a time). Test: if the venture can stop being X and remain the same venture, X is a phase; if not, X is a function or part of identity. | agreed 22:04Z | Lean proof (R-09) |
| R-04 | The venture, its founders and every other person are separate identities. They are linked by roles (founder, owner, function owner, employee, investor), which are anti-rigid and relational. The why of a role assignment (for example a hire) lives in that assignment's provenance. | agreed 22:04Z | check (schema) |

## Functions

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-05 | "Function" stays the name of the concept (standard term: Fayol, APQC, EOS). The code file that implements one is a "function module". | agreed 22:04Z | `schema/check-nouns.mjs` |
| R-06 | Each function is a code module (`functions/<id>.ts`) that exports: how to read its state (a value, which may be null), the decision classes it owns, its agenda per phase, and its checks. | agreed 22:04Z | check |
| R-07 | `venture.json` declares which functions exist and who owns each (EE-086 stands). The function module holds behavior and checks. They reference each other the way `package.json` references code. | agreed 22:08Z ("Awesome") | check |
| R-08 | A candidate is a function only if it passes four tests: total (defined in every state; null is a value), rigid (no reachable change makes it undefined), independent (not computed from other functions), and activity not identity (it owns decisions that change with an owner). One generic test runs all four on every function module. | agreed 22:04Z | check (generic test) |
| R-09 | The four tests and the phase partition are stated and proved in Lean against a shared venture model: a `structure`, tests as `def`s returning `Prop`, no Mathlib. | agreed 22:04Z | Lean (`lake build`) |
| R-10 | Every venture declares every function from day one, owner defaulting to the founder, with a state that may be null. Records still arrive only when needed (EE-048). Need-now priors mean attention, not existence. | agreed 22:46Z | check |
| R-11 | Function list: the "validation" function is renamed "research"; foundation is identity, not a function, and strategy is the function that maintains it; customers, investors and money are data packages owned by a function. | agreed 22:46Z | check |

## Phases

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-12 | Phase history is bitemporal: each phase span records valid_from, valid_to (when it was true) and recorded_at (when the records said so), with evidence and the person. It is append-only, so a late correction never rewrites history. | agreed 22:04Z | check |
| R-13 | A phase never adds or removes a function; it sets each function's agenda. A phase's exit criteria are the union of its column in the function-by-phase matrix, and each criterion belongs to one function. | agreed 22:04Z | check |
| R-14 | Product development is a function in every phase, not a phase. "Idea" becomes the first sub-phase of Discovery; no phase is added. | agreed 22:46Z | person |
| R-15 | Each phase has ordered sub-phases that mark progress and never gate; only the phase gate blocks moving on. Discovery and Validation first. | agreed 22:46Z | check |

## Storage and retrieval

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-16 | Identity is stored as JSON records in `identity/` (inside `knowledge/`), replacing `foundation/`. `venture.json` stays the manifest. A temporary alias keeps old paths working during `naive upgrade`. | agreed 22:05Z (card) | check |
| R-17 | Records hold current state only. Provenance lives in the separate, append-only, hash-chained `provenance.jsonl` (EE-031), each line pointing at a record by id plus the sha256 of the version it describes. Records never embed their own history. | agreed 22:04Z (card) | `schema/check-provenance.mjs` |
| R-18 | Why is stored as reasons with citations inside decision records, frozen with hashes when a decision is approved (already built). Approved decision versions are immutable events, so their own provenance fields are allowed. | agreed 22:04Z | `schema/check-reasons.mjs` |
| R-19 | Retrieval goes through a generated index (JSON or SQLite), rebuilt on every change, never edited, and rebuildable from the files. It answers why-questions, bitemporal questions and where-used questions by following links in both directions. | agreed 22:04Z | check |

## MAD and the product function

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-20 | MAD is a method router for the software development life cycle, including its governance layer: it picks and tailors the methods for how software is built (its four layers: governance, delivery, software engineering, automation). It works with or without a venture. | agreed 22:30Z | person |
| R-21 | The product function asks the six questions of each product: whether and why to build it (tied to the venture's essential why), what to build, when (roadmap and phase), who builds it, and how. It determines the product type, and for software it hands the how to MAD. Other product types plug in their own method package the same way. | agreed 22:30Z | check |
| R-22 | MAD's modules follow ISO/IEC/IEEE 12207 and 15288: process, then activity, then task. Proposed top-level modules: requirements, system design (architecture and design definition), implementation, integration (build), verification (testing), transition (deploy), validation, operation, maintenance. Testing and deploying are siblings of implementation, not children. Each module has conventions (file type, location, checks); this file is the first input to the system design module. | agreed 22:46Z | person |
| R-23 | The product function has an owning role. Who decides who builds is a decision right held by that role and delegable downward (for example CTO to product manager), recorded with delegation and decision-rights records and their provenance. A solo founder holds every role by default; with agents, one agent may hold several roles. | agreed 22:30Z | check |
| R-24 | Role names follow standard usage: a CPO or head of product owns what, whether and why; a CTO owns how and technology. In a small venture one person or agent may hold both, which is recorded, not renamed. | agreed 22:46Z | `schema/check-nouns.mjs` |
| R-25 | The "who builds" answer resolves through an agent router: role, then delegation, then an assignee (a person or an agent), chosen by capability. Build stacks such as pstack are executors the router can choose, not part of MAD's method. | agreed 22:46Z | check |

## Knowledge of the SDLC in Naive

Torian, 2026-10-30 22:46Z: the process, activity and task structure of the SDLC belongs in the knowledge base, so Naive can project the decisions it implies. The knowledge base does not need to know how implementation, integration, verification and testing are actually carried out.

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-26 | Naive's knowledge base holds the SDLC catalog: its processes, activities and tasks (after ISO/IEC/IEEE 12207), with the decisions each one needs, the phase it is needed in, and the role that owns it. This is knowledge Naive reads to project decisions; it holds no execution detail. | agreed 22:46Z | check (schema) |
| R-27 | MAD owns the how: for each process it routes and tailors the methods and templates (R-20). It reads Naive's catalog and writes back the method chosen, as a decision record with provenance. | agreed 22:46Z | check |
| R-28 | Execution belongs to executors (pstack, Claude Code, Cursor, a person), chosen by the agent router (R-25). Naive and MAD never contain an executor; they hand off a task and receive evidence. | agreed 22:46Z | `schema/check-boundary.mjs` |
| R-29 | The Naive and MAD interface is a contract, not shared code: Naive gives MAD the product, its type, its phase and the open decisions; MAD returns chosen methods, the resulting task plan and the evidence from execution. Its exact shape is decided in the MAD maturity thread. | proposed | person |

## MVP cut: the judgment layer

On 2026-10-30 23:50Z Torian chose the judgment layer as the anchor for the Naive MVP (industry map: https://claude.ai/artifact/KeKBoHoaX8cUa3ubqKSxT8). In: venture records (identity, problem, evidence, decisions), a `naive next` decision docket with premise attack, `naive check` gating commitments (charge, raise) on the evidence ladder, and an export any agent can read. Out: the console, connectors, agents doing work, meeting intelligence, and templates beyond Discovery and Validation.

Against that anchor, each requirement above is in, partly in, or architected only (agreed, but not built for the MVP).

| Requirement | MVP | Why |
| --- | --- | --- |
| R-01 to R-03 (six questions, two scales, rigid vs anti-rigid) | Architected only | They govern the design; nothing to build |
| R-04 (people, roles) | Architected only | One founder holds every role in the MVP |
| R-05 to R-09 (function modules, four tests, Lean) | Architected only | Not needed to record or check a judgment |
| R-10 (every function declared, null-able) | In, declaration only | Each decision needs an owning function; a one-line declaration is cheap |
| R-11 (function list cleanup) | In | The export fixes vocabulary for other agents; rename before it ships, not after |
| R-12 (bitemporal phase log) | Architected only | The existing single-event phase change is enough for two phases |
| R-13 (exit criteria per function) | Architected only | Gates in the MVP are the evidence ladder (R-31) |
| R-14 (Idea as Discovery's first sub-phase) | In, as vocabulary only | Discovery is in scope; no code beyond the phase description |
| R-15 (sub-phase markers) | Architected only | `naive next` orders by decision, not by sub-phase |
| R-16 (`identity/` replaces `foundation/`) | In | Identity is one of the four MVP record kinds |
| R-17, R-18 (separate provenance; reasons with citations) | In (already built) | A judgment is only trustworthy with its who, when and why |
| R-19 (generated index) | Partly in, as the export (R-32) | The export is the first generated, read-only view |
| R-20 to R-29 (MAD, product function, roles, router, SDLC catalog) | Architected only | Agents doing work and engineering methods are out of the MVP |

New requirements the anchor adds:

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-30 | `naive next` shows the decision docket: open decisions for the current phase, ordered by what blocks what, each run through premise attack (who asked, what evidence, does it hold if false) before it is shown. Builds on the decision index and `naive lint premises`. | agreed 23:50Z | check (docket tests) |
| R-31 | `naive check` refuses a commitment (charge, raise) until the evidence ladder supports it: demonstrated or inferred evidence for each assumption, and agent-drafted claims count as missing until a person confirms them. Builds on `schema/assess-problem.mjs`. | agreed 23:50Z | check (BDD scenarios) |
| R-32 | `naive export` writes one generated, read-only file any agent can read: identity, problem, evidence, decisions with reasons and citations, and provenance pointers. It is never edited and is rebuilt from the records. | agreed 23:50Z | check (schema + rebuild test) |

## Research, references and industry matrices

Torian, 2026-10-31 03:20Z. "Directed" means Torian asked for it in his own words; "proposed" means my recommendation, awaiting his answer. None of these is in the MVP cut above, which stays as it is; R-34 and R-38 are the closest candidates because they protect the evidence `naive check` relies on.

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-33 | Every research run records how it was conducted: the question or claim it started from, the queries and prompts sent, the sources searched, the agent and model, and when. That record is provenance (R-17), so research findings trace to how they were found. | directed | check |
| R-34 | A reference is a link plus a note, never a copy and never a source of truth. It records why it is cited (the claim it supports). Full copies follow the raw rules already agreed (EE-070): `raw/sources/<id>/source.json` and `text.md` in git, originals private. Raw is a folder, not a file. | directed (raw layout already agreed) | check |
| R-35 | A reference lint checks that each link resolves and that the page still says what the reference cites it for. A mismatch is reported, never silently fixed. | directed | check (lint suite) |
| R-36 | Each reference carries a weight that is dynamic: foundational impact and current relevance are separate scores, so a pivotal but superseded paper keeps its history and loses current weight. Weight sets how much is stored: high weight and hard to regenerate keeps more. | directed | check |
| R-37 | Whether a reference is outdated is a judgment, not a rule. A model may propose it; a person can always review it. Freshness profiles (`schema/freshness.mjs`) supply the timing. | directed | person |
| R-38 | A trust setting says how much the founder relies on the model's judgment versus their own, set per module and per kind of judgment, defaulting to "a person confirms". | directed | check |
| R-39 | Industry matrices: design the architecture and schema of one industry matrix first; only then pick industries and decide whether matrices form a directory of modules. | directed | person |
| R-40 | People served (user types, consumer types, segments) are separate entities, not fields of a venture or a matrix. They nest: a type has sub-types (founder, then kinds of founder, then further kinds). Ventures and matrices reference them by id. | directed | check |
| R-41 | Segment types use a standard concept scheme (W3C SKOS: concepts with broader and narrower links, a definition and its evidence) rather than a new format. A definition is a claim backed by evidence of usage, open to premise attack; a dictionary is a reference, not the truth. | proposed | check |
| R-42 | A venture-type module (for example an AI lab inside Mentura) is a package with activation criteria: the phase or conditions under which each part of it begins. Parts can start early as substrate, so the whole department exists by the phase it is needed. This extends need-now priors and the agreed rule that a founder may turn on a later phase's packages early (EE-070). | directed | check |
| R-43 | A venture-type module also gives research its structure: research agents (arXiv, X via Grok and others) file what they find under that module's folders, as references with provenance (R-33, R-34). | directed | check |

## Licensing, access and hosting

Torian, 2026-10-31 05:30Z to 05:35Z, on decision cards and in the thread. None of these changes the MVP cut; R-44 and R-45 change how the MVP reaches people.

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-44 | Naive is closed, not open source. The Discovery module is the free part, offered through the waitlist. No new versions are published to npm; `naive-framework` and `create-venture` 0.6.0 stay MIT for anyone who has them, since that cannot be withdrawn. | decided 05:30Z | person |
| R-45 | Naive's docs and templates sit behind the waitlist, not on the public marketing site. Public pages that already carry them are gated or removed. | decided 05:31Z | person |
| R-46 | Founder website hosting is a Mentura service after the MVP, architected only. Cursor's Origin hosts code, not websites, so it is not the hosting partner. When built, start on a deploy platform's multi-tenant API, with storage behind one interface so own object storage plus Neon can replace it later. | proposed | person |

## Publishing destinations and the gate

Torian, 2026-10-31 06:00Z. Architected only; posting by agents is out of the MVP. Builds on the publication gate (EE-025), which exists.

| Id | Requirement | Status | Verified by |
| --- | --- | --- | --- |
| R-47 | The publish router starts with a destination module, which answers whether a site or handle is somewhere the founder or a venture publishes, and returns its owner (founder or venture), channel and policy. It computes this from the publication policies and the founder module's accounts; there is no separate index, and any list of sites is a generated view. | directed | check |
| R-48 | The founder has publishing channels of their own, under the same policy schema as a venture's, so personal publications pass the same gate. | proposed | check (schema) |
| R-49 | Everything published passes one gate, as a pipeline: input, route (R-47), lens (one version per destination from one record), verify (publish lint, brand, channel and platform checks, with every failure reported and nothing silently fixed), approve (a person, under public-commitment), output (manifest, rollback). Each stage is its own module. | directed | check (pipeline tests) |
| R-50 | Modules exist without agents. A public relations agent is a role that uses the destination module and the gate; the modules behave the same whether a person, an agent or no agent runs them. | directed | `schema/check-boundary.mjs` |
| R-51 | Publishability is a true-or-false property every published part must prove: each fetched field is `public` or an approved `variant` (field visibility, sha256-pinned, approved by a person), and each written part carries provenance. No proof, not publishable. | directed 06:13Z | check |
| R-52 | Drafts are JSON (Portable Text proposed): a list of parts, each either fetched (a record field plus its sha256, such as the mission) or written (prose with provenance). Identity content is always fetched, never retyped by an agent or a person. | directed 06:13Z | check (schema) |
| R-53 | Agent-written prose carries: author (agent, model and version, or person), role and gate position, time, inputs read by id and sha256, instructions by hash, each rejection and fix, human edits, and whether the channel needs an AI-generated label. | proposed | check (schema) |
| R-54 | Gates run in a fixed order (revised 06:30Z, see R-58): intake (file type, schema, reduced to the core), publishable, rhetorical structure, brand lexicon, prose (grammar, sentence rules, punctuation, then unified), claims and safety (the publish lint), compile (JSON to MDX or the channel's format, then tested), approve and publish. A gate is code, not an agent; it returns pass, or fail with errors or proof. A failed draft is corrected and resubmitted until every gate passes. | directed 06:13Z | check (pipeline tests) |
| R-55 | Gates hold no rules. Structure frameworks (for example a three-point essay), prose styles, brand rules (nouns, imperatives, one CTA at the end) and channel formats are modules given to the gate and customizable per venture, as Vale styles are given to Vale. | directed 06:13Z | check |
| R-56 | Every published file carries a certificate (an attestation per gate, as in in-toto): draft hash, each gate run with module, version, verdict and output hash, and the approver, logged in provenance. A published MDX file without a certificate matching its hash is refused, so only the compiler writes MDX. | directed 06:13Z | check |
| R-57 | An agent's position in the pipeline sets the one file type it may write: the drafter writes draft JSON, a fixer answers a rejection with a revised draft; no agent writes compiled output or approves. | directed 06:13Z | `schema/check-boundary.mjs` |
| R-58 | The pipeline is additive, after the standard NLG pipeline (Reiter and Dale, 2000): intake reduces a draft to its core (themes, ideas, claims, ethos, fetched references); then each gate adds one layer and lints it: rhetorical structure (document planning), brand lexicon (lexical choice), then grammar, sentence rules and punctuation (surface realisation). No layer appears before its gate. Drafters write the core as JSON; prose at intake is reduced by a model's proposal that a check confirms. | directed 06:30Z | check (pipeline tests) |
| R-59 | Prose is checked by one linter per concern (grammar, sentence rules, punctuation), then a unified prose gate re-runs every earlier check on the finished text, so the sum equals the parts. | directed 06:30Z | check |
| R-60 | The structure gate is the rhetorical structure gate (after Rhetorical Structure Theory, Mann and Thompson, 1988); the modules it runs are writing frameworks (AIDA, PAS, three-point essay, the rhetorical appeals). | proposed | `schema/check-nouns.mjs` |
| R-61 | Constraints are modules in a library, grouped by the layer they touch (characters, word form, syllables, parts of speech, lexicon, rhetorical structure), including Oulipo constraints. Each module passes an admission gate (schema, passing and failing examples, declared layer) before it can be selected, and a compatibility check refuses a selection whose modules contradict on a layer, naming the conflict. Rhetorical fit beyond structure is model advice, never the verdict. | directed 06:30Z | check |
