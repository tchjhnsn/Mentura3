<!-- Placement: tchjhnsn/Mentura3 docs/mentura/research/PUZZLE_MODEL_HOSTING_2026-11-02.md. Original research date: 2 November 2026 (America/Chicago). Moved from a box working note on 26 November 2026. Box-local paths were rewritten. Docs only. No secrets were added or removed. -->

# Puzzle chat: where the question-writing model should run

Prepared for Torian, Monday Nov 2, 2026 (America/Chicago). Every price and limit below links to the official page it came from, fetched today. "Not documented" means I could not find it on an official page.

## 1. The layers in plain terms

The puzzle chat needs five layers. Only one of them actually runs a model.

| Layer | What it does | Who fills it for us |
| --- | --- | --- |
| App runtime | Our Next.js code in `site/` receives the founder's answer, applies the consent filter (no name or contact details, only consented answers), calls the models, streams the next question back. | Vercel Functions plus the AI SDK (`ai` package). Already where `site/` deploys. |
| Model provider | The company whose GPUs run the model and return text. | Anthropic, OpenAI, Google, xAI, or an open-weights host (Groq, Together). |
| Gateway (optional) | One API key and one bill in front of many providers. Adds failover, budgets, logs, and routing rules such as "zero data retention only". | Vercel AI Gateway or OpenRouter. |
| Observability and evals (optional) | Records each turn, scores quality, runs test sets. | LangSmith, Langfuse, or Braintrust. |
| Storage | Keeps the conversation and the consent record. | Neon Postgres (already planned). |

**LangSmith does not host the models.** It is a tracing and evaluation product. Its pricing page also lists an "LLM Gateway" (cost controls, fallbacks, PII redaction, bring your own model key) and agent deployment, but the model itself still runs at a provider ([LangSmith pricing](https://www.langchain.com/pricing)). A database provider like Neon only stores data. So the real answer to "who deploys the model" is: nobody on our side deploys one. We call a provider's hosted model over an API from our Vercel function, ideally through a gateway.

### Why Vercel AI Gateway fits this project specifically

- **Jev already lives on it.** Jev is available on AI Gateway as `typesafe-ai/jev`, called through the AI SDK's `experimental_evaluate`. It costs $0.042 per 1M input tokens with no output charge, and supports Zero Data Retention and No Training per request ([Vercel Jev guide](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk)). The question-writing model and Jev would share one key, one bill, one budget, and one log.
- **No markup.** Tokens are billed at the provider's list price, no platform fee, including with your own provider keys ([AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)).
- **Gateway itself keeps no content.** Vercel does not train on prompts, and AI Gateway deletes prompt and response content when the request completes. It logs only metadata (status, model, tokens, cost) ([AI Gateway FAQ](https://vercel.com/docs/ai-gateway/faq)).
- **ZDR is a per-request flag.** `providerOptions.gateway.zeroDataRetention: true` routes only to providers with ZDR agreements, and fails the request rather than falling back to a retaining provider. Per-request ZDR costs nothing extra; team-wide ZDR costs $0.10 per 1,000 requests. Both require **Pro or Enterprise** ([AI Gateway ZDR](https://vercel.com/docs/ai-gateway/zero-data-retention)).

### The plan question (blocking)

The Vercel plan for `site/` is unknown. Two official facts make it matter:

- Hobby is "restricted to non-commercial personal use only", and "advertising the sale of a product or service" counts as commercial ([Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). A waitlist and Founders Package site is commercial.
- Gateway ZDR is Pro or Enterprise only (link above).

Pro is $20 per month per developer seat and includes a $20 usage credit ([Vercel pricing](https://vercel.com/pricing)). Hobby caps a function at 300 seconds; Pro defaults to 300 seconds, configurable to 800 ([Hobby plan](https://vercel.com/docs/plans/hobby)). A chat turn is well inside either.

## 2. Options for the question-writing model

Representative small, fast model per option. Prices are per 1M tokens, input / output.

| Option | Representative model and price | Training on API data | Default retention | ZDR available | Free tier | Setup with AI SDK on Vercel |
| --- | --- | --- | --- | --- | --- | --- |
| **A. Vercel AI Gateway** | Claude Haiku 5.5 $0.10 / $0.50 ([model page](https://vercel.com/ai-gateway/models/claude-haiku-5.5)); GPT-6 Luna $0.10 / $0.50 ([model page](https://vercel.com/ai-gateway/models/gpt-6-luna)); Jev $0.042 input only ([guide](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk)) | Gateway: no. ZDR providers also disallow training ([ZDR](https://vercel.com/docs/ai-gateway/zero-data-retention)) | Gateway keeps none ([FAQ](https://vercel.com/docs/ai-gateway/faq)); provider default applies unless ZDR is set | Yes, per request, Pro and Enterprise. Anthropic, Bedrock, Vertex, Groq, Together, xAI, TypeSafe listed as ZDR; OpenAI listed as "ZDR with safety retention" ([ZDR](https://vercel.com/docs/ai-gateway/zero-data-retention)) | Monthly free credit on a subset of models with lower rate limits; ends once you buy credits. Dollar amount not documented on the current pricing page ([pricing](https://vercel.com/docs/ai-gateway/pricing)) | Lowest. Model is a string like `'anthropic/claude-haiku-5.5'`; on Vercel, auth is automatic via OIDC, no key to store ([guide](https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk)) |
| **B. Anthropic direct** | Claude Haiku 5.5 $0.10 / $0.50 for prompts up to 100k tokens; cache hits $0.01. Claude 4.7 and later use a tokenizer that produces about 30% more tokens ([pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)) | No, never without express permission ([retention policy](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)) | Deleted within 30 days; up to 2 years if flagged for Usage Policy ([same](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)) | Yes, by sales approval per organization ([same](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)) | "A small amount of free credits" for new users ([pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)) | Low. `@ai-sdk/anthropic` plus a key in Vercel env. Separate bill from Jev. |
| **C. OpenAI direct** | GPT-6 Luna $0.10 / $0.50, cached $0.01 ([pricing](https://platform.openai.com/docs/pricing)) | No, since March 2023 unless you opt in ([data controls](https://platform.openai.com/docs/guides/your-data)) | Abuse logs up to 30 days ([same](https://platform.openai.com/docs/guides/your-data)) | Yes, subject to prior approval by OpenAI ([same](https://platform.openai.com/docs/guides/your-data)) | Not documented | Low. `@ai-sdk/openai`. GPT-6 Luna is a reasoning model, so reasoning tokens bill as output; keep effort low. |
| **D. Google Gemini direct** | Gemini 3.5 Flash-Lite $0.30 / $2.50; Gemini 2.5 Flash-Lite $0.10 / $0.40 ([pricing](https://ai.google.dev/gemini-api/docs/pricing)) | Free tier: yes, content used to improve products and humans may read it. Paid tier: no ([terms](https://ai.google.dev/gemini-api/terms)) | Paid: logged "for a limited period of time" for abuse; period not documented ([terms](https://ai.google.dev/gemini-api/terms)) | Not documented for the Gemini Developer API | Yes, but the free tier trains on content, so unusable for founder answers ([terms](https://ai.google.dev/gemini-api/terms)) | Low. `@ai-sdk/google`. |
| **E. xAI direct** | Grok 4.3 $1.25 / $2.50 (smallest general model listed) ([models](https://docs.x.ai/docs/models)) | No, without explicit permission ([security FAQ](https://docs.x.ai/developers/faq/security)) | 30 days, encrypted ([same](https://docs.x.ai/developers/faq/security)) | Yes, self-serve, team-wide ([same](https://docs.x.ai/developers/faq/security)) | Not documented | Low. `@ai-sdk/xai`. Roughly 10x the token cost of options A to C. |
| **F. OpenRouter** | Same list prices as the provider; 5.5% fee on credit purchases on Standard ([pricing](https://openrouter.ai/pricing)) | OpenRouter does not train on your data ([pricing](https://openrouter.ai/pricing)) | Per endpoint; unknown endpoints assumed to retain and train ([ZDR doc](https://openrouter.ai/docs/guides/features/zdr)) | Yes, per request (`provider.zdr: true`), every plan. Claude Haiku 5.5 has ZDR endpoints on Bedrock and Google; Google Gemini endpoints are "Safety Retention" only ([ZDR doc](https://openrouter.ai/docs/guides/features/zdr)) | 25+ free models, 50 requests per day ([pricing](https://openrouter.ai/pricing)) | Low via an OpenAI-compatible base URL, but Jev would stay on a separate path. |
| **G. Open weights (Groq / Together)** | Groq gpt-oss-120b $0.15 / $0.60 ([Groq models](https://console.groq.com/docs/models)); Together GLM-5.3-Flash $0.15 / $0.50 ([Together pricing](https://www.together.ai/pricing)) | Groq: customer data not retained by default ([Groq data](https://console.groq.com/docs/your-data)); Together: not documented on a page I fetched | Groq: up to 30 days only for reliability or abuse cases, opt-out available ([same](https://console.groq.com/docs/your-data)) | Groq: yes, self-serve for all customers ([same](https://console.groq.com/docs/your-data)). Both are ZDR providers on AI Gateway ([ZDR](https://vercel.com/docs/ai-gateway/zero-data-retention)) | Not documented | Low, and reachable through Gateway too. Open-weight writing quality for Socratic dialogue is untested here. |

## 3. Cost per puzzle conversation

### Assumptions

- 12 question turns plus 1 closing synthesis turn.
- Fixed system prompt plus question-bank context: 1,500 tokens on every call.
- Conversation history grows 600 tokens per turn (founder answer plus model question).
- Output: 200 tokens per question, 800 for the synthesis. Reasoning or thinking turned off or minimal.
- Jev: 2 evaluate calls per turn on about 800 tokens of consented state each.
- No prompt caching credited (caching would cut input cost, but whether a ZDR route allows caching depends on the provider, per the [ZDR doc](https://vercel.com/docs/ai-gateway/zero-data-retention)).

Totals: 66,300 input tokens and 3,200 output tokens per conversation for the question model, plus 19,200 Jev input tokens (about $0.0008).

### Top two options

| | Per conversation | Per 1,000 founders | Per 100,000 | Per 1,000,000 |
| --- | --- | --- | --- | --- |
| A. AI Gateway, Claude Haiku 5.5 with ZDR (tokens times 1.3 for the new tokenizer) + Jev | $0.0115 | $11.51 | $1,151 | $11,505 |
| A'. AI Gateway, GPT-6 Luna + Jev | $0.0090 | $9.04 | $904 | $9,036 |
| F. OpenRouter, Claude Haiku 5.5 ZDR endpoint (adds 5.5% credit fee; Jev billed separately) | $0.0113 + Jev | $11.29 + Jev | $1,129 + Jev | $11,287 + Jev |

Per-request ZDR on Gateway adds $0. If team-wide ZDR were used instead, about 25 requests per conversation at $0.10 per 1,000 adds $0.0025 per conversation.

### Sensitivity: same conversation on other models

| Model | Per 1,000 founders (incl. Jev) |
| --- | --- |
| Together GLM-5.3-Flash | $12.35 |
| Groq gpt-oss-120b | $12.67 |
| Gemini 3.5 Flash-Lite | $28.70 |
| GPT-6.1 Terra ($1 / $5) | $83.11 |
| Grok 4.3 | $91.68 |
| Claude Sonnet 5 ($2 / $10, times 1.3) | $214.79 |

Takeaway: at platform scale (1M founders), a small model costs about $9k to $12k in tokens; a mid-tier model costs $80k to $215k. Model choice dominates cost far more than gateway choice. Vercel function cost is small next to this: Pro bills Active CPU from $0.128 per hour and invocations at $0.60 per 1M, and time spent waiting on the model is not active CPU ([Vercel pricing](https://vercel.com/pricing)). I did not model it per conversation.

### Storage and observability (optional, for later)

- Neon: Free plan, permanent, 100 projects, 1 GB storage per project; Launch is pay as you go at $0.106 per CU-hour and $0.35 per GB-month ([Neon pricing](https://neon.com/pricing)).
- Langfuse Hobby is free with 50k units per month; Core is $29 per month ([Langfuse pricing](https://langfuse.com/pricing)). LangSmith Developer is $0 with 5k base traces per month; Plus is $39 per seat ([LangSmith pricing](https://www.langchain.com/pricing)). Braintrust Starter is $0 with 14-day retention ([Braintrust pricing](https://www.braintrust.dev/pricing)). Note: sending raw puzzle text to any tracing tool is another third party receiving founder content, so tracing should log metadata and Jev scores only, or wait.

## 4. Recommendation

Run the question model on **Vercel AI Gateway**, defaulting to **Claude Haiku 5.5** with `zeroDataRetention: true` on every request, with GPT-6 Luna as a configured fallback model. Reasons:

1. Jev is already on the same gateway, so the puzzle's whole model path is one SDK, one bill, one budget, one log, and swapping the question model is a one-string change.
2. Anthropic is a full ZDR provider on Gateway; OpenAI there is "ZDR with safety retention", so Haiku is the stricter privacy default for founder answers.
3. Cost is about $11.50 per 1,000 founders, roughly $11.5k per million.
4. The consent rule stays in our code: only consented answers, no name or contact details, ever reach the gateway; Gateway ZDR then makes the provider side match.

Prerequisite: the Vercel team that hosts `site/` must be on Pro (for ZDR, and because a commercial site is not allowed on Hobby). That is a paid service and needs Torian's approval. Hold off on LangSmith, Langfuse, or Braintrust until there is real traffic.

### Decision for Torian

**Should the puzzle chat use Vercel AI Gateway with Claude Haiku 5.5 and zero data retention on every request, which requires the Vercel team for the site to be on Pro ($20 per seat per month)?**
Recommended answer: **Yes.** Move the site's Vercel team to Pro if it is not already, and use AI Gateway with Claude Haiku 5.5 and ZDR. Expected model cost is about $11.50 per 1,000 founders.

## Sources (all fetched Nov 2, 2026)

- https://vercel.com/docs/ai-gateway
- https://vercel.com/docs/ai-gateway/pricing
- https://vercel.com/docs/ai-gateway/zero-data-retention
- https://vercel.com/docs/ai-gateway/faq
- https://vercel.com/kb/guide/typesafe-jev-and-ai-sdk
- https://vercel.com/ai-gateway/models/claude-haiku-5.5
- https://vercel.com/ai-gateway/models/gpt-6-luna
- https://vercel.com/pricing
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits/fair-use-guidelines
- https://docs.anthropic.com/en/docs/about-claude/pricing
- https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- https://platform.openai.com/docs/pricing
- https://platform.openai.com/docs/guides/your-data
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/terms
- https://docs.x.ai/docs/models
- https://docs.x.ai/developers/faq/security
- https://openrouter.ai/pricing
- https://openrouter.ai/docs/guides/features/zdr
- https://console.groq.com/docs/models
- https://console.groq.com/docs/your-data
- https://www.together.ai/pricing
- https://www.langchain.com/pricing
- https://langfuse.com/pricing
- https://www.braintrust.dev/pricing
- https://neon.com/pricing

## Path check (26 November 2026)

This note cites `site/` and no pull request number. This repository has no top-level `site/` directory. tchjhnsn/Mentura still has `site/`, a Next.js app whose package name is `everything-ecosystem-site`. This repository's Next.js app is `web/`, and other directories are also named site, so the citation stays `site/`.
