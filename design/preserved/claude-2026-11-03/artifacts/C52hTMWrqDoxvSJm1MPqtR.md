<!-- exported 2026-11-03 from https://claude.ai/artifact/C52hTMWrqDoxvSJm1MPqtR (Claude Docs id 59a48be4-75ce-4ca2-9c07-dff3596d5396) -->
# Architecture record: one golden record for Naive's engineering

Oct 31, 2026 · @Torian · proposed

## Short answer

One record holds every part of the system: kernels, engines, checks, routes, record types, skills, connectors, outside services and npm packages. For each part it holds what it depends on, what it provides, and what tests, models, proofs and docs vouch for it. That record is the golden record for the architecture. Everything else is a view built from it: the dependency map, the statecharts and the design docs.

The record is checked the way glossary terms are. Facts are **derived from the code**: imports, effects, tests, TLA+ models, Lean theorems. They are compared with what the record **declares**, and the same engine runs the tests. So the docs can't drift from the code without a check failing. A part that is only designed has no code yet, but it can still have a statechart that TLC checks and Lean properties that must hold. That lets the architecture be tested before it is built.

I ran a first version on everything-ecosystem. The [dependency map](https://claude.ai/artifact/NNcyZWNPS4dDiuA3akVQZ6) shows what it found. The main finding: 12 of the 39 parts import each other in one knot, so the layers in the layer manifests are not yet layers in the code.

## What already exists

Most of the pieces exist in everything-ecosystem. They just aren't joined into one record:

| Piece | What it holds now | What it lacks |
| --- | --- | --- |
| `*/layer.json` (7 layers) | each layer's records, reads, writes, skills and checks | dependencies between code parts; 236 non-test files belong to no layer |
| `schema/data-model.json` | every record type and who owns it | the code that reads and writes each type |
| `schema/systems-catalog.json` | outside systems a *venture* keeps its truth in (GitHub, Stripe, Rho) | Naive's own outside dependencies |
| `package.json` | npm packages | which part uses which package, and why |
| `schema/check-docs-claims.mjs` | fails a doc that names a command, flag, path or route the code doesn't have | claims about what a part *is* or *depends on* |
| `verification/*/*.tla` | TLA+ models of lints and playbooks, checked by TLC through the pstack statechart skill | a link from each model to the part it models |
| `docs/design/statecharts/` | hand-drawn Mermaid charts read from the code (10 gaps found on 10-29) | a check that they still match |
| `lean/` and `schema/terms/` | the term engine, admission, and proofs | architecture terms (kernel, engine) and graph theorems |

MAD covers the software lifecycle: which methods and templates a project adopts. The architecture record is something MAD's software-engineering layer would ask for, not something MAD already holds.

## Where goals, requirements and constraints fit

They come **before** the architecture and sit **outside** it. The architecture record cites them; it doesn't hold them. ISO 42010 starts an architecture description from stakeholders and their *concerns*, and every element exists to answer some of them. The order follows the usual system design method: requirements first, then estimates, interfaces, data model, high-level design and deep dives.

| Concept | What it is | Standard | Where it lives in Naive |
| --- | --- | --- | --- |
| **Goal** | what we mean to reach, with measures | goal-oriented requirements | `foundation/goals/<id>.json` (exists) |
| **Non-goal** | something we deliberately won't aim for, stated so nobody builds it | design-doc practice (scope) | proposed: a goal with `stance: non-goal` |
| **Functional requirement** | what the system must do | ISO/IEC/IEEE 29148 | `foundation/requirements/<id>.json` (exists; derives from goals) |
| **Quality requirement** (non-functional) | how well: speed, reliability, security, maintainability | ISO/IEC 25010 | same record, with a `quality` field (proposed) |
| **Non-requirement** | explicitly out of scope; MoSCoW's "won't have this time" | MoSCoW | proposed: a requirement with `priority: wont` |
| **Constraint** | a limit on *how*, decided outside the design: law, budget, a fixed technology, a founder rule | 29148 (design constraints) | `foundation/constraints.json` `must_not` (exists) |

**How they meet the architecture record.** Each element names the requirements it `satisfies`, and each architecture decision names the requirements and constraints it answers. Every quality requirement should be checkable. Software architecture calls these checks *fitness functions* (Ford, Parsons and Kua, *Building Evolutionary Architectures*). A4 is one: it checks a maintainability requirement, that layers only depend downward. A requirement with no check, or an element that satisfies nothing, is a finding.

**Why non-goals matter here.** They are your overbuilding rule written down per design. A request that touches a non-goal fails the check, rather than depending on someone remembering the rule.

**The requirement words are now terms.** Goal, non-goal, requirement, functional requirement, quality requirement, non-requirement, constraint and fitness function all ran through the engine, exhaustively over every combination of facts, and are valid tests. All 19 predictions were confirmed on the first run:

- functional and quality requirements are kinds of requirement, and never overlap each other;
- goal and non-goal are disjoint, and so are requirement and non-requirement;
- a constraint **overlaps** a requirement. This matches ISO 29148, which treats design constraints as requirements. Naive still keeps them in separate records;
- a fitness function is a check, not a requirement.

Lean proves that if every element satisfies a requirement and every requirement derives from a goal, every element traces to a goal (`element_traces_to_goal`). It also proves nothing built can serve a non-goal (`nothing_serves_a_nongoal`). Files: `requirements-vocab.ts`, `Trace.lean` (sandbox).

## The vocabulary gate (proposed)

Your instinct is right, with one sharpening: the glossary is the gate on **meaning**. It makes the design and the code use the same words with the same tests. On its own it doesn't prove the code matches the design. The conformance checks do that, and they can only work *because* the words have tests. The gates in order:

| Gate | Question | Passes when | Who or what decides |
| --- | --- | --- | --- |
| **G0 Vocabulary** | Do we mean the same thing? | every noun in a design record is an admitted term or a proper name (Naive, Mentura); every new term has passed the pipeline | the engine; Lean for claims about the terms |
| **G1 Design** | Is the design sound before it's built? | requirements trace to goals; no non-goal is served; designed elements pass A4, A5 and A7 (ranked, kernels are leaves, behaviour modeled in TLA+) | engine, TLC, Lean |
| **G2 Conformance** | Did we build what we designed? | derived facts match declared ones (A2, A3); an element declared an *engine* passes the engine test on its code; docs say what is (A6) | engine over derived facts |
| **G3 Verification** | Does the code do it right? | tests, lints, TLC model checks | test suite |
| **G4 Proof** | Does it hold for every case? | Lean theorems for claims that must never fail | Lean |
| **Validation** | Did we build the right thing? | the goals' measures move | a person, on evidence: no machine passes this |

This is the V-model's split between verification (built it right) and validation (built the right thing). G0 is the rung most methods skip: they assume everyone means the same thing by *component* or *engine*. We just saw on this map that they don't.

**Where it bites, and where it shouldn't.**

- **It blocks a merge into a repo, not thinking.** Sandboxes and drafts can use any word. The gate runs when a record or its code lands, and a noun that isn't admitted fails with "define it or name it".
- **It runs itself.** Admission is automatic (your 21:07Z rule), so the gate costs nothing unless a definition fails its own tests. Then it should block, as it did three times today.
- **It checks records, not prose.** Schemas, the architecture record, requirement records and skill frontmatter are in scope. Free-text explanations are not, or the gate turns into a style police.
- **Proposed versus decided.** A term with status *proposed* passes G0 for drafts, but a record that sets a decision or a gate needs *decided* terms. That keeps you as the owner of meaning without asking you about every word.

**Where it lives.** It's a software-lifecycle gate, so it belongs to MAD's software-engineering area. The checks themselves are Naive code beside the term engine. The venture phase gates (Discovery and the rest) are a different family and stay as they are.

## Linguistic structure in the glossary (proposed)

Your chart maps almost exactly onto what the glossary already does, and on what it's missing:

| Chart level | In the glossary today | Proposed |
| --- | --- | --- |
| Roots, prefixes, suffixes | nothing | each term records its morphology: root, prefix, head |
| Lexical stems | the label and its `form` (word, compound, phrase, idiom) | keep |
| Nouns (arguments) | every term so far is a noun: a test over one thing's facts | keep; the engine's pass sets |
| Verbs (predicates) | missing: *depends on*, *part of*, *satisfies*, *derives from* | verbs are relations between nouns. They get Lean properties instead of pass sets: *part of* is reflexive, transitive and has one root; *depends on* must be acyclic within a layer |
| Syntax tree | schemas are the grammar of records | a record that doesn't parse against its schema fails, as now |
| Semantics | the tests | keep |
| Pragmatics | the conversation and display theorems: who, where, in what frame | name them as the pragmatics layer of meaning |
| Root hash | `freeze` hashes each term on its own | compose hashes over word structure, like a Merkle tree |

**Word structure predicts relations, and the engine confirms it.** I tested three rules from morphology against every term we have:

- **L1:** *non-X* is disjoint from X. Confirmed for non-goal and non-requirement.
- **L2:** *co-X* is a kind of X. Confirmed for co-founder.
- **L3:** in a compound, *A B* is a kind of B. English compounds take their meaning from the right-hand word, and idioms are exempt. Confirmed for functional requirement and quality requirement.

That's 5 of 5 rules holding. These rules become checks, so a term whose definition contradicts its own word structure fails G0.

**Seven compounds have a head that isn't defined.** The heads are *system*, *gate*, *function*, *store*, *employee*, *guardian* and *candour*. Three matter now:

- **system**, because software system, the root of the architecture record, has no defined parent word;
- **gate**, because phase gates and G0 to G4 all rest on it;
- **function**, which collides three ways: a venture function, a code function and a mathematical function.

**Hashes that compose (L4).** If a term's hash covers the hashes of the terms it's built from, then redefining *goal* changes *non-goal*'s hash and marks it stale. The prototype shows that working for non-goal and functional requirement. It's the same idea as the root hash at the top of your chart.

**Root has two senses in your own chart.** The top is a *root hash*, a tree root. Leaf 1A is a *root*, a morpheme. The glossary handles this with two senses under one label, root (tree) and root (morpheme). The engine never reads labels, so the two can't be confused.

## The record

**Name.** The standard term is an **architecture description** (ISO/IEC/IEEE 42010): a record of the system's elements, their relations, and the views drawn from them for the people who care about each concern. "Systems design" stays as the name of the activity and its design docs. I'd call the record the *architecture record* in prose and keep 42010's nouns inside it. External dependencies follow a **software bill of materials** (SBOM), in the CycloneDX format, which `npm sbom` already writes.

**Elements.** One entry per part, with an id, a kind, the files it covers, an owning layer, and a status. Each kind is a glossary term, so it runs through the full pipeline before it is used:

| Kind | Test (proposed) | Status |
| --- | --- | --- |
| kernel | K1 depended on by 3 or more, K2 depends on nothing inside, K3 at most 300 lines, K4 no effects, K5 tested | admitted in the sandbox |
| engine | E1 rules are inputs, E2 returns which rules failed, E3 domain-free, E4 deterministic, E5 tested | admitted in the sandbox |
| check, lint, route, record type, skill, connector, adapter | to define | not yet |
| outside service, npm package | from the SBOM and the systems catalog | not yet |

**Relations.** Each relation is a typed edge: `depends_on`, `provides` (a route or record type), `reads` and `writes` (a record type), `verified_by` (a test), `modeled_by` (a TLA+ model), `proved_by` (a Lean theorem), `documented_by` (a README or doc), and `part_of` (an element inside a larger one).

**Declared versus derived.** Every element and edge has two sources. *Declared* is what a person or the design says should be there. *Derived* is what the code shows, read by a script at a named commit. Nothing derived is ever written into the declared side. The checks compare the two.

**Time.** Status is bitemporal, like the phases: `designed`, `built`, `retired`, each with when it held (valid time) and when it was recorded (transaction time). A designed element can't fail "missing from the code". A built one can.

**One language.** The record's nouns are the glossary's nouns. A doc, README or skill that calls something an engine is making a claim that the engine test checks. So the vocabulary and the architecture are one record, not two.

## Views

Views are artifacts built from the record and rebuilt when it changes. Following your rule that views belong to the platform, each one is either a Mentura view or a visualization skill that a harness runs. None is framework code.

- **Dependency map.** Parts in rank bands, so things others depend on sink to the bottom. Select a part to trace both directions. A first version is [live](https://claude.ai/artifact/NNcyZWNPS4dDiuA3akVQZ6), read straight from the code. Once the record exists, it would show declared and derived side by side, with drift marked.
- **Levels.** The same map at three zoom levels, following the C4 model: the system with its outside services and people; the parts (layers, apps, packages); and the files inside one part.
- **Statecharts.** One per part that has behaviour: a write, a phase change, a release. Each is drawn from its TLA+ model, the way `verification/lint-legal` already does, so the chart and the checked model can't disagree.
- **Glossary view.** Every architecture noun, its test, and every place it is used, from the `used_in` field the glossary already has.

## Testing the architecture, even before it's built

There are three tools, each suited to a different kind of claim:

| Tool | Checks | Runs on |
| --- | --- | --- |
| **Engine checks (TypeScript)** | facts about one part or one edge | derived facts at a commit, and declared facts |
| **TLA+ through the pstack statechart skill** | behaviour: every state a part can reach, and that no rule breaks along the way | a model, which can exist before the code |
| **Lean** | claims that hold for *every* graph or record, not only this one | definitions, with no code needed |

The proposed architecture checks are A1 to A8. Each one fails with the element and the reason:

- **A1 Owned.** Every built file belongs to exactly one element. Today 236 belong to none.
- **A2 Exists.** A declared element with status `built` exists in the code. A `designed` element is allowed to be missing.
- **A3 Edges match.** Every import edge between elements is declared, and every declared edge is in the code. An undeclared dependency is how layers decay.
- **A4 Ranked.** Each layer has a rank, and every edge goes down a rank. Lean proves a ranked graph has no cycle (`ranked_no_cycle`), so A4 failing and a cycle existing are the same finding.
- **A5 Kernels are leaves.** An element declared as a kernel passes the kernel test. Lean proves it then sits in no cycle and its trust depends on nothing else (`leaf_not_in_cycle`, `leaf_reaches_nothing`).
- **A6 Docs say what is.** Every claim a README, doc or skill makes about an element ("X is an engine", "X depends on Y", "X writes Z") must match its derived facts. This extends `check-docs-claims.mjs` from commands and paths to what a part is and does.
- **A7 Modeled.** Every element with behaviour (it writes records, changes state or gates something) has a TLA+ model that TLC passes, or a recorded reason why not.
- **A8 Bill of materials.** Every npm package and outside service is in the SBOM, with its licence and the elements that use it.

**While designing.** A new part starts as a `designed` element with its declared edges, its kind and its TLA+ model. A2 and A3 can't fail yet, but A4, A5 and A7 already can. A design that would add a cycle, or a "kernel" that depends on something, fails before a line of code is written. Once code lands, the derived side fills in and A2, A3 and A6 start checking it.

The Lean file is `/mnt/project-files/naive-design/prototypes/architecture/Architecture.lean` (sandbox, checks clean). It holds four theorems over any dependency relation, using only core Lean.

## First run on everything-ecosystem

This run was at commit `359c454`, using the derived side only. No architecture record exists yet, so I compared the code against the layer manifests.

1. **One knot.** 12 of 39 parts reach each other: `schema/core`, `schema/checks`, `schema/lints`, `schema/migrations`, `interface`, `interface/api`, `interface/mcp`, `knowledge/connectors`, `purpose/frameworks`, `frameworks/telos`, `operations/marketing` and `scripts`. At file level, 15 files form one cycle, running through `interface/router.mjs`, `schema/decisions.mjs`, `schema/freshness.mjs` and `schema/packages.mjs`. A second, smaller cycle is `schema/model-steps.mjs` with `interface/kit-boundary.mjs`. This matters for the stable-Naive goal, because a change anywhere in the knot can reach everything else in it.
2. **Kernels.** Four files pass the kernel test: `schema/terms/engine.ts`, `schema/redact.mjs`, `schema/verify.mjs` and `knowledge/connectors/resolve.mjs`. None sits in a cycle, as the Lean theorem requires.
3. **One engine.** Only the term engine passes E1 to E5. The cross-run predicted that kernel and engine would overlap. On generated cases they do. On the real repo, the one engine is also a kernel.
4. **The busiest file isn't a kernel.** `schema/venture-paths.mjs` is imported by 121 files, but it touches the file system, so it fails K4. That's the right call: it's a hub, not a trusted core.
5. **Ownership.** All 91 checks and skills the manifests list exist. But 236 non-test files are listed by no manifest, so most of the code has no declared home.
6. **Labels.** The crude label check flagged `schema/premise-lint.mjs` as calling itself an engine. The line actually refers to the research engine. Claims need to be stated in the record, not inferred from prose. That's why A6 reads stated claims.

The scripts are at `/mnt/project-files/naive-design/prototypes/architecture/`: `derive.ts` reads the code, `terms.ts` defines and runs kernel and engine, and `Architecture.lean` holds the proofs.

## Where it lives and what's next

**Where.** Each repo keeps its own record in an `architecture/` folder, next to the code it describes, because code is the source of truth and READMEs are already docs-as-code. The schema, the derive step, the checks and the terms live in Naive (everything-ecosystem), so every repo is checked the same way. MAD's software-engineering layer would ask whether a project keeps one. Once the monorepo happens, it becomes one record.

**Next, in order (proposed):**

1. Add kernel and engine to the glossary in the repo (`schema/terms/`), with a `component` level and the Lean file, so they're admitted like the other nine terms.
2. Write the record schema, and a first declared record for everything-ecosystem with about 39 parts, taken from the map and corrected by you.
3. Turn on A1 to A5 in CI as warnings. A4 will fail on the knot until it is untangled.
4. Extend `check-docs-claims.mjs` with A6.
5. Link each existing TLA+ model to its part (A7), and generate the SBOM (A8).

Untangling the knot is engineering work for the stable release. It isn't part of this design. The record would show where to cut: the router and decisions edge is the heaviest.

**Open:**

- *Decided 2026-10-31: the record is the architecture record, using ISO/IEC/IEEE 42010 nouns. "Systems design" names the activity and its docs.*
- How parts are drawn. The map uses folders, with `schema/` split by file name. A declared record lets you draw them by meaning instead.
- Kernel K1's threshold (3 dependents) and K3's (300 lines) are first guesses.
