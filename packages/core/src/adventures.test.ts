import { describe, expect, it } from "vitest";
import { ADVENTURE_TILES, adventureOf, adventuresIn, IDEAS, tilesOf, toggleTile } from "./adventures";
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
    const body = cleanBody(k, { name: "Learn to play piano", ref: "piano", tiles: "learn", with: "alone", extra: 1 });
    expect(body).toEqual({ name: "Learn to play piano", ref: "piano", tiles: "learn", with: "alone" });
    const a = adventureOf({ id: "a", state: "not-yet", body });
    expect(a).toEqual({ id: "a", name: "Learn to play piano", tiles: ["learn"], with: "alone", done: false });
  });

  it("follows an adventure into each tile it touches, Not yet first", () => {
    const all = [
      adventureOf({ id: "1", state: "done", body: { name: "Learn to play piano", tiles: "learn" } }),
      adventureOf({ id: "2", state: "not-yet", body: { name: "Start a band", tiles: "learn,friends" } }),
    ];
    expect(adventuresIn(all, "learn").map((a) => a.id)).toEqual(["2", "1"]);
    expect(adventuresIn(all, "friends").map((a) => a.id)).toEqual(["2"]);
  });
});
