// Meal planning on the server (`@reflect/core/meals`): meals are Home records of kind "meal"; a meal on a day is a
// calendar event on the Home tile pointing at the meal; the shopping list is scaled to the people in the household.
// Sending the list to Instacart needs INSTACART_API_KEY (Instacart Developer Platform), read by name only.
import { instacartBody, mealsPart, parseIngredients, shoppingList, weekOf, type Meal, type MealsView, type Planned } from "@reflect/core/meals";
import { addEvent, events, removeEvent } from "./calendar-store";
import { householdOf } from "./household-store";
import { addLifeRecord, lifeRecord, lifeRecords } from "./life-store";

export async function meals(userId: string): Promise<Meal[]> {
  return (await lifeRecords(userId, "home")).filter((r) => r.kind === "meal").map((r) => ({
    id: r.id,
    name: String(r.body.name ?? "A meal"),
    serves: typeof r.body.serves === "number" ? r.body.serves : null,
    ingredients: parseIngredients(String(r.body.ingredients ?? "")),
  }));
}

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

export async function mealsView(userId: string, day = new Date().toISOString().slice(0, 10)): Promise<Omit<MealsView, "plan"> & { plan: (Planned & { event: string })[] }> {
  const [m, w, n] = await Promise.all([meals(userId), plannedWeek(userId, day), people(userId)]);
  const ids = new Set(m.map((x) => x.id));
  return { meals: m, week: w.week, plan: w.plan.filter((p) => ids.has(p.meal)), people: n };
}

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
  const list = shoppingList(v.meals, v.plan, v.people);
  if (!list.length) throw new Error("Plan a meal first.");
  const base = process.env.INSTACART_API_BASE || "https://connect.instacart.com";
  const r = await fetch(`${base}/idp/v1/products/products_link`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(instacartBody(`Meals for the week of ${v.week[0]}`, list)),
    signal: AbortSignal.timeout(20_000),
  });
  const j = (await r.json().catch(() => null)) as { products_link_url?: string } | null;
  if (!r.ok || !j?.products_link_url) throw new Error("Instacart did not make the list.");
  return j.products_link_url;
}
