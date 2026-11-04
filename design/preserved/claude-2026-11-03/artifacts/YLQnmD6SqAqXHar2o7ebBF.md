<!-- exported 2026-11-03 from https://claude.ai/artifact/YLQnmD6SqAqXHar2o7ebBF (Claude Docs id fdc11730-850b-4c99-bb9c-19a42cdbcbc2) -->
# Reinforcement learning: the field, our pipelines, and records-gated generation

Nov 1, 2026 · @Torian

Our best-fitting reinforcement-learning pipeline is RL with verifiable rewards: our symbolic checks become the reward. It is what DeepSeek-R1 used for reasoning, and DeepSeek gave the reason in its paper: it avoided neural reward models because models trained against them learn to game them. Four more candidates follow from that one, and none is locked. Nothing gets trained until the check-outcome log you approved holds enough labelled outcomes.

This doc was itself built through the gate you described. Each relation in the graph needed a read source behind both of its terms. The first run drew 12 of 36 edges and triggered research for 4 terms. The research ran and every fetch was cached, and the second run drew 19 and reused 9 cached exchanges. One term is still gated: "reinforcement learning" itself, because the textbook's pages refused the fetch.

## The field as a graph

&#91;embedded content: RL methods as the term engine relates them · 11 terms, our pipelines marked\]

Every box is a glossary term with a test, and every relation is one the engine predicted and confirmed: 36 of 36 over 8,192 cases. A method is a combination: one or more reward sources, an optimiser, and a data mode. Wikipedia's index lists about 35 more subfields, among them model-based, multi-agent, hierarchical, inverse, safe, multi-objective and logic-based RL. Logic-based RL includes temporal-logic specifications and "reward machines", rewards written as symbolic rules. That is the subfield closest to ours, and it is the next to read. Those subfields are on the term list as pending, without tests.

## How the labs run reinforcement learning

Most labs run a staged pipeline, and they differ mainly in where the reward comes from.

| Who | Pipeline | Reward from | Source |
| --- | --- | --- | --- |
| OpenAI (InstructGPT, 2022) | Supervised fine-tuning on demonstrations, a reward model from human rankings, then RL | Humans, through a learned reward model (RLHF) | [arXiv 2203.02155](https://arxiv.org/abs/2203.02155) |
| OpenAI (process supervision, 2023) | A reward model per reasoning step | Humans labelling steps (800,000 labels) | [arXiv 2305.20050](https://arxiv.org/abs/2305.20050) |
| Anthropic (Constitutional AI, 2022) | Self-critique and revision, then RL against a preference model trained on AI comparisons | An AI judge applying written principles (RLAIF) | [arXiv 2212.08073](https://arxiv.org/abs/2212.08073) |
| DeepSeek (R1, 2025) | Pure RL first (R1-Zero), then four stages: cold-start SFT, reasoning RL, rejection-sampling SFT, RL for all tasks | Rule checks for reasoning; reward models only for helpfulness and harmlessness | [arXiv 2501.12948](https://arxiv.org/abs/2501.12948) |
| DeepSeek (GRPO, 2024) | The optimiser: no critic, each sample judged against its group | Any | [arXiv 2402.03300](https://arxiv.org/abs/2402.03300) |
| Ai2 (Tülu 3, 2024) | SFT, then DPO, then RLVR | Automatic correctness checks | [arXiv 2411.15124](https://arxiv.org/abs/2411.15124) |
| TypeSafe (Jev, 2026) | RLCD, with a new architecture and sampler | Not stated; the objective is honest probabilities | [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev) |
| CMU and others (2026) | One trainer mixing all stages | Binary checks | [arXiv 2610.40564](https://arxiv.org/abs/2610.40564) |

DeepSeek's reason for avoiding neural reward models on reasoning tasks matters most for us: they "are prone to reward hacking" in large-scale RL. A rule check cannot be flattered that way. Thinking Machines' Tinker sells fine-tuning as a service, including RL. It is a candidate supplier if we ever train, though I did not open its RL documentation this session.

## Our candidate pipelines (not locked)

Every candidate is fed by the check-outcome log you approved. They differ in what they train and when they become possible.

| Pipeline | What it trains | Reward | Engine class | Needs first |
| --- | --- | --- | --- | --- |
| P0: learn from the log | Nothing yet: offline analysis of which proposals pass | Past check outcomes | Offline RL, RLVR | The check-outcome log (decided 04:49Z) |
| P1: checks as rewards | A model that proposes records our checks accept | Pass or fail from theorems, term tests and schema rules | RLVR with GRPO | P0 volume; a supplier to train on (for example Tinker) |
| P2: calibrated decisions | A Jev-like decision model for routing, gates and docket ranking | A proper scoring rule (Brier) on the stated probability against the check outcome | RLVR, GRPO, scoring rule | Proposals that state a confidence (the log's `confidence` field) |
| P3: founder preferences | Drafts that founders choose | Which option a founder picked on a decision card | DPO (not RL by the engine's definition) | Many decision cards with recorded options |
| P4: per-step checks | Agents whose every step passes, not just the outcome | A check on each step of an agent trace | RLVR with process reward | Step-level checks over LangSmith traces |

Two engine findings shape the order:

- **DPO is not reinforcement learning.** Its definition has no reward-raising update. P3 is preference learning, so it should not sit under an RL heading in our records.
- **P2 is P1 plus one fact:** the reward is a proper scoring rule, under which stated odds score best when they are honest. That is the only engine-visible difference between "right answers" and "calibrated decisions". It matches TypeSafe's stated objective, but TypeSafe has not published its reward, so P2 is our design, not a copy of RLCD.

A suggested order, not decided: P0 now (already approved), then P1 and P2 together once the log holds enough outcomes. P4 comes once agents run per function, and P3 only after many cards. A sixth path is to buy instead of train: use Jev itself for P2-type decisions until we have the data.

## Records-gated generation

The rule: an output of a given type is generated only when the records it needs exist. If they are missing, research is triggered instead. The research is logged as a trace, and every fetch is cached as a reference. Nothing found by research becomes a record unless the update theorem admits it.

The update theorem, as built in `gate.ts`:

1. **U1, cache always.** Every search or fetch writes a cache entry keyed by its query or URL, including failed ones.
2. **U2, reuse.** A cached exchange for the same query or URL answers without fetching again. The second run here reused 9.
3. **U3, admit only what was read.** A claim becomes a record only if its source was opened (not a search snippet), is not an index such as Wikipedia, and the claim carries a locator. Anything else stays a reference, and the gate stays closed for outputs that need it.
4. **U4, contested values.** A claim that disagrees with an existing cell makes the cell contested; it does not overwrite. This one is designed but not built.
5. **U5, freshness.** A cached exchange expires after a time set per kind of claim, such as prices sooner than definitions. This is also designed, not built.

**What happened on this doc:**

| Run | Edges drawn | Edges gated | Research triggered for | Cache |
| --- | --- | --- | --- | --- |
| First | 12 of 36 | 24 | reinforcement learning, PPO, offline RL, imitation learning | 9 entries written |
| Second, after research | 19 of 36 | 17 | reinforcement learning | 9 hits, 4 new entries |

Imitation learning opened without a new fetch: the InstructGPT abstract was already cached, and it describes the demonstration step. PPO and offline RL opened from fetched abstracts. The root term "reinforcement learning" stays gated: Sutton and Barto's site returned 503, the MIT Press page refused the fetch, and Wikipedia is an index. Its definition therefore isn't a record yet, and 17 edges wait on it. Those failures are cached too, so nothing retries them blindly.

## Sources, cache and files

Pages opened: [InstructGPT](https://arxiv.org/abs/2203.02155), [Constitutional AI](https://arxiv.org/abs/2212.08073), [DPO](https://arxiv.org/abs/2305.18290), [DeepSeekMath (GRPO)](https://arxiv.org/html/2402.03300), [DeepSeek-R1](https://arxiv.org/html/2501.12948), [Tülu 3](https://arxiv.org/abs/2411.15124), [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050), [PPO](https://arxiv.org/abs/1707.06347), [Offline RL tutorial](https://arxiv.org/abs/2005.01643), [TypeSafe Jev launch](https://typesafe.ai/blog/introducing-system-one-models-and-jev), and [Wikipedia: Reinforcement learning](https://en.wikipedia.org/wiki/Reinforcement_learning), used as an index only. Two fetches failed and are cached as failed: Sutton and Barto's book page (503) and MIT Press (403).

Files:

- `naive-design/prototypes/architecture/rl-vocab.ts` holds the terms, and writes `rl-graph.json`, the 36 edges.
- `gate.ts` holds the gate and the update theorem, and writes `gate-run.json` with the research events.
- `RL.lean` is the Lean mirror; the phases thread builds it.
- The search cache is `mentura/research/references/search-cache/`, with 13 entries.
