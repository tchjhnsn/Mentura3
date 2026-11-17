import { describe, expect, it } from "vitest";
import { COLLECTIONS, itemKey } from "./collections.ts";
import { EXEMPLARS, ROLES, TRAITS, traitsWanted } from "./formation.ts";
import { recommend, rerank, type Signals } from "./recommend.ts";

const none: Signals = { aims: [], admired: [], follows: [], kept: new Set(), finished: new Set(), liked: new Set(), disliked: new Set() };

describe("formation", () => {
  it("names only traits that exist, people that exist, and playlists that exist", () => {
    const ids = new Set(COLLECTIONS.map((c) => c.id));
    for (const t of TRAITS) for (const p of t.playlists) expect(ids.has(p), `${t.id} -> ${p}`).toBe(true);
    for (const e of EXEMPLARS) for (const x of e.traits) expect(TRAITS.some((t) => t.id === x.trait)).toBe(true);
    for (const r of ROLES) for (const x of r.exemplars) expect(EXEMPLARS.some((e) => e.id === x), x).toBe(true);
    for (const e of EXEMPLARS) expect(e.traits.length).toBeGreaterThan(0);
  });
  it("keeps only traits the admired person names", () => {
    const got = traitsWanted([{ exemplar: "andrew-carnegie", traits: ["focus", "frugality"] }]);
    expect(got.map((g) => g.trait.id)).toEqual(["focus"]);
  });
});

describe("recommend", () => {
  it("gives nothing without signals, so the page shows the editors' rows", () => {
    expect(recommend(none)).toEqual([]);
  });
  it("puts the source first and gives every pick a reason", () => {
    const picks = recommend({ ...none, admired: [{ exemplar: "benjamin-franklin", traits: ["frugality"] }] });
    expect(picks[0]!.item.title).toBe("Autobiography of Benjamin Franklin");
    expect(picks[0]!.reason).toBe("Where Benjamin Franklin names frugality");
    expect(picks.length).toBeGreaterThan(3);
    for (const p of picks) expect(p.reason).toBeTruthy();
    expect(picks.slice(1).some((p) => p.collection?.id === "making-a-living")).toBe(true);
  });
  it("ranks by the aims in Work", () => {
    const picks = recommend({ ...none, aims: ["Teacher"] });
    expect(picks[0]!.collection?.id).toBe("teaching");
    expect(picks[0]!.reason).toBe("For your aim: Teacher");
  });
  it("serves the main aim before the others", () => {
    const picks = recommend({ ...none, aims: ["Farmer", "Teacher"] });
    expect(picks[0]!.reason).toBe("For your aim: Farmer");
    const flipped = recommend({ ...none, aims: ["Teacher", "Farmer"] });
    expect(flipped[0]!.reason).toBe("For your aim: Teacher");
  });
  it("leaves out what is finished, kept or disliked", () => {
    const teaching = COLLECTIONS.find((c) => c.id === "teaching")!;
    const [a, b, c] = teaching.items;
    const picks = recommend({ ...none, aims: ["Teacher"], finished: new Set([itemKey(a!)]), kept: new Set([itemKey(b!)]), disliked: new Set([`${c!.kind === "find" ? c!.medium : c!.kind}|${c!.title.toLowerCase()}`]) });
    const keys = picks.map((p) => itemKey(p.item));
    for (const x of [a, b, c]) expect(keys).not.toContain(itemKey(x!));
    for (const p of picks) expect(p.reason).toBeTruthy();
  });
  it("follows people by name", () => {
    const picks = recommend({ ...none, follows: ["Plato"] });
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) expect(p.item.by.toLowerCase()).toContain("plato");
  });
  it("mixes a known playlist with a new one", () => {
    const greeks = COLLECTIONS.find((c) => c.id === "greeks")!;
    const picks = recommend({ ...none, aims: ["Teacher"], finished: new Set([itemKey(greeks.items[0]!)]) });
    const known = (i: number) => picks[i]!.reason.startsWith("You finished");
    expect(known(0) !== known(1)).toBe(true);
  });
});

describe("rerank", () => {
  it("keeps what comes next first, moves what serves the person up, drops dislikes", () => {
    const teaching = COLLECTIONS.find((c) => c.id === "teaching")!;
    const greeks = COLLECTIONS.find((c) => c.id === "greeks")!;
    const next = [greeks.items[1]!, greeks.items[2]!, teaching.items[0]!, greeks.items[3]!];
    const out = rerank(next, { ...none, aims: ["Teacher"], disliked: new Set([itemKey(greeks.items[3]!)]) });
    expect(out.map((o) => o.item.title)).toEqual([greeks.items[1]!.title, teaching.items[0]!.title, greeks.items[2]!.title]);
    expect(out[1]!.reason).toBe("For your aim: Teacher");
  });
});
