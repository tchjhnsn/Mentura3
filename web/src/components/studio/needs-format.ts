// Words for what needs a person and what agents do (round 5, doc "Mentura console: screens, navigation and teams",
// "Person and agent: what changes on screen"). Pure, so the business home, the function pages and the bottom bar say
// the same thing and a test can hold them to it. No "use client": server and client components both use it.
import type { FunctionBriefing, NeedsDecision, RuledActivity } from "@/server/naive";
import type { TeamRole } from "@/server/teams-core";
import { FUNCTIONS } from "./data";

/** A function's name for a person. Naive files decisions about the business itself under "venture". */
export function functionLabel(id: string | null): string {
  if (!id || id === "venture") return "Business";
  return FUNCTIONS.find((f) => f.id === id)?.label ?? id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase());
}

/** What settling a decision unlocks, in one line: the activities it opens, else the decisions waiting on it, else the
 * index's first reason. */
export function unlocksLine(d: Pick<NeedsDecision, "unlocks" | "opens" | "why">): string {
  if (d.unlocks.length) return `Unlocks: ${d.unlocks.join("; ")}`;
  if (d.opens > 0) return `Unlocks ${d.opens} ${d.opens === 1 ? "decision" : "decisions"} waiting on it`;
  const why = d.why[0];
  return why ? `${why.replace(/^./, (c) => c.toUpperCase())}` : "Waiting on you";
}

/** A due time in words, relative to now: "Due today", "Due in 3 days", "Overdue by 2 days". */
export function dueLine(due: string | null, now: number = Date.now()): string | null {
  if (!due) return null;
  const at = Date.parse(due);
  if (Number.isNaN(at)) return null;
  const days = Math.round((at - now) / 86_400_000);
  if (at < now) return days <= -1 ? `Overdue by ${-days} ${days === -1 ? "day" : "days"}` : "Overdue";
  if (days === 0) return "Due today";
  return `Due in ${days} ${days === 1 ? "day" : "days"}`;
}

/** The decisions a person in this role can act on. A Viewer settles nothing, so nothing waits on them. */
export const actionable = (decisions: NeedsDecision[], role: TeamRole): NeedsDecision[] => role === "viewer" ? [] : decisions;

/** Whether anything waiting is past its due time. */
export const anyOverdue = (decisions: NeedsDecision[]): boolean => decisions.some((d) => d.render === "overdue");

/** One function's briefing in a sentence: what agents do and what needs the person. */
export function briefingLine(f: FunctionBriefing): string {
  const performs = f.process_groups.reduce((n, g) => n + g.performs.length, 0);
  const approves = f.process_groups.reduce((n, g) => n + g.approves.length, 0);
  const agent = f.process_groups.reduce((n, g) => n + g.agent, 0);
  const yours = [performs ? `you do ${performs}` : "", approves ? `you approve ${approves}` : ""].filter(Boolean).join(" and ");
  return `Agents do ${agent} ${agent === 1 ? "activity" : "activities"}${yours ? `; ${yours}` : "; none need you"}.`;
}

/** Who does an activity and who approves it, as the "Done by" line on its row. */
export function doneByLine(a: Pick<RuledActivity, "performer" | "approval">): string {
  if (a.performer === "person") return "Done by you";
  if (a.approval === "person") return "Done by an agent. You approve each one.";
  return "Done by an agent. No approval needed.";
}

/** Why an activity has the assignment it has. */
export function sourceLine(a: Pick<RuledActivity, "source" | "kind">): string {
  return a.source === "assigned" ? "Assigned for this business" : `Default for a ${a.kind ?? "kind of activity"} until you assign it`;
}
