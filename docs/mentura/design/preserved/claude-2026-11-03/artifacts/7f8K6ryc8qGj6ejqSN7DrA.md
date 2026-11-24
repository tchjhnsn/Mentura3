<!-- exported 2026-11-03 from https://claude.ai/artifact/7f8K6ryc8qGj6ejqSN7DrA (Claude Docs id 35e999f8-e0db-419c-80b4-cfbcd35420b3) -->
# Knowledge, convention and code (proposed)

Nov 1, 2026 · @Torian

## The problem: decisions decay before they reach the code

Written as a problem record, so the problem is named before it is solved.

**Statement.** Decisions are made in conversation, then work moves on and the repo keeps showing the old structure. The prose links ideas to each other, but the files, folders and schemas don't follow. The result is a maze: every idea seems connected, but in the code they come apart.

**Holder.** Torian, as founder. The engineering function owns the fix.

**Evidence from main** (840fcf6):

| Decision | When | State of the repo |
| --- | --- | --- |
| A department is a function with its own team; for a solo founder they are functions | 10-28 22:58Z | `operations/departments.json`, 60 department folders and a `departments` key in venture.json. EE-047 ("organized by department") is still `proposed` and was never superseded |
| Functions are declared in venture.json | 10-29 16:35Z | Built (venture.json has `functions`), but `departments` sits beside it |
| `foundation/` becomes `identity/` | 10-30 22:05Z | 0 `identity/` folders, 9 `foundation/` folders, 250 files still say foundation. It is not recorded as an EE decision at all |
| Requirements R-01 to R-25 for identity, functions, phases and provenance | 10-30 | `docs/design/` has no requirements file; it never merged |
| Our groupings are called "areas", not layers | 10-31 22:29Z | Not started (planned as its own PR) |
| The decision log as a whole |  | 47 of 83 decisions are still `proposed`, including ones you decided on cards |

**Why `purpose/` is still there.** The identity decision was about a venture's own records (`foundation/` to `identity/`). `purpose/` is a folder in the framework repo, one of the areas. So it doesn't contradict the identity decision, but nothing ever said how the framework's areas relate to identity and functions. That gap is the problem in miniature: two vocabularies, the venture's and the repo's, use overlapping words and nothing connects them.

**Causes** (each checked against the table above):

1. **A card answer is not a record.** Your answer lands in a thread and a memory note. It only becomes an EE entry if someone writes one, and often nobody does.
2. **A decision names no targets.** An EE entry doesn't say which terms, folders, schemas or record types it changes, so nothing can check it.
3. **No check fails.** `node test.mjs` passes whether or not an in-force decision is built.
4. **Changes don't propagate up the graph.** When a decision changes something high in the graph, such as what a function is, nothing lists every node that depends on it. That is what you meant by axes "reaching a higher level".
5. **Knowledge and code share one tree.** Marketing prose, business conventions and engineering code sit in the same repo and route through the same words. So a word with two local meanings, such as department, function or pipeline, gets used in both senses in the same place.

**Countermeasures** (proposed):

1. **A decision record is written in the same turn as the card is answered.** It gets an EE id and an `affects` list of term ids, paths and record types.
2. **Conformance check (G2).** Every in-force decision with `affects` gets a check that fails when the repo disagrees. For example, "no `foundation/` folders once EE-089 is in force". This turns decisions into requirements on the codebase.
3. **Where-used propagation.** Code and docs cite term ids. When a term's hash changes, every citing node is marked stale (the L4 Merkle rule). The list of stale nodes is the update plan.
4. **The handshake.** The knowledge base and the code base live in separate repos. They touch only at the glossary: the knowledge base defines terms (ids, senses by scope, hashes), and the code base cites them. Neither imports the other's files. Marketing writes in `@marketing` senses; code uses `@engineering` senses; they meet only on shared ids. The router keeps routing records inside a venture. It was never meant to guard the boundary between knowledge and code, which is why it didn't.

**Check.** The table above is rerun after each countermeasure, and each row should end with the repo matching the decision.

**Times.** Occurred 10-28 (first unrecorded decision). Identified 11-01 00:26Z.

## Short answer

You're building two things at once. One is a **convention**: the book in your head on how to structure a venture for the economics of superintelligence. The other is an **encoding**: the code in Naive and Mentura that makes the convention checkable. A third set of **tools** would exist with no venture at all, such as the term engine, the graph deriver, redaction and verify.

The glossary sits under all three. The convention is written in its terms, the code is checked against those terms, and Lean proves the relations between them. So the knowledge base is verified the way the code is: start at the glossary and build up.

This doc measures and tests four things on the code as it is today (main, 840fcf6):

- a README theorem that follows the dependency graph, with an audit;
- what's known about agent-readable codebases;
- local meaning in the glossary, plus the function and organisation terms;
- a first split of the repo's modules into convention and tools.

## The README theorem

The theorem works from the dependency graph and the file tree, and it ignores what folders are called. A folder needs a README when any of these holds:

- **R1 boundary.** Code outside the folder imports code inside it, so the folder offers an interface. Its README is that interface's description.
- **R2 navigation.** It has five or more direct children, so a reader needs a map.
- **R3 area.** It's a top-level folder.

Instance data, example ventures, generated folders and dot folders are exempt.

**Hub files.** A file used by five or more files outside its folder is a hub, and its folder's README has to name it and say what it offers.

**A file of its own.** If a single file needs its own README, it's a component trying to get out. Give it a folder, because GitHub shows only one README per folder.

**What goes in a README** follows the architecture record, so the README shows that node of the graph:

1. **What it is.** One line, with its glossary kind: container, component or module.
2. **Parent and children.** A link up, and a table of the parts with one line each.
3. **What it offers.** Exports used elsewhere, commands and schemas, and who uses them.
4. **What it depends on.**
5. **Terms.** Glossary terms it defines or uses.
6. **How to run and test it.**
7. **Decisions and status.**

Parts 2 to 4 are generated from the graph between markers and checked for drift, like the publishing pipeline. People write parts 1, 5, 6 and 7. That makes A6 ("docs say what is") a check, not a hope.

**Audit of main** (840fcf6, `readme-theorem.py`):

| Measure | Result |
| --- | --- |
| Folders that need a README | 104 |
| ...and have one | 39 |
| ...and are missing one | 65 |
| Hub files | 60 |
| Hub files their folder README names | 12 |
| Existing READMEs older than changes in their folder | 24 of 78 |
| Median share of a folder's children named in its README | 61% |
| Broken relative links | 0 |

- **The worst gaps:**
  - `interface/` (66 outside users), `knowledge/`, `operations/`, `purpose/` and `schema/migrations/` have no README.
  - `schema/venture-paths.mjs`, `interface/provenance.mjs` and `interface/router.mjs` are used by 34, 32 and 47 files outside their folders, yet no README names them.
- **One caution.** Descendant counts are inflated by the import knot. Every file in the 15-file cycle reaches about 117 others, so the outside-user count is the better hub test.

## Agent-readable codebases

Lauren Tan (poteto) wrote pstack, the stack you already use. I found only secondary summaries of her talks, not a primary source, so treat these as reported:

- **Reject what you don't want.** CI, static analysis and dependency rules mechanically refuse unwanted patterns, so the shortest path an agent can take is also the right one.
- **Let agents see the system run.** They run the app and read traces, not just the code.
- **Keep loaded context lean.** Load what an agent needs almost every time; everything else loads on demand.
- **Turn repeated lessons into skills.**

Community AGENTS.md guidance agrees on the rest:

- keep the root file small and link to scoped files;
- in a monorepo, put rules in a hierarchy that follows the packages;
- check in CI that documented commands run and documented structure matches the repo;
- put hard requirements in hooks, not prose.

Owen's CI post makes the same point about hooks: "agents skip steps".

**This supports your principle.** Everything here also helps a human reader: structure that matches the graph, checks instead of promises, defined words. Our pieces line up with it:

- The README theorem is the hierarchy rule, derived from the graph.
- The drift check is the CI check that docs match the code.
- The glossary is the word-level version of the same idea.

You also asked whether a codebase should be a direct copy of the graph. Not literally, because the graph has a knot and a folder tree can't express a cycle. The goal is that **folders match components and imports only cross folders through their stated interfaces**. Then the tree is a faithful view of the graph, and the knot shows up as a defect to fix, not a structure to copy.

Sources: [potetos-for-everyone README](https://cdn.jsdelivr.net/npm/potetos-for-everyone@0.1.0/README.md), [Poteto Mode](https://mcpmarket.com/tools/skills/poteto-mode), [Stop watching your coding agent](https://levelup.gitconnected.com/stop-watching-your-coding-agent-build-a-system-you-can-trust-780e678b0ae3), [talk summary](https://youtubesummary.com/summary/Cmoh-yR-usA), [AGENTS.md onboarding](https://agents.siddhantkhare.com/13-agents-md-onboarding/), [good practices for AGENTS.md](https://ainativecompass.substack.com/p/good-practices-creating-agentsmd).

## Local meaning, functions and the organisation

**Local meaning.** Each term gets a `scope`: the whole venture, one function, or one role. A word with several local meanings becomes one term per sense, written `label@scope`. Each sense runs through the engine like any other term.

Reading the glossary "as marketing" means: marketing's own senses first, then every venture-wide term marketing hasn't redefined. The query tool does this today: `node glossary-query.ts scope sales`.

The first worked case is **pipeline**, which has three senses:

- `pipeline@sales`: deals moving through stages;
- `pipeline@engineering`: CI;
- `pipeline@naive`: a problem's path to a merged fix.

The engine's first run said the sales and engineering senses overlapped, because nothing kept a deal apart from a code change. Adding "not code changes" and "not deals" made them disjoint. This is the language collision map from the schema notes, now made checkable.

**Organisation terms** (`org-vocab.ts`). I ran three levels, each over every combination of facts. All 19 predictions hold after fixes that the engine forced.

| Term | Meaning | What the engine found |
| --- | --- | --- |
| function | A kind of work every venture must have done, even with nobody on it | Run 1 overlapped role and org chart; fixed with "not a position" and "not a record" |
| department | A group of people formed to carry out one or more functions | Disjoint from function and role. **A solo venture has functions but no departments.** |
| role | A position with responsibilities, held by one person or open | Disjoint from department |
| org chart | A record: the tree of roles and departments by reporting line | A view, not the people or the work |
| marketing | Work aimed at a market that creates, communicates, delivers or exchanges an offering's value (AMA 2017) | **Sales is a kind of marketing.** Marketing overlaps product development, hiring and finance |
| sales | Work that closes an exchange with a specific buyer | Is a kind of marketing |
| product development, hiring, finance | Building the offering; staffing; moving or accounting for money | Each overlaps marketing |

**What this says about the code.** The catalog `operations/departments.json` lists 13 "departments", such as marketing-and-sales and finance. By these definitions they are **functions**: kinds of work that exist even when nobody is assigned to them. This matches your rule that functions are always true of a venture, even if null. A department is something a venture forms later, once it has people.

**How we prove something is marketing.** We test the activity's facts, never its folder or label:

1. Is it aimed at a market?
2. Is it about the value of an offering?

In code, a record type declares those facts. A campaign record has a segment, a message and a channel, so it passes. The check is label-blind, so a file under `marketing/` that does neither fails.

The AMA definition is broad enough that employer branding counts as both hiring and marketing. That is exactly where a local meaning such as `marketing@<venture>` would narrow it.

## Separating the convention from its encoding

Three kinds of thing are mixed together today:

| Kind | What it is | Where it belongs | Verified by |
| --- | --- | --- | --- |
| Convention | How to structure a venture: terms, records, phases, functions, rules. The book. | The knowledge base. EE's `knowledge/` and the vault already hold it as prose. | The glossary engine and Lean |
| Encoding | Code that makes the convention checkable: schemas, routes, lints, the gate | Naive (framework) and Mentura (platform) | Tests: does the code do what the convention says? |
| Tools | Code that would exist without any venture: the term engine, graph deriver, redaction, verify, CI runner | A tools package with no imports from the encoding | Its own tests; usable by MAD and anyone else |

**First cut on main.** I classified each module by whether its code (comments removed) names venture concepts, directly or through an import:

- 190 of 279 modules encode the convention.
- 89 are tools.
- In `schema/`, the tools include `bdd`, `check-boundary` and `check-types`. In `platform/`, the GitHub and LangSmith adapters.

The classifier is a keyword heuristic. Console pages are probably misclassified, so read the counts as a direction, not a verdict.

The rule that follows is the **one-way dependency**. Tools never import the encoding, and the encoding never redefines a term the convention defines; it cites the term's id.

That gives each level its own proof:

- The convention is proved in Lean and by the glossary.
- The encoding is verified against the convention's terms. This is G2 conformance: the design is the build.
- Tools are tested on their own.

**On "layers".** You're right that this looks like layers in a matrix. These three do pass the technical layer test: each depends only on the one below, and the glossary is at the bottom. A cell in the matrix is (level × function): for example the marketing convention, the marketing encoding, the marketing tools. The "areas" decision still stands for purpose, knowledge, operations and the rest, because those were never ranked.

## Proposed next steps

1. **Glossary PR (already planned as step 2).** Move all 54 terms into `schema/terms` with their Lean proofs and add `scope` to the term format. Include the problem record schema and the GitHub issue template. Because of the department finding, call the 13 catalog entries functions in the glossary, and leave the folder rename for a later cleanup, like "areas".
2. **README check.** Add `readme-theorem` as a check that reports, without failing, in the next PR. Generate parts 2 to 4 of the README for `interface/`, `knowledge/`, `operations/` and `purpose/` first, then make missing READMEs fail once they exist.
3. **Tools package.** Confirm the 89-module list by hand (the console pages first) and add a boundary check so tools never import the encoding. The move itself waits until the import knot is untangled.
4. **Convention as a book.** The convention's chapters would follow the glossary's levels: the founder, the venture, functions, phases, records and decisions. That keeps the book and the code on one vocabulary. This is architect-only for now.

Prototype files, all in `naive-design/prototypes/architecture/`:

- `readme-theorem.py`
- `org-vocab.ts`
- `generator-vocab.ts`
- `problem-vocab.ts`
- `glossary-query.ts` (with `scope`)
