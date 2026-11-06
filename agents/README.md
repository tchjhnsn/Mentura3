# Agents

Mentura's LangChain side over Naive (EE-121, EE-122). Mentura builds its function agents with LangChain deepagents and runs them from Grokbot. The backend and the tracer make such an agent work through Naive's deterministic layers and leave its run in the venture's own files; the function agents (EE-123) are built on them. Naive imports nothing from LangChain; everything that names LangChain is here.

| File | What it does |
|---|---|
| `naive-backend.ts` | `NaiveBackend`, a deepagents backend (`BackendProtocolV2`) over Naive's agent filesystem (`naive-framework/src/router/agent-files.ts`). A deep agent's `ls`, `read_file`, `write_file`, `edit_file`, `glob` and `grep` become Naive router calls on the venture's records, so every write meets the schema, the gate, decision rights and provenance. A gated write is held as a draft, and the agent is told the record did not change. Given the run's tracer, each file operation's span hangs from the tool call that made it |
| `naive-tracer.ts` | `NaiveTracer`, a LangChain callback handler that writes each agent run, model call and tool call as a span in `<venture>/traces/<session>.jsonl` through Naive's `span()`, so the hash chain, the content rule (inputs and outputs only with `traces.content`) and `check-traces.ts` hold. The run id is the span id; LangGraph's inner node runs are not spans. The session comes from the option or `MENTURA_SESSION`, so a Grokbot run, its function agents and their provenance lines share one trace. Nothing leaves the machine; `../integrations/langsmith-otel.ts` ships the files to LangSmith |
| `agents-test.ts` | A deep agent built with `createDeepAgent`, a scripted model, the backend and the tracer, against a made-up venture, offline |
| `function-spec.ts` | What a function agent is, derived from Naive's data (EE-123): every id in `departments.json` is one, acting in the team-plan role `<function>-agent`, with its function's module (`functions/<fn>/`) for skills and the write routes its role should get (`decisions/*` plus the concrete write routes of the record packages the function owns, never the team plan). There is no list of agents here |
| `function-agent.ts` | One function agent run: checks the venture's team plan, locks the venture (`.naive/agent-run.lock`), answers a repeated run id from the files, loads the model, runs the deep agent with the function's module mounted read-only at `/function/` and the run's identity set in the process environment, and reports the answer, what it wrote and the drafts held for a person, each with its `mentura accept` command |
| `cli.ts`, `bin.ts` | `mentura-agent`, the one way to start a run: `node platform/agents/bin.ts run <function> --venture <id> [--run-id <uuid>]` with the task on stdin, or `node platform/agents/bin.ts mcp`. One process per run |
| `mcp.ts` | The MCP shim for Grokbot: one `agent_<function>` tool per function the venture has staffed, each call a `bin.ts run` child process, a cancel sent to it as SIGTERM |
| `function-agent-test.ts` | The strategy agent run offline with a scripted model, through the CLI and through the shim |

```ts
const tracer = new NaiveTracer(ventureDir, { session, agents: ["strategy"] });
const agent = createDeepAgent({ model, name: "strategy", backend: new NaiveBackend({ venture: "kettle" }, tracer) });
await agent.invoke(input, { callbacks: [tracer] });
```

Run the tests with `node --import ./scripts/naive-ts.ts platform/agents/agents-test.ts` and `node --import ./scripts/naive-ts.ts platform/agents/function-agent-test.ts` (the loader strips types from Naive's `.ts` files under node_modules). Outside a function agent run, the venture needs `"traces": true` in `naive.config.json` for spans to be written.

## Function agents (EE-123)

A function agent runs one task on one venture in its own process. The process is the run, so its environment carries the run's session, trace, role and model, and every Naive reader (the tracer, the router's acting check, provenance) agrees on them. A run is always traced, whatever the venture's `traces` setting, and LangChain's own tracing is off: the spans stay in `<venture>/traces/<session>.jsonl` beside `provenance.jsonl`.

```sh
MENTURA_WORKSPACE=~/workspace/ventures MENTURA_MODEL=anthropic:claude-opus-4-5 \
  node platform/agents/bin.ts run strategy --venture kettle <<< "Tighten the pricing decision."
```

It prints one JSON result and exits 0 (done, or already ran), 1 (failed), 2 (refused or usage), 75 (busy: another run holds the venture, try again with the same `--run-id`) or 130 (cancelled by SIGTERM or SIGINT). The result names the run, the agent's answer, what it wrote, and each draft held for a person with the command that accepts it, such as `mentura accept decisions/pricing --venture kettle`. Only a person runs that command.

The environment it reads, once, at the start:

| Variable | What it is |
|---|---|
| `MENTURA_WORKSPACE` | The folder that holds the ventures |
| `MENTURA_MODEL` | The model as `provider:model`, passed to LangChain's `initChatModel`. The provider's LangChain package must be installed (`npm install @langchain/anthropic`, which is not a dependency here) and reads its own key from its own variable (`ANTHROPIC_API_KEY`). Nothing here reads, logs or stores a key |
| `MENTURA_SESSION`, `MENTURA_TRACE_ID`, `MENTURA_SPAN_ID` | The caller's trace. The run's spans go to that session's file, and its root span (whose id is the run id) hangs from the caller's span. Unset, the run starts its own trace |
| `MENTURA_HARNESS` | Who started the run, for provenance |

A venture staffs a function agent by listing its role in its team plan. Until then a run is refused, and the refusal carries the entry to add, with write routes derived for that function. The role must be an agent's, must list routes (a role without routes could reach every route) and must not be able to write the team plan. The agent never writes the team plan itself.

### Grokbot

Grokbot adds the shim to the MCP config of each `claude -p` it spawns. The trace variables name Grokbot's session, trace and the span of that turn. The key is a reference Claude Code expands from Grokbot's own environment, so the file holds no key:

```json
{
  "mcpServers": {
    "mentura-agents": {
      "command": "node",
      "args": ["<everything-ecosystem>/platform/agents/bin.ts", "mcp"],
      "env": {
        "MENTURA_WORKSPACE": "<the folder that holds the ventures>",
        "MENTURA_VENTURE": "kettle",
        "MENTURA_SESSION": "<Grokbot's session>",
        "MENTURA_TRACE_ID": "<Grokbot's trace id>",
        "MENTURA_SPAN_ID": "<the span of this turn>",
        "MENTURA_MODEL": "anthropic:claude-opus-4-5",
        "MENTURA_HARNESS": "Grokbot",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

The calling model sees one tool per function the venture has staffed (`agent_strategy` for kettle), with the input `{ task, venture?, run_id? }`. `venture` defaults to `MENTURA_VENTURE`, and `run_id` (a UUID) makes a retry safe: the same id again reports the first run without running it twice. Each call starts one `bin.ts run` process with the shim's environment unchanged, and a cancel stops that process with SIGTERM, which ends its open spans and releases the venture's lock. The tool result is the run's JSON, as text and as `structuredContent`; `isError` is true for anything other than done or already ran. Node must be 22.18 or later.

Not built yet: filesystem triggers that start a function agent (they would call the same `bin.ts run`), a chat model provider package as a dependency here, and appends that two processes can share, so a venture runs one function agent at a time.
