---
publish: false
type: design-note
source: hybrid
created: 2026-10-29T16:50:00Z
updated: 2026-10-29T16:50:00Z
ai-model: claude-opus-5.5
authority: implementation
status: DRAFT
tags: [everything-ecosystem, naive, project-structure, functions, routing, knowledge-base, meta, repo]
description: "The venture project structure Torian locked on 2026-10-29 (EE-086): venture.json, README.md and AGENTS.md at the top; knowledge/ for the knowledge base, meta/ for what is about the venture, and an optional repo/ for code; functions declared once in venture.json, with packages flat by default and (group)/ folders as an optional view; a record's route is its path; skills teach where files go, and code guarantees the rest. The page it was decided on: https://claude.ai/artifact/WZQFGTQyqkH2huBXXhGbWq"
---

# Venture project structure

Torian locked this on 2026-10-29, on the page "Venture Project Structure" (versions 2 to 4): version 4 at 16:35, the routing simplification at 16:47. The answers marked *default* are Claude's recommendations, used until Torian says otherwise.

## The top level

```text
acme-labs/
  venture.json   who the venture is, and its org chart (functions)
  README.md      what the venture is, for people (was profile.md)
  AGENTS.md      the root layout: what every agent reads first
  knowledge/     the knowledge base
  repo/          optional: the code base, the way src/ is optional in Next.js (default: it holds the code)
  meta/          about the venture: sources.json, naive.config.json, provenance.jsonl, releases/ (default: meta/, not _meta/)
```

`venture.json` stays at the top (*default*), so it is the first file anyone sees. `package.json` and `.gitignore` sit beside it when the framework is installed.

## The knowledge base

Packages sit flat in `knowledge/`, one folder per question a founder answers: `raw/`, `foundation/`, `product/`, `customers/`, `marketing/`, `people/`, `money/`, `decisions/` and `evidence/`. A venture type adds its own folders and drops the ones it does not use; a fund, for example, adds `fund/`, `deals/` and `portfolio/`. `_private/` and `_drafts/` keep their meanings.

A function declares what it may publish in a `public.json` in its package folder, and only where it has something publishable (*default*). Each item names the record it comes from, the wording that may go out, the audience, and the person who approved it. Marketing agents read these files and nothing else.

## Functions: the org chart lives in venture.json

`venture.json` declares the venture's business functions once, and every package and record inherits its function from there. This is React Context: a provider at the root, read below. The closest real precedent is GitHub's `CODEOWNERS`, one file at the root that assigns owners to parts of a project.

- **A new venture starts with a flat org chart:** one function per package, named after it, each owned by the founder. `create-venture` writes it, and on a team it writes the owners the founders chose.
- **A founder composes their own functions** by declaring one that lists several packages, such as `growth` over `marketing`, `customers` and `money`, with one owner and any contributors.
- **`decisions/`, `evidence/` and `raw/` belong to the whole venture,** not to one function.
- **`(group)/` folders on disk are optional,** a view of the org chart and a place for a function's own `AGENTS.md`. `naive group` writes the declaration and moves the folders in one step. A check flags a group folder that disagrees with `venture.json`.
- **Hats come from the org chart.** A person wears a hat because `venture.json` names them a function's owner. `people/people.json` stops storing hats, so the two can never disagree.
- **`departments` in `venture.json` becomes `functions`.** This finishes the rename EE-071 began, and `naive upgrade` converts it.
- **The word is "function":** "business function" on first use, "function" after. A role *carries out* functions. The role registry lists the functions each role usually carries out, and setup uses that to suggest owners.

## Routes are paths

A record's route is its path inside `knowledge/`, with `(group)/` folders and the extension dropped: `knowledge/(growth)/marketing/brand.json` is `marketing/brand`. There is no name-mapping table and no reserved route name, so `public.json` is just a file. Aliases exist only while `naive upgrade` moves an existing venture.

**Skills tell, code guarantees.** Skills teach agents where files go. Five things hold whatever the agent does, because code enforces them:

1. every record matches its schema
2. only a person settles a decision or a foundation statement
3. nothing in `_private/` reaches a model
4. every write is recorded in `meta/provenance.jsonl`
5. a record kept in another system (GitHub, Rho) is written there

Agents write ordinary files directly. The plugin's hook checks each write in Claude Code, and `naive check` catches the same things before a commit or in CI. Writes to gated records still go through Naive's tool, so a draft never lands in the real record. The router shrinks to a small library for other systems, the gate, and MCP for harnesses that cannot write files.

## Build stages

1. This note and EE-086.
2. The layout and the org chart: `init-venture`, `create-venture`, `venture.json` `functions`, `README.md`, `meta/`, and the people check deriving hats.
3. Routes as paths: the router, `naive upgrade` with temporary aliases, the example and demo ventures, and the docs.
4. The plugin's write hook.

Each stage is its own pull request, and leaves `node test.mjs` passing.
