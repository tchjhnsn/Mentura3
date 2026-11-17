import { describe, expect, it } from "vitest";
import { buildPlan, taxOn } from "./plan.ts";
import { BUDGET_TILES, budgetFrom, budgetView, partSummaryWith, planPartWith, tileCost, withAllotments } from "./budget.ts";

const now = { needs: [{ key: "shelter" as const, cost: 1400, by: "market" }, { key: "water" as const, cost: 40, by: "kin" }, { key: "transport" as const, cost: null, by: null }], income: 60_000 };
const step = { id: "s1", name: "Married", order: 1, year: 2027, where: null, adults: 2, children: null, food: null, costs: { shelter: 2000 } };

describe("the monthly budget", () => {
  it("gives every Home tile an allotment line", () => {
    expect(BUDGET_TILES.map((t) => t.id)).toEqual(["learn", "work", "health", "fitness", "income", "shelter", "food", "water", "transport", "safety", "mate", "kin", "friends", "standing", "polis", "ventures"]);
    expect(BUDGET_TILES.find((t) => t.id === "learn")!.label).toBe("Scholē");
  });

  it("reads only tile figures of zero or more from the record", () => {
    expect(budgetFrom({ shelter: 1400, food: 0, nope: 5, water: -1, kin: "x" })).toEqual({ shelter: 1400, food: 0 });
    expect(budgetFrom(null)).toEqual({});
  });

  it("finds a tile's cost in the plan: paid lines summed, covered as zero, none as null", () => {
    const p = buildPlan(now, []);
    expect(tileCost(p.already, "shelter")).toEqual({ cost: 1400, covered: false });
    expect(tileCost(p.already, "water")).toEqual({ cost: 0, covered: true });
    expect(tileCost(p.already, "transport").cost).toBeNull();
    expect(tileCost(p.already, "friends")).toEqual({ cost: null, covered: false });
  });

  it("totals the allotments, takes taxes from income and says what is left and which tiles are over", () => {
    const p = buildPlan(now, []);
    const food = tileCost(p.already, "food").cost!;
    const v = budgetView(p, { shelter: 1200, food: food + 100, friends: 50, water: 0 });
    const t = taxOn(60_000, "single");
    expect(v.income).toBe(5000);
    expect(v.taxes).toBeCloseTo((t.federal + t.payroll) / 12, 1);
    expect(v.takeHome).toBeCloseTo(5000 - v.taxes, 1);
    expect(v.allotted).toBe(1200 + food + 100 + 50);
    expect(v.leftToAllot).toBeCloseTo(v.takeHome - v.allotted, 1);
    expect(v.over).toEqual(["shelter"]);
    expect(v.under).toEqual(["food"]);
    const by = Object.fromEntries(v.tiles.map((x) => [x.tile, x]));
    expect(by.shelter).toMatchObject({ allot: 1200, cost: 1400, gap: -200, status: "over" });
    expect(by.friends!.status).toBe("no-cost");
    expect(by.water!.status).toBe("even");
    expect(by.learn!.status).toBe("unset");
    expect(v.unset).toContain("learn");
  });

  it("goes below zero when more is allotted than comes in", () => {
    const v = budgetView(buildPlan({ ...now, income: 12_000 }, []), { shelter: 1400 });
    expect(v.leftToAllot).toBeLessThan(0);
  });

  it("holds the budget against a step, which can make a tile over", () => {
    const p = buildPlan(now, [step]);
    expect(budgetView(p, { shelter: 1500 }).over).toEqual([]);
    const v = budgetView(p, { shelter: 1500 }, p.next!);
    expect(v.stage).toEqual({ id: "s1", name: "Married" });
    expect(v.over).toEqual(["shelter"]);
  });

  it("changes allotments, taking one off with null and refusing unknown tiles and bad amounts", () => {
    expect(withAllotments({ shelter: 1400, food: 500 }, [{ tile: "food", amount: null }, { tile: "kin", amount: 300.456 }])).toEqual({ shelter: 1400, kin: 300.46 });
    expect(() => withAllotments({}, [{ tile: "moon", amount: 1 }])).toThrow();
    expect(() => withAllotments({}, [{ tile: "food", amount: -1 }])).toThrow();
  });
});

describe("budget paths", () => {
  const p = buildPlan(now, [step]);
  const b = { shelter: 1500, friends: 50 };

  it("answers the budget's parts and leaves the plan's paths to the plan", () => {
    expect(planPartWith(p, b, "budget")).toMatchObject({ stage: { id: "already" }, allotted: 1550, over: [] });
    expect((planPartWith(p, b, "budget/tiles") as unknown[]).length).toBe(16);
    expect(planPartWith(p, b, "budget/shelter")).toMatchObject({ tile: "shelter", allot: 1500, cost: 1400, status: "under" });
    expect(planPartWith(p, b, "next/budget/over")).toEqual([expect.objectContaining({ tile: "shelter", status: "over" })]);
    expect(planPartWith(p, b, "s1/budget")).toMatchObject({ stage: { id: "s1" } });
    expect(planPartWith(p, b, "budget/moon")).toBeNull();
    expect(planPartWith(p, b, "nope/budget")).toBeNull();
    expect(planPartWith(p, b, "budget/shelter/x")).toBeNull();
    expect(planPartWith(p, b, "already/costs/shelter")).toMatchObject({ key: "shelter", month: 1400 });
  });

  it("says each part in one sentence", () => {
    expect(partSummaryWith(p, b, "budget")).toMatch(/^Now: \$1,550 allotted a month of \$[\d,]+ after taxes, \$[\d,]+ left to allot\.$/);
    expect(partSummaryWith(p, b, "next/budget")).toContain("The plan costs more than is allotted for Shelter.");
    expect(partSummaryWith(p, b, "next/budget/shelter")).toBe("Married, Shelter: $1,500 a month allotted; $2,000 a month in the plan, $500 over.");
    expect(partSummaryWith(p, b, "budget/water")).toBe("Now, Water: nothing allotted; covered by others.");
    expect(partSummaryWith(p, b, "budget/over")).toBe("Now: no tile costs more in the plan than is allotted to it.");
    expect(partSummaryWith(p, b, "budget/moon")).toBeNull();
    expect(partSummaryWith(p, b, "already/household")).toContain("1 adult");
  });
});
