# Mentura

Mentura is hosted Naive. Naive is the venture development framework (tchjhnsn/naive), and Mentura runs it for you: you sign in, open a business, and work it from the business console at https://mentura.xyz.

## What Mentura does

- **Business console.** `/` opens the console at `/studio`. Each business has its phase, its functions and their tools, its files and its decisions. The console says business, and code, routes and Naive say venture.
- **Teams.** A team owns businesses. Its members are an Owner, Members and Viewers, and a person can be on teams they do not own. Every person starts with a personal team.
- **Integrations.** Each person connects their own accounts to a business, and Naive reads records from them.
- **Hosted business store.** Each team's records sit in Postgres (Neon) as Naive records, append-only and isolated by team.
- **Offline sync.** You can work a business as files on your own machine and sync it with `naive sync pull` and `naive sync push`. The Naive command line signs in with a device code at `/device`.
- **Meetings.** Meetings with agendas, notes, follow-ups and guest invites.

## Where things are

| Path | Holds |
|---|---|
| `web/` | The web app (Next.js) that serves Mentura. See [web/README.md](web/README.md) |
| `packages/platform/` | Mentura's platform library: the connectors, the hosted business store, integrations, the agents over Naive, the outside host, and `bridge/`, the one door from the web server into Naive. See [packages/platform/README.md](packages/platform/README.md) |
| `tools/ontology/` | The ontology program's scripts. See [tools/ontology/README.md](tools/ontology/README.md) |
| `docs/mentura/` | Mentura's company docs and the decision log (`EE-NNN`). See [docs/mentura/README.md](docs/mentura/README.md) |

## Other products kept here

This repository also holds two separate products until each has a repository of its own. Neither is part of Mentura.

- **Reflect**, the person's own life and learning: the headless core (`packages/core/`), the `reflect` command (`packages/cli/`), its GitHub Action (`action/`), its copy of Virtu (`packages/virtu/`), its Lean proofs (`lean/`), its designs (`docs/design/`), the original Python engine (`thrivesight_core/`) and its Django backend (`api/`). Its pages are in `web/` under "Reflect".
- **Village and polis**, the shared side at https://polis.mentura.xyz. Its pages are in `web/` under "Village and polis".

## Build and test

- `cd web && pnpm install && pnpm test` runs the web app's, Reflect's core's and the CLI's tests. `pnpm typecheck` type-checks them. See [web/README.md](web/README.md) for the environment and the other commands.
- `cd packages/platform && npm install && npm test` runs the platform library's tests. Its install needs read access to tchjhnsn/naive (`NAIVE_READ_TOKEN`).
- `cd tools/ontology && npm install && npm test` runs the ontology program's tests.
- CI runs `.github/workflows/platform.yml`, `ontology.yml` and `lean.yml`.

## License

[Apache License 2.0](./LICENSE).
