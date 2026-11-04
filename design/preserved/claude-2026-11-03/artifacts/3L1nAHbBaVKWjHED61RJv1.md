<!-- exported 2026-11-03 from https://claude.ai/artifact/3L1nAHbBaVKWjHED61RJv1 (Claude Docs id 12d9e387-f247-4ffc-9ea5-be6c093036c6) -->
# What kind of AI system we are building

Nov 1, 2026 · @Torian

## Short answer

We are building a **records-first system**: a neuro-symbolic system in which only the symbolic part (records, theorems, code) decides what is true, and models read sources and propose.

- "Symbolic design" is not the standard term. The field says **symbolic AI**, or a **symbolic representation**: meaning held in human-readable symbols. Our nodes, edges and cells are symbolic.
- Language models are **neural** (also called connectionist or subsymbolic): meaning held in learned weights.
- A system with both parts is **neuro-symbolic**. That is the established category we belong to. "Records-first" names the rule that makes ours specific: the neural part never writes truth on its own.

TypeSafe gives developers a clear category for a *model*: a System One model, for code to call. Ours is a category for a *system*, and a System One model is one of the parts it can use. A line in their style could be **"records, not recall"**: what counts is what the records say, not what a model remembers. That is a candidate, not a decision.

## The glossary run

Six terms, run through the term engine over every combination of seven facts (`approach-vocab.ts`). All 16 predicted relations held on the first run.

| Term | Meaning | Relation confirmed |
| --- | --- | --- |
| symbolic | Meaning in human-readable symbols (records, rules, types, logic); no learned part | Disjoint from neural and neuro-symbolic |
| neural | Meaning in learned weights; no human-readable part carries it | System One and assistant models are kinds of it |
| neuro-symbolic | Both parts working together | Records-first is a kind of it |
| System One model | TypeSafe: code is the consumer; typed decisions; calibrated probabilities | Is neural; disjoint from assistant model |
| assistant model | A chat model trained to reply helpfully to people | Is neural; disjoint from System One |
| records-first system | Ours: neuro-symbolic, and only the symbolic part decides | Is neuro-symbolic; disjoint from System One |

On examples: Jev is a System One model, a chat app is an assistant model, Lean is symbolic, and Naive with Mentura is records-first. An app that lets a chatbot write its database directly is neuro-symbolic but **not** records-first. That boundary is the point of the term. "Symbolic design" is recorded as a usage note pointing to *symbolic*. The Lean mirror (`Approach.lean`, four theorems) builds clean (all four theorems check).

## TypeSafe compared with us

TypeSafe builds a kind of model; we build a kind of system that can use their model. Their own words: AI as "a primitive that any programmer can invoke for semantic judgement and decisions", while code keeps "exact computation" ([manifesto](https://typesafe.ai/manifesto)).

|  | TypeSafe (Jev) | Naive + Mentura |
| --- | --- | --- |
| What it is | A model | A system: records, theorems, code, and models as parts |
| Category | System One model (neural) | Records-first (neuro-symbolic) |
| Who consumes the output | Code | People and agents, through records and views |
| Output | Typed decision with a calibrated probability | A record: a cell with value, source, evidence and date |
| What counts as true | Not its job; code decides | Only records that pass checks |
| Slogan | "prod, not God" | Candidate: "records, not recall" |
| How we relate | Supplier | Uses System One calls for routing, yes/no checks and scores (agreed 2026-10-28) |

Their category helps you because it says what the thing is *for*, in one line. Ours should do the same: a place where a venture's truth is kept, checked and proved, with models doing the reading.

## Master architecture

The industry has this, under standard names. I recommend we keep one, as a knowledge graph of record about our own systems.

| Industry term | What it is | Ours today |
| --- | --- | --- |
| Architecture description (ISO/IEC/IEEE 42010) | The document of one system's architecture, made of views | **Architecture record**, decided 2026-10-31; draft for Naive with C4 levels |
| Enterprise architecture | The practice of describing all of an organisation's structures and how they fit | Not named yet |
| Architecture repository (TOGAF) | The store holding every architecture description, the metamodel, standards and a governance log | What you are calling the master architecture |

So the master architecture is the **architecture repository**: one architecture record per system (Naive, Mentura, MAD, Polity, Vir), plus the links between them, plus the vocabulary they all use.

It earns its place as a record type for three reasons:

- It answers questions no single repo can: what depends on what across all ventures, and what breaks if one part changes.
- It is the same shape as the venture library (nodes, edges, cells, views computed), so it reuses the kernel and the engines.
- The dependency map you called your favourite artifact (2026-10-31) is a view of it.

I'd keep the standard name rather than "master architecture", following our rule of using standard nouns.

## The edge between symbolic design and the architecture

The edge is one field and one rule in every architecture record.

- **Field:** each component carries `approach: symbolic | neural | neuro-symbolic`, using the terms above. Claude, Grok and Jev are neural. The records store, schemas, theorems, term engine and Lean are symbolic.
- **Rule (records-first):** no neural component has a write edge to a record store except through a symbolic check. The architecture repository can test this as a check over its own graph, the same way it already finds import cycles.

&#91;embedded content: records-first flow · neural proposes, symbolic decides\]

This already matches a rule in polity-os: "Code decides; models only classify inputs." Records-first is that rule made general and checkable across every venture.

## Open questions and sources

For you:

1. Is "records-first" the right name for our category, and do you want a line in TypeSafe's style? "Records, not recall" is my candidate.
2. Should we call the master architecture the **architecture repository** (TOGAF's word), or keep a name of our own?
3. You said we will build a language model in time. Under this design it would be one more neural part that proposes, never one that decides. Is that the intent?

The term run is in `naive-design/prototypes/architecture/`: `approach-vocab.ts` and `Approach.lean`. The phases thread built the Lean clean (four theorems, no sorry) and recorded the six terms as proposed, with "symbolic design" as a usage note for *symbolic*.

Sources: [TypeSafe manifesto](https://typesafe.ai/manifesto); [Latent Space interview with Diogo Almeida on Jev](https://latent.space/p/jev/); [Symbolic AI (Wikipedia)](https://en.wikipedia.org/wiki/Symbolic_artificial_intelligence); [Neurosymbolic AI: Why, What, and How](https://arxiv.org/abs/2305.00813); [Enterprise architecture and ISO/IEC/IEEE 42010 (Wikipedia)](https://en.wikipedia.org/wiki/Enterprise_architecture). The TOGAF architecture repository is cited from secondary summaries; the Open Group text sits behind a sign-in.
