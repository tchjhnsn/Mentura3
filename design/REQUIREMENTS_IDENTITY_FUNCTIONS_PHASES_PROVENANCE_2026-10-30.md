---
publish: false
type: design-note
source: hybrid
created: 2026-10-30T22:08:43Z
updated: 2026-10-30T22:47:30Z
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
