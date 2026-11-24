---
publish: false
type: design-note
source: hybrid
created: 2026-10-28T02:45:29Z
ai-model: claude-opus-5.5
authority: advisory
status: DRAFT
tags: [everything-ecosystem, governance, operations, mad, ee-040]
description: "Where each of MAD's governance and delivery questions is answered in Mentura after MAD left (EE-038), which ones gained a new home (EE-040), and which stay MAD's because they are about the build."
---

# MAD's questions, re-homed (EE-040)

MAD left Mentura in EE-038. Its governance tier and its delivery tier (MAD repo, `layers/governance/layer.json` and `layers/delivery/layer.json`) ask questions about a software project. Some of them are business questions that every venture answers, whether or not it has a repository. Those are answered by Mentura records. MAD reads them there and does not ask again (its `derive-answers.mjs`, now in the MAD repo, did this for four questions under EE-023).

## Governance tier

| MAD question | Answered in Mentura by | New? |
|---|---|---|
| problem_validated | `purpose/validation/problem.json`: evidence and probability | |
| customer_reachable | `purpose/validation/go-to-market.json`: channels and evidence | |
| who_decides | `governance/ownership.json` and `board.json` | |
| funding | `venture.json` `form.funding` | |
| regulatory_exposure | `venture.json` `regulation` (exposure, regimes) | new |
| flow_is_bottleneck | stays MAD's (about the build) | |
| teams_to_align | `operations/team-plan.json` roles | |
| go_decision | `purpose/telos.json` `steering.go_decision`; who makes it: decision class `continue-or-stop` | new |
| success_measure | `purpose/telos.json` primary measure | |
| review_cadence | `purpose/telos.json` `steering.review` | new |
| goal_setting | `purpose/telos.json` measures and phase exit criteria | |
| evidence_method | the validation records' evidence, from the evidence integrations (EE-039) | |
| change_of_direction | `purpose/telos.json` `steering.change_of_direction`; who makes it: decision class `change-direction` | new |
| agent_autonomy | decision rights (levels per class) and each handoff's decision classes | |

## Delivery tier

| MAD question | Answered in Mentura by |
|---|---|
| priority_owner | decision class `set-priorities` (new) |
| gate | each handoff's done-criteria and ready check |
| source_of_truth | for records, `knowledge/sources.json` (EE-037); for code, stays MAD's |
| agent_share | team-plan roles and who occupies them |
| unattended_runs | each handoff's run cap |
| requirements_stability, work_arrival, cost_of_failure, time_to_market, user_availability, fixed_envelope, risks_reducible, size, mixed_parts, sequencing, change_handling, verification_timing | stay MAD's: they describe how the software is built |

## What changed

- `schema/telos.schema.json`: optional `steering` with `go_decision`, `review`, `review_period`, `change_of_direction`. The options are MAD's, in kebab-case.
- `schema/venture.schema.json`: optional `regulation` with `exposure` (light, some, heavy) and `regimes`.
- `governance/venture-template/decision-rights.json`: `continue-or-stop` and `change-direction` (founder, escalate), `set-priorities` (founder, decide-inform).
- The worked example (`schema/examples/workspace/ventures/tandem/`) fills in steering and regulation.

## Still open

- MAD's `derive-answers.mjs` does not yet read the new fields. That is a change in the MAD repo.
- MAD's business-side templates (customer development, Lean Startup, OKRs) could become Mentura playbooks for operations and validation. Not moved: they are written as ways to run a software project.
