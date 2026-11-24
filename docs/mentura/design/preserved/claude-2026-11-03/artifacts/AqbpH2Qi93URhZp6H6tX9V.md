<!-- exported 2026-11-03 from https://claude.ai/artifact/AqbpH2Qi93URhZp6H6tX9V (Claude Docs id 4fab678b-8600-495f-b5bb-3b8c838fd22c) -->
# Venture console plan

Oct 30, 2026 · @Torian

## Summary

Build the venture console as a Mentura (platform) app: one Next.js 16 app in the everything-ecosystem repo, on the same stack as the docs site, started from Vercel's Chat SDK template and reshaped with three shadcn pieces (sidebar-09 for the icon rail and panel, sidebar-11 for the folder tree, AI Elements PromptInput for the create box).

The console is a browser version of what `npx create-venture` and `naive` do on a laptop. A founder signs in, makes a workspace, creates a venture, and sees its `k-base/` and `codebase/` folders in a live tree beside a prompt. Records stay files in the venture's own storage; the console renders views of them and never publishes a record.

Phase fit: the top goal is a stable Naive you use every day. The console does not serve that goal yet, so this plan recommends architecting it now and building only after Naive passes its stability bar. One small exception is worth weighing: a clickable mock of the layout, with no backend, to test the shape (see Open decisions).

## Where it belongs: Mentura

The repo already answers this. `platform/README.md` (EE-041) lists "the operator console" as platform, and the views rule from 2026-10-28 says any rendered view is Mentura's or a visualization skill. A hosted, multi-tenant console needs accounts, a database and network storage, which the framework rule (offline, no account, no named vendor) rules out.

So the console is Mentura's product the way the Vercel dashboard is Vercel's. Naive stays the engine it runs: the console imports the framework's router, schemas and checks, and the boundary check (`schema/check-boundary.mjs`) keeps the framework from importing it back.

Still open: which of Naive or Mentura is the company, and who pays Mentura. Neither blocks this plan, because the console's code sits on the platform side either way.

## Layout

Keep Gamma's three columns and swap its content for the venture: an icon rail, a panel whose main job is the live folder tree, and a central prompt with quick-start chips.

&#91;embedded content: console home · rail, panel, prompt\]

- **Rail** (sidebar-09's first column): Home, Ventures, Docket, Docs, Settings. Docs opens the docs site in context.
- **Panel** (sidebar-09's second column with sidebar-11's tree): workspace switcher, New venture, search, then the venture's `k-base/` and `codebase/` tree. Clicking a record opens its view; drag, rename and new-folder become draft PRs, never silent writes.
- **Centre** (AI Elements PromptInput): one prompt for ideas, decisions and tasks, chips for the common starts, and the docket's next decisions under it. The agent's output opens in a right-hand panel, as the Chat SDK's artifacts panel does.

The example folder and decision names are placeholders.

## Template research

No single template matches, so take the app foundation from one and the layout from shadcn blocks. The Chat SDK template is the best foundation because the console's core is a prompt that drives an agent and shows what it made, which is that template's whole job.

| Candidate | What it gives | Fit for the console | Verdict |
| --- | --- | --- | --- |
| [Chat SDK (vercel/ai-chatbot)](https://github.com/vercel/ai-chatbot) | Next.js App Router, AI SDK, Auth.js, Neon Postgres, Vercel Blob, shadcn/ui, an artifacts panel | Prompt, streaming agent, saved history and a side panel are the console's centre | Foundation |
| [shadcn sidebar-09](https://ui.shadcn.com/blocks/sidebar) | Collapsible nested sidebars: a narrow icon rail plus a second panel | The Gamma shape almost exactly | Use for the shell |
| [shadcn sidebar-11](https://ui.shadcn.com/blocks/sidebar) | A sidebar with a collapsible file tree | The k-base/ and codebase/ tree | Use inside the panel |
| [shadcn sidebar-07](https://ui.shadcn.com/r/styles/new-york-v4/sidebar-07.json) | Sidebar that collapses to icons, with a team switcher | The workspace switcher at the top | Take the switcher only |
| [AI Elements](https://ui.shadcn.com/docs/ai-elements/radix/file-tree) | shadcn-style AI parts: PromptInput, Conversation, FileTree, Code Block, Web Preview | The create box and the agent's output | Use for the centre |
| [next-forge](https://vercel.com/templates/template/next-forge) | Turborepo with app, web, api, docs, email, storybook | Good monorepo shape, but swaps in many vendors and would duplicate the existing site | Borrow the layout idea only |
| [Platforms Starter Kit](https://github.com/vercel/platforms) | Subdomain multi-tenancy through Next.js 16 `proxy.ts` | Tenants here are workspaces behind one login, not sites on subdomains | Later, if ventures publish sites |
| [B2B Multi-Tenant Starter](https://vercel.com/templates/multi-tenant-apps/b2-b-multi-tenant-starter-kit) | Teams, dashboard, settings on Stack Auth and shadcn | Team tenancy is right; the auth vendor is a bet | Reference for team settings |
| [next-shadcn-dashboard-starter](https://shadcn.io/template/kiranism-next-shadcn-dashboard-starter) | Next.js 16 admin dashboard, Clerk, Sentry, MIT | Admin tables and charts, not a create surface | Skip |
| [nextjs/saas-starter, ixartz SaaS-Boilerplate](https://makerkit.dev/blog/saas/best-nextjs-saas-boilerplate) | Billing, teams, marketing pages | Billing waits until Mentura's payer is decided | Skip for now |

The docs site is moving from Fumadocs to Nextra on PR #47's branch, with PR #118 redesigning the home page on top of it; main still shows Fumadocs on Next.js 16.4.1, React 19.3 and Tailwind 4.3 (`site/package.json`). The console should pin the same Next.js, React and Tailwind versions as the Nextra site once #47 lands, so the two share brand tokens and components.

## Architecture

Each venture lives in its own GitHub repo holding `k-base/` and `codebase/`, and the console is a window onto it. That keeps records as files, matches the venture layout, and lets a founder clone the repo and run Naive locally later with nothing to export.

&#91;embedded content: console architecture · 7 parts\]

The console reads through the existing GitHub connector (`platform/connectors/github.mjs`: reads a branch, writes by draft pull request), so every change the agent makes is a reviewable PR. Work that needs a real filesystem, such as `create-venture` or `naive check`, runs in a Vercel Sandbox that clones the repo, runs the command and pushes.

- **Tenancy.** A workspace is an organization; members and roles hang off it. Postgres holds only accounts, workspaces, pointers to venture repos, and chat history, every row keyed by workspace. No record is copied into the database.
- **Repos for no-code founders.** Founders without GitHub get a repo created by a Mentura GitHub App in a Mentura-owned org, transferable to them later.
- **Agent.** The AI SDK with Claude as the default model; its tools are the framework's existing MCP tools (for example `mentura_setup`), so the console and a local harness drive the same routes.
- **Website connection.** The console sits beside `site/` in the same repo, shares `site/brand/tokens.json`, and serves at a subdomain of the docs domain. Docs pages carry "Open in console" links (`/new?template=...`), like Vercel's Deploy button, and the console's help links back into the docs.

## Build phases

Each phase starts only when the one before meets its exit line, and phase 1 waits for the Naive stability bar.

0. **Architect (now).** This doc, plus the decisions below. Exit: you have picked the console's owner, storage and auth.
1. **Single-tenant console for you.** `platform/console/` from the Chat SDK template, sidebar-09 shell, the tree reading one venture from a GitHub repo, the prompt calling the framework router. Exit: you run a real venture from the browser for a week without opening a terminal.
2. **Create a venture online.** The create flow runs `create-venture` server side into a new repo, and the docs site's "Open in console" buttons land on it. Exit: a fresh account goes from the docs site to a venture with a filled k-base/ in under 10 minutes.
3. **Workspaces and members.** Organizations, roles, invites, per-workspace isolation tests. Exit: two test workspaces cannot read each other's records under the boundary tests.
4. **Beta.** Invite the first founders from the validation interviews. Billing waits for the decision on who pays Mentura.

Per the project rules, every build phase runs under pstack, with a pstack review before merges.

## Open decisions

| Decision | Recommended | Alternatives |
| --- | --- | --- |
| When to build | Decided 2026-10-30: architect now, build phase 1 after Naive is stable | A clickable mock with no backend now; start phase 1 now |
| Where a venture's records live | Decided 2026-10-30: one GitHub repo per venture | Hosted storage inside Mentura (Postgres and Blob), easier for no-code founders but records stop being plain portable files |
| Auth and tenancy | Decided 2026-10-30: Better Auth with its organization plugin: open source, data in our Postgres | Clerk organizations (fastest, a paid vendor); Auth.js as the template ships (no organizations) |
| Which of Naive or Mentura is the company | Not needed for this plan | Already open in the Mentura thread |

Some details are unverified: Vercel Sandbox pricing (rate card not opened), and the Chat SDK's current Next.js version and license type, which the repo page did not state.

## Sources

- [vercel/ai-chatbot (Chat SDK)](https://github.com/vercel/ai-chatbot)
- [shadcn sidebar blocks](https://ui.shadcn.com/blocks/sidebar)
- [AI Elements file tree](https://ui.shadcn.com/docs/ai-elements/radix/file-tree)
- [Vercel multi-tenant template docs](https://vercel.com/docs/platforms/examples/multi-tenant-template)
- [vercel/platforms](https://github.com/vercel/platforms)
- [next-forge](https://vercel.com/templates/template/next-forge)
- [B2B Multi-Tenant Starter Kit](https://vercel.com/templates/multi-tenant-apps/b2-b-multi-tenant-starter-kit)
- [MakerKit's boilerplate comparison (vendor-written)](https://makerkit.dev/blog/saas/best-nextjs-saas-boilerplate)
- [Vercel Sandbox pricing](https://vercel.com/docs/sandbox/pricing)
- Repo: `platform/README.md`, `interface/operator-console/README.md`, `site/package.json` in tchjhnsn/everything-ecosystem at 6e0e5da
