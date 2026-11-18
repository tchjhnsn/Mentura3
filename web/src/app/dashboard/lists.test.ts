import { describe, expect, it } from "vitest";
import { alikeKeys, distinctChats, groupRepeats, isMealEvent, mealLine, pickEvents, repeatKey, repeatLabel, type DayItem } from "./lists";

const item = (id: string, title: string, over: Partial<DayItem> = {}): DayItem => ({ id, day: "2026-11-18", title, when: "All day", starts: null, tile: "polis", href: "/calendar?day=2026-11-18", ...over });

describe("repeatKey and repeatLabel", () => {
  it("take digits and ids out", () => {
    expect(repeatKey("Renew a permit desktop 1794710830604 due")).toBe("renew a permit desktop due");
    expect(repeatKey("Renew a permit desktop 1794711066008 due")).toBe("renew a permit desktop due");
    expect(repeatKey("Call 3 people")).toBe("call people");
    expect(repeatKey("Sync a1b2c3d4e5f6 notes")).toBe("sync notes");
    expect(repeatLabel("Renew a permit desktop 1794710830604 due")).toBe("Renew a permit desktop due");
    expect(repeatLabel("Call 3 people")).toBe("Call 3 people");
  });
});

describe("groupRepeats", () => {
  it("folds alike items into one line at the first one's place", () => {
    const list = [
      item("a", "Dentist", { tile: "body" }),
      ...Array.from({ length: 14 }, (_, i) => item(`p${i}`, `Renew a permit desktop ${1794710830604 + i * 1000} due`)),
      item("b", "Vote: city election"),
    ];
    const lines = groupRepeats(list);
    expect(lines.map((l) => l.kind)).toEqual(["one", "group", "one"]);
    const g = lines[1]!;
    expect(g.kind === "group" && g.count).toBe(14);
    expect(g.kind === "group" && g.label).toBe("Renew a permit desktop due");
    expect(g.kind === "group" && g.first.id).toBe("p0");
  });
  it("keeps different tiles, different days and lone items apart", () => {
    const lines = groupRepeats([item("a", "Walk 1", { tile: "body" }), item("b", "Walk 2", { tile: "home" }), item("c", "Walk 3", { tile: "body", day: "2026-11-19" }), item("d", "Lunch")]);
    expect(lines.every((l) => l.kind === "one")).toBe(true);
  });
  it("folds titles that differ in one word of three or more, keeping the shared words", () => {
    const list = [item("a", "Renew a permit desktop 1794710830604 due"), item("b", "Renew a permit phone 1794710830999 due"), item("c", "Renew a permit desktop 1794710831000 due")];
    const lines = groupRepeats(list);
    expect(lines.length).toBe(1);
    expect(lines[0]!.kind === "group" && lines[0]!.label).toBe("Renew a permit due");
    expect(lines[0]!.kind === "group" && lines[0]!.count).toBe(3);
    expect(alikeKeys("walk dog", "walk cat")).toBe(false);
    expect(alikeKeys("pay rent due", "pay water bill")).toBe(false);
  });
  it("needs `min` alike to fold", () => {
    expect(groupRepeats([item("a", "Task 1"), item("b", "Task 2")], 3).every((l) => l.kind === "one")).toBe(true);
    expect(groupRepeats([item("a", "Task 1"), item("b", "Task 2")]).length).toBe(1);
  });
  it("does not fold titles that are only digits", () => {
    expect(groupRepeats([item("a", "1234"), item("b", "5678")]).length).toBe(2);
  });
});

describe("meals", () => {
  it("tells a planned meal from other events", () => {
    expect(isMealEvent({ id: "e1", tile: "home", recordId: "r1" })).toBe(true);
    expect(isMealEvent({ id: "record:r1:due", tile: "home", recordId: "r1" })).toBe(false);
    expect(isMealEvent({ id: "e2", tile: "home", recordId: null })).toBe(false);
    expect(isMealEvent({ id: "e3", tile: null, recordId: "r2" })).toBe(false);
  });
  it("makes one Food line", () => {
    expect(mealLine([])).toBeNull();
    expect(mealLine(["Baked chicken"])).toEqual({ title: "Baked chicken", detail: "Meal planned" });
    expect(mealLine(["Baked chicken", "Fried rice", "Baked chicken"])).toEqual({ title: "3 meals planned", detail: "Baked chicken, Fried rice" });
  });
});

describe("pickEvents", () => {
  const now = new Date("2026-11-18T18:00:00Z");
  const ev = (id: string, iso: string | null) => ({ id, startsAt: iso });
  it("drops events that began more than a day ago and puts upcoming ones first", () => {
    const list = [ev("old", "2026-11-15T06:00:00Z"), ev("yday", "2026-11-17T20:00:00Z"), ev("now1", "2026-11-18T19:00:00Z"), ev("later", "2026-11-20T15:00:00Z"), ev("none", null)];
    expect(pickEvents(list, now, 3).map((e) => e.id)).toEqual(["now1", "later", "yday"]);
    expect(pickEvents(list, now, 1).map((e) => e.id)).toEqual(["now1"]);
  });
});

describe("distinctChats", () => {
  it("keeps one of each title", () => {
    const chats = [{ id: "1", title: "Quote Plato" }, { id: "2", title: "quote  plato" }, { id: "3", title: "Budget" }, { id: "4", title: "Books" }, { id: "5", title: "Brother" }, { id: "6", title: "More" }];
    expect(distinctChats(chats, 4).map((c) => c.id)).toEqual(["1", "3", "4", "5"]);
  });
});
