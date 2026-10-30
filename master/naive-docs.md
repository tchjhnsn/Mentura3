<!-- Exported from the master article https://claude.ai/artifact/JzodSs3wxHfS4BMaQydXFV. Edit it there, not here. -->
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
