"use server";
// What the bottom bar (B1, round 5) reads for one business: Stream, what waits on the person in the order of Naive's
// decision index (src/app/studio/actions.ts `ventureNeeds`), and Running, the feed of running work with the sync state
// the server knows (src/server/work-runs.ts). Both check the person is on the team in the URL before reading anything.
import { ventureNeeds, type Result } from "./actions";
import type { Needs } from "@/server/naive";
import { consolePerson, teamAt } from "@/server/teams";
import type { TeamRole } from "@/server/teams-core";
import { runsFor } from "@/server/work-runs";
import { PANEL_ROWS, shownRuns, syncState, type ShownRun } from "@/server/work-runs-core";

export type StreamRead = { needs: Needs; role: TeamRole };
export type RunningRead = { runs: ShownRun[]; total: number; sync: "conflict" | null; role: TeamRole };

/** Stream: the decisions waiting on the person in this business. */
export async function readStream(team: string, venture: string): Promise<Result<StreamRead>> {
  return ventureNeeds(venture, team);
}

/** Running: the work running for this business now and what failed in the last day, at most PANEL_ROWS of it. */
export async function readRunning(team: string, venture: string): Promise<Result<RunningRead>> {
  try {
    const person = await consolePerson();
    if (!person) return { ok: false, error: "Sign in to use the console." };
    const at = await teamAt(person, team);
    if (!at.ok) return { ok: false, error: at.error };
    const rows = await runsFor(at.team.id, venture);
    const runs = shownRuns(rows);
    return { ok: true, value: { runs: runs.slice(0, PANEL_ROWS), total: runs.length, sync: syncState(rows), role: at.team.role } };
  } catch {
    return { ok: false, error: "Running could not be read. Try again." };
  }
}
