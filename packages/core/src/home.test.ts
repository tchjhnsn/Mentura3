import { describe, expect, it } from "vitest";
import { homeCost, homeNeeds, housingShare, markedByReflect, waterDays } from "./home";
import type { RecordFacts } from "./life";

describe("home", () => {
  const records: RecordFacts[] = [
    { kind: "food", state: null, body: { how: "self-provided", by: "kin", pantry: true } },
    { kind: "shelter", state: null, body: { how: "supplied", by: "market", cost: 900 } },
  ];
  const needs = homeNeeds(records);

  it("states each need with its standard in place and missing", () => {
    expect(needs.map((n) => n.id)).toEqual(["food", "water", "shelter", "transport", "safety"]);
    const food = needs.find((n) => n.id === "food")!;
    expect(food).toMatchObject({ stated: true, how: "Self-provided", by: "Kin", covered: true, done: 1, of: 1, missing: [] });
    expect(needs.find((n) => n.id === "water")).toMatchObject({ stated: false, done: 0, of: 2 });
  });

  it("sums what the person pays and names what others cover", () => {
    const c = homeCost(needs);
    expect(c.pay).toBe(900);
    expect(c.covered.map((n) => n.label)).toEqual(["Food"]);
    expect(homeCost(homeNeeds([])).pay).toBeNull();
  });

  it("comes back when its check lapses", () => {
    const n = homeNeeds([{ id: "w", kind: "water", state: null, body: { cycle: "every-6-months" } }], [{ kind: "checked", record: "w", day: "2026-04-01", minutes: null, amount: null }], "2026-11-14");
    expect(n.find((x) => x.id === "water")).toMatchObject({ cycle: "Every 6 months", checked: "2026-04-01", due: "2026-09-30", lapsed: true });
  });
});


describe("figures Reflect works out for a need", () => {
  it("gives housing's share, days of water, and the standard parts it can mark", () => {
    expect(housingShare(800, 33_280)).toBe(29);
    expect(housingShare(null, 33_280)).toBeNull();
    expect(housingShare(800, 0)).toBeNull();
    expect(waterDays(10, 3)).toBe(3);
    expect(waterDays(null, 3)).toBeNull();
    expect(markedByReflect("shelter", { share: 29 })).toEqual({ thirty: true });
    expect(markedByReflect("shelter", { share: 31 })).toEqual({ thirty: false });
    expect(markedByReflect("water", { days: 5 })).toEqual({ stored: true, "two-weeks": false });
    expect(markedByReflect("transport", { ways: 2 })).toEqual({ backup: true });
    expect(markedByReflect("food", {})).toEqual({});
  });
});
