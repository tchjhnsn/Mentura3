import { describe, expect, it } from "vitest";
import type { FunctionBriefing, NeedsDecision } from "@/server/naive";
import { actionable, anyOverdue, briefingLine, doneByLine, dueLine, functionLabel, sourceLine, unlocksLine } from "./needs-format";

const decision = (over: Partial<NeedsDecision> = {}): NeedsDecision =>
  ({ id: "d", question: "Q?", function: "strategy", render: "now", rank: 1, unlocks: [], opens: 0, due: null, why: [], ...over });

describe("Needs you words (round 5)", () => {
  it("names functions as people read them, and the business itself", () => {
    expect(functionLabel("strategy")).toBe("Strategy");
    expect(functionLabel("venture")).toBe("Business");
    expect(functionLabel(null)).toBe("Business");
    expect(functionLabel("some-package")).toBe("Some package");
  });

  it("says what a decision unlocks: activities first, then decisions waiting on it, then the index's reason", () => {
    expect(unlocksLine(decision({ unlocks: ["Write product cards"], opens: 2 }))).toBe("Unlocks: Write product cards");
    expect(unlocksLine(decision({ opens: 1 }))).toBe("Unlocks 1 decision waiting on it");
    expect(unlocksLine(decision({ opens: 3 }))).toBe("Unlocks 3 decisions waiting on it");
    expect(unlocksLine(decision({ why: ["settles the strategic foundation"] }))).toBe("Settles the strategic foundation");
    expect(unlocksLine(decision())).toBe("Waiting on you");
  });

  it("puts a due time in words", () => {
    const now = Date.parse("2026-11-25T12:00:00Z");
    expect(dueLine(null, now)).toBeNull();
    expect(dueLine("2026-11-25T18:00:00Z", now)).toBe("Due today");
    expect(dueLine("2026-11-28T12:00:00Z", now)).toBe("Due in 3 days");
    expect(dueLine("2026-11-26T12:00:00Z", now)).toBe("Due in 1 day");
    expect(dueLine("2026-11-23T12:00:00Z", now)).toBe("Overdue by 2 days");
    expect(dueLine("2026-11-25T11:00:00Z", now)).toBe("Overdue");
    expect(dueLine("not a date", now)).toBeNull();
  });

  it("leaves a Viewer nothing to act on, and marks overdue", () => {
    const list = [decision(), decision({ id: "e", render: "overdue" })];
    expect(actionable(list, "owner")).toHaveLength(2);
    expect(actionable(list, "member")).toHaveLength(2);
    expect(actionable(list, "viewer")).toHaveLength(0);
    expect(anyOverdue(list)).toBe(true);
    expect(anyOverdue([decision()])).toBe(false);
  });

  it("briefs a function in a sentence from Naive's counts", () => {
    const f: FunctionBriefing = { function: "strategy", category: null, needs_person: 3, process_groups: [
      { id: "1.1", name: "A", performs: [{ id: "x", from: "pcf", statement: "s", source: "default", kind: "value" }], approves: [], agent: 24 },
      { id: "1.2", name: "B", performs: [], approves: [{ id: "y", from: "pcf", statement: "s", source: "assigned" }, { id: "z", from: "pcf", statement: "s", source: "assigned" }], agent: 1 },
    ] };
    expect(briefingLine(f)).toBe("Agents do 25 activities; you do 1 and you approve 2.");
    expect(briefingLine({ ...f, process_groups: [{ id: "1.1", name: "A", performs: [], approves: [], agent: 1 }] })).toBe("Agents do 1 activity; none need you.");
  });

  it("says who does an activity and why", () => {
    expect(doneByLine({ performer: "person", approval: null })).toBe("Done by you");
    expect(doneByLine({ performer: "agent", approval: "person" })).toBe("Done by an agent. You approve each one.");
    expect(doneByLine({ performer: "agent", approval: "none" })).toBe("Done by an agent. No approval needed.");
    expect(sourceLine({ source: "assigned", kind: null })).toBe("Assigned for this business");
    expect(sourceLine({ source: "default", kind: "decision" })).toBe("Default for a decision until you assign it");
  });
});
