// A deepagents backend over Naive's agent filesystem (EE-122): a deep agent's ls, read, write, edit, glob and grep
// become Naive router calls, so its files are the venture's records and every write meets the schema, the gate,
// decision rights and provenance. A gated write is held as a draft, and the agent is told the record did not change.
// Given the NaiveTracer of the run, each operation's span hangs from the tool call that made it, and a provenance
// line written by it names that span (EE-121).
//
//   const tracer = new NaiveTracer(ventureDir, { session });
//   const agent = createDeepAgent({ model, backend: new NaiveBackend({ venture: "kettle" }, tracer), ... });
//   await agent.invoke(input, { callbacks: [tracer] });

import { AsyncLocalStorageProviderSingleton } from "@langchain/core/singletons";
import type { BackendProtocolV2, EditResult, FileInfo, GlobResult, GrepResult, LsResult, ReadRawResult, ReadResult, WriteResult } from "deepagents";
import { spans } from "naive-framework/src/core/instrumentation.mjs";
import * as files from "naive-framework/src/router/agent-files.mjs";
import type { Context } from "naive-framework/src/router/agent-files.mjs";
import { tagSpan, type NaiveTracer } from "./naive-tracer.ts";

type Outcome = "held" | "refused" | "written";
type RouterWrite = { ok: boolean, draft?: boolean, written?: string, error?: string };

const bareRoute = (route: string): string => route.replace(/^\/+|\/+$/g, "");
const outcomeOf = (w: RouterWrite): Outcome => w.draft ? "held" : w.ok ? "written" : "refused";

const info = (f: { path: string, is_dir: boolean }): FileInfo => ({ path: f.path, is_dir: f.is_dir });
// deepagents tells the model only "Successfully wrote" on success, so a draft goes back as the tool's error text:
// the record is unchanged until a person accepts it, and the model has to know that.
const held = (path: string, r: { written?: string, note?: string }): string =>
  `Held for a person: ${path} was not changed. Your version is a draft${r.written ? ` (${r.written})` : ""} that a person must accept.${r.note ? ` ${r.note}` : ""}`;

export class NaiveBackend implements BackendProtocolV2 {
  ctx: Context;
  tracer?: NaiveTracer;

  constructor(ctx: Context, tracer?: NaiveTracer) {
    this.ctx = { via: "deepagents", ...ctx };
    this.tracer = tracer;
  }

  /**
   * Runs one Naive operation under the span of the LangChain tool call that made it. Naive reads the parent span
   * once, synchronously, as the operation starts, so the env is set for that moment only and restored before any await.
   */
  under<T>(fn: () => Promise<T>): Promise<T> {
    const config = AsyncLocalStorageProviderSingleton.getRunnableConfig() as { callbacks?: { getParentRunId?: () => string | undefined } } | undefined;
    const span = this.tracer?.contextOf(config?.callbacks?.getParentRunId?.());
    if (!span) return fn();
    const keys = ["MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION"] as const;
    const saved = keys.map((k) => process.env[k]);
    process.env.MENTURA_TRACE_ID = span.trace_id; process.env.MENTURA_SPAN_ID = span.span_id; process.env.MENTURA_SESSION = span.session;
    try { return fn(); }
    finally { keys.forEach((k, i) => { if (saved[i] === undefined) delete process.env[k]; else process.env[k] = saved[i]; }); }
  }

  /** The router span is already in the trace file. Patch the last untagged write for this route, then rehash the tail. */
  tagWrite(filePath: string, w: RouterWrite): void {
    const tracer = this.tracer;
    if (!tracer) return;
    const route = bareRoute(filePath);
    const list = spans(tracer.dir, tracer.session) as { span_id?: unknown, kind?: unknown, attributes?: Record<string, unknown> }[];
    let spanId = "";
    for (const s of list) {
      const attrs = s.attributes ?? {};
      if (s.kind !== "call" || attrs["naive.action"] !== "write" || attrs["naive.outcome"] != null) continue;
      if (bareRoute(String(attrs["naive.route"] ?? "")) !== route) continue;
      if (typeof s.span_id === "string") spanId = s.span_id;
    }
    if (!spanId) return;
    const outcome = outcomeOf(w);
    const venture = this.ctx.venture;
    tagSpan(tracer.dir, tracer.session, spanId, (span) => {
      const current = span.attributes;
      const attrs: Record<string, unknown> = current !== null && typeof current === "object" && !Array.isArray(current) ? { ...current } : {};
      attrs["naive.outcome"] = outcome;
      if (outcome === "held") {
        attrs["naive.draft"] = typeof w.written === "string" ? w.written : route;
        attrs["naive.accept"] = `mentura accept ${route} --venture ${venture}`;
      }
      if (outcome === "refused" && typeof w.error === "string") span.error = w.error;
      span.attributes = attrs;
    });
  }

  async ls(path: string): Promise<LsResult> {
    try { return { files: (await this.under(() => files.ls(this.ctx, path))).map(info) }; } catch (e) { return { error: String((e as Error).message ?? e) }; }
  }

  async read(filePath: string, offset = 0, limit = 500): Promise<ReadResult> {
    const r = await this.under(() => files.readRaw(this.ctx, filePath));
    if (!r.ok || r.content === undefined) return { error: r.error ?? `File '${filePath}' not found` };
    const lines = r.content.replace(/\n$/, "").split("\n");
    const selected = lines.slice(offset, offset + limit);
    const end = Math.min(offset + selected.length, lines.length);
    return { content: selected.join("\n"), mimeType: "application/json", totalLines: lines.length, startLine: offset + 1, endLine: end, nextOffset: end < lines.length ? end : undefined };
  }

  async readRaw(filePath: string): Promise<ReadRawResult> {
    const r = await this.under(() => files.readRaw(this.ctx, filePath));
    if (!r.ok || r.content === undefined) return { error: r.error ?? `File '${filePath}' not found` };
    const now = new Date().toISOString();
    return { data: { content: r.content, mimeType: "application/json", created_at: now, modified_at: now } };
  }

  async write(filePath: string, content: string): Promise<WriteResult> {
    const w = await this.under(() => files.write(this.ctx, filePath, content));
    this.tagWrite(filePath, w);
    if (!w.ok) return { error: w.error ?? "not written" };
    if (w.draft) return { error: held(w.path, w) };
    return { path: w.path, filesUpdate: null, metadata: { naive: { written: w.written, draft: !!w.draft, ...(w.note ? { note: w.note } : {}) } } };
  }

  async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
    const e = await this.under(() => files.edit(this.ctx, filePath, oldString, newString, replaceAll));
    this.tagWrite(filePath, e);
    if (!e.ok) return { error: e.error ?? "not edited" };
    if (e.draft) return { error: held(e.path, e) };
    return { path: e.path, filesUpdate: null, occurrences: e.occurrences, metadata: { naive: { written: e.written, draft: !!e.draft, ...(e.note ? { note: e.note } : {}) } } };
  }

  async glob(pattern: string, path = "/"): Promise<GlobResult> {
    try { return { files: (await this.under(() => files.glob(this.ctx, pattern, path))).map(info) }; } catch (e) { return { error: String((e as Error).message ?? e) }; }
  }

  async grep(pattern: string, path?: string | null, glob?: string | null, maxCount?: number | null): Promise<GrepResult> {
    // deepagents searches for literal text; Naive's grep takes a regular expression, so the text is escaped.
    const r = await this.under(() => files.grep(this.ctx, pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), path ?? "/", glob ?? undefined));
    if (typeof r === "string") return { error: r };
    const capped = maxCount ? r.slice(0, maxCount) : r;
    return { matches: capped, ...(maxCount && r.length > maxCount ? { truncated: true } : {}) };
  }
}
