"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { readReceipt } from "@/server/spending-store";
import { sendToInstacart } from "@/server/meals-store";
import { fromPage } from "@/server/actions/page";
import { changeRecord, removeRecord, setRecordField } from "@/server/actions/records";
import { addMealAction as addMealEntry, addToBasketAction, keepRecipeAction as keepRecipeEntry, planMealAction as planMealEntry, planWeekAction, setReceiptAction, startMealPlanAction, unplanMealAction as unplanMealEntry } from "@/server/actions/meal-plans";

// Meals (`@reflect/core/meals`): the person's own meals, put on the week's days, and the shopping list. Each change
// goes through the action registry (Ask Reflect plan, step 4), so it is in the change log and can be undone.

function fields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (!k.startsWith("$")) out[k] = String(v);
  return out;
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const week = (day: string) => (DAY.test(day) ? `/meals/week?day=${day}` : "/meals/week");
const done = (to: string) => {
  revalidatePath("/", "layout");
  redirect(to);
};

export async function addMealAction(day: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(addMealEntry, user.id, { fields: fields(form), ...(DAY.test(day) ? { day } : {}) });
  done(week(day));
}

export async function saveMealAction(id: string, form: FormData): Promise<void> {
  const user = await requireUser();
  await fromPage(changeRecord, user.id, { id, fields: fields(form), whole: true });
  done("/meals");
}

export async function removeMealAction(id: string): Promise<void> {
  const user = await requireUser();
  await fromPage(removeRecord, user.id, { id });
  done("/meals");
}

export async function planMealAction(mealId: string, day: string): Promise<void> {
  const user = await requireUser();
  if (!DAY.test(day)) throw new Error("Give the day.");
  await fromPage(planMealEntry, user.id, { meal_id: mealId, day });
  done(week(day));
}

export async function unplanMealAction(eventId: string, day: string): Promise<void> {
  const user = await requireUser();
  await fromPage(unplanMealEntry, user.id, { events: [eventId] });
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

/** Answers one of Food's first questions with a tap, then goes on to the next. */
export async function likeAction(key: string, value: string | null, next: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setRecordField, user.id, { app: "home", kind: "food-likes", key, value });
  done(inMeals(next));
}

/** Marks, or unmarks, something the person will not eat. */
export async function avoidAction(tag: string, on: boolean, to: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setRecordField, user.id, { app: "home", kind: "food-likes", key: `avoid-${tag}`, value: on });
  done(inMeals(to));
}

/** Plans the week's open days from how the person likes to eat. */
export async function planMyWeekAction(day: string): Promise<void> {
  const user = await requireUser();
  await fromPage(planWeekAction, user.id, DAY.test(day) ? { day } : {});
  done(week(day));
}

/** Puts a recipe or a whole meal in the week's basket. */
export async function basketAction(id: string, day: string, to: string): Promise<void> {
  const user = await requireUser();
  await fromPage(addToBasketAction, user.id, { id, ...(DAY.test(day) ? { day } : {}) });
  done(inMeals(to));
}

export async function takeFromBasketAction(id: string, to: string): Promise<void> {
  const user = await requireUser();
  await fromPage(removeRecord, user.id, { id });
  done(inMeals(to));
}

/** Keeps one of Reflect's recipes in Your recipes, or lets it go. */
export async function keepRecipeAction(recipe: string, keep: boolean): Promise<void> {
  const user = await requireUser();
  await fromPage(keepRecipeEntry, user.id, { recipe, keep });
  done(`/meals/r/${recipe}`);
}

/** Takes a day's whole meal off the week. */
export async function unplanDayAction(eventIds: string[], day: string): Promise<void> {
  const user = await requireUser();
  if (eventIds.length) await fromPage(unplanMealEntry, user.id, { events: eventIds });
  done(week(day));
}

/** Reads a receipt's photo, then opens what was read for the person to confirm. */
export async function readReceiptAction(form: FormData): Promise<{ error: string } | void> {
  const user = await requireUser();
  const photo = form.get("photo");
  if (!(photo instanceof Blob) || !photo.size) return { error: "Choose a photo of a receipt." };
  if (photo.size > 4_000_000) return { error: "That picture is too large." };
  let id: string;
  try {
    id = await readReceipt(user.id, new Uint8Array(await photo.arrayBuffer()), photo.type || "image/jpeg", new Date().toISOString().slice(0, 10));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not read it." };
  }
  done(`/meals/receipts/${id}`);
}

export async function receiptSpendAction(id: string, spend: "groceries" | "eating-out"): Promise<void> {
  const user = await requireUser();
  await fromPage(setReceiptAction, user.id, { id, spend });
  done(`/meals/receipts/${id}`);
}

export async function receiptDropLineAction(id: string, line: number): Promise<void> {
  const user = await requireUser();
  await fromPage(setReceiptAction, user.id, { id, drop_line: line });
  done(`/meals/receipts/${id}`);
}

/** Keeps a receipt as read, so it counts toward the month. */
export async function receiptKeepAction(id: string): Promise<void> {
  const user = await requireUser();
  await fromPage(setReceiptAction, user.id, { id, confirmed: true });
  done("/meals");
}

export async function receiptRemoveAction(id: string): Promise<void> {
  const user = await requireUser();
  await fromPage(removeRecord, user.id, { id });
  done("/meals/spending");
}

/** Sets the day of the next grocery run. */
export async function runDayAction(day: string): Promise<void> {
  const user = await requireUser();
  if (!DAY.test(day)) throw new Error("Give the day.");
  await fromPage(setRecordField, user.id, { app: "home", kind: "grocery-run", key: "day", value: day });
  done("/meals/run");
}

/** Starts a meal plan from Discover on this week's open days, then opens the week. */
export async function startPlanAction(id: string): Promise<void> {
  const user = await requireUser();
  await fromPage(startMealPlanAction, user.id, { plan: id });
  done(week(new Date().toISOString().slice(0, 10)));
}
