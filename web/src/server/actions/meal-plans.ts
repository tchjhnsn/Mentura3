// Meals' page acts as actions (Ask Reflect plan, step 4): keep a meal, put meals on the week's days, the basket,
// Reflect's recipes and receipts. Reading is `meals` (./life.ts). /meals runs these same entries, so its changes are in
// the change log; a plan's Undo takes off the days and records the run added.
import { z } from "zod";
import { recipeOf } from "@reflect/core/recipes";
import { weekOf } from "@reflect/core/meals";
import { lifeRecords, removeLifeRecord, restoreLifeRecord } from "../life-store";
import { removeEvent } from "../calendar-store";
import { addMeal, addToBasket, ensureMeal, meals, planMeal, planMyWeek, plannedWeek, startMealPlan, unplanMeal } from "../meals-store";
import { setReceipt } from "../spending-store";
import { bodyBefore, fieldsSchema, putBodyBack } from "./records";
import { action, idsIn, type ActionContext, type LoggedChange } from "./types";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const todayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);

/** The meals planned in a day's week and the Home records kept, to tell what a run added. */
async function snapshot(userId: string, on: string): Promise<{ events: Set<string>; records: Set<string> }> {
  const [w, home] = await Promise.all([plannedWeek(userId, on), lifeRecords(userId, "home")]);
  return { events: new Set(w.plan.map((p) => p.event)), records: new Set(home.map((r) => r.id)) };
}
/** Runs a change and returns what it added in the day's week: planned meals (events) and records (meals, basket). */
async function adding<T>(userId: string, on: string, work: () => Promise<T>): Promise<{ result: T; events: string[]; records: string[] }> {
  const was = await snapshot(userId, on);
  const result = await work();
  const now = await snapshot(userId, on);
  return { result, events: [...now.events].filter((e) => !was.events.has(e)), records: [...now.records].filter((r) => !was.records.has(r)) };
}
/** Undo of a plan: take off the days it added and remove the records it kept. */
const takeOffAdded = async ({ userId }: ActionContext, c: LoggedChange) => {
  for (const e of idsIn(c.after, "events")) await removeEvent(userId, e, true);
  for (const r of idsIn(c.after, "records")) await removeLifeRecord(userId, r);
};

export const addMealAction = action({
  id: "add_meal",
  title: "Keep a meal",
  description: "Keep one of the person's own meals with what they said: its name, how many it serves, ingredients one per line, and how it is made. With a day, it is put on that day too. Never invent a recipe as theirs.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ fields: fieldsSchema.describe("name, serves, ingredients, method"), day: day.optional() }),
  run: async (ctx, { fields, day: on }) => {
    const r = await adding(ctx.userId, on ?? todayOf(ctx), async () => {
      const id = await addMeal(ctx.userId, fields);
      if (on) await planMeal(ctx.userId, id, on);
      return id;
    });
    return { id: r.result, events: r.events, records: r.records };
  },
  change: (r) => ({ after: r }),
  undo: takeOffAdded,
});

export const planMealAction = action({
  id: "plan_meal",
  title: "Put a meal on a day",
  description: "Put one of the person's meals (by its id from meals) on a day of the week, only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ meal_id: z.string().max(60), day }),
  run: async ({ userId }, { meal_id, day: on }) => {
    const r = await adding(userId, on, () => planMeal(userId, meal_id, on));
    return { day: on, events: r.events, records: r.records };
  },
  change: (r) => ({ after: r }),
  undo: takeOffAdded,
});

export const unplanMealAction = action({
  id: "unplan_meal",
  title: "Take meals off the week",
  description: "Take planned meals off the week by their event ids (from meals: a day's plan), such as a day's whole meal. Undo puts them back.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ events: z.array(z.string().uuid()).min(1).max(20) }),
  run: async ({ userId }, { events }) => {
    for (const e of events) await unplanMeal(userId, e);
    return { events };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const e of idsIn(c.after, "events")) await removeEvent(userId, e, false);
  },
});

export const planWeekAction = action({
  id: "plan_week",
  title: "Plan the week's meals",
  description: "Plan the open days of the week a day falls in from how the person likes to eat (their answers in meals), with Reflect's recipes. Only when they ask. Undo takes the planned days off.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ day: day.optional().describe("A day in the week, YYYY-MM-DD; today when left out") }),
  run: async (ctx, { day: on }) => {
    const d = on ?? todayOf(ctx);
    const r = await adding(ctx.userId, d, () => planMyWeek(ctx.userId, d));
    return { planned: r.result, events: r.events, records: r.records };
  },
  change: (r) => ({ after: r }),
  undo: takeOffAdded,
});

export const startMealPlanAction = action({
  id: "start_meal_plan",
  title: "Start one of Reflect's meal plans",
  description: "Put one of Reflect's meal plans (by its id, from Discover on /meals) on this week's open days from today, in order. Only when the person asks.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ plan: z.string().max(80) }),
  run: async (ctx, { plan }) => {
    const d = todayOf(ctx);
    const r = await adding(ctx.userId, d, () => startMealPlan(ctx.userId, plan, d));
    return { plan, events: r.events, records: r.records };
  },
  change: (r) => ({ after: r }),
  undo: takeOffAdded,
});

export const addToBasketAction = action({
  id: "add_to_basket",
  title: "Put a recipe in the week's basket",
  description: "Put one of Reflect's recipes or whole meals (by its id) in the week's basket, bought with the week's shopping but on no day.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(80), day: day.optional().describe("A day in the week; today when left out") }),
  run: async (ctx, { id, day: on }) => {
    const d = on ?? todayOf(ctx);
    const r = await adding(ctx.userId, d, () => addToBasket(ctx.userId, id, weekOf(d)[0]!));
    return { id, events: r.events, records: r.records };
  },
  change: (r) => ({ after: r }),
  undo: takeOffAdded,
});

export const keepRecipeAction = action({
  id: "keep_recipe",
  title: "Keep one of Reflect's recipes",
  description: "Keep one of Reflect's recipes (by its id) in the person's own recipes, or let it go (keep false).",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ recipe: z.string().max(80), keep: z.boolean().default(true) }),
  run: async (ctx, { recipe, keep }) => {
    const r = recipeOf(recipe);
    if (!r) throw new Error("No such recipe.");
    if (keep) {
      const had = new Set((await meals(ctx.userId)).map((m) => m.id));
      const id = await ensureMeal(ctx.userId, r);
      return { recipe, records: had.has(id) ? [] : [id], removed: [] as string[] };
    }
    const removed: string[] = [];
    for (const m of (await meals(ctx.userId)).filter((x) => x.recipe === recipe)) {
      await removeLifeRecord(ctx.userId, m.id);
      removed.push(m.id);
    }
    return { recipe, records: [] as string[], removed };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "records")) await removeLifeRecord(userId, id);
    for (const id of idsIn(c.after, "removed")) await restoreLifeRecord(userId, id);
  },
});

export const setReceiptAction = action({
  id: "set_receipt",
  title: "Change a receipt",
  description: "Change a receipt Reflect read (by its id): whether it was groceries or eating out, drop a line read by mistake (its number from 0), or keep it as read so it counts toward the month (confirmed). Only what the person says.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), spend: z.enum(["groceries", "eating-out"]).optional(), drop_line: z.number().int().min(0).max(500).optional(), confirmed: z.boolean().optional() }),
  run: async ({ userId }, { id, spend, drop_line, confirmed }) => {
    await setReceipt(userId, id, { ...(spend ? { spend } : {}), ...(drop_line !== undefined ? { dropLine: drop_line } : {}), ...(confirmed !== undefined ? { confirmed } : {}) });
    return { id };
  },
  before: bodyBefore,
  change: (r, _i, before) => ({ before, after: r }),
  undo: putBodyBack,
});
