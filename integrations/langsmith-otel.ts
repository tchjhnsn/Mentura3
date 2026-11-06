// Ships a venture's trace files to LangSmith when online (EE-121, EE-041). The files in <venture>/traces/ stay
// the record: this reads each session's spans, sends the ones not yet sent as OpenTelemetry (OTLP/HTTP, JSON
// encoding) to LangSmith's OTel endpoint, and remembers in .naive/langsmith-sync.json the hash of the last span
// LangSmith accepted, so a run offline sends nothing and the next run online sends what is pending, once. Spans keep
// only what the venture allowed when they were written (inputs and outputs only with traces.content), and this adds
// nothing. Only this side names the vendor and the key.
//
//   LANGSMITH_API_KEY=... node --import ./scripts/naive-ts.ts platform/integrations/langsmith-otel.ts <venture dir> [--project <name>] [--dry-run]
//
// Exits 3 when LANGSMITH_API_KEY is not set (the spans stay pending), 0 when it sent or when it could not reach
// LangSmith (offline: the spans stay pending), 1 when LangSmith refused a batch.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { sessions, spans } from "naive-framework/src/core/instrumentation.mjs";
import type { TraceSpan } from "naive-framework/src/records/types/records.d.ts";

const SYNC = ".naive/langsmith-sync.json";
type Value = { stringValue: string } | { intValue: string } | { doubleValue: number } | { boolValue: boolean };
export interface OtlpSpan { traceId: string, spanId: string, parentSpanId?: string, name: string, kind: number, startTimeUnixNano: string, endTimeUnixNano: string, attributes: { key: string, value: Value }[], status: { code: number, message?: string } }
export interface Result { session: string, sent: number, pending: number, error?: string, offline?: boolean }

const hex = (s: string, n: number): string => { const h = s.replace(/-/g, "").toLowerCase(); return /^[0-9a-f]+$/.test(h) && h.length === n ? h : createHash("sha256").update(s).digest("hex").slice(0, n); };
const nanos = (iso: string): string => (BigInt(Date.parse(iso)) * 1000000n).toString();
const value = (v: unknown): Value => typeof v === "boolean" ? { boolValue: v } : typeof v === "number" ? (Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v }) : { stringValue: typeof v === "string" ? v : JSON.stringify(v) };
const RUN_TYPE: Record<string, string> = { agent: "chain", model: "llm", tool: "tool", call: "retriever", judgment: "llm", trigger: "chain" };

/** One Naive span as an OTLP span. Span ids become 16 hex characters (a hash when they are not), parents likewise. */
export function toOtlp(s: TraceSpan): OtlpSpan {
  const attrs: Record<string, unknown> = { ...(s.attributes ?? {}), "langsmith.span.kind": RUN_TYPE[s.kind] ?? "chain", "naive.kind": s.kind, "naive.span_id": s.span_id, "naive.trace_id": s.trace_id, "naive.hash": s.hash };
  return {
    traceId: hex(s.trace_id, 32), spanId: hex(s.span_id, 16), ...(s.parent_span_id ? { parentSpanId: hex(s.parent_span_id, 16) } : {}),
    name: s.name, kind: s.kind === "model" || s.kind === "call" ? 3 : 1, startTimeUnixNano: nanos(s.start), endTimeUnixNano: nanos(s.end),
    attributes: Object.entries(attrs).filter(([, v]) => v !== undefined && v !== null).map(([key, v]) => ({ key, value: value(v) })),
    status: s.status === "error" ? { code: 2, ...(s.error ? { message: s.error } : {}) } : { code: 1 },
  };
}

/** The OTLP/HTTP JSON body for one session's spans. */
export function body(venture: string, session: string, list: TraceSpan[]): unknown {
  return { resourceSpans: [{ resource: { attributes: [{ key: "service.name", value: { stringValue: "mentura" } }, { key: "naive.venture", value: { stringValue: venture } }, { key: "naive.session", value: { stringValue: session } }] },
    scopeSpans: [{ scope: { name: "naive-framework", version: "EE-121" }, spans: list.map(toOtlp) }] }] };
}

const readSync = (dir: string): Record<string, string> => { const f = join(dir, SYNC); try { return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) as Record<string, string> : {}; } catch { return {}; } };

/** The spans of a session LangSmith has not accepted yet: those after the last hash it accepted. */
export function pending(dir: string, session: string): TraceSpan[] {
  const list = spans(dir, session) as TraceSpan[];
  const last = readSync(dir)[session];
  const at = last ? list.findIndex((s) => s.hash === last) : -1;
  return list.slice(at + 1);
}

/** Sends each session's pending spans; a session is marked sent only up to the batch LangSmith accepted. */
export async function sync(dir: string, opts: { endpoint?: string, key: string, project?: string, venture?: string, fetcher?: typeof fetch, dryRun?: boolean }): Promise<Result[]> {
  const endpoint = (opts.endpoint ?? process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com").replace(/\/$/, "");
  const venture = opts.venture ?? (() => { try { return (JSON.parse(readFileSync(join(dir, "venture.json"), "utf8")) as { id?: string }).id ?? "venture"; } catch { return "venture"; } })();
  const f = opts.fetcher ?? fetch;
  const out: Result[] = [];
  for (const session of sessions(dir) as string[]) {
    const list = pending(dir, session);
    if (!list.length) { out.push({ session, sent: 0, pending: 0 }); continue; }
    if (opts.dryRun) { out.push({ session, sent: 0, pending: list.length }); continue; }
    let res: Response;
    try {
      res = await f(`${endpoint}/otel/v1/traces`, { method: "POST", headers: { "content-type": "application/json", "x-api-key": opts.key, ...(opts.project ? { "Langsmith-Project": opts.project } : {}) }, body: JSON.stringify(body(venture, session, list)) });
    } catch (e) { out.push({ session, sent: 0, pending: list.length, offline: true, error: String((e as Error).message ?? e) }); continue; }
    if (!res.ok) { out.push({ session, sent: 0, pending: list.length, error: `LangSmith answered ${res.status}: ${(await res.text()).slice(0, 300)}` }); continue; }
    const state = readSync(dir);
    state[session] = list[list.length - 1].hash;
    mkdirSync(join(dir, ".naive"), { recursive: true });
    writeFileSync(join(dir, SYNC), JSON.stringify(state, null, 2) + "\n");
    out.push({ session, sent: list.length, pending: 0 });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const d = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--project");
  if (!d) { console.error("usage: node --import ./scripts/naive-ts.ts platform/integrations/langsmith-otel.ts <venture dir> [--project <name>] [--dry-run]"); process.exit(2); }
  const dir = resolve(d);
  const i = args.indexOf("--project");
  const project = i >= 0 ? args[i + 1] : process.env.LANGSMITH_PROJECT;
  const dryRun = args.includes("--dry-run");
  const key = process.env.LANGSMITH_API_KEY;
  if (!key && !dryRun) { const n = (sessions(dir) as string[]).reduce((k, s) => k + pending(dir, s).length, 0); console.error(`LANGSMITH_API_KEY is not set: ${n} spans stay pending in traces/`); process.exit(3); }
  const results = await sync(dir, { key: key ?? "", project, dryRun });
  for (const r of results) console.log(`${r.session}  ${dryRun ? `${r.pending} pending` : r.offline ? `offline, ${r.pending} pending` : r.error ? `refused: ${r.error}` : `${r.sent} sent`}`);
  if (results.some((r) => r.error && !r.offline)) process.exit(1);
}
