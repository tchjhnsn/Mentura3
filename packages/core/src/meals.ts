// Meal planning (doc "Tiles and their connections", Food: built ourselves). A meal is the person's own recipe: what it
// is, how many it serves, and its ingredients, one per line as a cookbook writes them ("2 cups rice"). A week's plan
// puts meals on days (calendar events on the Home tile pointing at the meal). The shopping list is the week's
// ingredients, scaled from what each meal serves to the people in the household, with like items added together, and
// can be sent to Instacart as a shopping list page (Instacart Developer Platform). Every part is fetchable by path.

export type Ingredient = { qty: number | null; unit: string; name: string };
export type Meal = { id: string; name: string; serves: number | null; ingredients: Ingredient[] };
export type Planned = { day: string; meal: string };
export type ListItem = { name: string; qty: number | null; unit: string; meals: string[] };

const UNITS: Record<string, string> = {
  cup: "cup", cups: "cup", c: "cup",
  tbsp: "tablespoon", tablespoon: "tablespoon", tablespoons: "tablespoon", tbs: "tablespoon",
  tsp: "teaspoon", teaspoon: "teaspoon", teaspoons: "teaspoon",
  lb: "pound", lbs: "pound", pound: "pound", pounds: "pound",
  oz: "ounce", ounce: "ounce", ounces: "ounce",
  g: "gram", gram: "gram", grams: "gram", kg: "kilogram", kilogram: "kilogram", kilograms: "kilogram",
  ml: "milliliter", milliliter: "milliliter", milliliters: "milliliter", l: "liter", liter: "liter", liters: "liter",
  qt: "quart", quart: "quart", quarts: "quart", pt: "pint", pint: "pint", pints: "pint", gal: "gallon", gallon: "gallon", gallons: "gallon",
  can: "can", cans: "can", clove: "clove", cloves: "clove", slice: "slice", slices: "slice", bunch: "bunch", bunches: "bunch",
  package: "package", packages: "package", pkg: "package", jar: "jar", jars: "jar", head: "head", heads: "head", pinch: "pinch", dozen: "dozen",
};
const FRACTIONS: Record<string, number> = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅛": 0.125 };

function amount(s: string): number | null {
  const t = s.replace(/[½⅓⅔¼¾⅛]/g, (c) => ` ${FRACTIONS[c]}`).trim();
  let total = 0;
  for (const part of t.split(/\s+/)) {
    const frac = /^(\d+)\/(\d+)$/.exec(part);
    const n = frac ? Number(frac[1]) / Number(frac[2]) : Number(part);
    if (!Number.isFinite(n)) return null;
    total += n;
  }
  return total > 0 ? total : null;
}

/** One ingredient line ("1 1/2 cups rice, rinsed") as an amount, a unit and a name; a line with no amount is kept as a name. */
export function parseIngredient(line: string): Ingredient | null {
  const s = line.replace(/^[-*•\s]+/, "").replace(/\s+/g, " ").trim();
  if (!s) return null;
  const m = /^((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?(?:\s*[½⅓⅔¼¾⅛])?|[½⅓⅔¼¾⅛])\s*(.*)$/.exec(s);
  if (!m) return { qty: null, unit: "", name: s.toLowerCase().slice(0, 80) };
  const qty = amount(m[1]!);
  const rest = m[2]!.trim();
  const [first = "", ...more] = rest.split(" ");
  const unit = UNITS[first.toLowerCase().replace(/\.$/, "")];
  const name = (unit ? more.join(" ") : rest).replace(/^of\s+/i, "").split(",")[0]!.trim().toLowerCase().slice(0, 80);
  return name ? { qty, unit: unit ?? "", name } : null;
}

export const parseIngredients = (text: string): Ingredient[] => text.split(/\r?\n/).map(parseIngredient).filter((x): x is Ingredient => x !== null);

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The shopping list for meals planned: each meal's ingredients scaled from what it serves to the people eating, and
 * the same ingredient in the same unit added together. A meal that does not say what it serves is taken as is.
 */
export function shoppingList(meals: readonly Meal[], plan: readonly Planned[], people: number): ListItem[] {
  const byId = new Map(meals.map((m) => [m.id, m]));
  const out = new Map<string, ListItem>();
  for (const p of plan) {
    const meal = byId.get(p.meal);
    if (!meal) continue;
    const factor = meal.serves && people > 0 ? people / meal.serves : 1;
    for (const i of meal.ingredients) {
      const key = `${i.name}|${i.unit}`;
      const had = out.get(key) ?? { name: i.name, qty: null, unit: i.unit, meals: [] };
      if (i.qty !== null) had.qty = round((had.qty ?? 0) + i.qty * factor);
      if (!had.meals.includes(meal.name)) had.meals.push(meal.name);
      out.set(key, had);
    }
  }
  // What is bought whole (eggs, cans, onions) is rounded up to whole ones; measures to the nearest quarter.
  for (const i of out.values()) if (i.qty !== null) i.qty = WHOLE.has(i.unit) ? Math.ceil(i.qty - 1e-9) : Math.max(0.25, Math.round(i.qty * 4) / 4);
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const WHOLE = new Set(["", "can", "clove", "slice", "bunch", "package", "jar", "head", "dozen"]);

/** "2 cups rice", "rice" when no amount was given. */
export function itemText(i: Pick<ListItem, "qty" | "unit" | "name">): string {
  if (i.qty === null) return i.name;
  const unit = i.unit ? ` ${i.unit}${i.qty > 1 && !["pinch"].includes(i.unit) ? (i.unit.endsWith("ch") ? "es" : "s") : ""}` : "";
  const whole = Math.floor(i.qty), part = { 0.25: "¼", 0.5: "½", 0.75: "¾" }[Math.round((i.qty - whole) * 100) / 100];
  const n = part ? `${whole || ""}${part}` : `${i.qty}`;
  return `${n}${unit} ${i.name}`;
}

/** The request body for an Instacart shopping list page (`POST /idp/v1/products/products_link`). */
export function instacartBody(title: string, list: readonly ListItem[]) {
  return {
    title: title.slice(0, 120),
    link_type: "shopping_list",
    line_items: list.map((i) => ({ name: i.name, ...(i.qty !== null ? { line_item_measurements: [{ quantity: i.qty, unit: i.unit || "each" }] } : {}) })),
  };
}

/** Monday to Sunday of the week that holds the day. */
export function weekOf(day: string): string[] {
  const d = new Date(`${day}T12:00:00Z`);
  const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000);
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86_400_000).toISOString().slice(0, 10));
}

export type MealsView = { week: string[]; meals: Meal[]; plan: Planned[]; people: number };
export const MEALS_PATHS = "'' (the week in brief), 'meals', 'meals/<meal id>', 'week' (each day's meals), 'list' (the shopping list, scaled to the household)";

/** One part of the person's meal planning by path, or null. */
export function mealsPart(v: MealsView, path: string): unknown {
  const [head, key, ...rest] = path.split("/").filter(Boolean);
  if (rest.length) return null;
  const names = new Map(v.meals.map((m) => [m.id, m.name]));
  const week = v.week.map((day) => ({ day, meals: v.plan.filter((p) => p.day === day).map((p) => names.get(p.meal) ?? "A meal no longer kept") }));
  const list = () => shoppingList(v.meals, v.plan, v.people).map((i) => ({ item: itemText(i), for: i.meals }));
  if (!head) return { people: v.people, week, meals: v.meals.map((m) => m.name), listItems: shoppingList(v.meals, v.plan, v.people).length };
  if (head === "meals") {
    if (!key) return v.meals.map((m) => ({ id: m.id, name: m.name, serves: m.serves, ingredients: m.ingredients.map(itemText) }));
    const m = v.meals.find((x) => x.id === key);
    return m ? { id: m.id, name: m.name, serves: m.serves, ingredients: m.ingredients.map(itemText) } : null;
  }
  if (key) return null;
  if (head === "week") return week;
  if (head === "list") return list();
  return null;
}
