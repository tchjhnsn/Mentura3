---
name: ee-setup-roles-venture-type
description: Torian 2026-10-29 05:41Z wants create-venture setup to ask venture type, the founder's role/hats, solo vs team, phase; people/ top-level folder with roles + founders JSON; for the demo
metadata:
  type: project
  modified: 2026-10-29T05:42:11.462Z
---

Torian, 2026-10-29 05:41Z (his points, to implement for the demo after the current build merge):
- Setup asks: your role in the venture, solo or team, the phase, and so on.
- Choosing the kind of venture is a key step: describe it in a few words (an LLM call classifies it) or pick from a list to skip the LLM. Example: a VC fund/firm where you are an investor needs a thesis and other things; its templates differ from a software startup's.
- An investor can be a role and can also create a venture of their own.
- Nothing is scaffolded until a role and a venture type are chosen.
- After the role, you choose which hats you wear. A solo founder owns every function by default.
- `people/` (name open: people/team) is a top-level folder, the human-capital equivalent of venture.json: the roles schema, plus the founders' JSON (one file with entries or one file per founder, open), linked to founding agreements.

Existing pieces to build on: library/packages/people, library/packages/cofounder, library/packages/investor(s), schema/founder-agreement.schema.json, governance/ownership.json (EE-022); venture.json `kind` is only venture|product today; functions with owners (EE-071).

My proposal (05:4xZ, not yet agreed): venture.json gains a `type` (software-startup, vc-fund, ...) that picks the package set; people/people.json holds roles, hats and function owners; people/founders/<id>.json one per founder linking to the founding agreement. Related: [[ee-venture-structure]], [[ee-scope-solo-founders]], [[venture-folder-knowledge-beside-code]].

05:5xZ: the Mac session builds it on #32 branch claude/mac-ch1-install with defaults (one file per founder, 9 venture types, investor split GP/LP, keep people/, TypeSafe classify with list fallback). Mac also fixed legal-form "corporation" bug (eb4e802). Needs create-venture 0.1.2, which Torian publishes.
