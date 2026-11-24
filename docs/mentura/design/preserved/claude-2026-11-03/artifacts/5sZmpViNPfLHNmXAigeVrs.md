<!-- exported 2026-11-03 from https://claude.ai/artifact/5sZmpViNPfLHNmXAigeVrs (Claude Docs id 2773f0a7-a6cf-4274-be00-e05ae0acb054) -->
# Venture comparison pipeline: plan

Nov 1, 2026 · @Torian

## The answer

You're right that last round produced views, not records. The fix is a pipeline that describes every venture with one record schema, ours and others alike, through the research pipeline already specified (R-63 to R-65). Matrices, similarity scores and competitor or partner verdicts are then computed from those records. Artifacts are rendered last.

I read your "three separate record types" as:

1. **Venture record:** a venture described on the six questions and 13 functions.
2. **Product anatomy record:** one per product.
3. **Venture anatomy record:** one per venture, part by part.

A fourth, the **relationship record**, is derived and never typed by hand. It says whether two ventures, products or features are competitors, partners and so on, and which theorem proved it.

Most of the machinery exists. What's missing is four definitions (venture, matrix, competitor, partner), a schema that lets a studied venture use the same records as our own, and relationship theorems.

**Decisions for you:**

- Is my reading of the three record types right?
- Should I build one thin slice now (Cursor against Naive, records through verdict), or keep it architected until the Naive MVP ships?

Decided 02:49Z: architect only, no comparisons. Comparisons are derived once venture anatomy records exist.

## What already exists

None of this starts from zero. The pieces below are specified or built, and the plan reuses each one.

| Piece | Where | What it gives this pipeline |
| --- | --- | --- |
| Six questions at two scales (R-01, R-02) | Requirements doc, 2026-10-30 | The axes of a venture record: who, what, how, when, where, why |
| 13 functions, total and rigid (R-05 to R-11) | Requirements doc; EE-090 | A venture anatomy row per function, null allowed |
| Axes, not types; parent, sibling and child levels | Venture meta-schema §2, §3 | Comparable fields; ventures holding ventures (SpaceX holds SpaceX SI, which holds Cursor) |
| Research pipeline: fetch, define, run, verify, compile (R-63 to R-65) | Requirements doc; meta-schema §8 | How every external fact enters a record, with provenance |
| Goal-directed questions: state the theorem, derive the open obligations | &Truth research doc; decided 2026-10-30 | Where research questions come from |
| References: link plus note, never a copy (R-34, R-35) | Requirements doc | Every cell cites its source |
| People served as separate entities; markets, segments, ICPs (R-40, R-66, R-67) | Requirements doc | Who a venture serves, comparable by id |
| Industry matrices (R-39): design one before picking industries | Requirements doc | The same instruction, now made concrete |
| Product Anatomy Matrix: questions, phases, runner, two record types | everything-ecosystem `purpose/frameworks/product-anatomy` | Product anatomy records already exist as `anatomy-input` and `anatomy-answers` |
| Term engine: definitions tested, cross-run, proved in Lean | `naive-design/prototypes/architecture` | Definitions for venture, matrix, competitor and partner |
| S-1 terms checked against ours | `S1.lean`, `s1-vocab.ts` | Model, harness and platform already reconciled |

## Terms to define

You're right that "venture" is underdefined. The glossary entry reads "anything a builder undertakes, from a hobby to a company. Ventures can hold ventures", which has no conditions a record could fail. "Matrix", "competitor" and "partner" have no entries at all. Below are proposed definitions, each anchored to a standard source. All of them go through the term engine before use.

| Term | Proposed meaning | Standard it leans on |
| --- | --- | --- |
| venture | An undertaking with its own identity (founders, essential why), one core promise, and all 13 functions (null allowed). It may hold ventures. | Our R-02, R-03, R-08; the VAM finding of one core per venture |
| group (or holding) | A venture that holds ventures with different cores, with its own control, capital and related-party parts | IFRS 10 "group"; open from the last round |
| matrix | A set of records arranged as items by attributes: every cell is a typed value with its evidence and as-of date | Mathematics: an m-by-n array; ours adds evidence per cell |
| decision matrix | A matrix whose attributes are weighted criteria, used to rank items | Pugh (1981) |
| similarity matrix | Items by the same items, each cell a distance or similarity between two rows | Statistics; Gower (1971) for mixed data types |
| vector | One row of a matrix read as an ordered list of values; a venture's row is its feature vector | Linear algebra |
| embedding | A vector a model computes from text or data, where distance tracks meaning; single dimensions mean nothing on their own | Machine learning usage |
| competitor | B competes with A, for a customer and job, when that customer values A less because B is available: they substitute | Brandenburger and Nalebuff, Co-opetition (1996); the SSNIP substitution test in the US Horizontal Merger Guidelines |
| complementor | B complements A when the customer values A more because B is available | Brandenburger and Nalebuff (1996) |
| partner | A complementor, supplier or channel with whom an agreement exists. Partnership is a fact about a contract, not a feature overlap. | Common business usage |
| supplier, customer, channel | B supplies A's inputs; buys A's output; or brings A's customers (R-68) | Porter (1980); our R-68 |

Two consequences matter for the design:

- Competitor and complementor are defined by the customer's valuation, not by how alike two products look. Similarity can nominate a competitor, but it cannot prove one.
- One pair can hold several relations at once. Cursor can complement Naive (Naive runs inside it) and compete with it on one feature. Brandenburger and Nalebuff call this co-opetition, so verdicts are per level and per job, never one label per pair.

## Architecture

Every comparison starts from a claim and ends in a relationship record that names the theorem that proved it. The highlighted boxes are the records; everything else is code or a view.

&#91;embedded content: venture comparison pipeline · claim to artifact\]

When a theorem can't be discharged, its unmet premises become the next research questions. This is the goal-directed loop decided on 2026-10-30, now aimed at ventures.

**The records.** Each one is a file in a venture folder, valid against a schema, with every cell carrying a value, a reference id, an evidence label (demonstrated, inferred or assumed) and an as-of date.

| Record | One per | Holds | Status today |
| --- | --- | --- | --- |
| Venture record | venture (ours or studied) | identity, the six questions, the 13 functions as values or null, level (parent, children), markets and people served by id | `venture.json` exists for our ventures; studied ventures have nothing |
| Product anatomy record | product | the product card (job, market, offering, technology, model) plus the seven judgments | exists as `anatomy-input` and `anatomy-answers`, but the card fields are optional |
| Venture anatomy record | venture | each part (S-1 sections, 13 rows) at its evidence-ladder level, with the phase it must reach | designed last round, not built |
| Relationship record (derived) | pair of nodes at one level | relation, job and customer it holds for, theorem id, evidence, as-of | new |

**Studied ventures live in our folders, not theirs.** A study is `research/ventures/<id>/` under the venture doing the studying, with the same schemas. Cells we can't observe are `unknown`, which is a different value from `null`, meaning the function doesn't exist. Without that distinction, a private company looks smaller than a public one.

**Matrices are computed, never stored.** A comparison matrix is a query over records at one as-of date. A similarity matrix uses Gower distance over the typed fields, and skips cells marked `unknown`. Embeddings of descriptions are computed beside it and used only to nominate pairs worth testing.

**Relationship theorems are code, mirrored in Lean.** Example: `Competes(A, B, job, segment, t)` holds when both serve the segment at t, both do the job, and there is substitution evidence from the customer side (switching, side-by-side evaluation, or the customer naming both). The first two come from records. The third is the open obligation research usually has to fill.

**Artifacts last.** Per venture: one matrix per function, identity and axis. Across ventures: comparison tables, a similarity map and a value net. Each names the record ids and hashes it was built from.

## Recursion: venture, product, feature

The same records and theorems apply at every level of the tree: group, venture, product, feature, and also function. Two ventures are then compared node by node, not as wholes.

1. **Levels are one tree.** A feature is a child of a product, a product a child of a venture, a venture possibly a child of a group. The meta-schema's parent and child links already cover the top. Products and features need the same `parent` field.
2. **Each level answers the same six questions.** A feature has a job, a user, a phase and so on, so the theorems need no rewrite per level.
3. **Relations don't inherit.** Cursor's Plan mode might compete with a Naive feature while the two ventures complement each other. A record states its level, and nothing at one level is derived from another.
4. **Descend only where it pays.** Comparing every feature of every venture blows up combinatorially. Descend into a pair only when the level above is similar enough, or when an open decision names it.
5. **Functions are a second axis, not a level.** Every node from venture down is owned by a function. Comparing "Cursor's marketing" with "Naive's marketing" is a slice by function across the tree, and most of it will be `unknown` for private companies.

## Gaps in the Product Anatomy Matrix

Your suspicion holds. The matrix scores products before it establishes what they are. The AI-lab runs I did an hour ago show it: each product had a name, an audience and a description, and nothing else, yet it got seven scores.

| Gap | Evidence | Fix |
| --- | --- | --- |
| A product is scored before it is defined | `product.schema.json` requires only id, name and description. Job, market, offering and features are optional. | State the theorem "product P is defined". Its obligations are the card fields; scoring is refused until they're discharged or marked `unknown` with a reason. |
| The seven questions are a fixed list, not derived | `questions.json` is hand-written | Keep the list, but each question must name the role rule or must-hold it serves. A question that serves none is dropped, and a rule with no question gets one. |
| Two questions are about the market, not the product | Job intensity and revenue describe the customer and the market | Read them from the market and people-served records (R-40, R-66), so two products for the same segment can't disagree |
| Answers carry no evidence | `answers.reasoned.json` holds bare numbers | Each answer gets a reference id, an evidence label and an as-of date, like every other cell |
| Spillover counts edges | Anthropic's Platform won flagship on edge count alone | Weight flows by what they carry, and test that the role result is stable when one edge is removed |
| One core per venture | SpaceX failed last round | Resolve with the group term above |
| Substrate must be a sold product | Compute (Stargate, Anthropic's pool) can't be named | Allow an internal product with `offered_to: none` |
| Scores are one model's draft | No Jev key in the cloud | Cross-run (two scorers, report disagreement), as the term engine already does |

## First case: SpaceX SI and Cursor

Your correction checks out, with one caveat. SpaceX acquired xAI on 2 February 2026. The division was renamed SpaceXAI by July, and Musk announced the SpaceXSI name on 4 October. SpaceX signed to buy Anysphere, Cursor's maker, on 16 June 2026 for about $60B in stock. Coverage says closing was expected in Q3 2026 pending regulators. I haven't confirmed that it closed, or whether Cursor reports inside the SI segment or as a separate SpaceX subsidiary. The fetch stage settles both before any record is written.

**The tree to record** (products are what the fetch stage must confirm, not a final list):

| Node | Level | Parent | Products to confirm |
| --- | --- | --- | --- |
| SpaceX | group | none | (Space and Connectivity are out of scope) |
| SpaceX SI (formerly xAI) | venture | SpaceX | Grok app, Grok in X, Grok API, image and video generation, Grokipedia, Grok in Tesla vehicles |
| Cursor (Anysphere) | venture | SpaceX, or SpaceX SI: to confirm | the editor, its agent, background or cloud agents, code review (Bugbot), Cursor's own models, the CLI |

**Claims to test first**, each a theorem with obligations:

1. **Cursor complements Naive** for a founder building software. Naive's records are read by agents inside agent harnesses, and Cursor is one (our glossary already lists it). The obligation is evidence that a Naive user gets more from Cursor with Naive than without.
2. **Cursor competes with Naive at feature level** on project memory and planning (rules files, plans). This needs a feature-level record on both sides and customer-side substitution evidence. It may well fail.
3. **Cursor and Naive don't compete at venture level.** Different jobs: writing code versus running a venture. This is the expected result, and the one to check most carefully.
4. **Being owned by SpaceX changes the partner question.** A partnership with Cursor is now a partnership with a SpaceX subsidiary. That's a fact for the relationship record, not a verdict.

The same records then let us place Cursor against Claude Code and Codex. All three are agent harnesses, and the earlier lab files already hold two of them.

**Correction (Torian, 02:55Z): Cursor and Grok are suppliers.** We use them to build every product, so on the value net they are suppliers first. "Dependency" is the engineering word for the same fact, as in an SBOM. A supplier can still compete at feature level, and supply power is a risk factor in its own right (Porter). So the relationship record holds supplier at venture level and leaves feature-level competition as an open claim, never the default.

## Blind spots I found

You asked me to look rather than assume. These are the places where the reasoning in your message, or in my last round, would give a wrong answer.

1. **"Prove a competitor" can only be proved relative to the evidence.** Competition is a fact about customers' choices. The theorem can show "B meets the competitor definition given these records", and the records can be wrong or stale. Verdicts need the &Truth caveat: they follow from the evidence rules, and a new source can overturn them.
2. **Closeness in a matrix is not competition.** Two ventures can sit side by side in a similarity matrix or an embedding space and serve different customers, or sit far apart and substitute for each other. Cursor and a staffing agency are far apart, yet both answer "get code written". Similarity nominates; substitution evidence decides.
3. **Unknown is not null.** We see a filer's internals and almost nothing of a private company's functions. Score unknown as zero and every private company looks weaker than a public one, so most per-function matrices for studied ventures will be sparse.
4. **Comparisons need one as-of date.** Ventures change monthly; this year alone xAI was merged, renamed twice and bought Cursor. Comparing our venture today with a record from March compares two different moments, so every matrix is a query at a date.
5. **Recursion grows fast.** Twenty ventures with ten products of ten features each makes about 40,000 feature pairs per pair of ventures. Descend only where the level above or an open decision justifies it.
6. **Embeddings drift.** A new embedding model moves every distance, so embeddings belong in provenance (model, version) and never in a verdict.
7. **This is not the MVP.** The Naive MVP is the judgment layer for three client ventures. This pipeline is Mentura's research engine and the Discovery service, which is confidential. Your own rule says architect it unless it serves the current phase. The thin slice below is the most I'd build now, and it's justified only because Discovery clients will ask who their competitors are.
8. **Studying other ventures needs a source policy.** Filings, the companies' own pages and reputable press are fine. Scraped personal data is not, matching the LinkedIn rule already in place.

## What it means to prove

"Prove" has at least three standard senses, and only one gives certainty. The glossary should hold all three, scoped, with Naive defaulting to "establish to a stated standard" for anything about the world.

| Sense | Meaning | Certainty | Where it applies in Naive |
| --- | --- | --- | --- |
| prove@math | Derive a statement from axioms and definitions by valid inference | Certain, relative to the axioms | Lean proofs: definitions, invariants, gate logic |
| prove@law | Meet a standard of proof: preponderance, clear and convincing, beyond reasonable doubt | Defeasible; the standard is chosen first | Claims about the world: competitor, market size, a risk factor |
| prove@science | Never strictly; a hypothesis is corroborated by surviving tests that could have refuted it | Provisional (Popper) | Validation experiments, interview evidence |
| verify | Check that a thing meets its specification | As strong as the spec | Code checks, `naive check` |
| validate | Check that the specification meets the real need | Judgment plus evidence | Phase gates, customer evidence |

The verify and validate split is IEEE 1012's verification and validation. So "prove Cursor is a competitor" becomes "establish Competes(Cursor, Naive, job, segment, date) to the standard set for that decision". The proof that the inference is valid is mathematical; whether the premises are true is held to a legal-style standard. The phases thread owns the term engine, so I'm sending these senses there to run.

**Engine results (02:55Z, `proof-vocab.ts` 30/30, `conversation-vocab.ts` 13/13, Proof.lean and Conversation.lean clean):**

- prove@math is disjoint from prove@law and prove@science, and prove@naive equals prove@law.
- Verify and validate overlap.
- Your "theorem" (a rule a program checks) only overlaps the math sense. The engine refuted our first draft, which assumed every theorem is machine-checked.
- function@math is disjoint from the business function; ours is a kind of business function.
- "Competitor" is a role a player holds for a given sense and job, never a kind of company; one player can be competitor, complementor and customer at once. A substitute is disjoint from competitor@market.
- Suite is a kind of the industry's suite, disjoint from folder and from workspace.
- Conversation terms:
  - receipt is a kind of citation, disjoint from sealed excerpt;
  - triage is a kind of routing, and only overlaps medical triage;
  - subject is disjoint from title;
  - our "workspace" only overlaps \~/workspace and a Claude project.
- The public list for Grok is `naive-design/term-harvest/TERM_LIST_2026-11-01.json`: 199 terms, 36 run so far.

## Term relevance and the term-harvest skill

The skill finds candidate terms, ranks them by a relevance rule that code can check, and sends the top ones through the term engine. The founder confirms. This is §23's "vocabularies proved as they arise" with an ordering added, so the engine works on the terms that matter first.

**The relevance theorem (proposed).** Term t is *high relevance* in scope S (a venture, or a founder) when it is load-bearing and either salient or contested:

```latex
\mathrm{High}(t,S) \iff \mathrm{Load}(t,S) \land \big(\mathrm{Salient}(t,S) \lor \mathrm{Contested}(t,S)\big)
```

- **Load:** t appears in a record, a gate, a decision or a published claim in S, or an admitted definition depends on it. This is decidable from the files.
- **Salient:** t is used in S's conversations and records far more than in a general reference corpus. That's keyness from corpus linguistics (Dunning's log-likelihood, 1993), computable with a threshold.
- **Contested:** t has more than one sense in S's parent scopes (§25 sense entropy above a threshold). "Model", "function" and "platform" all qualify.

A term that is salient but carries no load is just vocabulary. One that carries load but is neither salient nor contested is safe to inherit. Founder relevance is the same rule with the founder's own conversations as the corpus.

**The skill's steps.**

1. **Harvest:** run on a scope's records and conversations, and on the founder's for founder scope.
2. **Score:** compute load, keyness and contest for each candidate.
3. **Rank:** order by the relevance rule.
4. **Admit:** send the top-ranked terms to the engine (definition tests, cross-run, Lean).
5. **Confirm:** the founder confirms on the docket.

Any model, Grok included, can do the harvesting and the first-draft definitions. Only the kernel admits a term.

**Seed list, by subject.** These are already in use across the threads, and the first harvest should confirm them.

| Subject | Terms |
| --- | --- |
| Proof and logic | theorem, lemma, proposition, axiom, definition, proof, prove (three senses), verify, validate, invariant, predicate, obligation, certificate, kernel, sound, complete, consistent, decidable, induction |
| Science and evidence | claim, hypothesis, conjecture, evidence, standard of proof, corroborate, falsifiable, defeasible, provenance |
| Mathematics | formula, equation, function (collides with business function), relation, set, graph, tree, DAG, matrix, vector, embedding, metric, distance, similarity, probability, entropy, weight, score |
| Comparison | competitor, complementor, partner, supplier, customer, channel, substitute, co-opetition, value net, market, segment |
| Structure | venture, group or holding, function, phase, identity, record, artifact, scope, sense, overlay, register |

**A caution on handing the list to Grok.** A public seed list like the one above is fine to send to any model. The founder glossary and anything about Mentura's research engine are not, because Grok belongs to SpaceX, which now owns Cursor, a venture we plan to study. Treat Grok as an untrusted proposer (§24), never as the checker. I also can't reach Grok from here; there is no connector for it.

## Founder glossary

A founder's glossary is a scope of its own: a sandbox beside the library chain, not a link in it. It lives in the founder suite at `founders/<handle>/glossary/`, which already exists as a folder above ventures.

- **Sandboxed.** Its senses and overlays never change any venture's vocabulary or the library (§24's P24, extended to founder scope). Nothing leaves it unless the founder promotes a term into a venture, which is a recorded decision.
- **Pragmatics are first-class.** Each entry maps the founder's word to a concept and records how they use it: their register, typical contexts and example utterances (conversation input hashes). "Theorem" in Torian's speech often means "a checkable rule", not a mathematical theorem, and the glossary can say so without correcting him.
- **Semantic differences are recorded, never errors.** When the founder's sense differs from the venture's or the library's, the entry stores the divergence (§25). The engine then translates in both directions: the founder speaks their way, records use the admitted sense.
- **Relevance uses the founder's corpus.** The relevance rule above runs on the founder's own conversations, so the glossary fills with what they actually say.
- **Private by default.** It follows the founder suite's disclosure tiers. A founder's idiolect can reveal their thesis, so it is never sent to an outside model.

## Conversations belong to the workspace

This changes one line of the meta-schema. §9 captures a conversation as a raw record but leaves its home unstated. Torian's rule makes it explicit.

- **A conversation is captured once, at workspace scope:** `workspace/conversations/<id>/`.
- **Ventures and the founder suite receive it.** Triage routes each input line to a founder, a venture or a function as a child record whose provenance cites the conversation. No venture owns the thread itself.
- **One conversation can feed several suites,** as this thread feeds the founder glossary, Naive and Mentura's research engine. That's why it can't belong to any one of them.

On naming: "suite" already names the founder suite and the venture suite, and the folders are its encoding. I'd keep "suite" for the concept and "folder" for where it sits, and run "suite" through the engine. I've asked for a separate thread for the conversation design, as you suggested.

### The rule, stated so it can be checked

A conversation's owner is the workspace it happened in. A suite (founder or venture) never owns a conversation; it holds receipts, which are references to routed lines. Four checks follow from that, all runnable over the records:

1. **No suite holds conversation text.** Nothing under `founders/` or `ventures/` contains an input line's text, only its conversation id and line hash. Text lives once, in the workspace (the once-per-scope reference rule, §19).
2. **Every receipt resolves.** Each receipt's conversation id and hash exist in `workspace/conversations/`, and the hash matches.
3. **Every line is accounted for.** A conversation is `triaged` only when each line is routed, dismissed with a reason, or open on the docket (§9's rule, unchanged).
4. **No founder-to-venture leak.** A line routed only to a founder suite reaches a venture only through a recorded promotion decision, the same gate as the founder glossary.

### Layout

```
workspace/
  conversations/<conv-id>/
    conversation.json     # id, source, participants, started, ended, storage, consent
    inputs.jsonl          # one line per message, verbatim or redacted, sha256
    routing.jsonl         # append-only triage log, one entry per routing act
  founders/<handle>/      # founder suite: receives
  ventures/<venture-id>/  # venture suite: receives
```

The one change to §9 is the path, from `raw/conversations/<id>/` to `workspace/conversations/<id>/`. §21 Q4's storage tiers (local by default, redacted text in git, third-party verbatim kept private, Mentura storage only with every person's consent) apply unchanged, now at workspace scope.

### Triage by subject

A routing entry says where one line goes and why:

```json
{ "line": "sha256:…", "subject": "founder glossary",
  "to": ["founders/torian/glossary", "ventures/naive/functions/product"],
  "proposed_by": "agent", "confirmed_by": "per_…", "at": "2026-11-01T02:49Z" }
```

- **Subject first, destination second.** Triage tags each line with one or more subjects, then maps subjects to destinations. A thread's title is not its subject; one thread, like the 02:49Z message, carries five.
- **One line, many destinations.** A line can land in a founder suite, a venture, one function inside a venture, or the workspace itself when it is a rule about how all work is done.
- **Agents propose, people confirm.** An agent's routing counts as unrouted until the owner confirms it, matching the rule that agent-drafted fields count as missing (§9) and that owners are always people.
- **Re-routing is an event, never an edit.** Moving a line appends a new entry that supersedes the old one, so the log stays append-only.

### What each reader can see

A suite sees its receipts and the lines they point to, not the whole thread. A co-founder of a venture sees every line routed to that venture; they do not see the founder-suite lines from the same conversation. The conversation's own disclosure tier is the strictest consent among its participants.

### When a venture leaves the workspace

This is the case that tests the rule. If a venture is sold, spun out or moved, its provenance still cites conversations that stay behind. On export, the venture takes a sealed excerpt: the lines routed to it, their hashes and the routing entries, nothing else. Its citations keep resolving and the rest of the conversation stays in the workspace. Without this, workspace ownership would break provenance on the first exit.

### This project is already the first workspace

This Claude project behaves this way today. The project chat and its threads happen once, and their results go to Naive, Mentura, the founder suite and the vault. The design is the record shape for what already happens, so Mentura can capture a Claude project as a workspace with one importer.

### Terms and open points

- **Terms for the engine:** workspace, receipt, triage, subject and sealed excerpt, alongside "suite". "Workspace" already has other senses here (the `~/workspace/` folder under G-025, a Claude project, a person's library in §19's table), so it will need a sense of its own.
- **One person or a team?** I've drafted a workspace that can hold several people, each with their own founder suite, because shared ventures need shared conversations. This is proposed, not decided.
- **Two workspaces in one conversation**, such as a call between founders on different accounts: each workspace captures its own copy, and matching hashes link them. Not yet designed further.
- **Meta-schema edits when built:** §9's path, §21 Q4 restated at workspace scope, and §19's "Workspace / founder" row split into two scopes.

## Plan

The work runs in this order. Each step is gated on the one before, and all of it is architected only (decided 02:49Z). Step 4 and any comparison wait until venture anatomy records exist. The term-harvest skill, the relevance rule, the founder glossary scope and the "prove" senses join step 1.

1. **Definitions through the term engine:** venture (tightened), group or holding, matrix, decision matrix, similarity matrix, vector, embedding, competitor, complementor, partner, supplier, customer, channel. Done when each passes its tests and cross-run, and the relation terms have Lean statements.
2. **Schemas:**
   - Add `parent` to products and features.
   - Add an `unknown` value with a reason to every cell.
   - Add per-cell evidence (reference id, label, as-of) to anatomy answers.
   - Create `relationship.schema.json` and the `research/ventures/<id>/` study layout.
   - Register all of it in `data-model.json`.
3. **Relationship theorems in code and Lean:** Competes, Complements, Supplies, Channels, each stated at one level, job, segment and date. Done when the generic test proves no relation is inherited across levels.
4. **Thin slice:** Cursor and Naive, through the research pipeline. That means fetch with complete enumeration, define the four claims above, run, verify references, then write records and relationship records, and render one comparison artifact. Done when every cell traces to a reference and every verdict names its theorem.
5. **Product Anatomy fixes:** the "product is defined" gate; questions tied to rules; market questions read from market records; evidence per answer; weighted spillover. Then re-run the five lab and xAI files as regression cases.
6. **Venture anatomy runner:** the 13-part, evidence-ladder design from last round, as a runner beside `anatomy.mjs`.
7. **Similarity and embeddings:** Gower over typed fields, embeddings to nominate pairs, and the descend-only-where-it-pays rule.
8. **Industry matrix (R-39):** ventures by parts, as a query over studies. Only after 1 to 7.

**What changes in existing pieces:**

- The AI-lab files from the last round become studies under the new layout, not product-anatomy examples. The draft files are staged, not committed, so nothing needs undoing.
- The Venture Anatomy Matrix doc's part list becomes the venture anatomy record's schema.
- The SEC filing skill writes its findings as references feeding these records, not as prose.
- R-39 and R-43 are re-pointed at this plan.

## Sources

- [SpaceX to acquire Cursor maker Anysphere, $60B all-stock (Nasdaq/RTT)](https://nasdaq.com/articles/spacex-buy-cursor-maker-anysphere-60-bln-all-stock-deal) and [TechRepublic](https://techrepublic.com/article/news-spacex-cursor-acquisition/) (search results, not opened)
- [Musk: SpaceXAI will be renamed SpaceXSI (Not a Tesla App)](https://www.notateslaapp.com/news/4770/musk-spacexai-will-be-renamed-spacexsi-dropping-ai) (search result, not opened)
- Brandenburger and Nalebuff, *Co-opetition* (1996); US DOJ and FTC, Merger Guidelines (SSNIP test); Gower, "A general coefficient of similarity" (1971); Pugh (1981)
- Internal: Requirements doc R-01 to R-68 (`naive-design/REQUIREMENTS_IDENTITY_FUNCTIONS_PHASES_PROVENANCE_2026-10-30.md`); venture meta-schema §2, §3, §8; [AI labs on the anatomy matrix](https://claude.ai/artifact/B5jooKPEzoS8E3CmAReqkK)
