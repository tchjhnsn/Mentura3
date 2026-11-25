import { describe, expect, it } from "vitest";
import { MARKET } from "@reflect/core/marketplace";
import { consoleBack } from "./connect-back";
import { CATEGORIES, CLUSTERS, categoriesOf, forBusiness, forFunction, forGroup, functionsOf, search, usableBy } from "./integrations";
import { PROCESS_GROUPS, TOOLS } from "./tools";

describe("integration categories", () => {
  it("puts every catalog integration in at least one category, and names only catalog integrations", () => {
    for (const c of MARKET) expect(categoriesOf(c.id).length, c.id).toBeGreaterThan(0);
    const ids = new Set(MARKET.map((c) => c.id));
    for (const k of CATEGORIES) for (const m of k.members) expect(ids.has(m), `${k.id}: ${m}`).toBe(true);
  });

  it("ties every category to real APQC process groups and real capability clusters", () => {
    const groups = new Set(PROCESS_GROUPS.map((g) => g.id));
    const clusters = new Set(CLUSTERS.map((c) => c.id));
    for (const k of CATEGORIES) {
      expect(k.groups.length, k.id).toBeGreaterThan(0);
      for (const g of k.groups) expect(groups.has(g), `${k.id}: ${g}`).toBe(true);
      if (k.cluster) expect(clusters.has(k.cluster), `${k.id}: ${k.cluster}`).toBe(true);
    }
  });

  it("gives every cluster a tool names at least one category that fills it", () => {
    const named = new Set(TOOLS.map((t) => t.cluster).filter(Boolean));
    for (const c of named) expect(CATEGORIES.some((k) => k.cluster === c), String(c)).toBe(true);
  });

  it("names no vendor in a category", () => {
    const vendors = MARKET.map((c) => c.name.toLowerCase());
    for (const k of CATEGORIES) for (const v of vendors) expect(`${k.name} ${k.line}`.toLowerCase().includes(v), `${k.id} names ${v}`).toBe(false);
  });
});

describe("recommendations", () => {
  it("finds the categories for one process group", () => {
    expect(forGroup("9.5").map((k) => k.id)).toEqual(["payroll-hr"]);
    expect(forGroup("6.2").map((k) => k.id)).toContain("help-desk");
  });

  it("marks a category Needed when one of the function's tools names the cluster it fills", () => {
    const finance = forFunction("finance");
    expect(finance.find((r) => r.category.id === "payments")?.fit).toBe("needed");
    expect(finance.find((r) => r.category.id === "accounting")?.fit).toBe("needed");
    expect(finance.find((r) => r.category.id === "spreadsheets")?.fit).toBe("helpful");
    expect(finance[0]?.fit).toBe("needed");
    expect(finance.find((r) => r.category.id === "payments")?.why).toBe(CLUSTERS.find((c) => c.id === "money-and-books")!.why);
  });

  it("recommends only categories that serve the function's work", () => {
    for (const r of forFunction("customer-service")) expect(r.groups.every((g) => g.function === "customer-service")).toBe(true);
    expect(forFunction("customer-service").map((r) => r.category.id)).not.toContain("payroll-hr");
  });

  it("joins a business's functions, Needed first, and sends what a connection covers to the end", () => {
    const all = forBusiness(["finance", "marketing-and-sales"]);
    const payments = all.find((r) => r.category.id === "payments")!;
    expect(payments.functions).toEqual(["finance", "marketing-and-sales"]);
    expect(payments.fit).toBe("needed");
    const fits = all.map((r) => r.fit);
    expect(fits.indexOf("helpful")).toBeGreaterThan(fits.lastIndexOf("needed"));
    const covered = forBusiness(["finance"], new Set(["stripe"]));
    expect(covered.at(-1)?.category.id).toBe("payments");
    expect(covered.at(-1)?.connected).toBe(true);
  });

  it("does not let joining functions change the categories one function returns", () => {
    const before = forFunction("finance").map((r) => r.functions.length);
    forBusiness(["finance", "marketing-and-sales", "products"]);
    expect(forFunction("finance").map((r) => r.functions.length)).toEqual(before);
  });

  it("knows the functions a category serves", () => {
    expect(functionsOf(CATEGORIES.find((k) => k.id === "payroll-hr")!)).toEqual(["human-capital", "finance"]);
  });

  it("searches by name, line and category", () => {
    expect(search("stripe").map((c) => c.id)).toEqual(["stripe"]);
    expect(search("source control").map((c) => c.id)).toEqual(["github"]);
    expect(search("").length).toBe(MARKET.length);
  });
});

describe("which businesses use a connection", () => {
  it("opens a connection to every business when none are named, else only to those named", () => {
    expect(usableBy({ businesses: null }, "corner-bakery")).toBe(true);
    expect(usableBy({ businesses: ["corner-bakery"] }, "corner-bakery")).toBe(true);
    expect(usableBy({ businesses: ["corner-bakery"] }, "haptic-plays")).toBe(false);
    expect(usableBy({ businesses: [] }, "corner-bakery")).toBe(false);
  });
});

describe("returning from a sign-in", () => {
  it("keeps only a path inside the business console", () => {
    expect(consoleBack("/studio/acme/corner-bakery/integrations/stripe")).toBe("/studio/acme/corner-bakery/integrations/stripe");
    for (const bad of ["https://evil.example/studio/acme/x/integrations", "//evil.example", "/marketplace/stripe", "/studio/acme/x/integrations?next=//evil", "/studio/acme/x/integrations\\y", undefined, null, ""]) {
      expect(consoleBack(bad), String(bad)).toBeNull();
    }
  });
});
