import { incomeSummary, type RecordFacts } from "@reflect/core/life";
import { buildPlan, COST_KEYS, planPart, type CostKey, type Plan, type StepFacts } from "@reflect/core/plan";
import { FOOD_LEVELS, type FoodLevel } from "@reflect/core/plan-data";
import { lifeRecords, type LifeRecord } from "./life-store";

// The person's household plan (doc "Already and Not yet design guide"), built from their own records: Home's needs
// for what life costs now, Work's income, the intended household's livable wage, and the hidden `step` records.

const NEED_KEYS: readonly CostKey[] = ["shelter", "food", "water", "transport", "safety"];
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
/** The step record's field that holds each cost (two are renamed: `children` and `food` there name the household and the plan level). */
const STEP_FIELD: Record<CostKey, string> = { shelter: "shelter", food: "food-cost", water: "water", transport: "transport", safety: "safety", children: "children-cost", health: "health", learning: "learning", giving: "giving", other: "other" };

export function stepFacts(r: LifeRecord): StepFacts {
  const b = r.body;
  const costs: Partial<Record<CostKey, number>> = {};
  for (const k of COST_KEYS) {
    const v = num(b[STEP_FIELD[k]]);
    if (v !== null) costs[k] = v;
  }
  return {
    id: r.id,
    name: typeof b.name === "string" && b.name ? b.name : "A step",
    order: num(b.order) ?? 99,
    year: num(b.year),
    where: typeof b.where === "string" ? b.where : null,
    adults: num(b.adults),
    children: num(b.children),
    food: typeof b.food === "string" && (FOOD_LEVELS as string[]).includes(b.food) ? (b.food as FoodLevel) : null,
    costs,
    happened: r.state === "happened",
  };
}

/** The plan, with the step records it was built from. */
export async function planOf(userId: string): Promise<{ plan: Plan; steps: LifeRecord[] }> {
  const [home, work] = await Promise.all([lifeRecords(userId, "home").catch(() => []), lifeRecords(userId, "work").catch(() => [])]);
  const needs = NEED_KEYS.map((key) => {
    const r = home.find((x) => x.kind === key);
    return { key, cost: num(r?.body.cost), by: typeof r?.body.by === "string" ? r.body.by : null };
  });
  const facts: RecordFacts[] = work.map((r) => ({ kind: r.kind, state: r.state, body: r.body }));
  const income = incomeSummary(facts);
  const steps = home.filter((r) => r.kind === "step");
  const plan = buildPlan({ needs, income: income.year, floor: income.need }, steps.map(stepFacts));
  return { plan, steps };
}

/** One part of the person's plan by its path (`PLAN_PATHS`), or null. */
export async function planPartOf(userId: string, path: string): Promise<unknown> {
  return planPart((await planOf(userId)).plan, path);
}
