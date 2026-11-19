import { describe, expect, it } from "vitest";
import { agenda, calendarRange, eventInputOf, isRecordEvent, whenOf, monthGrid, occurrences, recordEvents, shiftMonth, type CalEvent } from "./calendar";

const ev = (o: Partial<CalEvent>): CalEvent => ({ id: "e", tile: "work", title: "Shift", note: null, day: "2026-11-02", starts: null, ends: null, repeat: "none", until: null, recordId: null, ...o });

describe("the calendar", () => {
  it("places a one-off event and repeats weekly until its end", () => {
    expect(occurrences([ev({})], "2026-11-01", "2026-11-30").map((o) => o.day)).toEqual(["2026-11-02"]);
    expect(occurrences([ev({ repeat: "weekly", until: "2026-11-20" })], "2026-11-01", "2026-11-30").map((o) => o.day)).toEqual(["2026-11-02", "2026-11-09", "2026-11-16"]);
  });

  it("skips months without the day, and orders by day then time", () => {
    expect(occurrences([ev({ day: "2026-01-31", repeat: "monthly" })], "2026-01-01", "2026-05-31").map((o) => o.day)).toEqual(["2026-01-31", "2026-03-31", "2026-05-31"]);
    const list = occurrences([ev({ id: "b", title: "B", starts: "14:00" }), ev({ id: "a", title: "A", starts: "09:00" })], "2026-11-02", "2026-11-02");
    expect(list.map((o) => o.event.title)).toEqual(["A", "B"]);
  });

  it("lays out a month from the Monday before its first day", () => {
    const g = monthGrid("2026-11");
    expect(g[0]).toBe("2026-10-26");
    expect(g).toHaveLength(42);
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("recordEvents", () => {
  it("puts the days records hold on the calendar, birthdays each year", () => {
    const ev = recordEvents([
      { id: "d", app: "mate", kind: "date", state: "planned", body: { who: "R", day: "2026-11-20" } },
      { id: "x", app: "mate", kind: "date", state: "missed", body: { who: "S", day: "2026-11-21" } },
      { id: "m", app: "kin", kind: "relative", state: "independent", body: { name: "Mom", born: "1950-11-30" } },
      { id: "t", app: "polis", kind: "duty", state: "done", body: { name: "Taxes", due: "2026-11-25" } },
      { id: "f", app: "friends", kind: "friend", state: "friend", body: { name: "Ann" } },
    ]);
    expect(ev.map((e) => [e.id, e.title, e.tile])).toEqual([["record:d:day", "Date with R", "mate"], ["record:m:born", "Mom's birthday", "kin"]]);
    expect(occurrences(ev, "2026-11-01", "2026-11-30").map((o) => o.day)).toEqual(["2026-11-20", "2026-11-30"]);
    expect(isRecordEvent(ev[0]!)).toBe(true);
  });

  it("keeps a yearly duty after it is done, and puts the day you plan to vote on the calendar", () => {
    const ev = recordEvents([
      { id: "t", app: "polis", kind: "duty", state: "done", body: { name: "Taxes", due: "2026-04-15", repeats: "every-year" } },
      { id: "e", app: "polis", kind: "election", state: "coming", body: { name: "General", day: "2026-11-30", how: "early-in-person", when: "2026-11-24" } },
    ]);
    expect(ev.map((e) => [e.title, e.repeat])).toEqual([["Taxes due", "yearly"], ["General", "none"], ["Vote, early in person: General", "none"]]);
  });
});

describe("the calendar for the chat", () => {
  it("reads a week by default and at most 92 days", () => {
    expect(calendarRange("2026-11-17")).toEqual({ from: "2026-11-17", to: "2026-11-24" });
    expect(calendarRange("2026-11-17", "2026-11-17")).toEqual({ from: "2026-11-17", to: "2026-11-17" });
    expect(calendarRange("2026-11-17", "2027-12-01")).toEqual({ from: "2026-11-17", to: "2027-02-16" });
    expect(calendarRange("2026-11-17", "2026-11-01")).toEqual({ from: "2026-11-17", to: "2026-11-24" });
    expect(calendarRange("tomorrow")).toBeNull();
  });

  it("lists each day an event falls on with its time, tile and page", () => {
    const list = agenda(occurrences([ev({ id: "w", repeat: "weekly", starts: "09:00", ends: "10:30" }), ev({ id: "record:r:day", tile: "mate", title: "Date with R", day: "2026-11-03" })], "2026-11-01", "2026-11-09"));
    expect(list.map((x) => [x.day, x.when, x.tile_label, x.from_record])).toEqual([["2026-11-02", "09:00–10:30", "Ergon", false], ["2026-11-03", "All day", "Mate", true], ["2026-11-09", "09:00–10:30", "Ergon", false]]);
    expect(list[0]!.href).toBe("/calendar?day=2026-11-02");
    expect(whenOf({ starts: "18:00", ends: null })).toBe("18:00");
  });

  it("turns a tool's event into the store's shape", () => {
    expect(eventInputOf({ title: "Dinner with Sam", day: "2026-11-20", starts: "19:00", tile: "friends" })).toEqual({ title: "Dinner with Sam", day: "2026-11-20", starts: "19:00", ends: null, tile: "friends", repeat: "none", until: null, note: null });
  });
});
