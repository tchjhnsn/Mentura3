import { describe, expect, it } from "vitest";
import { weekLook, weekOpens, weekRange, type WeekInput } from "./week";

describe("weekRange and weekOpens", () => {
  it("looks back on the whole week before on a Monday, otherwise this week so far", () => {
    expect(weekRange("2026-11-16")).toEqual({ from: "2026-11-09", to: "2026-11-15", last: true }); // Monday
    expect(weekRange("2026-11-18")).toEqual({ from: "2026-11-16", to: "2026-11-18", last: false }); // Wednesday
    expect(weekRange("2026-11-22")).toEqual({ from: "2026-11-16", to: "2026-11-22", last: false }); // Sunday
  });

  it("opens by itself on Sundays and Mondays only", () => {
    expect(weekOpens("2026-11-22")).toBe(true);
    expect(weekOpens("2026-11-23")).toBe(true);
    expect(weekOpens("2026-11-18")).toBe(false);
  });
});

describe("weekLook", () => {
  const base: WeekInput = {
    records: [
      { id: "fit", app: "body", kind: "fitness", body: { name: "Run" }, createdAt: "2026-10-01T10:00:00Z" },
      { id: "pol", app: "polis", kind: "standing", body: { role: "Clerk" }, createdAt: "2026-11-17T10:00:00Z" },
      { id: "bo", app: "friends", kind: "friend", body: { name: "Bo" }, createdAt: "2026-11-17T10:00:00Z" },
      { id: "q", app: "work", kind: "quality", body: { ref: "focus" }, createdAt: "2026-10-01T10:00:00Z" },
    ],
    acts: [
      { record: "fit", kind: "moderate", day: "2026-11-16", minutes: 60 },
      { record: "fit", kind: "moderate", day: "2026-11-17", minutes: 45 },
      { record: "fit", kind: "moderate", day: "2026-11-02", minutes: 30 },
      { record: "q", kind: "wrote", day: "2026-11-17", minutes: null },
    ],
    calendar: [{ day: "2026-11-17", tile: "work" }, { day: "2026-11-18", tile: "work" }, { day: "2026-11-10", tile: "work" }, { day: "2026-11-17", tile: null }],
    readingDays: 2,
    finished: [{ title: "Meditations" }],
    traitName: (id) => (id === "focus" ? "Focus on one thing" : undefined),
  };

  it("sums the week's acts, records and calendar by tile, leaving out other weeks", () => {
    const w = weekLook(base, { from: "2026-11-16", to: "2026-11-18" });
    expect(w.tiles.map((t) => t.tile)).toEqual(["learn", "work", "fitness", "friends", "standing"]);
    expect(w.tiles[0]?.lines).toEqual(["Read on 2 days", "Finished Meditations"]);
    expect(w.tiles.find((t) => t.tile === "fitness")!.lines).toEqual(["Moderate activity twice, 1 hour 45 minutes"]);
    expect(w.tiles.find((t) => t.tile === "friends")!.lines).toEqual(["Added a friend"]);
    expect(w.tiles.find((t) => t.tile === "standing")!.lines).toEqual(["Added an office or role"]);
    expect(w.tiles.find((t) => t.tile === "work")!.lines).toEqual(["2 events on the calendar"]);
    expect(w.tiles.find((t) => t.tile === "fitness")!.href).toBe("/life/body?k=fitness");
  });

  it("names the qualities written about, and none it cannot name", () => {
    expect(weekLook(base, { from: "2026-11-16", to: "2026-11-18" }).qualities).toEqual([{ id: "focus", name: "Focus on one thing", entries: 1, href: "/schole/qualities/focus" }]);
    expect(weekLook({ ...base, traitName: () => undefined }, { from: "2026-11-16", to: "2026-11-18" }).qualities).toEqual([]);
  });

  it("is empty for an empty week", () => {
    expect(weekLook({ ...base, readingDays: 0, finished: [] }, { from: "2026-12-01", to: "2026-12-07" })).toEqual({ tiles: [], qualities: [] });
  });
});
