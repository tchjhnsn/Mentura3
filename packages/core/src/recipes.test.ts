import { describe, expect, it } from "vitest";
import { aisleOf, fitMeal, fits, ingredientsOf, planWeek, recipeOf, RECIPES, shelves, WHOLE_MEALS } from "./recipes";

const week = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];

describe("recipes", () => {
  it("every whole meal names recipes that exist, with a main first", () => {
    for (const m of WHOLE_MEALS) {
      expect(recipeOf(m.main)?.course, m.id).toBe("main");
      for (const s of m.sides) expect(recipeOf(s), `${m.id}/${s}`).toBeTruthy();
    }
    for (const r of RECIPES) for (const g of r.goesWith ?? []) expect(recipeOf(g), `${r.id}/${g}`).toBeTruthy();
  });

  it("every ingredient parses with an amount", () => {
    for (const r of RECIPES) for (const i of ingredientsOf(r)) expect(i.qty, `${r.id}: ${i.name}`).not.toBeNull();
  });

  it("leaves out what a person will not eat", () => {
    const veg = { eat: "vegetarian" as const };
    expect(fits(recipeOf("fried-chicken")!, veg)).toBe(false);
    expect(fits(recipeOf("veg-chili")!, veg)).toBe(true);
    expect(fits(recipeOf("collard-greens")!, { eat: "no-pork" })).toBe(false);
    expect(fits(recipeOf("shrimp-gumbo")!, { avoid: ["shellfish"] })).toBe(false);
    expect(fitMeal(WHOLE_MEALS.find((m) => m.id === "sunday-chicken")!, { avoid: ["pork"] })?.sides).toEqual(["candied-yams", "cornbread"]);
  });

  it("plans the nights a person cooks, from the food they grew up on, the same way twice", () => {
    const p = planWeek({ region: "creole", nights: 4 }, week);
    expect(p).toHaveLength(4);
    expect(p.map((x) => x.day)).toEqual(week.slice(0, 4));
    expect(p.some((x) => recipeOf(x.meal.main)?.region === "creole")).toBe(true);
    expect(planWeek({ region: "creole", nights: 4 }, week)).toEqual(p);
    expect(new Set(p.map((x) => x.meal.id)).size).toBe(4);
    expect(planWeek({ eat: "vegetarian", nights: 5 }, week).every((x) => fits(recipeOf(x.meal.main)!, { eat: "vegetarian" }))).toBe(true);
  });

  it("puts where a person is from first on Discover", () => {
    expect(shelves({ region: "south" })[0]?.region).toBe("south");
    expect(shelves({ region: "tex-mex" })[0]?.region).toBe("tex-mex");
    expect(shelves({ eat: "vegetarian" }).flatMap((s) => s.meals).every((m) => fits(recipeOf(m.main)!, { eat: "vegetarian" }))).toBe(true);
  });

  it("finds the aisle of each item", () => {
    expect(aisleOf("collard greens")).toBe("Produce");
    expect(aisleOf("green bell pepper")).toBe("Produce");
    expect(aisleOf("sweet potatoes")).toBe("Produce");
    expect(aisleOf("chicken broth")).toBe("Pantry");
    expect(aisleOf("black pepper")).toBe("Pantry");
    expect(aisleOf("chicken pieces")).toBe("Meat and seafood");
    expect(aisleOf("buttermilk")).toBe("Dairy and eggs");
    expect(aisleOf("eggs")).toBe("Dairy and eggs");
    expect(aisleOf("corn tortillas")).toBe("Breads");
    expect(aisleOf("diced tomatoes")).toBe("Pantry");
    expect(aisleOf("dried red beans")).toBe("Pantry");
    expect(aisleOf("green beans")).toBe("Produce");
  });
});
