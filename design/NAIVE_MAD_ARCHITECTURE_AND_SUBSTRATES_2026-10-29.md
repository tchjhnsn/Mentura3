---
type: plan
source: ai-drafted
created: 2026-10-29T22:20:00Z
ai-model: claude-opus-5.5
tags: [naive, mad, architecture, substrate, verification, vdlc, sdlc]
---

# Naive, MAD and what they share

This is a draft for Torian. Naive is the venture development lifecycle, the business side. MAD is the software development lifecycle: how software gets built. Naive takes no position on how software is built.

## 1. The loop in the image, and where it sits

The diagram shows a generator model proposing tasks. A task verifier checks them, with a verifier model plus code checks: the initial code runs, the tests fail first, and the reference solution passes. Verified tasks go to the model under test. A grader runs the tests and gives a solve rate. An improver model reads the verifier's rejections and the solve rate, and improves the generator. Tasks solved 25 to 50% of the time become the frontier.

The same loop fits both frameworks:

| Diagram | In Naive (ventures) | In MAD (software) |
|---|---|---|
| Generator model | Agents draft records and decisions (precog) | Builder agents write code |
| Task verifier: code checks | The gate, schemas, lint suites | Tests, CI, conformance checks |
| Task verifier: verifier model | A model judging alignment, such as brand or mission (`use model`) | A model reviewing that tests measure intent |
| Model under test | The founder's decision or the agent's work | The implementation |
| Grader | Real outcomes: evidence and decision `outcomes` (EE-058) | Test runs, evals |
| Solve rate | How often decisions hold up; time-to-ready | Pass rate, defect rate |
| Improver model | Playbooks and lint rules revised from outcomes | Templates revised from tailorings (MAD requirement 16) |
| Frontier tasks | Decisions at the edge of what the founder can do, where Naive teaches | Templates near a tie, or high-risk decisions |

The lesson for both: the verifier, not the generator, sets the ceiling. Builders never verify themselves, and what can't be verified goes to a person.

## 2. Ideal MAD, as Naive would see it

MAD today, from its README: questions per layer (governance, delivery, software engineering, automation), templates as preset answers, ranking by fit, a risk judgment on every decision, versioned templates, typed judgments with separate weights, and plugins for Claude and Cursor.

How MAD would plug into Naive:
- **Naive hands MAD the "what" and "why":** product records, the ICP profiles, the sitemap and brand tokens, and the decision rights for engineering. These come from Naive's engineering or product function, through a handoff.
- **MAD decides the "how":** which templates (spec-driven, TDD, trunk-based and so on) and the project's own record in `.mad/`.
- **MAD reports back to Naive:** delivery status and evidence (shipped, tested, adopted) as Naive evidence records. Naive's phase gates read them. For example, Validation needs retention evidence, and only shipped software produces it.
- **Neither writes the other's records.** They meet at the handoff and the evidence record.

## 3. Candidate shared substrates

These exist in both, or should, and might be built once.

| Substrate | Naive today | MAD today | Recommendation |
|---|---|---|---|
| Decision records and risk judgment | Decision records, docket, need-now | Risk judgment on every decision (req. 4) | Share one decision record and one risk model |
| Typed judgments and scorers | `use model`, judgments, Jev questions | Typed questions, separate weights, Jev (req. 13 and 14) | Share; the contract is already the same |
| Verification: gates, lint, evals | Gate, lint suites, done criteria | Evals, checks | Share the verification loop in section 1 as one substrate |
| Provenance log | Hash-chained `provenance.jsonl` | Not yet | Share Naive's |
| Templates, packages and playbooks | Packages, kits, playbooks | Templates as preset answers, versioned 0.x and 1.0 | Share versioning and the "unevaluated" label |
| Handoffs and delegation | Handoff v2, team plan, delegation plan | Not yet | Share; MAD's builder roles inherit Naive's delegation |
| Skills and plugin packaging | Claude plugin, function skills | Claude and Cursor plugins (req. 11) | Share one packaging pipeline |
| Governance | Decision rights, publication policy | A governance layer | Overlap to resolve: venture governance is Naive's; how a team governs its software process is MAD's |

## 4. Decided by Torian (2026-10-29)

1. **Monorepo, not a separate substrate repo.** MAD and Naive will eventually live in the same repo. Until MAD is ready to move, the shared substrates are built inside Naive.
2. **Agent building belongs to Naive.** An agent is a set of Markdown files, so this part is conventions: what kinds of agents to build, what parameters they have, and how they interact with Naive's code (roles, delegation, verification).
3. Still open: whether MAD's governance layer moves to Naive, and whether Naive's engineering function stays a thin handoff to MAD.
