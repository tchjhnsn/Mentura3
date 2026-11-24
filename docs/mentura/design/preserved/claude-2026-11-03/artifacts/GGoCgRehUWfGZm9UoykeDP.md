<!-- exported 2026-11-03 from https://claude.ai/artifact/GGoCgRehUWfGZm9UoykeDP (Claude Docs id 7badb584-df9b-44ec-92f3-76630a7570ba) -->
# The venture library and industry graph

Nov 1, 2026 · @Torian

## Short answer

You are describing a **knowledge graph of record**: one store of facts about ventures, products and industries, where every fact has a source and a date, and the links between them (holds, offers, belongs to, depends on) are facts too.

- The **library** (or corpus) is that store. It holds records, not matrices.
- A **matrix**, and a matrix of matrices, is a view computed from the library when asked. It is never stored, so it never goes stale.
- **Industries** are two things laid over the same graph: a classification (which industries a venture belongs to, and how much), and a graph of industries buying from each other. Economists call that second one an input-output table.

In our own words: the library is a **data store**, not a kernel. The rules that prove a venture belongs to an industry are an **engine**. The small shapes everything else trusts (the cell, the reference, the node id) are the **kernel**.

## The parts

The graph has five kinds of thing. The first three are stored; the last two are computed.

| Part | What it is | Example | Stored? |
| --- | --- | --- | --- |
| Node | One thing with an id and a type | `anthropic` (venture), `anthropic.code` (product), `naics:5182` (industry) | Yes |
| Edge | A typed link between two nodes, with a date | `anthropic` holds `anthropic-public-benefit-fund`; `anthropic` belongs to an industry, with a share | Yes, when stated by a source; derived edges are written by a theorem and name it |
| Cell | One value on a node or edge: value or unknown or contested, a reference, evidence, a date | Anthropic revenue H1 2026 = $16,286M, S-1, audited, as of 2026-06-30 | Yes |
| View | Nodes by attributes, read out of the graph | The venture anatomy matrix, the Product Anatomy matrix | No, computed |
| View of views | Views as rows of a bigger view | Every studied venture's anatomy side by side; an industry's ventures by part | No, computed |

The two studies we just ran are already shaped this way: `venture.json` and `products/*.json` are nodes, their cells carry references, and `anatomy.json` is mostly stored facts with a level the checker will recompute.

## Industries

An industry is a group of businesses that make the same kind of thing the same way. A venture belongs to several, in shares, and industries buy from each other in a graph with loops, so there is no single root.

**Membership has a degree.** The standard classifications give each business one code by its main activity. [NAICS](https://en.wikipedia.org/wiki/North_American_Industry_Classification_System) says: "Each establishment is classified as an industry according to the primary business activity taking place there." One code is too coarse for SpaceX (launch, satellite internet, AI) or Anthropic. Anthropic's S-1 cover gives SIC 7372, prepackaged software, which misses most of what the company is. So a venture's membership is a set of edges, each with a share, a basis and a date:

- **share**: the part of the venture in that industry, usually revenue share from segment reporting; `unknown` when not disclosed.
- **basis**: how the share was established (official code, segment revenue, product jobs mapped to the industry's definition).
- **as\_of**: shares move, and classifications are revised (NAICS last in 2022), so both are dated.

**Industries depend on each other.** Leontief's [input-output model](https://en.wikipedia.org/wiki/Input%E2%80%93output_model) records every industry "both as a customer of outputs from other sectors and as a supplier of inputs". Those edges carry a weight (how much of one industry's inputs come from another), and they loop: mining buys machinery from manufacturing, manufacturing buys ore and energy from mining, and both buy services.

**Raw materials is a base, not a root.** The [three-sector model](https://en.wikipedia.org/wiki/Three-sector_model) (Fisher, Clark, Fourastié) calls the primary sector the "extraction of raw materials". That makes it first in distance from nature. It is not a root in our technical sense (a node nothing else feeds). In the input-output graph raw materials are fed by machinery, energy and services. I propose the term **primary industry**, defined as output extracted from nature. "Root" stays reserved for the architecture record, where it means a unique top.

## Proving a venture belongs to an industry

Membership is a theorem like `competes`: `BelongsTo(V, I, share, t)` is established to a stated standard of proof on the evidence, or it stays open. It is never true by assertion. As with the other relationship theorems, the default is `prove@law`.

The theorem needs three premises, and each can fail on its own:

1. **The industry is defined.** `I` is a glossary term with a test: what a member makes and how. A NAICS code gives that test; a made-up label does not.
2. **V does that work.** At least one of V's products has a job and offering that pass `I`'s test. This is the recursion: venture to product to the industry's definition.
3. **The share has a basis.** Segment revenue, an official classification, or a product's revenue share. With no basis the edge exists and its share is `unknown`, not zero.

Strength, weakest first:

| Basis | Example | Ladder level |
| --- | --- | --- |
| The venture says so | "We are a platform company" | 1, stated |
| A product passes the industry's test | Claude Code does software publishing's job | 2, cited |
| An outsider assigned it | SIC code on an SEC filing; a census code | 3 for the code, but the code may still be wrong |
| Audited segment revenue | A 10-K segment note | 3 for the share |

The third row is the trap. An official code is outsider-verified and still can be wrong, as Anthropic's SIC 7372 shows. The theorem keeps the code as evidence, not as the answer.

Shares across a venture's industries add up to at most 1, with any remainder `unknown`. Their total is a check, not a definition.

## Kernel, engine, or neither

The library is neither. It is a data store that our engines write to and read from, resting on a small kernel.

We already define both words (term engine run, 2026-10-31). A **kernel** is a small trusted core that many parts rely on and that relies on nothing inside the system. An **engine** takes rules as input and returns verdicts with reasons. Against those tests:

| Piece | Is it a | Why |
| --- | --- | --- |
| Cell, reference and node-id shapes | Kernel | Every record uses them; they depend on nothing |
| The library | Data store | It holds records; it decides nothing |
| Term engine (glossary) | Engine | Takes a term's tests, returns pass or fail with reasons; it defines what an industry is |
| Relationship theorems | Rules run by an engine | `competes`, `supplies`, `belongs-to`, `depends-on` read records and return established, not-established or open |
| Anatomy checker | Engine | Takes required levels as rules, returns the parts below them |
| Research engine (Mentura) | Engine, confidential | Turns sources into records; the only writer of studies |

&#91;embedded content: library architecture · 1 store, 4 engines, 1 kernel\]

The architecture record we built on 2026-10-31 is the same pattern pointed at our own code: records about systems, views computed from them, terms checked by the engine. The library points it at the world's ventures instead.

## Storing and writing

Keep files in folders under git now, as the two studies already are. Add an index built from them, and a graph database only when queries outgrow the files.

The proposed layout extends today's `research/` folder:

```
research/
  references/<id>.json              each source once
  ventures/<id>/venture.json        node, with its edges (holds, belongs-to)
  ventures/<id>/products/*.json     nodes, with offers edges
  ventures/<id>/anatomy.json        stored facts per part
  industries/<scheme>/<code>.json   industry node: name, test, scheme (naics-2022, ours)
  industries/edges/<from>__<to>.json  depends-on edge with weight, source, as_of
  index.json                        built by a script, never edited; lists every node and edge
```

The writing rules:

1. **One writer per kind.** Studies are written by the research engine (or by hand while it is being built). Derived edges are written only by a theorem and carry its id. Nobody edits `index.json`.
2. **Append, don't overwrite.** A changed fact is a new cell with a new `as_of`; the old one stays. This makes the store bitemporal: when it was true, and when we learned it.
3. **References once.** A source is a reference record, cited by id from every cell that uses it.
4. **Views are never saved as records.** A matrix can be exported as an artifact (a doc, a page); the artifact names the records and the date it was computed from.

Why not a graph database now: two studies and a few dozen industries fit in files, git gives history and review for free, and Grokbot's schemas will validate files. A database earns its place when a question needs many hops across thousands of nodes, for example every venture two industries upstream of Anthropic.

## Glossary run

"Industry" has three senses in common use, and they are not the same thing. The term engine confirmed 28 of 28 predicted relations on the first run (`industry-vocab.ts`, every combination of facts: 512 grouping cases, 96 link cases).

| Term | Meaning | Relation the run confirmed |
| --- | --- | --- |
| industry@naics | Businesses grouped by production activity, one code each | The standard sense; sector, primary and service industries are kinds of it |
| industry@porter | Firms making close substitutes (Porter 1980) | Overlaps industry@naics and market |
| industry@job | Ours (Industry Inc., 2026-10-30): everyone serving one job | Overlaps industry@naics and market |
| market | Buyers and sellers of substitutes; the demand side | Overlaps all three industry senses, equal to none |
| sector | A grouping of industries | Is an industry@naics at a coarser level |
| primary industry | Output extracted from nature | Is an industry; disjoint from service industry |
| belongs-to | A product of V passes I's test | Overlaps classified-as; disjoint from depends-on and supplies |
| classified-as | An outside body assigned V a code | Evidence for belongs-to, not the same: Anthropic's SIC 7372 is classified-as without belongs-to |
| depends-on (industry) | B's output is an input of A; loops allowed | Disjoint from supplies: an industry edge never becomes a venture edge |
| supplies (venture) | B supplies A's inputs (handoff #147) | Disjoint from depends-on |

The Lean mirror (`Industry.lean`) proves the same claims, including that a primary industry inside a loop is not a root. The phases thread built it clean on 2026-11-01 (core Lean, no `sorry`, no axioms, all six theorems check) and recorded the terms as proposed. It joins the other term proofs in everything-ecosystem's `lean/` folder once PR #135 merges.

Not run yet: the full industry list. NAICS 2022 has 20 sectors and about 1,000 industries. I propose importing the scheme as reference data rather than running each as a term: the scheme is the outsider's definition, and only the terms we use in our own words go through the engine.

## Blind spots and open questions

Blind spots:

- **No root.** The industry graph loops, so any "build from the root up" plan has to start from a chosen base, not a true root.
- **Industry is not market.** Who competes with whom is a market question (substitutes for a buyer). Grouping ventures by industry will not find competitors, and the engine now keeps the two apart.
- **Codes lie quietly.** Official codes are outsider-verified and often stale or coarse (Anthropic as prepackaged software). They are evidence, not answers.
- **Shares are rarely public.** For private companies most membership shares will be `unknown`, as OpenAI's revenue by product already is.
- **This is not the MVP.** It serves Mentura's research and the industry map. Architecting it now is cheap; building beyond files and the index should wait for a question that needs it.

Open questions for you:

1. Which scheme anchors industry nodes: NAICS 2022 (free, US, production-based), GICS (investor-facing, licensed), or both, with ours (industry@job) layered on top?
2. Whose library is it? I placed the studies in Mentura's folder because research is Mentura's. Naive would then hold only the schemas and the engines, open to everyone.
3. Should the industry graph's weights come from the BEA input-output tables (public, US only), or start as unweighted edges we add by hand?
