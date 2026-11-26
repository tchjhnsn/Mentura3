// The feed of running work (round 5, B1 bottom bar, "Running"): what the bar shows from the rows in work_run (migration
// 0072). Pure, so the rules are tested without a database: which rows show, in what order, when a run that stopped
// reporting counts as failed, and what the sync state is. The store that writes and reads the rows is ./work-runs.ts.

/** The kinds of work that report here. Only work Mentura really runs is listed: a sync push from a working copy. */
export type RunKind = "sync-push";
export type RunStatus = "running" | "done" | "failed" | "conflict";

/** One line of a run's log. */
export type RunLogLine = { at: string; text: string };

/** A row of work_run as read, with the name of the person who started it when the account still exists. */
export type RunRow = {
  id: string; team: string; venture: string; kind: RunKind; name: string;
  started_by: string; started_by_name: string | null;
  status: RunStatus; step: number; steps: number; step_label: string | null; failure: string | null;
  log: RunLogLine[]; started_at: string; updated_at: string; ended_at: string | null;
};

/** A run as the bar shows it. `stalled` marks a run that stopped reporting and is shown as failed. */
export type ShownRun = RunRow & { stalled: boolean };

/** A run that has not reported for this long stopped without finishing. */
export const STALL_MS = 15 * 60 * 1000;
/** A failed run stays in Running this long, so the person sees what failed. */
export const FAILED_SHOWN_MS = 24 * 60 * 60 * 1000;
/** At most this many rows in the panel; the rest are behind See all. */
export const PANEL_ROWS = 20;

const failedLike = (s: RunStatus) => s === "failed" || s === "conflict";

/** The runs the bar shows for one business: those running now, then those that failed in the last day, newest first. A
 * running row that stopped reporting shows as failed. Done runs leave the bar. */
export function shownRuns(rows: RunRow[], now: number = Date.now()): ShownRun[] {
  const out: ShownRun[] = [];
  for (const r of rows) {
    const stalled = r.status === "running" && now - Date.parse(r.updated_at) > STALL_MS;
    if (stalled) {
      if (now - Date.parse(r.updated_at) <= FAILED_SHOWN_MS) out.push({ ...r, status: "failed", failure: r.failure ?? "It stopped without finishing.", stalled: true });
      continue;
    }
    if (r.status === "running") out.push({ ...r, stalled: false });
    else if (failedLike(r.status) && now - Date.parse(r.ended_at ?? r.updated_at) <= FAILED_SHOWN_MS) out.push({ ...r, stalled: false });
  }
  return out.sort((a, b) => Number(b.status === "running") - Number(a.status === "running") || b.started_at.localeCompare(a.started_at));
}

/** What the bar says about Running: how many run now, and whether any failed. */
export function runningCounts(runs: ShownRun[]): { running: number; failed: number } {
  return { running: runs.filter((r) => r.status === "running").length, failed: runs.filter((r) => failedLike(r.status)).length };
}

/** The sync state the server knows for a business: a conflict when its latest sync push was refused because the store
 * moved, else nothing. "In sync" and "N changes to push" are the working copy's to know, not the server's. */
export function syncState(rows: RunRow[]): "conflict" | null {
  const latest = rows.filter((r) => r.kind === "sync-push").sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  return latest?.status === "conflict" ? "conflict" : null;
}

/** A row's second line: when it started and who started it. */
export function startedLine(r: Pick<RunRow, "started_at" | "started_by_name">, now: number = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(r.started_at)) / 60_000));
  const when = mins < 1 ? "Started just now" : mins < 60 ? `Started ${mins} min ago` : mins < 1440 ? `Started ${Math.round(mins / 60)} h ago` : `Started ${Math.round(mins / 1440)} d ago`;
  return r.started_by_name ? `${when} by ${r.started_by_name}` : when;
}
