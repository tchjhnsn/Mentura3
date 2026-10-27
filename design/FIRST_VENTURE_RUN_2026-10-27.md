---
publish: false
type: research-note
source: hybrid
created: 2026-10-27T04:41:07Z
ai-model: claude-opus-5.5
authority: advisory
status: DRAFT
tags: [everything-ecosystem, ventures, dogfood, product-anatomy, gaps]
description: "First venture run: the Everything Ecosystem set up as its own venture under instance/, Product Anatomy run on its six products, and every gap the run hit. Feeds the next schema round (handoff, eval and decision-rights schemas; runner fixes)."
---

# First venture run: the Everything Ecosystem as its own venture

The Everything Ecosystem (EE) was set up as a venture with schema 0.3.0, in `instance/ventures/everything-ecosystem/`, and Product Anatomy was run on its products. The aim was to find where the system cannot yet run a real venture end to end.

## What was set up

- `instance/workspace.json` and one venture, in the Discovery phase, NAICS 513210 (Software Publishers).
- Core promise: "A builder can run any venture, from a hobby to a company, with AI agents doing much of the work, on one opinionated method whose every default traces to a source." Promised to builders (solo founders and small teams who build with AI agents).
- Ambition: managed growth (owner, 2026-10-27). It may become aggressive growth if the right events happen; re-decide at the Validation gate.
- Six product cards: method site, the kit (schema plus method skills, one offering per the owner), MAD, Product Anatomy, the five-step algorithm skill (a skill that stands alone), operator console.
- Layers point at this repo's own layer folders; knowledge is local to the instance.
- `check-ventures`, `check-nouns` and the JSON schemas all pass.

## Product Anatomy result

Scored by a reasoning model, not Jev (no key in this session). Full table: `instance/ventures/everything-ecosystem/purpose/anatomy.matrix.md`.

| Product | Validation | Beachhead to Platform |
| --- | --- | --- |
| Kit (schema plus method skills) | flagship + substrate (revenue engine tied) | flagship + substrate |
| Five-step algorithm skill | wedge | wedge |
| Method site | wedge | wedge |
| MAD | revenue engine (tied) | end product |
| Product Anatomy | revenue engine (tied) | wedge |
| Operator console | option | revenue engine |

The first run, with skills and schema as separate cards, made agent skills the flagship only 0.05 ahead of the schema and left the method site unassigned. After the owner merged them into the kit, the kit is a clear flagship and the standalone skill and the method site read as wedges into it.

Read with care: the tied revenue engines in Validation come from runner gap 8, not from the venture.

## Gaps found

Fixed in this run:

1. **Empty folders were lost.** Git drops empty `products/` and `clients/`. `init-venture` now writes `.gitkeep` files.
2. **Pillars were copied whole.** Each venture got three 700-line guides. They are now one-line stubs that link to `governance/venture-template/pillars/`; `scaffold/defaults.json` says so.

Open, for the next schema round:

3. **Agents and a solo builder are not a team.** `members` lists people only, so the `ready` question scores a solo builder with agents as having no team. Proposal: members gain a `kind` (person or agent) and a role.
4. **`business_model` has no vocabulary.** "Open core" is not one of the St. Gallen 55 patterns. Proposal: St. Gallen ids plus a small list of named extras, each with a reference.
5. **A product has one market.** The skills serve builders directly and through the schema's adopters. Proposal: `market` becomes a list, with one marked primary.
6. **Layer paths have no stated base.** It is unclear whether `layers.*` paths are relative to the venture folder or the workspace. Proposal: relative to the venture folder, checked by `check-ventures`.
7. **EE's ambition was unknown.** Resolved: managed growth for now, possibly aggressive growth later. The schema holds one value; a planned change of ambition has nowhere to go. Proposal: an optional `ambition_watch` (target value plus the trigger) in the venture profile, not the machine file.
8. **Weak revenue still makes a revenue engine.** MAD and Product Anatomy score 1 on revenue yet tie for the role. Proposal: the runner needs a minimum revenue score before it assigns the role.
9. **Wedge is found only through flows to the flagship.** The public method site leads builders in, but nothing flows from it to a product, so it ends up unassigned. Proposal: detect a wedge from `job` and `market` (the entry point for the flagship's customer) as well as `flows_to`.
10. **Skills and schema tied as flagship.** Resolved: the owner confirmed they are one offering, the kit. Some skills are offerings by themselves (the five-step algorithm skill), so a skill can be both a part of the kit and its own product card. Open: the schema cannot yet say that a product is bundled inside another (a `part_of` or `bundles` field).
11. **Execution and Evidence have no schemas.** Handoffs, evals and decision rights are prose, so the system cannot yet run a venture past the Purpose layer. This run tested Purpose and Knowledge only. The genus (operating system or operating model, EE-014) stays open until it can.

## Follow-up: kits by scope, and what the interface layer is (owner, 2026-10-27)

**Kits have a scope.** Some kits serve the whole system, some one layer (the knowledge skills), some one tier of the operations layer. Product cards gain `scope` (system, layer or tier) and `part_of` (the kits a product is bundled into; a part can still be its own product). The instance now has the system kit, a knowledge kit (SAD) and the five-step algorithm skill, both parts of the system kit. Re-run: the system kit is flagship and substrate, the knowledge kit an end product, the five-step skill and the method site wedges.

**The interface layer, defined.** An interface is a tool through which a person, with agents, works across all or most other layers at once: at least four of the six, in one session. Two kinds:

- Agent harness, the default: Claude Code, Cursor (in use); Codex, Hermes Agent, Grok (candidates; reach to confirm).
- Custom interface: the operator console.

A tool that serves one or two layers is an integration of those layers, however good its screen is. Obsidian stays under knowledge, Linear under operations, GitHub checks under evidence; a harness reaches them. This moved Claude Code and Cursor from execution to interface (Cursor background agents that run handoffs stay in execution, as do the agent SDKs), and moved Claude artifacts to knowledge and Framer to purpose. `integration.schema.json` gains `reach` and `interface_kind`; `schema/check-integrations.mjs` enforces the four-layer rule.

**Harness clash, settled (G-039):** "agent harness" keeps its industry meaning. Workspace decision G-029 had reserved "harness" for the entity class of a first-party interface over a product; that class returns to "app", its name before 2026-10-13. ("Client app" was not used because "client" is a customer record here.)

**AI feature, AI harness, agent harness (owner, 2026-10-27).** Whether AI is a feature of a product or the product itself is now a field on every product card (`ai`), with a test for each level:

| Level | Test | Example |
| --- | --- | --- |
| AI feature | Remove the model and the product still does its job | an app that adds AI summaries or search |
| AI harness | Remove the model and nothing is left; the model answers and the person acts | a chatbot |
| Agent harness | An AI harness where the model directs its own steps and tool use toward a goal, acting between the person's turns | Claude Code, Cursor, Codex |

Every agent harness is an AI harness; a chatbot is not an agent harness. The line between the last two follows Anthropic's split between workflows and agents (reference in `interface/references/references.json`). Interfaces are usually agent harnesses.

## Next

The next schema round covers gap 11 first (handoff, eval and decision-rights schemas), then gaps 3 to 6 and the runner fixes 8 and 9. Gaps 7 and 10 are answered; their schema follow-ups (ambition watch, bundling) join the round. The five-step algorithm skill is not in this repo yet; its card records it so the run could score it.
