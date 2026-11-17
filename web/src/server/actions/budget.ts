// The monthly budget and the steps toward a financial future ("plan a budget and financial future together"):
// read the budget by path, set tiles' allotments, and add a step with its costs to Home's Not yet. The budget and
// the steps are hidden Home life records, which belong to one person and are read only by them, so changing them
// is the `own` tier even when the plan is for a whole household.
import { z } from "zod";
import { BUDGET_PATHS, BUDGET_TILES, MONEY_CAVEAT, budgetView, partSummaryWith, planPartWith, type BudgetView } from "@reflect/core/budget";
import { COSTS, type CostKey } from "@reflect/core/plan";
import { planOf } from "../plan";
import { addPlanStep, setAllotments } from "../budget";
import { action } from "./types";

const TILE_IDS = BUDGET_TILES.map((t) => t.id) as [string, ...string[]];
const money = z.number().min(0).max(1e7);

/** A budget part, with its sentence and the whole budget against its stage for the chat's card. */
export type BudgetRead = { summary: string | null; part: unknown; view: BudgetView | null };

export const budget = action({
  id: "budget",
  title: "Read one part of the monthly budget",
  description: `Fetch one part of the person's monthly budget: what they allot a month to each tile (every tile gets an allotment), held against what their household plan says each tile costs and against income after federal and payroll tax; totals, what is left to allot, and which tiles cost more in the plan than is allotted. Fetch the smallest part that answers. Paths: ${BUDGET_PATHS}. ${MONEY_CAVEAT}`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().max(200).default("budget").describe("Such as 'budget', 'budget/food' or 'next/budget/over'") }),
  run: async ({ userId }, { path }): Promise<BudgetRead> => {
    const { plan, budget } = await planOf(userId);
    const p = path.trim() ? path : "budget";
    const summary = partSummaryWith(plan, budget, p);
    const stageId = p.split("/")[0] === "budget" ? "already" : p.split("/")[0]!;
    const stage = stageId === "already" ? plan.already : stageId === "next" ? plan.next : plan.steps.find((s) => s.id === stageId) ?? null;
    return { summary, part: planPartWith(plan, budget, p), view: summary && stage ? budgetView(plan, budget, stage) : null };
  },
});

export const setBudget = action({
  id: "set_budget",
  title: "Set tiles' monthly allotments",
  description: `Set what the person allots a month to one or more tiles, only with amounts the person stated in this conversation; null takes a tile's allotment off. Other tiles keep theirs. Tiles: ${TILE_IDS.join(", ")}. ${MONEY_CAVEAT}`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    allotments: z.array(z.object({ tile: z.enum(TILE_IDS), amount: money.nullable().describe("Dollars a month, or null to take it off") })).min(1).max(16),
  }),
  run: async ({ userId }, { allotments }) => {
    await setAllotments(userId, allotments);
    const { plan, budget } = await planOf(userId);
    return { summary: partSummaryWith(plan, budget, "budget"), view: budgetView(plan, budget) };
  },
});

const costShape = Object.fromEntries(COSTS.map((c) => [c.key, money.optional().describe(`${c.label} a month`)])) as Record<CostKey, z.ZodOptional<typeof money>>;

export const budgetStep = action({
  id: "budget_step",
  title: "Add a step to the Not yet plan with its costs",
  description: `Add a step still to be reached to the person's Not yet plan (such as married, a first child, a move), with what it would cost a month, only from figures the person stated; a cost left out is carried from the step before, and food is estimated from the USDA food plans when no figure is given. The step is added after the last one unless an order is given. Nothing that is not yet is guaranteed. ${MONEY_CAVEAT}`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    name: z.string().min(1).max(140).describe("The step, such as 'Married'"),
    order: z.number().int().min(1).max(98).optional(),
    year: z.number().int().min(1900).max(2200).optional(),
    where: z.string().max(200).optional().describe("Where the household would live, county and state"),
    adults: z.number().int().min(1).max(20).optional(),
    children: z.number().int().min(0).max(20).optional(),
    food: z.enum(["thrifty", "low", "moderate", "liberal"]).optional().describe("The USDA food plan level"),
    costs: z.object(costShape).optional(),
  }),
  run: async ({ userId }, s) => {
    const { id, order } = await addPlanStep(userId, s);
    const { plan } = await planOf(userId);
    const stage = plan.steps.find((x) => x.id === id) ?? null;
    return { id, order, href: `/plan?step=${encodeURIComponent(id)}`, name: s.name, toEarn: stage?.toEarn ?? null, leftToEarn: stage?.leftToEarn ?? null };
  },
});
