---
type: handoff
source: ai-drafted
created: 2026-10-29T21:55:00Z
ai-model: claude-opus-5.5
tags: [naive, handoff, cursor, playbooks, lint, functions]
---

# Handoff to Cursor: playbooks and alignment lint suites

For Cursor's agents to build in parallel, one branch and one draft PR per item. Each item is independent. Torian reviews and merges. Nothing here is decided for the founder: every playbook and rule ships as a draft or a fail-open warning.

## Read first

- `AGENTS.md` (repo map, build, test), `site/AGENTS.md` (docs contract).
- The two reference implementations from PR #44 (branch `claude/mac-brand-kit`):
  - Playbook: `knowledge/marketing/nike-playbook.md` in Torian's venture (`~/workspace/naive/naive`): a sourced study, then a fill-in template tied to Naive records.
  - Lint suite: `schema/brand-lint.mjs`, registered as `marketing/brand-lint` in `schema/brand.mjs` `brandCommands`.
- Function skills: `library/packages/<function>/skill/SKILL.md` (branch `claude/mac-function-skills`).
- Inherited inputs pattern: `schema/design-system.mjs` `inputs()`. A function reads other functions' records by key; it never copies them.

## Rules for every item

- Branch from `claude/mac-brand-kit`. Name it `cursor/playbook-<id>` or `cursor/lint-<function>`.
- A playbook lives at `library/packages/<function>/playbooks/<id>.md`. It has frontmatter (`type: playbook`, `source`, `created`, `ai-model`, `tags`). The body has three parts: what the source company or method does, with a link for every claim; a template whose prompts each name the Naive route they read or write; and the checks that tell the founder it worked. Borrow methods, never marks or ad copy. Name a trademark risk where there is one.
- A lint suite is `schema/lint-<function>.mjs`. The CLI is `node schema/lint-<function>.mjs <venture dir> [--json]`, and the route is `<function>/lint`. It reuses the `brand-lint.mjs` shape:
  - Each rule is `{id, description, severity: "warn", mode: "fail-open"}`.
  - A per-rule override is `<function>_lint.rules.<id>.mode` in `naive.config.json`. Exit 1 only when a fail-closed rule has findings.
  - Each finding is `{rule, mode, file, message, suggestion}`.
  - Inputs come from records through `ventureFile`, never from memory.
- Every lint suite ships a test, `schema/lint-<function>-test.mjs`, with one fixture that must fail each rule. Add it to `test.mjs`. `node test.mjs` passes before the PR.
- Run `node interface/router.mjs --md` and update `docs/reference/ROUTES.md` when you add a route.
- No Co-Authored-By lines. Draft PRs only. Don't merge.

## Playbooks to build

| id | Function | Source to study | What the template produces |
|---|---|---|---|
| nike-brand | marketing | Nike (done, as the reference) | Ethos line, hero stories, one long-lived tagline |
| apple-launch | marketing | Apple keynote and launch practice | A launch narrative and demo script from `product` |
| lean-validation | validation | Lean Startup, The Mom Test | An interview plan and evidence records for `foundation/problem` |
| jtbd | foundation | Jobs to Be Done (Christensen, Moesta) | The `jobs` of each `foundation/icp/<id>` profile |
| stripe-docs | product | Stripe's developer docs and API design | A docs-first product spec and changelog habit |
| amazon-6-pager | decisions | Amazon narrative memos and the PR/FAQ | A decision memo template for `decisions/<id>` |
| basecamp-shape-up | product | Shape Up | Six-week cycles and pitches, as handoffs between sprints |
| y-combinator-fundraise | investors | YC fundraising guidance, the SAFE | A raise plan, investor records and data-room checklist |
| bessemer-saas-metrics | finance | Bessemer SaaS benchmarks | A metrics record and its targets by phase |
| netflix-culture | people | Netflix culture memo | A culture doc and hiring bar for `people/team-plan` |
| hubspot-inbound | marketing | Inbound marketing | A content plan from `marketing/sitemap` |
| sales-founder-led | customers | Founder-led sales practice | A pipeline for `customers/<id>` and first-ten-customers playbook |
| patagonia-mission | foundation | Patagonia's mission and stand-taking | Alignment principles with checks |

## Lint suites to build

Each checks a function's decisions and records against what it inherits from the foundation (mission, ICP profiles, alignment) and from its own records. All rules are fail-open by default.

| Function | Route | Default rules |
|---|---|---|
| foundation | `foundation/lint` | A mission that names no ICP; an ICP with no jobs; an alignment principle with no check; a problem form no ICP has |
| validation | `validation/lint` | A claim with no evidence; evidence older than its shelf life; an assumption graded only by agents; a decision made in Validation on Discovery-grade evidence |
| product | `product/lint` | A product with no ICP it is offered to; a feature that serves no job; a business model with no pricing record |
| marketing | `marketing/brand-lint` | Done (reference): avoid-words, voice-jargon, audience-unknown, unsourced-brand-choice |
| finance | `finance/lint` | A spend decision with no runway impact; a price below cost; a metric with no target for the current phase |
| money | `money/lint` | A transfer decision with no named approver; an account with no owner |
| people | `people/lint` | A role with no owner function; a hire before the team plan names the role; a decision owned by no person |
| customers | `customers/lint` | A customer that matches no ICP; a promise to a customer the product does not keep |
| investors | `investors/lint` | A raise decision with no use of funds; terms that conflict with an alignment principle; an investor update with unconfirmed numbers |
| legal | `legal/lint` | A public claim with no source; an agreement with no counterparty record |

## Roles, delegation and the verification substrate (added 2026-10-29)

Torian decided: agent building belongs to Naive, as conventions (agents are Markdown files). Shared substrates with MAD are built inside Naive until MAD joins the monorepo. Full plan: `docs/design/ROLES_DELEGATION_AND_VERIFICATION_PLAN_2026-10-29.md`.

| Branch | What to build |
|---|---|
| `cursor/roles-templates` | `governance/venture-template/roles/<id>.json` for founder (chief delegator), chief-of-staff, product-manager, cto, builder, marketing-lead, finance-lead, validation-lead, people-lead, counsel. Each has: function, grantable decision classes, default tier (person, frontier, workhorse, none), lint suites it runs, `verified_by` (never itself), skill path. A schema `schema/role-template.schema.json` and a check that `verified_by` differs from the role. |
| `cursor/chief-of-staff-agent` | `agents/chief-of-staff/AGENTS.md` and skill: reads the docket, delegates only within its grant, writes handoffs with a verifier other than the holder, escalates everything else to the founder. It ships open source with Naive. |
| `cursor/delegation-suite` | `governance/delegation.json` (grants `{from, to, classes, scope, may_redelegate, expires}`, founder as root), the default template (operations classes re-delegable by the chief of staff; strategy-or-constitution, experience-design and money never re-delegated), `schema/check-delegation.mjs` (no grant exceeds its grantor's, the chain reaches the founder, no self-verification, expired grants fail), and `governance/playbooks/delegation.md`. |
| `cursor/verification-substrate` | One module, `schema/verify.mjs`, that the gate, lint suites and handoff done criteria all call: a check is `{kind: conformance | model | person, verifier, target}`, the verifier must differ from the builder, and results are logged in provenance. Don't change behavior; move the builder-is-not-reviewer rule from `check-ready.mjs` and `check-execution.mjs` into it, so MAD can reuse it later. |
| `cursor/phase-gate` | Check a phase's exit criteria (telos) before `naive phase` moves on. Fail-open by default: it warns and the founder decides. |

## Then

When a suite lands, add it to its function skill (`library/packages/<function>/skill/SKILL.md`, a Checks line) and to `naive check`. A later change can add a cross-function rule set: a decision in one function that contradicts another function's records, such as marketing promising what product does not ship.
