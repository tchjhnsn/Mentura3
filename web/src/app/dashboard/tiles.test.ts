import { describe, expect, it } from "vitest";
import type { HomeCard } from "@reflect/core/home-cards";
import { ago, foodLeft, habitsOf, shareOf, spendRows, underWay, ventureInProgress, ventureNext, workName } from "./tiles";

const rec = (id: string, state: string | null, updatedAt: string, kind = "venture") => ({ id, kind, state, updatedAt });

describe("ventureInProgress", () => {
  it("prefers starting, then operating, then an idea, the latest changed first", () => {
    expect(ventureInProgress([rec("a", "operating", "2026-11-10"), rec("b", "starting", "2026-11-01"), rec("c", "starting", "2026-11-05")])?.id).toBe("c");
    expect(ventureInProgress([rec("a", "idea", "2026-11-10"), rec("b", "operating", "2026-11-01")])?.id).toBe("b");
  });
  it("never shows a paused or closed venture, or another kind", () => {
    expect(ventureInProgress([rec("a", "paused", "2026-11-10"), rec("b", "closed", "2026-11-10"), rec("c", "starting", "2026-11-10", "adventure")])).toBeNull();
  });
});

describe("ventureNext", () => {
  const v = (state: string, body: Record<string, unknown> = {}) => ({ state, body });
  it("asks to start in Naive while no files are kept", () => {
    expect(ventureNext(v("starting"), { files: 0, notAsked: 3 })).toMatch(/start it in Naive/);
  });
  it("then asks people who build", () => {
    expect(ventureNext(v("starting"), { files: 4, notAsked: 1 })).toBe("Next: ask one person to build with you");
    expect(ventureNext(v("starting"), { files: 4, notAsked: 2 })).toBe("Next: ask 2 people to build with you");
  });
  it("then what an operating venture clears, else what it sells, else nothing", () => {
    expect(ventureNext(v("operating", { revenue: 1200, costs: 1500 }), { files: 4, notAsked: 0 })).toBe("-$300 a month after costs");
    expect(ventureNext(v("starting", { what: "Prints " }), { files: 4, notAsked: 0 })).toBe("Prints");
    expect(ventureNext(v("idea"), { files: 4, notAsked: 0 })).toBeNull();
  });
});

describe("underWay", () => {
  const item = (id: string, medium: string, status: string, at: string) => ({ id, medium, status, at });
  it("keeps what is listened to or watched and under way, latest touched first", () => {
    const items = [item("a", "podcast", "doing", "2026-11-01"), item("b", "course", "doing", "2026-11-02"), item("c", "article", "doing", "2026-11-03"), item("d", "film", "done", "2026-11-04")];
    expect(underWay(items, new Map()).map((i) => i.id)).toEqual(["b", "a"]);
    expect(underWay(items, new Map([["a", Date.parse("2026-11-10")]])).map((i) => i.id)).toEqual(["a", "b"]);
  });
  it("gives a share only with parts", () => {
    expect(shareOf({ part: 3, parts: 12 })).toBe(0.25);
    expect(shareOf({ part: null, parts: 12 })).toBeNull();
  });
});

describe("foodLeft", () => {
  it("is null without a food allotment", () => {
    expect(foodLeft(undefined, 40)).toBeNull();
    expect(foodLeft(null, 40)).toBeNull();
  });
  it("holds spending against the allotment", () => {
    expect(foodLeft(400, 100)).toEqual({ allot: 400, spent: 100, left: 300, share: 0.25 });
    expect(foodLeft(400, 500)).toMatchObject({ left: -100, share: 1 });
  });
});

describe("spendRows", () => {
  const tiles = [{ tile: "food", label: "Food", allot: 400 }, { tile: "shelter", label: "Shelter", allot: 1600 }, { tile: "learn", label: "Scholē", allot: null }, { tile: "water", label: "Water", allot: 0 }];
  it("shows only tiles with an allotment", () => {
    expect(spendRows(tiles, {}).map((r) => r.tile)).toEqual(["food", "shelter"]);
  });
  it("leaves spending null where it is not recorded, and never makes one up", () => {
    const rows = spendRows(tiles, { food: 100 });
    expect(rows[0]).toMatchObject({ spent: 100, share: 0.25, over: false });
    expect(rows[1]).toMatchObject({ spent: null, share: 1, over: false });
    expect(spendRows(tiles, {})[0]).toMatchObject({ spent: null, share: 0.25 });
  });
  it("marks a tile over its allotment", () => {
    expect(spendRows(tiles, { food: 450 })[0]).toMatchObject({ over: true, share: 1 });
  });
});

describe("workName", () => {
  it("uses the title, else Untitled and the kind, never the text", () => {
    expect(workName({ title: " A letter to my sister ", kind: "letter" })).toBe("A letter to my sister");
    expect(workName({ title: "", kind: "essay" })).toBe("Untitled essay");
  });
});

describe("habitsOf", () => {
  const card = (id: string, content: HomeCard["content"]): HomeCard => ({ id, tile: "fitness", title: id, start: "2026-11-01", end: "2026-12-01", schedule: null, content, created: "2026-11-01T00:00:00Z" });
  it("keeps streaks and checklists, with today's run and mark", () => {
    const out = habitsOf([
      card("walk", { kind: "streak", label: "A walk", days: ["2026-11-16", "2026-11-17"] }),
      card("list", { kind: "checklist", items: [{ text: "Water", done: true }] }),
      card("word", { kind: "word", words: [{ word: "eudaimonia", meaning: "flourishing" }] }),
    ], "2026-11-18");
    expect(out).toEqual([
      { id: "walk", kind: "streak", title: "walk", label: "A walk", days: 2, marked: false },
      { id: "list", kind: "checklist", title: "list", items: [{ text: "Water", done: true }] },
    ]);
  });
});

describe("ago", () => {
  const now = new Date("2026-11-18T18:00:00Z");
  it("says how long ago in plain words", () => {
    expect(ago("2026-11-18T17:59:30Z", now)).toBe("just now");
    expect(ago("2026-11-18T17:40:00Z", now)).toBe("20 minutes ago");
    expect(ago("2026-11-18T15:00:00Z", now)).toBe("3 hours ago");
    expect(ago("2026-11-17T12:00:00Z", now)).toBe("yesterday");
    expect(ago("2026-11-14T12:00:00Z", now)).toBe("4 days ago");
    expect(ago("2026-10-01T12:00:00Z", now)).toBe("Oct 1");
  });
});
