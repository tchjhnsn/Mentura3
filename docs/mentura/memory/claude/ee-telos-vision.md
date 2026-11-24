---
name: ee-telos-vision
description: Torian's 2026-10-27 vision for the EE telos (one-shot whole ventures), naming ideas Mentura/Ventura, BASED as a possible telos template
metadata:
  type: project
  modified: 2026-10-27T18:11:58.891Z
---

Torian, 2026-10-27, starting the EE telos (purpose/telos.json, EE-023), still working it out:
- Vision: AI can one-shot websites and apps because frameworks exist for them. No framework exists for one-shotting entire ventures of different types and scales. With EE, people can one-shot an entire venture and have the tools and insight they need for every future phase as they operate it. This matches the venture-development-framework genus (EE-024).
- He is considering renaming EE to something like "Mentura" or "Ventura" (not decided). Ventura collides with Apple's macOS Ventura.
- Telos templates: he suggested ventures could fill in their telos from templates, with BASED as a candidate ("maybe not"). In his methodology-consultancy work, BASED = the uncensored ambition articulation and SMART = the scoped goals. My mapping: BASED for the statement and end state, SMART for measures and exit criteria.

**How to apply:** draft, never settle, the telos for him. Ask one question at a time and don't write telos.json until he confirms.

Related: [[ee-publication-gate]] [[core-product-framework]]

2026-10-27 19:08Z, Torian refined the telos:
- The end state must NOT imply a builder needs every record or layer early; that invites overbuilding. The framework is opinionated about what to think about and when. Jev scores which records a builder needs now and how likely they are to need them later. Low-probability records are not suggested until needed, unless the builder asks. A per-layer variant of the five-step algorithm can help. (Not built yet: a "need-now" scoring of record types.)
- "One-shot" has the vibe-coding meaning. It is possible because agents act as team members. So the operations suite also covers designing the team: which agents and humans you need and when, developing agents, and delegating authority and decisions to them. It also covers agents that help recruit humans (cofounders, sales, investors, HR) and say what they're for. It pushes agents to their limits and finds the loops that need a human. He says this still needs formal building.

2026-10-27 19:25Z, Torian (said "do not create another document"; answer in chat or the existing doc https://claude.ai/artifact/RK23xsWzBtSsjHxjkLWdi9):
- Validation must not be arbitrary or Boolean. He wants a Jev probability score built from sub-scores (idea, product-market fit, pricing, go-to-market, etc.), as a sum or average.
- Option B (time to running) should break down by layer and by MAD tier, since quality differs across them.
- Go-to-market paths differ: some market the core product before the flagship ships, and some seek a cofounder before any product (skills brought versus needed). This changes what validation looks like.
- "One-shot" overstates it for hardware and similar ventures. The degree to which a venture can be one-shot varies by type.
- Research on what agents can do is new, so human-in-the-loop calls need constant new reading and our own evidence.
- Today: venture.json phase is set by hand; phases.json gives a generic gate (Validation = "Product-market fit: retention holds"); nothing computes it.
- 19:31Z: validation sub-scores must cite evidence. Evidence from the wrong audience scores lower. User feedback is the key signal, weighted by how many users, which types and how good the feedback was; retention is another signal. All of this is folded into the measures doc (rev 10). NEXT BIG TOPIC (Torian: "one of the most important elements"): a pipeline for how users/builders flow through the entire system across the layers. It gets a separate discussion.
- 20:06Z: Torian: each validation sub-score needs its own record types and templates. A weak record only states the claim (e.g. a problem); a strong one carries cited evidence such as market research. Each needs kits, templates and reference folders. My proposal (awaiting his go): a validation kit in the repo (second purpose-layer kit, so relax the one-kit-per-layer rule). One shared evidence item (source, signal kind, audience fit, sample, specificity, date), with grades borrowed from GRADE (high/moderate/low/very low) as the evidence weight. Templates: Mom Test interview, Ellis survey, Van Westendorp, cohort sheet, market sizing, skills matrix. A references/ folder per sub-score. Start with the evidence item plus the problem record end to end.
- 20:18Z: Torian said build it. Working name = Mentura (mentor + Ventura; "a mentor that guides you into the future"), EE-027 proposed, files keep EE until checked. Add "prevent overbuilding" to the promise as a revisit note (in instance EE profile.md "To revisit"). Built uncommitted on branch claude/project-thread-wh9fid (restarted from main eb01faa): validation kit purpose/kits/validation/ (EE-026), check-validation.mjs, tandem problem example, multiple kits per layer allowed. Needs his explicit OK to commit/push.
