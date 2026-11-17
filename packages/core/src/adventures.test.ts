import { describe, expect, it } from "vitest";
import { ADVENTURE_TILES, adventureOf, adventuresIn, cleanChecklist, cleanPlan, daysUntil, IDEAS, nextUp, tilesOf, toggleTile } from "./adventures";
import { cleanBody, kindOf } from "./life";

describe("adventures", () => {
  it("starts every idea on tiles that exist", () => {
    for (const i of IDEAS.flatMap((g) => g.ideas)) for (const t of i.tiles) expect(ADVENTURE_TILES, i.id).toContain(t);
  });

  it("keeps tiles in Home's order and turns one on or off", () => {
    expect(tilesOf("friends,learn,nope")).toEqual(["learn", "friends"]);
    expect(toggleTile("learn", "friends")).toBe("learn,friends");
    expect(toggleTile("learn,friends", "learn")).toBe("friends");
    expect(toggleTile("learn", "nope")).toBe("learn");
  });

  it("is kept as a hidden kind whose body survives cleaning", () => {
    const k = kindOf("legacy", "adventure")!;
    expect(k.hidden).toBe(true);
    const body = cleanBody(k, { name: "Go camping", ref: "camping", tiles: "fitness", with: "friends", lat: 36.57, lon: -118.29, extra: 1 });
    expect(body).toEqual({ name: "Go camping", ref: "camping", tiles: "fitness", with: "friends", lat: 36.57, lon: -118.29 });
    const a = adventureOf({ id: "a", state: "not-yet", body });
    expect(a).toMatchObject({ id: "a", name: "Go camping", tiles: ["fitness"], with: "friends", done: false, lat: 36.57, lon: -118.29, plan: [], checklist: [], people: [] });
  });

  it("follows an adventure into each tile it touches, Not yet first", () => {
    const all = [
      adventureOf({ id: "1", state: "done", body: { name: "Visit a national park", tiles: "learn" } }),
      adventureOf({ id: "2", state: "not-yet", body: { name: "Start a band", tiles: "learn,friends" } }),
    ];
    expect(adventuresIn(all, "learn").map((a) => a.id)).toEqual(["2", "1"]);
    expect(adventuresIn(all, "friends").map((a) => a.id)).toEqual(["2"]);
  });

  it("keeps a plan's days and stops clean: times, https links and coordinates only", () => {
    const plan = cleanPlan(JSON.stringify([
      { day: "2026-12-12", title: "Drive in", stops: [{ time: "09:00", title: "Leave", link: "http://x.test", lat: 95 }, { title: "Camp", link: "https://www.recreation.gov/x", lat: 36.5, lon: -118.7 }, { note: "no title" }] },
      { stops: [] },
    ]));
    expect(plan).toEqual([{ day: "2026-12-12", title: "Drive in", stops: [
      { time: "09:00", title: "Leave", note: null, link: null, lat: null, lon: null },
      { time: null, title: "Camp", note: null, link: "https://www.recreation.gov/x", lat: 36.5, lon: -118.7 },
    ] }]);
    expect(cleanChecklist(["Tent", { text: "Stove", done: true }, ""])).toEqual([{ text: "Tent", done: false }, { text: "Stove", done: true }]);
  });

  it("puts the soonest adventure ahead next, else the newest not done", () => {
    const a = (id: string, start?: string, state = "not-yet") => adventureOf({ id, state, body: { name: id, start } });
    const all = [a("later", "2026-12-20"), a("soon", "2026-11-20"), a("past", "2026-10-01"), a("done", "2026-11-18", "done")];
    expect(daysUntil(all[1], "2026-11-17")).toBe(3);
    expect(daysUntil(all[2], "2026-11-17")).toBeNull();
    expect(nextUp(all, "2026-11-17")?.id).toBe("soon");
    expect(nextUp([a("x"), a("y")], "2026-11-17")?.id).toBe("x");
  });
});
