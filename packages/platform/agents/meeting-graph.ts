// The meeting graph: a LangGraph StateGraph that runs one meeting (Naive's meeting record, EE-200) item by item, in
// order, and stops for a person wherever an item needs one. The meeting record is the state a person and every agent
// can read; the checkpoint is only where the graph stopped. Each change to the meeting is written through Naive's
// router before the graph moves on, so a stop, a crash or a resume never loses a minute.
//
//   const graph = meetingGraph({ store, worker, checkpointer });
//   await graph.invoke({ meeting }, { configurable: { thread_id: meeting.id } });          // opens it, runs until a person is needed
//   await graph.invoke(new Command({ resume: { answer: "To teach founders to run a business with agents" } }), sameConfig);
//
// The statechart (states are the meeting's status, and inside open, the item being worked):
//
//   planned --(a prerequisite is missing)--> stays planned; nothing is written past the plan (fails closed)
//   planned --open--> open --(no item pending, none skipped)--> closed
//   open: pick the next pending item
//     item needs a person (ask)  --interrupt--> answer -> the owner works it -> done
//                                           \-> skip -> skipped     \-> handoff -> the owner recommends -> handed-off
//                                           \-> done <text> -> done (the person's words are the result)
//     an agent's item answered    -> the owner works it with the answer -> in review
//     item needs no person       -> the owner works it -> in review (a failed run leaves it skipped, with the error)
//   in review: what the agent drafted is presented, with a print copy --interrupt--> approve -> held drafts accepted -> done
//                                                                    \-> rework <note> -> the owner works it again -> in review
//   An agent's work is never done until a person approves it; an approval that cannot accept a draft stays in review.
//   open, nothing pending, something skipped --interrupt--> revisit <ids> -> those items pending again
//                                                       \-> handoff <ids> -> each owner recommends -> handed-off
//                                                       \-> end -> closed (partly or no)
//   any interrupt --abandon--> abandoned
//
// A person answers at most once per interrupt. Nothing here calls a model: the worker does (meeting-worker.ts runs the
// item's owner as a function agent), and the outcome and takeaways at close are derived (closeOf in meetings.ts).

import { Annotation, END, interrupt, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import { closeOf, type AgendaItem, type Meeting, type MeetingStore } from "./meetings.ts";
import type { Missing } from "./prerequisites.ts";

/** Thrown when a meeting's workflow is locked: the meeting stays planned and nothing past the plan is written. */
export class Blocked extends Error {
  readonly missing: Missing[];
  constructor(workflow: string, missing: Missing[]) {
    super(`${workflow} is locked until: ${missing.map((m) => `${m.kind} ${m.what} (${m.fix})`).join("; ")}`);
    this.name = "Blocked";
    this.missing = missing;
  }
}

/** What a person says when the graph stops on an item. */
export type ItemAnswer =
  | { answer: string, by?: string }
  | { skip: true, by?: string, why?: string }
  | { handoff: true, by?: string }
  | { done: string, by?: string }
  | { abandon: true, by?: string, why?: string };

/** What a person says when an agent's work is presented for approval. confirm names the foundation records accepted. */
export type ReviewAnswer =
  | { approve: true, by?: string, confirm?: string[] }
  | { rework: string, by?: string }
  | { abandon: true, by?: string, why?: string };

/** What a person says when the graph stops to loop back over skipped items. */
export type LoopAnswer =
  | { revisit: string[], by?: string }
  | { handoff: string[], by?: string }
  | { end: true, by?: string }
  | { abandon: true, by?: string, why?: string };

/** What the graph asks when it stops. A caller shows it and resumes with the matching answer. */
export type Question =
  | { kind: "item", meeting: string, item: AgendaItem, ask: string, options: ["answer", "skip", "handoff", "done", "abandon"] }
  | { kind: "loop", meeting: string, skipped: AgendaItem[], ask: string, options: ["revisit", "handoff", "end", "abandon"] }
  | { kind: "review", meeting: string, item: AgendaItem, drafted: string[], held: string[], copy: string | null, ask: string, options: ["approve", "rework", "abandon"] };

/** What working an item produced. */
export interface Worked { result: string, writes?: string[], decisions?: string[], held?: string[] }

/** Who does the work. The production worker runs the item's owner as a function agent (meeting-worker.ts). */
export interface Worker {
  work(m: Meeting, item: AgendaItem, answer: string | null, attempt: number): Promise<Worked>,
  recommend(m: Meeting, item: AgendaItem, attempt: number): Promise<{ recommendation: string, decisions?: string[] }>,
}

export interface Deps {
  store: MeetingStore,
  worker: Worker,
  checkpointer: BaseCheckpointSaver,
  /**
   * What the meeting's workflow still needs before it may open. Required, so no caller runs a meeting without the
   * check; a meeting with no workflow answers []. Anything returned keeps the meeting planned.
   */
  prerequisites: (m: Meeting) => Promise<Missing[]>,
  /** Accepts the drafts an item's agent left held, once a person approves. Without it, an item with held drafts cannot be approved. */
  approve?: (m: Meeting, item: AgendaItem, held: string[], by: string, confirm: string[]) => Promise<string[]>,
  /** Writes a print copy of what an item drafted, for the person to read before approving, and answers its path. */
  present?: (m: Meeting, item: AgendaItem, drafted: string[]) => Promise<string | null>,
  /** Called once a meeting closes, after its record is written: the host logs the workflow's run in Naive's run log. */
  closed?: (m: Meeting) => Promise<void>,
  /** Who the meeting's minutes name for the facilitator's own notes. */
  facilitator?: string,
  now?: () => string,
}

const State = Annotation.Root({
  meeting: Annotation<Meeting>({ reducer: (_a, b) => b }),
  current: Annotation<string | null>({ reducer: (_a, b) => b, default: () => null }),
  answer: Annotation<ItemAnswer | null>({ reducer: (_a, b) => b, default: () => null }),
  loopAnswer: Annotation<LoopAnswer | null>({ reducer: (_a, b) => b, default: () => null }),
  /** How many times each item was worked, so a revisited item's run gets a new run id. */
  attempts: Annotation<Record<string, number>>({ reducer: (_a, b) => b, default: () => ({}) }),
  /** The item whose agent work waits for a person's approval, what it drafted, what the gate held and the print copy. */
  inReview: Annotation<{ item: string, drafted: string[], held: string[], copy: string | null } | null>({ reducer: (_a, b) => b, default: () => null }),
  reviewAnswer: Annotation<ReviewAnswer | null>({ reducer: (_a, b) => b, default: () => null }),
});
type S = typeof State.State;

const pending = (m: Meeting): AgendaItem | undefined => m.agenda.find((i) => i.status === "pending");
const skipped = (m: Meeting): AgendaItem[] => m.agenda.filter((i) => i.status === "skipped");
const needsPerson = (i: AgendaItem): boolean => i.ask === true || !i.owner?.endsWith("-agent");
const setItem = (m: Meeting, id: string, patch: Partial<AgendaItem>): Meeting => ({ ...m, agenda: m.agenda.map((i) => i.id === id ? { ...i, ...patch } : i) });
const note = (m: Meeting, at: string, by: string, text: string, item?: string): Meeting => ({ ...m, minutes: [...(m.minutes ?? []), { at, by, text, ...(item ? { item } : {}) }] });
const merge = (a: string[] | undefined, b: string[] | undefined): string[] | undefined => { const all = [...new Set([...(a ?? []), ...(b ?? [])])]; return all.length ? all : undefined; };

/** Builds the graph. Nothing runs until invoke; the thread id is the meeting id. */
export function meetingGraph(deps: Deps) {
  const now = deps.now ?? (() => new Date().toISOString());
  const fac = deps.facilitator ?? "meeting-facilitator";
  const save = async (m: Meeting): Promise<Meeting> => { await deps.store.write(m); return m; };

  const work = async (s: S, item: AgendaItem, answer: string | null): Promise<Partial<S>> => {
    const attempt = (s.attempts[item.id] ?? 0) + 1;
    let m = s.meeting;
    try {
      const w = await deps.worker.work(m, item, answer, attempt);
      const drafted = w.writes ?? [];
      m = setItem(m, item.id, { result: w.result, writes: merge(item.writes, w.writes), decisions: merge(item.decisions, w.decisions) });
      const copy = deps.present ? await deps.present(m, m.agenda.find((i) => i.id === item.id) as AgendaItem, drafted).catch(() => null) : null;
      m = note(m, now(), item.owner ?? fac, `Presented for approval: ${w.result}${copy ? ` (print copy ${copy})` : ""}`, item.id);
      return { meeting: await save(m), current: null, answer: null, attempts: { ...s.attempts, [item.id]: attempt }, inReview: { item: item.id, drafted, held: w.held ?? [], copy }, reviewAnswer: null };
    }
    catch (e) {
      const error = String((e as Error)?.message ?? e);
      m = note(setItem(m, item.id, { status: "skipped", result: `not worked: ${error}` }), now(), fac, `${item.id} could not be worked and is skipped to loop back to: ${error}`, item.id);
    }
    return { meeting: await save(m), current: null, answer: null, attempts: { ...s.attempts, [item.id]: attempt }, inReview: null, reviewAnswer: null };
  };

  const recommend = async (s: S, ids: string[], by: string): Promise<Partial<S>> => {
    let m = s.meeting;
    const attempts = { ...s.attempts };
    for (const id of ids) {
      const item = m.agenda.find((i) => i.id === id);
      if (!item) continue;
      attempts[id] = (attempts[id] ?? 0) + 1;
      const handedTo = item.owner?.endsWith("-agent") ? item.owner : (m.attendees.find((a) => a.kind === "agent")?.id ?? fac);
      try {
        const r = await deps.worker.recommend(m, { ...item, owner: handedTo }, attempts[id]);
        m = note(setItem(m, id, { status: "handed-off", handed_to: handedTo, recommendation: r.recommendation, decisions: merge(item.decisions, r.decisions) }), now(), handedTo, `Recommends: ${r.recommendation}`, id);
      }
      catch (e) {
        m = note(setItem(m, id, { status: "skipped", result: `no recommendation: ${String((e as Error)?.message ?? e)}` }), now(), fac, `${id} was handed to ${handedTo}, who could not recommend; it stays skipped`, id);
      }
      m = note(m, now(), by, `Handed ${id} to ${handedTo}`, id);
    }
    return { meeting: await save(m), current: null, answer: null, loopAnswer: null, attempts };
  };

  return new StateGraph(State)
    .addNode("open", async (s: S) => {
      if (s.meeting.status !== "planned") return {};
      const missing = await deps.prerequisites(s.meeting);
      if (missing.length) throw new Blocked(s.meeting.workflow ?? s.meeting.id, missing);
      const at = now();
      return { meeting: await save(note({ ...s.meeting, status: "open", opened_at: at }, at, fac, `Opened. Goal: ${s.meeting.goal}`)) };
    })
    .addNode("pick", async (s: S) => ({ current: pending(s.meeting)?.id ?? null }))
    .addNode("ask", async (s: S) => {
      const item = s.meeting.agenda.find((i) => i.id === s.current);
      if (!item) return {};
      const q: Question = { kind: "item", meeting: s.meeting.id, item, ask: item.title, options: ["answer", "skip", "handoff", "done", "abandon"] };
      return { answer: interrupt(q) as ItemAnswer };
    })
    .addNode("work", async (s: S) => {
      const item = s.meeting.agenda.find((i) => i.id === s.current);
      if (!item) return { current: null };
      const a = s.answer;
      const by = a?.by ?? s.meeting.called_by;
      if (a && "skip" in a) return { meeting: await save(note(setItem(s.meeting, item.id, { status: "skipped", ...(a.why ? { result: `skipped: ${a.why}` } : {}) }), now(), by, `Skipped ${item.id}${a.why ? `: ${a.why}` : ""}`, item.id)), current: null, answer: null };
      if (a && "done" in a) return { meeting: await save(note(setItem(s.meeting, item.id, { status: "done", result: a.done }), now(), by, a.done, item.id)), current: null, answer: null };
      if (a && "handoff" in a) return recommend(s, [item.id], by);
      if (a && "answer" in a) {
        const m = note(s.meeting, now(), by, a.answer, item.id);
        // An item a person owns is done with the person's words; an agent's item is worked with them.
        if (!item.owner?.endsWith("-agent")) return { meeting: await save(setItem(m, item.id, { status: "done", result: a.answer })), current: null, answer: null };
        return work({ ...s, meeting: m }, item, a.answer);
      }
      return work(s, item, null);
    })
    .addNode("review", async (s: S) => {
      const r = s.inReview;
      const item = s.meeting.agenda.find((i) => i.id === r?.item);
      if (!r || !item) return { inReview: null };
      const q: Question = { kind: "review", meeting: s.meeting.id, item, drafted: r.drafted, held: r.held, copy: r.copy,
        ask: `${item.owner ?? "The agent"} drafted this for ${item.id}. Approve it to go on, or say what to rework.`, options: ["approve", "rework", "abandon"] };
      return { reviewAnswer: interrupt(q) as ReviewAnswer };
    })
    .addNode("decide", async (s: S) => {
      const r = s.inReview, a = s.reviewAnswer;
      const item = s.meeting.agenda.find((i) => i.id === r?.item);
      if (!r || !item || !a || "abandon" in a) return {};
      const by = a.by ?? s.meeting.called_by;
      if ("rework" in a) return work({ ...s, meeting: note(s.meeting, now(), by, `Rework: ${a.rework}`, item.id) }, item, a.rework);
      try {
        if (r.held.length && !deps.approve) throw new Error(`${r.held.join(", ")} ${r.held.length > 1 ? "are" : "is"} held and nothing here can accept drafts`);
        const accepted = r.held.length && deps.approve ? await deps.approve(s.meeting, item, r.held, by, a.confirm ?? []) : [];
        const m = note(setItem(s.meeting, item.id, { status: "done" }), now(), by, `Approved${accepted.length ? `; accepted ${accepted.join(", ")}` : ""}`, item.id);
        return { meeting: await save(m), inReview: null, reviewAnswer: null };
      }
      catch (e) {
        return { meeting: await save(note(s.meeting, now(), fac, `Not approved yet: ${String((e as Error)?.message ?? e)}`, item.id)), reviewAnswer: null };
      }
    })
    .addNode("loop", async (s: S) => {
      const q: Question = { kind: "loop", meeting: s.meeting.id, skipped: skipped(s.meeting), ask: "These items were skipped. Revisit some now, hand them to their agent to recommend, or end the meeting.", options: ["revisit", "handoff", "end", "abandon"] };
      return { loopAnswer: interrupt(q) as LoopAnswer };
    })
    .addNode("apply", async (s: S) => {
      const a = s.loopAnswer;
      if (!a || "end" in a || "abandon" in a) return {};
      const by = a.by ?? s.meeting.called_by;
      if ("handoff" in a) return recommend(s, a.handoff, by);
      let m = s.meeting;
      for (const id of a.revisit) m = setItem(m, id, { status: "pending" });
      return { meeting: await save(note(m, now(), by, `Looping back to ${a.revisit.join(", ")}`)), loopAnswer: null };
    })
    .addNode("close", async (s: S) => {
      const at = now();
      const by = (s.loopAnswer && "by" in s.loopAnswer ? s.loopAnswer.by : undefined) ?? s.meeting.called_by;
      const m = await save(note({ ...s.meeting, status: "closed" as const, closed_at: at, ...closeOf(s.meeting) }, at, by, `Closed. ${closeOf(s.meeting).outcome?.summary ?? ""}`));
      await deps.closed?.(m);
      return { meeting: m, loopAnswer: null };
    })
    .addNode("abandon", async (s: S) => {
      const a = (s.answer ?? s.loopAnswer ?? s.reviewAnswer) as { by?: string, why?: string } | null;
      const at = now();
      const m = { ...s.meeting, status: "abandoned" as const, closed_at: at };
      return { meeting: await save(note(m, at, a?.by ?? s.meeting.called_by, `Abandoned${a?.why ? `: ${a.why}` : ""}`)), answer: null, loopAnswer: null, reviewAnswer: null, inReview: null, current: null };
    })
    .addEdge(START, "open")
    .addConditionalEdges("open", (s: S) => s.meeting.status === "open" ? "pick" : END, ["pick", END])
    .addConditionalEdges("pick", (s: S) => {
      if (s.current) return needsPerson(s.meeting.agenda.find((i) => i.id === s.current) as AgendaItem) ? "ask" : "work";
      return skipped(s.meeting).length ? "loop" : "close";
    }, ["ask", "work", "loop", "close"])
    .addConditionalEdges("ask", (s: S) => s.answer && "abandon" in s.answer ? "abandon" : "work", ["work", "abandon"])
    .addConditionalEdges("work", (s: S) => s.inReview ? "review" : "pick", ["review", "pick"])
    .addConditionalEdges("review", (s: S) => s.reviewAnswer && "abandon" in s.reviewAnswer ? "abandon" : s.inReview ? "decide" : "pick", ["decide", "abandon", "pick"])
    .addConditionalEdges("decide", (s: S) => s.inReview ? "review" : "pick", ["review", "pick"])
    .addConditionalEdges("loop", (s: S) => {
      const a = s.loopAnswer;
      if (a && "abandon" in a) return "abandon";
      if (!a || "end" in a) return "close";
      return "apply";
    }, ["apply", "close", "abandon"])
    .addEdge("apply", "pick")
    .addEdge("close", END)
    .addEdge("abandon", END)
    .compile({ checkpointer: deps.checkpointer, name: "meeting" });
}

/** The question a stopped meeting waits on, from a graph result's __interrupt__, or null when it ran to the end. */
export function questionOf(out: unknown): Question | null {
  const list = (out as { __interrupt__?: { value: unknown }[] }).__interrupt__;
  return list?.length ? list[0].value as Question : null;
}
