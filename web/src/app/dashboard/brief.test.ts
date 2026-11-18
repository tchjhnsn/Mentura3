import { describe, expect, it } from "vitest";
import { briefFacts, chipTitle, briefLines, briefPrompt, DEFAULT_SUGGESTIONS, plainBrief, readBrief, suggestionsFrom, type BriefInput } from "./brief";

const empty: BriefInput = { calendar: [], clock: "08:00", requests: [], waiting: [], money: null, going: null, eventsThisWeek: 0, reading: [], building: [] };
const full: BriefInput = {
  calendar: [
    { title: "Standup", when: "07:30", starts: "07:30", href: "/calendar?day=2026-11-18" },
    { title: "Permit review", when: "10:00", starts: "10:00", href: "/calendar?day=2026-11-18" },
    { title: "Rent due", when: "All day", starts: null, href: "/calendar?day=2026-11-18" },
  ],
  clock: "08:15",
  requests: [{ name: "Ana" }],
  waiting: [{ name: "Bo", href: "/life/friends/messages/bo" }],
  money: { set: false, leftToAllot: 0 },
  going: null,
  eventsThisWeek: 5,
  reading: [{ title: "Meditations", href: "/schole/works/meditations" }],
  building: [{ name: "Print shop", href: "/life/ventures/abc" }],
};

describe("briefFacts", () => {
  it("names the day's next thing, people, money, events, reading and building, each with its page", () => {
    const f = briefFacts(full);
    expect(f.map((x) => x.kind)).toEqual(["calendar", "requests", "waiting", "budget-unset", "events", "reading", "building"]);
    expect(f.map((x) => x.id)).toEqual(["f1", "f2", "f3", "f4", "f5", "f6", "f7"]);
    expect(f[0]?.text).toBe("3 things on the calendar today; next is Permit review at 10:00");
    expect(f[2]).toMatchObject({ text: "Bo is waiting on a reply", href: "/life/friends/messages/bo", label: "Bo" });
    for (const x of f) expect(x.href.startsWith("/")).toBe(true);
  });

  it("says a free day when the calendar is empty, and leaves out what it does not know", () => {
    expect(briefFacts(empty)).toEqual([{ id: "f1", kind: "free", n: 0, href: "/calendar", label: "Calendar", text: "Nothing on the calendar today" }]);
  });

  it("reads money over take-home and the event the person is going to", () => {
    const f = briefFacts({ ...empty, money: { set: true, leftToAllot: -120 }, going: { title: "Founders coffee", when: "Thu, Nov 19, 9:00 AM", href: "/events/1" }, eventsThisWeek: 9 });
    expect(f.find((x) => x.kind === "money")?.text).toBe("The budget is over take-home by $120 a month");
    expect(f.find((x) => x.kind === "going")?.href).toBe("/events/1");
    expect(f.some((x) => x.kind === "events")).toBe(false);
  });
});

describe("readBrief", () => {
  const facts = briefFacts(full);

  it("keeps sentences that cite known facts and strips the ids", () => {
    const s = readBrief("You have 3 things today, next is Permit review at 10:00 [f1].\nBo is waiting on you and Ana wants to connect [f3][f2].", facts);
    expect(s).toEqual([
      { text: "You have 3 things today, next is Permit review at 10:00.", cites: ["f1"] },
      { text: "Bo is waiting on you and Ana wants to connect.", cites: ["f3", "f2"] },
    ]);
  });

  it("fails closed: drops a sentence with no citation or an unknown id", () => {
    const s = readBrief("A lovely day ahead!\nYou won the lottery [f99].\nNo budget is set yet [f4].", facts);
    expect(s).toEqual([{ text: "No budget is set yet.", cites: ["f4"] }]);
  });

  it("splits sentences on one line, drops list marks and keeps at most four", () => {
    const s = readBrief("- One thing first today [f1]. Then Bo is waiting [f3].\n1. Reading Meditations [f6].\nBuilding Print shop [f7].\nFive events this week [f5].", facts);
    expect(s.map((x) => x.cites)).toEqual([["f1"], ["f3"], ["f6"], ["f7"]]);
  });

  it("reads nothing from nothing", () => {
    expect(readBrief(null, facts)).toEqual([]);
    expect(readBrief("", facts)).toEqual([]);
  });
});

describe("briefLines and plainBrief", () => {
  it("renders each cited fact as a link once, and drops a sentence citing an unknown fact", () => {
    const facts = briefFacts(full);
    const lines = briefLines([{ text: "A.", cites: ["f1"] }, { text: "B.", cites: ["f1", "f3"] }, { text: "C.", cites: ["f42"] }], facts);
    expect(lines).toEqual([
      { text: "A.", links: [{ label: "Calendar", href: "/calendar?day=2026-11-18" }] },
      { text: "B.", links: [{ label: "Bo", href: "/life/friends/messages/bo" }] },
    ]);
  });

  it("builds a plain brief of up to four facts when there is no model", () => {
    const p = plainBrief(briefFacts(full));
    expect(p).toHaveLength(4);
    expect(p[0]).toEqual({ text: "3 things on the calendar today; next is Permit review at 10:00.", cites: ["f1"] });
  });

  it("puts only the facts in the prompt, each with its id", () => {
    const facts = briefFacts(full);
    const prompt = briefPrompt(facts, "Good morning");
    for (const f of facts) expect(prompt).toContain(`[${f.id}] ${f.text}.`);
  });
});

describe("suggestionsFrom", () => {
  it("draws four suggestions from the person's state, most pressing first", () => {
    expect(suggestionsFrom(briefFacts(full))).toEqual(["Plan my 3 things today", "Answer Bo's message", "Who is Ana?", "Set my budget"]);
  });

  it("falls back to the defaults when little is known", () => {
    const s = suggestionsFrom(briefFacts(empty));
    expect(s).toEqual(["Plan a free day", ...DEFAULT_SUGGESTIONS.slice(0, 3)]);
    expect(suggestionsFrom([])).toEqual([...DEFAULT_SUGGESTIONS]);
  });

  it("offers an event this week when nothing is planned and events are on", () => {
    expect(suggestionsFrom(briefFacts({ ...empty, eventsThisWeek: 4, money: { set: true, leftToAllot: 300 } }))).toContain("Find a coworking event this week");
  });
});

describe("chipTitle", () => {
  it("shortens a long title for a chip", () => {
    expect(chipTitle("The Future is Built Here: Candid Conversations with Investors 🚀")).toBe("The Future is Built Here");
    expect(chipTitle("Meditations")).toBe("Meditations");
    expect(chipTitle("An extremely long event title that keeps going on and on")).toBe("An extremely long event title…");
  });
});
