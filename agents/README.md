# Agents

Mentura's LangChain side over Naive (EE-121, EE-122). Mentura builds its function agents with LangChain deepagents and runs them from Grokbot; these two pieces make such an agent work through Naive's deterministic layers and leave its run in the venture's own files. Naive imports nothing from LangChain; everything that names LangChain is here.

| File | What it does |
|---|---|
| `naive-backend.ts` | `NaiveBackend`, a deepagents backend (`BackendProtocolV2`) over Naive's agent filesystem (`naive-framework/src/router/agent-files.ts`). A deep agent's `ls`, `read_file`, `write_file`, `edit_file`, `glob` and `grep` become Naive router calls on the venture's records, so every write meets the schema, the gate, decision rights and provenance. A gated write is held as a draft, and the agent is told the record did not change. Given the run's tracer, each file operation's span hangs from the tool call that made it |
| `naive-tracer.ts` | `NaiveTracer`, a LangChain callback handler that writes each agent run, model call and tool call as a span in `<venture>/traces/<session>.jsonl` through Naive's `span()`, so the hash chain, the content rule (inputs and outputs only with `traces.content`) and `check-traces.ts` hold. The run id is the span id; LangGraph's inner node runs are not spans. The session comes from the option or `MENTURA_SESSION`, so a Grokbot run, its function agents and their provenance lines share one trace. Nothing leaves the machine: shipping the files to LangSmith is not built yet |
| `agents-test.ts` | A deep agent built with `createDeepAgent`, a scripted model, the backend and the tracer, against a made-up venture, offline |

```ts
const tracer = new NaiveTracer(ventureDir, { session, agents: ["strategy"] });
const agent = createDeepAgent({ model, name: "strategy", backend: new NaiveBackend({ venture: "kettle" }, tracer) });
await agent.invoke(input, { callbacks: [tracer] });
```

Run the test with `node --import ./scripts/naive-ts.ts platform/agents/agents-test.ts` (the loader strips types from Naive's `.ts` files under node_modules). The venture needs `"traces": true` in `naive.config.json` for spans to be written.

Not built yet: the replication of trace files to LangSmith when online, and the first function agent as a tool Grokbot calls over MCP.
