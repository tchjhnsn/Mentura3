// The triage graph (Naive docs/design/RAW_TRIAGE_2026-11-09.md, item 4): a fixed LangGraph flow over one raw entry.
// load, ask Jev, decide in Naive's code, hold for the founder when a label is unsure, file, route. Jev only answers
// Noul and Score questions; every decision is naive-framework/src/engine/triage.ts (decide) and route-task.ts.
//
//   const graph = triageGraph({ load, write, jev, checkpointer, line, routeContext })
//   await graph.invoke({ entry: { tenant, path } }, { configurable: { thread_id: `${tenant}:${path}` } })
//   // held: the result carries __interrupt__ with the questions; resume with
//   await graph.invoke(new Command({ resume: { "kind:idea": true, ... } }), sameConfig)
//
// The flow is fixed, so it is a StateGraph, not a deep agent (agent stack decision 2026-11-06). Checkpoints are the
// checkpointer's: LangGraph's Postgres checkpointer on the tenant's Neon database in production, MemorySaver in tests.
// With no Jev (no key), or Jev failing, every label is held for the founder; nothing falls back to another model.

import { Annotation, Command, END, interrupt, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import { decide, request, type Answers, type Context, type Decision, type Entry } from "naive-framework/src/engine/triage.ts";
import { routeTask, type Context as RouteContext, type Routed } from "naive-framework/src/engine/route-task.ts";
import type { JevReply, JevRequest } from "./jev.ts";

export interface RawRef { tenant: string, path: string }
export interface Loaded { entry: Entry, context: Context, person: string }
export interface Writer { write(path: string, content: string): Promise<{ ok: boolean, draft?: boolean, error?: string }> }
export interface JevLike { invoke(req: JevRequest): Promise<JevReply> }
/** A founder's answers to held labels: true or false for a Noul (or a probability), keyed as the question was. */
export type Resolution = Record<string, boolean | number>;
export interface Correction { key: string, guess: number | null, answer: number }

export interface Deps {
  load(ref: RawRef): Promise<Loaded>
  writer: Writer
  /** Null when no key is set. */
  jev: JevLike | null
  checkpointer: BaseCheckpointSaver
  /** The triage-accept line (lineFor in triage.ts reads the venture's detector). */
  line: number
  /** What route-task.ts needs: lead templates, plans and measures. */
  routeContext: RouteContext
  /** triage.confirm_all: hold every Noul label for the founder, sure or not. */
  confirmAll?: boolean
  now?: () => string
}

const State = Annotation.Root({
  ref: Annotation<RawRef>(),
  loaded: Annotation<Loaded | null>({ reducer: (_a, b) => b, default: () => null }),
  answers: Annotation<Answers>({ reducer: (_a, b) => b, default: () => ({}) }),
  model: Annotation<string | null>({ reducer: (_a, b) => b, default: () => null }),
  jevError: Annotation<string | null>({ reducer: (_a, b) => b, default: () => null }),
  decision: Annotation<Decision | null>({ reducer: (_a, b) => b, default: () => null }),
  /** Jev's labels as decide first read them, before any founder answer replaced them. */
  jevLabels: Annotation<Decision["labels"]>({ reducer: (_a, b) => b, default: () => [] }),
  corrections: Annotation<Correction[]>({ reducer: (_a, b) => b, default: () => [] }),
  filed: Annotation<string[]>({ reducer: (_a, b) => b, default: () => [] }),
  routed: Annotation<Routed[]>({ reducer: (_a, b) => b, default: () => [] }),
});
type S = typeof State.State;

const idOf = (path: string): string => path.match(/raw\/(?:dump\/([^/]+)\.md|sources\/([^/]+)\/text\.md)$/)?.slice(1).find(Boolean) ?? path.toLowerCase().replace(/[^a-z0-9-]/g, "-");
const asP = (v: boolean | number): number => typeof v === "boolean" ? (v ? 1 : 0) : Math.max(0, Math.min(1, v));

/** Builds the graph. Nothing runs until invoke. */
export function triageGraph(deps: Deps) {
  const now = deps.now ?? (() => new Date().toISOString());
  const decideNow = (s: S, answers: Answers) => {
    if (!s.loaded) throw new Error("decide before load");
    const d = decide(s.loaded.entry, answers, deps.line, s.loaded.context);
    if (!deps.confirmAll) return d;
    const held = [...new Set([...d.held, ...d.labels.filter((x) => x.kind === "noul").map((x) => x.key)])];
    return { ...d, held, filings: held.length ? [] : d.filings };
  };

  return new StateGraph(State)
    .addNode("load", async (s: S) => ({ loaded: await deps.load(s.ref) }))
    .addNode("ask", async (s: S) => {
      if (!s.loaded) throw new Error("ask before load");
      if (!deps.jev) return { answers: {}, model: null, jevError: "no Jev key: every label is held for the founder" };
      try {
        const r = await deps.jev.invoke(request(s.loaded.entry, s.loaded.context));
        return { answers: r.answers as Answers, model: r.model, jevError: null };
      } catch (e) {
        return { answers: {}, model: null, jevError: e instanceof Error ? e.message : String(e) };
      }
    })
    .addNode("decide", async (s: S) => {
      if (!s.loaded) throw new Error("decide before load");
      let d = decideNow(s, s.answers);
      if (s.jevError) {
        // Without answers, every question the request would ask is held.
        const keys = Object.keys(request(s.loaded.entry, s.loaded.context).questions).filter((k) => k !== "urgency");
        d = { ...d, held: keys, filings: [] };
      }
      return { decision: d, jevLabels: d.labels };
    })
    .addNode("hold", async (s: S) => {
      const d = s.decision;
      if (!d || !s.loaded) throw new Error("hold before decide");
      const guess = (k: string) => d.labels.find((x) => x.key === k)?.p ?? null;
      const resolved = interrupt({ raw: s.ref, questions: d.held.map((key) => ({ key, guess: guess(key) })) }) as Resolution;
      const answers: Answers = { ...s.answers };
      const corrections: Correction[] = [];
      for (const key of d.held) {
        const v = resolved?.[key];
        // A person's answer is a yes or a no; a probability given instead is read at one half. No answer takes Jev's guess.
        const answer = v === undefined ? ((guess(key) ?? 0) >= 0.5 ? 1 : 0) : (asP(v) >= 0.5 ? 1 : 0);
        answers[key] = answer;
        corrections.push({ key, guess: guess(key), answer });
      }
      // Every held label now has a person's yes or no, so each is sure at any line.
      return { answers, corrections, decision: decide(s.loaded.entry, answers, deps.line, s.loaded.context) };
    })
    .addNode("file", async (s: S) => {
      const d = s.decision, l = s.loaded;
      if (!d || !l) throw new Error("file before decide");
      const id = idOf(s.ref.path), at = now(), filed: string[] = [];
      const put = async (path: string, record: unknown) => {
        const r = await deps.writer.write(path, JSON.stringify(record, null, 2) + "\n");
        if (!r.ok) throw new Error(`could not file ${path}: ${r.error ?? "refused"}`);
        filed.push(path);
      };
      for (const f of d.filings) {
        if (f.kind === "idea") {
          const frag = d.fragments.find((x) => x.id === f.fragment);
          const ideaId = `${id}-${f.fragment}`;
          await put(`people/${l.person}/ideas/${ideaId}.json`, { id: ideaId, text: frag?.text ?? "", captured: at.slice(0, 10), source: s.ref.path, status: "open",
            ...(f.venture ? { ventures: [f.venture] } : {}), ...(f.builds_on ? { relations: [{ relation: "builds-on", to: f.builds_on }] } : {}) });
        } else {
          const src = l.entry.source ?? {};
          const url = typeof src.origin === "string" && /^https?:\/\//.test(src.origin) ? src.origin : undefined;
          await put(`people/${l.person}/references/${id}.json`, { id, type: "webpage", title: src.title ?? src.origin ?? id,
            ...(url ? { URL: url } : {}), added_by: { kind: "agent", id: "triage-agent" } });
        }
      }
      // The triage record (Naive triage.schema.json): Jev's labels as asked, a person's answer beside each held one.
      const answered = new Map(s.corrections.map((c) => [c.key, c.answer === 1]));
      const labels = s.jevLabels.map((x) => answered.has(x.key) ? { ...x, person: answered.get(x.key) } : x);
      const triage = { id, entry: s.ref.path, at, model: s.model, line: deps.line, labels, filed, held: [...answered.keys()],
        to_person: d.toPerson, status: answered.size ? "answered" : "filed", ...(s.jevError ? { note: `Jev was not reached: ${s.jevError}` } : {}) };
      const tr = await deps.writer.write(`raw/triage/${id}.json`, JSON.stringify(triage, null, 2) + "\n");
      if (!tr.ok) throw new Error(`could not write the triage record: ${tr.error ?? "refused"}`);
      return { filed };
    })
    .addNode("route", async (s: S) => {
      const d = s.decision;
      if (!d) throw new Error("route before decide");
      const routed = d.fragments.filter((f) => f.functions.length).map((f) =>
        d.toPerson ? { to: "person" as const, role: null, rule: 1 as const, why: "it may be a one-way door, so a person takes it" }
          : routeTask({ functions: f.functions }, deps.routeContext));
      return { routed };
    })
    .addEdge(START, "load")
    .addEdge("load", "ask")
    .addEdge("ask", "decide")
    .addConditionalEdges("decide", (s: S) => (s.decision?.held.length ? "hold" : "file"), ["hold", "file"])
    .addEdge("hold", "file")
    .addEdge("file", "route")
    .addEdge("route", END)
    .compile({ checkpointer: deps.checkpointer });
}

export { Command };
