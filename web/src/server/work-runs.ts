import "server-only";
// The feed of running work (round 5, B1 bottom bar, "Running"): rows in work_run (migration 0072), written at the start,
// each step and the end of work Mentura runs that a person waits on, and read by the bar for one business in one team.
// The rules for what the bar shows are in ./work-runs-core.ts.
//
// Reporting never gets in the way of the work: a site without the table, or a write that fails, leaves the work to run
// as it would and the bar without that row. Only work that really runs reports here; today that is a sync push
// (./sync-store.ts). Nothing writes a row for work that is not running.
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import type { RunKind, RunRow, RunStatus } from "./work-runs-core";

const missingTable = (e: unknown) => typeof e === "object" && e !== null && "code" in e && String((e as { code: unknown }).code) === "42P01";
let warned = false;
/** Reports a failed write once per process, and nothing when the table is not there yet. */
function quiet(e: unknown): null {
  if (!missingTable(e) && !warned) { warned = true; console.error("work_run: a run was not reported", e instanceof Error ? e.message : ""); }
  return null;
}
const line = (text: string) => JSON.stringify([{ at: new Date().toISOString(), text }]);

/** Starts a run at step 1 and returns its id, or null when it could not be reported. */
export async function startRun(r: { team: string; venture: string; kind: RunKind; name: string; startedBy: string; steps: number; stepLabel: string }): Promise<string | null> {
  const id = randomUUID();
  try {
    await db().query(
      `INSERT INTO work_run (id, team, venture, kind, name, started_by, step, steps, step_label, log) VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9::jsonb)`,
      [id, r.team, r.venture, r.kind, r.name, r.startedBy, r.steps, r.stepLabel, line(r.stepLabel)],
    );
    return id;
  } catch (e) { return quiet(e); }
}

/** Moves a run to a step. */
export async function stepRun(id: string | null, step: number, label: string): Promise<void> {
  if (!id) return;
  try {
    await db().query(`UPDATE work_run SET step = $2, step_label = $3, log = log || $4::jsonb, updated_at = now() WHERE id = $1 AND status = 'running'`, [id, step, label, line(label)]);
  } catch (e) { quiet(e); }
}

/** Ends a run: done, failed with what failed, or in conflict. */
export async function endRun(id: string | null, status: Exclude<RunStatus, "running">, text: string): Promise<void> {
  if (!id) return;
  try {
    await db().query(
      `UPDATE work_run SET status = $2, failure = $3, log = log || $4::jsonb, updated_at = now(), ended_at = now() WHERE id = $1 AND status = 'running'`,
      [id, status, status === "done" ? null : text, line(text)],
    );
  } catch (e) { quiet(e); }
}

/** The runs of one business in one team from the last two days, newest first, each with the name of who started it. The
 * caller has checked that the person is on the team. */
export async function runsFor(team: string, venture: string): Promise<RunRow[]> {
  try {
    const r = await db().query<Omit<RunRow, "started_at" | "updated_at" | "ended_at"> & { started_at: Date; updated_at: Date; ended_at: Date | null }>(
      `SELECT w.id, w.team, w.venture, w.kind, w.name, w.started_by, u.name AS started_by_name, w.status, w.step, w.steps, w.step_label,
              w.failure, w.log, w.started_at, w.updated_at, w.ended_at
         FROM work_run w LEFT JOIN "user" u ON u.id = w.started_by
        WHERE w.team = $1 AND w.venture = $2 AND w.started_at > now() - interval '2 days'
        ORDER BY w.started_at DESC LIMIT 100`,
      [team, venture],
    );
    return r.rows.map((x) => ({ ...x, log: Array.isArray(x.log) ? x.log : [], started_at: x.started_at.toISOString(), updated_at: x.updated_at.toISOString(), ended_at: x.ended_at ? x.ended_at.toISOString() : null }));
  } catch (e) {
    if (missingTable(e)) return [];
    throw e;
  }
}
