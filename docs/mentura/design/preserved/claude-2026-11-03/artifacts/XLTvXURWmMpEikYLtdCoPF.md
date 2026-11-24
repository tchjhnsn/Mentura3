<!-- exported 2026-11-03 from https://claude.ai/artifact/XLTvXURWmMpEikYLtdCoPF (Claude Docs id f5a9e21b-21a6-4cef-a798-b747ba41e39a) -->
# AI research areas, the stack, and where we land

Nov 1, 2026 · @Torian

Our candidate place is not at the model layer. It sits on four research areas: knowledge representation and reasoning, logic and formal verification, neuro-symbolic integration, and human-computer interaction. In the stack, it is a system-of-record layer that models and agents reach through protocols such as MCP. This is a candidate, not a lock: the last section lists what to research first.

The map has three parts:

- **Graph 1** places our work on the field's research areas. It uses arXiv's categories as an outside anchor, plus areas arXiv has no category for.
- **Graph 2** places the labs on those areas, with each placement's evidence.
- **The stack section** shows how other platforms' layers would interact with ours.

The System 1 / System 2 section corrects one point. A base language model is closer to System 1. Only reasoning models move toward System 2, and even that is an analogy.

## Graph 1: areas of AI research

&#91;embedded content: AI research areas · 25 areas in 6 families, our 5 candidates marked\]

The areas follow arXiv's computer-science categories, so the map is anchored outside our own vocabulary. Eight areas have no arXiv category: reinforcement learning, generative media, neuro-symbolic integration, agents, world models, decision models, alignment and interpretability. Those come from surveys and from how the labs describe their own work. The five marked areas are where our records, theorems, research engine and workbench sit. None of them is model training.

## Graph 2: who builds in which area

&#91;embedded content: Labs by research area · 9 ventures plus our candidate row\]

The labs cluster on language, agents and world models. Our five candidate columns hold nobody else, except Thinking Machines, which may sit on human-computer interaction through its interaction models (inferred, not yet sourced). The empty columns only show what we checked. Each placement is a `belongs-to` record with its basis, and every share is unknown. A lab with no dot in an area may still work there; Anthropic's and OpenAI's research pages have not been read for this map.

## The stack and how its layers interact

No standards body defines the AI stack's layers; the layering below is the convention vendors use. The interfaces between layers are becoming standards, and that is where our layer would meet theirs.

| Layer | What it does | Who builds there (examples) | How it meets the next layer |
| --- | --- | --- | --- |
| Compute | Chips, data centres, training clusters | NVIDIA; SpaceXAI's Colossus 2 | Cloud capacity, rented or owned |
| Model training | Pre-training, fine-tuning, reinforcement learning | Anthropic, OpenAI, SpaceXAI; Thinking Machines' Tinker for fine-tuning | Weights |
| Models | Language, reasoning, decision, embedding and world models | Claude, GPT, Grok, Jev, Inkling, Cosmos, Genie 3 | A model API, or open weights |
| Agent runtime | Loops a model through tools and memory | Claude Code, Codex, Grok Bot | Tool calls |
| Protocols | Agent to tool or data: MCP. Agent to agent: A2A. Repo instructions for agents: AGENTS.md | MCP (Anthropic), A2A (Google), AGENTS.md (OpenAI) | Open specifications |
| Systems of record | Hold what counts as true, with sources and dates | Ours, as a candidate | Exposed to agents as an MCP server |
| Applications and workbenches | What a person works through | ChatGPT, Claude apps, Cowork; our workbench | People |

**Who governs the interfaces.** Anthropic donated MCP to the [Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) on 2025-12-09. The foundation is a Linux Foundation fund co-founded by Anthropic, Block and OpenAI. Block contributed goose and OpenAI contributed AGENTS.md. Google gave A2A to the Linux Foundation in June 2025 ([The New Stack](https://thenewstack.io/google-donates-the-agent2agent-protocol-to-the-linux-foundation/)). One report says A2A moved under the Agentic AI Foundation in August 2026; that date is not confirmed.

**What this means for us.** Other platforms would reach our layer in three ways:

- **Their models and agents read our records** through an MCP server. A write would be a proposal that our symbolic checks accept or refuse.
- **Their models serve as proposers** inside our research engine (Kautz Type 2), called through their APIs.
- **Their agents talk to ours over A2A**, if we run agents of our own.

The rule from the last doc carries over: no neural write edge to a record store except through a symbolic check. That holds whoever owns the model.

## System 1 and System 2: Jev, language models, the brain

The research does not support "a language model is a System 2 model" without qualification. The 2025 survey [From System 1 to System 2](https://arxiv.org/abs/2502.17419) calls base language models fast, System-1-like predictors. Reasoning models (OpenAI o1, DeepSeek-R1) move toward System 2 by spending more computation before answering.

| Piece | Fast and automatic (System 1 analogue) | Slow and deliberate (System 2 analogue) |
| --- | --- | --- |
| [Jev (TypeSafe)](https://typesafe.ai/manifesto) | Yes: one typed decision with a calibrated probability, read by code | No |
| Base language model | Yes: next-token prediction in one pass | No |
| Reasoning model | Partly | Yes, by analogy: it writes out steps before answering |
| Embedding model | Yes: one vector per item | No |
| Term engine, theorems, Lean | No | Yes, in its checking role: slow, explicit and checkable |

**What kind of model Jev is.** In machine-learning terms, Jev is a discriminative decision model, not a generative one. It maps an input to one of a fixed set of typed outcomes with an honest probability. Our approach glossary already holds this as `system-one-model`, a kind of neural system that is disjoint from `assistant-model`. Jev and a language model are complements: one decides fast, the other drafts and reasons in text.

**The brain.** Two cautions apply before we lean on the brain as a model.

- Kahneman himself warned against reading System 1 and System 2 as parts of the brain. They are a description of two modes of thinking.
- Whether the brain manipulates symbols is contested. Marcus ([The Algebraic Mind](https://mitpress.mit.edu/9780262632683/the-algebraic-mind/), 2001) argues it does; connectionists argue symbols emerge from neural activity.

So "the brain is neuro-symbolic" is a hypothesis, not a premise we can build on.

**Where neuro-symbolic fits.** Neuro-symbolic is not a layer of the stack. It is a way of composing neural and symbolic parts, and the composition can happen at any layer. Henry Kautz's six-type taxonomy (AAAI 2020, [summary](https://neonvagabond.xyz/mirrors/neuro-symbolic-types.html)) names the compositions. Three of them matter here:

- **Type 2, Symbolic\[Neuro\].** A symbolic solver calls a model as a subroutine. AlphaGo is the example: tree search with a neural evaluator.
- **Type 3, Neuro;Symbolic.** A neural part and a symbolic part run in a pipeline and pass results to each other.
- **Type 6, Neuro\[Symbolic\].** A neural system calls a symbolic engine when it needs one. An assistant using a calculator or a theorem prover through a tool is this type. Kautz ties it to Kahneman, and it is the type he rated most promising. This one comes from a search summary, not an opened page, so check it before citing.

Our records-first design is Type 3, and Type 2 when the research engine calls a model. In both, the symbolic part decides. Type 6 is the reverse: the model is in charge and uses symbols as tools. The question that separates us from the labs is who decides, not whether both parts are present.

## Where we land, and what to research before locking it

The candidate: we work on five areas, none of them model training.

- **Knowledge representation and reasoning:** the knowledge graph of record.
- **Logic and formal verification:** the term engine and the Lean theorems.
- **Neuro-symbolic integration:** Kautz Type 3, and Type 2 in the research engine.
- **Human-computer interaction:** the workbench and decision cards.
- **Information retrieval:** the research engine.

In the stack, we are the system-of-record layer plus one workbench. We are not at the compute, model or agent-runtime layers. These are stored as candidate memberships with evidence `assumed`, so nothing is locked.

What to research before locking it:

- [ ] **The neighbours in the system-of-record layer.** Who else holds typed, sourced, dated records for agents? Candidates are enterprise ontologies and knowledge-graph databases. None has been studied yet.
- [ ] **"Decision intelligence" as a named field.** Is it a research area or an analyst category? It may be the closest outside name for what we do.
- [ ] **Formal verification for AI.** Which labs use Lean or other provers with models, and in which Kautz type?
- [ ] **MCP's write path.** Can an MCP server hold a write as a proposal pending a symbolic check, or does that need our own layer on top?
- [ ] **A2A.** Confirm its current home, and whether we would run agents of our own at all.
- [ ] **Placements marked inferred** in Graph 2. Open a primary page for each before it counts.

The term engine settled one definition this session: model kinds, 13/13 predictions confirmed. A decision model (Jev) is provably disjoint from a language model, a reasoning model is a kind of language model, and a world model can overlap a decision model. The Lean file has gone to the phases thread to build.

## Records added on 2026-11-01 (04:25Z)

The engine separated two claims that the first map ran together. A venture can **research** an area: it builds models or methods there. Separately, one of its products can **offer a capability**, either with its own model or with a supplier's. Claude's voice mode is the example. Anthropic offers speech, but ElevenLabs is its text-to-speech subcontractor ([The Decoder](https://the-decoder.com/anthropics-claude-uses-elevenlabs-technology-for-speech-features-rather-than-an-in-house-model/)). So the record says "supplied capability", not "researches speech".

| Record | Level | What it holds | Example |
| --- | --- | --- | --- |
| `researches` | Venture | Builds models or methods in an area | ElevenLabs: speech (own ASR, TTS, turn-taking models) |
| `has-capability` | Product | What the product does, and whether by its own model or a supplier's | Claude apps: voice mode, text-to-speech supplied by ElevenLabs |
| `safety-commitment` | Venture or product | A company policy, or a safeguard on one product | Anthropic: the Responsible Scaling Policy (venture); system cards (product, not yet read) |
| `supplies` | Between ventures | One venture's model or service inside another's product | ElevenLabs supplies Anthropic (TTS); Anthropic supplies ElevenLabs (Claude is selectable in [ElevenAgents](https://elevenlabs.io/docs/pt/eleven-agents/customization/llm.md)) |

No source says ElevenLabs fine-tunes Claude. Its agents let the customer pick Claude, GPT, Gemini, open-weight models or a custom endpoint, and ElevenLabs supplies its own speech models around that choice ([overview](https://elevenlabs.io/docs/eleven-agents/overview)).

**Our placement, updated.** Multi-agent systems moves into the candidate set: the logic of which agent role may act without whose approval, and which records a handoff needs. Agents and tool use is a supplied capability: we offer agents as a venture's early employees, but we run them on others' runtimes, which are a tooling dependency. Reinforcement learning and decision models are interests only. Polity's observer is also Kautz Type 3. All of this is in `research-areas/self.json`.

**The paper Torian sent** is [Training Foundation Models with a Single Algorithm](https://arxiv.org/abs/2610.40564) (CMU, JHU, Aurora Innovation; 2026-10-29). It recasts the RL stages as maximum likelihood on model-generated targets, so one trainer mixes static data and RL samples. Its rewards are binary and checked, such as puzzle answers and code tests. That is where it meets our work: a symbolic check can serve as a reward. It does not mention TypeSafe or calibration. The X threads add caveats: the experiments are small (up to 0.76B parameters), and critics argue the stages differ in time scale and infrastructure for good reason. Calibration appears nowhere, and neither does TypeSafe. One untested reading: over a closed set of options with pass/fail checks, the method's target becomes each option's pass probability, which is close to a calibrated typed decision like Jev's.

## Suppliers, competitors, and records that trigger actions (04:45Z)

**The relationship has a name.** A company you pay for something you use to make your own product is your **supplier**; procurement calls it a **vendor**. Anthropic, SpaceXAI (Cursor, Grokbot), TypeSafe and LangChain are our tooling suppliers. ElevenLabs is Anthropic's **sub-processor**: a supplier that handles personal data for it. The engine confirms that being a supplier proves nothing about competing, because a company can be both. Co-opetition is the term for that.

**Not a competitor has to be proven on both sides of the value net.** First, no product of theirs may do the same job for the same customers as one of ours. Second, we may not draw on the same scarce input. A first run on draft job and segment tags:

| Supplier | Same job, same customers? | Same scarce input? | Not a competitor? |
| --- | --- | --- | --- |
| Anthropic | Yes: Cowork does research and drafting for knowledge workers, which include founders; Claude Code builds code, as our builder agents will | Unknown | Not proven |
| SpaceXAI | Yes for Cursor (building code); Grokbot has no product record | Unknown | Not proven |
| TypeSafe | No overlap on the draft tags | Unknown | Not proven |
| LangChain | No overlap on the draft tags | Unknown | Not proven |

So today we cannot claim any of them is not a competitor. Anthropic and Cursor partly overlap our agents' jobs. For TypeSafe and LangChain, the gaps are the supply side and the tags. The tags are our own guesses, not glossary terms.

**Jev's training, corrected.** TypeSafe's [launch post](https://typesafe.ai/blog/introducing-system-one-models-and-jev) names the method (RLCD, Reinforcement Learning for Calibrated Decisions) and its objective: answers with honest probabilities. It does not give the reward or loss, the data, the base model or a calibration metric. Its FAQ lists those questions without answers. Outputs are typed and limited to 255 options. Input costs $0.042 per million tokens and output is free. Speed and cost claims are vendor-reported, and no public benchmarks are given.

**Records trigger actions.** Here is the premise as an architecture:

1. A conversation is triaged into a record.
2. The record write is an event in the append-only provenance log.
3. Rules subscribe to events and start the next transactions, including agents assigned to a function.
4. An agent's output is a proposal. A symbolic check accepts or refuses it, and an accepted proposal is a new record, so the loop continues.
5. Every step carries provenance. LangSmith holds the traces and evaluators.

Two things follow from the paper. A check's pass or fail is a verifiable reward, so logging every check outcome with its proposal builds the data that reinforcement learning or a Jev-style decision model would need later. Where the rules live is also a decision: in our records, where they can be proven, or in LangSmith automations, a supplier's tool.

## Sources and records

Pages opened:

- [arXiv category taxonomy](https://arxiv.org/category_taxonomy)
- [From System 1 to System 2: A Survey of Reasoning LLMs](https://arxiv.org/abs/2502.17419)
- [TypeSafe manifesto](https://typesafe.ai/manifesto) and [Latent Space on Jev](https://www.latent.space/p/jev)
- [Kautz's neuro-symbolic types (summary)](https://neonvagabond.xyz/mirrors/neuro-symbolic-types.html)
- [Anthropic: donating MCP, Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)

From search results only:

- [The New Stack on A2A](https://thenewstack.io/google-donates-the-agent2agent-protocol-to-the-linux-foundation/)
- Lab placements marked "reporting" in the records

Records written, in Mentura's research folder (not in a repo):

- `research/research-areas/areas.json`: 25 areas, each with its arXiv category or an unknown cell.
- `research/research-areas/memberships.json`: 24 lab memberships plus 5 candidate memberships for us. Every share is unknown, because there is no basis for one yet.

Term run: `model-vocab.ts` and `Model.lean` in the architecture prototypes folder.
