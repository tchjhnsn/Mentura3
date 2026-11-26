// An agent's memory, derived from the business's closed meetings (Naive EE-200). Nothing is copied into a second
// record: before each run, the role's memory is rendered from the meeting records into
// <venture>/.naive/agent-memory/<role>/MEMORY.md, a derived file, and the deep agent loads it as memory (deepagents'
// `memory` option) through a read-only mount at /memory/. A meeting that closes updates every attendee's memory on its
// next run, and every agent reads every closed meeting's outcome.
//
//   const path = writeMemory(ventureDir, "strategy-agent");   // "/memory/MEMORY.md", mounted from .naive/agent-memory/strategy-agent

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { meetingsIn, type Meeting } from "./meetings.ts";

/** How many closed meetings the memory lists in full. Older ones are counted, and the records stay readable. */
export const RECENT = 20;

/** The memory text for a role: its own takeaways first, then every closed meeting's goal and outcome, newest first. Pure. */
export function memoryOf(meetings: readonly Meeting[], role: string): string {
  const closed = meetings.filter((m) => m.status === "closed");
  const open = meetings.filter((m) => m.status === "open" && m.attendees.some((a) => a.id === role));
  const mine = closed.flatMap((m) => (m.takeaways ?? []).filter((t) => t.attendee === role).map((t) => `- ${m.id} (${m.title}): ${t.text}`));
  const lines = [
    `# Memory of ${role}`,
    "",
    "Derived from the business's meeting records (operations/meetings). Read a meeting's record for its minutes.",
    "",
    "## What you took away",
    ...(mine.length ? mine : ["- Nothing yet."]),
    "",
    "## Meetings still open that you attend",
    ...(open.length ? open.map((m) => `- ${m.id}: ${m.goal} (pending: ${m.agenda.filter((i) => i.status === "pending").map((i) => i.id).join(", ") || "none"})`) : ["- None."]),
    "",
    "## What every closed meeting decided",
    ...(closed.length ? closed.slice(0, RECENT).map((m) => `- ${m.id}: ${m.goal}. Outcome ${m.outcome?.reached ?? "unknown"}: ${m.outcome?.summary ?? ""}${m.outcome?.decisions?.length ? ` Decisions: ${m.outcome.decisions.join(", ")}.` : ""}${m.outcome?.follow_up ? ` Next: ${m.outcome.follow_up}` : ""}`) : ["- No meeting has closed yet."]),
    ...(closed.length > RECENT ? [`- And ${closed.length - RECENT} older meetings.`] : []),
    "",
  ];
  return lines.join("\n");
}

/** The folder the /memory/ mount reads for a role. */
export const memoryDir = (dir: string, role: string): string => join(dir, ".naive", "agent-memory", role);

/** Renders the role's memory from the venture's meetings and writes it; returns the path the agent loads. */
export function writeMemory(dir: string, role: string): string {
  const folder = memoryDir(dir, role);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "MEMORY.md"), memoryOf(meetingsIn(dir), role));
  return "/memory/MEMORY.md";
}
