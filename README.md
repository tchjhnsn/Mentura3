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

- **The framework**, Naive (EE-043), is the conventions. It works offline, with no account, and names no vendor. It covers record schemas and the data model, kits, the router and the CLI, MCP server and local API over it, routes, provenance, the checks, need-now priors, validation scoring, `init-venture`, the connector contract with the filesystem connector, and the docs. That is everything in this repository outside `platform/`.
- **The platform** hosts, connects and integrates. It holds connectors that reach a vendor over the network with credentials, the connect flow, integrations that call outside services (analytics, Listen Labs, Jev routing, treg), a hosted catalog and search, the operator console, and a gallery of templates. That is this folder.

A template is framework, the way `create-next-app --example` is. The gallery that hosts templates is platform.

## The boundary

The platform builds on the framework, and never the other way round. `node schema/check-boundary.mjs` (run by `node test.mjs`) fails when:

1. a file outside `platform/` imports anything from `platform/`;
2. a connector registered outside `platform/` reaches the network or names credentials;
3. a registered connector module does not exist.

The framework can still load a platform connector by the module path in `knowledge/tooling/integrations.json`. That is inversion of control, like a Next.js deployment adapter: the framework defines the contract, and the platform implements it for a vendor.

## What is here

| Path | Holds |
|---|---|
| `connectors/github.mjs` | The GitHub connector: reads from a branch, writes by draft pull request (EE-037) |
| `connectors/fake-github.mjs` | A fake of the GitHub REST API for offline evals |
| `connectors/eval.mjs` | The GitHub connector against the framework's contract suite (`knowledge/connectors/suite.mjs`), the router over a GitHub source, the catalog, and an optional live run |
| `mcp/research.mjs` | Market research for agents through Firecrawl, as an MCP server: search and read a page, every result with its URL (EE-059). Needs `FIRECRAWL_API_KEY` |
| `integrations/jev.mjs` | Jev (TypeSafe) for typed judgments: sends a request the framework built, such as the idea map's tags, and prints the answers (EE-059). Needs `TYPESAFE_API_KEY` |
| `integrations/langsmith.mjs` | Uploads a harness run's trace, with Naive's evals as feedback, to LangSmith (EE-059). Needs `LANGSMITH_API_KEY` |
| `integrations/langsmith-docket.mjs` | The docket's evidence as a LangSmith experiment: the scenario states as a dataset, and one scored run of the docket and the judge (Jev) as an experiment over it (EE-075). Needs `LANGSMITH_API_KEY` |
| `integrations/rho.mjs` | Rho, the founder's bank and spend suite, as the venture's money source: syncs `money/` (accounts, a sensitive append-only transactions stream, and a summary) over Rho's MCP server, calling only read-only tools (EE-070). Rho's sandbox by default; `--live` needs `RHO_API_TOKEN` |
| `integrations/site.mjs` | Reads a venture's website: the home page and the pages it links to, as text, with where each sits (EE-062). Uses `FIRECRAWL_API_KEY` when set, a plain fetch otherwise |

## Not yet moved

Each layer's `tooling/integrations.json` stays in the framework for now. Most entries are opinionated defaults with references (EE-014), plain data that calls nothing, like a framework's docs recommending a host. An entry moves here once it carries code that calls a vendor.
