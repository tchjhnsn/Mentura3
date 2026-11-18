import { describe, expect, it } from "vitest";
import { briefOf, cleanDashEvent, isOwnerOf, median, namesMember, nextItem, usageOf, type TodayFacts } from "./dashboard-reach";

const item = (title: string, starts: string | null, day = "2026-11-18") => ({ id: title, day, title, when: starts ?? "All day", starts, href: `/calendar?day=${day}` });
const facts = (over: Partial<TodayFacts> = {}): TodayFacts => ({
  day: "2026-11-18", next: null, today: [], tomorrow: [], people: [], money: { left_to_allot: 0, allotted: 0, take_home: 0, href: "/plan" }, events: [], cards: [], ...over,
});

describe("nextItem", () => {
  it("takes the first item not yet started, an all-day one counting, else the first of the day", () => {
    const day = [item("Standup", "09:00"), item("Lunch", "12:00"), item("Gym", "18:00")];
    expect(nextItem(day, "10:30")?.title).toBe("Lunch");
    expect(nextItem(day, "20:00")?.title).toBe("Standup");
    expect(nextItem([item("Holiday", null), ...day], "10:30")?.title).toBe("Holiday");
    expect(nextItem([], "10:30")).toBeNull();
  });
});

describe("briefOf", () => {
  it("says the day in a few plain lines from the dashboard's facts", () => {
    const today = [item("Standup", "09:00"), item("Dentist", "14:00")];
    const b = briefOf(facts({
      next: today[0], today,
      people: [{ name: "Ada", why: "wrote to you", text: "hi", href: "/x" }, { name: "Ada", why: "wants to connect", text: "", href: "/y" }, { name: "Bo", why: "wrote to you", text: "", href: "/z" }],
      money: { left_to_allot: 420, allotted: 3580, take_home: 4000, href: "/plan" },
      events: [{ id: "e", title: "Night market", starts_at: null, venue: null, going: true, href: "/events/e" }],
    }), "Sam");
    expect(b.subject).toBe("Today: Standup");
    expect(b.lines).toEqual(["Good morning, Sam.", "2 things on your calendar today. First: Standup at 09:00.", "Waiting on you: Ada, Bo.", "$420 left to allot this month.", "Going: Night market."]);
  });

  it("says when the calendar is empty, the budget is over, and leaves out money with no take-home", () => {
    expect(briefOf(facts()).lines).toEqual(["Good morning.", "Nothing on your calendar today."]);
    expect(briefOf(facts({ money: { left_to_allot: -50, allotted: 1050, take_home: 1000, href: "/plan" } })).lines[2]).toBe("Your budget is over by $50 a month.");
    expect(briefOf(facts({ people: [{ name: "Ada", why: "wrote to you", text: "", href: "/x" }] })).subject).toBe("Today: 1 person waiting");
  });
});

describe("namesMember", () => {
  it("finds a member's first or full name as a whole word, with a possessive", () => {
    expect(namesMember("Take Mom to the doctor", "Mom")).toBe(true);
    expect(namesMember("Grace's recital", "Grace Lee")).toBe(true);
    expect(namesMember("Pick up grace lee", "Grace Lee")).toBe(true);
    expect(namesMember("Graceland trip", "Grace")).toBe(false);
    expect(namesMember("", "Grace")).toBe(false);
    expect(namesMember("Anything", "")).toBe(false);
    expect(namesMember("A (b) c", "(b)")).toBe(true);
    expect(namesMember("A b c", "(b)")).toBe(false);
  });
});

describe("usage", () => {
  it("takes the median of odd and even lists", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(3);
  });

  it("counts opens, taps per card most first, and the median time to first act", () => {
    const u = usageOf([
      { kind: "open", card: "page", ms: null }, { kind: "open", card: "page", ms: null },
      { kind: "tap", card: "today", ms: null }, { kind: "tap", card: "money", ms: null }, { kind: "tap", card: "today", ms: null },
      { kind: "first_act", card: "today", ms: 2000 }, { kind: "first_act", card: "money", ms: 6000 },
    ]);
    expect(u).toEqual({ opens: 2, taps: [{ card: "today", taps: 2 }, { card: "money", taps: 1 }], firstActs: 2, medianMs: 4000 });
  });

  it("checks a beacon's body", () => {
    expect(cleanDashEvent({ kind: "open" })).toEqual({ kind: "open", card: "page", ms: null });
    expect(cleanDashEvent({ kind: "tap", card: "ask" })).toEqual({ kind: "tap", card: "ask", ms: null });
    expect(cleanDashEvent({ kind: "first_act", card: "today", ms: 1234.4 })).toEqual({ kind: "first_act", card: "today", ms: 1234 });
    expect(cleanDashEvent({ kind: "first_act", card: "today", ms: 4_000_000 })).toBeNull();
    expect(cleanDashEvent({ kind: "first_act", card: "today" })).toBeNull();
    expect(cleanDashEvent({ kind: "tap", card: "Bad Card!" })).toBeNull();
    expect(cleanDashEvent({ kind: "view", card: "today" })).toBeNull();
    expect(cleanDashEvent(null)).toBeNull();
  });
});

describe("isOwnerOf", () => {
  it("is the open-mode owner or an email in the list, case and spaces aside", () => {
    expect(isOwnerOf({ id: "reflect-owner" }, "reflect-owner")).toBe(true);
    expect(isOwnerOf({ id: "u1", email: "Ada@Example.com" }, "reflect-owner", " ada@example.com , bo@x.org")).toBe(true);
    expect(isOwnerOf({ id: "u1", email: "eve@example.com" }, "reflect-owner", "ada@example.com")).toBe(false);
    expect(isOwnerOf({ id: "u1", email: "" }, "reflect-owner", "")).toBe(false);
  });
});
