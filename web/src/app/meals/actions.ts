"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { removeLifeRecord, saveLifeRecord } from "@/server/life-store";
import { addMeal, planMeal, sendToInstacart, unplanMeal } from "@/server/meals-store";

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
