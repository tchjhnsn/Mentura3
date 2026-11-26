<!-- Placement: proposed for tchjhnsn/Mentura3 docs/mentura/research/AGENT_MEMORY_DOMAIN_NAME_2026-11-24.md. Personal account identifiers and local file paths were removed. Mentura3 is public. -->

# Shared memory layers: what the domain is called

Research date: November 24, 2026 (America/Chicago).

## (a) Name of the research domain

The standard name is **agent memory**, also written as **memory for LLM-based agents** or **the memory mechanism of LLM-based agents**.

"Shared memory layer" is a useful informal phrase on X and in product marketing. It usually means a persistent store that multiple agents or tools can read and write, so context is not rebuilt in every session. It is **not** the established academic name of the field. In the literature, "shared memory" is one *topology* inside agent memory (as opposed to per-agent local memory, or a hybrid of the two).

### Primary name, with citations actually checked

- **Agent memory / memory mechanism of LLM-based agents**
  - Zeyu Zhang et al., *A Survey on the Memory Mechanism of Large Language Model based Agents*, arXiv:2404.13501 (21 Apr 2024); later ACM Transactions on Information Systems, https://doi.org/10.1145/3748302. Paper: https://arxiv.org/abs/2404.13501. Companion repo: https://github.com/nuster1128/LLM_Agent_Memory_Survey.
  - *Memory in the Age of AI Agents: A Survey* (forms, functions, and dynamics), arXiv:2512.13564, https://arxiv.org/abs/2512.13564. This survey uses "agent memory" as the umbrella, distinguishes it from LLM memory, RAG, and context engineering, and lists **shared memory for multi-agent systems** as a research frontier.

### Close synonyms (same neighborhood, slightly different emphasis)

- **Agentic memory** — industry and some papers use this for long-term, cross-session memory modules (Mem0-class systems, “agentic memory vs naive RAG”).
- **Multi-agent memory / shared memory in LLM-based multi-agent systems** — the cross-agent case. A Springer chapter, *Memory in LLM-Based Multi-agent Systems: Mechanisms, Challenges, and Collective Intelligence*, defines shared memory as a common repository (vector DB, knowledge graph, or document) readable and writable by multiple agents, and contrasts local, shared, and hybrid topologies. https://doi.org/10.1007/978-981-92-1468-6_10
- **Agent memory layer** — used in systems/architecture papers for the persistent retrieval tier in a hierarchy (I/O, cache, memory), not as the name of the whole field. See *Multi-Agent Memory from a Computer Architecture Perspective: Visions and Challenges Ahead*, arXiv:2603.10062, https://arxiv.org/abs/2603.10062 (HTML: https://arxiv.org/html/2603.10062v2).
- Cognitive labels used inside the field: **episodic, semantic, procedural, working, and long-term memory**.

### Adjacent fields (related, not the same)

- **Context engineering** — curating what tokens go into the context window (instructions, tools, history, retrieved memory). Anthropic treats this as a successor to prompt engineering: https://www.anthropic.com/research/effective-context-engineering-for-ai-agents. LangChain's write/select/compress/isolate framing: https://www.langchain.com/blog/context-engineering-for-agents. The 2512.13564 survey explicitly says agent memory is distinct from context engineering.
- **RAG / retrieval-augmented generation** — a retrieval substrate often used to *implement* memory; also distinct in that survey. A bookmarked post points at work arguing naive RAG over raw chat history can beat complex agentic memory on long-term memory benchmarks: *Is Complex Agentic Memory Always Needed? Naive RAG Is Stronger Than We Thought*, arXiv:2610.30755, https://arxiv.org/abs/2610.30755.
- Classical **distributed shared memory** (systems) and **blackboard architectures** (classical AI). These showed up in a few X posts in a non-agent sense (for example DeRAM as a “decentralized shared memory layer” for distributed nodes). Worth knowing as ancestry, not as the current LLM-agent literature’s name.

A nearby but narrower research framing is a “shared organizational cortex”: Andrew Cook, *Toward a Compositional Knowledge Architecture for a Shared Organizational Cortex*, arXiv:2611.05753, https://arxiv.org/abs/2611.05753. It argues that retrieval, knowledge graphs, and agent memory “keep the records and lose the interpretation.” That is one paper’s architecture, not the field’s name.

## (b) Matching bookmarks

Unique bookmarked posts examined: **591** (live newest ~198, additional older live pages, plus a Nov 7, 2026 cache of 200 and an earlier 198-post dump, overlaps removed). `max_results=100` sometimes omitted a pagination token, so a mid-list slice may be incomplete; the Nov 7 cache covers much of that older region as it stood then. No further memory hits appeared in the mid 99 or the older 98.

**7 matching bookmarks:**

1. [@dair_ai](https://x.com/dair_ai/status/2124510548070895895) — Nov 22, 2026, 8:29 AM CST. Weekly paper roundup led by **Self-Improvement Memory (SIM)** from Google Cloud AI, Google DeepMind, and Penn State: a harness optimizer that stores rationales and outcomes of past edits as procedural/self-improvement memory. 611 likes, 1,047 bookmarks. (In the live newest bookmarks.)
2. [@omarsar0](https://x.com/omarsar0/status/2118838318180037041) (elvis) — Nov 6, 2026, 4:49 PM CST. “Learn how one of the most advanced **agent memory systems** works.” Argues memory is a main harness lever, no one-size-fits-all system exists, and a mix of simple folders/files plus **episodic memory** works best with frontier models. Quotes an Anthropic post. 574 likes, 819 bookmarks.
3. [@dair_ai](https://x.com/dair_ai/status/2116548002617917603) — Oct 31, 2026, 10:09 AM CDT. “Brilliant paper on **agent memory** from FAIR at Meta.” A single global history helps almost nothing on interleaved tasks (+0.015 normalized reward). This is Meta FAIR’s *Routed Continual Learning*, arXiv:2610.38796, https://arxiv.org/abs/2610.38796. 255 likes, 303 bookmarks.
4. [@omarsar0](https://x.com/omarsar0/status/2113635562578178147) — Oct 23, 2026, 9:16 AM CDT. “Plain RAG over raw chat history beats complex **agentic memory** systems on most **long-term memory** benchmarks” (Raw-RAG). Names Mem0, MemOS, and Memora as slower baselines, and says: “Before adding a memory layer to your agent, at least run this baseline on your own data.” Paper: arXiv:2610.30755, https://arxiv.org/abs/2610.30755. 971 likes, 1,009 bookmarks.
5. [@Dakshay](https://x.com/Dakshay/status/2045930755759718577) (Dakshay Mehta) — Apr 19, 2026, 1:21 PM CDT. Lore, an agent harness whose **memory system** builds nodes and connections from use; design inspired by Karpathy’s LLM wiki posts. 23 likes, 7 bookmarks.
6. [@askalphaxiv](https://x.com/askalphaxiv/status/2117868635377332232) — Nov 4, 2026, 12:36 AM CST. “Evolving Agent Teams”: a supervisor reorganizes a coding-agent team and “preserv[es] lessons from previous attempts in **shared memory**.” (This is the only bookmarked post that uses the exact phrase “shared memory.”) Metrics were not in the cached copy.
7. [@mardehaym](https://x.com/mardehaym/status/2113990724282724742) (Mark Ajzenstadt) — Oct 24, 2026, 8:47 AM CDT. Seven steps from tool adoption to an “agentic org.” Step two is a **context layer**: knowledge graphs per department behind API gateways, so agents do not hallucinate across departmental boundaries. Adjacent to, not the same as, a shared memory layer. Metrics were not in the cached copy.

None of the bookmarks used the exact phrase “shared memory layer.”

## (c) Best X posts from search

Exact-phrase search for **"shared memory layer"** returned 24 recent posts, almost all low-engagement replies (0–5 likes). The phrase is in circulation as a product/architecture slogan — portable context across tools and agents, so sessions do not start over — but the high-signal conversation uses **agent memory**, **multi-agent memory**, and **context engineering**.

Stronger posts (engagement or an authoritative author/paper), among ~168 unique search results across seven queries:

1. [@hwchase17](https://x.com/hwchase17/status/2116553654857867330) (Harrison Chase, LangChain) — Oct 31, 2026, 10:31 AM CDT. X article “New context engineering challenges in late 2026.” 648 likes, 1,045 bookmarks. Article: https://x.com/i/article/2116547440857718784
2. [@mentalium_](https://x.com/mentalium_/status/2123446595286860200) — Nov 19, 2026, 10:01 AM CST. Microsoft’s free AI-agent GitHub course; lessons 12–13 are **context engineering** and **agent memory management**. 1,150 likes, 2,086 bookmarks. (Broad course promo; memory is one module.)
3. [@letandrewcook](https://x.com/letandrewcook/status/2118726674690789501) — Nov 6, 2026, 9:26 AM CST. Peer-reviewed paper on “dependency-driven belief revision in LLM & Agent Memory design”: *Toward a Compositional Knowledge Architecture for a Shared Organizational Cortex*, https://arxiv.org/abs/2611.05753. 59 likes.
4. [@HuggingPapers](https://x.com/HuggingPapers/status/2122421433431105988) — Nov 16, 2026, 2:07 PM CST. **MIRIX-2.0**, “a practical multi-agent memory system for LLM agents” combining factual and procedural memory; reported 91.4% LoCoMo and 72.6% LongMemEval-S. Paper: https://arxiv.org/abs/2611.12068. Repo: https://github.com/MIRIX-AI/MIRIX. 32 likes, 20 bookmarks.
5. [@DanKornas](https://x.com/DanKornas/status/2115095159532552464) — Oct 27, 2026, 9:55 AM CDT. Points builders to **Awesome Agent Memory**, a curated GitHub list of memory systems, frameworks, benchmarks, and research. 36 likes, 27 bookmarks. (The post’s link was an image; similarly named lists exist, including https://github.com/TeleAI-UAGI/Awesome-Agent-Memory — that exact repo was not confirmed from the screenshot.)
6. [@moorcheh_ai](https://x.com/moorcheh_ai/status/2121086126433714197) — Nov 12, 2026, 9:41 PM CST. X article titled **“Agentic Memory Is Now Its Own Field.”** 25 likes. Article: https://x.com/i/article/2121083240622559232
7. [@MaryamMiradi](https://x.com/MaryamMiradi/status/2118074744658411768) — Nov 4, 2026, 2:15 PM CST. Thread on the **AI agent memory** stack: short-term state, long-term memory, retrieval, stale and conflicting facts. 17 likes, 13 bookmarks. A later reprint: https://x.com/MaryamMiradi/status/2125320520736641325 (Nov 24, 2026, 2:07 PM CT).
8. [@guruchahal](https://x.com/guruchahal/status/2122033168362635454) — Nov 15, 2026, 12:25 PM CST. Multi-agent results depend on “task fit, topology, diversity, **shared memory**, and cost — not simply more agents.” 17 likes, 14 bookmarks.
9. [@unknownnode404](https://x.com/unknownnode404/status/2117225233954283820) and [@stewy0x](https://x.com/stewy0x/status/2122299089945563264) — listicles of open-source “memory layers” for Claude/agents (claude-mem, Mem0, and others). 77 and 36 likes respectively. Useful as a snapshot of the tooling, not as research.
10. Representative exact-phrase uses (low engagement, but they show how people say it):
    - [@ashishkh](https://x.com/ashishkh/status/2115347668205707696): “Multi-agent coding without a shared memory layer is just three senior engineers refactoring the same repo while refusing to speak to each other.”
    - [@volosatovde](https://x.com/volosatovde/status/2117924849339212036): “one shared memory layer across every agent is the real unlock.”
    - [@vexor4i](https://x.com/vexor4i/status/2117986915123163609): “shared memory layer is a game changer -> portable context across tools.”
    - Other sense: [@phedranico](https://x.com/phedranico/status/2114523833990578420) on DeRAM, “a decentralized shared memory layer designed to help distributed nodes” (systems/crypto, not LLM agents).

Search also surfaced EvoMemBench (a benchmark finding that no single LLM agent memory method generalizes to all tasks) and DISCERN (“Preserve at Write, Resolve at Read for Persistent LLM-Agent Memory”), mostly in lower-engagement paper-bot posts.

## (d) Companies and projects named in the posts

Named in search or bookmark text (not an exhaustive market map):

- **Mem0**, **Letta / MemGPT**, **Zep**, **Graphiti**, **Cognee**, **supermemory**, **claude-mem**, **MemOS**, **Memora** — recurring open-source/product “memory layers” (listicles and the Raw-RAG bookmark).
- **MIRIX / MIRIX-2.0** — multi-agent memory system (paper + GitHub above).
- **Lore** — harness with a graph-like memory system (bookmarked).
- **CrewAI**, **LangGraph** / LangChain — agent frameworks; Chase’s post is about context engineering.
- **Obsidian**, **Logseq** — used as a shared vault/memory backend via MCP in at least one post.
- **Chroma** — “context rot” research, adjacent to memory/context engineering.
- **Azure Cosmos DB** — “multi-agent memory” in a Code with Cosmos series.
- **AWS AgentCore** — mentioned with multi-agent memory in a question-reply.
- **Meta FAIR** — Routed Continual Learning (bookmarked).
- **Google Cloud AI, Google DeepMind, Penn State** — Self-Improvement Memory (bookmarked).
- Promotional or low-signal mentions of a shared memory layer: **Livingbrain / Heybrain**, **Unibase**, **SALVOR**. Treat as marketing, not as canonical systems.
- **DeRAM** — decentralized shared memory in the systems sense, not agent memory.

## Sources

This note was cleaned from a 24 November 2026 research pass over public papers and public X posts and bookmarks. Raw API responses are not included.
