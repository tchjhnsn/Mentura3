---
publish: false
type: design-note
source: hybrid
created: 2026-10-27T20:32:17Z
ai-model: claude-opus-5.5
authority: advisory
status: DRAFT
tags: [everything-ecosystem, mentura, routing, interfaces, mcp, cli, api, documentation]
description: "Notes for the owner's next asks: how the system explains itself as docs-as-code, whether it needs a routing system like Next.js, whether Next.js is the right comparison, and how one route table could serve a CLI, an MCP server and an API, with partial adoption."
---

# Routing and interfaces (notes, 2026-10-27)

Working name: Mentura (EE-027, proposed). The owner's asks, recorded for later work:

1. Explain the system's concepts in its own documentation, as code.
2. Offer it as an MCP server, an API and a CLI, with a skill that installs it into a coding agent.
3. Let a builder use one layer, one kit or one record without adopting the whole system.
4. Consider a routing system like Next.js has, and whether Next.js is the right comparison.

## Kit and template

- A **kit** is a package that a layer offers. It bundles skills, record types (schemas), checks, templates and references, and its checks enforce rules. Each layer has a kit at `<layer>/kit.json` and may hold more under `<layer>/kits/` (EE-026).
- A **template** is a fill-in starting point for one record or document: its fields, what to write in each, and what a strong one looks like. A template holds no rules and checks nothing.
- A kit contains templates. The kit's checks decide whether a filled-in record is weak or strong. Example: the validation kit's `templates/problem.md` shows a problem record, and `check-validation.mjs` grades it.

## Is Next.js the right comparison?

Partly. The genus is "framework" (EE-024). Two web frameworks are useful, each for a different part:

| Likeness | Closest framework | Why |
| --- | --- | --- |
| Conventions over configuration, generators, one opinionated default per choice | Ruby on Rails | Rails made these the model; `init-venture` is a generator in that sense |
| One builder doing a team's work | Ruby on Rails ("the one person framework") | The same promise, with agents as the team |
| Routing by folder structure, layouts that wrap every page beneath them, middleware that runs before a route | Next.js (App Router) | Matches layers, kits and the gates |
| Incremental adoption: use one part without the rest | Next.js, and packages generally | A builder can call one kit |

Recommendation: keep the genus "venture development framework". Use Rails as the main reference for conventions and the one-person promise, and Next.js as the reference for routing and adoption. Both still need recording with `find-reference`.

## A routing system for Mentura

Yes. Today, routing is implicit: an agent picks a skill from its `MANDATORY TRIGGERS` text, and the orchestrator skill (`knowledge/SKILL.md`, due to move to the system kit) routes across layers. An explicit route table would make routing checkable and give the interfaces one source.

| Next.js (App Router) | Mentura |
| --- | --- |
| A folder path is a route (`app/blog/[slug]/page.tsx`) | A kit path is a route: `<layer>/<kit>/<skill or record>`, e.g. `purpose/validation/problem` |
| `layout.tsx` wraps every page below it | A layer's context wraps every call under it: the venture profile, telos and decision rights are loaded once |
| `route.ts` handlers (GET, POST) | A record's actions: `read`, `write`, `check`, `grade`, `template` |
| Middleware runs before a route | Gates run before an action: readiness check, decision rights, the publication gate |
| Dynamic segments (`[slug]`) | The venture: `/<venture>/purpose/validation/problem` |

The route table would be generated from the kit manifests and the data model, as the layer graph is, so it can never drift from the files.

## One route table, three interfaces

- **CLI:** `mentura <venture> purpose/validation/problem grade`. The scripts in `schema/` become its commands.
- **MCP server:** each route's actions become tools, records become resources, and templates become prompts.
- **API:** the same routes over HTTP, for apps and other agents.
- **Install skill:** writes the MCP configuration into Claude Code or Cursor and runs `init-venture` only when the builder wants a whole venture.

**Partial adoption.** A route works without the rest of the system. It needs only its own record and whatever records its kit manifest `reads`. A missing input becomes a question to the builder, not a requirement to adopt another layer. This also serves the promise to prevent overbuilding.

## Documentation, as code

- Each kit has a README: what it is for, its routes, templates and checks.
- Reference pages are generated from the manifests, as the layer graph and the glossary are, and `test.mjs` fails when they are stale.
- The concepts (venture, layer, kit, template, record, evidence grade, gate) get a guide page each, built from `docs/ontology.json`.

## Next steps

Built on 2026-10-27 (EE-030): the router (`interface/router.mjs`); the CLI, the MCP server and the local HTTP API over it; the install skill; `init --layers` for partial adoption; and the generated route table in `docs/reference/ROUTES.md`, with a freshness test. Built next (EE-032): every Next.js route type that applies, mapped in `docs/reference/ROUTES.md`. Still open: the operator console rendering views on the same router, authentication if the API ever leaves one machine, MAD tiers as route groups once record types declare a tier, and generated reference pages for each kit.
