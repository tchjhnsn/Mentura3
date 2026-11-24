---
publish: false
type: architecture-spec
source: hybrid
created: 2026-10-10
ai-model: claude-opus-5.5
authority: strategic
decision-status: in-force
status: ACTIVE
governed-by:
  - "[[THE_EVERYTHING_ECOSYSTEM]]"
  - "[[DOMAIN_AND_SYSTEMS_DESIGN_METHOD]]"
lineage-from:
  - "[[methodology-family]]"
  - "[[sdd-cousins-pros-cons-api-first-2026-08-11]]"
tags: [everything-ecosystem, domain-design, methodology-catalog, artifact-catalog, adr, bpmn, diagrams, specs-as-source, dd-01, dd-02, dd-03, dd-04, dd-05, dd-12]
description: "First domain design of the Everything Ecosystem: the problem it addresses, its goals and theses, its actors, its language, its conceptual model, its invariants and its capability map. Reframes SAD (the author's practice of spec-driven development) from the methodology into one entry in a catalog of development methodologies, chosen per system, and adds a catalog of the artifact types (documents, diagrams, formats) each methodology requires."
---

# Everything Ecosystem: domain design

Layer: **domain design** (DD). No technology choices are made here. Systems design follows once the model and invariants are ratified (see [[DOMAIN_AND_SYSTEMS_DESIGN_METHOD]] §3).

Drafted from the conversation of 2026-10-10. **Ratified by the owner 2026-10-10 (DD-11).** Items listed as open remain open.

## Core principles

- **P1. The quality of the question determines the quality of the answer.** Every decision in the Ecosystem is reached through stated questions (see Decision questions), and improving the questions is part of the work. A poor answer is first investigated as a poor or missing question.
- **P2. AI assists ideation, not only development.** Before anything is built, the AI system helps the operator express what they know, find what they don't, and see the shape of the domain they want to enter. How the operator's knowledge is captured and grown is a separate domain with its own contract to this one (see [[operator-knowledge-and-world-knowledge-2026-10-10]]).

## DD-01 Problem, goals, non-goals

### Problem

Intent decays. A builder's intent for a portfolio of entities (companies, products, platforms, cities, physical things) is lost across three gaps:

1. **Time.** Decisions are forgotten or silently contradicted by later work.
2. **Entities.** Related entities drift in structure and lose track of their relationships.
3. **Agents.** Much of the work is done by AI sessions that begin without memory and write differently from one another.

A second problem sits inside the first: **one way of building does not fit every system.** Treating every engineering situation the same way wastes effort on some systems and under-governs others. Within one project, different systems call for different development methodologies.

### Goals

- G1. Keep intent coherent and traceable from idea to built thing, across time, entities and agents.
- G2. Give every entity a structure that can be queried: what it is, what stage it's at, what it needs, how it relates to others.
- G3. For each part of a domain or systems design, choose the development methodology that fits it, and record why.
- G4. Accumulate evidence about which methodologies work under which conditions, including AI-assisted conditions.
- G5. Publish the methodology openly, from the Ecosystem level down, as a website and a repository.

### Theses under test

These are claims the Ecosystem exists partly to test. They are not assumed true.

- T1. **Domain-generality.** The same structural questions apply to software, hardware, physical development (buildings, cities) and business development. Test cases: The reference project (software), a city-development venture (cities), the hardware projects. Software-defined engineering in hardware is supporting evidence.
- T2. **Specs-as-source for AI-assisted development.** Is the specification as the source of truth the best approach when AI does most of the building? The expected answer is conditional: best for some kinds of system, not all. The registry and the evidence it gathers are how this gets answered.
- T3. **Ecosystem sovereignty** (from [[THE_EVERYTHING_ECOSYSTEM]]). An ecosystem of independent, mutually reinforcing entities is the ideal constitution for an ambitious mission.

### Non-goals

- N1. Team collaboration features. The Ecosystem serves one person or many in the same way; scale comes from the generic tools it runs on (Obsidian, Git, GitHub), not from the domain.
- N2. Building storage, editing or version control. These are integrated, not built.
- N3. A single mandatory methodology for every system. (This is the change from SAD as *the* methodology.) The whole methodology takes a new name, to be chosen; SAD names only the author's practice of spec-driven development.
- N4. Automating the founder's decisions. Agents recommend; the founder ratifies binding choices.

### Posture

Practised by the owner; published openly on GitHub; a public website is planned. The methodology catalog is therefore a **public, versioned asset**, not internal notes.

## DD-02 Actors and operations

| Actor | Operations |
|---|---|
| **Founder / operator** (one or many) | Captures ideas; ratifies decisions and methodology choices; sets goals; archives |
| **AI agent** (any model, any tool) | Drafts documents; recommends a methodology; builds; verifies; captures sessions. Never ratifies a binding decision |
| **Judge** (TypeSafe or equivalent) | Checks design coverage; scores fit between a system's characteristics and a methodology; produces a recommendation with reasoning |
| **Reader / adopter** (public) | Reads the published methodology and registry; applies it to their own entities; may contribute entries |
| **Entity** (passive) | The thing being built or analysed; carries a profile |

## DD-03 Ubiquitous language (first entries)

| Term | Meaning |
|---|---|
| **Entity** | Anything with a profile, a lifecycle stage and relationships: company, product, platform, city, physical product |
| **Intent** | What the founder means a thing to be and do; the scarce asset the Ecosystem protects |
| **Development domain** | The kind of thing being developed: software, physical, business, … Domains nest (physical → built environment → transit) |
| **Development methodology** | A disciplined way of turning intent into a built thing within a development domain: TDD, spec-as-source, MBSE, … |
| **Methodology family** | A group of methodologies sharing a source-of-truth stance (e.g. spec-driven: spec-first, spec-anchored, spec-as-source) |
| **Source of truth** | The artifact that wins when artifacts disagree: spec, model, test, contract, code, drawing |
| **System** | A unit inside an entity's systems design that a methodology is chosen for. Usually a subsystem; inherits a default from its bounded context |
| **Characteristics** | Properties of a system that bear on methodology choice: requirements stability, cost of error, regulatory exposure, novelty, AI share of work, reversibility |
| **Methodology assignment** | The ratified record that system S is built by methodology M, with reasons |
| **Boundary contract** | What two systems built by different methodologies owe each other where they meet |
| **Evidence** | An observed outcome of an assignment, fed back to the registry |
| **SAD** | The owner's name for his practice of spec-driven development; one entry in the spec-driven family, no longer the umbrella |
| **Methodology catalog** | The published, browsable collection of methodologies, described so one can be chosen. Read to choose |
| **Artifact type** | A kind of document a methodology produces or requires, with its purpose, notation and file formats: ADR, BPMN diagram, C4 diagram, spec, test suite, drawing |
| **Artifact catalog** | The collection of artifact types, cross-referenced to the methodologies that use them |
| **Assignment register** | The authoritative record of which system is built by which methodology. Written to bind; "register" because an entry has standing |

## DD-04 Conceptual model

```
Development domain ──contains──► Development domain        (nests: physical → built environment → plumbing)
        │
        └──has──► Methodology family ──contains──► Methodology
                                                     │  declares: source of truth, assumptions,
                                                     │  fits-when, unfit-when, AI interaction,
                                                     │  informing bodies of knowledge
                                                     │──requires / produces──► Artifact type
                                                     │                          declares: purpose, question it answers,
                                                     │                          notation, file formats, when to use / not,
                                                     │                          alternatives that serve the same purpose
                                                     │
Entity ──has──► Domain design ──bounded contexts──► System ◄──assigned── Methodology assignment
                                                     │                        │ (recommended by judge,
                                                     │                        │  ratified by founder)
                                                     │                        ▼
                                                     └──meets──► System   Evidence ──feeds──► Methodology
                                                           via Boundary contract
```

**Development domains, first cut** (a taxonomy, extended as entities need it):

- **Software** — methodologies: spec-driven (spec-first, spec-anchored/SAD, spec-as-source), test-first (TDD, BDD), contract-first (API-first, consumer-driven contracts), model-driven, iterative/code-first, exploratory prototyping
- **Physical** — hardware (including software-defined engineering), and the built environment (urban planning and city design; buildings; grids; transit; water and plumbing; geography). Candidate methodologies: model-based systems engineering, V-model, set-based design, building-information modelling
- **Business** — venture and business development methodologies (e.g. customer development, lean experimentation)
- **Cross-cutting bodies of knowledge** — not methodologies, but inputs a methodology draws on. Example: behavioural basis of design and personal space (Robert Sommer, *Personal Space*), which informs room size and building intent in the built environment

**Artifact types, first cut.** Grouped by the question they answer, because several notations often serve one purpose and the choice between them is itself a decision.

| Question answered | Artifact types (alternatives) | Typical formats | Domains |
|---|---|---|---|
| Why did we decide this, and what did we give up? | ADR variants: Nygard (context, decision, consequences); MADR (options considered, pros and cons); Y-statements (one sentence); decision log | Markdown | All |
| What happens, in what order, and who does it? | BPMN (business process; executable by process engines, so used in code too); UML activity diagram; flowchart; swimlane diagram | `.bpmn` (XML), Mermaid, SVG | Business, software |
| How do the parts of a system fit together? | C4 (context, container, component, code); UML component and deployment diagrams; arc42 (a full architecture document template); SysML block diagrams (hardware) | Mermaid, Structurizr DSL, PlantUML, `.drawio`, SVG | Software, physical |
| Who talks to whom, when? | UML sequence diagram | Mermaid, PlantUML | Software |
| What states can a thing be in? | State machine diagram (UML, statecharts) | Mermaid, PlantUML, SCXML | All |
| What data exists and how does it relate? | Entity-relationship diagram; UML class diagram; domain model | Mermaid, `.dbml`, SQL | Software, business |
| How does information flow and where is it trusted? | Data-flow diagram (also used for threat modelling) | Mermaid, `.drawio` | Software |
| What is the contract between two parts? | OpenAPI, AsyncAPI, JSON Schema, interface control document (hardware) | YAML, JSON | Software, physical |
| What must be true, checked how? | Specs, BDD scenarios, test suites, verification matrices | Markdown, Gherkin, code | All |
| What does the physical thing look like and fit into? | Drawings, BIM models, site plans, CAD | `.ifc`, `.dwg`, `.step` | Physical |

Text-based notations (Mermaid, PlantUML, Structurizr DSL, BPMN XML) are preferred where they fit, because agents can read, write and diff them, and they live beside the specs. Canvas-drawn diagrams (such as Cursor's canvas) are useful for thinking but should be exported to a text notation if they become part of the record.

**Direction: forward and recovery (ratified 2026-10-12).** Every methodology declares `direction: forward | recovery`. Forward methodologies turn intent into a built thing; recovery methodologies run intent provenance backwards, from a built thing to its behaviour, design and spec (Chikofsky and Cross 1990: redocumentation, design recovery, restructuring, reengineering). Recovery is a direction inside each development domain, not a domain of its own: software (binary and app reverse engineering, API discovery from traffic, distillation), physical (teardown, scanning, as-built surveys), business (competitor teardowns). Recovery produces the artifact types above; each artifact declares `provenance: authored | recovered`, and a recovered artifact carries its evidence and confidence, its claims starting **assumed**. See [[recovery-reverse-engineering-and-distillation-2026-10-12]].

**Rule to keep the taxonomy honest:** a category is added when an entity needs a methodology choice inside it, not ahead of need.

## DD-05 Invariants

- I1. Every binding methodology assignment names a system, a methodology, the characteristics that justified it, and who ratified it.
- I2. An agent or judge may recommend an assignment; only the founder ratifies one.
- I3. Every system has exactly one source of truth at a time. If it changes, that's a recorded switch, not drift.
- I4. Where two systems with different methodologies meet, a boundary contract exists.
- I5. A methodology entry states when *not* to use it. An entry with no unfit-when conditions is incomplete.
- I6. Evidence is recorded against the assignment it came from; registry claims cite evidence or are marked as untested.
- I7. Every methodology and artifact-type choice records the decision questions it answered and which answers were assumed rather than tested. The catalogs guide choice; they do not limit it. A choice outside the catalog is allowed, recorded as a candidate entry, and reviewed for promotion.
- I8. Recency confers no authority (carried over from governance precedence).
- I9. Every recovery records its target, purpose, legal basis and the person who declared them before analysis begins. An agent may prepare an investigation; a person declares purpose and legal basis (ratified 2026-10-12).
- I10. **Recovery timing (ratified 2026-10-12).** Recovery of another party's product (a competitor or incumbent) may begin for a system only after that system's own first-principles design is set: domain design (DD-04 to DD-06), and, where the system has users, its experience design (users and jobs, journeys, objects, states). Before then, competitor recovery anchors the design to the competitor's choices and defects. Once the gate is met, recovery tests and challenges the design; it doesn't seed it. Recovery of one's own systems, and reading a government's or customer's own published records or data for import, are exempt. A founder may lift the gate for one named recovery, recorded with the reason.

## DD-06 Lifecycles

**Catalog entry** (methodology or artifact type):
`candidate` (used once outside the catalog, I7) → `listed` (answers recorded, all assumed) → `evidenced` (at least one assignment has recorded outcomes) → `deprecated` (evidence or practice shows it no longer fits; kept, never deleted). Any state → `re-check` when K1 says the entry is stale; it returns to its prior state with the research recorded.

**Methodology assignment:**
`proposed` (recommended by agent or judge) → `ratified` (founder) → `in force` → either `switched` (a new assignment supersedes it, citing the switch condition, M10) or `retired` (the system is retired). An assignment is never edited after ratification; changes are new assignments (I3).

**Evidence:** `recorded` against an assignment → `reviewed` (changes, or confirms, a catalog answer from assumed to tested). Evidence is append-only.

**Decision question:** `in use` → `refined` (rewritten when a poor answer is traced to it, P1) or `added`. Questions are versioned so old answers can be read against the question as it was asked.

## DD-09 Worked example

The first assignment in [[METHODOLOGY_ASSIGNMENT_REGISTER]] (a software system with a statutory-clock component; the record itself is private) is the first worked example: the decision questions answered with tested and assumed marks, options considered, the methodology chosen, artifact types chosen against A1–A8, and the evidence to record. Ratified 2026-10-10.

**Acceptance test for the domain (DD-10), proposed:** the model holds if (1) the first assignment plus one assignment in a non-software domain (a built-environment or hardware project) can be recorded without new concepts; and (2) evidence from the first assignment can change a catalog answer from assumed to tested.

**DD-10 result (2026-10-11): passed.**
1. **Non-software assignment, no new concepts.** The second assignment (residential building design for a development venture; `physical/built-environment/buildings`; the record itself is private) was recorded using only existing concepts: development domain, candidate methodologies (BIM, set-based design), a body of knowledge (Sommer, *Personal Space*) and a new **candidate** artifact type (space programme, I7). The tool needed one fix that the model already implied: `recommend` now considers only methodologies in the system's development domain, so it no longer ranks software methods for a building. All five physical entries are unresearched candidates, and the tool says so (K3). It is `proposed`; the venture is at `concept`, so ratification waits for research.
2. **Evidence moves an answer.** The first assignment's first evidence (2026-10-11) moved spec-as-source M2 and TDD M5 from assumed to tested.

## DD-12 Capability map (first cut)

| Category (by job) | Sort | Note |
|---|---|---|
| Entity structure and profiling | Core | |
| Intent provenance (idea → decision → spec → built thing) | Core | |
| Context continuity across agents and sessions | Core | |
| **Methodology catalog and selection** | **Core** | New; absorbs SAD's former umbrella role |
| Artifact catalog (document types, notations, formats) | Supporting | Extends the existing design-documents registry |
| Evidence and research on methodology fit (T2) | Core | Where the original research contribution lives |
| Design coverage and diagnostics | Supporting | Existing checker |
| Recovery (reverse engineering and distillation) | Supporting | Added 2026-10-12. Tooling is Generic (integrate REA and the engines it drives); recovered artifact → spec candidate, linked into intent provenance, is Core. Skill: `recover` |
| Idea capture, triage and routing | Supporting | |
| Publication (website, repository) | Supporting | |
| Fit judging | Generic | Integrate TypeSafe |
| Storage, editing, version control, collaboration | Generic | Obsidian, Git, GitHub |

## Decision questions

The catalogs' main job is to make sure the right questions are asked before a choice, not to list every option. Each question is answered for the system or artifact at hand, and each answer is marked **tested** (backed by evidence or research) or **assumed**.

### Choosing a methodology for a system

- M1. **Source of truth.** Which artifact should win when artifacts disagree, and who or what changes it?
- M2. **Knowability.** Can correct behaviour be stated before building, or only discovered by building? (Exploratory work favours code-first or prototyping; knowable work favours spec- or test-first.)
- M3. **Requirements stability.** How often will intent change, and is the change driven by learning or by outside rules?
- M4. **Cost of being wrong and reversibility.** What happens if it's built wrong, and how hard is it to undo?
- M5. **Verifiability.** How will we know it's correct: test, proof, inspection, measurement, use?
- M6. **Accountability.** Must intent be provable later to a regulator, auditor, client or public?
- M7. **Builder.** Who or what does the building (human, agent, contractor, machine), and what inputs can that builder reliably use?
- M8. **Lifespan.** How long will this system live and be maintained?
- M9. **Neighbours.** What does it meet, which methodologies do those neighbours use, and what boundary contract is needed?
- M10. **Switch conditions.** What would make us change methodology (for example, a prototype becoming binding)?
- M11. **Evidence.** Have we used this methodology on a similar system, and what happened?

### Choosing an artifact type

- A1. **Question.** What question must this artifact answer?
- A2. **Reader.** Who reads it: a person, an agent, a machine that executes it, an outside party (regulator, contractor, investor)?
- A3. **Use.** Will it be executed, checked automatically, or only read?
- A4. **Duplication.** Does an existing artifact already answer this question? If so, extend that one.
- A5. **Upkeep.** How long must it stay true, who keeps it current, and what does it cost when it goes stale?
- A6. **Convention.** Does the domain or audience expect a standard notation?
- A7. **Fidelity.** What is the cheapest form that answers the question well enough?
- A8. **Format.** Must it be diffed and versioned beside the work? (Favours text notations.)

### Questions about the catalogs themselves

- K1. When was this entry last checked against current practice, and what would trigger a re-check?
- K2. Is a candidate a new artifact type or methodology, or a variant of an existing one?
- K3. Which entries rest mostly on assumed answers, and are any of them used where the cost of error is high?

### When to research before choosing

Research first when an answer is **assumed** and the cost of error (M4) is high, when the choice is hard to reverse, or when K1 says the entry is stale. The research result is recorded as evidence and may correct the catalog entry.

## Decisions taken 2026-10-10 (pending ratification)

- **One catalog** with nested development-domain fields, not a catalog per domain.
- **Characteristics:** extend the [[ASSET_REQUIREMENTS_METHOD]] characteristics (C-*) rather than define a separate set.
- **Survey of existing answers to T2** (Spec Kit, Kiro, Tessl, academic work) runs in parallel with ratification.
- **ADR variant:** MADR for the Ecosystem's own decisions, because it records the options rejected.
- **Naming:** the whole methodology takes a new name (open). SAD remains the name of the author's spec-driven development practice. Collections: **methodology catalog** and **artifact catalog** (read to choose); **assignment register** (binding record). The existing `design-documents.registry.json` keeps its name for now.

## Open questions

- Q5. The new name for the whole methodology.
