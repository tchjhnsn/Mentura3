import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FUNCTIONS, VENTURES } from "./data";
import { realBusiness } from "./business-data";
import { functionNav, ventureNav } from "./nav";
import { TOOLS, functionGroups, levelOf, shown, statusOf, universalTools } from "./tools";

// Every link the console's sidebars draw must open a page: a route file under src/app, matching [param] folders.
const APP = join(__dirname, "../../app");
function routes(dir: string): boolean {
  return existsSync(join(dir, "page.tsx"));
}
function resolves(href: string): boolean {
  const parts = href.split("/").filter(Boolean);
  const walk = (dir: string, i: number): boolean => {
    if (i === parts.length) return routes(dir);
    const kids = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
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

  it("reads the sidebar's level from the path", () => {
    expect(levelOf("/studio")).toEqual({ kind: "studio" });
    expect(levelOf("/studio/v/haptic-plays/decisions")).toEqual({ kind: "business", slug: "haptic-plays" });
    expect(levelOf("/studio/v/haptic-plays/functions/finance/books")).toEqual({ kind: "function", slug: "haptic-plays", fn: "finance", tool: "books" });
    expect(levelOf("/studio/v/haptic-plays/functions/finance")).toEqual({ kind: "function", slug: "haptic-plays", fn: "finance", tool: null });
  });

  it("opens a page from every row of every sidebar", () => {
    const hrefs = [
      ...VENTURES.flatMap((v) => ventureNav(v.slug)),
      ...FUNCTIONS.flatMap((f) => functionNav("haptic-plays", f.id)),
    ].flatMap((g) => [...g.items.map((i) => i.href), ...(g.back ? [g.back.href] : [])]);
    for (const h of new Set(hrefs)) expect(resolves(h), h).toBe(true);
  });

  it("starts each function's sidebar with a back row to the business", () => {
    const [first] = functionNav("haptic-plays", "marketing-and-sales");
    expect(first?.back).toEqual({ href: "/studio/v/haptic-plays", label: "Marketing and sales" });
  });

  it("marks each function row in a business's sidebar as one that replaces the sidebar", () => {
    const fns = ventureNav("haptic-plays").find((g) => g.label === "Functions")!;
    expect(fns.items.filter((i) => i.drills).length).toBeGreaterThan(0);
    expect(fns.items.at(-1)?.label).toBe("Add a function");
  });

  it("gives a real business only pages that read it, and the functions its venture.json turns on", () => {
    const biz = realBusiness({ id: "corner-bakery", name: "Corner Bakery", departments: ["finance", "marketing-and-sales", "astrology"] });
    expect(biz.functions).toEqual(["finance", "marketing-and-sales"]);
    const groups = ventureNav("corner-bakery", biz);
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href.replace("/studio/v/corner-bakery", "")));
    for (const h of hrefs) expect(["", "/decisions", "/files"].includes(h) || /^\/(tools|functions)\//.test(h), h).toBe(true);
    expect(hrefs).toContain("/functions/finance");
    expect(hrefs.some((h) => h === "/functions")).toBe(false);
    for (const g of groups) for (const i of g.items) expect(resolves(i.href), i.href).toBe(true);
  });
});
