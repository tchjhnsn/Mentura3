---
type: reference
source: hybrid
created: 2026-10-28T03:07:56Z
ai-model: claude-opus-5.5
tags: [everything-ecosystem, mentura, platform, framework, boundary]
description: "The platform side of Mentura: what lives here, the boundary with the framework, and how it is enforced (EE-041)."
---

# Platform

The system has two sides, the way Next.js and Vercel do (EE-041): the framework Naive and the platform Mentura.

- **The framework**, Naive (EE-043), is the conventions. It works offline, with no account, and names no vendor. It covers record schemas and the data model, kits, the router and the CLI, MCP server and local API over it, routes, provenance, the checks, need-now priors, validation scoring, `init-venture`, the connector contract with the filesystem connector, and the docs. It has its own repository, tchjhnsn/naive, and this repository depends on it as the `naive-framework` package (EE-118, EE-119).
- **The platform** hosts, connects and integrates. It holds connectors that reach a vendor over the network with credentials, the connect flow, integrations that call outside services (analytics, Listen Labs, Jev routing, treg), a hosted catalog and search, the operator console, and a gallery of templates. That is this folder.

A template is framework, the way `create-next-app --example` is. The gallery that hosts templates is platform.

## The boundary

The platform builds on the framework, and never the other way round. The platform imports Naive by package name (`naive-framework/src/store/connectors/contract.mjs`), never by relative path. Naive's own boundary check, run in its repository, fails when Naive names a platform or console module, or registers a connector that reaches the network or names credentials.

The platform hands its parts to Naive through Naive's hooks. That is inversion of control, like a Next.js deployment adapter: the framework defines the contract, and the platform implements it for a vendor.

| Hook | What the platform passes |
|---|---|
| `registerConnector` (`naive-framework/src/store/connectors/index.mjs`) | The GitHub and Postgres connectors, from `connectors/register.mjs`. A Naive checker run as its own process gets it with `node --import ./platform/connectors/preload.mjs` |
| `NAIVE_KITS` | This folder's `kits/`. Without it Naive has no kits |
| `NAIVE_PLATFORM_ADAPTER` | `adapter.json`. Its `verify` paths are relative to this folder |
| `NAIVE_SYNC_RHO` | `node platform/integrations/rho.mjs sync`, when a deployment syncs money from Rho. Naive runs it as `<command> --venture <dir>`; nothing sets it by default |
| `NAIVE_TRACE_CMD`, `NAIVE_JUDGE_CMD`, `NAIVE_RESEARCH_MCP`, `NAIVE_SITE_CMD` | The LangSmith exporter, the judge, the research MCP server and the site reader, when a deployment names them |

## What is here

| Path | Holds |
|---|---|
| `connectors/github.mjs` | The GitHub connector: reads from a branch, writes by draft pull request (EE-037) |
| `connectors/fake-github.mjs` | A fake of the GitHub REST API for offline evals |
| `connectors/postgres.ts` | The Postgres connector: a tenant's records in Postgres, Neon in production (EE-118 step 9). Append-only: each write is a new row, a trigger refuses UPDATE and DELETE, and each row's hash chains to the tenant's previous one (`verify`). The connection string is read from the variable `url` names (default `MENTURA_DATABASE_URL`) and never stored |
| `connectors/store-import.ts` | Loads a folder into a tenant's store through the Postgres connector, reads every file back and checks the chain: `node platform/connectors/store-import.ts instance --tenant <id> [--check]`. Running it again appends nothing. This is how `instance/` moves to Neon |
| `connectors/postgres-eval.ts` | The Postgres connector against the contract suite, the append-only trigger, tenant isolation and the import, on a real Postgres named by `MENTURA_EVAL_DATABASE_URL` (a service in CI); without it, it skips |
| `connectors/register.mjs`, `connectors/preload.mjs` | Register the GitHub and Postgres connectors with Naive, in this process or preloaded into a Naive checker |
| `connectors/eval.mjs` | The GitHub connector against the framework's contract suite (`naive-framework/src/store/connectors/suite.mjs`), its registration, the router over a GitHub source, the catalog, and an optional live run |
| `mcp/research.mjs` | Market research for agents through Firecrawl, as an MCP server: search and read a page, every result with its URL (EE-059). Needs `FIRECRAWL_API_KEY` |
| `integrations/jev.mjs` | Jev (TypeSafe) for typed judgments: sends a request the framework built, such as the idea map's tags, and prints the answers (EE-059). Needs `TYPESAFE_API_KEY` |
| `agents/` | Mentura's LangChain side over Naive (EE-121, EE-122): `NaiveBackend`, a deepagents backend over Naive's agent filesystem, and `NaiveTracer`, a callback handler that writes a run as spans in the venture's trace files. See `agents/README.md` |
| `integrations/langsmith.mjs` | Uploads a harness run's trace, with Naive's evals as feedback, to LangSmith (EE-059). Needs `LANGSMITH_API_KEY` |
| `integrations/langsmith-test.mjs` | Ships a Naive trace through the exporter to a local stand-in for LangSmith, offline |
| `integrations/langsmith-docket.mjs` | The docket's evidence as a LangSmith experiment: the scenario states as a dataset, and one scored run of the docket and the judge (Jev) as an experiment over it (EE-075). Needs `LANGSMITH_API_KEY` |
| `integrations/rho.mjs` | Rho, the founder's bank and spend suite, as the venture's money source: syncs `money/` (accounts, a sensitive append-only transactions stream, and a summary) over Rho's MCP server, calling only read-only tools (EE-070). Rho's sandbox by default; `--live` needs `RHO_API_TOKEN` |
| `integrations/remote-image.mjs`, `integrations/remote-image-test.mjs` | Fetches a remote image into a venture's register (only allowed hosts, images only, originals private in `raw/`, copies by license) and its offline test |
| `integrations/site.mjs` | Reads a venture's website: the home page and the pages it links to, as text, with where each sits (EE-062). Uses `FIRECRAWL_API_KEY` when set, a plain fetch otherwise |
| `adapter.json` | Mentura as Naive's first adapter, as Vercel is for Next.js: with `NAIVE_PLATFORM_ADAPTER` naming it, `mentura adapters verify mentura` runs the connector contract suite, the webhooks and the kits (Z-4) |
| `adapter-test.mjs` | Mentura is listed, refused as a venture adapter, and verified by those tests |
| `kits/agent-upgrade/` | The agent-run upgrade behind `naive upgrade --agent`: an agent does the guides' by-hand steps on a staged copy, and the framework's checks decide (U-3). `stand-in-agent.mjs` runs offline |
| `kits/validation-kickoff/` | An automation over the validation package: once the foundation is complete, it proposes the decision to start validating (M-12) |
| `kits/test.mjs` | Tests for the kits, with the stand-in agent |
| `webhooks/server.mjs` | Signed webhooks from systems of record: a change marks the summaries that read it stale (V-9). Secrets come from `NAIVE_WEBHOOK_SECRET_<SOURCE>` |
| `webhooks/test.mjs` | Tests for the webhooks, offline |

## Not yet moved

Each layer's `tooling/integrations.json` stays in Naive for now. Most entries are opinionated defaults with references (EE-014), plain data that calls nothing, like a framework's docs recommending a host. An entry moves here once it carries code that calls a vendor.
