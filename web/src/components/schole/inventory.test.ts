import { describe, expect, it } from "vitest";
import { COMPONENTS, INVENTORY, SCREENS, refName, screenAt } from "./inventory";

// The rules of Virtu's readInventory (design-system-theory src/inventory.ts), run on Scholē's inventory.
describe("Scholē screen inventory", () => {
  it("gives out every number once, under a declared prefix", () => {
    const ids = [...SCREENS.flatMap((s) => [s.id, ...(s.parts ?? []).map((p) => p.id)]), ...COMPONENTS.map((c) => c.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCREENS) {
      expect(Object.keys(INVENTORY.prefixes)).toContain(s.id[0]);
      for (const p of s.parts ?? []) expect(p.id.startsWith(`${s.id}.`)).toBe(true);
    }
    expect(new Set(SCREENS.map((s) => s.path)).size).toBe(SCREENS.length);
  });
  it("puts components on listed screens", () => {
    const listed = new Set(SCREENS.map((s) => s.id));
    for (const c of COMPONENTS) for (const w of c.where) expect(w === "*" || listed.has(w)).toBe(true);
  });
  it("names a Mobbin reference for every rebuilt screen", () => {
    for (const s of SCREENS.filter((x) => !["S0", "S11", "S12"].includes(x.id))) {
      expect(s.refs?.length, s.id).toBeGreaterThan(0);
      for (const r of s.refs!) expect(refName(r), r).not.toBe("Mobbin");
    }
  });
  it("finds the screen a path shows", () => {
    expect(screenAt("/schole")?.id).toBe("S1");
    expect(screenAt("/schole/c/politics")?.id).toBe("L1");
    expect(screenAt("/schole/c/politics/the-city-is-natural/check")?.id).toBe("L3");
    expect(screenAt("/schole/podcasts")).toBeNull();
  });
});
