import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AREAS, COMPONENTS, INVENTORY, SCREENS, refName, screenAt } from "./inventory";

const APP = fileURLToPath(new URL("../../app", import.meta.url));

/** Every route under app/schole: each folder holding a page.tsx, as the path it serves. */
function routes(dir = join(APP, "schole")): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...routes(full));
    else if (name === "page.tsx") found.push(`/${relative(APP, dir).split(sep).join("/")}`);
  }
  return found;
}
const norm = (p: string) => p.replace(/\[[^\]]+\]/g, "[]").replace(/\/$/, "");

// The rules of Virtu's readInventory (design-system-theory src/inventory.ts), run on Scholē's inventory.
describe("Scholē screen inventory", () => {
  it("gives out every number once, under a declared prefix", () => {
    const ids = [...SCREENS.flatMap((s) => [s.id, ...(s.parts ?? []).map((p) => p.id)]), ...COMPONENTS.map((c) => c.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCREENS) {
      expect(Object.keys(INVENTORY.prefixes)).toContain(s.id.charAt(0));
      for (const p of s.parts ?? []) expect(p.id.startsWith(`${s.id}.`)).toBe(true);
    }
    expect(new Set(SCREENS.map((s) => s.path)).size).toBe(SCREENS.length);
  });
  it("puts every screen in an area, and the areas in Torian's order", () => {
    expect(AREAS.map((a) => a.label)).toEqual(["Listen", "Learn", "Shelf", "Talk", "You"]);
    const areas = new Set<string>([...AREAS.map((a) => a.id), "map"]);
    for (const s of SCREENS) expect(areas.has(s.area), s.id).toBe(true);
  });
  it("names an area by its prefix", () => {
    const prefix: Record<string, string[]> = { A: ["listen"], L: ["learn"], B: ["shelf"], D: ["talk"], Y: ["you"] };
    for (const s of SCREENS) {
      const areas = prefix[s.id.charAt(0)];
      if (areas) expect(areas, s.id).toContain(s.area);
    }
  });
  it("puts components on listed screens", () => {
    const listed = new Set(SCREENS.map((s) => s.id));
    for (const c of COMPONENTS) for (const w of c.where) expect(w === "*" || listed.has(w)).toBe(true);
  });
  it("names a real Mobbin reference for each screen, or says why there is none", () => {
    for (const s of SCREENS) {
      if (!s.refs?.length) expect(s.note, `${s.id} has no refs and no note`).toBeTruthy();
      for (const r of s.refs ?? []) {
        expect(r, s.id).toMatch(/^https:\/\/mobbin\.com\/(screens|flows)\/[0-9a-f-]{36}$/);
        expect(refName(r), r).not.toBe("Mobbin");
      }
    }
  });
  it("has a screen for every page under app/schole", () => {
    const paths = new Set(SCREENS.map((s) => norm(s.path)));
    const missing = routes().filter((r) => !paths.has(norm(r)));
    expect(missing).toEqual([]);
  });
  it("has a page for every screen but the planned ones", () => {
    const pages = new Set(routes().map(norm));
    const orphans = SCREENS.filter((s) => s.status !== "planned" && !pages.has(norm(s.path))).map((s) => s.id);
    expect(orphans).toEqual([]);
  });
  it("finds the screen a path shows", () => {
    expect(screenAt("/schole")?.id).toBe("S1");
    expect(screenAt("/schole/c/politics")?.id).toBe("L1");
    expect(screenAt("/schole/c/politics/the-city-is-natural/check")?.id).toBe("L3");
    expect(screenAt("/schole/podcasts")?.area).toBe("listen");
    expect(screenAt("/schole/courses/argument")?.id).toBe("L6");
    expect(screenAt("/schole/courses/piano")?.id).toBe("L5");
    expect(screenAt("/schole/dialectic/debates/new")?.id).toBe("D3");
    expect(screenAt("/schole/dialectic/debates/42")?.id).toBe("D2");
    expect(screenAt("/studio")).toBeNull();
  });
});
