import { describe, expect, it } from "vitest";
import { buildPlan, changedTiles, foodEstimate, grossFor, partSummary, planPart, taxOn, tileFact, type StepFacts } from "./plan.ts";

const now = { needs: [{ key: "shelter" as const, cost: 1400, by: "market" }, { key: "water" as const, cost: 40, by: "kin" }, { key: "transport" as const, cost: null, by: null }], income: 38_000 };
const step = (o: Partial<StepFacts>): StepFacts => ({ id: "s1", name: "Married", order: 1, year: 2027, where: null, adults: null, children: null, food: null, costs: {}, ...o });

describe("household plan", () => {
  it("estimates food from the USDA plan with the size adjustment", () => {
    // One adult, moderate: mean of woman and man 19 to 50, plus 20 percent for a one-person household.
    expect(foodEstimate("moderate", 1, 0)).toBe(Math.round(((337.0 + 398.9) / 2) * 1.2));
    expect(foodEstimate("thrifty", 2, 2)).toBeGreaterThan(foodEstimate("thrifty", 2, 0));
  });

  it("files jointly only with a spouse when the household says who lives there", () => {
    const withParent = buildPlan({ ...now, adults: 2, children: 0, married: false }, []);
    expect(withParent.already.tax?.filing).toBe("single");
    expect(tileFact(withParent.already, "mate")).toBeNull();
    const withSpouse = buildPlan({ ...now, adults: 2, children: 0, married: true }, []);
    expect(withSpouse.already.tax?.filing).toBe("joint");
    expect(tileFact(withSpouse.already, "mate")).toBe("Married");
    expect(buildPlan({ ...now, adults: 2 }, []).already.tax?.filing).toBe("joint");
  });

  it("grosses up for federal and payroll tax", () => {
    const g = grossFor(30_000, "single");
    const t = taxOn(g, "single");
    expect(Math.abs(g - t.federal - t.payroll - 30_000)).toBeLessThan(2);
    expect(grossFor(0, "single")).toBe(0);
  });

  it("builds Already from Home's needs: yours, covered, missing, food estimated", () => {
    const p = buildPlan(now, []);
    const by = Object.fromEntries(p.already.lines.map((l) => [l.key, l]));
    expect(by.shelter!.from).toBe("yours");
    expect(by.water!.from).toBe("covered");
    expect(by.food!.from).toBe("estimate");
    expect(p.already.unknown).toContain("Transport");
    expect(p.already.costs).toBe(1400 * 12 + by.food!.year!);
    expect(p.next).toBeNull();
  });

  it("carries each step forward and estimates food again when the household grows", () => {
    const p = buildPlan(now, [step({ id: "s2", name: "Two children", order: 2, children: 2 }), step({ adults: 2, costs: { shelter: 1800 } })]);
    expect(p.steps.map((s) => s.name)).toEqual(["Married", "Two children"]);
    const [married, kids] = p.steps;
    expect(married!.lines.find((l) => l.key === "shelter")!.from).toBe("yours");
    expect(kids!.lines.find((l) => l.key === "shelter")).toMatchObject({ month: 1800, from: "carried" });
    expect(kids!.lines.find((l) => l.key === "food")!.month).toBeGreaterThan(married!.lines.find((l) => l.key === "food")!.month!);
    expect(kids!.tax!.filing).toBe("joint");
    expect(changedTiles(p.already, kids!).has("kin")).toBe(true);
    expect(tileFact(kids!, "kin")).toBe("2 children");
    expect(p.next!.id).toBe("s1");
  });

  it("moves a step that happened into Already", () => {
    const p = buildPlan(now, [step({ adults: 2, happened: true }), step({ id: "s2", name: "Two children", order: 2, children: 2 })]);
    expect(p.already.adults).toBe(2);
    expect(p.steps.map((s) => s.id)).toEqual(["s2"]);
    expect(p.next!.adults).toBe(2);
  });

  it("fetches one part by its path", () => {
    const p = buildPlan(now, [step({ adults: 2 })]);
    expect(planPart(p, "next/costs/shelter")).toMatchObject({ key: "shelter", month: 1400 });
    expect(planPart(p, "already/household")).toMatchObject({ adults: 1, children: 0 });
    expect(planPart(p, "s1/tiles/mate")).toMatchObject({ fact: "2 adults", changed: true });
    expect(planPart(p, "")).toMatchObject({ next: "s1" });
    expect(planPart(p, "nope")).toBeNull();
    expect(planPart(p, "already/costs/food/extra")).toBeNull();
  });
});

describe("plan summaries", () => {
  it("says one part in a sentence", () => {
    const p = buildPlan(now, [step({ adults: 2 })]);
    expect(partSummary(p, "next/costs/shelter")).toBe("Married, housing: $1,400 a month, carried from the step before.");
    expect(partSummary(p, "already/household")).toBe("Now: 1 adult, 0 children.");
    expect(partSummary(p, "x")).toBeNull();
  });
});
