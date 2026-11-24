<!-- exported 2026-11-03 from https://claude.ai/artifact/9BrcaCxu9S9Loaqmr72cp5 (Claude Docs id 424d1f4d-5ea4-4c07-847b-fbca7274d6be) -->
# The publishing pipeline: gates from draft to channel

Oct 31, 2026 · @Torian

This drafts Torian's design of 2026-10-31 06:13Z for how anything gets published: a draft goes in, passes a fixed sequence of verification gates, and only the gates produce output. It is architecture, not a build; agents posting is outside the MVP. Much of it extends things that already exist, marked below.

## The shape

Input, then gates, then output. Everything between is lensing, error handling and checks. A gate is code, not an agent: it returns true or false, and with false, the errors or the proof of why. A rejected draft is corrected and resubmitted, in a loop, until every gate passes.

| # | Gate | Adds, then checks | Rules come from | Exists today? |
| --- | --- | --- | --- | --- |
| 0 | Intake | Accepts the draft as JSON and reduces it to its core: themes, ideas, claims, ethos, and fetched references. No structure, no brand nouns, no punctuation yet | The draft schema | No |
| 1 | Publishable | Proves every part may go out: fetched fields are `public` or an approved `variant`, pinned by sha256; written parts carry provenance | Field visibility (`schema/visibility.mjs`) | Partly |
| 2 | Rhetorical structure | Adds the chosen writing framework's structure (AIDA, PAS, a three-point essay) by placing the core's ideas into its sections, then checks every section is filled and in order | Writing framework modules | No |
| 3 | Brand lexicon | Adds the brand's nouns and terms, then checks voice, imperatives and CTA rules (one CTA, always last) | Brand modules | Partly: `brand-lint.mjs`, `check-nouns.mjs` |
| 4a to 4c | Prose: grammar, sentence rules, punctuation | Each adds its own layer and lints only that layer, one linter per concern | Prose modules, one per linter | No |
| 4 | Prose, unified | Re-runs every earlier check on the finished text, so the sum equals the parts: no later layer broke an earlier one | All modules selected above | No |
| 5 | Claims and safety | Claims cite records; no leaks, marks, personal data or secrets | The publish lint | Yes: `naive publish check` |
| 6 | Compile | Converts to the channel's format (MDX for a website, the channel module's own format elsewhere) and tests the output | The channel module | Partly: `naive publish build` |
| 7 | Approve and publish | A person approves under public-commitment; manifest and rollback | The publication policy | Yes: EE-025 |

The gates hold no rules of their own. Structure frameworks, prose styles, brand rules and channel formats are modules given to the gate, customizable per venture, and the gate runs them procedurally in order. This is how Vale, the prose linter, works: the engine is fixed, and styles are packages of rules.

## An assembly line of constraints (Torian, 06:30Z)

Each gate adds its part and then lints it, like stations on an assembly line. Nothing arrives early: before the brand gate a draft carries no brand nouns, and before the prose gates it carries no punctuation. Intake reduces whatever comes in to its core, and each later gate re-applies one layer from the module chosen for it.

This is the standard architecture of natural language generation (Reiter and Dale, *Building Natural Language Generation Systems*, 2000): content determination, then document planning, then microplanning (including lexical choice), then surface realisation (grammar, morphology, punctuation). Our gates map onto it:

| NLG stage | Our gate |
| --- | --- |
| Content determination | Intake: the core of themes, ideas, claims, ethos |
| Document planning | Rhetorical structure |
| Microplanning, lexical choice | Brand lexicon |
| Surface realisation | Prose: grammar, sentence rules, punctuation |

The standard order puts word choice before grammar and punctuation, so I moved the brand gate ahead of prose. Following it also gives the structure gate a precise name: in linguistics, how a text's parts relate is its rhetorical structure (Rhetorical Structure Theory, Mann and Thompson, 1988). So: the **rhetorical structure gate**, and the modules it runs are **writing frameworks**.

One simplification: stripping nouns and punctuation out of finished prose is lossy and needs a model to do well. It is cleaner if drafters write the core directly as JSON (themes, claims, references) and never write finished prose at intake. Intake can still accept prose, but then a model only proposes the core and a check confirms it; the code decides (the rule the Polity OS work uses).

## Modules go through a gate; they are not gates

I agree with your persuasion. A gate is a fixed engine; a constraint is a module the gate runs. Before a module can be selected, it passes its own admission gate: it matches the module schema, ships passing and failing examples that its checker classifies correctly, and declares which layer it touches (core, structure, lexicon, grammar, sentence, punctuation, characters).

That declaration is how contradictions are caught before any writing happens. When a set of modules is chosen for a publication, a compatibility check compares what each one requires on each layer. A lipogram without "e" and a brand lexicon that requires "Mentura" conflict on the characters layer; a PAS structure and a "CTA first" rule conflict on structure. The selection is refused with the conflict named, rather than the draft looping forever between two gates.

## A library of writing constraints

Constrained writing has a standard home: the Oulipo (Ouvroir de littérature potentielle), the group behind Perec's *La Disparition*. Their constraints, the classical rhetorical appeals and copywriting frameworks all fit one library, grouped by the layer they touch:

| Layer | Examples | How it is checked |
| --- | --- | --- |
| Characters | Lipogram (no "e"), monovocalism, univocalism | Mechanically, by counting letters |
| Word form | Tautogram, snowball (chaterism), Pilish, palindrome | Mechanically, by word lengths and order |
| Syllables and lines | Fib (Fibonacci syllables) | Mechanically, with a syllable counter |
| Parts of speech | Prose without nouns | A part-of-speech tagger, a deterministic library that runs offline |
| Lexicon | Brand nouns, banned words, required terms | Word lists |
| Rhetorical structure | AIDA, PAS, the hero's journey, a three-point essay, Aristotle's appeals (ethos, pathos, logos, with kairos as the call to act) | Against the core's labelled sections; a model may only advise whether the prose fits |

The last row is the honest limit: whether a paragraph really builds desire cannot be proved by code. The gate can prove that the draft has an Interest section, placed before Desire, holding the core ideas tagged for it; a model's opinion on the prose is advice, never the verdict.

Whether the whole pipeline is itself a module (a "publishing framework" a venture can swap) stays open, as you said; nothing above depends on it.

## Fetch, never retype

When a draft includes the mission, it fetches the mission record; no one writes it again, agent or person. A draft is a list of parts, and each part is one of two kinds:

- **Fetched:** a pointer to a record field (`identity/mission#statement`) plus the sha256 of the version used. Gate 1 checks the field is publishable; the compiler inserts the text. If the mission changes, the draft is stale until rebuilt. This matches the site's existing `<Fact>` component, which reads facts from records.
- **Written:** prose, with provenance (next section).

A standard exists for this kind of JSON rich text: Portable Text (Sanity's open specification), a list of blocks with typed marks and references. Using it instead of a new format follows the standard-nouns rule.

## What agent-written prose carries

You asked what else agent prose should carry. My proposal, per written part:

| Field | Why |
| --- | --- |
| Author: agent id, model and version, or person | Who wrote it |
| Role and gate position | Which stage the author was allowed to write at |
| When | Ordering and freshness |
| Inputs: the records and sources read, by id and sha256 | Traces every statement to what it came from |
| Instructions: the prompt or brief, by hash | Lets a reviewer see what was asked |
| Revisions: each gate rejection and the fix | Shows the loop, and that the gates held |
| Human edits: who changed what after the agent | Separates agent words from the owner's (agent drafts are never the owner's claims) |
| Disclosure: whether the channel needs an AI-generated label | Some platforms and laws ask for it; the channel module says when |

For content shown publicly, C2PA (Content Credentials) is the standard for provenance manifests that travel with the media; it is worth reading before inventing a format.

## Proof that it passed

Every published file carries a certificate: the draft's hash, each gate run (gate, module and version, verdict, hash of the output), and the approver. In supply-chain terms this is an attestation per step, as in in-toto and SLSA. Each gate run is a line in provenance (`provenance.jsonl`, R-17).

The check that closes the loop: a published MDX file must carry a certificate whose last step's hash matches the file. A hand-written MDX file has none and is refused. That is how "agents can only write the file type of their gate" is enforced: no one writes MDX directly; only the compiler does.

## Agents at gate positions

An agent's place in the pipeline decides what it may write. The drafter writes draft JSON only. A fixer can only answer a gate's rejection with a revised draft. No agent writes compiled output or approves. A public relations agent is a role that drives the loop; the gates work the same with a person or no agent at all (R-50).

## Where this sits

The gates, the draft schema, the certificate and the framework modules are framework: they work offline with no account. Channel modules that talk to X or LinkedIn are platform (Mentura). Architect only until after the MVP; Torian's own posts can go through the existing gate by hand.

## Open questions

- Do we adopt Portable Text for drafts, or a smaller JSON of our own? I lean to Portable Text.
- Which structure frameworks first? A three-point essay and a short social post would cover X, LinkedIn and Substack.
- Does gate 2 to 4 order matter? Proposed: structure before prose, so a bad structure fails before line edits are wasted.
