import { describe, expect, it } from "vitest";
import { arrange, cleanLayout, EMPTY_LAYOUT, hoursSince, minutesBetween, movable, moveTo, nextDay, overdueScore, soonScore, waitingScore } from "./urgency";

const defs = [
  { id: "today", column: "main" as const },
  { id: "people", column: "main" as const },
  { id: "money", column: "side" as const },
  { id: "events", column: "side" as const },
];

describe("urgency scores", () => {
  it("reads minutes between clock times", () => {
    expect(minutesBetween("09:00", "09:30")).toBe(30);
    expect(minutesBetween("14:10", "13:40")).toBe(-30);
  });

  it("ranks an event sooner higher, and nothing for one long past or far off", () => {
    expect(soonScore(30)).toBeGreaterThan(soonScore(45));
    expect(soonScore(45)).toBeGreaterThan(soonScore(120));
    expect(soonScore(120)).toBeGreaterThan(soonScore(600));
    expect(soonScore(-20)).toBe(70);
    expect(soonScore(-90)).toBe(0);
    expect(soonScore(2 * 24 * 60)).toBe(0);
    expect(soonScore(null)).toBe(0);
  });

  it("ranks people waiting by how many and how long", () => {
    expect(waitingScore(0, 100)).toBe(0);
    expect(waitingScore(1, 1)).toBe(60);
    expect(waitingScore(3, 1)).toBe(70);
    expect(waitingScore(1, 30)).toBe(70);
    expect(waitingScore(20, 99)).toBe(85);
  });

  it("ranks overdue above all else, more the later it is", () => {
    expect(overdueScore(0)).toBe(0);
    expect(overdueScore(1)).toBe(88);
    expect(overdueScore(1)).toBeGreaterThan(waitingScore(20, 99));
    expect(overdueScore(100)).toBe(98);
  });

  it("an event in 30 minutes outranks a connect request; a request outranks an event this evening", () => {
    expect(soonScore(30)).toBeGreaterThan(waitingScore(1, 2));
    expect(waitingScore(1, 2)).toBeGreaterThan(soonScore(300));
  });

  it("reads hours since a time", () => {
    const now = new Date("2026-11-18T12:00:00Z");
    expect(hoursSince("2026-11-17T12:00:00Z", now)).toBe(24);
    expect(hoursSince(null, now)).toBe(0);
    expect(hoursSince("not a time", now)).toBe(0);
  });
});

describe("arranging the cards", () => {
  it("orders by score with ties in the registry's order, the top one leading", () => {
    const a = arrange(defs, { events: 50, people: 60 }, EMPTY_LAYOUT);
    expect(a.order).toEqual(["people", "events", "today", "money"]);
    expect(a.lead).toBe("people");
    expect(a.custom).toBe(false);
  });

  it("has no lead when nothing is pressing", () => {
    const a = arrange(defs, {}, EMPTY_LAYOUT);
    expect(a.order).toEqual(["today", "people", "money", "events"]);
    expect(a.lead).toBeNull();
  });

  it("keeps the person's own order, a card it does not name following by urgency, and still names the lead", () => {
    const a = arrange(defs, { events: 90 }, { order: ["money", "today", "gone"], hidden: [], size: {} });
    expect(a.order).toEqual(["money", "today", "events", "people"]);
    expect(a.lead).toBe("events");
    expect(a.custom).toBe(true);
  });

  it("leaves hidden cards out, even the most urgent", () => {
    const a = arrange(defs, { people: 80 }, { order: [], hidden: ["people", "nope"], size: {} });
    expect(a.order).toEqual(["today", "money", "events"]);
    expect(a.hidden).toEqual(["people"]);
    expect(a.lead).toBeNull();
  });

  it("sizes main cards wide and side cards normal unless the person chose", () => {
    const a = arrange(defs, {}, { order: [], hidden: [], size: { today: "normal", money: "wide" } });
    expect(a.size).toEqual({ today: "normal", people: "wide", money: "wide", events: "normal" });
  });

  it("moves a card to another's place", () => {
    expect(moveTo(["a", "b", "c", "d"], "a", "c")).toEqual(["b", "c", "a", "d"]);
    expect(moveTo(["a", "b", "c", "d"], "d", "b")).toEqual(["a", "d", "b", "c"]);
    expect(moveTo(["a", "b"], "a", "x")).toEqual(["a", "b"]);
  });
});

describe("the layout as kept", () => {
  it("keeps card ids once, and only normal or wide sizes", () => {
    expect(cleanLayout({ order: ["today", "today", "Bad Id", 3, "money"], hidden: "x", size: { today: "wide", money: "huge", "no way": "wide" } }))
      .toEqual({ order: ["today", "money"], hidden: [], size: { today: "wide" } });
    expect(cleanLayout(null)).toEqual(EMPTY_LAYOUT);
  });
});

describe("moving a Today item", () => {
  it("moves only the person's own one-off events", () => {
    expect(movable({ id: "3f2b8c1e-1d2a-4c3b-9a8b-7c6d5e4f3a2b", repeat: "none" })).toBe(true);
    expect(movable({ id: "3f2b8c1e-1d2a-4c3b-9a8b-7c6d5e4f3a2b", repeat: "weekly" })).toBe(false);
    expect(movable({ id: "google:abc" })).toBe(false);
    expect(movable({ id: "feed:f1:a" })).toBe(false);
    expect(movable({ id: "event:3f2b8c1e-1d2a-4c3b-9a8b-7c6d5e4f3a2b" })).toBe(false);
    expect(movable({ id: "record:1:due", from_record: true })).toBe(false);
  });

  it("finds the next day across a month's end", () => {
    expect(nextDay("2026-11-30")).toBe("2026-12-01");
    expect(nextDay("2026-12-31")).toBe("2027-01-01");
  });
});
