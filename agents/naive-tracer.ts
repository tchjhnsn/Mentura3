// LangChain runs as spans in the venture's own trace files (EE-121). A callback handler: each agent run, model call
// and tool call LangChain reports becomes one span in <venture>/traces/<session>.jsonl, written by Naive's span(),
// so the chain, the content rule (inputs and outputs only with traces.content) and check-traces all hold. The run id
// is the span id and the parent run is the parent span, so the file nests the way LangSmith would. LangGraph's
// inner chain runs (its nodes) are not spans; their children hang from the nearest span above them. Nothing leaves
// the machine: replicating the files to LangSmith is a separate step.
//
//   const tracer = new NaiveTracer(ventureDir, { session, agents: ["strategy"] });
//   await agent.invoke(input, { callbacks: [tracer] });

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { BaseMessage } from "@langchain/core/messages";
import type { LLMResult } from "@langchain/core/outputs";
import type { ChainValues } from "@langchain/core/utils/types";
import { randomUUID } from "node:crypto";
import { span } from "naive-framework/src/core/instrumentation.mjs";

export interface TracerOptions { session?: string, trace_id?: string, agents?: string[] }
export interface SpanContext { trace_id: string, span_id: string, session: string }

interface Open { span_id: string, parent?: string, name: string, kind: string, start: string, attributes: Record<string, unknown>, agent?: string }

const text = (x: unknown): string => typeof x === "string" ? x : JSON.stringify(x);
const nameOf = (s: Serialized | undefined, runName?: string): string => runName ?? (s && "name" in s && typeof s.name === "string" ? s.name : s?.id?.at(-1) ?? "run");
const modelOf = (s: Serialized, extra?: Record<string, unknown>): string => {
  const inv = extra?.invocation_params as Record<string, unknown> | undefined;
  const kw = "kwargs" in s ? s.kwargs as Record<string, unknown> : {};
  return String(inv?.model ?? inv?.model_name ?? kw.model ?? kw.model_name ?? s.id?.at(-1) ?? "model");
};

export class NaiveTracer extends BaseCallbackHandler {
  name = "naive_tracer";
  dir: string;
  session: string;
  trace_id: string;
  agents: Set<string>;
  open = new Map<string, Open>();
  /** A run that is not a span (a LangGraph node) maps to the span its children hang from. */
  via = new Map<string, string | undefined>();

  constructor(dir: string, options: TracerOptions = {}) {
    super();
    // Spans must open before the run's tool executes, so a Naive write inside it can name the tool's span.
    this.awaitHandlers = true;
    this.dir = dir;
    this.trace_id = options.trace_id ?? process.env.MENTURA_TRACE_ID ?? randomUUID();
    this.session = options.session ?? process.env.MENTURA_SESSION ?? this.trace_id;
    this.agents = new Set(options.agents ?? []);
  }

  /** The span a run hangs from: itself when it is a span, else the nearest span above it. */
  spanOf(runId: string | undefined): string | undefined {
    let id = runId;
    for (let i = 0; id && i < 1000; i++) {
      if (this.open.has(id)) return id;
      if (!this.via.has(id)) return process.env.MENTURA_SPAN_ID;
      id = this.via.get(id);
    }
    return id ?? process.env.MENTURA_SPAN_ID;
  }

  /** The span context for a run still open, so a Naive write inside a tool call names the tool's span. */
  contextOf(runId: string | undefined): SpanContext | null {
    const id = this.spanOf(runId);
    return id ? { trace_id: this.trace_id, span_id: id, session: this.session } : null;
  }

  begin(runId: string, parentRunId: string | undefined, name: string, kind: string, attributes: Record<string, unknown>, agent?: string): void {
    this.open.set(runId, { span_id: runId, parent: this.spanOf(parentRunId), name, kind, start: new Date().toISOString(), attributes, agent });
  }

  end(runId: string, attributes: Record<string, unknown> = {}, error?: unknown): void {
    const o = this.open.get(runId);
    if (!o) { this.via.delete(runId); return; }
    span(this.dir, { name: o.name, kind: o.kind, trace_id: this.trace_id, span_id: o.span_id, parent_span_id: o.parent ?? null, session: this.session, start: o.start, end: new Date().toISOString(),
      status: error ? "error" : "ok", ...(error ? { error: String((error as Error).message ?? error) } : {}), attributes: { ...o.attributes, ...attributes } });
    this.open.delete(runId);
  }

  /**
   * Ends every span still open, children before the spans they hang from, each with status error and the reason.
   * A run that throws or is aborted can leave LangChain runs open, and a provenance line written inside one names a
   * span that check-traces would then find in no file. Idempotent: a second call finds nothing open.
   */
  closeOpen(reason: string): void {
    const depth = (id: string): number => {
      let d = 0;
      for (let p = this.open.get(id)?.parent; p && this.open.has(p) && d < 1000; p = this.open.get(p)?.parent) d++;
      return d;
    };
    for (const id of [...this.open.keys()].sort((a, b) => depth(b) - depth(a))) this.end(id, {}, new Error(reason));
    this.via.clear();
  }

  agentAbove(runId: string | undefined): string | undefined {
    const id = this.spanOf(runId);
    return id ? this.open.get(id)?.agent : undefined;
  }

  // The callback manager calls this as (chain, inputs, runId, parentRunId, tags, metadata, runType, runName), whatever
  // order the declared type gives (@langchain/core 1.3, callbacks/manager.js).
  override handleChainStart(chain: Serialized, inputs: ChainValues, runId: string, parentRun?: string, _tags?: string[], metadata?: Record<string, unknown>, _runType?: string, runName?: string): void {
    const parentRunId = parentRun;
    const name = nameOf(chain, runName);
    const agentName = typeof metadata?.lc_agent_name === "string" ? metadata.lc_agent_name : undefined;
    const isAgent = !parentRunId || this.agents.has(name) || (!!agentName && agentName !== this.agentAbove(parentRunId));
    if (!isAgent) { this.via.set(runId, parentRunId); return; }
    const agent = agentName ?? name;
    this.begin(runId, parentRunId, `invoke_agent ${agent}`, "agent", { "gen_ai.operation.name": "invoke_agent", "gen_ai.agent.name": agent, "gen_ai.input.messages": text(inputs) }, agent);
  }

  override handleChainEnd(outputs: ChainValues, runId: string): void { this.end(runId, { "gen_ai.output.messages": text(outputs) }); this.via.delete(runId); }
  override handleChainError(err: Error, runId: string): void { this.end(runId, {}, err); this.via.delete(runId); }

  override handleChatModelStart(llm: Serialized, messages: BaseMessage[][], runId: string, parentRunId?: string, extraParams?: Record<string, unknown>): void {
    const model = modelOf(llm, extraParams);
    this.begin(runId, parentRunId, `chat ${model}`, "model", { "gen_ai.operation.name": "chat", "gen_ai.request.model": model, "gen_ai.input.messages": text(messages.flat().map((m) => ({ role: m.getType(), content: m.content }))) });
  }

  override handleLLMStart(llm: Serialized, prompts: string[], runId: string, parentRunId?: string, extraParams?: Record<string, unknown>): void {
    const model = modelOf(llm, extraParams);
    this.begin(runId, parentRunId, `text_completion ${model}`, "model", { "gen_ai.operation.name": "text_completion", "gen_ai.request.model": model, "gen_ai.input.messages": text(prompts) });
  }

  override handleLLMEnd(output: LLMResult, runId: string): void {
    const gen = output.generations?.[0]?.[0] as { text?: string, message?: { usage_metadata?: { input_tokens?: number, output_tokens?: number }, response_metadata?: { model_name?: string } } } | undefined;
    const usage = gen?.message?.usage_metadata ?? (output.llmOutput?.tokenUsage ? { input_tokens: output.llmOutput.tokenUsage.promptTokens, output_tokens: output.llmOutput.tokenUsage.completionTokens } : undefined);
    this.end(runId, { "gen_ai.usage.input_tokens": usage?.input_tokens, "gen_ai.usage.output_tokens": usage?.output_tokens, "gen_ai.response.model": gen?.message?.response_metadata?.model_name, "gen_ai.output.messages": gen?.text });
  }

  override handleLLMError(err: Error, runId: string): void { this.end(runId, {}, err); }

  override handleToolStart(tool: Serialized, input: string, runId: string, parentRunId?: string, _tags?: string[], _metadata?: Record<string, unknown>, runName?: string, toolCallId?: string): void {
    const name = nameOf(tool, runName);
    this.begin(runId, parentRunId, `execute_tool ${name}`, "tool", { "gen_ai.operation.name": "execute_tool", "gen_ai.tool.name": name, "gen_ai.tool.call.id": toolCallId, "gen_ai.tool.call.arguments": input });
  }

  override handleToolEnd(output: unknown, runId: string): void { this.end(runId, { "gen_ai.tool.call.result": text(output) }); }
  override handleToolError(err: Error, runId: string): void { this.end(runId, {}, err); }
}
