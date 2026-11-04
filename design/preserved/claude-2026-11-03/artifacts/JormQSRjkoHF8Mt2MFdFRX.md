<!-- exported 2026-11-03 from https://claude.ai/artifact/JormQSRjkoHF8Mt2MFdFRX (Claude Docs id 90363d61-c650-4dba-a897-92c5554f5246) -->
# Naive and Next.js: section correlation

Oct 29, 2026 · @Torian

Naive's documentation is modelled on the Next.js docs: a Getting Started tab, then Guides, API Reference, Architecture and Glossary tabs. This page keeps the link between the two, so the Naive docs themselves don't have to keep referring to Next.js. The one idea behind it: Next.js's server and client are Naive's humans and agents.

## Section by section

| Naive section | Next.js page | What changes in translation |
| --- | --- | --- |
| Installation | [Installation](https://nextjs.org/docs/app/getting-started/installation) | `create-next-app` becomes the Claude Code plugin and create-venture; installing gives you a workspace for many ventures |
| Project structure | [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) | The app becomes a venture: `k-base/`, `codebase/`, `meta/`; the org chart lives in venture.json; a route is the file's path |
| Layouts and pages | [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) | A layout is `AGENTS.md`; a page is a record |
| Linking and navigation | [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) | Server rendering by default becomes a person deciding by default; prefetching becomes precog; client-side transitions become handoffs |
| The venture lifecycle | none | Naive's own: five phases with gates, where the venture is and what it needs next |
| Humans and agents | [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | The server is the person, the client is the agent |
| Fetching data | [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) | Agents read records, outside systems and unconverted files; fetched data must compile |
| Updating data | [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) | Server Actions become writes; agent writes to person-only records become drafts; every change is logged |
| Caching | [Caching](https://nextjs.org/docs/app/getting-started/caching) | Cached results and model judgments, kept until the venture changes |
| Revalidating | [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating) | Records go stale by time, on demand and by phase |
| Error handling | [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) | Expected errors are answers; unknown is not an error; data that doesn't compile is refused |
| Styling | [CSS](https://nextjs.org/docs/app/getting-started/css) | CSS becomes the brand: tokens and voice |
| Images and fonts | [Image Optimization](https://nextjs.org/docs/app/getting-started/images), [Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) | Optimisation becomes the right to use each asset, with licences and alt text |
| Metadata | [Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) | Every record and venture describes itself; `public.json` says what may go out |
| Actions | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) | A function's actions are the backend, each marked agent or person |
| The gate | [Proxy](https://nextjs.org/docs/app/getting-started/proxy) | The proxy runs before every request; the gate runs before every write |
| Releasing | [Deploying](https://nextjs.org/docs/app/getting-started/deploying) | A deploy becomes a release of confirmed records, with live holes |
| Upgrading | [Upgrading](https://nextjs.org/docs/app/getting-started/upgrading) | `next upgrade` becomes `naive upgrade`; codemods become migrations |
| Plugins and MCP | none | Naive's own: running inside any agent harness |

## Beyond Getting Started

| Naive tab | Next.js section | What changes in translation |
| --- | --- | --- |
| Guides | [Guides](https://nextjs.org/docs/app/guides) | Jobs a founder does after getting started: composing a function, bringing in an existing project, setting up a marketing site |
| API Reference | [API Reference](https://nextjs.org/docs/app/api-reference) | Next.js documents its files, functions and config; Naive documents venture.json, function.json, each business function (foundation first), the provenance log, error codes and file conventions |
| Architecture | [Architecture](https://nextjs.org/docs/architecture) | Next.js explains its compiler and rendering; Naive explains how a write flows, the provenance chain, skills tell and code checks, dependencies between functions, and the line between Naive and Mentura |
| Glossary | [Glossary](https://nextjs.org/docs/app/glossary) | The same job: one table of terms |

## Where the detail moved

Getting Started now only gets people started. The detail it used to carry lives in the other tabs. None of it has a Next.js page of its own.

| Material | Was in | Now in |
| --- | --- | --- |
| Functions defined like code | Project structure | API Reference |
| Composing functions, authority | Getting Started | Guides, with the error codes in API Reference |
| The foundation function in full | Getting Started | API Reference |
| File conventions | Project structure | API Reference |
| Data provenance | Updating data | API Reference (the log), Architecture (the chain) |
| Unconverted files | Fetching data | Guides (bringing in an existing project) |

Getting Started titles and links are from the [Next.js Getting Started index](https://nextjs.org/docs/app/getting-started). Once this page is settled, the master article can drop its Next.js references.
