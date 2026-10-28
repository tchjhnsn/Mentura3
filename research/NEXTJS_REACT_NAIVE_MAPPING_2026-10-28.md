---
publish: false
title: Mapping the Next.js and React docs to Naive
description: Every Next.js (App Router and Pages Router) and React concept, mapped one-to-one, partially, as a gap, or as not applicable to Naive, with a proposed Naive docs structure modeled on Next.js.
date: 2026-10-28
author: Grok Bot, for Torian CJ
status: research-complete
type: research
authority: exploratory
reviewer: Claude Code
---

# Mapping the Next.js and React docs to Naive

Research date: Wednesday, October 28, 2026 (all times America/Chicago, CDT).

## 0. Summary

**Goal.** Make Naive, and its docs, feel native to anyone who already knows Next.js or React. To do that, every concept in the Next.js docs (App Router and Pages Router) and the React docs is placed in one of four groups: one-to-one with Naive, partial overlap the Naive docs don't spell out yet, a gap Naive should adopt, or not applicable.

**Headline finding.** Naive is already built on the Next.js model in more places than its docs say. Two decisions in the ledger make the analogy explicit:

- EE-041 (proposed): "Mentura has two sides, as Next.js and Vercel do." The framework (Naive) is the conventions that work offline; the platform (Mentura) hosts, connects and integrates. It even says the framework "may load a platform connector by the module path the registry names, as Next.js loads a deployment adapter." (`docs/decisions/decisions.json`, EE-041)
- EE-032 (in force): "Routes follow the Next.js App Router's conventions, with layers kept as route segments so a route is its record's folder path." It then lists the Naive versions of `[id]` dynamic segments, catch-all segments, `layout`, `not-found`, `loading`, `error`, route groups, parallel slots, `robots` and redirects. (`docs/decisions/decisions.json`, EE-032)

EE-024 (proposed) names the genus: a "venture development framework, in the same genus as web development frameworks", with conventions over configuration, a fixed project structure, generators (`init-venture`), checks run like a test suite (`node test.mjs`), "packages that plug in (kits, by layer and tier)", and inversion of control.

So the strongest one-to-one matches are structural and already decided: framework and platform, file-system routing, the special route files, route groups, `create-next-app` and `init-venture`, `package.json` and `venture.json`, server-side schema validation of form input and Naive's validated writes, and the glossary. Section 5 has the full table.

**Top 5 gaps** (Section 7):

1. **A "Designing a docket" guide**, modeled on the Next.js Forms guide and React's "Reacting to Input with State". No docket record type was found in the files read, so the noun itself needs a decision first.
2. **Custom kits and "Rules of kits"**, modeled on React's "Reusing Logic with Custom Hooks", "Rules of Hooks" and `eslint-plugin-react-hooks`, including composing kits from first-party or third-party templates.
3. **A Learn track that starts with "Thinking in Naive"**, modeled on React's Learn section and "Thinking in React". React's single-source-of-truth teaching maps directly onto Naive's source-of-truth matrix (EE-042).
4. **Upgrade guides and codemods**, modeled on Next.js "Upgrading" and `npx @next/codemod`. Naive has route aliases for renames but no version numbers or migration tool in the files read.
5. **A Project Structure page and a File-system conventions reference**, modeled on the Next.js pages of those names, so each special file (`venture.json`, `kit.json`, `layout`, `not-found`, `error`, `(phase)` groups, `provenance.jsonl`) gets one reference page.

**Repo access.** I could not clone `tchjhnsn/everything-ecosystem` from my machine: `gh` is not logged in and anonymous `git clone` failed, so the repo is private or needs auth. I did not use any credential. The Naive inventory instead comes from the file contents a read-only cloud agent read from the repo today, at 2:18 PM CDT, while reviewing PR #20 (head `52d90bf`, which is `main` plus five handoff files). That transcript is on my machine. This means:

- Every Naive claim below cites a file path and is tagged **[V]** when I read that file's text in the transcript.
- Some files were read only in part (for example root `AGENTS.md` and `docs/design/LAYERS_AND_KITS_2026-10-27.md`). Claims that depend on files I did not see are tagged **[T]** (Torian said it) or **[N]** (searched the material I had, not found).
- The snapshot predates PR #21 (the Fumadocs port) and any decisions above EE-052 (draft PR #19 holds EE-053 to EE-059). Claude Code should check the inventory against current `main` before acting on it.

---

## 1. Methodology

### 1.1 Question

For each concept a Next.js or React developer already knows, what is the Naive concept, and does Naive's code or ledger already make that match, or only Torian's description of it?

### 1.2 Sources and how they were read

- **Next.js.** I downloaded the Next.js docs index for both routers (`https://nextjs.org/docs/llms.txt`, 339 lines, and `https://nextjs.org/docs/pages/llms.txt`, 206 lines) to get the full sidebar, then fetched 43 pages as Markdown with `Accept: text/markdown`. The docs report `@doc-version: 16.4.3`.
- **React.** I downloaded `https://react.dev/llms.txt` (252 lines) for the full Learn and Reference sidebar, then fetched 41 pages through their `.md` URLs.
- **Rule for overlap.** Where Next.js documents a React concept (Server Components, Server Actions, forms), I cite the Next.js page. I cite React only for concepts Next.js doesn't cover (hooks, custom hooks, state, reducers, context, effects, rules of React).
- **Naive.** Section 0 explains the access limit. Files cited were read in the PR #20 review transcript (`bc-bd1d0519`, Oct 28, 2026, 2:18 PM CDT). I extracted each file's longest read. I also used the PR #20 review I wrote earlier today (`PR20_REVIEW_2026-10-28.md`) and Torian's own statements recorded in memory.
- **Evidence tags for Naive claims:**
  - **[V]** verified in a repo file I read (path given).
  - **[T]** Torian said it; no file I read confirms it.
  - **[N]** not found in the material I had. Not proof of absence.
  - **[P]** my proposal, for Torian and Claude Code to accept or reject.

### 1.3 Limits

- No visual inspection of nextjs.org or react.dev. Page anatomy is read from the Markdown source (callout markers, code fences, component tags).
- The Naive inventory is a snapshot from one review session, not a full tree walk. The file list in Section 4.1 comes from paths named in that session.
- I did not run any Naive command.

---

## 2. Next.js docs inventory

### 2.1 How the docs are organized

- **Three sections.** "The docs are organized into 3 sections: Getting Started (step-by-step tutorials...), Guides (tutorials on specific use cases...), API Reference (detailed technical reference for every feature)." ([Next.js Docs](https://nextjs.org/docs))
- **Two routers, one switcher.** "Next.js has two different routers: App Router: The newer router that supports new React features like Server Components. Pages Router: The original router, still supported and being improved." A dropdown at the top of the sidebar switches between the App Router and Pages Router docs. ([Next.js Docs](https://nextjs.org/docs))
- **Prerequisites are stated.** The docs assume HTML, CSS, JavaScript and React, and point newcomers to the React Foundations course first. ([Next.js Docs](https://nextjs.org/docs))
- **Pages Router framing.** "Before Next.js 13, the Pages Router was the main way to create routes... It's still supported in newer versions of Next.js, but we recommend migrating to the new App Router." Every Pages Router page carries a banner pointing to the App Router. ([Pages Router](https://nextjs.org/docs/pages))
- **The routers can coexist.** The migration guide covers features "that work in both the `pages` and the `app` directories" and how to "incrementally migrate your existing application from `pages` to `app`". "Upgrading to Next.js 13 does **not** require using the App Router." ([App Router migration](https://nextjs.org/docs/app/guides/migrating/app-router-migration))
- **Other top-level sections:** Glossary, Architecture (Accessibility, Fast Refresh, Compiler, Supported Browsers), Community. ([llms.txt](https://nextjs.org/docs/llms.txt))

### 2.2 App Router sidebar (full)

From [the App Router index](https://nextjs.org/docs/llms.txt):

- **Getting Started (18 pages):** Installation, Project Structure, Layouts and Pages, Linking and Navigating, Server and Client Components, Fetching Data, Mutating Data, Caching, Revalidating, Error Handling, CSS, Image Optimization, Font Optimization, Metadata and OG images, Route Handlers, Proxy, Deploying, Upgrading.
- **Guides (about 70):** includes AI Coding Agents, Authentication, Backend for Frontend, Building, Data Security, Environment Variables, Forms, How Revalidation Works, ISR, Instrumentation, Internationalization, MDX, Migrating (App Router, Create React App, Vite), Multi-tenant, Multi-zones, Production checklist, Redirecting, Rendering Philosophy, Self-Hosting, Server Actions, Server and Client Boundary, Static Exports, Streaming, Testing (Cypress, Jest, Playwright, Vitest), Third Party Libraries, Upgrading (agent upgrade, Codemods, Versions 14 to 16).
- **API Reference:**
  - Directives: `use cache`, `use cache: private`, `use cache: remote`, `use client`, `use server`.
  - Components: Font, Form, Image, Link, Script.
  - File-system conventions: `default`, Dynamic Segments, `error`, `forbidden`, `instrumentation`, Intercepting Routes, `layout`, `loading`, `mdx-components`, `not-found`, `page`, Parallel Routes, `proxy`, `public`, `route`, Route Groups, `src`, `template`, `unauthorized`, Metadata Files, Route Segment Config.
  - Functions: about 45, including `fetch`, `cookies`, `headers`, `redirect`, `notFound`, `revalidatePath`, `revalidateTag`, `updateTag`, `generateMetadata`, `generateStaticParams`, `useRouter`, `useParams`, `usePathname`, `useSearchParams`.
  - Configuration: `next.config.js` (about 80 options, including `adapterPath`, `agentRules`, `redirects`, `rewrites`, `serverActions`, `typedRoutes`), TypeScript, ESLint.
  - CLI: `create-next-app`, `next`.
  - Adapters (12 pages), Edge Runtime, Turbopack.

### 2.3 Pages Router sidebar (full)

From [the Pages Router index](https://nextjs.org/docs/pages/llms.txt):

- **Getting Started (6):** Installation, Project Structure, Images, Fonts, CSS, Deploying.
- **Guides (about 35):** a subset of the App Router guides, plus Babel, PostCSS, Preview Mode, and upgrade guides back to Version 9.
- **Building Your Application:** Routing (Pages and Layouts, Dynamic Routes, Linking, Custom App, Custom Document, API Routes, Custom Errors), Rendering (SSR, SSG, Automatic Static Optimization, CSR), Data Fetching (`getStaticProps`, `getStaticPaths`, `getServerSideProps`, Client-side Fetching), Configuring.
- **API Reference:** Components (adds `Head`, legacy Image), File-system conventions (`instrumentation`, Proxy, `public`, `src`), Functions (`getInitialProps`, `getServerSideProps`, `getStaticPaths`, `getStaticProps` and others), Configuration, CLI, Adapters, Edge Runtime, Turbopack.

**Observation.** The Pages Router keeps a "Building Your Application" section the App Router no longer has; the App Router moved that material into Getting Started and Guides. The split is by router, not by audience.

### 2.4 Concepts, one line each

| Concept | What the docs say | Source |
|---|---|---|
| Project structure | Top-level folders (`app`, `pages`, `public`, `src`), top-level files (`next.config.js`, `package.json`, `proxy.ts`, `.env*`, `tsconfig.json`), routing files table (`layout`, `page`, `loading`, `not-found`, `error`, `global-error`, `route`, `template`, `default`) | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| Routing files | "Add `page` to expose a route, `layout` for shared UI..., `loading` for skeletons, `error` for error boundaries, and `route` for APIs." | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| Layouts | "A layout is UI that is **shared** between multiple pages. On navigation, layouts preserve state, remain interactive, and do not rerender." | [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) |
| Templates | Like a layout, but "given a unique key", so children reset on navigation | [template.js](https://nextjs.org/docs/app/api-reference/file-conventions/template) |
| Route groups | "A folder convention that let you organize routes by category or team", created by wrapping a folder name in parentheses | [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) |
| Dynamic segments, parallel routes | `[slug]`, catch-all, and slots rendered side by side | [Dynamic Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes), [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) |
| Server and Client Components | When to use each, how they render, the boundary, "Preventing environment poisoning" | [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| Fetching data | Server Components, streaming, client fetching, sequential and parallel fetching, `React.cache` | [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data) |
| Mutating data | Server Functions, invoked from forms and event handlers; pending state, refresh, revalidate, redirect after mutation | [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) |
| Caching and revalidating | Cache data and UI; time-based and on-demand revalidation | [Caching](https://nextjs.org/docs/app/getting-started/caching), [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating) |
| Forms | `<form action>` with Server Actions, `FormData`, client and server validation, validation errors through `useActionState`, pending states, optimistic updates | [Forms](https://nextjs.org/docs/app/guides/forms) |
| Server Action security | "You should still treat Server Actions as reachable via direct POST requests and verify authentication and authorization inside each one." | [Data Security](https://nextjs.org/docs/app/guides/data-security) |
| Proxy (was Middleware) | Rewrite, redirect, modify headers before a request completes. "It should not be used as a full session management or authorization solution." | [Proxy](https://nextjs.org/docs/app/getting-started/proxy) |
| Route Handlers | Request handlers with the Web Request and Response APIs | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) |
| Error handling | Expected errors as return values; uncaught exceptions through error boundaries; not found | [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) |
| Metadata | Static and generated metadata, OG images | [Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) |
| Config | `next.config.js` and its options | [next.config.js](https://nextjs.org/docs/app/api-reference/config/next-config-js) |
| CLI | `next dev`, `build`, `start` and others | [next CLI](https://nextjs.org/docs/app/api-reference/cli/next) |
| create-next-app | Create an app "using the default template or an example from a public GitHub repository"; `--example [name] [github-url]` | [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app) |
| Upgrading and codemods | `npx @next/codemod <transform> <path>`, with `--dry` and `--print`; per-version upgrade guides | [Codemods](https://nextjs.org/docs/app/guides/upgrading/codemods), [Upgrading](https://nextjs.org/docs/app/getting-started/upgrading) |
| Adapters | "Build deployment adapters that integrate with the Next.js build and runtime model" | [Adapters](https://nextjs.org/docs/app/api-reference/adapters) |
| AI coding agents | Version-matched bundled docs and a managed `AGENTS.md` block that `create-next-app` creates and `next dev` re-adds | [AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents) |
| Glossary | A glossary of common terms | [Glossary](https://nextjs.org/docs/app/glossary) |
| Pages Router data fetching | `getStaticProps`, `getStaticPaths`, `getServerSideProps` | [getStaticProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props) |
| Pages Router forms | Forms with API Routes | [Forms (Pages)](https://nextjs.org/docs/pages/guides/forms), [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) |

### 2.5 Page anatomy (Next.js)

Read from the Markdown source of the fetched pages:

- **Frontmatter:** `title`, `description`, `url`, `lastUpdated`, `related`, and sometimes `navTitle`. ([AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents))
- **Opening:** one or two sentences on what the page helps you do, then a diagram for routing concepts. ([Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages))
- **Code in TypeScript and JavaScript pairs:** each example appears twice, under **TypeScript** and **JavaScript**, with a `title="app/page.tsx"` filename on the fence. On the site this renders as a language switcher. ([Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages))
- **"Good to know" callouts:** `> **Good to know:**` blocks. 28 of the 43 Next.js pages I fetched contain at least one.
- **Tables for conventions:** file conventions and options are tables, each row linking to its API reference page. ([Project structure](https://nextjs.org/docs/app/getting-started/project-structure))
- **Examples section, then "Next steps" or "API Reference" links** at the end. ([Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data), [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling))
- **Agent-readable:** every page links to `/docs/llms.txt` and `/sitemap.md`. ([Next.js Docs](https://nextjs.org/docs))

---

## 3. React docs inventory

### 3.1 How the docs are organized

- **Learn and Reference.** "This section provides detailed reference documentation for working with React. For an introduction to React, please visit the Learn section." ([React Reference Overview](https://react.dev/reference/react))
- **Learn** is a course: Quick Start, Tutorial (Tic-Tac-Toe), Thinking in React, Installation and Setup, React Compiler, then four chapters: **Describing the UI**, **Adding Interactivity**, **Managing State**, **Escape Hatches**. ([react.dev llms.txt](https://react.dev/llms.txt))
- **Reference** is one page per API: Hooks, Components, APIs, React DOM (hooks, components such as `<form>`, APIs, client, server, static), React Compiler, DevTools, Lints (`eslint-plugin-react-hooks`), **Rules of React**, Server Components and Server Functions, Directives, Legacy APIs. ([react.dev llms.txt](https://react.dev/llms.txt))

### 3.2 Concepts, one line each

| Concept | What the docs say | Source |
|---|---|---|
| Components | Reusable UI pieces; names start with a capital letter | [Your First Component](https://react.dev/learn/your-first-component), [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) |
| Props | Data passed from parent to child | [Passing Props](https://react.dev/learn/passing-props-to-a-component) |
| JSX | Markup in JavaScript | [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx) |
| UI as a tree | Render and dependency trees | [Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree) |
| Purity | "Components must be idempotent"; "Side effects must run outside of render" | [Rules of React](https://react.dev/reference/rules) |
| State | A component's memory | [State](https://react.dev/learn/state-a-components-memory) |
| Declarative UI states | Identify visual states (Empty, Typing, Submitting, Success, Error), their triggers, represent them minimally, remove non-essential state, connect handlers | [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state) |
| State structure | "Avoid redundant state"; "Avoid duplication in state" | [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) |
| Single source of truth | "For each unique piece of state, you will choose the component that 'owns' it." | [Sharing State](https://react.dev/learn/sharing-state-between-components) |
| Reducers | "Consolidate all the state update logic outside your component in a single function, called a reducer" | [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) |
| Context | "Context lets a parent... provide some data to the entire tree inside of it." | [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) |
| Effects | "Synchronize your component with some system outside of React" | [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) |
| You might not need an Effect | Don't use Effects to transform data or to handle user events | [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) |
| Refs | Values that persist without causing renders; DOM access | [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs) |
| Hooks | "Hooks let you use different React features from your components. You can either use the built-in Hooks or combine them to build your own." | [Built-in React Hooks](https://react.dev/reference/react/hooks) |
| Custom Hooks | "Hook names must start with `use` followed by a capital letter"; "Custom Hooks let you share stateful logic, not state itself" | [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) |
| Rules of Hooks | "Only call Hooks at the top level"; "Only call Hooks from React functions" | [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) |
| Rules of React | Called rules and not just guidelines because "if they are broken, your app likely has bugs"; Strict Mode and the ESLint plugin help enforce them | [Rules of React](https://react.dev/reference/rules) |
| Lints | `rules-of-hooks`, `exhaustive-deps`, `purity`, `immutability` and others | [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) |
| Forms and Actions | `<form action>`, `useActionState(reducerAction, initialState, permalink?)`, `useFormStatus`, `useOptimistic` | [form](https://react.dev/reference/react-dom/components/form), [useActionState](https://react.dev/reference/react/useActionState), [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus), [useOptimistic](https://react.dev/reference/react/useOptimistic) |
| Server Components, Server Functions | Covered by Next.js; cite Next.js | [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) |

### 3.3 Teaching style (React)

Counted from the Markdown of the 41 React pages I fetched:

- `<Sandpack>` live editable examples: 308. `<Solution>`: 81. `<Challenges>`: 14 pages.
- `<Intro>`: 41. `<YouWillLearn>`: 21. `<Recap>`: 16.
- `<DeepDive>`: 32. `<Pitfall>`: 17. `<Note>`: 29. `<Diagram>`: 27.

The pattern is: say what you'll learn, teach with a runnable example, warn about the common mistake (Pitfall), offer optional depth (DeepDive), recap, then give challenges with solutions. "Thinking in React" teaches a five-step method (break the UI into a hierarchy, build a static version, find the minimal state, decide where state lives, add inverse data flow). ([Thinking in React](https://react.dev/learn/thinking-in-react))

---

## 4. Naive inventory

All paths are from the repo root. Tags are defined in Section 1.2. Decision statuses (in force, proposed) are as of the snapshot.

### 4.1 Top-level structure

| Folder or file | What it is | Evidence |
|---|---|---|
| `schema/` | Record schemas (`*.schema.json`), the data model (`schema/data-model.json`), checks (`check-*.mjs`), generators (`init-venture.mjs`, `add-department.mjs`), runners (`run-handoff.mjs`, `need-now.mjs`, `foundation.mjs`), `validate.py`, `examples/workspace` | [V] paths named in `test.mjs` and the review session |
| `interface/` | "The router (`router.mjs`) and the CLI, MCP server and HTTP API over it; the install skill; agent harnesses and the operator console" | [V] `AGENTS.md` (partial read) |
| `platform/` | The platform side (EE-041): vendor connectors, later hosting and the template gallery. "Framework code never imports from here (`node schema/check-boundary.mjs`)" | [V] `AGENTS.md` |
| `site/` | Developer docs, unpublished (EE-034). Nextra on Next.js in the snapshot; PR #21 ports it to Fumadocs (not merged as of the snapshot) | [V] `AGENTS.md`, `site/AGENTS.md`, `site/package.json` |
| `docs/decisions/decisions.json` | The decisions ledger (EE-NNN) | [V] |
| `docs/ontology.json`, `docs/ontology.md` | Nouns, with level, meaning and standard; the glossary is generated from it | [V] `site/scripts/data.mjs`, `test.mjs` |
| `docs/reference/ROUTES.md` | Generated route table | [V] `AGENTS.md`, `test.mjs` |
| `purpose/`, `knowledge/`, `operations/`, `evidence/`, `governance/` | Method-level layers, each with its kits and templates | [V] `venture.json` `layers`, `test.mjs` |
| `instance/ventures/<id>/` | Real ventures, including Everything Ecosystem itself | [V] `instance/ventures/everything-ecosystem/venture.json` |
| `test.mjs` | Runs every test and check (EE-017) | [V] |

### 4.2 Concepts

**Framework and platform.** Naive is the framework: "anything that works offline, with no account and without naming a vendor (record schemas and the data model, kits, the router with its CLI, MCP server and local API, routes, provenance, checks, need-now priors, validation scoring, init-venture and templates, the connector contract and the filesystem connector, the docs)." Mentura is the platform: vendor connectors, the connect flow, integrations, hosted catalog and search, operator console and a template gallery. "The framework is the open core and the platform is what is sold." [V] EE-041 (proposed), EE-043 (proposed, names); `instance/ventures/everything-ecosystem/products/kit.json` (`"name": "Naive (framework)"`, `"status": "live"`) and `products/mentura.json` (`"status": "building"`).

**Genus.** "A venture development framework, in the same genus as web development frameworks." [V] EE-024 (proposed).

**Venture.** A folder with a `venture.json` (id, name, parent, phase, ambition, industry, core promise, brand tagline, layers). Ventures nest: `test.mjs` finds any folder with a `venture.json` under `instance/`. [V] `instance/ventures/everything-ecosystem/venture.json`, `test.mjs`.

**Layers.** Six layers: purpose, knowledge, operations, evidence, governance, interface. [V] EE-038 (proposed). Layers "start off until needed (EE-012)". [V] EE-048.

**Records.** Typed JSON files validated against schemas in `schema/`. File format rule: JSON with a schema when a program reads it; JSONL for append-only logs; `.md` when a tool expects the name; MDX for published prose. [V] EE-033 (in force).

**Kits.** "Packages that plug in (kits, by layer and tier)". [V] EE-024. "A layer may hold more than one kit, under `<layer>/kits/<kit>/`." [V] EE-026 (in force). A kit manifest has `path`, `kit`, `layer`, `purpose`, `skills`, `records` and `gaps`. [V] `site/scripts/data.mjs`. Known manifests: `purpose/kit.json`, `governance/kit.json`; known kit: `purpose/kits/validation/` with `skills/problem-validation/` and `features/problem-assessment.feature`. [V] paths in the session and `test.mjs`. Kits being "the equivalent of hooks", custom kits, and pulling pieces from first-party or third-party templates: [T].

**Router and routes.** "One route table, generated from `schema/data-model.json` and the kit manifests by `interface/router.mjs`, and three interfaces over it: a CLI (`interface/cli/mentura.mjs`), an MCP server (`interface/mcp/server.mjs`) and a local HTTP API (`interface/api/server.mjs`). A route is `<layer>[/<kit>]/<record>` with the actions read, write, check and template, or a command with run. Every write is validated against the record's schema." [V] EE-030 (in force).

**App Router conventions in the router.** EE-032 (in force) adopts: `[id]` item routes beside list routes; the venture as a catch-all segment (`studio/print`); `layout` (context an agent gets before acting); `not-found` (answers with template, schema, skills and need-now status); `loading` (a waiting draft is reported on read); `error` (answers with the kit's skills and template); views (Markdown pages for people); `system/overview` with parallel slots; route groups by phase, `(discovery)` to `(platform)`; `robots` (what a team-plan role may read and write); route aliases for renames (`interface/route-aliases.json`); gates declared in the data model (`decision_class` on a record type). [V]

**Gates and drafts.** "An agent's write to a record whose decision class escalates to a person (ownership, board, founder agreement, exit, telos, decision rights, publication policy) is held as a draft for a person to accept." [V] EE-030.

**Decision rights.** Levels `decide`, `decide-inform`, `recommend-approve`, `escalate`, and 19 classes (for example `implementation-detail`, `new-dependency-free`, `spend-money`, `public-commitment`, `production-ship`, `contradicts-ledger`). [V] `governance/venture-template/decision-rights.json`.

**Decisions ledger.** Entries with `id`, `date`, `decision`, `why`, `status` (proposed, in force, superseded) and `related`. [V] `docs/decisions/decisions.json`; schema at `schema/decision-record.schema.json` [V path only].

**Handoffs.** "One unit of delegated work, stored at `<venture>/operations/handoffs/<id>.json`... the machine half of handoff contract v2... The brief (outcome, work, context) is prose in a Markdown file beside it." Required fields include `role`, `decision_classes`, `done_criteria`, `status`, `attempts`, `max_attempts`, `run_cap`. `schema/check-ready.mjs` checks readiness before work; `schema/check-execution.mjs` checks against decision rights. [V] `schema/handoff.schema.json`, `operations/handoff-v2.md`.

**Provenance.** Every router write appends a line to `<venture>/provenance.jsonl` after W3C PROV, hash-chained; `schema/check-provenance.mjs` fails on edits. [V] EE-031 (in force).

**Need-now.** "The framework says what a venture needs now, what comes soon and what to hold back", from per-phase priors in `schema/need-now.json`. [V] EE-028 (in force).

**Imports.** "A venture imports what it uses by listing it in `venture.json`, the way `package.json` lists dependencies, and gets folders only for what it lists... `mentura add <department> --venture <id>`." "Schemas stay in the framework and are never copied into a venture." [V] EE-048 (proposed).

**Generators and templates.** `schema/init-venture.mjs` [V path]; `init --layers` for partial adoption [V] EE-030; "init-venture and templates" are framework, "a template gallery" is platform [V] EE-041. Example workspace: `schema/examples/workspace` [V] `test.mjs`.

**Checks.** `node test.mjs` runs about 35 steps, including schema validation, `check-ventures`, `check-nouns`, `check-data-model` ("data model and kits"), `check-governance`, `check-publication`, `check-provenance`, `check-sources`, `check-where-used`, `check-departments`, `check-boundary`, connector evals, validation scoring, Gherkin behaviors (`schema/bdd.mjs`), handoff execution checks, and router/CLI/MCP/API tests. Generated docs are checked for staleness by regenerating them in memory. [V] `test.mjs`.

**Connectors and source of truth.** One connector contract (list, read, version, search, write where allowed); filesystem connector is framework, GitHub connector writes by draft pull request. [V] EE-037 (proposed). A source-of-truth matrix names, per record type, attribute and context, the system of record and owner; resolution is deterministic. A where-used list tracks every place a fact is repeated, "each live or frozen". [V] EE-042 (proposed).

**Publication.** "Every publication passes this gate: it runs as a handoff under public-commitment and names its channel and content; agents may draft, check and preview, and a person approves." [V] EE-025 (in force); `instance/ventures/everything-ecosystem/governance/publication-policy.json`.

**Departments.** APQC categories, each with a governance side and an operations side. [V] EE-047 (proposed).

**Strategic foundation.** `purpose/strategic-foundation.json`, `schema/foundation.mjs`; a statement an agent wrote is not the founder's until a person writes, accepts or confirms it. [V] EE-051, EE-052 (proposed).

**Docs site conventions.** `site/AGENTS.md` (snapshot): pages are MDX in `content/`, `_meta.js` orders the sidebar, pages that show routes, nouns, kits or decisions render them from the repo through `generated/`, "Never copy that data into a page." `site/scripts/data.mjs` reads method-level data only, never an instance venture. [V] Existing pages: `index`, `getting-started/install`, `getting-started/first-venture`, `concepts/{governance, layers-and-kits, provenance, validation, ventures-and-phases}`, `interfaces/{cli, mcp, api, routes}`, `reference/{decisions, file-formats, nouns}`. [V] PR #20 review.

**Agent rules file.** `site/AGENTS.md` already contains the Next.js managed block (`<!-- BEGIN:nextjs-agent-rules -->`). [V]

### 4.3 Not found in the material I had

- **Docket, decision docket.** No file, schema, route or decision I read uses the word. The nearest records are the decision record (`schema/decision-record.schema.json`), the handoff (`schema/handoff.schema.json`) and the drafts held for acceptance (EE-030). [N]
- **Custom kits, third-party kits, a kit registry.** [N] The template gallery is named as platform in EE-041. [V]
- **Naive version numbers, a changelog, upgrade or migration tooling.** [N] Renames are handled by route aliases (EE-032). [V]
- **A CLI named `naive`.** The CLI file is `interface/cli/mentura.mjs` and EE-048 writes `mentura add`. [V] Whether it becomes `naive` is open (EE-043 says files keep "Everything Ecosystem" until a rename is decided). [V]
- **"Channels" as a Naive concept beyond publication channels.** Publication channels exist (EE-025). [V] Any wider meaning of channels: [N].

---

## 5. One-to-one mappings

These are the matches a Next.js or React developer will recognize immediately. **Bold** rows are already decided in the ledger in Next.js terms, so the docs can say "this is the same idea" without hedging.

| # | If you know (Next.js / React) | In Naive it is | Strength | Naive evidence | Next.js / React source |
|---|---|---|---|---|---|
| 1 | **Next.js (framework) and Vercel (platform)** | **Naive (framework) and Mentura (platform)** | Decided | EE-041, EE-043 | [Adapters](https://nextjs.org/docs/app/api-reference/adapters) |
| 2 | **Deployment adapter (`adapterPath`)** | **Platform connector loaded "by the module path the registry names, as Next.js loads a deployment adapter"** | Decided | EE-041 | [Adapters](https://nextjs.org/docs/app/api-reference/adapters) |
| 3 | **File-system routing: a route is a folder path** | **A route is its record's folder path, `<layer>[/<kit>]/<record>`** | Decided | EE-030, EE-032 | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| 4 | **Dynamic segment `[slug]`** | **`[id]` item routes for collections (products, accounts, handoffs, evidence)** | Decided | EE-032 | [Dynamic Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) |
| 5 | **Catch-all segment** | **The venture as a catch-all (an id or a nested venture's path, `studio/print`)** | Decided | EE-032 | [Dynamic Segments](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) |
| 6 | **`layout.js`: shared context that wraps children** | **`layout`: the system, layer and kit context, skills, references, template, gate and need-now status an agent gets before acting** | Decided | EE-032 | [layout.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout) |
| 7 | **`not-found.js`** | **`not-found`: a missing record answers with its template, schema, skills and need-now status** | Decided | EE-032 | [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) |
| 8 | **`loading.js`** | **`loading`: a waiting draft is reported on read** | Decided | EE-032 | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| 9 | **`error.js` (error boundary)** | **`error`: a failed check or write answers with the kit's skills and template** | Decided | EE-032 | [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) |
| 10 | **Route groups `(folder)`** | **Route groups by phase, `(discovery)` to `(platform)`, without changing paths** | Decided | EE-032 | [Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) |
| 11 | **Parallel routes (slots)** | **`system/overview`, parallel slots where one failing slot does not stop the others** | Decided | EE-032 | [Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes) |
| 12 | **`robots.txt`** | **`robots`: routes a team-plan role may read and write, at `system/robots`** | Decided | EE-032 | [llms.txt (Metadata Files)](https://nextjs.org/docs/llms.txt) |
| 13 | **`redirects` in config** | **Route aliases for renames, `interface/route-aliases.json`** | Decided | EE-032 | [Proxy](https://nextjs.org/docs/app/getting-started/proxy) (recommends `redirects` for simple cases) |
| 14 | **`page.js`** | **Views: Markdown pages for people (the page convention)** | Decided | EE-032 | [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) |
| 15 | **`package.json` dependencies** | **`venture.json` lists what a venture imports** | Decided (proposed status) | EE-048 | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| 16 | **Framework conventions vs app code (inversion of control)** | **"The framework's checks and runners call on the venture's records, as a web framework calls the application's code"** | Decided (proposed status) | EE-024 | [Next.js Docs](https://nextjs.org/docs) |
| 17 | `create-next-app` | `init-venture` (with `--layers` for partial adoption) | Strong | `schema/init-venture.mjs`, EE-030 | [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app) |
| 18 | `next` CLI | The CLI (`interface/cli/mentura.mjs`) over the route table | Strong | EE-030 | [next CLI](https://nextjs.org/docs/app/api-reference/cli/next) |
| 19 | Route Handlers / API Routes | The local HTTP API and the MCP server over the same routes | Strong | EE-030 | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) |
| 20 | Server-side form validation with a schema (`safeParse`) | "Every write is validated against the record's schema" | Strong | EE-030 | [Forms](https://nextjs.org/docs/app/guides/forms) |
| 21 | "Verify authentication and authorization inside each" Server Action | Gates declared on the record type (`decision_class`), applied from the venture's decision rights at every write | Strong | EE-030, EE-032 | [Data Security](https://nextjs.org/docs/app/guides/data-security) |
| 22 | Expected errors returned as values (`useActionState` state) | `error` and `not-found` answers carry the template and skills to fix the write | Strong | EE-032 | [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) |
| 23 | Built-in Hooks / Hooks you combine | Kits by layer: "packages that plug in" | Strong for built-in kits; custom kits are [T] | EE-024, EE-026, `site/scripts/data.mjs` | [Built-in React Hooks](https://react.dev/reference/react/hooks) |
| 24 | "Custom Hooks let you share stateful logic, not state itself" | "Schemas stay in the framework and are never copied into a venture": kits share schemas and skills, never a venture's records | Strong | EE-048 | [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) |
| 25 | Single source of truth: one component "owns" each piece of state | Source-of-truth matrix: one system of record and owner per record type, attribute and context | Strong | EE-042 | [Sharing State](https://react.dev/learn/sharing-state-between-components) |
| 26 | "Avoid duplication in state" | Where-used list: every repeated fact is tracked, live or frozen, and drift is reported | Strong | EE-042 | [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) |
| 27 | Effects synchronize with an external system | Connectors and integrations reach outside sources (one contract) | Strong | EE-037 | [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) |
| 28 | Glossary | `docs/ontology.json` nouns, rendered as the glossary | Strong | `site/scripts/data.mjs`, `test.mjs` | [Glossary](https://nextjs.org/docs/app/glossary) |
| 29 | Managed `AGENTS.md` block and bundled docs for agents | Root `AGENTS.md` and `site/AGENTS.md` (which already carries the Next.js block) | Strong | `AGENTS.md`, `site/AGENTS.md` | [AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents) |
| 30 | MDX pages | MDX for published prose that needs components or live data | Strong | EE-033 | [MDX guide (index)](https://nextjs.org/docs/llms.txt) |
| 31 | Test runner and lint in CI | `node test.mjs`: "checks run like a test suite" | Strong | EE-024, `test.mjs` | [Testing](https://nextjs.org/docs/app/guides/testing) |

**What to say on the docs home.** A short "Naive for Next.js developers" box: "Naive routes work like the App Router: a route is a folder, `[id]` is a dynamic segment, `(discovery)` is a route group, and `layout`, `not-found`, `loading` and `error` mean what you expect, for records instead of UI." Every phrase in that sentence is backed by EE-032. [P]

---

## 6. Partial overlaps the Naive docs don't spell out yet

Each subsection gives the analogy, where it holds, where it breaks, and what the docs should say.

### 6.1 Decision dockets are forms

Torian's framing: a decision docket is essentially a form, so Naive's docs need a page on designing a docket, or any kind of docket. [T]

**What the files support.** The word "docket" did not appear in anything I read (Section 4.3). The machinery a form needs is all there, under other names:

| Form concept (Next.js / React) | Source | Naive equivalent | Evidence |
|---|---|---|---|
| The form's fields | [form](https://react.dev/reference/react-dom/components/form) | The record type's JSON Schema (`properties`, `required`, `pattern`, `enum`) | [V] `schema/handoff.schema.json` |
| `<form action={serverAction}>`: one function receives the submission | [Forms](https://nextjs.org/docs/app/guides/forms) | The router's `write` action on a route | [V] EE-030 |
| Client-side validation with HTML attributes (`required`, `type="email"`) | [Forms](https://nextjs.org/docs/app/guides/forms) | A kit's skill or template that guides the agent before it writes | [V] EE-032 (`layout` gives skills and template); the "before write" split is [P] |
| Server-side validation with Zod `safeParse`, return early when invalid | [Forms](https://nextjs.org/docs/app/guides/forms) | "Every write is validated against the record's schema" | [V] EE-030 |
| Validation errors shown through `useActionState` (state returned from the action) | [Forms](https://nextjs.org/docs/app/guides/forms), [useActionState](https://react.dev/reference/react/useActionState) | `error`: "a failed check or write answers with the kit's skills and template" | [V] EE-032 |
| Authorization inside each Server Action | [Data Security](https://nextjs.org/docs/app/guides/data-security) | `decision_class` on the record type; an agent write that escalates is "held as a draft for a person to accept" | [V] EE-030, EE-032 |
| Pending state (`useFormStatus`, `isPending`) | [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus) | `loading`: "a waiting draft is reported on read" | [V] EE-032 |
| Optimistic update (`useOptimistic`) | [Forms](https://nextjs.org/docs/app/guides/forms) | **Deliberately the opposite.** A gated write is shown as a draft, never as accepted, until a person accepts it | [V] EE-030, EE-051 |
| Redirect after mutation; revalidate | [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data) | Need-now suggests the next record; generated views are re-rendered and checked for staleness | [V] EE-028, `test.mjs`; the "next step after a docket" wording is [P] |
| Audit of submissions | (no Next.js equivalent) | Hash-chained provenance line for every write | [V] EE-031 |

**React's five-step method applies almost word for word.** "Reacting to Input with State" asks you to (1) identify the visual states, (2) determine what triggers changes, (3) represent state in memory, (4) remove non-essential state, (5) connect the handlers. Its example form states are Empty, Typing, Submitting, Success and Error. ([Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state)) A docket has the same life:

| React form state | Docket state [P] | Naive mechanism today |
|---|---|---|
| Empty | Missing: the route answers with template, schema, skills | `not-found` [V] EE-032 |
| Typing | Drafting: an agent or person is filling it | A draft write [V] EE-030 |
| Submitting | Awaiting decision: held for a person with the right | `loading` and the draft hold [V] EE-030, EE-032 |
| Success | Decided: accepted, in force | Decision `status: in-force`; provenance activity `accept` [V] `decisions.json`, EE-031 |
| Error | Rejected or invalid: schema or check failed | `error` answer [V] EE-032 |

Decisions also have a state React forms don't: **superseded** (EE-035 is marked superseded). [V] A docket page should cover it.

**Where the analogy breaks.**

- A web form is filled by one user in one sitting. A docket may be filled by several agents and people over days, with each write logged. The docs should say "a docket is a form whose submissions are durable records", not "a docket is a form".
- Next.js recommends optimistic UI. Naive's rule is the reverse for gated records (an agent's statement "is not the founder's until a person writes, accepts or confirms it", EE-051). The docket page needs a Pitfall callout on exactly this.
- React's `useActionState` keeps state per component. A docket's state is the record and its provenance, so it survives restarts.

**Proposed page: "Designing a docket"** (Guides; Diátaxis type how-to; modeled on the Next.js Forms guide sections). [P]

1. **Intro:** a docket collects what a decision needs and routes it to whoever holds the right. One sentence on what you'll build.
2. **How it works:** the record type, its route, the `write` action, the gate. File tree of a docket's record type in a kit.
3. **Choose the decision class first.** Which class from `decision-rights.json` the docket serves, and its level (`decide`, `decide-inform`, `recommend-approve`, `escalate`). This is the docket's authorization, like the auth check at the top of a Server Action.
4. **Design the fields:** required versus optional, enums for options, `why` and sources as required fields so every decision is traceable, `related` links.
5. **Design the states** with React's five steps (table above).
6. **Validation:** schema first, then checks (`check-*.mjs`) for rules a schema can't express; where Gherkin features fit (`schema/bdd.mjs`).
7. **Validation errors:** what the `error` answer returns and how an agent should use it.
8. **Drafts and acceptance:** why Naive is never optimistic for gated records. Pitfall callout.
9. **Passing additional arguments:** context the docket inherits from `layout` (venture, phase, layer, kit).
10. **Nested dockets:** a docket that spawns a handoff, or a decision that supersedes another.
11. **Submitting from each interface:** CLI, MCP, HTTP API, and editing the file directly (tabs, like the TypeScript/JavaScript tabs in Next.js).
12. **After the decision:** provenance, the decisions ledger, need-now's next suggestion.
13. **Example:** a worked docket from `schema/examples/workspace` (not an instance venture, per EE-034).
14. **API Reference links:** the schema, the route, the checks.

### 6.2 Kits are hooks; custom kits are custom hooks

Torian's framing: kits/packages are the equivalent of React hooks, including creating custom kits and taking pieces from third-party or first-party templates. [T]

**What holds.**

| React | Naive | Evidence |
|---|---|---|
| "Hooks let you use different React features from your components" | A kit lets a venture use a part of the method (validation, governance) in a layer | [V] EE-024, EE-026 |
| Built-in Hooks (`useState`, `useReducer`...) grouped by purpose (State Hooks, Context Hooks...) | First-party kits grouped by layer (`purpose/kits/validation/`) | [V] EE-026, `test.mjs` |
| "Combine them to build your own" | One kit sharing records across sub-scores ("all sharing one evidence item") | [V] EE-026 |
| "Share stateful logic, not state itself" | Kits share schemas, skills and templates; records stay in the venture; schemas are never copied in | [V] EE-048 |
| Hook names start with `use` | Kit routes are `<layer>/<kit>/<record>` | [V] EE-030 |
| A Hook is called from a component | A venture lists the kit (import by listing, like `package.json`) | [V] EE-048 (stated for departments; "the same rule applies across the system") |

**What breaks.** Hooks are functions that run on every render. Kits are bundles of data (schemas, templates, skills, checks, features). So the closer single-word analogy for a kit is an **npm package that ships hooks**, and EE-024's own word for kits is "packages". The docs should teach kits through hooks (the concept people know) and name the package mechanics separately (`venture.json`, `mentura add`). [P]

**Custom kits.** [N] for any authoring guide, manifest reference or scaffold command. React's custom Hooks page structure is a good template for a "Building a custom kit" guide: extract from what you repeat, name it, what a kit shares and doesn't, passing values between kits, when to make a kit, "there is more than one way to do it". ([Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)) [P]

**Composing from first-party or third-party templates.** Next.js has two models in the pages I read: `create-next-app --example` with a name or "any public GitHub" URL ([create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app)), and installing packages through `package.json`. Naive already chose import-by-listing for departments (EE-048) and says a template gallery is platform (EE-041). That leaves an open choice for third-party kits: import by reference (npm-like; the kit stays upstream and updates) or copy in (the venture owns a fork). EE-048's "never copied into a venture" points to import by reference for schemas, and copy-in only for templates and skills a venture means to change. Open question for Torian (Section 11). [P]

**Proposed "Rules of kits"** (modeled on [Rules of React](https://react.dev/reference/rules) and [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks); React calls them rules and not just guidelines, because "if they are broken, your app likely has bugs"). Each rule names the check that enforces it, or says none exists yet. [P]

1. **A kit declares everything in its manifest.** Records, skills, templates and gaps are listed in `kit.json`; the route table is generated from it (EE-030). Like "only call Hooks at the top level": nothing a kit adds is conditional or hidden. Enforced today in part by `check-data-model.mjs` ("data model and kits"). [V for the check's existence]
2. **A kit shares schemas, never records.** No kit writes into another venture or copies schemas into one (EE-048). Enforcement: none found. [N]
3. **Every write goes through the router.** So it is validated and logged (EE-030, EE-031). Writes outside the router are caught as warnings by `check-provenance.mjs`. [V]
4. **Gated records declare their decision class.** A kit that adds a record type a person must decide sets `decision_class` on it (EE-032). [V for the mechanism]
5. **Framework kits name no vendor and reach no network.** Anything else is platform (EE-041), enforced by `check-boundary.mjs`. [V]
6. **Checks are deterministic.** A check gives the same answer for the same records, like "components must be idempotent". EE-042 states this for source resolution ("deterministic and needs no model"). Making it a general rule is [P].
7. **A kit's defaults cite a source.** The venture's `must_not` is "defaults with no traceable source" (`venture.json`). [V]
8. **A kit names itself by its layer.** Path `<layer>/kits/<kit>/` (EE-026). [V]

A **kits lint** (the analog of `eslint-plugin-react-hooks`, [Lints](https://react.dev/reference/eslint-plugin-react-hooks)) would bundle rules 1 to 8 as one command with one rule page each. [P]

### 6.3 App Router and Pages Router: is there a Naive analog?

**Next.js's split** is between two routing systems that coexist in one app, with a sidebar switcher and a migration guide. ([Next.js Docs](https://nextjs.org/docs), [App Router migration](https://nextjs.org/docs/app/guides/migrating/app-router-migration))

**Naive candidates:**

| Option | The two sides | Evidence | Fit |
|---|---|---|---|
| A. Router writes vs direct file edits | Writes through CLI/MCP/API are validated and logged explicitly; edits outside the router are covered "implicitly" by git | [V] EE-031 | Closest structural match: both are supported, one is newer and preferred, they coexist |
| B. Builders vs developers | The ICP is low- to no-code founders (EE-045); "a typed config file can come later for developers" (EE-048) | [V] | Audience split, not a router split |
| C. Before and after a big change | Vault-era SAD and MAD (EE-035, EE-036, EE-038) vs today's layers | [V] | Historical only; nobody runs the old model |
| D. Framework vs platform | Naive vs Mentura | [V] EE-041 | Already a product split; better as a top-level nav, not a switcher |

**Recommendation [P]:** don't add a router switcher now. Next.js needs one because both routers are fully supported and documented. Naive has one router. Use **interface tabs** on every page instead (CLI, MCP, HTTP API, edit the file), the same way Next.js uses TypeScript/JavaScript tabs, and keep Mentura (platform) as its own top-level section. Revisit if a typed-config developer mode ships (option B). Fumadocs supports root-level variants if that day comes (see `DEV_DOCS_SITE_RESEARCH_2026-10-28.md` §2.2).

### 6.4 File conventions and project structure

Next.js documents conventions in two places: a Getting Started page with tables of top-level folders, top-level files and routing files ([Project structure](https://nextjs.org/docs/app/getting-started/project-structure)), and one API Reference page per special file ([File-system conventions](https://nextjs.org/docs/app/api-reference/file-conventions)).

Naive has the conventions (Section 4) and a "File formats" reference page (`site/content/reference/file-formats.mdx`) [V], but no single page lists the special files. Proposed table for a Naive "Project structure" page [P], each row linking to a reference page:

| Naive file or folder | Role | Next.js analog |
|---|---|---|
| `venture.json` | Venture identity, phase, layers, imports | `package.json` + `next.config.js` |
| `<layer>/` | Route segment for a layer | top-level route folder |
| `<layer>/kits/<kit>/` and `kit.json` | A kit and its manifest | an installed package |
| `[id]` collections | Item routes | `[slug]` |
| `(discovery)` ... `(platform)` | Phase groups | `(group)` |
| `layout`, `not-found`, `loading`, `error`, views | Router special answers | `layout.js`, `not-found.js`, `loading.js`, `error.js`, `page.js` |
| `provenance.jsonl` | Write log | (none) |
| `knowledge/sources.json` | Where each record type lives | (none; closest is data-fetching config) |
| `operations/handoffs/<id>.json` + `.md` | Delegated work | (none) |
| `governance/publication-policy.json` | Publication gate | (none) |
| `interface/route-aliases.json` | Renames | `redirects` |
| `AGENTS.md` | Agent instructions | `AGENTS.md` |

Whether `layout`, `not-found` and the others are **files** a venture can override (as in Next.js) or **router behaviors** only is not clear from EE-032. That decides whether the reference pages say "create a file" or "the router answers". Open question. [N]

### 6.5 Layouts and context

Next.js layouts are shared UI that persists across navigation ([Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)); React context lets "a parent... provide some data to the entire tree" ([Context](https://react.dev/learn/passing-data-deeply-with-context)). Naive's `layout` is the context an agent receives before acting, nested by system, layer and kit (EE-032). [V] The docs should teach it as "layout plus context": nested, inherited, and read before every action. What's unspecified: how a venture or kit adds to the layout, and whether layouts nest per venture (`studio/print`). [N]

### 6.6 Data fetching and caching vs systems of record

| Next.js / React | Naive | Evidence |
|---|---|---|
| Fetch in Server Components, close to the data ([Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)) | The router reads each record through the connector for its source | [V] EE-037 |
| Where data comes from (database, API) | The source-of-truth matrix decides the system of record per record type, attribute and context | [V] EE-042 |
| Cache keys and tags; revalidate on time or demand ([Caching](https://nextjs.org/docs/app/getting-started/caching), [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)) | A version is the git blob SHA-1 of the content; the catalog indexes address, version, route, title, words and "keeps no content" | [V] EE-037 |
| Stale cache | Where-used drift, "live or frozen" copies | [V] EE-042 |
| `getStaticProps` at build time (Pages Router) ([getStaticProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props)) | The docs site reads repo records at build through `site/scripts/data.mjs` | [V] |

What the Naive docs don't spell out: read freshness (is a read always live?), what happens when a connector is offline, and the cost of async reads (EE-037 says the router call is asynchronous). [N]

### 6.7 Proxy (middleware) vs governance gates and checks

Next.js Proxy runs before a request completes and is for rewrites, redirects and "optimistic checks"; "it should not be used as a full session management or authorization solution." ([Proxy](https://nextjs.org/docs/app/getting-started/proxy)) Authorization belongs inside each action ([Data Security](https://nextjs.org/docs/app/guides/data-security)).

Naive has three layers that a Next.js developer would place differently:

| Naive mechanism | Runs | Next.js analog | Evidence |
|---|---|---|---|
| Route aliases | Before resolving a route | `redirects` / Proxy rewrite | [V] EE-032 |
| `robots` (what a role may read and write) | Before a read or write | Proxy optimistic permission check | [V] EE-032 |
| `decision_class` gate, draft hold | At the write itself | Auth inside the Server Action | [V] EE-030, EE-032 |
| `check-ready.mjs` before a handoff is claimed | Before work starts | (none; closest is a CI precondition) | [V] `operations/handoff-v2.md` |
| `node test.mjs` and the publication gate | After work, before merge or publish | CI and `next build` | [V] `test.mjs`, EE-025 |

The docs should borrow Next.js's warning directly: route-level checks are a convenience; the authoritative gate is at the write. [P]

### 6.8 create-next-app vs init-venture

| `create-next-app` | `init-venture` | Evidence |
|---|---|---|
| Default template | Default venture | [V] path `schema/init-venture.mjs`; options not read [N] |
| Prompts for TypeScript, ESLint, Tailwind and others | `--layers` for partial adoption | [V] EE-030 |
| `--example` from the official examples or any public GitHub repo | "init-venture and templates" (framework); template gallery (platform) | [V] EE-041 |
| Writes `AGENTS.md` for coding agents | Install skill for Claude Code and Cursor | [V] EE-030 |

Gap: a documented options table for `init-venture`, and a decision on whether `--example <github-url>` (a third-party venture template) is framework or platform. [P]

### 6.9 Codemods and upgrades vs migrations

Next.js ships `npx @next/codemod <transform> <path>` with `--dry` and `--print`, per-version upgrade guides, and an agent-driven upgrade. ([Codemods](https://nextjs.org/docs/app/guides/upgrading/codemods), [Upgrading](https://nextjs.org/docs/app/getting-started/upgrading)) Naive has route aliases for renamed routes (EE-032) and superseded decisions (EE-035). [V] It has no version numbers, changelog or record-migration tool in what I read. [N] Every schema rename or layer move (for example EE-038 moving handoffs to `operations/handoffs/`) is a migration that ventures outside this repo would need to run. [P] for a `migrate` command with `--dry` and `--print`, one transform per decision id.

### 6.10 Server and Client Components vs framework and platform

Next.js's Server/Client boundary has a section on "Preventing environment poisoning" ([Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)). Naive's boundary is framework vs platform: "nothing outside it imports from it", enforced by `check-boundary.mjs` (EE-041). [V] Same shape (a hard import boundary with a checker), different axis (offline vs vendor, not server vs browser). The docs can use the analogy for the boundary rule, and should not suggest that Naive has a client side. [P]

### 6.11 State, reducers and the provenance log

React's reducer consolidates "all the state update logic... in a single function" ([Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Naive's provenance log is an append-only list of actions (write, draft, accept, baseline) with hashes (EE-031). [V] The partial match: a venture's current state is its records, and the log records how they got there. It is not a reducer (records aren't recomputed from the log). The docs can mention it as a DeepDive, not as a core analogy. [P]

---

## 7. Gaps Naive should adopt

Ranked by how much each one helps a Next.js or React developer feel at home, weighed against effort. The top five are the ones in the Summary.

| Rank | Gap | Model | Why it matters | Depends on |
|---|---|---|---|---|
| 1 | **"Designing a docket" guide**, and a decision on what a docket is (record type, kit, or pattern) | [Forms](https://nextjs.org/docs/app/guides/forms), [Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state) | Decisions are the core action in Naive; a form is the most familiar way to teach input, validation and authorization | Torian defines "docket" (Section 11, Q1) |
| 2 | **Custom kits guide, "Rules of kits", kit manifest reference, and a kits lint** | [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks), [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks), [Lints](https://react.dev/reference/eslint-plugin-react-hooks) | Torian's own analogy; React teaches it with a page, a rule set and a linter | Q2 (third-party kits model) |
| 3 | **Learn track starting with "Thinking in Naive"** | [Thinking in React](https://react.dev/learn/thinking-in-react), [Learn](https://react.dev/learn) | Next.js assumes you know React and sends newcomers to a course first ([Next.js Docs](https://nextjs.org/docs)). Naive's ICP is low- to no-code (EE-045), so Naive needs the course too | None |
| 4 | **Versioning, upgrade guides and codemods (`migrate`)** | [Upgrading](https://nextjs.org/docs/app/getting-started/upgrading), [Codemods](https://nextjs.org/docs/app/guides/upgrading/codemods) | Ventures live outside this repo; schema changes will break them silently without it | A version scheme |
| 5 | **Project Structure page and per-file conventions reference** | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure), [File-system conventions](https://nextjs.org/docs/app/api-reference/file-conventions) | The App Router match (EE-032) is invisible unless the files are listed in one place | Q5 (files or behaviors) |
| 6 | Bundled, version-matched docs for agents | [AI Coding Agents](https://nextjs.org/docs/app/guides/ai-agents) | Naive is agent-first; Next.js ships its docs inside the package so agents don't use stale training data | Fumadocs `llms.txt` (PR #21) |
| 7 | `init-venture` options reference and `--example` templates | [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app) | The first command a new user runs | Q3 |
| 8 | Error handling page: expected vs unexpected | [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) | Next.js separates returned errors from thrown ones; Naive's `error` and `not-found` answers fit the first, crashed checks the second | None |
| 9 | Data security page for agents | [Data Security](https://nextjs.org/docs/app/guides/data-security) | Gates, drafts, the platform boundary and credentials (framework connectors "name no credentials", EE-041) in one place | None |
| 10 | Glossary with "If you know X" column | [Glossary](https://nextjs.org/docs/app/glossary) | Section 9.3; data-driven to respect "never copy data into a page" | Ontology field (Q6) |
| 11 | Testing guide | [Testing](https://nextjs.org/docs/app/guides/testing) | `node test.mjs`, Gherkin features (`schema/bdd.mjs`), connector evals | None |
| 12 | Production checklist analog ("Ready to publish") | [Production](https://nextjs.org/docs/llms.txt) | Ties the publication gate (EE-025) to a checklist | None |

---

## 8. Not applicable

These have no meaningful Naive counterpart. The docs should not force analogies here.

| Next.js / React area | Why not | Source |
|---|---|---|
| CSS, Sass, Tailwind, CSS-in-JS, fonts, images | Naive renders no UI for end users | [llms.txt](https://nextjs.org/docs/llms.txt) |
| Bundling, Turbopack, webpack, compiler, Fast Refresh, Edge Runtime | No build of client code | [llms.txt](https://nextjs.org/docs/llms.txt) |
| Prefetching, navigation, view transitions, streaming UI | No browser navigation | [llms.txt](https://nextjs.org/docs/llms.txt) |
| Hydration, React DOM client and server APIs | No DOM | [react.dev llms.txt](https://react.dev/llms.txt) |
| Refs and DOM manipulation, `useLayoutEffect`, `useInsertionEffect` | No DOM | [Refs](https://react.dev/learn/referencing-values-with-refs) |
| React Compiler, memoization (`useMemo`, `useCallback`, `memo`) | No render loop to optimize | [react.dev llms.txt](https://react.dev/llms.txt) |
| Legacy class APIs (`Component`, `PureComponent`, `createElement`) | No history to keep | [react.dev llms.txt](https://react.dev/llms.txt) |
| Pages Router rendering modes (SSR, SSG, CSR) | Naive's views are Markdown; build-time reads only matter for the docs site | [Pages Router](https://nextjs.org/docs/pages) |
| Internationalization, PWAs, analytics, OpenTelemetry | Not framework concerns today; analytics is platform (EE-041) per the PR #20 handoff | [llms.txt](https://nextjs.org/docs/llms.txt) |

The docs site itself is a Next.js app (Fumadocs, per PR #21), so all of the above still applies to people working on `site/`. That belongs in `site/AGENTS.md`, not in Naive's user docs.

---

## 9. Proposed Naive docs IA

### 9.1 Principles

1. **Next.js's three-section shape** (Getting Started, Guides, API Reference) because it's what the audience knows. ([Next.js Docs](https://nextjs.org/docs))
2. **React's Learn track in front of it**, because Naive's ICP doesn't already know the underlying ideas (EE-045), just as Next.js sends React newcomers to a course first.
3. **One page per concept in Getting Started, one page per file, command, record type or check in API Reference.** Reference pages are generated from the repo where possible (`site/scripts/data.mjs` already does this for routes, nouns, kits and decisions).
4. **Interface tabs instead of a router switcher** (Section 6.3).
5. **Mentura is a separate top-level section**, marked as platform, so framework docs never document platform features "as if they ship" (PR #20 handoff, `naive-docs-and-marketing-site.md`).

### 9.2 Sidebar

All pages are [P]. Pages that exist today in some form are marked (exists).

```text
Naive docs
├─ Introduction                         (exists: index)
│   └─ "Naive for Next.js and React developers" box
├─ Learn                                 React Learn model; tutorial + explanation
│   ├─ Quick start: your first venture in five minutes   (exists in part: first-venture)
│   ├─ Thinking in Naive
│   ├─ Describing a venture: venture.json, layers, records
│   ├─ Deciding: dockets, decision rights, drafts
│   ├─ Managing records: one source of truth per fact
│   └─ Escape hatches: editing files directly, connectors, platform
├─ Getting Started                       Next.js Getting Started model
│   ├─ Installation                      (exists: install)
│   ├─ Project structure
│   ├─ Layers and kits                   (exists: concepts/layers-and-kits)
│   ├─ Routes and records                (exists in part: interfaces/routes)
│   ├─ Layouts and context
│   ├─ Reading records
│   ├─ Writing records and gates
│   ├─ Drafts and acceptance
│   ├─ Error handling (not-found, error, loading)
│   ├─ Checks                           (node test.mjs)
│   ├─ Need-now
│   ├─ Provenance                        (exists: concepts/provenance)
│   ├─ Ventures and phases               (exists: concepts/ventures-and-phases)
│   ├─ Governance                        (exists: concepts/governance)
│   ├─ Validation                        (exists: concepts/validation)
│   └─ Upgrading
├─ Guides                                Next.js Guides model; how-to
│   ├─ Designing a docket
│   ├─ Building a custom kit
│   ├─ Using templates (first-party and third-party)
│   ├─ Handoffs: delegating work to agents
│   ├─ Connecting sources (connectors)
│   ├─ Source of truth and where-used
│   ├─ Departments
│   ├─ Publishing (the publication gate)
│   ├─ AI coding agents
│   ├─ Data security
│   ├─ Testing
│   ├─ Migrating (from a vault or an earlier Naive)
│   └─ Ready to publish checklist
├─ API Reference                         generated where possible
│   ├─ File conventions                  venture.json, kit.json, [id], (phase), layout, not-found,
│   │                                    loading, error, views, provenance.jsonl, sources.json,
│   │                                    route-aliases.json, handoff .json + .md
│   ├─ Routes                            (exists: RouteTable)
│   ├─ Record types                      one page per schema
│   ├─ Kits                              (exists: Kits component)
│   ├─ Rules of kits                     one page per rule + lint
│   ├─ Decision classes                  from decision-rights.json
│   ├─ CLI                               (exists: interfaces/cli) + init-venture, add, migrate
│   ├─ MCP server                        (exists: interfaces/mcp)
│   ├─ HTTP API                          (exists: interfaces/api)
│   ├─ Checks                            one page per check-*.mjs
│   ├─ Decisions                         (exists: reference/decisions)
│   ├─ File formats                      (exists: reference/file-formats)
│   └─ Glossary                          (exists: reference/nouns) + "If you know" column
├─ Architecture                          Next.js Architecture model; explanation
│   ├─ Framework and platform
│   ├─ The router
│   └─ Provenance model
├─ Mentura (platform)                    clearly marked; only what ships
└─ Changelog
```

### 9.3 "If you know X, in Naive it is Y" glossary

Proposed content for the glossary column. Rows tagged [V] are backed by the files cited in Sections 4 to 6; rows tagged [P] are my proposals.

| If you know | In Naive it is | Tag |
|---|---|---|
| Next.js | Naive | [V] EE-041 |
| Vercel | Mentura | [V] EE-041 |
| Deployment adapter | Platform connector | [V] EE-041 |
| `create-next-app` | `init-venture` | [V] |
| `next` CLI | The CLI (`mentura` today) | [V] EE-030 |
| `package.json` dependencies | `venture.json` imports | [V] EE-048 |
| `npm install <pkg>` | `mentura add <department> --venture <id>` | [V] EE-048 |
| `next.config.js` | `venture.json` | [P] |
| `app/` folder | The venture folder | [V] EE-032 |
| Route segment | Layer (and kit) | [V] EE-032 |
| `[slug]` | `[id]` | [V] EE-032 |
| Catch-all segment | Nested venture path | [V] EE-032 |
| `(group)` | `(discovery)` to `(platform)` | [V] EE-032 |
| `layout.js` | `layout` (agent context) | [V] EE-032 |
| `page.js` | View | [V] EE-032 |
| `not-found.js`, `loading.js`, `error.js` | `not-found`, `loading`, `error` | [V] EE-032 |
| Parallel routes | `system/overview` slots | [V] EE-032 |
| `redirects` | Route aliases | [V] EE-032 |
| `robots.txt` | `robots` (role read/write) | [V] EE-032 |
| Route Handler | HTTP API / MCP route | [V] EE-030 |
| Server Action | A `write` on a route | [V] EE-030 |
| Zod `safeParse` in an action | Schema validation on every write | [V] EE-030 |
| Auth check in an action | `decision_class` gate | [V] EE-032 |
| `useOptimistic` | (none: drafts wait for a person) | [V] EE-030 |
| `<form>` | Docket | [T] |
| Hook | Kit | [T], supported by EE-024 |
| Custom Hook | Custom kit | [T] |
| Rules of Hooks | Rules of kits | [P] |
| `eslint-plugin-react-hooks` | Kits lint / `check-data-model.mjs` | [P] |
| Single source of truth | System of record (source-of-truth matrix) | [V] EE-042 |
| Effect | Connector / integration | [V] EE-037 |
| Context | `layout` context | [V] EE-032 |
| Fetch / cache tag | Connector read / blob SHA version | [V] EE-037 |
| Revalidation | Where-used drift check | [V] EE-042 |
| Proxy | Route aliases + `robots` | [V] EE-032 |
| `next build` + tests | `node test.mjs` | [V] |
| Codemod | `migrate` (proposed) | [P] |
| Glossary | Nouns (`docs/ontology.json`) | [V] |
| Server/Client boundary | Framework/platform boundary | [V] EE-041 |

**Conflict to flag:** `site/AGENTS.md` says "Never copy that data into a page" for nouns. A hand-written table would break that rule. Add an `analogues` field to `docs/ontology.json` nouns and render the column from it. [P]

### 9.4 Page anatomy

Combine Next.js's structure with React's teaching blocks. Component names below are Fumadocs components already on the allowlist in the PR #20 contract (`Callout`, `Cards`, `Steps`, `Tabs`, `Files`, `TypeTable`) unless marked new. [V for the allowlist]

| Element | From | Naive use |
|---|---|---|
| Frontmatter: `title`, `description`, `type`, `status`, `lastReviewed`, `related` | Next.js `related`, research §5.3 | Required; `status: draft` until Torian reads it |
| One-sentence intro | Next.js | What the page helps you do |
| "If you know Next.js" callout | New [P] | One line naming the analog, linking to the glossary |
| "Good to know" callout | Next.js | `Callout type="info"` |
| Pitfall | React | `Callout type="warn"` |
| DeepDive | React | `Accordion` |
| File tree | Next.js | `Files` |
| Interface tabs (CLI / MCP / API / file) | Next.js TS/JS tabs | `Tabs` with a shared group |
| Steps | Next.js tutorials | `Steps` |
| Examples section | Next.js | From `schema/examples/workspace` only |
| Recap and Challenges (Learn only) | React | New components, only if worth it |
| Next steps / API Reference cards | Next.js | `Cards` |

### 9.5 Conflicts with `site/AGENTS.md` and Diátaxis

1. **Diátaxis folders vs Next.js sections.** The PR #20 handoff maps pages into `get-started`, `guides`, `concepts`, `reference` (Diátaxis). Next.js's Getting Started mixes tutorial and explanation on one page, which Diátaxis says to avoid. Options: (a) keep Diátaxis folders and just rename labels to Next.js terms; (b) use Next.js sections and keep Diátaxis as the `type` field per page. Recommendation: (b), with the `type` field enforced by the content check so each page still has one type. [P]
2. **Learn is two Diátaxis types.** React's Learn mixes tutorial and explanation. Put tutorials under Learn and the "why" pages under Architecture.
3. **`_meta.js` vs `meta.json`.** `site/AGENTS.md` in the snapshot says Nextra and `_meta.js`; PR #21 moves to Fumadocs `meta.json`. The IA assumes PR #21 merges. [V for both states]
4. **Never copy repo data into a page** (`site/AGENTS.md`). Applies to the glossary column (Section 9.3) and to any tables of kits, routes or decision classes. Render them.
5. **No instance data** (EE-034, `site/scripts/data.mjs`). Every example (docket, kit) must come from `schema/examples/workspace`, never `instance/`.
6. **Mentura content.** The PR #20 handoff says to mention Mentura only where a page must say "this part is the platform". A top-level Mentura section needs Torian's OK (Q7).

---

## 10. Writing plan

Priority order. Each item is one PR, per Torian's one-item-per-PR rule. P0 pages don't need new decisions; P1 pages need one answer from Section 11 first.

| Priority | Page | Section | Type | Blocked on |
|---|---|---|---|---|
| P0 | Naive for Next.js and React developers (callout on home + glossary column) | Intro, Reference | reference | Q6 (ontology field) |
| P0 | Project structure | Getting Started | explanation | Q5 (partly) |
| P0 | Routes and records (rewrite `interfaces/routes` around EE-032) | Getting Started | explanation | None |
| P0 | File conventions reference (one page per file) | API Reference | reference | Q5 |
| P0 | Writing records and gates | Getting Started | explanation | None |
| P0 | Thinking in Naive | Learn | tutorial | None |
| P1 | Designing a docket | Guides | how-to | Q1 |
| P1 | Building a custom kit | Guides | how-to | Q2 |
| P1 | Rules of kits (+ lint spec) | API Reference | reference | Q2 |
| P1 | Layers and kits (update existing) | Getting Started | explanation | Q2 |
| P1 | init-venture reference and Using templates | API Reference, Guides | reference, how-to | Q3 |
| P1 | Error handling | Getting Started | explanation | None |
| P2 | Upgrading and migrate | Getting Started, Guides | how-to | Q4 |
| P2 | AI coding agents | Guides | how-to | PR #21 |
| P2 | Data security | Guides | explanation | None |
| P2 | Testing | Guides | how-to | None |
| P2 | Framework and platform | Architecture | explanation | Q7 |
| P2 | Remaining Learn chapters | Learn | tutorial | P0 Thinking in Naive |

---

## 11. Open questions for Torian

1. **What is a docket?** A record type (one schema, for example `decision-docket`), a kit (a family of docket types), or a pattern any record type can follow? And is "docket" the user-facing word, given the ledger and code use "decision", "draft" and "handoff"?
2. **Third-party kits: import by reference or copy in?** EE-048 says schemas are never copied into a venture. Should a third-party kit stay upstream (npm-like) while templates and skills can be copied and changed (shadcn-like)? And is a kit registry framework or platform (EE-041 puts the template gallery on the platform side)?
3. **Is `init-venture --example <url>` framework or platform?** Fetching a public template needs the network, which EE-041 keeps out of framework connectors.
4. **Does Naive get version numbers?** Upgrade guides and a `migrate` tool need them.
5. **Are `layout`, `not-found`, `loading` and `error` files a venture can override, or router behaviors only?** This decides how the reference pages read.
6. **Can `docs/ontology.json` nouns carry an `analogues` field** (Next.js, React terms) so the glossary column is generated?
7. **Should Mentura get its own top-level docs section now,** or stay a note on framework pages until it ships?
8. **CLI name:** keep `mentura` in commands, or rename to `naive` before the docs teach it? (EE-043 holds renames until decided.)
9. **Learn track in scope?** It is the biggest writing cost. Next.js relies on React's course; Naive has no one else's course to point to.
10. **Kits as hooks or kits as packages?** EE-024 calls kits "packages". Should the docs lead with "kits are like hooks" (your framing) or "kits are like npm packages that ship hooks" (closer to how they're built)?

---

## 12. Sources

All fetched on October 28, 2026, between about 4:40 and 4:50 PM CDT.

**Next.js indexes:** https://nextjs.org/docs/llms.txt · https://nextjs.org/docs/pages/llms.txt

**Next.js pages:**
https://nextjs.org/docs ·
https://nextjs.org/docs/app ·
https://nextjs.org/docs/pages ·
https://nextjs.org/docs/app/getting-started/installation ·
https://nextjs.org/docs/app/getting-started/project-structure ·
https://nextjs.org/docs/app/getting-started/layouts-and-pages ·
https://nextjs.org/docs/app/getting-started/server-and-client-components ·
https://nextjs.org/docs/app/getting-started/fetching-data ·
https://nextjs.org/docs/app/getting-started/mutating-data ·
https://nextjs.org/docs/app/getting-started/caching ·
https://nextjs.org/docs/app/getting-started/revalidating ·
https://nextjs.org/docs/app/getting-started/error-handling ·
https://nextjs.org/docs/app/getting-started/proxy ·
https://nextjs.org/docs/app/getting-started/route-handlers ·
https://nextjs.org/docs/app/getting-started/metadata-and-og-images ·
https://nextjs.org/docs/app/getting-started/upgrading ·
https://nextjs.org/docs/app/getting-started/deploying ·
https://nextjs.org/docs/app/guides/upgrading/codemods ·
https://nextjs.org/docs/app/guides/forms ·
https://nextjs.org/docs/app/guides/server-actions ·
https://nextjs.org/docs/app/guides/data-security ·
https://nextjs.org/docs/app/guides/ai-agents ·
https://nextjs.org/docs/app/guides/migrating/app-router-migration ·
https://nextjs.org/docs/app/guides/testing ·
https://nextjs.org/docs/app/api-reference/file-conventions ·
https://nextjs.org/docs/app/api-reference/file-conventions/layout ·
https://nextjs.org/docs/app/api-reference/file-conventions/route-groups ·
https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes ·
https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes ·
https://nextjs.org/docs/app/api-reference/file-conventions/template ·
https://nextjs.org/docs/app/api-reference/file-conventions/proxy ·
https://nextjs.org/docs/app/api-reference/cli/create-next-app ·
https://nextjs.org/docs/app/api-reference/cli/next ·
https://nextjs.org/docs/app/api-reference/components/form ·
https://nextjs.org/docs/app/api-reference/directives/use-server ·
https://nextjs.org/docs/app/api-reference/adapters ·
https://nextjs.org/docs/app/api-reference/config/next-config-js ·
https://nextjs.org/docs/app/glossary ·
https://nextjs.org/docs/pages/getting-started/project-structure ·
https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts ·
https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props ·
https://nextjs.org/docs/pages/building-your-application/routing/api-routes ·
https://nextjs.org/docs/pages/guides/forms

**React index:** https://react.dev/llms.txt

**React pages** (fetched as `.md`):
https://react.dev/learn ·
https://react.dev/learn/thinking-in-react ·
https://react.dev/learn/describing-the-ui ·
https://react.dev/learn/your-first-component ·
https://react.dev/learn/passing-props-to-a-component ·
https://react.dev/learn/keeping-components-pure ·
https://react.dev/learn/adding-interactivity ·
https://react.dev/learn/state-a-components-memory ·
https://react.dev/learn/managing-state ·
https://react.dev/learn/reacting-to-input-with-state ·
https://react.dev/learn/choosing-the-state-structure ·
https://react.dev/learn/sharing-state-between-components ·
https://react.dev/learn/extracting-state-logic-into-a-reducer ·
https://react.dev/learn/passing-data-deeply-with-context ·
https://react.dev/learn/scaling-up-with-reducer-and-context ·
https://react.dev/learn/escape-hatches ·
https://react.dev/learn/referencing-values-with-refs ·
https://react.dev/learn/synchronizing-with-effects ·
https://react.dev/learn/you-might-not-need-an-effect ·
https://react.dev/learn/reusing-logic-with-custom-hooks ·
https://react.dev/learn/understanding-your-ui-as-a-tree ·
https://react.dev/learn/writing-markup-with-jsx ·
https://react.dev/reference/react ·
https://react.dev/reference/react/hooks ·
https://react.dev/reference/react/useActionState ·
https://react.dev/reference/react/useOptimistic ·
https://react.dev/reference/react/useReducer ·
https://react.dev/reference/react/useContext ·
https://react.dev/reference/react/useEffect ·
https://react.dev/reference/react/useState ·
https://react.dev/reference/react-dom/hooks/useFormStatus ·
https://react.dev/reference/react-dom/components/form ·
https://react.dev/reference/rules ·
https://react.dev/reference/rules/rules-of-hooks ·
https://react.dev/reference/rules/components-and-hooks-must-be-pure ·
https://react.dev/reference/rules/react-calls-components-and-hooks ·
https://react.dev/reference/rsc/server-components ·
https://react.dev/reference/rsc/server-functions ·
https://react.dev/reference/rsc/use-client ·
https://react.dev/reference/rsc/use-server ·
https://react.dev/reference/eslint-plugin-react-hooks

**Naive (repo files, read in the PR #20 review session, Oct 28, 2026, 2:18 PM CDT, at PR #20 head `52d90bf`):**
`AGENTS.md` (partial) ·
`docs/decisions/decisions.json` (EE-024 to EE-052) ·
`docs/design/LAYERS_AND_KITS_2026-10-27.md` (frontmatter only) ·
`site/AGENTS.md` ·
`site/package.json` ·
`site/scripts/data.mjs` ·
`site/app/layout.jsx` ·
`test.mjs` ·
`schema/handoff.schema.json` ·
`schema/check-ready.mjs` ·
`schema/check-execution.mjs` ·
`schema/check-publication.mjs` ·
`schema/run-handoff.mjs` ·
`operations/handoff-v2.md` ·
`operations/tooling/integrations.json` ·
`governance/venture-template/decision-rights.json` ·
`purpose/strategic-foundation.json` ·
`knowledge/connectors/eval.mjs` ·
`instance/ventures/everything-ecosystem/venture.json` ·
`instance/ventures/everything-ecosystem/products/kit.json` ·
`instance/ventures/everything-ecosystem/products/mentura.json` ·
`instance/ventures/everything-ecosystem/governance/publication-policy.json` ·
`instance/ventures/everything-ecosystem/purpose/validation/problem.json` ·
`instance/ventures/everything-ecosystem/operations/handoffs/naive-docs-and-marketing-site.{md,json,contract.md}`

**Prior research in this repo:** `docs/research/DEV_DOCS_SITE_RESEARCH_2026-10-28.md`.

**Raw material (on my machine, not committed):** Next.js and React Markdown copies and indexes in `/workspace/naive-mapping/src/`; the Naive file extracts in `/workspace/naive-mapping/mirror/`.
