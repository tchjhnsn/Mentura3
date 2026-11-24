<!-- exported 2026-11-03 from https://claude.ai/artifact/MgZcTJsPe7pfwAksuh1Lxs (Claude Docs id a77ce0ac-e5fc-419a-a46c-2ddf54e12654) -->
# From idea to identity: needs, suppliers, and how functions talk

Nov 1, 2026 · @Torian · Proposed

## Summary

Precog is the product. Its parts are named fields, and each is now a glossary term run through the engine: forecast, anticipatory system, proactive agent, selective prediction, calibration, conformal prediction, value of information, multi-objective optimization, Pareto set, demand sensing, and horizon scanning. Precog as specified passes nine of the eleven. It does not yet pass conformal prediction, and demand sensing is not its job.

The pipeline runs **idea → identity → shaped identity → ready for its next phase → instance**. An idea becomes an identity once three things are stated and fixed as what must stay the same: its purpose, its distinguishing properties, and the function it belongs to. It becomes shaped once its goals are stated and its needs, requirements and constraints are derived. Lean proves that nothing reaches its next phase without its constraints derived (built clean).

"Identity" does not come from the root of "idea": *identity* is from Latin *idem*, "the same", and *idea* is from Greek *idea*, "form, pattern". The pipeline still holds, and the real root makes it sharper. An identity is what must stay the same while everything else about the thing changes phase.

Worked example: the RL environment need. Of four candidates, Prime Intellect's open-source verifiers stack ranks first, at 31 of 34, under constraints and weights the agent proposed. Mechanize fails two constraints. Then finance reads engineering's record and sends six typed questions before running its own cost research. That is the layer you identified: **functions talk by inquiry, and each researches into its own records only.** Lean proves that informed research never writes another function's records.

## Idea and identity: the etymology, checked

| Word | Root | Source |
| --- | --- | --- |
| idea | Ancient Greek *idea*, "notion, pattern", from a root meaning "to see, to know" | [Wiktionary: idea](https://en.wiktionary.org/wiki/idea) |
| identity | Late Latin *identitas*, from Latin *idem*, "the same" | [Wiktionary: identity](https://en.wiktionary.org/wiki/identity) |

They are different roots, so the pipeline is not in the word. Etymonline refused the fetch (403), and Wiktionary is an index source, so by our update theorem this stays held until a dictionary such as the OED is read. The two Wiktionary entries do agree.

The roots still describe the pipeline, and better than a shared root would.

- An **idea** is a form someone has seen: "we should hire someone".
- An **identity** is what must stay *the same* about that thing as it changes phase: the role is still engineering, and the person must still handle a high-pressure, fast-changing environment, through the job post, the lead search, the interviews and the hire.
- Turning an idea into an identity means deciding which properties are fixed. Everything not fixed is free to change.

This matches the `identity/` folder that replaces `foundation/`, which the phases thread owns. I've asked that thread to check this definition doesn't clash with theirs.

## The pipeline from idea to instance

Each stage is a glossary term with tests, and each stage is a kind of the one before it. Run file: `identity-vocab.ts`, 8 of 8 predictions over all 2,048 cases.

| Stage | Passes when | Hire example |
| --- | --- | --- |
| **idea** | stated, with no identity yet | "We need to hire someone." |
| **identity** | its purpose is stated; its distinguishing properties are stated and fixed as what must persist; it belongs to a venture function | An engineer, in the engineering function. Roles: builds the records engine. Personality: performs in a high-pressure, fast-changing environment. |
| **shaped identity** | identity, plus goals stated and needs, requirements and constraints derived | Goal: first hire before the Beachhead phase. Need: nobody owns build. Requirement: has shipped TypeScript in production. Constraint: salary within budget; US-based for payroll. |
| **ready for its next phase** | shaped, with a next phase assigned | Post the job. Search existing leads for a match. Outreach: email, social, calls. |
| **instance** | identity, and something real matches it | A lead who matches. |

The phases thread checked this against our phases records, and two fixes came out of it.

- **Purpose, not ambitions, is identity.** Goals and ambitions are the contingent why and may change, so they enter at the shaped stage. This matches R-02.
- **The thing *belongs to* a function; it is not one.** This matches R-08 and R-11.

### What the agent always looks for

Whenever someone states something, the agent reads it for each stage's missing parts and asks for them in order:

1. Is this an idea, an identity, or a need of an existing identity?
2. If it is an idea: what is its purpose, what about it must stay the same, and which function does it belong to?
3. If it is an identity: what are its goals? From those, derive the needs (gaps toward each goal), the requirements (what must be verifiably true) and the constraints (what narrows the solutions).
4. Which of those needs are **supplier needs**? Each one triggers a supplier search.
5. What is the next phase, and which agents does it start?

The Lean mirror proves two things: an idea is never an identity, and nothing is ready for its next phase until its constraints are derived. The proofs built clean before the purpose/goals fix; the rebuild after the fix is with the phases thread now.

## Precog's parts in the glossary

Precog is the product name, not a glossary term. Its parts are terms, defined over what a decision-support system does. Run file: `identity-vocab.ts`, 19 of 19 predictions over all 16,384 cases.

| Term | Passes when | Relation found | Source |
| --- | --- | --- | --- |
| forecast | predicts a future state | parent of anticipatory system and demand sensing | general usage |
| anticipatory system | forecasts, and acts now on the forecast | is a forecast | Rosen 1985 (not opened) |
| proactive agent | anticipatory, and acts unprompted | is an anticipatory system | [Lu et al. 2024](https://arxiv.org/abs/2410.12361) |
| selective prediction | can abstain, and states a confidence | overlaps calibration and conformal | [Geifman and El-Yaniv 2017](https://arxiv.org/abs/1705.08500) |
| calibration | stated confidence matches observed frequency | overlaps selective prediction | Brier 1950 (not opened) |
| conformal prediction | outputs a set with guaranteed coverage | overlaps Pareto set (both output sets) | [Angelopoulos and Bates 2021](https://arxiv.org/abs/2107.07511) |
| value of information | estimates what information is worth before deciding | overlaps proactive agent | Howard 1966 (index only) |
| multi-objective optimization | scores options on several objectives | parent of Pareto set | [Hayes et al. 2022](https://arxiv.org/abs/2103.09568) |
| Pareto set | only options that nothing beats on every objective | is multi-objective | Hayes et al. 2022 |
| demand sensing | forecasts demand from recent signals | is a forecast | supply-chain usage (not opened) |
| horizon scanning | searches broadly for early signs of change | overlaps forecast; it need not forecast | foresight usage (not opened) |

**Precog as specified passes nine:** forecast, anticipatory system, proactive agent, selective prediction, calibration, value of information, multi-objective, Pareto set, and horizon scanning. It does not pass conformal prediction, because the coverage guarantee is designed but not built. Demand sensing belongs to a supplier's market, not to ours.

All terms are admitted as `proposed` and kept private, off Grok's term list.

## Worked example: RL environment suppliers, weighted

The RL work surfaced a supplier need: an environment that turns our records and checks into rollouts and rewards for training a language model. It belongs to the engineering function. There is lead time, because we decided at 04:49Z to log outcomes now and train later, so this is research and nothing gets bought now.

**Constraints are filters.** A candidate that fails one is out, whatever its score.

- K1: records and check outcomes never leave infrastructure we control.
- K2: the license allows use in a closed product.
- K3: the cost fits a pre-revenue budget. The budget itself is **unknown**, because no budget record exists. Finance has to set it.

**Requirements are weighted.** The agent proposed these weights; the engineering owner sets the real ones.

| Requirement | Weight |
| --- | --- |
| R1 rewards are our own symbolic checks | 5 |
| R2 built for language-model agents | 4 |
| R3 plugs into an RL trainer (GRPO) | 3 |
| R4 a solo founder can stand it up in days | 3 |
| R5 maintained, with a community | 2 |

Each candidate scores 0 to 2 per requirement, from the evidence cited.

| Candidate | Constraints | Score (of 34) | Evidence |
| --- | --- | --- | --- |
| **Prime Intellect verifiers, Environments Hub, prime-rl** | pass | **31** | an environment is a dataset, a harness and reward functions; MIT license; integrated with prime-rl and optional hosted training ([docs](https://docs.primeintellect.ai/tutorials-environments/environments), [repo](https://github.com/PrimeIntellect-ai/verifiers)) |
| Farama Gymnasium | pass | 20 | MIT; a standard reset/step API, with no language-model support stated ([repo](https://github.com/Farama-Foundation/Gymnasium)) |
| Build our own on the check-outcome log | pass | 18 | fits every constraint, but we would write the trainer glue, and it takes weeks |
| Mechanize | **fails K1 and K3** | 13 | bespoke environments for frontier coding agents ([site](https://mechanize.work)). Epoch reports contracts of $300k–$500k and $200–$2,000 per task ([Epoch AI, 2026-01-12](https://epoch.ai/gradient-updates/state-of-rl-envs)) |

Not assessed one by one: Bespoke Labs, Idler, Mercor, Surge, Handshake and Turing. They sell to frontier labs with contact-only pricing, so they hit the same K1 and K3 problems as Mechanize.

**Result (proposed).** Prime Intellect's open-source stack fits best on what we know now. Two cautions:

- The ranking moves if K3 gets a number, or if the weights change.
- Prime Intellect also trains its own models (INTELLECT-3). The competitor check is not run, so it is a supplier with competition not established.

The records are in `research/supplier-searches/rl-environment/`: identity.json, candidates/, and ranking.json.

## How functions talk: finance asks engineering

This is the layer you identified. The proposal: functions talk the way services in software talk, through declared interfaces and never by reaching into each other's data.

1. **Every record has one owning function.** The ranking of RL environments belongs to engineering.
2. **A record write is an event** in the append-only provenance log. This part is already designed.
3. **Functions declare interests.**
   - Finance subscribes to supplier rankings and to identities about to hire.
   - Legal subscribes to license and data-processing constraints.
   - People subscribes to hire identities.
4. **A matching event becomes an inquiry.** The asker sends typed questions from its own question bank, citing the owner's record.
5. **The owner answers in its own records.** Owners are humans; agents draft the answers.
6. **The asker's research waits for the answers it needs.** That is value of information: don't price compute before knowing which product and how much of it. The research then writes only to the asker's records, citing the owner's.

The engine calls step 6 **informed research** and the forbidden opposite a **cross-write**. Lean proves the two never meet.

### The inquiry finance sent

It fired when engineering wrote `ranking.json`, not when an invoice arrived. That is the proactive part.

|  | Finance asks engineering | Why finance needs it | Answer now |
| --- | --- | --- | --- |
| Q1 | Library only, the Hub, or Hosted Training? | decides whether there is a vendor bill at all | unknown |
| Q2 | Your own compute or a GPU provider? Which one? | the library is free; compute is the cost | unknown |
| Q3 | Base model and size? | GPU type and hours scale with it | unknown |
| Q4 | Rollouts per run, runs per month? | compute is priced by use | unknown |
| Q5 | Which phase does training start in? | when the cost lands against runway | after the check-outcome log has volume |
| Q6 | Any environment needing exclusivity? | Epoch reports exclusive deals cost about 4–5x | no |

Finance's own research, pricing GPU compute for those answers, is **gated** until Q1–Q4 have answers. Record: `finance-inquiry.json`.

### What this is called elsewhere

From memory, not opened this session:

- **Procurement:** a department raises a requisition, procurement sources it, and finance models total cost of ownership (procure-to-pay, source-to-pay).
- **Management:** a responsibility matrix such as RACI.
- **Software:** publish–subscribe and service interfaces.

Our version differs in two ways. Every message is a record with provenance. And the asker's research is gated on the owner's answers.

A proposed name for what each function publishes (the records it owns, the events it emits, and the questions it answers) is **function interface**. It is not yet run through the engine.

## Status, open questions, files

**Built and checked**

- `identity-vocab.ts`: 19 terms at three levels. Results: 19/19 on 16,384 cases, 8/8 on 2,048, and 4/4 on 256.
- `Identity.lean`: built clean by the phases thread, with no `sorry`. It covers the pipeline and the function-exchange levels; the capability level has no Lean yet.
- The terms are admitted as `proposed`, private, and off Grok's list. The definitions agree with the phases records after the purpose and home-function fixes.
- The supplier search records: the RL environment identity, four candidates and a ranking.
- Finance's inquiry, with its research gated.
- Ten exchanges cached through the update theorem: five admitted, three held, and two searches with no claims.

**Proposed, not built**

- The interest rules that turn record events into inquiries.
- Each function's question bank.
- The function interface.
- The agent loop that reads every statement for its stage's missing parts.

**Open questions**

- The budget record (K3) does not exist, so the RL ranking cannot finish.
- The weights are the agent's; the engineering owner should set them.
- The competitor check on Prime Intellect is not run.
- The etymology is held until a dictionary is read.

**Files**

- Run files: `/mnt/project-files/naive-design/prototypes/architecture/identity-vocab.ts` and `Identity.lean`.
- Records: `/mnt/project-files/mentura-discovery/mentura/research/supplier-searches/rl-environment/`.
