# AGENTS.md: mentura3

The map of this repo, loaded by every agent. Keep it to about a page; details belong in `docs/` and folder READMEs.

## What this is

Mentura, hosted Naive: the business console at https://mentura.xyz, with Teams (Owner, Member, Viewer), Integrations, the hosted business store, offline sync through `naive sync`, and Meetings. Naive, the venture development framework, has its own repository, tchjhnsn/naive. This repository was tchjhnsn/reflect until it became Mentura's.

In product copy and in replies, the product is Mentura. Reflect is a separate product, and so is Village and polis. In the interface, say business, not venture. Code, routes and Naive keep venture.

## Where things are

| Path | Holds |
|---|---|
| `web/` | The web app (Next.js) that serves Mentura, plus the pages of the two other products until each has a host of its own; its README lists them by product. See `web/README.md` |
| `packages/platform/` | Mentura's platform library: connectors (GitHub, Postgres, MCP), the hosted business store (`hosted/`), integrations, kits, webhooks, the research engine, the agents over Naive, the outside host and `bridge/`, the one door from the web server into Naive. Depends on `naive-framework` pinned to one commit of tchjhnsn/naive. See `packages/platform/README.md` |
| `tools/ontology/` | The ontology program's scripts (ledger import, reconcile runner, agreement and closure reports, preservation coverage). See `tools/ontology/README.md` |
| `docs/mentura/` | Mentura's company docs and the decision log (`decisions/decisions.json`, `EE-NNN`). See `docs/mentura/README.md` |
| `packages/core/`, `packages/cli/`, `action/`, `packages/virtu/`, `lean/`, `docs/design/`, `thrivesight_core/`, `api/` | Reflect, a separate product kept here: its headless core, its `reflect` command, its GitHub Action, its copy of Virtu, its Lean proofs, its designs, and its original Python engine and Django backend. Mentura's web app imports `packages/core/` as `@reflect/core` |

## Build and test

- `cd web && pnpm test` runs the web app's, the core's and the CLI's tests (the Neon ones only with `DATABASE_URL`); `pnpm typecheck` type-checks them.
- `cd packages/platform && npm install && npm test` runs the platform library's tests; `npx tsc -p tsconfig.json` type-checks it. Its install needs read access to tchjhnsn/naive (`NAIVE_READ_TOKEN`, see `packages/platform/README.md`).
- `cd tools/ontology && npm install && npm test` runs the ontology program's tests.
- `cd lean && lake build` builds Reflect's Lean proofs.
- CI: `.github/workflows/platform.yml`, `ontology.yml` and `lean.yml`.

## Rules

- Never read or print `.env*` files. Refer to secrets by variable name only.
- Governing decisions are cited by id (`G-NNN` workspace, `D-NNN` Polity, `EE-NNN` Mentura), not by vault path, because this repo may be cloned alone.
- Agents open draft PRs and merge their own on green CI (Torian, 2026-11-07).
