// Slash commands: how a person, or any harness, starts and steers the business's agents. Each command is one line;
// parseCommand reads it (pure) and runCommand does it against one venture. A meeting is a LangGraph thread saved in
// <venture>/.naive/meeting-checkpoints.sqlite, so a meeting stopped for a person can be answered from another process,
// hours later, with the next command.
//
// Work fails closed: a meeting on a workflow whose prerequisites are not met (prerequisites.ts) does not open, for a
// person or an agent, and an agent's work on an item is not done until a person approves it (/approve).
//
//   /next                                      what is due now, most weighted first, each with its /meet command or what locks it
//   /meet <function> [<workflow>]              open a meeting that walks that workflow (default: what is due for the function, else intake)
//   /agenda <title> | <goal> | <outcome; ...> | <item; ask: item; item @finance; ...>
//                                              open a meeting with your own agenda (@<function> names an item's agent; ask: waits for you)
//   /answer <meeting> <text>                   answer the item the meeting is waiting on; its agent works it with your words
//   /approve <meeting> [<foundation route> ...] approve what the agent drafted for the waiting item; its held drafts are accepted in your name
//                                              (a foundation record is accepted only when you name it)
//   /rework <meeting> <what to change>         send the waiting item back to its agent with your note
//   /blocked [<function>]                      every workflow that is locked, and what must be finished first
//   /done <meeting> <text>                     mark the waiting item done with your words, no agent
//   /skip <meeting> [why]                      skip the waiting item, to loop back to
//   /handoff <meeting> [<item> ...]            hand the waiting item (or skipped items) to its agent to recommend
//   /revisit <meeting> [<item> ...]            loop back to skipped items (default: all of them)
//   /end <meeting>                             close a meeting that waits on its skipped items
//   /abandon <meeting> [why]                   end a meeting without an outcome
//   /meetings                                  every meeting, its status and what it waits on
//   /skipped                                   every skipped or handed-off item across meetings, with recommendations
//   /memory <role>                             what an agent remembers from closed meetings
//   /tools <need>                              the IT agent recommends a tool, by visibility and ownership first
//   /containers [<role>]                       the site agents the site's containers.json needs, and what each builds or owns
//   /site <role> <task>                        run a site agent on the site repository (locked like a workflow, as site/<role>)
//   /help

import { Command } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { freeMeeting, meetingFromWorkflow, meetingsIn, workflowOf, type Meeting, type MeetingStore } from "./meetings.ts";
import { Blocked, meetingGraph, questionOf, type ItemAnswer, type LoopAnswer, type Question, type ReviewAnswer, type Worker } from "./meeting-graph.ts";
import { memoryOf } from "./memory.ts";
import { explain, type Check } from "./prerequisites.ts";
import type { AgendaItem } from "./meetings.ts";
import { functionAgent, functionIds } from "./function-spec.ts";
import type { SiteRunResult } from "./site-run.ts";

export type SlashCommand =
  | { kind: "next" }
  | { kind: "meet", function: string, workflow?: string }
  | { kind: "agenda", title: string, goal: string, outcome: string[], items: { title: string, owner?: string, ask?: boolean }[] }
  | { kind: "answer", meeting: string, text: string }
  | { kind: "approve", meeting: string, confirm: string[] }
  | { kind: "rework", meeting: string, text: string }
  | { kind: "blocked", function?: string }
  | { kind: "done", meeting: string, text: string }
  | { kind: "skip", meeting: string, why?: string }
  | { kind: "handoff", meeting: string, items: string[] }
  | { kind: "revisit", meeting: string, items: string[] }
  | { kind: "end", meeting: string }
  | { kind: "abandon", meeting: string, why?: string }
  | { kind: "meetings" }
  | { kind: "skipped" }
  | { kind: "memory", role: string }
  | { kind: "tools", need: string }
  | { kind: "containers", role?: string }
  | { kind: "site", role: string, task: string }
  | { kind: "help" };

export const HELP = [
  "/next", "/meet <function> [<workflow>]", "/agenda <title> | <goal> | <outcome; ...> | <item; ask: item; item @function; ...>",
  "/answer <meeting> <text>", "/approve <meeting> [<foundation route> ...]", "/rework <meeting> <what to change>", "/blocked [<function>]", "/done <meeting> <text>", "/skip <meeting> [why]", "/handoff <meeting> [<item> ...]",
  "/revisit <meeting> [<item> ...]", "/end <meeting>", "/abandon <meeting> [why]", "/meetings", "/skipped", "/memory <role>", "/tools <need>", "/containers [<role>]", "/site <role> <task>", "/help",
].join("\n");

/** Parses one command line. Pure. Throws with the usage line on anything it cannot read. */
export function parseCommand(line: string): SlashCommand {
  const text = line.trim();
  const m = /^\/([a-z]+)\s*([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`a command starts with /, as in:\n${HELP}`);
  const [, name, rest] = m;
  const words = rest.split(/\s+/).filter(Boolean);
  const need = (n: number, usage: string): void => { if (words.length < n) throw new Error(`usage: ${usage}`); };
  const tail = (from: number): string => rest.trim().split(/\s+/).slice(from).join(" ");
  switch (name) {
    case "next": return { kind: "next" };
    case "help": return { kind: "help" };
    case "meetings": return { kind: "meetings" };
    case "skipped": return { kind: "skipped" };
    case "meet": need(1, "/meet <function> [<workflow>]"); return { kind: "meet", function: words[0], ...(words[1] ? { workflow: words[1] } : {}) };
    case "approve": need(1, "/approve <meeting> [<foundation route> ...]"); return { kind: "approve", meeting: words[0], confirm: words.slice(1) };
    case "rework": need(2, "/rework <meeting> <what to change>"); return { kind: "rework", meeting: words[0], text: rest.trim().slice(words[0].length).trim() };
    case "blocked": return { kind: "blocked", ...(words[0] ? { function: words[0] } : {}) };
    case "answer": need(2, "/answer <meeting> <text>"); return { kind: "answer", meeting: words[0], text: rest.trim().slice(words[0].length).trim() };
    case "done": need(2, "/done <meeting> <text>"); return { kind: "done", meeting: words[0], text: rest.trim().slice(words[0].length).trim() };
    case "skip": need(1, "/skip <meeting> [why]"); return { kind: "skip", meeting: words[0], ...(words[1] ? { why: tail(1) } : {}) };
    case "abandon": need(1, "/abandon <meeting> [why]"); return { kind: "abandon", meeting: words[0], ...(words[1] ? { why: tail(1) } : {}) };
    case "handoff": need(1, "/handoff <meeting> [<item> ...]"); return { kind: "handoff", meeting: words[0], items: words.slice(1) };
    case "revisit": need(1, "/revisit <meeting> [<item> ...]"); return { kind: "revisit", meeting: words[0], items: words.slice(1) };
    case "end": need(1, "/end <meeting>"); return { kind: "end", meeting: words[0] };
    case "memory": need(1, "/memory <role>"); return { kind: "memory", role: words[0] };
    case "tools": need(1, "/tools <need>"); return { kind: "tools", need: rest.trim() };
    case "containers": return { kind: "containers", ...(words[0] ? { role: words[0] } : {}) };
    case "site": need(2, "/site <role> <task>"); return { kind: "site", role: words[0], task: rest.trim().slice(words[0].length).trim() };
    case "agenda": {
      const parts = rest.split("|").map((p) => p.trim());
      if (parts.length !== 4 || parts.some((p) => !p)) throw new Error("usage: /agenda <title> | <goal> | <outcome; ...> | <item; ask: item; item @function; ...>");
      const list = (p: string): string[] => p.split(";").map((x) => x.trim()).filter(Boolean);
      const items = list(parts[3]).map((raw) => {
        const ask = /^ask:\s*/i.test(raw);
        const body = raw.replace(/^ask:\s*/i, "");
        const at = /\s@([a-z][a-z-]*)$/.exec(body);
        return { title: at ? body.slice(0, at.index).trim() : body, ...(at ? { owner: at[1] } : {}), ...(ask ? { ask: true } : {}) };
      });
      return { kind: "agenda", title: parts[0], goal: parts[1], outcome: list(parts[2]), items };
    }
    default: throw new Error(`no command /${name}. Commands:\n${HELP}`);
  }
}

/** What runCommand needs. Everything with a side effect is injected, so the commands test offline. */
export interface CommandContext {
  venture: string,
  dir: string,
  /** Who is speaking: a person's id. Names the minutes and calls new meetings. */
  person: string,
  store: MeetingStore,
  worker: Worker,
  checkpointer: BaseCheckpointSaver,
  /** What is due now, most weighted first (Naive's due, ranked by the phase's function weights). */
  due(): Promise<{ workflow: string, why: string }[]>,
  /** Whether a workflow may start now (prerequisites.ts). Required: no context runs meetings without it. */
  check(workflow: string): Promise<Check>,
  /** Every workflow of the business's functions, as <function>/<workflow>, for /blocked. */
  workflows(): string[],
  /** Accepts an approved item's held drafts in the person's name (review.ts). */
  approve?: (m: Meeting, item: AgendaItem, held: string[], by: string, confirm: string[]) => Promise<string[]>,
  /** Writes a print copy of what an item drafted (review.ts). */
  present?: (m: Meeting, item: AgendaItem, drafted: string[]) => Promise<string | null>,
  /** Runs an agent on a task outside a meeting (for /tools). */
  ask(fn: string, task: string): Promise<string>,
  /** The business's site or docs repository, when one is named (MENTURA_SITE or --site): for /containers and /site. */
  site?: SiteHost,
  /** Called once a meeting closes (meetingGraph's closed). */
  closed?: (m: Meeting) => Promise<void>,
  now?: () => string,
}

/** A site role, from the site's containers.json, with what it builds and owns there. */
export interface SiteRoleReach { role: string, builds: string[], owns: string[], design_system: boolean }

/** The site repository a command reaches: its manifest's roles, and one site agent run (site-run.ts). */
export interface SiteHost {
  dir: string,
  /** Every role containers.json needs staffed, with its reach. Throws when the manifest is missing or unsound. */
  roles(): SiteRoleReach[],
  run(role: string, task: string): Promise<SiteRunResult>,
}

const NO_SITE = "no site repository is named: set MENTURA_SITE or pass --site <dir> to cmd";

/** What a site agent run answers, as a command result. Problems found after the run fail it: nothing unchecked is committed. Pure. */
export function siteResult(role: string, r: SiteRunResult): CommandResult {
  if (r.status === "refused") return { ok: false, error: `${r.reason}${r.fix ? ` Fix: ${r.fix}` : ""}` };
  if (r.status === "busy") return { ok: false, error: `the business is busy with another run${r.holder ? ` (process ${r.holder})` : ""}; try again when it finishes` };
  if (r.status === "cancelled") return { ok: false, error: `${role} was cancelled` };
  const held = r.held.map((h) => `Held for you: ${h.route} (${h.accept})`);
  const problems = r.problems.map((p) => `- ${p.path}: ${p.why}${p.fix ? ` Fix: ${p.fix}` : ""}`);
  if (r.status === "failed") return { ok: false, error: [`${role} failed: ${r.error}`, ...problems, ...held].join("\n") };
  if (problems.length) return { ok: false, error: [`${role}'s changes break containers.json and were not committed:`, ...problems, ...held].join("\n") };
  const head = r.status === "done" ? r.answer : `${role} already ran this task.`;
  const changed = r.changed.length ? [`Changed: ${r.changed.join(", ")}`, r.commit ? `Committed ${r.commit} as ${role}. Nothing is pushed: you push.` : "Not committed."] : ["Changed nothing."];
  return { ok: true, text: [head, ...changed, ...held].join("\n"), data: { status: r.status, changed: r.changed, commit: r.commit, held: r.held } };
}

/** What a command answers: a meeting's state and what it waits on, or text. */
export type CommandResult =
  | { ok: true, meeting: { id: string, title: string, status: Meeting["status"] }, waiting: Question | null, outcome?: Meeting["outcome"], next?: string[] }
  | { ok: true, text: string, data?: unknown }
  | { ok: false, error: string };

/** Runs one command. A meeting command runs the graph until it ends or waits for a person, and answers with that. */
export async function runCommand(cmd: SlashCommand, ctx: CommandContext): Promise<CommandResult> {
  const now = ctx.now ?? (() => new Date().toISOString());
  const prerequisites = async (m: Meeting) => m.workflow ? (await ctx.check(m.workflow)).missing : [];
  const graph = meetingGraph({ store: ctx.store, worker: ctx.worker, checkpointer: ctx.checkpointer, closed: ctx.closed, prerequisites, approve: ctx.approve, present: ctx.present, now });
  const config = (id: string) => ({ configurable: { thread_id: id }, recursionLimit: 500 });

  const report = async (id: string, out: unknown): Promise<CommandResult> => {
    const m = await ctx.store.read(id);
    if (!m) return { ok: false, error: `no meeting ${id}` };
    const waiting = questionOf(out);
    return { ok: true, meeting: { id: m.id, title: m.title, status: m.status }, waiting, ...(m.outcome ? { outcome: m.outcome } : {}), next: hints(m, waiting) };
  };
  const waitingOn = async (id: string): Promise<Question | null> => {
    const s = await graph.getState(config(id));
    const q = (s.tasks ?? []).flatMap((t) => t.interrupts ?? []).map((i) => i.value as Question)[0];
    return q ?? null;
  };
  const resume = async (id: string, kind: Question["kind"], value: ItemAnswer | LoopAnswer | ReviewAnswer): Promise<CommandResult> => {
    const q = await waitingOn(id);
    if (!q) return { ok: false, error: `meeting ${id} is not waiting on anyone. /meetings lists what each meeting waits on.` };
    if (q.kind !== kind) return { ok: false, error: q.kind === "item" ? `meeting ${id} waits on ${q.item.id}: /answer, /done, /skip, /handoff or /abandon` : q.kind === "review" ? `meeting ${id} waits on your approval of ${q.item.id}${q.copy ? ` (read ${q.copy})` : ""}: /approve, /rework or /abandon` : `meeting ${id} waits on its skipped items: /revisit, /handoff, /end or /abandon` };
    return report(id, await graph.invoke(new Command({ resume: value }), config(id)));
  };
  const start = async (m: Meeting): Promise<CommandResult> => {
    // Checked before anything is written: a locked workflow leaves no record behind. The graph checks again on open.
    if (m.workflow) { const c = await ctx.check(m.workflow); if (!c.met) return { ok: false, error: explain(c) }; }
    await ctx.store.write(m);
    return report(m.id, await graph.invoke({ meeting: m }, config(m.id)));
  };
  const by = ctx.person;

  try {
    switch (cmd.kind) {
      case "help": return { ok: true, text: HELP };
      case "next": {
        const due = await ctx.due();
        const checks = await Promise.all(due.map((d) => ctx.check(d.workflow)));
        const lines = due.map((d, i) => checks[i].met ? `/meet ${d.workflow.replace("/", " ")}   (${d.why})` : `locked  ${d.workflow}: first ${checks[i].missing.map((x) => `${x.kind} ${x.what}`).join(", ")}`);
        return { ok: true, text: lines.length ? lines.join("\n") : "Nothing is due now. /meet <function> <workflow> opens any workflow that is not locked.", data: due.map((d, i) => ({ ...d, met: checks[i].met, missing: checks[i].missing })) };
      }
      case "blocked": {
        const list = ctx.workflows().filter((w) => !cmd.function || w.startsWith(`${cmd.function}/`));
        const checks = await Promise.all(list.map((w) => ctx.check(w)));
        const locked = checks.filter((c) => !c.met);
        return { ok: true, text: locked.length ? locked.map(explain).join("\n\n") : "Nothing is locked.", data: locked };
      }
      case "meet": {
        if (!functionIds().includes(cmd.function as never)) return { ok: false, error: `no function ${cmd.function}: ${functionIds().join(", ")}` };
        const wf = cmd.workflow ?? (await ctx.due()).find((d) => d.workflow.startsWith(`${cmd.function}/`))?.workflow.split("/")[1]
          ?? (functionAgent(cmd.function).workflows.includes("intake") ? "intake" : functionAgent(cmd.function).workflows[0]);
        if (!wf) return { ok: false, error: `${cmd.function} has no workflow` };
        return start(meetingFromWorkflow(workflowOf(cmd.function, wf), { called_by: by, person: by, now: now() }));
      }
      case "agenda": {
        const functions = [...new Set(cmd.items.map((i) => i.owner).filter((o): o is string => !!o))];
        for (const f of functions) if (!functionIds().includes(f as never)) return { ok: false, error: `no function ${f}: ${functionIds().join(", ")}` };
        return start(freeMeeting({ title: cmd.title, goal: cmd.goal, outcome_expected: cmd.outcome, items: cmd.items, called_by: by, person: by, functions, now: now() }));
      }
      case "answer": return resume(cmd.meeting, "item", { answer: cmd.text, by });
      case "approve": return resume(cmd.meeting, "review", { approve: true, by, confirm: cmd.confirm });
      case "rework": return resume(cmd.meeting, "review", { rework: cmd.text, by });
      case "done": return resume(cmd.meeting, "item", { done: cmd.text, by });
      case "skip": return resume(cmd.meeting, "item", { skip: true, by, ...(cmd.why ? { why: cmd.why } : {}) });
      case "handoff": {
        const q = await waitingOn(cmd.meeting);
        if (q?.kind === "loop") return resume(cmd.meeting, "loop", { handoff: cmd.items.length ? cmd.items : q.skipped.map((i) => i.id), by });
        return resume(cmd.meeting, "item", { handoff: true, by });
      }
      case "revisit": {
        const q = await waitingOn(cmd.meeting);
        return resume(cmd.meeting, "loop", { revisit: cmd.items.length ? cmd.items : q?.kind === "loop" ? q.skipped.map((i) => i.id) : [], by });
      }
      case "end": return resume(cmd.meeting, "loop", { end: true, by });
      case "abandon": {
        const q = await waitingOn(cmd.meeting);
        if (!q) return { ok: false, error: `meeting ${cmd.meeting} is not waiting on anyone` };
        return resume(cmd.meeting, q.kind, { abandon: true, by, ...(cmd.why ? { why: cmd.why } : {}) });
      }
      case "meetings": {
        const all = meetingsIn(ctx.dir);
        const lines = await Promise.all(all.map(async (m) => {
          const q = m.status === "open" ? await waitingOn(m.id) : null;
          return `${m.id}  ${m.status}  ${m.title}${q ? `  waits on ${q.kind === "item" ? q.item.id : q.kind === "review" ? `your approval of ${q.item.id}` : "its skipped items"}` : ""}`;
        }));
        return { ok: true, text: lines.join("\n") || "No meetings yet. /next says what is due; /meet <function> opens one." };
      }
      case "skipped": {
        const rows = meetingsIn(ctx.dir).flatMap((m) => m.agenda.filter((i) => i.status === "skipped" || i.status === "handed-off")
          .map((i) => `${m.id} ${i.id} ${i.status}${i.recommendation ? `: ${i.recommendation}` : i.result ? `: ${i.result}` : ""}`));
        return { ok: true, text: rows.join("\n") || "Nothing is skipped or handed off." };
      }
      case "memory": return { ok: true, text: memoryOf(meetingsIn(ctx.dir), cmd.role) };
      case "containers": {
        if (!ctx.site) return { ok: false, error: NO_SITE };
        const roles = ctx.site.roles().filter((x) => !cmd.role || x.role === cmd.role);
        if (cmd.role && !roles.length) return { ok: false, error: `containers.json needs no ${cmd.role}. /containers lists the roles it needs.` };
        const line = (x: SiteRoleReach) => `${x.role}: ${[x.design_system ? "the design system" : "", x.builds.length ? `builds ${x.builds.join(", ")}` : "", x.owns.length ? `owns ${x.owns.join(", ")}` : ""].filter(Boolean).join("; ") || "nothing yet"}`;
        return { ok: true, text: roles.map(line).join("\n"), data: roles };
      }
      case "site": {
        if (!ctx.site) return { ok: false, error: NO_SITE };
        const roles = ctx.site.roles().map((x) => x.role);
        if (!roles.includes(cmd.role)) return { ok: false, error: `containers.json needs no ${cmd.role}. Site roles: ${roles.join(", ")}.` };
        const c = await ctx.check(`site/${cmd.role}`);
        if (!c.met) return { ok: false, error: explain(c) };
        return siteResult(cmd.role, await ctx.site.run(cmd.role, cmd.task));
      }
      case "tools": return { ok: true, text: await ctx.ask("it", `Recommend tooling for this need, following /mentura/skills/tooling/SKILL.md: ${cmd.need}. Name one tool and one runner-up, score both with the rubric, say where each one's records land in the business, and write an open decision under /decisions/ for the person when choosing spends money or signs anything.`) };
    }
  }
  catch (e) { return { ok: false, error: e instanceof Blocked ? e.message : String((e as Error)?.message ?? e) }; }
}

/** The commands a person can give next, for a meeting in its state. */
function hints(m: Meeting, q: Question | null): string[] {
  if (!q) return m.status === "closed" && m.outcome?.follow_up ? [`/meet ... or /skipped`] : [];
  if (q.kind === "review") return [`/approve ${m.id}${q.held.filter((r) => r.startsWith("foundation/")).map((r) => ` ${r}`).join("")}`, `/rework ${m.id} <what to change>`, `/abandon ${m.id}`];
  if (q.kind === "item") return [`/answer ${m.id} <text>`, `/done ${m.id} <text>`, `/skip ${m.id} [why]`, `/handoff ${m.id}`, `/abandon ${m.id}`];
  return [`/revisit ${m.id} [${q.skipped.map((i) => i.id).join(" ")}]`, `/handoff ${m.id}`, `/end ${m.id}`];
}
