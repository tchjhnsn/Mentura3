---
name: ee-venture-structure
description: AGREED 2026-10-28 22:35Z (EE-070): venture folders are packages (Next.js-style structure); one word "package", "kit" retired; migration after hackathon
metadata:
  type: project
---

Torian agreed to the full structure doc: https://claude.ai/artifact/Jh4pQmq1ZtgeukjP2EwGs8 . It is recorded as EE-070 (proposed) in docs/decisions/decisions.json on PR #19.

**Top-level layout of a venture:**
- `venture.json`
- `raw/`
- `ideas/`
- core package folders: `foundation/`, `validation/`, `product/[id]`, `marketing/`, `finance/`, `people/`
- data packages: `customers/`, `investors/`, `money/`
- `decisions/`, a single docket
- `evidence/`
- `_private` and `.package/` (generated)

**Routes:** the first segment is the package, as in `validation/pricing`. Layers become a property of record types.

**Phase packages:** packages are defined per phase. A founder can turn on a later phase's packages early.

**Naming:** "package" is the only word. Torian, 22:34Z: "packages will sound more familiar to most people". This means renaming `<layer>/kit.json` and the kit vocabulary in the framework, and it supersedes the EE-066 naming question.

**Timing:** do not build the migration before the hackathon deadline (Oct 29, 22:00Z). Use route aliases, `git mv`, and `mentura migrate`.

Related: [[ee-observations-evidence]], [[ee-ideas-raw]], [[ee-system1-pipeline]], [[ee-venture-package]].

2026-10-28 22:47Z, Torian: "kits" may be a loaded definition that means more than packages; he asked to evaluate it. He shared a Grok research doc mapping Next.js and React to Naive (§6.2: kits are hooks, closer to an npm package that ships hooks).

My proposal (22:50Z, awaiting his answer):
- Keep both words. A kit is what Naive ships: schemas, skills, templates, checks and gaps, scoped by layer or tier. A package is the venture's records, organized by department or subject, which complete, get versioned and get handed off.
- They are not one-to-one. The system and interface kits fill no package.
- This would withdraw EE-066 and amend the "kit retired" line in EE-070.

2026-10-28 22:53Z, Torian's first-principles redesign (supersedes the 22:34Z "kit retired" line):
- A venture is Naive's equivalent of a Next.js project, one to one.
- Packages belong to Naive and contain mainly schema.
- Kits belong to Mentura and are enhanced packages that add automations, agent workflows and skills.
- He is unsure how layers and departments are distinguished in the venture structure.

My proposal (22:56Z, not yet agreed):
- A package is schemas, templates and deterministic checks. It is offline and is listed in `venture.json` like a dependency.
- A kit extends exactly one package and never replaces it.
- Venture folders are split by department and subject (like Next.js "by feature"). A layer is a cross-cutting property of a record type. `decisions/`, `evidence/` and `raw/` become packages, so layers leave the venture tree.

Open questions I asked:
1. Can a package carry one minimal skill?
2. Should the "venture package" deliverable be renamed "release" (with handoff releases)?
3. Layout: `packages/<name>/package.json` in Naive, and `platform/kits/<name>/kit.json`.

22:58Z: Torian AGREED to all of the 22:56Z proposal:
- packages belong to Naive and kits to Mentura, each kit extending one package;
- layers leave the venture tree;
- a package may carry a minimal skill;
- the deliverable is called a "release";
- `packages/` and `platform/kits/` layout.

He also said departments were only a conceptual tool. For a solo founder or a flat org they are functions of the venture, and one person wears many hats. Each one still needs an owner. The term is open.

I proposed "function" (the standard business-function term, using the EOS Accountability Chart model): one owner per function, and one person may own several. A "department" is a function that has its own team, which comes in later phases. Once he agrees, I'll record EE-071 on PR #19; the code rename waits until after the deadline.

Coordinator 22:59Z: EE-080 is reserved by Fumadocs PR #21; keep PR #19's decision ids below EE-080.

23:08Z: Torian agreed to "functions". EE-071 is recorded on PR #19 (35ad45c).

His research objective (the Grok mapping doc misunderstood it): go through every line of the Next.js App Router docs in slow linear order, plus any React concepts that Next.js does not cover. For each concept:
- record what it builds on;
- convert it into a Naive concept, or mark it "doesn't convert" and say why;
- decide the vocabulary: adopt Next.js's word, or keep iterating our own.

Also note where TypeSafe System 1 and AI-native development change the concept. Example: analytics becomes decision analytics (outcomes, highest-impact decisions, counts by type per function). This is future work, not for the demo.

He considers this the most important work: formalize the framework docs.

My proposed method (23:10Z): one row per concept with source, builds-on, Naive concept, status, vocabulary and a System 1 note. Work one chapter at a time in a Claude Doc, starting with Getting Started (Installation, then Project Structure), pausing for review after each.

23:11Z: Torian confirmed the objective. Build decision analytics if time allows, otherwise foreshadow it.

Translation doc: https://claude.ai/artifact/XUWNP7MZ1uTNP4uSY6pwgu (project container f6c95735-5c9b-4a45-b887-98d797e21cea).
- Chapters 1 (Installation, I-1 to I-29) and 2 (Project Structure, P-1 to P-38) are done.
- It also has a dependency chain, an 11-row vocabulary table and the analytics future concept.

Waiting on Torian for two things: his vocabulary picks, and whether to build demo analytics (decision counts by type and function, open vs decided, on the board). Next chapter after review: Layouts and Pages. Pages are fetched as Markdown from nextjs.org/docs/app/getting-started/<page>.md.

23:18Z, Torian: adopted all of my vocabulary recommendations except what plays React's part, which stays open. He asked for decision analytics.

23:21Z, Torian: build no views. Views are platform work (Mentura). Otherwise they are visualization skills for rendering Naive inside another harness (Claude Code, Codex, Cursor).

Built EE-072 (5c515ac, PR #19) as data only: schema/decision-analytics.mjs and route governance/analytics.

Proposed: move interface/demo/board.mjs under platform/ after the deadline. Next: Chapter 3, Layouts and Pages, once he's ready.

23:26Z, Torian: views belong to the interface layer, the sixth EE layer (`interface/`): agent harnesses such as Claude Code, Codex and Cursor, plus our own interface. Mentura needs its own interface to interact with the framework best.

Chapter 3 (Layouts and Pages: R-1, R-2 and L-1 to L-15) is in the translation doc.
- Proposals: a per-folder `layout.md`, layouts sent once per session, and ref summaries on read.
- Open words: `layout.md` vs `AGENTS.md`, and `naive typegen`.
- Next chapter: Linking and Navigating.

23:33Z, Torian decided `naive typegen`. On layout.md vs AGENTS.md, he asked to research and weigh both, since AGENTS.md is a standard.

My recommendation (23:35Z, awaiting his decision): use AGENTS.md as the file and keep "layout" as the concept. The layout is the chain of AGENTS.md files from the venture root down, plus what the package definition supplies (skills, template, gates).
- AGENTS.md (agents.md) is stewarded by the Agentic AI Foundation under the Linux Foundation. The nearest file takes precedence. It is read by Codex, Cursor, Copilot and others.
- Claude Code covers it through an `@AGENTS.md` import.

23:35Z Torian DECIDED AGENTS.md (file) + layout (concept). Chapter 4 Linking and Navigating (N-1..N-14, R-3 server=code/client=model, R-4 suspense) added; open words: 'agent vitals', 'context budget'. Next: Server and Client Components.

23:39Z Torian decided 'agent vitals' + 'context budget'. Chapter 5 Server and Client Components (S-1..S-18, R-5) added: server = code, client = model (TypeSafe split; framework/platform mapping set aside). Proposals: declared model boundary ('use model', open), agent provenance across it, cached judgments, never-to-a-model marker + check (name open). Next: Fetching Data.
