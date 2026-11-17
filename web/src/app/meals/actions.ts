"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { weekOf } from "@reflect/core/meals";
import { recipeOf } from "@reflect/core/recipes";
import { removeLifeRecord, saveLifeRecord, setLifeField } from "@/server/life-store";
import { addMeal, addToBasket, ensureMeal, meals, planMeal, planMyWeek, sendToInstacart, takeFromBasket, unplanMeal } from "@/server/meals-store";

// Meals (`@reflect/core/meals`): the person's own meals, put on the week's days, and the shopping list.

function fields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (!k.startsWith("$")) out[k] = String(v);
  return out;
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const week = (day: string) => (DAY.test(day) ? `/meals?day=${day}` : "/meals");
const done = (to: string) => {
  revalidatePath("/", "layout");
  redirect(to);
};

export async function addMealAction(day: string, form: FormData): Promise<void> {
  const user = await requireUser();
  const id = await addMeal(user.id, fields(form));
  if (DAY.test(day)) await planMeal(user.id, id, day);
  done(week(day));
}

export async function saveMealAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await saveLifeRecord(user.id, id, fields(form));
  done("/meals");
}

export async function removeMealAction(id: string): Promise<void> {
  const user = await requireUser();
  await removeLifeRecord(user.id, id);
  done("/meals");
}

export async function planMealAction(mealId: string, day: string): Promise<void> {
  const user = await requireUser();
  if (!DAY.test(day)) throw new Error("Give the day.");
  await planMeal(user.id, mealId, day);
  done(week(day));
}

export async function unplanMealAction(eventId: string, day: string): Promise<void> {
  const user = await requireUser();
  await unplanMeal(user.id, eventId);
  done(week(day));
}

export async function instacartAction(day: string): Promise<void> {
  const user = await requireUser();
  let url: string;
  try {
    url = await sendToInstacart(user.id, DAY.test(day) ? day : undefined);
  } catch (e) {
    redirect(`/meals/list?${DAY.test(day) ? `day=${day}&` : ""}error=${encodeURIComponent(e instanceof Error ? e.message : "Could not send it.")}`);
  }
  redirect(url);
}

const inMeals = (to: string) => (/^\/meals(\/|\?|$)/.test(to) ? to : "/meals");
const weekStart = (day: string) => weekOf(DAY.test(day) ? day : new Date().toISOString().slice(0, 10))[0]!;

/** Answers one of Food's first questions with a tap, then goes on to the next. */
export async function likeAction(key: string, value: string | null, next: string): Promise<void> {
  const user = await requireUser();
  await setLifeField(user.id, "home", "food-likes", key, value);
  done(inMeals(next));
}

/** Marks, or unmarks, something the person will not eat. */
export async function avoidAction(tag: string, on: boolean, to: string): Promise<void> {
  const user = await requireUser();
  await setLifeField(user.id, "home", "food-likes", `avoid-${tag}`, on);
  done(inMeals(to));
}

/** Plans the week's open days from how the person likes to eat. */
export async function planMyWeekAction(day: string): Promise<void> {
  const user = await requireUser();
  await planMyWeek(user.id, DAY.test(day) ? day : new Date().toISOString().slice(0, 10));
  done(week(day));
}

/** Puts a recipe or a whole meal in the week's basket. */
export async function basketAction(id: string, day: string, to: string): Promise<void> {
  const user = await requireUser();
  await addToBasket(user.id, id, weekStart(day));
  done(inMeals(to));
}

export async function takeFromBasketAction(id: string, to: string): Promise<void> {
  const user = await requireUser();
  await takeFromBasket(user.id, id);
  done(inMeals(to));
}

/** Keeps one of Reflect's recipes in Your recipes, or lets it go. */
export async function keepRecipeAction(recipe: string, keep: boolean): Promise<void> {
  const user = await requireUser();
  const r = recipeOf(recipe);
  if (!r) throw new Error("No such recipe.");
  if (keep) await ensureMeal(user.id, r);
  else for (const m of (await meals(user.id)).filter((x) => x.recipe === recipe)) await removeLifeRecord(user.id, m.id);
  done(`/meals/r/${recipe}`);
}

/** Takes a day's whole meal off the week. */
export async function unplanDayAction(eventIds: string[], day: string): Promise<void> {
  const user = await requireUser();
  for (const id of eventIds) await unplanMeal(user.id, id);
  done(week(day));
}
