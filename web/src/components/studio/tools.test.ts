import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FUNCTIONS, VENTURES } from "./data";
import { realBusiness } from "./business-data";
import { functionNav, integrationsNav, ventureNav } from "./nav";
import { TOOLS, functionGroups, levelOf, shown, statusOf, teamOf, universalTools } from "./tools";
import { teamNav } from "./nav";

// Every link the console's sidebars draw must open a page: a route file under src/app, matching [param] folders.
const APP = join(__dirname, "../../app");
function routes(dir: string): boolean {
  return existsSync(join(dir, "page.tsx"));
}
function resolves(href: string): boolean {
  const parts = href.split("/").filter(Boolean);
  const walk = (dir: string, i: number): boolean => {
    const kids = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
    if (i === parts.length) return routes(dir) || kids.filter((k) => /^\(.*\)$/.test(k)).some((k) => routes(join(dir, k)));
    if (kids.includes(parts[i]!) && walk(join(dir, parts[i]!), i + 1)) return true;
    if (kids.filter((k) => /^\(.*\)$/.test(k)).some((k) => walk(join(dir, k), i))) return true;
    return kids.filter((k) => /^\[[^.]+\]$/.test(k)).some((k) => walk(join(dir, k), i + 1));
  };
  return walk(APP, 0);
}

describe("the console's tools, from Naive's catalog", () => {
  it("covers all 13 functions and keeps the universal tools", () => {
    for (const f of FUNCTIONS) expect(functionGroups(f.id).length, f.id).toBeGreaterThan(0);
    expect(universalTools().map((t) => t.id)).toContain("home");
  });

  it("hides proposed tools, whose records Naive does not have yet", () => {
    const proposed = TOOLS.filter((t) => statusOf(t) === "proposed");
    expect(proposed.length).toBeGreaterThan(0);
    for (const f of FUNCTIONS) for (const g of functionGroups(f.id)) for (const t of g.tools) expect(shown(t)).toBe(true);
  });

  it("reads the sidebar's level from the path, with the team in it", () => {
    expect(levelOf("/studio")).toEqual({ kind: "studio", team: null });
    expect(levelOf("/studio/acme")).toEqual({ kind: "studio", team: "acme" });
    expect(levelOf("/studio/acme/library/b2b-saas")).toEqual({ kind: "studio", team: "acme" });
    expect(levelOf("/studio/acme/settings")).toEqual({ kind: "studio", team: "acme" });
    expect(levelOf("/studio/acme/haptic-plays/decisions")).toEqual({ kind: "business", team: "acme", slug: "haptic-plays" });
    expect(levelOf("/studio/acme/haptic-plays/functions/finance/books")).toEqual({ kind: "function", team: "acme", slug: "haptic-plays", fn: "finance", tool: "books" });
    expect(levelOf("/studio/acme/haptic-plays/functions/finance")).toEqual({ kind: "function", team: "acme", slug: "haptic-plays", fn: "finance", tool: null });
    expect(levelOf("/studio/acme/haptic-plays/integrations")).toEqual({ kind: "integrations", team: "acme", slug: "haptic-plays" });
    expect(levelOf("/studio/acme/haptic-plays/integrations/category/payments?x=1")).toEqual({ kind: "integrations", team: "acme", slug: "haptic-plays" });
  });

  it("never reads an old address or a team page as a team or a business", () => {
    for (const old of ["/studio/v/haptic-plays", "/studio/r/x", "/studio/new", "/studio/library/b2b-saas", "/studio/settings"]) expect(teamOf(old), old).toBeNull();
    expect(teamOf("/studio/acme/new")).toBe("acme");
  });

  it("opens a page from every row of every sidebar", () => {
    const hrefs = [
      ...teamNav("acme"),
      ...VENTURES.flatMap((v) => ventureNav("acme", v.slug)),
      ...FUNCTIONS.flatMap((f) => functionNav("acme", "haptic-plays", f.id)),
      ...VENTURES.flatMap((v) => integrationsNav("acme", v.slug)),
    ].flatMap((g) => [...g.items.map((i) => i.href), ...(g.back ? [g.back.href] : [])]);
    for (const h of new Set(hrefs)) expect(resolves(h), h).toBe(true);
  });

  it("starts each function's sidebar with a back row to the business", () => {
    const [first] = functionNav("acme", "haptic-plays", "marketing-and-sales");
    expect(first?.back).toEqual({ href: "/studio/acme/haptic-plays", label: "Marketing and sales" });
  });

  it("marks each function row in a business's sidebar as one that replaces the sidebar", () => {
    const fns = ventureNav("acme", "haptic-plays").find((g) => g.label === "Functions")!;
    expect(fns.items.filter((i) => i.drills).length).toBeGreaterThan(0);
    expect(fns.items.at(-1)?.label).toBe("Add a function");
  });

  it("gives a real business only pages that read it, and the functions its venture.json turns on", () => {
    const biz = realBusiness({ id: "corner-bakery", name: "Corner Bakery", departments: ["finance", "marketing-and-sales", "astrology"] });
    expect(biz.functions).toEqual(["finance", "marketing-and-sales"]);
    const groups = ventureNav("acme", "corner-bakery", biz);
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href.replace("/studio/acme/corner-bakery", "")));
    for (const h of hrefs) expect(["", "/decisions", "/files", "/integrations"].includes(h) || /^\/(tools|functions)\//.test(h), h).toBe(true);
    expect(hrefs).toContain("/functions/finance");
    expect(hrefs.some((h) => h === "/functions")).toBe(false);
    for (const g of groups) for (const i of g.items) expect(resolves(i.href), i.href).toBe(true);
    const fns = integrationsNav("acme", "corner-bakery", biz).find((g) => g.label === "Functions")!;
    expect(fns.items.map((i) => i.href)).toEqual(["/studio/acme/corner-bakery/integrations/function/finance", "/studio/acme/corner-bakery/integrations/function/marketing-and-sales"]);
  });

  it("opens Integrations as a level of its own, with a back row and categories with counts", () => {
    const row = ventureNav("acme", "haptic-plays").flatMap((g) => g.items).find((i) => i.label === "Integrations")!;
    expect(row).toMatchObject({ href: "/studio/acme/haptic-plays/integrations", drills: true });
    const [first, , cats] = integrationsNav("acme", "haptic-plays");
    expect(first?.back).toEqual({ href: "/studio/acme/haptic-plays", label: "Integrations" });
    expect(cats?.label).toBe("Categories");
    for (const i of cats!.items) expect(i.count).toBeGreaterThan(0);
  });
});
