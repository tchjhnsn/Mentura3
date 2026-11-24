<!-- exported 2026-11-03 from https://claude.ai/artifact/BPmRBdS9mp6JoRtWMwW1hE (Claude Docs id 54291f59-8069-4f97-bb18-58252345fe45) -->
# Precog: anticipating needs with grounded confidence

Nov 1, 2026 · @Torian

## Summary

A need is not a constraint. The engine shows the two overlap without either containing the other: a need is a gap between what a goal requires and what is available, and a constraint narrows the acceptable solutions. A constraint is a kind of requirement. A runway shortfall is both a need and a constraint; "budget under $2k a month" is only a constraint; "we need a voice vendor for interviews" is only a need, and specifically a **supplier need**, which is what precog should spot early.

Precog is not one known field. It sits where four bodies of research meet: **proactive agents** (raising help before being asked), **selective prediction** (when to abstain, which trades coverage for risk), **calibration and conformal prediction** (confidence that matches reality, with provable coverage), and **value of information** (when to research before acting). The research question, "as proactive as possible while as accurate as possible", is a risk–coverage tradeoff with lead time as the proactiveness measure.

The reward we propose pays for lead time, scores confidence with a proper scoring rule, and pays separately for grounding (records cited, or research done, cached and proposed as an update). It penalizes overconfidence, confidence without grounding even when the guess was right, and any claimed guarantee that did not pass a check. Suggested orders come as a set of alternatives, never a single answer, and "play to the founder's strengths" is a choice of weights over the objectives, not a different model.

All of this is proposed. Engine runs: 13/13 and 24/24 predictions confirmed. The Lean mirror is with the build thread.

## Need vs constraint

Each term is defined by properties over a venture statement, frozen, and run over all 256 combinations of seven facts. Run file: `precog-vocab.ts`.

| Term | Passes when | Source of the definition |
| --- | --- | --- |
| need | serves a goal, required exceeds available, and is not itself the end state | Kaufman's needs assessment (a gap in results); ISO/IEC/IEEE 29148 stakeholder needs |
| constraint | restricts acceptable solutions and is verifiable | ISO/IEC/IEEE 29148: an externally imposed limitation on the system, its design or implementation |
| requirement | verifiable | ISO/IEC/IEEE 29148: a statement that translates or expresses a need and its constraints and conditions |
| goal | is the desired end state | goal-oriented requirements engineering (van Lamsweerde) |
| dependency | relies on another party | PMBOK external dependency |
| supplier need | a need that relies on another party, and a third party sells something that meets it | derived |

What the run found, all as predicted:

- need and constraint **overlap**. Neither is a kind of the other. Lean states both directions as witnesses: a need that restricts nothing exists, and a constraint with no gap exists.
- constraint **is a** requirement, as in ISO 29148.
- need and goal are **disjoint**. A need is the gap toward a goal, not the goal.
- supplier need **is a** need and **is a** dependency. This is the term precog watches for.

Worked cases: "Ship v1 by March" is a goal and a requirement. "Need voice for the founder interviews, no TTS yet" is a supplier need. "Records must be append-only" is a constraint. "Runway four months short of Validation exit" is a need and a constraint at once.

**Caveat.** The definitions above come from sources I did not open this session (ISO 29148 is paywalled; Kaufman and PMBOK are from memory). By our own update theorem they stay held: the glossary records are `proposed`, and the quoted ISO wording should be checked against the standard before any record cites it.

## What precog is called in the field

No single field owns "see needs before the venture feels them". Each part has a name, and the parts have been studied separately.

| Our part | Field name | What the source says (opened this session) |
| --- | --- | --- |
| Raise a need before anyone asks | **Proactive agents** | Lu et al. 2024 ([arXiv 2410.12361](https://arxiv.org/abs/2410.12361)) train a reward model on predictions users accepted or rejected, and evaluate on ProactiveBench (6,790 events, best F1 66.47%). Closest existing work to precog. |
| Hold back when unsure | **Selective prediction** (the reject option) | Geifman and El-Yaniv 2017 ([arXiv 1705.08500](https://arxiv.org/abs/1705.08500)): pick a target risk and a confidence, get a guaranteed error rate at some coverage, e.g. 2% top-5 error with 99.9% probability while answering about 60% of cases. |
| Confidence you can prove | **Conformal prediction** | Angelopoulos and Bates 2021 ([arXiv 2107.07511](https://arxiv.org/abs/2107.07511)): prediction sets with a user-chosen coverage, distribution-free and finite-sample. |
| Research before acting, or not | **Value of information** | Howard 1966. Only the Wikipedia index page was opened, so this stays held. |
| Weighing frameworks against each other | **Multi-objective RL** | Hayes et al. 2022 ([arXiv 2103.09568](https://arxiv.org/abs/2103.09568)) argue that adding objectives with fixed weights oversimplifies; they work with a utility over objectives and Pareto sets. |

Industry names for the supplier side, from memory and not yet opened: **demand sensing** and **demand forecasting** (supply chain), **horizon scanning** (strategy and government foresight), and **anticipatory systems** (Rosen 1985, a system that uses a model of its future to act now). The closest name for the whole of precog is probably "anticipatory" or "proactive" decision support.

**What looks new.** Proactive Agent rewards being accepted. It does not reward being calibrated, it does not separate being right from being right for a recorded reason, and it does not tie abstention to a research step that writes back to records. Those three are what Torian asked for, and I found no paper that combines them. That is a gap in what I searched, not proof that none exists.

## Precog's reward and its gates

Two layers. The **gates** are hard: an anticipation that fails one is never shown and never rewarded. The **reward** ranks what passes, and is what training would push on.

### Gates, in order

1. **Records.** Does the premise rest on records? If yes, cite them. If no, go to 2. Never skip to a confident answer.
2. **Research.** Run research. Every exchange is logged as a trace and cached as a reference (U1, U2 of the update theorem).
3. **Proposed update.** Send what the research found to the record keeper, a separate model with its own checks, as a proposed update. Precog never writes records itself.
4. **Calibration.** The confidence must come from a calibrator checked on held-out records, not from the model's own sense of certainty.
5. **Proof.** Any claim of a guarantee ("proved", "certified") must have passed a check: a Lean proof, or conformal coverage on held-out records. Otherwise drop the claim.
6. **Alternatives.** At least two options, each with risk and reward and with activities and outcomes.

Passing all six is the term **admissible anticipation**. The engine and Lean show it is disjoint from overconfidence, from confidence for the wrong reasons, and from false proof.

### The reward on what passes

For one anticipation with stated confidence *p*, where *y* = 1 if the need later materialised:

**R = a · lead time − b · (p − y)² + c · grounding + d · scenario coverage**

| Term | What it pays for | Why this form |
| --- | --- | --- |
| lead time | raising the need earlier, measured in days before it was stated | proactiveness, the first half of the research question |
| (p − y)² | the Brier score: being confidently wrong costs most | a strictly proper scoring rule, so the best strategy is to report your true confidence. This is what penalizes overconfidence |
| grounding | each step that cites records, or researched, cached and proposed | a process reward on the steps, not only the outcome |
| scenario coverage | the share of enumerated scenarios the alternatives address | exhaustiveness: play out as many scenarios as needed |

Penalties applied before the reward, because the gates drop these cases:

- **Confident for the wrong reasons**, even when right. The engine names the right-but-ungrounded case a **lucky guess**; an outcome-only reward would pay it, which is why grounding is rewarded per step. Lean proves a lucky guess can be calibrated and correct, so neither of those catches it.
- **False proof**, the hardest penalty, since it is the failure that most damages trust.
- **Abstention** earns no lead time, which is its cost. When the value of information is high, abstention should trigger research rather than end the turn.

The weights a, b, c, d are not a technical choice. They are the founder's choice of framework, which is the next section.

### Is this a new RL incentive?

Its pieces are not new: scoring-rule RL (our P2), process reward (our P4) and proactive-agent reward models. The combination looks new: lead time as reward, calibration as a proper score, grounding as a process reward, and a record-keeper step inside the gate. Proposed name: **P5, precog**. It needs the check-outcome log (P0) first, because the calibrator and the held-out records come from that log.

## Suggested orders, alternatives, and "play to strengths"

An order of work, such as which RL pipeline comes first or when to start go-to-market, is a precog output like any other. It passes the same gates, so it never comes as one answer. It comes as a **set of alternatives that no other option beats on every axis** (a Pareto set), each with its risk and reward and its activities and outcomes.

### Example: go-to-market before or after the product

|  | Pre-product GTM (waitlist, interviews, presell) | Post-product GTM (build, then sell) |
| --- | --- | --- |
| Activities | landing page, discovery interviews, letters of intent | build MVP, then outreach and demos |
| Outcomes it can produce | evidence of demand before spending on build | a working product to show |
| Reward | cheaper learning; earlier signal of pull | stronger demos; fewer promises to unwind |
| Risk | selling what cannot be built; reputation cost of delay | building what nobody wants; runway spent before signal |
| Records it needs | segment, job, interview log | build estimate, runway |

Neither column is "the answer". Precog shows both with the scenarios each covers, and says which records would change the ranking.

### Frameworks as weights

A framework is a choice of weights over the objectives (risk, reward, speed, cost, learning, and so on). Hayes et al. argue the weights should feed a utility, not a fixed sum, and that is the design here.

- **Play to the founder's strengths.** Weight options by how well their activities match the founder's recorded strengths and preferences. Those come from decision-card choices, learned as preference pairs (our P3), plus what the founder declares.
- **Play to the team's strengths.** The same, over each member's records.
- **Play to a supplier's strengths.** Weight by what suppliers are recorded as good at, with `has-capability` records.
- **Play to the venture's strengths**, across all axes of the venture anatomy matrix.
- **Play to the market.** Weight by what the market rewards now (segment and timing records).

The founder picks the framework, or several to compare, and the Pareto set changes. Precog proposes; the founder decides. Personality and preference records are about a person, so they stay owned by that person, with the same consent rules as the rest of the founder record.

## Status, next research, and sources

**Built and checked**

- `precog-vocab.ts`: 16 terms at two levels. 13/13 predictions on 256 cases, 24/24 on 8,192 cases.
- `Precog.lean`: builds clean on core Lean with no `sorry` and no axioms. It has 12 theorems, among them:
  - need and constraint each exist without the other, and can coincide;
  - admissible excludes overconfidence, wrong reasons and false proof;
  - a lucky guess exists;
  - missing records still allow admission through the research path.
- The terms are admitted as `proposed`. They are private: none are in Grok's term list.
- Five fetches are cached as references through the update theorem: four admitted from abstracts, and the Wikipedia index held.

**Not built (proposed only)**

- The calibrator.
- The lead-time measure, which needs a "need stated at" timestamp on records.
- Scenario enumeration.
- The record-keeper model.
- P5 training, which waits on the P0 check-outcome log.

**Next research**

- Read the Proactive Agent paper in full, not only the abstract.
- Read a conformal risk control paper, which gives guarantees on losses other than coverage.
- Open ISO/IEC/IEEE 29148, or a quoting source, to verify the constraint and requirement wording.
- Find a primary source for value of information (Howard 1966).
- Look for prior work that combines proactivity with calibration.
- Look at demand sensing in supply chains, for the supplier-need detector.

**Sources opened this session:**

- [Proactive Agent, arXiv 2410.12361](https://arxiv.org/abs/2410.12361)
- [Selective Classification, arXiv 1705.08500](https://arxiv.org/abs/1705.08500)
- [Conformal Prediction, arXiv 2107.07511](https://arxiv.org/abs/2107.07511)
- [Multi-objective RL guide, arXiv 2103.09568](https://arxiv.org/abs/2103.09568)
- [Value of information (Wikipedia, index only)](https://en.wikipedia.org/wiki/Value_of_information)

Cited from memory, not opened: Kaufman, ISO/IEC/IEEE 29148, PMBOK, van Lamsweerde, Brier 1950, Gneiting and Raftery 2007, Lightman et al. 2023, Rosen 1985.
