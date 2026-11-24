<!-- exported 2026-11-03 from https://claude.ai/artifact/JzodSs3wxHfS4BMaQydXFV (Claude Docs id 91bd7ce4-f565-470a-8fa7-c30372f83440) -->
<!-- tab: Naive docs (b845d79d-c04d) -->
# Naive docs

Naive is an AI-native venture development framework. It's a central data structure for a venture, run by agents and decided by people, built for solo founders, small founding teams and early-stage startups. It also moves a venture through its lifecycle: at any moment it shows which phase the venture is in and what it needs next to reach the following one. Naive isn't a software engineering framework; that's MAD.

This tab is the current documentation, as of 2026-10-30. It describes Naive on its own terms. The earlier draft, which mapped every chapter to Next.js, is kept in the archived tab.

## Install

Install Naive into the agent you already use. In Claude Code that's two commands:

```text
/plugin marketplace add tchjhnsn/naive-plugins
/plugin install naive@naive
```

Then tell the agent what you're building. It asks who is founding it and what kind of venture it is, confirms the type with you, and creates the venture. From a terminal, `npx create-venture` does the same. Unless you name it, your first venture is My first venture, in `my-first-venture/`.

## Your workspace

The folder you create a venture in becomes your workspace: one place for all your ventures and for you.

```text
my-workspace/
  naive-workspace.json   # its name (Naive workspace), its ventures, its settings
  AGENTS.md              # your rules for agents across every venture
  founder/               # you, once, shared by every venture
  raw/                   # what you capture before it belongs to a venture
  inbox/                 # ideas waiting for you to say which venture they belong to
  meta/                  # the workspace's own log
  my-first-venture/      # a venture
```

- **Settings.** `cross_venture_reads` (on by default) lets one venture read another's published artifacts, never its records. `route_threshold` (0.8) is how sure Naive must be before it files an idea without asking you. Offline, these settings are your workspace configuration.
- **Ventures are sandboxed.** Each keeps its own records, people, permissions and history.
- **Teammates have their own workspaces.** They add the ventures they work for into theirs, and each venture keeps its own settings.
- **One prompt, many ventures.** `naive capture "<text>"` saves what you said in `raw/`, splits it into ideas and sends each one to its venture's inbox as a draft. Ideas it's unsure of wait in `inbox/` until you choose with `naive inbox assign <idea> <venture>`. Each choice teaches the router.

## A venture's structure

A venture is a folder of records, laid out so the folder tree teaches you how the business fits together.

```text
my-first-venture/
  venture.json   # who the venture is, its phase and its venture functions (the org chart)
  README.md      # the venture, for people
  AGENTS.md      # this venture's rules for agents
  k-base/        # the knowledge base: every record about the business
    raw/  foundation/  product/  customers/  marketing/  people/  money/  decisions/  evidence/
    _private/  _drafts/
  codebase/      # code the venture keeps: a marketing site, a ported repository
  meta/          # sources.json, naive.config.json, provenance.jsonl, releases/
```

- **Every k-base folder explains itself.** Its README.md says what it's for, what goes in it first, when it's ready and who owns it.
- **Venture functions.** A venture function is a part of the venture with one accountable owner, such as foundation or marketing. They're declared once in `venture.json` under `functions`, and every folder and record inherits its function from there. A new venture starts flat: one function per folder, all owned by you.
- **A record's address is its path** in `k-base/`, without the extension: `foundation/problem`. Skills teach agents where files go, and `naive check` makes sure they did.
- **Bring what you have.** `naive port <folder>` moves an existing folder into the venture as it is, to `codebase/` by default. Nothing inside it changes. It's named in `meta/sources.json` as a source of truth, and the move is logged.

## Records and instructions

A record is one JSON or Markdown file in `k-base/`, such as `foundation/problem.json`. Its record type says what it holds, where it goes and which schema checks it. A collection is a folder of items, one file each: `foundation/icp/<id>.json` holds one ideal customer profile each.

AGENTS.md files give agents their instructions, at every level: the workspace, the venture, a function's folder and a single folder. Before an agent reads or writes a record, Naive hands it every AGENTS.md from the workspace down to that record, plus the record's schema and the actions it may take. The nearer file wins when two say the same thing. Lines shaped `key: value` are instructions Naive reads; the rest is prose for the agent.

## People decide, agents propose

A person is the source of authority. An agent reads what it's given, does the work and proposes; anything that settles the venture goes back to a person.

- **The gate runs before every write.** An agent's write to a record only a person can settle lands in `_drafts/` instead: a decision, a foundation statement, the brand, the design system, the glossary. A person accepts it with `mentura accept`.
- **An agent never settles a decision.** A write that marks one decided, or names who approved it, becomes a draft.
- **The docket** ranks the decisions waiting on people, inside each venture function and then across functions. The ranking is code, with no model call.
- **Every change is logged** in `meta/provenance.jsonl`: what changed, who changed it, what it was built from and which decision authorised it. Each line carries the previous line's hash, so an edited or deleted line breaks the chain and `naive check` fails.
- **Settings** live in `meta/naive.config.json`: which routes fail closed, who reviews what, and how confident an agent must be to write without asking.

## The venture development lifecycle

Every venture is in one of five phases, and `naive phase` always shows where you are and what stands between you and the next one.

| Phase | The question it answers | Its gate |
| --- | --- | --- |
| Discovery | Does a real problem exist, and who has it? | Problem-solution fit |
| Validation | Will people adopt this solution and keep using it? | Product-market fit: retention holds |
| Beachhead | Can it win one segment repeatably, at a profitable cost? | Repeatability |
| Scale | How fast can it take the mass market? | Market leadership with healthy margins |
| Platform | What will others build on, so the venture can't be displaced? | Others build on it |

Your venture's telos states its own exit criteria for each phase. A person marks one met, with evidence, and the phase changes only when all of them are met. You can still move on early, but only with `--override` and a reason, and that's logged.

```text
naive phase
naive phase --meet ten-clinics --evidence evidence/clinic-interviews
naive phase validation --reason "Ten clinics confirmed the problem"
```

Decisions say which phase they're needed in, so later ones wait. Records whose truth depends on the phase go stale when it changes, and the venture package starts a new version. An agent can suggest a phase change, never make one.

## Sources of truth

A record kept in another system (GitHub, Rho, Stripe, a ported folder) is read from there, not copied. `meta/sources.json` says which system holds the truth for each function. Anything read from an outside source is checked against the record type it's meant to fill, and a mismatch stops the read instead of being forced to fit.

## Freshness

Evidence ages, and a record goes stale when what it rests on changes.

- **By time:** each record type has a shelf life; last year's market research is marked stale.
- **On demand:** when a record changes, everything that rests on it is flagged. Change your ideal customer, and the positioning built on it is flagged.
- **By phase:** a phase change rechecks the records that phase depends on.

A stale record is redone by an agent or verified by a person; it's never silently trusted.

## Artifacts are what gets published

Records are never published. Artifacts are: a document, deck, dashboard, design, page, file or site built from records for a reader. Each artifact is itself a record in `artifacts/<id>.json` naming the records it was built from, and `naive check` marks it stale when one of them changes. The `choosing-artifacts` skill says which action builds which artifact.

## Skills and playbooks

- **Venture function skills** teach an agent how to work in each function: its records, how to read and write them, what needs a person, its checks and the artifacts it builds.
- **Playbooks** are step-by-step guides a function runs with you in conversation. A template is the empty shape of one record; a playbook is the order of the work. Torian's playbook takes a founder with a fresh venture from the puzzle of their life to a problem, its markets, the solutions that exist and how they feel about them, to the decision to build. It writes your founder profile from a library of attributes: puzzles, passions, telos, ambitions, strengths, weaknesses and values.

## Releases and upgrades

`naive build` makes a release: a frozen copy of every record a person confirmed, to hand to an investor, a cofounder or a partner. What must stay live (open decisions, money) is left as a named hole, and drafts, raw inputs and anything private never ship. `naive upgrade` moves a venture onto the installed version of Naive, with migrations that rewrite records.

## Where Naive runs

In Claude Code, Naive is a plugin from the tchjhnsn/naive-plugins marketplace. Other harnesses (Cursor, Codex, Claude Desktop) reach the same venture through Naive's MCP server, with the same actions and rules. Outside a venture the plugin offers one tool, to create a venture; inside one, it offers the full set.

## What's built today

| Piece | State |
| --- | --- |
| Workspace, default names, settings, capture and inbox | Built (0.3.0, #84) |
| k-base/ and codebase/, a README in every folder | Built (0.4.0) |
| Lifecycle gate: naive phase, exit criteria | Built (0.5.0) |
| Venture function skills, playbooks, founder profile | Built (0.6.0) |
| Agents can't settle decisions or publish brand records | Built (#73) |
| Artifacts as records, stale when a record changes | Built (#80) |
| Function composition (calls, authority), function.json, the 11 error codes | Not built |
| Precog, decisions that fill in as evidence arrives, phase handoffs | Not built |
| Marketing-site starter | Not built |
<!-- tab: Guides (c4cd07c1-dbc3) -->
# Guides

How to do specific jobs in a venture, step by step.

## Compose your own function

A group is a function that calls other functions. Here, a founder makes growth from marketing, customers and money, with its own owner.

1. Declare it in venture.json, and say whose authority wins for each function it calls:

   ```json
   "growth": {
     "owner": "sam-lee",
     "contributors": ["agent", "maya-chen"],
     "calls": {
       "marketing": { "authority": "growth" },
       "customers": { "authority": "growth" },
       "money":     { "authority": "money" }
     }
   }
   ```

   `authority: "growth"` hands that function's decisions to growth's owner. `authority: "money"` keeps them with money's owner, and growth only uses it.
2. Optionally move the folders into `k-base/(growth)/` so the grouping shows on disk, and add an `AGENTS.md` there with growth's instructions. Addresses don't change: `marketing/brand` is still `marketing/brand`.
3. Or do both steps at once: `naive group growth marketing customers money`.
4. Run `naive check`. Because it is all code, a composition can't contradict itself, and the check throws an error for each conflict. See Error codes in the API Reference.

## Bring in an existing project

You don't restructure anything to start.

1. Point `naive port` at the folder: `naive port ~/code/acme-site`. It moves the folder into your workspace as it is. Not one file inside changes.
2. Port names it in `meta/sources.json` and logs the move in the provenance log. From then on the venture references it as the source of truth. To leave a folder where it is, name it in `meta/sources.json` yourself.
3. Agents read it where it is. Anything they read is checked against the record type it is meant to fill. If it doesn't fit, the read stops with `does-not-compile`, naming the file, the field and why. Nothing is quietly forced to fit.
4. When you're ready, ask the migration skill to convert it. It works out what the folder is (a Next.js site, a docs folder, notes), and proposes where each piece goes, as drafts you approve.

**Built in 0.3.0:** port as a move. Before, `naive port` copied each file into the folder its name pointed to, and left the rest behind (`schema/port-venture.mjs`).

## Set up a marketing site

1. During setup you're asked whether you have a marketing site.
2. **If you do:** bring it in as above, or point to where it lives.
3. **If you don't:** Naive recommends Next.js and creates a starter site in `codebase/`. It builds its pages from each folder's `public.json`.
4. Fill `public.json` in the folders with something to publish. Each item names the record it comes from, the wording that may go out, the audience, and who approved it.

The starter site is in Naive's marketing package. The agents that draft pages, publish and keep the site in step with your records are in Mentura's marketing kit.
<!-- tab: API Reference (c04ba0ae-c17f) -->
# API Reference

The exact specs: files, fields, functions and error codes.

## venture.json

Who the venture is, and its org chart. It sits at the venture's root and marks the folder as a venture.

| Field | What it holds |
| --- | --- |
| `name`, `type`, `phase` | The venture's name, its type (such as `software-startup`) and its lifecycle phase |
| `functions` | The org chart: each business function, its owner, its contributors, and what it runs or calls |

A function entry:

| Key | Meaning |
| --- | --- |
| `owner` | One person, always |
| `contributors` | Others who help, always including `agent` |
| `packages` | The k-base folders this function runs. Left out, it runs the folder of the same name |
| `calls` | Other functions it calls, each with `authority`: the caller or the called function |
| `uses` | A founder-written function in `codebase/functions/` |

```json
"functions": {
  "foundation": { "owner": "maya-chen", "contributors": ["agent"] },
  "growth": {
    "owner": "sam-lee", "contributors": ["agent", "maya-chen"],
    "calls": {
      "marketing": { "authority": "growth" },
      "customers": { "authority": "growth" },
      "money":     { "authority": "money" }
    }
  }
}
```

## function.json

A business function, defined once in its package like a function in software.

| Key | Meaning |
| --- | --- |
| `id` | The function's name |
| `reads` | The paths it reads, each with a schema |
| `writes` | The records it writes, each with a schema |
| `actions` | What can be done, and who may: `"by": ["agent", "person"]` or `["person"]` |
| `needs` | For each function it reads from, the fields it requires (checked by `incomplete-input`) |

```json
{
  "id": "foundation",
  "reads":  ["raw/*", "evidence/*"],
  "writes": ["foundation/problem", "foundation/icp", "foundation/mission"],
  "actions": {
    "research":         { "by": ["agent", "person"] },
    "draft":            { "by": ["agent", "person"], "lands_in": "_drafts/" },
    "propose-decision": { "by": ["agent", "person"] },
    "confirm":          { "by": ["person"] },
    "publish":          { "by": ["person"] }
  }
}
```

Open: a function as a JSON definition (easier to check) or a code module that exports its actions (more powerful).

## The foundation function

Foundation is the function most others depend on, so it is defined completely. Precog and streaming can only draft or fill a decision whose inputs are defined and present.

**Reads**

| Input | Schema | Status |
| --- | --- | --- |
| `raw/sources/[id]/` (source.json, text.md) | `raw-source.schema.json` | Defined |
| `raw/dump/` (the founder's captures) | none | Not defined |
| `evidence/*` (graded, cited evidence) | not listed in the evidence package | Not defined as a package schema |

**Writes**

| Record | Schema | Required fields |
| --- | --- | --- |
| `foundation/problem` | `validation-problem.schema.json` | venture, statement, segment, evidence |
| `foundation/icp` | `icp.schema.json` | venture, profiles (each with id and who) |
| `foundation/telos` (vision) | `telos.schema.json` | see schema |
| `foundation/alignment` | `alignment.schema.json` | see schema |
| venture core: mission, competence, promised to | fields of venture.json | no separate schema |

**Dependents**

| Function | Reads from foundation |
| --- | --- |
| Validation | problem, icp |
| Marketing | icp |
| Product | icp |
| Relationships | icp |

**Still to define:** a schema for `raw/dump/` captures; an evidence schema owned by the evidence package; for every dependent, the fields it needs; and the same full definition for validation, marketing and product.

## The provenance log

`meta/provenance.jsonl`: one JSON line per change, appended and never edited, after the W3C PROV standard.

| Field | What it holds |
| --- | --- |
| `at` | When, in UTC |
| `entity` | The file that changed, or `<source>://<path>` for a record kept in another system |
| `route` | The record's path, such as `foundation/problem` |
| `activity` | `write`, `draft`, `accept`, `confirm`, `move`, `port` or `release` |
| `agent` | Who: `person` or `agent`, their id, and for an agent the model, session and harness |
| `derived_from` | The records or sources this change was built from |
| `decision` | The decision that authorised it, if any |
| `sha256` | A hash of the file's content after the change |
| `prev`, `hash` | The previous line's hash and this line's hash |

```json
{"at":"2026-10-29T18:20:00Z","entity":"k-base/foundation/problem.json","route":"foundation/problem","activity":"draft","agent":{"kind":"agent","via":"mcp","model":"…","harness":"claude-code"},"derived_from":["raw/founder-dump-1"],"sha256":"…","prev":"…","hash":"…"}
```

## Error codes

| Code | Kind | When it happens |
| --- | --- | --- |
| `missing-input` | Dependency | A record a function needs doesn't exist |
| `incomplete-input` | Dependency | The record exists, but a field the caller needs is empty |
| `unconfirmed-input` | Dependency | The record is an agent's draft and the caller needs a person's confirmation |
| `stale-input` | Dependency | The record is past its shelf life |
| `does-not-compile` | Fetching | Data read from an unconverted file or outside system doesn't fit its record type |
| `unclear-authority` | Composition | A called function has its own owner and the call doesn't say whose authority wins |
| `double-owner` | Composition | Two functions claim authority over the same function or record |
| `agent-overreach` | Composition | A composition gives an agent an action reserved for a person |
| `unknown-function` | Composition | A call names a function that isn't defined |
| `circular-call` | Composition | Functions call each other in a loop |
| `orphan-folder` | Composition | A k-base folder belongs to no function and isn't venture-wide |

Every dependency error also goes on the docket for the owner of the function that owes the record.

## File conventions

| Convention | Meaning |
| --- | --- |
| `_private/` | Never sent to a model |
| `_drafts/` | Waiting for a person to accept |
| `(group)/` | Groups folders for viewing; never part of a path's address |
| `[id].json` | One item of a collection, such as `customers/[id].json` |
| `public.json` | What a folder may publish, approved by a person |
| `README.md` | In every k-base folder: what it is for, for people |
| `AGENTS.md` | At any level: instructions for agents; the nearer file wins |
<!-- tab: Architecture (af170233-6b13) -->
# Architecture

How Naive works inside.

## Humans and agents

People are the server and agents are the client. The person is where authority sits and decisions are made by default. The agent is fast and close to the work, and acts only on what the person has made available. Agents never hold authority: anything that settles the venture (a decision, a foundation statement, a publication) goes back to a person. Code is the protocol between the two. It decides what each side may do.

## How a write flows

1. A write reaches Naive through the CLI, MCP or the local API. All three call the same router.
2. The router validates the record against its schema.
3. The gate decides what happens: it lands, becomes a draft in `_drafts/`, goes to the function's owner, or is refused.
4. If it lands, the router writes the file and calls `record()` in `interface/provenance.mjs`, which appends a line to the provenance log.
5. The entry is also sent as an event, so triggers and kits can react to it.

Once the plugin's write hook lands, an agent's direct file writes in Claude Code go through the same checks just after the write, and the hook appends the log line. Records only a person can settle keep going through the router, so a draft never lands in the real record.

## The provenance chain

Each log line carries the previous line's hash, and its own hash covers both. `schema/check-provenance.mjs` recomputes the chain: an edited or deleted line breaks it, and the check fails. A file changed outside Naive has no line; git history is its provenance until `mentura baseline` adopts it.

## Skills tell, code checks

A record's address is its file path inside `k-base/`, minus `(group)` folders and the extension. There is no router config, no reserved names and no aliases, except temporarily during `naive upgrade`. Skills teach agents where files go. `naive check` enforces it, so a file in the wrong place fails the check instead of quietly breaking a citation, and harnesses without Naive's skills are held to the same rules.

## Dependencies between functions

Functions read each other's records. Foundation is the root: validation, marketing, product and relationships all read it. A function that can't get what it needs stops with a dependency error instead of guessing, and the gap goes on the docket for whoever owes the record. Precog and streaming depend on this: they can only draft or fill a decision whose inputs are defined and present.

## How phases shape the venture

The phase is the one setting that changes what every other part of Naive shows.

- **Decisions.** Each decision says the phase it is needed in (`needed_in`). The decision matrix renders it now, holds it for later, or marks it stale (`schema/decisions.mjs`). Decisions made in Discovery are working answers; from Validation on they are firm.
- **Packages.** Each package has a fit score per phase (`schema/need-now.json`). It opens when the current phase reaches the threshold and is previewed when the next phase will (`schema/packages.mjs`).
- **Freshness.** Records with a per-phase profile go stale when the phase changes, so the venture re-checks what it believed in the last phase (`schema/freshness.mjs`).
- **Package versions.** A phase change starts a new venture package version, and earlier versions are kept.
- **Exit criteria.** The venture's telos lists exit criteria per phase, each serving a measure. `schema/check-telos.mjs` warns when the current phase has none. Nothing yet checks them before the phase changes.

The phases and their gates are defined once, in `purpose/frameworks/product-anatomy/phases.json`.

## Naive and Mentura

|  | Naive | Mentura |
| --- | --- | --- |
| What it is | The framework: conventions, schemas, checks | The platform: hosting, connections, automations |
| Ships | Packages (open, offline) | Kits (each extends one package) |
| Example | The starter marketing site | The agents that publish and maintain it |
<!-- tab: Glossary (b0688b71-154a) -->
# Glossary

Every Naive term, one line each.

| Term | Meaning |
| --- | --- |
| Action | Something a function lets you do, marked for an agent, a person or both |
| Agent | A model working in the venture; always a contributor, never an owner |
| AGENTS.md | Instructions for agents at any level; the nearer file wins. Naive's layout |
| Authority | Whose decisions win when one function calls another |
| Venture function | A part of the venture with one accountable owner, such as foundation or marketing, defined in code with its records and actions. "Function" for short; venture.json keeps the key functions |
| Codebase | `codebase/`: the venture's optional code, such as the marketing site and founder-written functions |
| Composition | A function that calls other functions, such as growth |
| Contributor | Anyone who helps carry out a function; agents always are |
| Docket | The ranked list of decisions waiting on people |
| Draft | An agent's proposal in `_drafts/`, waiting for a person to accept it |
| Gate | What runs before every write and decides whether it lands, becomes a draft, goes to the owner, or is refused |
| Handoff | Moving work and its context to the next sprint, campaign, initiative or phase, approved by a person |
| K-base | `k-base/`: the knowledge base, every record about the business |
| Kit | Mentura's extension of a package, with automations and agent workflows |
| Meta | `meta/`: records about the venture itself: sources, config, provenance, releases |
| Owner | The one person accountable for a function |
| Package | Naive's open definition of a part of the venture: schemas, templates, checks |
| Precog | Agents drafting the next likely decisions before a person reaches them |
| Provenance | The log of every change: what, how, who and from what |
| Record | One file in `k-base/`; Naive's page |
| Release | A frozen copy of confirmed records to hand to someone, with live holes |
| Source of truth | Where a record's real version lives, named in `meta/sources.json` |
| Streaming | A decision that shows what's known now and fills in as evidence arrives |
| Venture | One business: a folder with venture.json at its root |
| Workspace | The folder that holds all your ventures |
| Phase | Where a venture is in the startup lifecycle: discovery, validation, beachhead, scale or platform |
| Phase gate | What a venture must show before it moves to the next phase, such as problem-solution fit |
| Exit criteria | The venture's own measurable tests for passing a phase gate, kept in its telos |
<!-- tab: Code gaps (a5983bea-b757) -->
# Code gaps

**Update 2026-10-30:** rows 1 (workspace and default names), 2 (k-base/ and codebase/), 3 (a README in every folder), 8 (port as a move), 10 (naive phase) and 11 (workspace AGENTS.md) are built and merged into main. Rows 4 to 7, 9 and 12 are still open.

Thirteen things this article says that Naive's code does not do yet, as of 2026-10-29. The code was read on main and the uncommitted stage 3 work. Each row is a change to make in Naive, not in the article, unless the last column says otherwise.

| # | The article says | The code does today | Change |
| --- | --- | --- | --- |
| 1 | Installing gives a workspace named "Naive workspace" with naive-workspace.json and a workspace AGENTS.md; the first venture is "My first venture" | No workspace is made. The plugin creates a venture folder in the current directory, named by the founder. The schema file is workspace.json | create-venture makes the workspace and the first venture with those default names, both renamable |
| 2 | Folders are k-base/ and codebase/ | knowledge/ and repo/ | Rename in the structured layout, with a migration |
| 3 | Every k-base folder has a README.md written from its package | Only the flat layout writes READMEs, one per layer. A structured venture gets none, plus two stray folders, knowledge/knowledge/ and knowledge/meta/ | Write a README per package folder; drop the strays |
| 4 | A function can call others with authority, and use a founder-written function (calls, uses) | venture.json functions has owner and packages; contributors only in two places; no calls or uses | Add calls with authority, and uses |
| 5 | naive group growth marketing customers money | No such command | Add naive group |
| 6 | function.json defines reads, writes, actions (by agent or person) and needs | Not built | Define the format, starting with foundation |
| 7 | Eleven error codes, from missing-input to orphan-folder | None of them exist | Add them to naive check and to reads |
| 8 | Port moves a folder in unchanged (Guides still says "Not built yet") | Built today on claude/mac-port-move, not merged | Merge it; update the Guides note in this article |
| 9 | Setup asks about a marketing site; a Next.js starter in codebase/ built from public.json | No question, no starter, no public.json | Build after 1 to 3 |
| 10 | Phase change is naive phase | Only mentura phase exists (the article shows the mentura command) | Add naive phase and use it in the article |
| 11 | AGENTS.md layers from the workspace down to the record | Layering with key: value lines is built, but there is no workspace AGENTS.md to start from | Comes with row 1 |
| 12 | Precog, decisions that stream in, handoffs between phases | Not built (the article already says so) | Open question 7 below |
| 13 | meta/naive.config.json holds the gate settings | Built | None |

## Open questions to settle in the article

- meta/ or \_meta/? Drafted as meta/.
- Does codebase/ hold the code, or point to a repository elsewhere? Drafted as holding it, which is what port now does.
- public.json in every folder, or only where something is publishable? Drafted as only where needed.
- Workspace file name: naive-workspace.json, or something shorter?
- Precog and phase handoffs in the demo: shown as not built, or a thin version first?
<!-- tab: Archived: Next.js-mapped draft (daf89a65-6d83) -->
# Naive: Getting Started (demo master article)

Oct 29, 2026 · @Torian

Naive is an AI-native venture development framework: a central data management structure for a venture, run by agents and decided by people. It is built for solo founders, small founding teams and early-stage startups. It is not a software engineering framework (that is MAD).

Naive is also a framework for moving a venture through the startup lifecycle. At any moment it shows which phase the venture is in and what it needs to do next to reach the following one. That is one of Naive's core offerings, so it belongs on the marketing site as well as in these docs.

This article is the master draft for the demo. It covers the Naive version of every Next.js Getting Started chapter. The demo leads with these four, and the rest follow below them:

| Next.js page | Naive page | One-line idea |
| --- | --- | --- |
| Installation | Installation | Install the plugin, get a workspace, create a venture |
| Project structure | Project structure | A venture is folders of records, and the org chart lives in venture.json |
| Layouts and pages | Layouts and pages | AGENTS.md is the layout, a record is the page |
| Linking and navigating | Linking and navigation | A person decides by default; precog, streaming and handoffs keep things moving |

The one idea under all of it: **the relationship between server and client in Next.js is the relationship between humans and agents in Naive.**

We iterate here first. The docs site is updated once this article settles.

## Installation

Install Naive into the agent you already use. In Claude Code that is two commands, and you never touch Node yourself:

```text
/plugin marketplace add tchjhnsn/naive-plugins
/plugin install naive@naive
```

Then tell the agent what you're building. It asks who is founding it and what kind of venture it is, confirms the type with you, and creates the venture. Unless you name it, your first venture is My first venture, in my-first-venture/. You can rename it any time.

### You get a Naive workspace

Installing Naive gives you one workspace for all your ventures, the way a monorepo holds many packages.

- `naive-workspace.json` names the workspace (Naive workspace until you rename it), lists its ventures, and holds its settings: whether one venture may read another's published artifacts (on by default) and how sure Naive must be before it routes an idea without asking (0.8). Offline, these settings are your workspace configuration.
- The workspace `AGENTS.md` holds your rules across every venture: who you are, how you work, what's off limits.
- You and your connections (GitHub, Rho and so on) are shared across ventures. A founder in two ventures is one person. A teammate keeps their own workspace and adds the ventures they work for into it; each venture keeps its own settings.

### Bring what you already have

You don't restructure anything on install. naive port moves an existing folder into a venture as it is, names it in meta/sources.json as a source of truth and logs the move. Later, a migration skill reads it, works out what it is, and proposes where each piece goes in a venture. The proposals are drafts you approve, so nothing is overwritten.

### A marketing site, if you need one

Setup asks one question: do you have a marketing site?

- **Yes:** move it into the workspace, or point to where it lives.
- **No:** Naive recommends Next.js and creates a starter site in `codebase/`. It builds its pages from each folder's `public.json`.

This site is for marketing only, not for engineering your product. The starter lives in Naive's marketing package (free, offline). The agents that draft, publish and keep it in step with your records are Mentura's marketing kit.

## Project structure

A venture is a folder of records, organised so the folder tree itself teaches the founder how the business fits together.

```text
my-workspace/
  naive-workspace.json   # the ventures in this workspace
  AGENTS.md              # your rules across every venture
  acme-labs/             # one venture
    venture.json         # who the venture is, and its org chart
    README.md            # the venture, for people
    AGENTS.md            # this venture's rules for agents
    k-base/           # the knowledge base
      raw/               # what we started from
      foundation/        # why, and for whom
      product/           # what we offer
      customers/         # who we serve
      marketing/         # how they find us
      people/            # who does the work
      money/             # how money flows
      decisions/         # what we decided
      evidence/          # what we know
      _private/  _drafts/
    codebase/                # optional: code, such as the marketing site
    meta/                # about the venture: sources, config, provenance, releases
```

### Top-level folders

| Folder | What it holds |
| --- | --- |
| `k-base/` | Every record about the business, one folder per question a founder must answer |
| `codebase/` | Optional code, like `src/` in Next.js. By default, the marketing site |
| `meta/` | Records about the venture itself: `sources.json`, config, the provenance log, releases |

### Every folder explains itself

Each folder in `k-base/` has a `README.md`, written by create-venture from its package. It says what the folder is for, what goes in it, what a good record looks like, and who owns it. GitHub and editors show it when you open the folder.

```text
k-base/
  money/
    README.md      # for people: what this folder is for and how to use it
    AGENTS.md      # optional, for agents: instructions for this folder
    accounts/
```

README.md is for people and AGENTS.md is for agents. Agents read both.

### Functions live in venture.json

The org chart is declared once, in `venture.json`, and every folder and record inherits its function from it. A new venture starts flat: one function per folder, all owned by the founder.

```json
"functions": {
  "foundation": { "owner": "maya-chen" },
  "marketing":  { "owner": "maya-chen" },
  "money":      { "owner": "maya-chen" }
}
```

To make your own function, declare it and list the folders it runs:

```json
"growth": { "owner": "sam-lee", "contributors": ["maya-chen"],
            "packages": ["marketing", "customers", "money"] }
```

A `(growth)/` folder on disk is optional and only for viewing. `naive group growth marketing customers money` declares the function and moves the folders in one step. This works like React Context: one provider at the top, read everywhere below.

Each business function is defined like code, with what it reads, what it writes and who may take each action, and functions can be composed. The exact format is in API Reference, and composing one step by step is in Guides.

### A route is just the path

A record's address is its file path inside `k-base/`, without `(group)` folders or the extension. `k-base/(growth)/marketing/brand.json` is `marketing/brand`. Skills teach agents where files go, and `naive check` makes sure they did.

## Layouts and pages

In Next.js a layout wraps every page below it, and a page is what a route shows. In Naive an `AGENTS.md` file is the layout, and a record is the page.

### Pages are records

A record is one JSON or Markdown file, such as `foundation/problem.json` or `customers/acme-clinic.json`. Its record type says what it holds and where it goes. A collection is a folder of items, like a dynamic segment: one file per customer, per product, per decision.

### AGENTS.md is the layout

Before an agent reads or writes a record, Naive hands it every `AGENTS.md` from the workspace down to that record, plus the record's schema and the actions it may take. Layouts nest, and the nearer file wins when two say the same thing.

| Level | File | What it says |
| --- | --- | --- |
| Workspace | `my-workspace/AGENTS.md` | You across every venture: voice, limits, how you like to work |
| Venture | `acme-labs/AGENTS.md` | This venture: its phase, its audience, what's private |
| Function | `k-base/(growth)/AGENTS.md` | One function's instructions, such as marketing's voice |
| Folder | `k-base/marketing/AGENTS.md` | One folder's specifics |

Lines shaped `key: value` are instructions Naive reads; the rest is prose for the agent.

```markdown
phase: discovery
voice: plain words, in the founder's own terms
audience: clinic owners
```

### The layout stays, the page changes

Within one working session the layout is sent once and kept. Moving to a sibling record swaps only that record's part, the way a Next.js layout stays mounted while the page changes. What changes on every action, the ranking of what's needed now and the open decisions, is always fresh.

## Linking and navigation

In Naive, decisions are made by a person by default. Agents wait for the founder's approval before a new decision takes effect. Naive comes with built-in **precog**, **streaming** and **handoffs**, so the venture keeps moving while the founder decides.

> Next.js: "In Next.js, routes are rendered on the server by default. This often means the client has to wait for a server response before a new route can be shown. Next.js comes with built-in prefetching, streaming, and client-side transitions ensuring navigation stays fast and responsive."

| Next.js | Naive | What it means |
| --- | --- | --- |
| Server rendering by default | A person decides by default | No agent can settle a decision. It waits for the founder. |
| Prefetching | Precog (precognitive decision drafting) | Agents draft the next likely decisions before the founder reaches them |
| Streaming | Streaming | A decision shows what's known now and fills in as evidence arrives |
| Client-side transitions | Handoffs | Agents carry the work and its context into the next sprint, campaign, initiative or phase, with the founder's approval |

### A person decides by default

The docket shows which decision needs you first. It ranks decisions inside each function, then ranks the functions against each other, so one decision can outweigh a whole function. The ranking is code, with no model call. An agent can propose a decision, but it stays open until a person decides it.

### Precog

Next.js prefetches the routes you are likely to visit, so the page is ready when you click. Precog does this for decisions. The docket knows which decisions come next, so agents draft them ahead: the question, the options, the evidence each needs and a recommendation. When you get there, the decision is waiting to be approved or changed. A drafted decision never takes effect on its own.

### Streaming

A decision shows what's known now, marks what's still unknown, and fills in as research arrives. You can decide early on what's known, or wait for more. Reads stream too: an agent gets a record's header before its body, and a slow part comes back as pending instead of holding up the answer.

### Handoffs

A client-side transition changes the page without reloading the app, so state survives. A handoff moves the venture from one stretch of work to the next without losing what it knows: sprint to sprint, campaign to campaign, an initiative into its follow-up, or one phase to the next, such as discovery to validation. An agent prepares the handoff (what was done, what was decided, what carries over, what the next stretch needs) and the founder approves it.

### What's built today

| Piece | Status |
| --- | --- |
| A person decides by default; agents only propose | Built |
| Docket ranking what comes next | Built |
| Reads stream, with pending parts | Built |
| Handoff records for delegated work | Built |
| Precog drafting the next decisions on its own | Not built |
| Decisions that fill in as evidence arrives | Not built |
| Handoffs between sprints, campaigns, initiatives and phases | Not built |

## The venture lifecycle

Every venture is in one of five phases, and Naive always shows where you are and what comes next.

| Phase | The question it answers | Its gate |
| --- | --- | --- |
| Discovery | Does a real problem exist, and who has it? | Problem-solution fit |
| Validation | Will people adopt this solution and keep using it? | Product-market fit: retention holds |
| Beachhead | Can it win one segment repeatably, at a profitable cost? | Repeatability |
| Scale | How fast can it take the mass market? | Market leadership with healthy margins |
| Platform | What will others build on, so the venture can't be displaced? | Others build on it |

### Where you are

The phase is the `phase` field in `venture.json`. The docket opens with it, for example `acme-labs (discovery)`, and the venture package records it in every version.

### What's next

The docket ranks the decisions this phase needs. Decisions needed in a later phase are held back until then. Packages that fit the next phase are shown as coming next, so you can see the road ahead without it crowding today.

### Moving on

Changing phase is a person's decision. An agent can suggest it, never make it:

```sh
naive phase --meet ten-clinics --evidence "evidence/clinic-interviews"
naive phase validation --reason "Ten clinics confirmed the problem"
```

Records that depend on the phase go stale and are revalidated, and the venture package starts a new version.

### What's built

| Piece | State |
| --- | --- |
| `phase` in venture.json, five phases with their questions and gates | Built |
| Decisions and packages filtered by phase, next phase previewed | Built |
| `mentura phase`, person only, stales per-phase records | Built |
| A warning when the current phase has no exit criteria | Built (`schema/check-telos.mjs`) |
| Checking the gate's exit criteria before a phase change | Built (schema/lifecycle.mjs): the phase changes only when every exit criterion is met, unless a person overrides with a reason |
| A lifecycle view (where you are, how far to the next gate): naive phase | Not built |

How phases shape the rest of Naive is in Architecture.

## Humans and agents

The relationship between server and client in Next.js is the relationship between humans and agents in Naive. The person is the server: the source of authority, where decisions are made by default. The agent is the client: fast, interactive, close to the work, and always acting on what the person has made available to it.

| Next.js | Naive |
| --- | --- |
| Server Components by default | People decide by default |
| Client Components, added where you need interactivity | Agents, added where you need work done |
| `"use client"` marks the boundary | A function's actions marked `agent` mark the boundary |
| Server-only code and secrets never reach the client | `_private/` and person-only actions never reach an agent |
| Props passed from server to client | Context passed from person to agent: layouts, records, the docket |
| Server Actions called from the client | Proposals and drafts an agent sends up for a person to accept |

**Agents never hold authority.** An agent can read what it is given, do the work, and propose. Everything that settles the venture, a decision, a foundation statement, a publication, goes back to a person, the way a client sends a mutation back to the server.

This replaces the earlier docs framing, where code was the server and a model was the client. Code still decides what is allowed; it is the protocol between the two, not one of them.

## Fetching data

In Next.js the server fetches data and hands it to the page. In Naive an agent reads what a person has made available: records in `k-base/`, and the outside systems named in `meta/sources.json`.

- **Records:** an agent reads a record by its path. It gets the header first (what the record is, its state, its owner, what the body costs in tokens) and reads on only if it needs to.
- **Outside systems:** a record kept somewhere else (GitHub, Rho, Stripe) is read from there, not copied. `sources.json` says which system holds the truth for each function.
- Research: an agent can look things up on the web, and what it finds comes back as evidence with its source, not as fact. Other ventures: from one venture you read another's published artifacts only, never its records, with naive read \<venture> \<path>, when the workspace allows it. Each read is logged. One prompt, many ventures: naive capture saves your prompt in the workspace raw/, splits it into ideas and sends each to its venture's inbox as a draft. An idea Naive is unsure of waits in the workspace inbox until you pick its venture with naive inbox.

Your own files are referenced as the source of truth until you approve converting them, and anything read from them must fit its record type. See Guides.

## Updating data

In Next.js a Server Action changes data and returns the updated page. In Naive every change is a write to a record, and what happens to it depends on who wrote it.

- **A person writes:** the record changes, is checked against its schema, and is logged in the provenance log.
- **An agent writes:** ordinary records change the same way. A record only a person can settle (a decision, a foundation statement) lands in `_drafts/` instead, and waits for the person to accept it.
- **Every write answers with what changed and where to go next**, the way a Server Action can redirect to the next page.

Every change is logged in `meta/provenance.jsonl`. Its fields are in API Reference, and how the chain works is in Architecture.

## Caching

In Next.js `use cache` stores a result until its inputs change. In Naive the same applies to work agents have already done: a computed answer (such as the ranking of what's needed now) and a model's judgment are kept until the venture changes, then worked out fresh.

- Every cached value has a life, after which it is redone.
- A model's judgment is asked once per state of the venture, not on every read.
- Private results stay with the one person they belong to.

## Revalidating

Next.js refreshes cached data by time or on demand. Naive does the same for records, because evidence ages and a record goes stale when what it rests on changes.

- **By time:** evidence has a shelf life. Market research from last year is marked stale.
- **On demand:** when a record changes, everything that rests on it is marked stale. Change your ideal customer, and the positioning built on it is flagged.
- **By phase:** moving to a new phase rechecks the records that phase depends on.

A stale record is redone by an agent or verified by a person; it is never silently trusted.

## Error handling

Next.js separates expected errors, returned as values, from uncaught exceptions caught by error boundaries. Naive does the same.

- **Expected errors** are answers that say what failed and how to fix it: a write that doesn't match its schema, an action an agent may not take, a composition with unclear authority.
- **Uncaught failures** are contained: one bad record or one failing package doesn't take the venture down.
- **Unknown is not an error.** When there is no evidence, Naive says unknown and proposes how to find out, instead of guessing.

Data fetched from an unconverted file or an outside system that doesn't fit its record type is an expected error, `does-not-compile`, never a silent guess. See Fetching data.

## Styling

Next.js styles pages with CSS. Naive styles everything the venture produces with its brand: tokens (colors, type, spacing) and a voice. Every agent and every interface reads the same brand record, so a post, a page and an email all sound and look like one company. A nearer brand file wins, so a product or campaign can carry its own.

## Images and fonts

Next.js optimizes images and fonts. Naive keeps track of the right to use them. Every logo, image and font is registered with its license and source, and each image has confirmed alt text. An agent can only use an asset the venture has the right to ship.

## Metadata

In Next.js metadata describes a page to search engines and browsers. In Naive every record and every venture describes itself: what it is, its state (missing, draft, agent-written, confirmed), its owner, its function and its phase. Agents read this first, before the body. `Records are never what gets published; artifacts are. Each artifact is a record in artifacts/<id>.json naming the records it was built from, and naive check marks it stale when one of them changes`.

## Actions

In Next.js route handlers expose a backend. In Naive a function's actions are the backend: research, draft, propose-decision, confirm, publish. Each action says who may take it. Agents call the actions marked `agent`; the rest wait for a person. The same actions are available from the command line, over MCP and over a local API, so every harness sees the same rules.

## The gate

Next.js's proxy runs before every request. Naive's gate runs before every write. It decides whether an agent's write lands, becomes a draft for a person, goes to the function's owner, or is refused. The venture's own settings live in `meta/naive.config.json`, like `next.config.js`: which functions fail closed, who reviews what, and how confident an agent must be to write without asking.

## Releasing

Next.js builds and deploys an app. Naive builds a release: a frozen copy of every record a person confirmed, to hand to an investor, a cofounder or a partner. What must stay live (open decisions, money, fields another system keeps) is left as a named hole. Drafts, notes, raw inputs and anything private never ship. Releases are kept in `meta/releases/`.

## Upgrading

`next upgrade` becomes `naive upgrade`. It moves a venture onto the installed version of Naive, and migrations rewrite records the way codemods rewrite code. An agent can work the upgrade, and the checks decide whether it succeeded. Packages can be pinned, or adopted early before their stable release.

## Plugins and MCP

Naive runs inside the agent you already use. In Claude Code it is a plugin from the `tchjhnsn/naive-plugins` marketplace. Other harnesses (Cursor, Codex, Claude Desktop) reach the same venture through Naive's MCP server, with the same actions and the same rules. Outside a venture the plugin offers one tool, to create a venture; inside one, it offers the full set.

## Open questions

- [x] venture.json and README.md stay at the venture's root; `meta/` holds the rest.
- [x] Folder names: `k-base/` for the knowledge base, `codebase/` for code.
- [ ] `meta/` or `_meta/`? (Drafted as `meta/`, since an underscore means private in Naive.)
- [ ] Does `codebase/` hold the code itself, or point to a repository elsewhere? (Drafted as holding it.)
- [ ] `public.json` in every folder, or only where something is publishable? (Drafted as only where needed.)
- [ ] Workspace file name: `naive-workspace.json`, or something shorter?
- [ ] For the demo, do we show precog and phase handoffs as not built yet, or build a thin version first?
