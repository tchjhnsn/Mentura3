import { describe, expect, it } from "vitest";
import { FAILED_SHOWN_MS, runningCounts, shownRuns, STALL_MS, startedLine, syncState, type RunRow } from "./work-runs-core";

const now = Date.parse("2026-11-25T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();
const row = (over: Partial<RunRow> = {}): RunRow => ({
  id: "r", team: "t", venture: "harbor", kind: "sync-push", name: "Sync push of 2 changes", started_by: "p", started_by_name: "Ada",
  status: "running", step: 1, steps: 2, step_label: "Reading", failure: null, log: [], started_at: ago(60_000), updated_at: ago(30_000), ended_at: null, ...over,
});

describe("the feed of running work (round 5, B1 Running)", () => {
  it("shows running work and recent failures, never done work, running first", () => {
    const shown = shownRuns([
      row({ id: "done", status: "done", ended_at: ago(1000) }),
      row({ id: "failed", status: "failed", failure: "refused", started_at: ago(10_000), ended_at: ago(5000) }),
      row({ id: "run", started_at: ago(120_000) }),
      row({ id: "old", status: "failed", ended_at: ago(FAILED_SHOWN_MS + 1000) }),
    ], now);
    expect(shown.map((r) => r.id)).toEqual(["run", "failed"]);
    expect(runningCounts(shown)).toEqual({ running: 1, failed: 1 });
  });

  it("counts a run that stopped reporting as failed, and says so", () => {
    const [r] = shownRuns([row({ updated_at: ago(STALL_MS + 1000) })], now);
    expect(r?.status).toBe("failed");
    expect(r?.stalled).toBe(true);
    expect(r?.failure).toBe("It stopped without finishing.");
    expect(shownRuns([row({ updated_at: ago(FAILED_SHOWN_MS + STALL_MS) })], now)).toEqual([]);
  });

  it("knows a conflict only from the latest sync push", () => {
    expect(syncState([row({ status: "conflict", started_at: ago(5000) }), row({ status: "done", started_at: ago(9000) })])).toBe("conflict");
    expect(syncState([row({ status: "done", started_at: ago(1000) }), row({ status: "conflict", started_at: ago(9000) })])).toBeNull();
    expect(syncState([])).toBeNull();
  });

  it("says when a run started and who started it", () => {
    expect(startedLine(row({ started_at: ago(10_000) }), now)).toBe("Started just now by Ada");
    expect(startedLine(row({ started_at: ago(5 * 60_000), started_by_name: null }), now)).toBe("Started 5 min ago");
    expect(startedLine(row({ started_at: ago(3 * 3_600_000) }), now)).toBe("Started 3 h ago by Ada");
  });
});
