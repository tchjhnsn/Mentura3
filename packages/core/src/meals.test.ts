import { describe, expect, it } from "vitest";
import { instacartBody, itemText, mealsPart, parseIngredient, parseIngredients, shoppingList, weekOf, type Meal } from "./meals";

describe("meal planning", () => {
  it("reads ingredient lines as a cookbook writes them", () => {
    expect(parseIngredient("2 cups rice")).toEqual({ qty: 2, unit: "cup", name: "rice" });
    expect(parseIngredient("1 1/2 lbs ground beef, browned")).toEqual({ qty: 1.5, unit: "pound", name: "ground beef" });
    expect(parseIngredient("½ tsp salt")).toEqual({ qty: 0.5, unit: "teaspoon", name: "salt" });
    expect(parseIngredient("3 eggs")).toEqual({ qty: 3, unit: "", name: "eggs" });
    expect(parseIngredient("- Salt and pepper")).toEqual({ qty: null, unit: "", name: "salt and pepper" });
    expect(parseIngredient("  ")).toBeNull();
    expect(itemText({ qty: 0.75, unit: "cup", name: "peas" })).toBe("¾ cup peas");
    expect(itemText({ qty: 1.5, unit: "tablespoon", name: "soy sauce" })).toBe("1½ tablespoons soy sauce");
    expect(parseIngredients("2 cups rice\n\n1 can of black beans")).toEqual([{ qty: 2, unit: "cup", name: "rice" }, { qty: 1, unit: "can", name: "black beans" }]);
  });

  const meals: Meal[] = [
    { id: "a", name: "Rice and beans", serves: 2, ingredients: parseIngredients("1 cup rice\n1 can black beans\nsalt") },
    { id: "b", name: "Fried rice", serves: 4, ingredients: parseIngredients("2 cups rice\n3 eggs") },
  ];

  it("scales each meal to the household and adds like items together", () => {
    const list = shoppingList(meals, [{ day: "2026-11-16", meal: "a" }, { day: "2026-11-18", meal: "b" }, { day: "2026-11-19", meal: "zz" }], 4);
    expect(list.map(itemText)).toEqual(["2 cans black beans", "3 eggs", "4 cups rice", "salt"]);
    expect(list.find((i) => i.name === "rice")!.meals).toEqual(["Rice and beans", "Fried rice"]);
    // For three people, eggs and cans round up to whole ones; cups to the nearest quarter.
    expect(shoppingList(meals, [{ day: "2026-11-16", meal: "a" }, { day: "2026-11-18", meal: "b" }], 3).map(itemText)).toEqual(["2 cans black beans", "3 eggs", "3 cups rice", "salt"]);
  });

  it("makes an Instacart shopping list body", () => {
    const body = instacartBody("This week", shoppingList(meals, [{ day: "2026-11-16", meal: "a" }], 2));
    expect(body.link_type).toBe("shopping_list");
    expect(body.line_items).toContainEqual({ name: "rice", line_item_measurements: [{ quantity: 1, unit: "cup" }] });
    expect(body.line_items).toContainEqual({ name: "salt" });
  });

  it("gives the week from Monday, and each part by path", () => {
    expect(weekOf("2026-11-17")).toEqual(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
    const v = { week: weekOf("2026-11-17"), meals, plan: [{ day: "2026-11-16", meal: "a" }], people: 2 };
    expect(mealsPart(v, "week")).toContainEqual({ day: "2026-11-16", meals: ["Rice and beans"] });
    expect(mealsPart(v, "list")).toContainEqual({ item: "1 cup rice", for: ["Rice and beans"] });
    expect(mealsPart(v, "meals/b")).toMatchObject({ name: "Fried rice", ingredients: ["2 cups rice", "3 eggs"] });
    expect(mealsPart(v, "meals/zz")).toBeNull();
    expect(mealsPart(v, "")).toMatchObject({ people: 2, listItems: 3 });
  });
});
