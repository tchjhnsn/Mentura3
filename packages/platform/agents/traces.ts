// A local reading of one venture's trace files. Spans stay in <venture>/traces/<session>.jsonl.
// Drafts are the provenance lines with activity draft that name a span in the run. Nothing is sent anywhere.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { entries } from "naive-framework/src/core/provenance.mjs";
import { sessions, spans } from "naive-framework/src/core/instrumentation.mjs";

export interface ToolCall { readonly name: string, readonly status: string, readonly path?: string }
export interface GatedWrite { readonly route: string, readonly ok: boolean }
export interface HeldDraft { readonly entity: string, readonly route?: string, readonly span_id?: string }
export interface RunView {
  readonly trace_id: string,
  readonly name: string,
  readonly status: string,
  readonly start: string,
  readonly end: string,
  readonly spans: Readonly<Record<string, number>>,
  readonly tools: readonly ToolCall[],
  readonly writes: readonly GatedWrite[],
  readonly drafts: readonly HeldDraft[],
}
export interface SessionView { readonly session: string, readonly runs: readonly RunView[] }
export interface TraceView { readonly venture: string, readonly sessions: readonly SessionView[] }

interface Span {
  trace_id: string, span_id: string, parent_span_id?: string, name: string, kind: string,
  start: string, end: string, status: string, attributes?: Record<string, unknown>,
}
interface ProvLine {
  activity?: string, entity?: string, route?: string,
  span?: { trace_id?: string, span_id?: string },
  agent?: { session?: string },
}

const text = (v: unknown): string | undefined => typeof v === "string" && v ? v : undefined;
const flag = (v: unknown): boolean => v === true;

/** One venture's traces, oldest run first. session and trace narrow it. An empty traces folder is an empty list. */
export function traceView(dir: string, opts: { session?: string, trace?: string } = {}): TraceView {
  const lines = entries(dir) as ProvLine[];
  const names = sessions(dir).filter((s) => !opts.session || s === opts.session);
  const sessionsOut: SessionView[] = names.map((session) => {
    const list = spans(dir, session) as Span[];
    const ids = [...new Set(list.map((s) => s.trace_id))];
    const runs = ids.map((id) => runOf(id, list.filter((s) => s.trace_id === id), lines, session, ids.length === 1))
      .filter((r) => !opts.trace || r.trace_id === opts.trace)
      .sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
    return { session, runs };
  }).filter((s) => !opts.trace || s.runs.length > 0);
  return { venture: ventureId(dir), sessions: sessionsOut };
}

function ventureId(dir: string): string {
  try {
    const id = (JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")) as { id?: string }).id;
    return id || dir;
  } catch { return dir; }
}

function runOf(trace_id: string, list: Span[], lines: ProvLine[], session: string, only: boolean): RunView {
  const agent = list.find((s) => s.kind === "agent" && !s.parent_span_id) ?? list.find((s) => s.kind === "agent") ?? list[0];
  const spanIds = new Set(list.map((s) => s.span_id));
  const counts: Record<string, number> = {};
  for (const s of list) counts[s.kind] = (counts[s.kind] ?? 0) + 1;
  const tools: ToolCall[] = list.filter((s) => s.kind === "tool").map((s) => {
    const path = text(s.attributes?.["naive.path"]);
    return { name: text(s.attributes?.["gen_ai.tool.name"]) ?? s.name, status: s.status, ...(path ? { path } : {}) };
  });
  const writes: GatedWrite[] = list.filter((s) => s.kind === "call" && (s.attributes?.["naive.action"] === "write" || s.attributes?.["naive.action"] === "append"))
    .map((s) => ({ route: text(s.attributes?.["naive.route"]) ?? s.name, ok: flag(s.attributes?.["naive.ok"]) }));
  const drafts: HeldDraft[] = lines.filter((e) => e.activity === "draft" && (
    e.span?.trace_id === trace_id || (e.span?.span_id !== undefined && spanIds.has(e.span.span_id)) || (only && !e.span?.trace_id && e.agent?.session === session)
  )).map((e) => ({ entity: e.entity ?? "", ...(e.route ? { route: e.route } : {}), ...(e.span?.span_id ? { span_id: e.span.span_id } : {}) }));
  const start = list.map((s) => s.start).sort()[0] ?? "";
  const end = list.map((s) => s.end).sort().at(-1) ?? "";
  return { trace_id, name: agent?.name ?? "run", status: agent?.status ?? "ok", start, end, spans: counts, tools, writes, drafts };
}
