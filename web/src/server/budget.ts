// The monthly budget (`@reflect/core/budget`): what the person allots a month to each tile, kept as one hidden Home
// record of kind `budget` (a money field per tile id, no migration), and steps added to Home's Not yet with their
// costs. Life records belong to one person and are read only by them, so both are the person's own records.
import { withAllotments } from "@reflect/core/budget";
import { COST_KEYS, type CostKey } from "@reflect/core/plan";
import type { FoodLevel } from "@reflect/core/plan-data";
import { addLifeRecord, saveLifeRecord } from "./life-store";
import { planOf, STEP_FIELD } from "./plan";

/** Sets or takes off tiles' monthly allotments, keeping the rest; the record is kept first when there is none. */
export async function setAllotments(userId: string, changes: readonly { tile: string; amount: number | null }[]) {
  const { budget, budgetId } = await planOf(userId);
  const next = withAllotments(budget, changes);
  if (budgetId) await saveLifeRecord(userId, budgetId, next);
  else await addLifeRecord(userId, "home", "budget", next);
  return next;
}

export type NewStep = { name: string; order?: number; year?: number; where?: string; adults?: number; children?: number; food?: FoodLevel; costs?: Partial<Record<CostKey, number>> };

/** Adds a step to Home's Not yet, after the last one unless an order is given. Returns the new record's id. */
export async function addPlanStep(userId: string, s: NewStep): Promise<{ id: string; order: number }> {
  const { plan } = await planOf(userId);
  const order = s.order ?? Math.max(0, ...plan.steps.map((x) => x.order).filter((o) => o < 99)) + 1;
  const body: Record<string, unknown> = { name: s.name, order, year: s.year, where: s.where, adults: s.adults, children: s.children, food: s.food };
  for (const k of COST_KEYS) if (typeof s.costs?.[k] === "number") body[STEP_FIELD[k]] = s.costs[k];
  const id = await addLifeRecord(userId, "home", "step", body, "not-yet");
  return { id, order };
}
