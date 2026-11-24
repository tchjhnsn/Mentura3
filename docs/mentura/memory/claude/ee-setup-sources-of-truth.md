---
name: ee-setup-sources-of-truth
description: Torian 2026-10-29 05:57Z: setup asks the source of truth per function (repo/GitHub/Vercel, Stripe/Shopify, Rho for demo), a guided local setup page like next dev ending in a docket + discovery goal; Naive:Mentura = Next.js:Vercel; Mentura competes with macro.com
metadata:
  type: project
  modified: 2026-10-29T05:59:52.695Z
---

Torian, 2026-10-29 05:57Z (for the demo):
- Setup asks Naive to be pointed at each function's source of truth: product = local repo + GitHub + Vercel deployments; analytics from the host (Vercel or Cloudflare to start); e-commerce sales = Stripe / Square / Shopify; financials = Rho for the demo (demo venture has a product and money set up). No function yet: default it or answer in prose to the model.
- Setup through a model provider is easier: the model talks to them.
- Ship a local dev experience like Next.js's: an HTML template walking through the setup questions = strategic foundation + most important questions, a version of the decision docket. Ends with gamification ("structure fully established", next steps), a decision docket, goals for the discovery phase / sprint / campaign with decisions oriented to it. Legal documents role integration: if none, show the connections to set them up.
- End state: a structure for the venture and routing of all decisions. Operating it needs a management suite = Mentura. Naive:Mentura = Next.js:Vercel. Mentura would compete with https://macro.com/ as a workspace.

My reply (06:0xZ): sources go into knowledge/sources.json after the hats question; `naive dev` opens the guided setup page; asked his OK that this setup page is the one framework view exception (see [[feedback-views-are-platform]]); checking whether Rho has an API. Roles/types built by the Mac on #32 (072337f, EE-082, packages 0.2.0 to publish after merge). Related: [[ee-setup-roles-venture-type]], [[venture-folder-knowledge-beside-code]].

06:1xZ: all merged on draft PR #33 (c6ek0b @67a0810; #32 folded in through e858e51): 163/234 built. Rho accounts now money/<id>.json, summary money/_summary.json, router skips _* files in lists. Cloud env HAS TYPESAFE_API_KEY (real Jev classification ran), so I-7/I-24 can be built here. Asked Torian: model-in-chat setup option? seed a demo startup with Rho? Writes/brand/upgrades groups re-running (run wf_c0f78da0-400 resumed, task wwsf6q2b9).

06:27Z Torian: setup means using the model harness native features (Claude artifacts), NOT a local dev server; yes to seeding a demo startup with Rho + settled decisions (Mac doing it). Built 6b3d478 on #33: interface/orchestration/setup.mjs (state/relay/confirm/point/artifact), interface/skills/naive-setup (SKILL.md + artifact.html), MCP tools mentura_setup/_answer/_point, `naive setup`. Model relays founder words as open proposals; founder confirms with `naive setup confirm` (keeps EE-058). /setup browser page kept as fallback using same module. Example artifact https://claude.ai/artifact/HGEg6jpoau9nojQBXWi6tD

06:44Z Torian shared Decision Library draft (https://claude.ai/code/artifact/39b472cb-eee4-4ee3-9ba2-cb2e17ef7637, from another thread): frames = reusable problem shapes (hidden decisions, premises, attacks, freshness spec, reasoning, emits decision records; never answers). I recommended: name "frame", home library/packages/<fn>/frames/, freshness spec in package and lookup skill in kit; build schema + one frame (fund-without-ceding-control) for demo. Decision card posted 06:5xZ.
