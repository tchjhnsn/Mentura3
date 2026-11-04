<!-- exported 2026-11-03 from https://claude.ai/artifact/RrM6rsuXAGjk8Wvh9Lv33i (Claude Docs id c93f2907-9522-4457-a26e-023d8be06fdd) -->
# Naive Venture Design

Oct 30, 2026 · @Torian

A systems design for the Naive venture: goals, the requirements they set, phase gates, constraints, and the agent-first decision's impact. Every record here is a draft in your venture's k-base/\_drafts until you accept it.

## Goals

Your most important goal now is near-term: a stable release of Naive you rely on every day and trust others to depend on. It unlocks the longer goals below; none has numeric targets yet.

| Goal | Kind | Statement | Measures | Source |
| --- | --- | --- | --- | --- |
| default-convention | venture | Superseded by your ends, more-founders (agent draft, archived). | Active ventures (wrote a record in 30 days); share validated before build | Telos draft, 2026-10-28 |
| owner-outcome | owner | An income you can live on matters more than selling the company. | None yet | Your words, 2026-10-28 |
| stable-release (primary, near-term) | venture | Release a stable Naive you can rely on every day and are confident letting others use and depend on; daily use becomes how you test and develop it. | You use it daily without workarounds; others adopt it; to define: release criteria | Your comment, 2026-10-30 |
| more-founders (the ends) | venture | More people realize that they are founders. The ends is the ethos: if you have an idea, you are a founder. | No scale target, by choice; work on the most immediate issues, not a five-year plan | Your words, 2026-10-30 |

Open: is there a scale goal? Your example of hundreds of millions of users would set much heavier requirements; it is not recorded as a goal.

Ends and ethos: you described a thinking framework where a venture's ethos is inherited from its ends, and sometimes the ethos comes first and reveals ends you already hold. For Naive they are the same. Its sub-ethos is "now what?": after a stable release, precog should help answer it. Until then you are building in stealth; when to come out is an open decision (stealth-until-stable).

## Requirements

Four requirements bind decisions now, even where the phase that tests them comes later; three are weight 3, so they lift linked later-phase decisions into today's ranking.

| Requirement | Must hold by | Constrains | Verified by | Weight |
| --- | --- | --- | --- | --- |
| validate-before-build: problem graded moderate+ from 5+ ICP interviews before any product goes live | Validation | validation, product | Evidence on foundation/problem | 3 |
| founder-decides: no agent settles a decision, foundation statement or publication | Discovery | foundation, marketing, product, people | The gate (schema/gate.mjs) | 3 |
| confidential-pipeline: Mentura's research library, training data and models stay C3, never in public Naive | Discovery | product, investors, marketing | npm package exclusion | 3 |
| portable-records: a founder's records stay in plain files they can take with them | Discovery | product | Boundary check | 2 |
| stable-mad: a stable Naive needs a stable MAD; engineering decisions are modeled in MAD, not improvised in Naive | Discovery | product, engineering | You | 3 |

## Exit criteria

Naive is in Discovery; two criteria gate Validation and one gates Beachhead, under the product-first playbook.

| Phase | Criterion | Serves | Met |
| --- | --- | --- | --- |
| Discovery | Problem graded moderate+ from interviews with 5+ ICP founders | validated-before-build | No |
| Discovery | What Mentura will and won't do is logged as a decision, compliance included | active-ventures | No |
| Validation | Founders outside the team keep writing records month over month | active-ventures | No |

## Constraints

- No default without a traceable source.
- No founder's records locked into a format they cannot read or take with them.
- No internal record published as it is: only artifacts built through the publishing gate.

## The agent-first decision

You decided Naive's promise is that the founder wears one hat and agents wear the rest. That one decision reaches six functions; each impact below is an agent draft for you to confirm, and each becomes an open follow-up decision once the decision-impact code (PR #79) merges.

&#91;embedded content: agent-first decision · impact on six functions (drafts)\]

The finance line is the least certain: whether model spend actually replaces payroll is unproven.

## Product Anatomy

The dynamic decision index narrowly leads as flagship in Validation (0.79, against the framework at 0.78 and the chief of staff agent at 0.77), on agent judgments not yet scored by Jev.

| Phase | Flagship | Runner-up | Note |
| --- | --- | --- | --- |
| Validation | Decision index (0.79) | Naive framework (0.78) | Three-way near-tie with the chief of staff agent |
| Beachhead | Decision index (0.78) | Naive framework |  |
| Scale, Platform | Naive framework | Decision index, tied | The framework is the substrate in every phase |

What decides it: whether the index can be built within months, whether founders feel "what should I decide next" urgently (unproven, needs interviews), and whether the chief of staff carries the promise better.

## Your decisions

- [ ] Accept or change the two goals; add a scale goal if you have one
- [ ] Accept or change the four requirements and their weights
- [ ] Accept the Discovery and Validation exit criteria
- [ ] Accept the constraints
- [ ] Confirm each of the six agent-first impacts, especially finance
- [ ] Decide the flagship after a Jev run on the anatomy answers

Each record waits as a draft in your venture's k-base/\_drafts; accept one with mentura accept \<route>.
