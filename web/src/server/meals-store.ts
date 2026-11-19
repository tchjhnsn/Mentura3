// Meal planning on the server (`@reflect/core/meals`): meals are Home records of kind "meal"; a meal on a day is a
// calendar event on the Home tile pointing at the meal; the shopping list is scaled to the people in the household.
// Sending the list to Instacart needs INSTACART_API_KEY (Instacart Developer Platform), read by name only.
import { instacartBody, mealsPart, parseIngredients, shoppingList, weekOf, type Meal, type MealsView, type Planned } from "@reflect/core/meals";
import { fitMeal, mealPlanOf, planWeek, recipeOf, recipesOfMeal, wholeMealOf, type Likes, type Recipe, type Region, type Tag } from "@reflect/core/recipes";
import { addEvent, events, removeEvent } from "./calendar-store";
import { householdOf } from "./household-store";
import { addLifeRecord, lifeRecord, lifeRecords, removeLifeRecord } from "./life-store";
import { outsideFetch } from "@/server/outside";

export type KeptMeal = Meal & { recipe: string | null };

export async function meals(userId: string): Promise<KeptMeal[]> {
  return (await lifeRecords(userId, "home")).filter((r) => r.kind === "meal").map((r) => ({
    id: r.id,
    name: String(r.body.name ?? "A meal"),
    serves: typeof r.body.serves === "number" ? r.body.serves : null,
    // Water is in recipes but not bought.
    ingredients: parseIngredients(String(r.body.ingredients ?? "")).filter((i) => i.name !== "water"),
    recipe: typeof r.body.recipe === "string" && recipeOf(r.body.recipe) ? r.body.recipe : null,
  }));
}

/** How the person likes to eat, from Food's first questions; nothing answered is an empty object. */
export async function likesOf(userId: string): Promise<Likes & { answered: boolean }> {
  const b = (await lifeRecords(userId, "home")).find((r) => r.kind === "food-likes")?.body ?? {};
  const avoid = Object.keys(b).filter((k) => k.startsWith("avoid-") && b[k] === true).map((k) => k.slice(6) as Tag);
  return {
    answered: Object.keys(b).length > 0,
    ...(typeof b.eat === "string" ? { eat: b.eat as Likes["eat"] } : {}),
    ...(typeof b.region === "string" ? { region: b.region as Region } : {}),
    ...(typeof b.nights === "string" ? { nights: Number(b.nights) } : {}),
    ...(typeof b.cooking === "string" ? { cooking: b.cooking as Likes["cooking"] } : {}),
    ...(avoid.length ? { avoid } : {}),
  };
}

/** The person's meal for one of Reflect's recipes, kept from the recipe the first time it is planned, kept or put in the basket. */
export async function ensureMeal(userId: string, recipe: Recipe): Promise<string> {
  const had = (await meals(userId)).find((m) => m.recipe === recipe.id);
  if (had) return had.id;
  return addLifeRecord(userId, "home", "meal", { name: recipe.name, serves: String(recipe.serves), ingredients: recipe.ingredients, method: recipe.steps.join("\n"), recipe: recipe.id });
}

/** The recipes a catalog id names: a whole meal's main and sides, or one recipe. */
export const recipesFor = (id: string): Recipe[] => { const w = wholeMealOf(id); if (w) return recipesOfMeal(w); const r = recipeOf(id); return r ? [r] : []; };

/** Plans the week's days that have nothing on them, from how the person likes to eat. */
export async function planMyWeek(userId: string, day: string): Promise<number> {
  const [likes, w] = await Promise.all([likesOf(userId), plannedWeek(userId, day)]);
  const taken = new Set(w.plan.map((p) => p.day));
  const today = new Date().toISOString().slice(0, 10);
  const open = w.week.filter((d) => !taken.has(d) && d >= today);
  const room = Math.max(0, (likes.nights ?? 5) - taken.size);
  const plan = planWeek({ ...likes, nights: Math.min(room, open.length) }, open, w.week[0]);
  for (const p of plan.slice(0, room)) for (const r of recipesOfMeal(p.meal)) await planMeal(userId, await ensureMeal(userId, r), p.day);
  return Math.min(plan.length, room);
}

/** Puts a meal plan's whole meals on this week's open days, from today, in order. */
export async function startMealPlan(userId: string, planId: string, day: string): Promise<void> {
  const p = mealPlanOf(planId);
  if (!p) throw new Error("No such meal plan.");
  const [likes, w] = await Promise.all([likesOf(userId), plannedWeek(userId, day)]);
  const taken = new Set(w.plan.map((x) => x.day));
  const open = w.week.filter((d) => !taken.has(d) && d >= day);
  const meals = p.meals.map(wholeMealOf).filter((m) => m !== undefined).map((m) => fitMeal(m, likes)).filter((m) => m !== null);
  for (const [i, m] of meals.slice(0, open.length).entries()) for (const r of recipesOfMeal(m)) await planMeal(userId, await ensureMeal(userId, r), open[i]!);
}

/** What is in the week's basket without a day: each a meal of the person's. */
export async function basketOf(userId: string, week0: string): Promise<{ id: string; meal: string }[]> {
  return (await lifeRecords(userId, "home")).filter((r) => r.kind === "basket" && r.body.week === week0 && typeof r.body.meal === "string").map((r) => ({ id: r.id, meal: String(r.body.meal) }));
}

/** Puts a recipe, or a whole meal's recipes, in the week's basket. */
export async function addToBasket(userId: string, id: string, week0: string): Promise<void> {
  const inBasket = new Set((await basketOf(userId, week0)).map((b) => b.meal));
  for (const r of recipesFor(id)) {
    const meal = await ensureMeal(userId, r);
    if (!inBasket.has(meal)) await addLifeRecord(userId, "home", "basket", { meal, week: week0 });
  }
}

export const takeFromBasket = (userId: string, id: string) => removeLifeRecord(userId, id);

/** The people eating: everyone in the household, or one when there is none. */
export async function people(userId: string): Promise<number> {
  const h = await householdOf(userId);
  return Math.max(1, h?.members.length ?? 1);
}

/** The week's planned meals, as calendar events on the Home tile that point at a meal. */
export async function plannedWeek(userId: string, day: string): Promise<{ week: string[]; plan: (Planned & { event: string })[] }> {
  const week = weekOf(day);
  const ev = await events(userId, week[0]!, week[6]!, "home");
  return { week, plan: ev.filter((e) => e.recordId && e.day >= week[0]! && e.day <= week[6]! && e.repeat === "none").map((e) => ({ day: e.day, meal: e.recordId!, event: e.id })) };
}

export async function mealsView(userId: string, day = new Date().toISOString().slice(0, 10)): Promise<Omit<MealsView, "plan" | "meals"> & { meals: KeptMeal[]; plan: (Planned & { event: string })[]; basket: { id: string; meal: string }[] }> {
  const [m, w, n] = await Promise.all([meals(userId), plannedWeek(userId, day), people(userId)]);
  const ids = new Set(m.map((x) => x.id));
  const basket = (await basketOf(userId, w.week[0]!)).filter((b) => ids.has(b.meal));
  return { meals: m, week: w.week, plan: w.plan.filter((p) => ids.has(p.meal)), people: n, basket };
}

/** Everything bought this week: the planned days and the basket. */
export const toBuy = (v: Awaited<ReturnType<typeof mealsView>>) => shoppingList(v.meals, [...v.plan, ...v.basket.map((b) => ({ day: v.week[0]!, meal: b.meal }))], v.people);

export async function mealsPartOf(userId: string, path: string): Promise<unknown> {
  return mealsPart(await mealsView(userId), path);
}

/** Puts a meal on a day. */
export async function planMeal(userId: string, mealId: string, day: string): Promise<void> {
  const r = await lifeRecord(userId, mealId);
  if (!r || r.kind !== "meal") throw new Error("No such meal.");
  await addEvent(userId, { title: String(r.body.name ?? "Meal"), tile: "home", day, recordId: mealId });
}

export const unplanMeal = (userId: string, eventId: string) => removeEvent(userId, eventId, true);

export async function addMeal(userId: string, raw: Record<string, unknown>): Promise<string> {
  return addLifeRecord(userId, "home", "meal", raw);
}

export const instacartReady = () => Boolean(process.env.INSTACART_API_KEY);

/** Sends the week's shopping list to Instacart and returns the page where the person shops it. */
export async function sendToInstacart(userId: string, day?: string): Promise<string> {
  const key = process.env.INSTACART_API_KEY;
  if (!key) throw new Error("Instacart is not connected yet.");
  const v = await mealsView(userId, day);
  const list = toBuy(v);
  if (!list.length) throw new Error("Plan a meal first.");
  const base = process.env.INSTACART_API_BASE || "https://connect.instacart.com";
  const r = await outsideFetch({ timeoutMs: 20_000 })(`${base}/idp/v1/products/products_link`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(instacartBody(`Meals for the week of ${v.week[0]}`, list)),
  });
  const j = (await r.json().catch(() => null)) as { products_link_url?: string } | null;
  if (!r.ok || !j?.products_link_url) throw new Error("Instacart did not make the list.");
  return j.products_link_url;
}
