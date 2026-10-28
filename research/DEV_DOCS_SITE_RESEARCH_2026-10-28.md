---
title: Building developer documentation sites from MDX on Vercel
description: Research, best practices, a recommended stack, and an agent-executable implementation plan.
date: 2026-10-28
author: Grok Bot, for Torian CJ
status: research-complete
---

# Building developer documentation sites from MDX on Vercel

Research date: Wednesday, October 28, 2026 (all times America/Chicago, CDT).

## 0. The short answer

- **Recommended stack: Fumadocs on Next.js, deployed to Vercel**, with Fumadocs MDX as the content source, the built-in search engine, Fumadocs' LLM routes (`llms.txt`, `llms-full.txt`, per-page `.md`), and Fumadocs OpenAPI if you have an API. It is the most actively maintained MDX docs framework on the React/Next.js side as of this week, it is what shadcn/ui and Vercel's own new docs template (Geistdocs) are built on, and its content conventions (one `.mdx` file per page, a Zod-validated frontmatter schema, `meta.json` for ordering) are simple enough for agents to follow without guessing. Sources in §3 and §5.
- **Runner-up: Starlight (Astro).** It's the better pick if you want the least JavaScript and the strongest built-in accessibility defaults, and you don't need React-based interactivity. It deploys to Vercel as a static site with no adapter.
- **Mintlify** is the fastest path if you'd rather not own a codebase at all. It's hosted (you can put it under `/docs` on a Vercel domain with rewrites), but AI features cost $450–$540/month and you get less control.
- **Nextra:** not recommended for new work right now. No stable release since December 4, 2025, and v5 is happening in a different repo.
- **v0 (not "Veo"):** useful for prototyping a custom landing page or one-off interactive components, then porting them into the docs repo by PR. It should **not** be the docs pipeline. "Veo" is Google DeepMind's video-generation model and has nothing to do with Vercel. Details in §4.

---

## 1. Methodology

### 1.1 Goal and the question behind it

The goal: Torian writes (or has agents write) documentation as `.mdx` files, and coding agents turn those files into a high-quality docs website deployed on Vercel.

Starting from first principles, the problem breaks into three separable parts:

1. **Content contract.** What must a `.mdx` file contain so that any agent can turn it into a correct page? This means frontmatter, file naming, ordering, and an allowed component vocabulary.
2. **Renderer.** Which framework deterministically turns those files into a site with good navigation, search, code blocks, accessibility, and performance, while keeping custom code to a minimum?
3. **Gates.** What automated checks make a bad page fail before it ships, so quality doesn't depend on an agent's judgment? This covers schema validation, links, prose style, accessibility, and build.

If those three are right, an agent's job shrinks to "write files that satisfy the contract, then make CI green". Everything below is chosen to serve that.

### 1.2 How the research was done

- **Tools.** Web search (WebSearch), page fetches (WebFetch), and direct `curl` probes from my machine against live sites, the npm registry (`registry.npmjs.org`), and the GitHub REST API. The `parallel-cli` deep-research tool was **not installed** on my machine, so I did the research manually with these tools. Every claim below links to the page it came from.
- **Primary-source rule.** Version numbers, release dates, and repository activity come from npm, GitHub, or the project's own changelog. Search-engine summaries were used only to find pages, then checked against the page itself.
- **Live probes (run Oct 28, 2026, ~12:30–1:30 PM CDT).** For 22 docs sites I requested `/llms.txt`. For 14 docs pages I requested both `Accept: text/markdown` and the `.md` suffix, recording the HTTP status and `Content-Type`. Raw output is saved next to this file as `llms_probe.txt` and `md_probe.txt`. I also grepped page HTML for framework fingerprints, such as the Starlight generator tag and the Algolia DocSearch markup.
- **Sites studied:** Stripe, Vercel, Next.js, React (react.dev), Tailwind CSS, Supabase, Cloudflare, Linear, Anthropic (Claude platform docs), OpenAI, shadcn/ui, Astro, plus the framework sites themselves (Fumadocs, Starlight, Nextra, Docusaurus, Mintlify).
- **Evaluation criteria for frameworks:**
  1. Fit with `.mdx` authoring.
  2. Deploys on Vercel with no special setup.
  3. Agent-friendliness: conventions are explicit and schema-validated, and the generated output is AI-readable.
  4. Built-in features (search, code blocks, versioning, OpenAPI, i18n, feedback).
  5. Maintenance health: last release and last push as of Oct 28, 2026.
  6. Cost and lock-in.
- **Limits.**
  - I did not do visual or usability testing in a browser. Claims about how sites look are limited to what the sites document or what their HTML shows.
  - The Geistdocs source repository and docs site are not publicly reachable. The GitHub API returns 404, and `preview.geistdocs.com` redirects to a Vercel sign-in page. So Geistdocs is assessed only from its public npm package and public adoption evidence.
  - Probe results are a snapshot from today.

---

## 2. What the best developer docs sites have in common

### 2.1 Survey of exemplars (verified facts only)

| Site | What's notable (verified) | Source |
|---|---|---|
| **Stripe** | Docs "designed to feel like an application": the reader's own test API key is inserted into code samples, content is personalized by location and features used, and there are checklists and collapsible sections. Content is authored in **Markdoc**, Stripe's constrained Markdown dialect, which deliberately leaves out loops and variable assignment to keep content maintainable. Markdoc validates every tag and internal link in CI. | [Stripe: How Stripe builds interactive docs with Markdoc](https://stripe.dev/blog/markdoc) |
| **Stripe (probe)** | `/llms.txt` returns 200 `text/markdown`. Docs pages return Markdown both via `Accept: text/markdown` and via the `.md` suffix. | Probe, §1.2 |
| **Vercel** | Docs answer `Accept: text/markdown` with Markdown at the same URL, send `Vary: Accept`, and publish `llms.txt`, `llms-full.txt`, and `sitemap.md` for discovery. | [Vercel: Markdown and Agent Discovery](https://vercel.com/docs/agent-resources/markdown-access), [How to serve documentation for agents](https://vercel.com/kb/guide/how-to-serve-documentation-for-agents) |
| **Next.js** | A sidebar switcher toggles between App Router and Pages Router docs. GitHub issues show the confusion it can cause when a page exists in only one router, and the fixes. Probe: `/docs/llms.txt` exists, pages serve Markdown, and the HTML includes "Ask AI" and "Feedback" UI. | [Next.js Docs](https://nextjs.org/docs), [issue #72829](https://github.com/vercel/next.js/issues/72829), [PR #75427](https://github.com/vercel/next.js/pull/75427) |
| **React (react.dev)** | Split into **Learn** (a self-paced course) and **API Reference** (one page per API). Launched with 600+ editable interactive sandboxes. Probe: `/llms.txt` exists, and the HTML includes Algolia DocSearch markup. | [Introducing react.dev](https://react.dev/blog/2023/03/16/introducing-react-dev) |
| **Supabase** | Open-source docs app (`apps/docs`, Next.js). Reference navigation is defined per client SDK and language (JavaScript, Dart, C#, Swift, Kotlin, Python). Probe: `llms.txt` and Markdown pages exist. | [supabase/apps](https://github.com/supabase/supabase/tree/master/apps), [navigation.references.ts](https://github.com/supabase/supabase/blob/a5f4a59e/apps/docs/content/navigation.references.ts) |
| **Cloudflare** | Moved its docs from Hugo to Astro + Starlight, converting about 8,000 files with Markdown-AST tooling. In July 2026 it completed a further move from Starlight to an in-house build ("Nimbus"). Probe: `llms.txt` exists and pages negotiate Markdown. | [Cloudflare blog](https://blog.cloudflare.com/open-source-all-the-way-down-upgrading-our-developer-documentation/), [Kian: migrating with mdast](https://kian.org.uk/using-mdast-to-migrate-cloudflare-docs-from-hugo-to-starlight/), [cloudflare-docs PR #32203](https://github.com/cloudflare/cloudflare-docs/pull/32203) |
| **Anthropic** | Developer docs run on Mintlify (a listed Mintlify customer). Probe: `docs.anthropic.com/llms.txt` redirects to `platform.claude.com/llms.txt`, and pages serve Markdown. | [Mintlify: Anthropic](https://www.mintlify.com/customers/anthropic) |
| **OpenAI** | Probe: `developers.openai.com/llms.txt` exists. `platform.openai.com/docs/llms.txt` redirects to `developers.openai.com/api/docs/llms.txt`. Pages serve Markdown. | Probe |
| **Linear** | Probe: root `/llms.txt` exists, and `/docs/...` pages serve Markdown by both methods. | Probe |
| **shadcn/ui** | Docs built with **Fumadocs** (`defineDocs`, `loader()`, `rehype-pretty-code`). Probe: `llms.txt` and `.md` pages exist. | [shadcn source.ts](https://github.com/shadcn-ui/ui/blob/31dbc6fc/apps/v4/lib/source.ts), [source.config.ts](https://github.com/shadcn-ui/ui/blob/4baadbc6/apps/v4/source.config.ts) |
| **Astro** | `docs.astro.build` is built with Starlight v0.42.7 (generator fingerprint in the HTML). Probe: no root `llms.txt` and no `.md` pages at the time of the probe. | Probe |
| **Tailwind CSS** | Probe: no `llms.txt` and no `.md` page variant, which shows these practices aren't universal yet. The HTML includes DocSearch/Algolia markup. | Probe |

**AI-readability probe summary (Oct 28, 2026):**
- 16 of 22 URLs returned an `llms.txt`.
- 12 of 14 sampled pages returned Markdown for at least one of the two methods. (react.dev returns its raw MDX source labeled `text/plain`. Only Tailwind and Astro returned HTML both times.)

The practice is now mainstream among the leading API companies (Stripe, Vercel, Anthropic, OpenAI, Supabase, Cloudflare, Linear), but not universal (Tailwind, Astro, Docusaurus, Nextra did not return one). Raw data: `llms_probe.txt`, `md_probe.txt`.

### 2.2 Shared design principles

**1. Organize by reader need: Diátaxis.** Diátaxis separates docs into four types: tutorials (learning by doing), how-to guides (doing a specific task), reference (neutral, complete facts), and explanation (why). It also says to keep the four types apart. ([Diátaxis: Start here](https://diataxis.fr/start-here/), [The map](https://diataxis.fr/map/)) react.dev's Learn / Reference split is a two-type version of the same idea ([react.dev](https://react.dev/blog/2023/03/16/introducing-react-dev)). **Implementation:** make the four types the top-level folders. Make "type" a required frontmatter field so CI can enforce it (§5.3).

**2. Navigation.** Every leading site uses the same skeleton:
- a persistent left sidebar (the page tree)
- a right-hand "on this page" table of contents
- search, with a ⌘K / Ctrl-K dialog
- breadcrumbs
- prev/next links

When docs cover parallel products or versions, use a switcher at the top of the sidebar (Next.js's App/Pages Router switch). Make it map to the *same page* in the other variant, because Next.js's issue history shows that landing users on a missing page confuses them ([#72829](https://github.com/vercel/next.js/issues/72829)). Fumadocs builds this behavior into its "root type" versioning: switching versions goes to the page at the same relative path, or to the index if that page is missing ([Fumadocs page conventions](https://www.fumadocs.dev/docs/page-conventions)).

**3. Code is the product.** Agents and people both copy code. Vercel's agent study found that when an agent's answer contained code, 61% (73 of 119 runs) contained lines lifted verbatim from a page on the site ([Vercel Agent Readability Spec](https://vercel.com/kb/guide/agent-readability-spec)). Code blocks therefore need:
- a language tag (always)
- a filename/title
- a copy button
- line highlighting, diff (`++`/`--`), and focus
- tabbed groups for package managers or languages, with a shared, persistent tab choice

Fumadocs supports all of these with Shiki notation (`// [!code highlight]`, `[!code ++]`, `[!code word:x]`, `title="…"`, `lineNumbers`, `tab="…"`, `tab-group`) ([Fumadocs Markdown](https://www.fumadocs.dev/docs/markdown)). Starlight uses Expressive Code by default ([Starlight config](https://starlight.astro.build/reference/configuration/)). Stripe goes further and inserts the reader's own test key ([Stripe](https://stripe.dev/blog/markdoc)). That's a later enhancement, not a requirement for launch.

**4. Constrain authoring, put power in components.** Stripe's main lesson: mixing code and content made content authoring "effectively become software development". Its fix was a small set of composable, schema-validated tags, with logic kept outside the content ([Stripe](https://stripe.dev/blog/markdoc)). For an MDX pipeline driven by agents, that translates to **a fixed allowlist of MDX components** that agents may use, no ad-hoc `import`s in content files, and validation in CI.

**5. API reference is generated, not hand-written.** Generate it from the OpenAPI spec so it can't drift from the code. Fumadocs OpenAPI generates MDX pages per operation or tag, with an interactive playground ([Fumadocs OpenAPI](https://www.fumadocs.dev/docs/integrations/openapi), [generateFiles](https://www.fumadocs.dev/docs/integrations/openapi/generate-files)). Also publish `openapi.json` itself: on the seven sites in Vercel's study that shipped one, agents fetched it in 21% of runs ([Vercel spec](https://vercel.com/kb/guide/agent-readability-spec)).

**6. Versioning only when you have to.** Keep a single "latest" version until a real breaking release forces you to keep old docs. Fumadocs offers in-site versions via `meta.json` (`"root": "version"`) or one deployment per version ([Fumadocs navigation](https://www.fumadocs.dev/docs/navigation)).

**7. Readable typography.** Body text at about 50–75 characters per line (Baymard), and roughly `max-width: ~70ch` ([Baymard](https://baymard.com/research-articles/line-length-readability), [Google Fonts on measure](https://fonts.google.com/knowledge/using_type/understanding_measure_line_length)). Dark mode with a system default is standard in all the frameworks compared here.

**8. Accessibility (WCAG 2.2 AA).** WCAG 2.2 became a W3C Recommendation on October 5, 2023. Its new criteria include 2.4.11 Focus Not Obscured and 2.5.8 Target Size (24×24 CSS px minimum) ([W3C](https://www.w3.org/WAI/news/2023-10-05/wcag22rec/), [What's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)). Starlight 0.41.3+ traps focus in the mobile menu specifically to meet 2.4.11 ([Starlight 0.42](https://astro.build/blog/starlight-042/)).

**9. Server-rendered, fast, crawlable.** Answers must be in the initial HTML. In Vercel's controlled probes, a fetch-only client couldn't retrieve an answer that existed only in JavaScript, and a 403 blocked both clients ([Vercel spec](https://vercel.com/kb/guide/agent-readability-spec)). Other basics from the same spec:
- return real `404`s (no soft 404s)
- return `429` with `Retry-After` when throttling
- publish a sitemap
- give every page an OG image (Next.js supports `opengraph-image.tsx` with `ImageResponse`: [Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image), [Vercel OG](https://vercel.com/docs/og-image-generation))

**10. AI-readability is now table stakes.** The current llms.txt proposal (v2, updated Aug 10, 2026) says:
- an `/llms.txt` with an H1 is the only required section
- add an optional blockquote summary
- add H2 sections listing links
- serve a clean Markdown version of each page at `page.md`
- advertise it with `rel="alternate" type="text/markdown"` and `rel="describedby"`

([llmstxt.org](https://llmstxt.org/))

Vercel's study (1,033 agent runs, June–Aug 2026) adds more data:
- 95.7% of fetches that named a format asked for Markdown.
- Agents reached `llms.txt` through *links* in 86% of fetches, so link to it from the footer and `<head>`.

The same study also warns: "Make the HTML work before adding a Markdown mirror." ([Vercel spec](https://vercel.com/kb/guide/agent-readability-spec)) Page-level "Copy as Markdown" and "Open in ChatGPT/Claude" buttons are built into Fumadocs ([Fumadocs AI & LLMs](https://www.fumadocs.dev/docs/integrations/llms)) and Nextra 4.5+ ([Nextra releases](https://github.com/shuding/nextra/releases)).

**11. Feedback loop.** Leading sites (Next.js: observed "Feedback" UI) ask "was this helpful?" on every page. Fumadocs ships page-level and block-level feedback components with a server action you wire to your analytics ([Fumadocs Feedback](https://www.fumadocs.dev/docs/integrations/feedback)). Pair this with Vercel Web Analytics and Speed Insights, which are available on all plans ([Speed Insights](https://vercel.com/docs/speed-insights)).

**12. Changelog.** Follow Keep a Changelog: written for humans, newest first, dated, grouped as Added / Changed / Deprecated / Removed / Fixed / Security, with an Unreleased section on top ([keepachangelog.com](https://keepachangelog.com/en/2.0.0/)).

**13. Search.** There are four realistic options:

| Option | How it works | When to pick it | Source |
|---|---|---|---|
| Framework built-in (Fumadocs ZBSearch, formerly Orama) | Index built from your content. Served from an API route or as a static JSON index. | Default. No third party, works on previews. | [Fumadocs search](https://www.fumadocs.dev/docs/search/orama) |
| Pagefind | Indexes the built HTML after the build. A chunked static index (under 300 kB of network for a 10k-page site, typically ~100 kB). | Static sites (Starlight and Nextra use it by default). | [pagefind.app](https://pagefind.app/), [Starlight search](https://starlight.astro.build/guides/site-search/), [Nextra search](https://nextra.site/docs/guide/search) |
| Algolia DocSearch | Hosted crawler plus UI. Free for public technical docs since Oct 2023. Must keep the "Search by Algolia" logo. Not for staging or private sites. | Large public docs that want the react.dev-style experience. | [Algolia blog](https://www.algolia.com/blog/product/algolia-docsearch-is-now-free-for-all-docs-sites), [DocSearch terms](https://www.algolia.com/policies/docsearch-plan-specific-terms) |
| AI "Ask" chat | Retrieval over your docs plus an LLM. | Later, once content is solid. | §4.3 |

**14. Write like Google's style guide.** Use a conversational, direct tone, address the reader as "you", use active voice, and write imperative steps ("Click **Submit**") ([Google style: tone](https://developers.google.com/style/tone), [person](https://developers.google.com/style/person), [voice](https://developers.google.com/style/voice)). The Vale prose linter ships a `Google` style package and lints `.mdx` natively from v3.18.0 ([Vale packages](https://docs.vale.sh/keys/packages), [Vale MDX](https://docs.vale.sh/formats/mdx)).

---

## 3. Framework comparison (as of October 28, 2026)

Versions and dates come from the npm registry and the GitHub API, queried today.

| | **Fumadocs** | **Starlight (Astro)** | **Mintlify** | **Docusaurus** | **Nextra** |
|---|---|---|---|---|---|
| Latest version | `fumadocs-ui` 16.17.9, published Oct 28, 2026 ([npm](https://www.npmjs.com/package/fumadocs-ui)). 16.17 minor on Oct 9 ([blog](https://www.fumadocs.dev/blog/v16-17)) | `@astrojs/starlight` 0.42.7, Oct 23, 2026 ([changelog](https://github.com/withastro/starlight/releases)) | Hosted. CLI `mint` 4.2.x published today ([npm](https://www.npmjs.com/package/mint)) | 3.10.2, Jul 10, 2026 ([changelog](https://docusaurus.io/changelog)) | 4.6.1, **Dec 4, 2025** ([npm](https://www.npmjs.com/package/nextra)) |
| Repo activity | `fuma-nama/fumadocs`: pushed today, ~13.5k stars, MIT | pushed today, ~9.5k stars, MIT | n/a (closed platform) | pushed Oct 23, ~66.6k stars, MIT | `shuding/nextra`: last push Jul 31, last main commit Jun 23, 2026. v5 planned in `dimaMachina/nextra` ([About](https://nextra.site/about), [issue](https://github.com/dimaMachina/nextra/issues/55)) |
| Stack | React. Next.js (also React Router, TanStack Start, Waku, Astro) | Astro, ships little JS | Mintlify-hosted MDX + `docs.json` | React SPA/SSG | Next.js App Router |
| Content model | `content/docs/**.mdx` + `meta.json`. Zod (Standard Schema) frontmatter validation ([conventions](https://www.fumadocs.dev/docs/page-conventions), [collections](https://www.fumadocs.dev/docs/mdx/collections)) | Astro content collections | `.mdx` + `docs.json` ([schema](https://www.mintlify.com/docs/organize/settings-reference)) | `docs/**.mdx` + sidebars | `content/**.mdx` + `_meta.js` ([meta](https://nextra.site/docs/file-conventions/meta-file)) |
| Search | Built-in ZBSearch. Algolia, Typesense, Meilisearch, Orama Cloud, Mixedbread also supported ([search](https://www.fumadocs.dev/docs/search/orama)) | Pagefind built in | Built in | Algolia DocSearch (typical) | Pagefind |
| AI-readability | First-class: `llms.txt`, `llms-full.txt`, `.md` routes, `Accept` negotiation, Copy-Markdown buttons, MCP server, Ask-AI via AI SDK ([LLMs](https://www.fumadocs.dev/docs/integrations/llms)). 16.17 rebuilt Markdown output to preserve source as written ([blog](https://www.fumadocs.dev/blog/v16-17)) | Community plugin `starlight-llms-txt` ([plugin](https://delucis.github.io/starlight-llms-txt/)) | Automatic `llms.txt` + `.md` ([llmstxt.org integrations](https://llmstxt.org/)) | Community `docusaurus-plugin-llms` ([llmstxt.org](https://llmstxt.org/)) | Copy-page button (4.5+) |
| OpenAPI | `fumadocs-openapi` v12 with playground | Community plugins | Built-in playground | Community plugins | TSDoc tables only |
| Vercel fit | Native Next.js. Vercel auto-detects it ([deploying](https://www.fumadocs.dev/docs/deploying)) | Static output deploys with zero config, no adapter ([Astro on Vercel](https://docs.astro.build/en/guides/deploy/vercel/)) | Hosted elsewhere. Mount under `/docs` with Vercel rewrites ([guide](https://www.mintlify.com/docs/deploy/vercel)) | Zero-config template ([Vercel templates](https://vercel.com/templates/documentation)) | Native. Official "Nextra: Docs Starter Kit" template |
| Cost | Free (MIT) | Free (MIT) | Starter $0 (no AI). Pro $450/mo annual or $540/mo monthly ([pricing](https://www.mintlify.com/pricing)) | Free | Free |
| Agent-friendliness | **High**: explicit file conventions, schema-validated, `npm create fumadocs-app` ships LLM routes by default, and the Quick Start includes copyable "setup instructions for your agent" ([Quick Start](https://www.fumadocs.dev/docs)) | High: simple conventions, accessible by default | High for content. Low for custom code (it's a platform) | Medium: mature but heavier, webpack/React SPA | Medium. Maintenance risk |

**Vercel's own direction.** Vercel publishes `@vercel/geistdocs`, which it describes as a Next.js 16 docs template **built on Fumadocs**. It has AI chat (AI SDK + AI Gateway), "edit on GitHub", feedback, i18n, RSS, and MCP. Version 2.14.0 was published Oct 27, 2026 ([npm](https://www.npmjs.com/package/@vercel/geistdocs)). Vercel has moved the Turborepo docs onto it ([PR #13320](https://github.com/vercel/turborepo/pull/13320), merged Jul 10, 2026) and added a Geistdocs site to the AI SDK repo ([commit](https://github.com/vercel/ai/commit/159785c2eeb972975860c1ed0983509189000154)). It also depends on `@vercel/agent-readability`, Vercel's middleware for serving Markdown to agents ([npm](https://www.npmjs.com/package/@vercel/agent-readability)).

Caveat: Geistdocs' repo and docs site aren't publicly reachable today, and a third-party skill file describes it as "beta". So use it as **evidence that Fumadocs is Vercel's chosen foundation**, not as the base to build on.

**Content-layer libraries (only needed if you build a custom Next.js site without a docs framework):**
- **Contentlayer** is unmaintained. Its README says so and points to the `contentlayer2` fork, whose last publish was May 2025 ([README](https://github.com/contentlayerdev/contentlayer/blob/main/packages/contentlayer/README.md), [npm](https://www.npmjs.com/package/contentlayer2)).
- **Content Collections** (`@content-collections/core` 0.15.3, Sep 21, 2026) is the documented successor ([migration guide](https://www.content-collections.dev/docs/migration/contentlayer)).
- **Velite** (0.4.0, Jun 2026; repo pushed today) is an alternative ([npm](https://www.npmjs.com/package/velite)).

Fumadocs MDX makes all three unnecessary.

**Vercel templates gallery.** The documentation category lists Nextra Docs Starter Kit, Docusaurus, AriaDocs, Pinexio, and others. **No Fumadocs template is listed** there ([Vercel templates: documentation](https://vercel.com/templates/documentation)). That isn't a reason to avoid Fumadocs, because `npm create fumadocs-app` is the official scaffolder.

### 3.1 Why Fumadocs over the others, from first principles

- **Against the content contract:** Fumadocs validates frontmatter with a Zod schema at build time, so an agent's bad frontmatter fails the build instead of silently rendering ([collections](https://www.fumadocs.dev/docs/mdx/collections)). Ordering lives in one small `meta.json` per folder. Any page left out of an explicit `pages` list is hidden, which is a predictable rule ([conventions](https://www.fumadocs.dev/docs/page-conventions)).
- **Against the renderer:** it's built on Next.js, which is Vercel's native framework, and it covers search, code blocks, tabs, steps, callouts, type tables, Mermaid, OpenAPI, versioning, i18n, feedback, and OG images without custom code ([llms.txt index of Fumadocs docs](https://www.fumadocs.dev/llms.txt)).
- **Against AI-readability:** it's the only open-source option here where `llms.txt`, `.md` routes, `Accept` negotiation, and an MCP server are first-party ([LLMs](https://www.fumadocs.dev/docs/integrations/llms)).
- **Against maintenance risk:** it releases weekly. The main risk is that it's largely one lead maintainer's project (`fuma-nama`), which is also true of Nextra. Mitigations: Vercel (Geistdocs) and shadcn/ui depend on it, and your content stays plain MDX + JSON, so moving to Starlight or Mintlify later is a component-mapping job, not a rewrite.
- **Why not Starlight first?** It's excellent and lighter. But Torian's stack is React/Next.js, v0 output is React + shadcn/ui (§4), and Fumadocs keeps everything in one ecosystem. Pick Starlight if the docs will be mostly prose and you want the least JS.

---

## 4. Vercel v0, and other Vercel features

### 4.1 "Veo" vs v0

- **Veo** is Google DeepMind's video-generation model (current line: Veo 3.1). It's unrelated to Vercel or docs ([DeepMind: Veo](https://deepmind.google/models/veo/)).
- **v0** (v0.app) is Vercel's AI app builder. It generates Next.js + React + TypeScript + Tailwind + shadcn/ui code. It can import a GitHub repo, always works on a branch, opens PRs ("v0 never pushes directly to `main`"), and publishes to Vercel. It got a major update on Feb 4, 2026 (Git integration, Projects, a full editor, sandboxed previews). Plans run from Free to $100/user/mo ([v0 FAQ](https://v0.app/docs/faqs)).

### 4.2 Is v0 a best practice here? No, as the pipeline. Yes, as a prototyping tool.

**Use v0 for:**
- prototyping the marketing/landing page (`/`) and hero sections
- one-off interactive React components (a pricing calculator, an interactive diagram, a playground widget) that you'll then add to the allowed component list
- quick design exploration

Its output stack (React + Tailwind + shadcn/ui) matches Fumadocs UI (Tailwind; there's an `@fumadocs/shadcn` package: [changelog](https://www.fumadocs.dev/changelog)), so porting is easy.

**Don't use v0 for:**
- **the MDX→site pipeline.** That should be a deterministic framework plus CI gates, not a conversational generator. v0's own FAQ says generated output "may… be incomplete or contain bugs" and that you are "responsible for evaluating" it ([v0 FAQ](https://v0.app/docs/faqs)).
- bulk content authoring
- anything that bypasses review

**Safe workflow:** connect v0 to the docs repo, let it open a PR on a `v0/*` branch, and let the same CI gates (§5.6) and Vercel preview review decide.

### 4.3 Vercel features worth using

| Feature | Use in a docs site | Source |
|---|---|---|
| Git integration + **preview deployments** | Every push to a non-production branch gets its own URL and a PR comment. Merging to production deploys. This is the agent review loop. | [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github), [Environments](https://vercel.com/docs/deployments/environments) |
| **Comments / Vercel Toolbar** on previews | Torian reviews an agent's PR visually and leaves comments pinned on the page. | [Comments](https://vercel.com/docs/comments), [Toolbar](https://vercel.com/docs/vercel-toolbar) |
| Static generation (and ISR if needed) | Docs pages are static via `generateStaticParams`. Fumadocs notes this is "as fast as static pages". ISR is only needed if content comes from a CMS or remote source. | [Fumadocs FAQ](https://www.fumadocs.dev/docs), [Vercel ISR](https://vercel.com/docs/incremental-static-regeneration) |
| **OG image generation** | One `opengraph-image.tsx` template renders title and description per page. | [Next.js opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image), [Vercel OG](https://vercel.com/docs/og-image-generation) |
| **Web Analytics + Speed Insights** | Page views, referrers, and Core Web Vitals, filterable by preview vs production. All plans. | [Speed Insights](https://vercel.com/docs/speed-insights) |
| Rewrites / headers | `.md` routes, `Accept: text/markdown` negotiation, `Vary: Accept`. | [Vercel KB: serve docs for agents](https://vercel.com/kb/guide/how-to-serve-documentation-for-agents), [Rewrites](https://vercel.com/docs/routing/rewrites) |
| `@vercel/agent-readability` | Middleware that detects agents and serves Markdown, plus `npx @vercel/agent-readability audit <url>`. | [npm](https://www.npmjs.com/package/@vercel/agent-readability), [Agent Readability Spec](https://vercel.com/kb/guide/agent-readability-spec) |
| **AI SDK + AI Gateway** (optional, Phase 3) | "Ask AI" chat over your docs. Fumadocs' CLI installs one built on the AI SDK. AI Gateway gives one key across many model providers. | [Fumadocs Ask AI](https://www.fumadocs.dev/docs/integrations/llms), [AI Gateway](https://vercel.com/docs/ai-gateway), [AI SDK + Gateway](https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk) |

Note: Fumadocs "doesn't work on Edge runtime", so keep the default Node.js runtime ([Fumadocs deploying](https://www.fumadocs.dev/docs/deploying)).

---

## 5. Recommendation and agent-executable implementation plan

### 5.1 Decision

**Fumadocs (latest 16.x) + Fumadocs MDX + Next.js 16 on Vercel, Node.js runtime, statically generated pages.**
- Search: built-in. Move to Algolia DocSearch later only if the site is public and large.
- AI-readability: Fumadocs LLM feature (`llms.txt`, `llms-full.txt`, `.md`, `Accept` negotiation). MCP is optional.
- API reference: `fumadocs-openapi`, if there's an OpenAPI spec.
- v0 for the landing page and bespoke components only, delivered by PR.

### 5.2 Repository layout

```text
docs-site/
├─ content/
│  └─ docs/
│     ├─ index.mdx                 # Docs home (overview + cards to the 4 sections)
│     ├─ meta.json                 # Top-level ordering
│     ├─ get-started/              # Tutorials (Diátaxis: learning)
│     │  ├─ meta.json
│     │  ├─ index.mdx
│     │  └─ quickstart.mdx
│     ├─ guides/                   # How-to guides (Diátaxis: tasks)
│     ├─ concepts/                 # Explanation (Diátaxis: understanding)
│     ├─ reference/                # Reference (Diátaxis: information)
│     │  └─ api/                   # Generated by fumadocs-openapi — do not hand-edit
│     └─ changelog.mdx             # Keep a Changelog format
├─ openapi/openapi.yaml            # Source of truth for API reference (if any)
├─ public/                         # Images: public/images/<section>/<page>/<name>.png
├─ app/                            # Next.js App Router (scaffolded by create-fumadocs-app)
├─ components/mdx/                 # The ONLY components content may use (allowlist)
├─ lib/source.ts                   # loader() + docsLlms
├─ source.config.ts                # defineDocs + frontmatter schema
├─ scripts/
│  ├─ validate-links.ts            # next-validate-link
│  └─ check-content.ts             # extra rules (§5.3) — no imports, allowed components, etc.
├─ .vale.ini  + styles/            # Prose lint (Google package)
├─ AGENTS.md                       # The content contract (§5.3) — agents read this first
└─ .github/workflows/docs-ci.yml
```

### 5.3 Content contract (put this in `AGENTS.md`)

**File naming**
- Use lowercase kebab-case: `content/docs/<section>/<slug>.mdx`. The path becomes the URL (`guides/deploy.mdx` → `/docs/guides/deploy`), and `index.mdx` becomes the folder's URL ([conventions](https://www.fumadocs.dev/docs/page-conventions)).
- Never rename a published file without adding a redirect.
- Folder names in `(parentheses)` group files without affecting URLs. Use these sparingly.

**Frontmatter schema** (enforced at build time in `source.config.ts`):

```ts
// source.config.ts
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { pageSchema, metaSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      // pageSchema already provides: title, description, icon
      description: z.string().min(40).max(160),          // required; used for SEO + llms.txt
      type: z.enum(['tutorial', 'how-to', 'reference', 'explanation']), // Diátaxis
      status: z.enum(['draft', 'beta', 'stable', 'deprecated']).default('stable'),
      lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),             // YYYY-MM-DD
      owner: z.string().optional(),
      sources: z.array(z.string().url()).optional(),       // traceability for factual claims
    }),
    postprocess: { includeProcessedMarkdown: true },     // required for llms routes
  },
  meta: { schema: metaSchema },
});

export default defineConfig();
```

(The schema API shape follows [Fumadocs MDX collections](https://www.fumadocs.dev/docs/mdx/collections). `includeProcessedMarkdown` follows [Fumadocs AI & LLMs](https://www.fumadocs.dev/docs/integrations/llms). Run `npm create fumadocs-app` first and adapt to the generated file if names differ in the installed version.)

Example page:

```mdx
---
title: Deploy to Vercel
description: Connect the repository to Vercel, set environment variables, and ship your first production deployment.
type: how-to
status: stable
lastReviewed: 2026-10-28
---

Deploy the app by connecting its GitHub repository to a Vercel project.

## Prerequisites
...
```

**Ordering**
- Each folder has a `meta.json` with `title` and an explicit `pages` array.
- Use `"..."` to include the rest alphabetically, and `"---Label---"` for separators ([conventions](https://www.fumadocs.dev/docs/page-conventions)).
- A page URL must not appear twice in the tree.

**Body rules**
- No H1 in the body; the title comes from frontmatter. Start at `##` and don't skip heading levels.
- The first paragraph states what the page helps the reader do, in one or two sentences.
- One Diátaxis type per page. If a how-to needs background, link to the explanation page instead of explaining inline.
- Every code block has a language tag, uses `title="path/to/file"` when it's a file, and is runnable as written. Use `tab="npm"`/`tab="pnpm"` groups for install commands.
- Images live in `public/images/...`, always have meaningful alt text, and prefer SVG for diagrams. Mermaid code blocks are allowed.
- Use relative internal links to other docs pages. Use absolute URLs only for external links.
- Any factual claim about outside systems (versions, limits, prices) goes in `sources:` or gets an inline link.

**Allowed MDX components** (allowlist; anything else fails CI):
- `Callout` (types: info, warn, error, idea)
- `Cards` / `Card`
- `Steps` / `Step`
- `Tabs` / `Tab`
- `Accordion` / `Accordions`
- `Files` / `Folder` / `File`
- `TypeTable`
- `APIPage` (generated pages only)

All of these ship with Fumadocs UI ([components index](https://www.fumadocs.dev/llms.txt), [Markdown](https://www.fumadocs.dev/docs/markdown)). No `import` or `export` statements in content files: components are registered once in `mdx-components.tsx`, which applies Stripe's "constrain authoring" lesson. New components are added by a code PR (this is where v0 fits), never inline.

**Style summary** (Google developer documentation style guide):
- Use second person ("you"), active voice, present tense, and imperative steps ("Run `pnpm dev`.").
- Use sentence-case headings, short paragraphs, no "simply"/"just"/"easy", and spell out acronyms on first use.
- Write for a global audience.

([tone](https://developers.google.com/style/tone), [person](https://developers.google.com/style/person), [voice](https://developers.google.com/style/voice), [global audience](https://developers.google.com/style/translation))

### 5.4 Scaffold steps (for the agent)

1. Use Node.js 22+ (Fumadocs requires it: [Quick Start](https://www.fumadocs.dev/docs)). Run `npm create fumadocs-app`, and choose **Next.js** and **Fumadocs MDX**. The template ships the LLM integration and dynamic OG images by default ([Quick Start](https://www.fumadocs.dev/docs)).
2. Replace sample content with the §5.2 tree, and write `source.config.ts` with the §5.3 schema.
3. Confirm the AI routes exist. If they don't, run `npx @fumadocs/cli feature llms`. Check that these work (route patterns from [Fumadocs AI & LLMs](https://www.fumadocs.dev/docs/integrations/llms)):
   - `/llms.txt`
   - `/llms-full.txt`
   - `/docs/<slug>.md`
   - `Accept: text/markdown` on `/docs/<slug>`
4. Add the page actions (`MarkdownCopyButton`, `ViewOptionsPopover` with the GitHub edit URL) to the docs page layout.
5. Add `<link rel="alternate" type="text/markdown" href="…/<slug>.md">` per page and a footer link to `/llms.txt` ([llmstxt.org](https://llmstxt.org/), [Vercel spec](https://vercel.com/kb/guide/agent-readability-spec)). If the docs will be served through a shared cache or CDN, set `Vary: Accept` at the CDN layer, because Next.js App Router discards `Vary` on page responses ([Fumadocs note](https://www.fumadocs.dev/docs/integrations/llms)).
6. Add the feedback component: `npx @fumadocs/cli feature feedback`. Wire `onSendAction` to Vercel Analytics custom events or a log, and validate input server-side ([Feedback](https://www.fumadocs.dev/docs/integrations/feedback)).
7. **Search:** keep the default built-in search (server route). Static export isn't needed on Vercel.
8. **API reference (if applicable):** install `fumadocs-openapi` and generate pages into `content/docs/reference/api` with `generateFiles({ input: './openapi/openapi.yaml', output: './content/docs/reference/api', per: 'operation', groupBy: 'tag' })` ([generateFiles](https://www.fumadocs.dev/docs/integrations/openapi/generate-files)). Also serve the raw spec at `/openapi.json`, and link it from `llms.txt`.
9. Add `app/sitemap.ts` and `app/robots.ts` (Next.js metadata routes). Return real 404s for unknown slugs; the scaffolded `notFound()` already does this.
10. Add `@vercel/analytics` and `@vercel/speed-insights` to the root layout.

### 5.5 Deploy on Vercel

1. Import the GitHub repo in Vercel. The framework preset auto-detects Next.js ([Fumadocs deploying](https://www.fumadocs.dev/docs/deploying)).
2. Set the production branch to `main`. Every PR gets a preview URL and a bot comment ([Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)).
3. Keep the Node.js runtime (not Edge).
4. Add the custom domain. If the docs live under the main product domain at `/docs`, use a rewrite from the main app.
5. Enable Web Analytics and Speed Insights in the project.
6. Make the GitHub CI checks (below) **required** before merge, so agent PRs can't ship red.

### 5.6 CI checks (`.github/workflows/docs-ci.yml`, on every PR)

| Gate | Tool | Fails when | Source |
|---|---|---|---|
| Frontmatter + build | `pnpm build` (Fumadocs MDX runs the Zod schema) | Missing or invalid frontmatter, MDX syntax error, unknown component | [collections](https://www.fumadocs.dev/docs/mdx/collections) |
| Types | `tsc --noEmit` | Broken component props | — |
| Content rules | `scripts/check-content.ts` (custom, ~50 lines; parses MDX with remark) | `import`/`export` in content, components outside the allowlist, body H1, code fence without a language, image without alt, page not listed in any `meta.json` | Rules from §5.3 |
| Internal links + anchors | `next-validate-link` script | Link to a missing page or heading | [Fumadocs: Validate Links](https://www.fumadocs.dev/docs/markdown/validate-links) |
| External links | `lycheeverse/lychee-action@v2` (or nightly, to avoid flaky PRs) | Dead external URLs | [lychee-action](https://github.com/lycheeverse/lychee-action/) |
| Prose | Vale ≥ 3.18 with `Packages = Google` | Style violations at `error` level (start at `warning`, tighten later) | [Vale MDX](https://docs.vale.sh/formats/mdx), [packages](https://docs.vale.sh/keys/packages) |
| Accessibility | `pa11y-ci --sitemap <preview>/sitemap.xml` against the Vercel preview | WCAG 2.2 AA errors | [pa11y-ci](https://github.com/pa11y/pa11y-ci/) |
| Performance/SEO | `treosh/lighthouse-ci-action` on 3–5 key preview URLs, with a budget | Score or budget regressions | [lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action/) |
| Agent-readability smoke test | `curl` checks: `/llms.txt` 200; `/docs/<x>.md` 200 `text/markdown`; `Accept: text/markdown` returns Markdown; missing slug returns 404. Optionally `npx @vercel/agent-readability audit <preview-url>` | Any check fails | [Vercel spec](https://vercel.com/kb/guide/agent-readability-spec), [agent-readability](https://www.npmjs.com/package/@vercel/agent-readability) |

### 5.7 Agent handoff checklist (acceptance criteria)

An agent's PR that converts `.mdx` docs into the site is done only when all of these are true:

- [ ] Every page is in `content/docs/<section>/` with a kebab-case filename, and each folder has a `meta.json` with an explicit `pages` order.
- [ ] Every page's frontmatter passes the schema: `title`, `description` (40–160 chars), `type` (Diátaxis), `status`, `lastReviewed`.
- [ ] No content file contains `import`/`export`, and only allowlisted components are used.
- [ ] Every code block has a language and, where it's a file, a `title`. Install commands use tab groups.
- [ ] Every image has alt text, and diagrams are SVG or Mermaid.
- [ ] `pnpm build`, `tsc`, content rules, internal link validation, and Vale (no errors) all pass in CI.
- [ ] The Vercel preview deploys. Sidebar, TOC, breadcrumbs, prev/next, ⌘K search, dark mode, and the mobile menu all work on the preview.
- [ ] `/llms.txt`, `/llms-full.txt`, and `/docs/<slug>.md` work on the preview. `Accept: text/markdown` returns Markdown. Unknown slugs return 404.
- [ ] pa11y-ci shows no WCAG 2.2 AA errors. Lighthouse meets the budget on the key pages.
- [ ] Each page has an OG image, and `sitemap.xml` lists all pages.
- [ ] The PR description lists pages added, changed, or removed, plus any redirects for renamed pages.
- [ ] A human (Torian) reviews the preview with Vercel Comments before merge. No auto-merge.

### 5.8 Phasing

1. **Phase 1 (launch):** §5.2–5.7 without OpenAPI, MCP, or Ask-AI.
2. **Phase 2:** add the OpenAPI reference, the changelog, versioning (only if needed), and nightly lychee.
3. **Phase 3:** add the docs MCP server (`npx @fumadocs/cli feature mcp`) and Ask-AI chat (AI SDK + AI Gateway). Add Algolia DocSearch only if the built-in search isn't good enough at scale.

---

## 6. Sources

All links were checked on Oct 28, 2026 (see §6.1). Grouped by topic.

**Standards & guidance**
- Diátaxis: https://diataxis.fr/start-here/ · https://diataxis.fr/map/
- llms.txt v2 proposal: https://llmstxt.org/
- Vercel Agent Readability Spec (v1.0, Aug 2026): https://vercel.com/kb/guide/agent-readability-spec
- Vercel KB, serve docs for agents: https://vercel.com/kb/guide/how-to-serve-documentation-for-agents
- Vercel Markdown access: https://vercel.com/docs/agent-resources/markdown-access
- Google developer documentation style guide: https://developers.google.com/style/tone · https://developers.google.com/style/person · https://developers.google.com/style/voice · https://developers.google.com/style/translation
- WCAG 2.2: https://www.w3.org/WAI/news/2023-10-05/wcag22rec/ · https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Line length: https://baymard.com/research-articles/line-length-readability · https://fonts.google.com/knowledge/using_type/understanding_measure_line_length
- Keep a Changelog: https://keepachangelog.com/en/2.0.0/

**Exemplars**
- Stripe Markdoc: https://stripe.dev/blog/markdoc
- react.dev launch: https://react.dev/blog/2023/03/16/introducing-react-dev
- Next.js docs and router switcher: https://nextjs.org/docs · https://github.com/vercel/next.js/issues/72829 · https://github.com/vercel/next.js/pull/75427
- Supabase docs source: https://github.com/supabase/supabase/tree/master/apps · https://github.com/supabase/supabase/blob/a5f4a59e/apps/docs/content/navigation.references.ts
- Cloudflare: https://blog.cloudflare.com/open-source-all-the-way-down-upgrading-our-developer-documentation/ · https://kian.org.uk/using-mdast-to-migrate-cloudflare-docs-from-hugo-to-starlight/ · https://github.com/cloudflare/cloudflare-docs/pull/32203
- Anthropic on Mintlify: https://www.mintlify.com/customers/anthropic
- shadcn/ui on Fumadocs: https://github.com/shadcn-ui/ui/blob/31dbc6fc/apps/v4/lib/source.ts · https://github.com/shadcn-ui/ui/blob/4baadbc6/apps/v4/source.config.ts

**Frameworks**
- Fumadocs: https://www.fumadocs.dev/docs · https://www.fumadocs.dev/docs/page-conventions · https://www.fumadocs.dev/docs/mdx/collections · https://www.fumadocs.dev/docs/markdown · https://www.fumadocs.dev/docs/integrations/llms · https://www.fumadocs.dev/docs/integrations/feedback · https://www.fumadocs.dev/docs/integrations/openapi · https://www.fumadocs.dev/docs/integrations/openapi/generate-files · https://www.fumadocs.dev/docs/search/orama · https://www.fumadocs.dev/docs/navigation · https://www.fumadocs.dev/docs/deploying · https://www.fumadocs.dev/docs/markdown/validate-links · https://www.fumadocs.dev/blog/v16-17 · https://www.fumadocs.dev/changelog · https://www.fumadocs.dev/llms.txt · https://www.npmjs.com/package/fumadocs-ui
- Starlight: https://github.com/withastro/starlight/releases · https://astro.build/blog/starlight-042/ · https://starlight.astro.build/reference/configuration/ · https://starlight.astro.build/guides/site-search/ · https://delucis.github.io/starlight-llms-txt/ · https://docs.astro.build/en/guides/deploy/vercel/
- Nextra: https://www.npmjs.com/package/nextra · https://github.com/shuding/nextra/releases · https://nextra.site/about · https://github.com/dimaMachina/nextra/issues/55 · https://nextra.site/docs/guide/search · https://nextra.site/docs/file-conventions/meta-file
- Docusaurus: https://docusaurus.io/changelog
- Mintlify: https://www.mintlify.com/pricing · https://www.mintlify.com/docs/organize/settings-reference · https://www.mintlify.com/docs/deploy/vercel · https://www.npmjs.com/package/mint
- Geistdocs & agent-readability: https://www.npmjs.com/package/@vercel/geistdocs · https://github.com/vercel/turborepo/pull/13320 · https://github.com/vercel/ai/commit/159785c2eeb972975860c1ed0983509189000154 · https://www.npmjs.com/package/@vercel/agent-readability
- Content layers: https://github.com/contentlayerdev/contentlayer/blob/main/packages/contentlayer/README.md · https://www.npmjs.com/package/contentlayer2 · https://www.content-collections.dev/docs/migration/contentlayer · https://www.npmjs.com/package/velite
- Vercel templates (documentation): https://vercel.com/templates/documentation

**Search**
- Pagefind: https://pagefind.app/
- Algolia DocSearch: https://www.algolia.com/blog/product/algolia-docsearch-is-now-free-for-all-docs-sites · https://www.algolia.com/policies/docsearch-plan-specific-terms

**Vercel platform & v0**
- v0 FAQ: https://v0.app/docs/faqs
- Veo (Google DeepMind): https://deepmind.google/models/veo/
- Git/previews: https://vercel.com/docs/git/vercel-for-github · https://vercel.com/docs/deployments/environments
- Comments/Toolbar: https://vercel.com/docs/comments · https://vercel.com/docs/vercel-toolbar
- ISR: https://vercel.com/docs/incremental-static-regeneration
- OG images: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image · https://vercel.com/docs/og-image-generation
- Speed Insights: https://vercel.com/docs/speed-insights
- Rewrites: https://vercel.com/docs/routing/rewrites
- AI Gateway / AI SDK: https://vercel.com/docs/ai-gateway · https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk

**CI tooling**
- lychee: https://github.com/lycheeverse/lychee-action/
- Vale: https://docs.vale.sh/formats/mdx · https://docs.vale.sh/keys/packages
- pa11y-ci: https://github.com/pa11y/pa11y-ci/
- Lighthouse CI action: https://github.com/treosh/lighthouse-ci-action/

**Raw probe data (this folder):** `llms_probe.txt`, `md_probe.txt`, `link_check.txt`.

### 6.1 Link check
I checked all 91 unique URLs in this document with `curl` on Oct 28, 2026 (~1:22 PM CDT). Results are in `link_check.txt`:
- **82 returned 200.**
- One GitHub URL was rate-limited (429) and returned 200 on retry.
- `content-collections.dev` kept returning 429 (rate limiting, not a missing page). Its content was retrieved earlier in this session through web search.
- The seven `npmjs.com/package/...` pages return 403 to `curl` (bot blocking). Each package was confirmed to exist through `registry.npmjs.org`, which is also where every version and date in §3 came from.
