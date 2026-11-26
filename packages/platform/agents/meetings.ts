// Meetings with agents (Naive's meeting record, EE-200). A meeting has a goal and the outcome that shows it was
// reached, people and agents attending, and an agenda worked in order. A meeting may walk a function workflow, one
// agenda item per step. This file is the pure part: building a meeting from a workflow, deriving its outcome and
// takeaways at close, the run id of each agenda item's agent run, and reading and writing the record through Naive's
// router as the facilitator role. The graph that runs a meeting is meeting-graph.ts.
//
//   const m = meetingFromWorkflow(workflowOf("strategy", "intake"), { id, called_by: "torian", now });
//   await routerStore({ venture: "mentura" }).write(m);   // operations/meeting/<id>, as meeting-facilitator

import type { Requires } from "./prerequisites.ts";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as files from "naive-framework/src/router/agent-files.mjs";
import type { Meeting } from "naive-framework/src/records/types/records.d.ts";
import { functionAgent } from "./function-spec.ts";

export type { Meeting };
export type AgendaItem = Meeting["agenda"][number];
export type Attendee = Meeting["attendees"][number];
export type ItemStatus = AgendaItem["status"];

/** The team-plan role that writes meeting records. Not a `<function>-agent`, so Naive's agent-reach rule leaves it to the team plan. */
export const FACILITATOR = "meeting-facilitator";

/** The team-plan entry a business adds so the facilitator can keep meeting records, and nothing else. */
export const facilitatorEntry = { id: FACILITATOR, occupant: "agent", routes: { write: ["operations/meeting/*"] } } as const;

/** One step of a function workflow, as Naive's function-workflow schema has it. */
export interface WorkflowStep { id: string, do: string, skill?: string, ask?: boolean, writes?: string[], raises?: string[], activity?: string, consider?: { why: string, when: string } }
export interface Workflow { id: string, function: string, title: string, reads?: string[], steps: WorkflowStep[], requires?: Requires }

/** A function's workflow, read from the installed Naive's function module. */
export function workflowOf(fn: string, workflow: string): Workflow {
  const file = join(functionAgent(fn).module, "workflows", `${workflow}.json`);
  if (!existsSync(file)) throw new Error(`no workflow ${fn}/${workflow} in Naive: ${functionAgent(fn).workflows.map((w) => `${fn}/${w}`).join(", ") || "it has none"}`);
  return JSON.parse(readFileSync(file, "utf8")) as Workflow;
}

/** The id of a meeting started now: a slug of its title and the minute, so two meetings on one workflow never collide. */
export function meetingId(title: string, now: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `${now.slice(0, 16).replace(/[-:T]/g, "")}-${slug}`;
}

/**
 * A planned meeting that walks a workflow: one agenda item per step in order, each owned by the function's agent and
 * pending. A step marked to consider is on the agenda too, with why and when in its title, so it can be skipped and
 * looped back to. The goal is the workflow's title; the expected outcome is the routes its steps write.
 */
export function meetingFromWorkflow(w: Workflow, o: { id?: string, called_by: string, person?: string, now: string }): Meeting {
  const agent = `${w.function}-agent`;
  const writes = [...new Set(w.steps.flatMap((s) => s.writes ?? []))];
  const id = o.id ?? meetingId(`${w.function} ${w.id}`, o.now);
  return {
    id,
    title: `${w.function}: ${w.title}`,
    goal: w.title,
    outcome_expected: writes.length ? writes.map((r) => `${r} drafted or confirmed`) : [`every step of ${w.function}/${w.id} worked`],
    workflow: `${w.function}/${w.id}`,
    called_by: o.called_by,
    facilitator: FACILITATOR,
    attendees: [...(o.person ? [{ id: o.person, kind: "person" as const }] : []), { id: agent, kind: "agent" as const }],
    status: "planned",
    agenda: w.steps.map((s) => ({ id: s.id, title: s.consider ? `${s.do} (consider: ${s.consider.why} When: ${s.consider.when})` : s.do,
      step: s.id, owner: agent, ...(s.ask ? { ask: true } : {}), status: "pending" as const })),
    minutes: [],
    takeaways: [],
    recording: { tool: "mentura meeting graph", transcript: `operations/meetings/${id}` },
  };
}

/** A planned meeting with an agenda a person wrote. Each item's owner is the agent of the function named, else the person. */
export function freeMeeting(o: { title: string, goal: string, outcome_expected: string[], items: { title: string, owner?: string, ask?: boolean }[], called_by: string, person?: string, functions: string[], now: string }): Meeting {
  const id = meetingId(o.title, o.now);
  const agents = o.functions.map((f) => `${functionAgent(f).function}-agent`);
  const slug = (t: string, i: number): string => `${i + 1}-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}`;
  return {
    id, title: o.title, goal: o.goal, outcome_expected: o.outcome_expected, called_by: o.called_by, facilitator: FACILITATOR,
    attendees: [...(o.person ? [{ id: o.person, kind: "person" as const }] : []), ...agents.map((id) => ({ id, kind: "agent" as const }))],
    status: "planned",
    agenda: o.items.map((it, i) => ({ id: slug(it.title, i), title: it.title, owner: it.owner ? `${it.owner.replace(/-agent$/, "")}-agent` : (agents[0] ?? o.person ?? o.called_by),
      ...(it.ask ? { ask: true } : {}), status: "pending" as const })),
    minutes: [], takeaways: [], recording: { tool: "mentura meeting graph", transcript: `operations/meetings/${id}` },
  };
}

/**
 * The outcome and takeaways at close, derived from the agenda, never asked of a model. reached: yes when every item is
 * done, no when none is, partly otherwise. Each agent attendee takes away the items it owned and what came of them;
 * each person takes away what was skipped or handed off, which is theirs to return to.
 */
export function closeOf(m: Meeting): Pick<Meeting, "outcome" | "takeaways"> {
  const done = m.agenda.filter((i) => i.status === "done");
  const open = m.agenda.filter((i) => i.status === "skipped" || i.status === "handed-off");
  const reached = done.length === m.agenda.length ? "yes" : done.length === 0 ? "no" : "partly";
  const records = [...new Set(m.agenda.flatMap((i) => i.writes ?? []))];
  const decisions = [...new Set(m.agenda.flatMap((i) => i.decisions ?? []))];
  const summary = `${done.length} of ${m.agenda.length} agenda items done${open.length ? `; ${open.map((i) => `${i.id} ${i.status}`).join(", ")}` : ""}.`;
  const follow_up = open.length ? `Loop back to ${open.map((i) => i.id).join(", ")}: /revisit ${m.id}` : undefined;
  const takeaways = m.attendees.flatMap((a) => {
    if (a.kind === "agent") {
      const mine = m.agenda.filter((i) => i.owner === a.id && i.result);
      return mine.length ? [{ attendee: a.id, text: mine.map((i) => `${i.id}: ${i.result}`).join(" ") }] : [];
    }
    return open.length ? [{ attendee: a.id, text: `Waiting on you: ${open.map((i) => `${i.id} (${i.status}${i.recommendation ? `, recommended: ${i.recommendation}` : ""})`).join("; ")}.` }] : [];
  });
  return { outcome: { reached, summary, records, decisions, handoffs: [], ...(follow_up ? { follow_up } : {}) }, takeaways };
}

/** The run id of one agenda item's agent run: a UUID from the meeting, the item and the attempt, so a resumed meeting finds the run it already made. */
export function itemRunId(meeting: string, item: string, attempt: number): string {
  const h = createHash("sha256").update(`${meeting}\0${item}\0${attempt}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((Number.parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Where meeting records are read and written. */
export interface MeetingStore {
  read(id: string): Promise<Meeting | null>,
  write(m: Meeting): Promise<void>,
}

/**
 * Meeting records through Naive's router, acting as the facilitator role, so every write meets the schema, the gate
 * and provenance. A write the gate holds, or refuses, throws: a meeting the business cannot record is not run.
 */
export function routerStore(ctx: { venture: string, workspace?: string }): MeetingStore {
  const c = { ...ctx, actor_id: FACILITATOR, via: "mentura-meetings" };
  return {
    async read(id) {
      const r = await files.readRaw(c, `/operations/meeting/${id}`);
      return r.ok && r.content ? JSON.parse(r.content) as Meeting : null;
    },
    async write(m) {
      const w = await files.write(c, `/operations/meeting/${m.id}`, JSON.stringify(m, null, 2) + "\n");
      if (w.draft) throw new Error(`the gate held meeting ${m.id} for a person: give ${FACILITATOR} the write route operations/meeting/* in the team plan (${JSON.stringify(facilitatorEntry)})`);
      if (!w.ok) throw new Error(`meeting ${m.id} was not recorded: ${w.error}`);
    },
  };
}

/** Every meeting record in a venture folder, newest first. Read from the files, which the router wrote. */
export function meetingsIn(dir: string): Meeting[] {
  const folder = join(dir, "operations", "meetings");
  if (!existsSync(folder)) return [];
  return readdirSync(folder).filter((f) => f.endsWith(".json"))
    .map((f) => { try { return JSON.parse(readFileSync(join(folder, f), "utf8")) as Meeting; } catch { return null; } })
    .filter((m): m is Meeting => m !== null)
    .sort((a, b) => (b.opened_at ?? b.id).localeCompare(a.opened_at ?? a.id));
}
