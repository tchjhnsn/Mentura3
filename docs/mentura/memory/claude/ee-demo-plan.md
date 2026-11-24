---
name: ee-demo-plan
description: Hackathon demo plan as of 2026-10-29 00:28Z: Claude Code runtime + LangSmith traces, Mentura as read-only view of a local venture; open items Torian raised
metadata:
  type: project
  modified: 2026-10-29T00:28:33.316Z
---

2026-10-29 00:21Z to 00:28Z, Torian agreed "for now":
- Keep the existing harness (`interface/harness/run.mjs`, which runs Claude Code headless through Naive's MCP) and LangSmith for traces and evals. No switch to the Agent SDK.
- Mentura is only a visualization of the founder's local Naive venture. Automations run locally.
- Show three automations end to end: (1) dump to map to routed records, (2) market research to evidence, (3) a decision that blocks the agent, then the agent finishes.
- Order: demo script, then Mentura view, then rehearsal, then video and submission.
- I asked Torian to tell Grokbot to hold stage D (moving the board) until after the deadline.

Items Torian raised, still open:
- The Mentura marketing page on the website needs work.
- `naive init` on our own folder, so our setup is a Naive venture. Vault only, repo unchanged.
- Naive has no notion of vault vs repo, or of where the technical source of truth lives. Closest existing mechanism: the source-of-truth matrix (EE-042, `knowledge/connectors/resolve.mjs`).
- There is no product anatomy for Naive or Mentura yet.
- Torian asked whether LangSmith Studio removes the need for a Mentura harness or view.

Related: [[ee-hackathon-aitx-2026]], [[feedback-views-are-platform]], [[ee-nextjs-translation]].

00:36Z Torian: "completely use LangSmith" for the demo. He has added TYPESAFE_API_KEY to LangSmith's environment variables, and Jev is available there as a model. Plan: online evaluators and automations sit next to the traces, while the agents still run locally (moving them would mean rebuilding as LangGraph). Built `platform/integrations/langsmith-setup.mjs` (commit 224e48b on #19): founder review queue, good-runs dataset, gate rules, and Jev judge rules. The judge rules need LANGSMITH_JEV_CONFIG, the id of a saved playground model config. The script is dry-run by default and has not yet been tried against a live workspace. This cloud environment has no LANGSMITH_API_KEY; I asked Torian to add one as an environment secret.

00:58Z Jev runs inside LangSmith as a decision-model evaluator. The shape, read back from Torian's UI-made evaluator "s":
- A hub prompt whose manifest is `langsmith/playground/PromptPlayground` with two parts: `first`, a StructuredPrompt, and `last`, `langsmith/playground/TypeSafe {model: jev-latest, questions: {key: {type: noul, instructions}}}`.
- Workspace secret TYPESAFE_API_KEY.
- Create it with POST /api/v1/platform/evaluators `{type: decision_model, llm_evaluator: {prompt_repo_handle, commit_hash_or_tag: latest, variable_mapping}}`.
- The rule takes `evaluator_id`. A hub_ref inside rule.evaluators is refused, because it is validated as an LLM chain.

Live on project naive-hackathon (id 45f2f079...):
- Rules: gate missed -> review queue; all gates held -> good-runs dataset; Jev judges each run (founder_words, research_supports, founder_decides); Jev below 0.7 -> review queue.
- Script `platform/integrations/langsmith-setup.mjs` (commit 318c84b on #19) does all of this and is idempotent.
- Torian's leftover "s" evaluator and "Alignment" rule are his to delete.
- Torian gave a LangSmith key in chat at 00:47Z to use for now; he will rotate it. Use it only inline, never write it to a file.

01:11Z Demo plan doc (LangSmith for scale + Rho): https://claude.ai/artifact/9jVUUc6BuYMuJxHW2ZMzJQ . Rho sandbox MCP `https://rhoapi-sandbox.rho.co/mcp/v1` works from cloud with any bearer token (fictional data, 38 tools, all read except updateTransactionNote; amounts in minor units). Proposed (not yet agreed): platform/integrations/rho.mjs syncs into `money/` data package (accounts, _streams/transactions private, summary.json versioned); agent reads summary via Naive MCP, never Rho live; freshness gate 7 days. Build order: Rho connector, summary+gate, LangSmith metadata/thread_id/alert/experiment, board money card, rehearse, submit by 20:00Z.
01:14Z Torian: "Go." (recommendations taken: agent reads money/ snapshots, not Rho live; Jev on every run while new, ~10% later). 01:25Z commit dae3bd5 on #19: platform/integrations/rho.mjs (+ rho-test.mjs, fixtures/rho-sandbox.json), harness --money sandbox|live|<fixture>, evals money_fresh/money_cited/money_private, root metadata thread_id/venture_id/harness_version, board money card. Sandbox company is "Acme Corporation", cash-positive (runway "not limited by burn"). LangSmith key is not in env after compaction; don't grep the transcript for it, ask Torian for LANGSMITH_API_KEY as an environment secret.
01:45Z LangSmith loop confirmed end to end on naive-hackathon: Naive evals as feedback, Jev scores, good-runs dataset fills, Jev-unsure queue fills. Commits 76ba4bf (trace root inputs carry the dump text) and 4df61d2 (Jev questions reworded; prompt commits need parent_commit). Same run rescored: founder_words 0.23->0.72, research_supports 0.09->0.94, founder_decides 0.42->0.55 (still to queue). No Firecrawl key in cloud env, so cloud runs do no research. Torian gave a LangSmith key in chat at 01:26Z; use inline only, never write it down.
01:47Z Torian: demo emphasis is the DECISION DOCKET, with strong evidence it ranks decisions right (the best next steps). Rank decisions within each function AND functions against each other; the leading function can change many times a day; one decision can outweigh every other function combined. Founders' words are important but obvious (not non-obvious, a judging criterion) and must NOT gate: founders write with AI and let its words stand. Built 0fd2ef2 (EE-074): schema/docket.mjs (value = own + held transitively; attention = halving sum; dominant), --replay, docket-test.mjs, harness picks the docket's next and traces each step, Jev questions now docket_next / docket_function / founder_decides, ideas_verbatim removed from GATES. Proposed next: ~10 scenario ventures with known-right orders from cited startup sources, Torian reviews, agreement rate in LangSmith.
02:20Z commit 5140ef3: docket evidence set schema/examples/docket-scenarios.json (8 scenarios / 12 states, cited sources, labels are Claude's draft awaiting Torian), schema/docket-eval.mjs, platform/integrations/langsmith-docket.mjs. LangSmith dataset "Naive: docket scenarios" (e737e594...) with experiments v1 (75%) and v2 (92%; deadlines by cost of delay, ties by phase fit). Jev 100% on the same labels (caveat: an LLM may share Claude's priors). Remaining miss: talk-to-users-first (product decisions fail open, so MVP scope isn't held behind validation in Discovery) is a design question for Torian.

Later demo scope: [[ee-demo-scope-four-pages]].
