---
name: venture-console-plan
description: 2026-10-30 plan for the hosted, multi-tenant venture (operator) console: Mentura-side Next.js app, Chat SDK base + shadcn sidebar-09/11 + AI Elements, Gamma layout
metadata:
  type: project
  modified: 2026-10-30T17:57:19.356Z
---

Torian 2026-10-30 17:51Z asked to plan (not build) a venture console: online, multi-tenant, build a Naive venture without installing Naive, directly connected to the docs website, Gamma-like layout (icon rail + panel with visible interactive folder tree + central create prompt).

Plan doc: https://claude.ai/artifact/AqbpH2Qi93URhZp6H6tX9V (thread cmsg_01TRojivaFzywKqAKrsycdv8HtzQoYqruU2Ad4RxLo2y8H).
- Owner: Mentura (platform). platform/README.md (EE-041) already lists the operator console as platform; see [[ee-framework-platform-split]], [[feedback-views-are-platform]].
- Stack: Next.js 16.4.1 / React 19.3 / Tailwind 4.3 to match site/ (docs site moving Fumadocs -> Nextra on PR #47 branch; PR #118 home redesign on top; main still Fumadocs as of 2026-10-30). Proposed home platform/console/.
- Foundation: vercel/ai-chatbot (Chat SDK). Layout: shadcn sidebar-09 (nested rail+panel), sidebar-11 (file tree), sidebar-07 team switcher, AI Elements PromptInput.
- Proposed architecture: one GitHub repo per venture (k-base/, codebase/) via platform/connectors/github.mjs (writes by draft PR); Vercel Sandbox runs create-venture / naive check; Postgres holds only accounts, workspaces, venture pointers, chats; agent = AI SDK + Claude over the framework MCP tools; docs pages get "Open in console" links.
- Decisions (all made by Torian 2026-10-30): build timing DECIDED by Torian 18:00Z: architect now, build after Naive is stable (no console code until then), record storage DECIDED 18:00Z: one GitHub repo per venture, auth DECIDED 18:01Z: Better Auth with organization plugin.
- 2026-10-30 18:07Z Torian reversed timing for a demo: "build a beta of this". Built in everything-ecosystem console/ (outside platform/ and the npm files list, per coordinator: Mac thread is removing platform/ from the package). Bridge = console/lib/bridge.mjs (child process). Torian approved commit+push 18:53Z: commit 7136d2a, draft PR tchjhnsn/everything-ecosystem#121 (subscribed, assigned). Needs pstack review on the Mac before merge. Data model ignore entries added for console/*.json.
- 2026-10-30 19:13Z CI green on 38cc9dc. 19:23Z handed PR #121 to the Mac catch-up queue (handoff /mnt/project-files/venture-console/HANDOFF_PR121_VENTURE_CONSOLE_TO_MAC_CATCHUP_2026-10-30.md); cloud thread no longer pushes to the branch unless Torian asks.
- 20:25Z pstack review (Mac) found 4 blockers + 9 should-fix; fixed in 44f6dc0 + a3acd24 (Torian approved push). Torian picks: console decisions marked provenance.signer 'unverified' (no wording); demo judge = real Jev with TYPESAFE_API_KEY. Mac to re-review a3acd24 and land.
- 21:00Z Torian: hackathon over; goal is product development toward a true MVP of Naive and of the console (he calls it the mentor console). After #121 lands, shape console work toward MVP (auth, per-venture repos, sandbox), not demo polish.
- 22:17Z Torian: the local Mac agent took the handoff and owns #121 and everything after; this cloud thread stopped and unsubscribed from #121. Leftovers (all recorded, none owned by the thread): decision-stream rename (idea), console MVP = Better Auth orgs + repo per venture + sandbox (plan doc), real signing replaces 'unverified'.
