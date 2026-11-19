// The monthly budget (Ask Reflect, "plan a budget and financial future together"; Torian's rule that every tile gets
// money and time allotments). A budget is what the person allots a month to each tile, in their own figures, held
// against what the household plan (./plan.ts) says each tile costs at a stage and against what comes in after
// federal and payroll tax. Kept as one hidden Home record of kind `budget`, a money field per tile id (no
// migration). Reflect explains trade-offs with the person's own numbers and cited public estimates; it is not a
// licensed financial advisor and gives no personalized investment advice. Pure data and arithmetic: no I/O.
import { GROUPS, PLAN_PATHS, partSummary, planPart, taxOn, type GroupId, type Plan, type Stage } from "./plan";

/** Every tile on Home, each of which gets a money allotment, with its name as Home shows it. */
const LABELS: Record<string, string> = {
  learn: "Scholē", work: "Ergon", health: "Health", fitness: "Fitness",
  income: "Income", shelter: "Shelter", food: "Food", water: "Water", transport: "Transport", safety: "Safety", mate: "Mate", kin: "Kin",
  friends: "Friends", standing: "Standing", polis: "Polis", ventures: "Ventures",
};
export const BUDGET_TILES: readonly { id: string; label: string; group: GroupId }[] = GROUPS.flatMap((g) => g.tiles.map((id) => ({ id, label: LABELS[id] ?? id, group: g.id })));
export const isBudgetTile = (t: unknown): t is string => typeof t === "string" && BUDGET_TILES.some((x) => x.id === t);

/** What the person allots a month to each tile, in dollars. A tile left out has no allotment yet. */
export type Budget = Partial<Record<string, number>>;

/** The budget from the `budget` record's fields: only tile ids with a figure of zero or more. */
export function budgetFrom(body: Record<string, unknown> | null | undefined): Budget {
  const out: Budget = {};
  for (const t of BUDGET_TILES) {
    const v = body?.[t.id];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[t.id] = v;
  }
  return out;
}

/**
 * How a tile's allotment stands against what the plan says it costs a month: `over` when the cost is over the
 * allotment, `under` when the allotment is more than the cost, `even` when they match, `no-cost` when the plan has
 * no figure for the tile, `unset` when nothing is allotted.
 */
export type TileStatus = "over" | "under" | "even" | "no-cost" | "unset";
export type TileBudget = {
  tile: string;
  label: string;
  group: GroupId;
  /** Allotted a month. */
  allot: number | null;
  /** What the plan's costs on this tile come to a month, null when it holds no figure; zero when others cover them. */
  cost: number | null;
  /** Allotment less cost; null unless both are known. */
  gap: number | null;
  status: TileStatus;
  /** Every cost on the tile is met by others (kin, the polis, gifts, nature). */
  covered: boolean;
};
export type BudgetView = {
  /** The stage the allotments are held against. */
  stage: { id: string; name: string };
  tiles: TileBudget[];
  /** Allotted a month, all tiles. */
  allotted: number;
  /** Income coming in a month before taxes: the person's income records and operating ventures' profit. */
  income: number;
  /** Federal income and payroll tax a month on that income. */
  taxes: number;
  /** What is left to allot after taxes: income less taxes. */
  takeHome: number;
  /** Take-home less what is allotted; below zero when more is allotted than comes in. */
  leftToAllot: number;
  /** The stage's costs a month (after taxes), and what it needs earned a month before taxes; null when not known. */
  costs: number | null;
  toEarn: number | null;
  /** Tile ids whose plan cost is over the allotment, and whose allotment is over the cost. */
  over: string[];
  under: string[];
  unset: string[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** A tile's cost a month at a stage: the sum of its paid lines; zero when every line is covered; null when no line has a figure. */
export function tileCost(s: Stage, tile: string): { cost: number | null; covered: boolean } {
  const lines = s.lines.filter((l) => l.tile === tile);
  const paid = lines.filter((l) => l.from !== "covered" && l.month !== null);
  if (paid.length) return { cost: round2(paid.reduce((a, l) => a + l.month!, 0)), covered: false };
  const covered = lines.length > 0 && lines.every((l) => l.from === "covered");
  return { cost: covered ? 0 : null, covered };
}

/** The budget held against one stage of the plan (Already when none is named). */
export function budgetView(plan: Plan, budget: Budget, stage: Stage = plan.already): BudgetView {
  const tiles = BUDGET_TILES.map((t): TileBudget => {
    const allot = typeof budget[t.id] === "number" ? budget[t.id]! : null;
    const { cost, covered } = tileCost(stage, t.id);
    const gap = allot !== null && cost !== null ? round2(allot - cost) : null;
    const status: TileStatus = allot === null ? "unset" : cost === null ? "no-cost" : gap! < 0 ? "over" : gap! > 0 ? "under" : "even";
    return { tile: t.id, label: t.label, group: t.group, allot, cost, gap, status, covered };
  });
  const allotted = round2(tiles.reduce((a, t) => a + (t.allot ?? 0), 0));
  const filing = (stage.married ?? stage.adults >= 2) ? "joint" : "single";
  const t = taxOn(stage.income, filing);
  const income = round2(stage.income / 12), taxes = round2((t.federal + t.payroll) / 12);
  const takeHome = round2(income - taxes);
  return {
    stage: { id: stage.id, name: stage.name },
    tiles, allotted, income, taxes, takeHome,
    leftToAllot: round2(takeHome - allotted),
    costs: stage.costs === null ? null : round2(stage.costs / 12),
    toEarn: stage.toEarn === null ? null : round2(stage.toEarn / 12),
    over: tiles.filter((x) => x.status === "over").map((x) => x.tile),
    under: tiles.filter((x) => x.status === "under").map((x) => x.tile),
    unset: tiles.filter((x) => x.status === "unset").map((x) => x.tile),
  };
}

/** A budget with some tiles changed: a figure sets a tile, null takes its allotment off. Unknown tiles are refused. */
export function withAllotments(budget: Budget, changes: readonly { tile: string; amount: number | null }[]): Budget {
  const out: Budget = { ...budget };
  for (const c of changes) {
    if (!isBudgetTile(c.tile)) throw new Error(`No tile ${c.tile}.`);
    if (c.amount === null) delete out[c.tile];
    else if (Number.isFinite(c.amount) && c.amount >= 0 && c.amount < 1e9) out[c.tile] = round2(c.amount);
    else throw new Error("Give an amount of zero or more dollars a month.");
  }
  return out;
}

/** How the budget's parts are addressed, added to the plan's (`PLAN_PATHS`). */
export const BUDGET_PATHS = "'budget' (the budget in brief, against life as it is), 'budget/tiles', 'budget/over', 'budget/<tile id>', and '<stage>/budget', '<stage>/budget/tiles', '<stage>/budget/over', '<stage>/budget/<tile id>' to hold it against a step";
export const PLAN_AND_BUDGET_PATHS = `${PLAN_PATHS}, ${BUDGET_PATHS}`;

const stageOf = (plan: Plan, id: string) => (id === "already" ? plan.already : id === "next" ? plan.next : plan.steps.find((x) => x.id === id) ?? null);
const briefOf = (v: BudgetView) => ({ stage: v.stage, allotted: v.allotted, income: v.income, taxes: v.taxes, takeHome: v.takeHome, leftToAllot: v.leftToAllot, costs: v.costs, toEarn: v.toEarn, over: v.over, under: v.under, unset: v.unset });

/** Splits a path into the stage it names and what follows `budget`, or null when it is not a budget path. */
function budgetPath(path: string): { stage: string; rest: string[] } | null {
  const parts = path.split("/").map((x) => x.trim()).filter(Boolean);
  if (parts[0] === "budget") return { stage: "already", rest: parts.slice(1) };
  if (parts[1] === "budget") return { stage: parts[0]!, rest: parts.slice(2) };
  return null;
}

/**
 * One part of the plan or the budget by its path (`PLAN_AND_BUDGET_PATHS`), or null when it names nothing. Budget
 * paths answer with the budget held against the stage they name; every other path is the plan's (`planPart`).
 */
export function planPartWith(plan: Plan, budget: Budget, path: string): unknown {
  const b = budgetPath(path);
  if (!b) return planPart(plan, path);
  const s = stageOf(plan, b.stage);
  if (!s || b.rest.length > 1) return null;
  const v = budgetView(plan, budget, s);
  const [key] = b.rest;
  if (!key) return briefOf(v);
  if (key === "tiles") return v.tiles;
  if (key === "over") return v.tiles.filter((t) => t.status === "over");
  return v.tiles.find((t) => t.tile === key) ?? null;
}

const usd = (n: number | null) => (n === null ? "not known" : `$${Math.round(n).toLocaleString("en-US")}`);
/** One plain sentence for a part of the plan or the budget, for the chat's card; null when the path names nothing. */
export function partSummaryWith(plan: Plan, budget: Budget, path: string): string | null {
  const b = budgetPath(path);
  if (!b) return partSummary(plan, path);
  const part = planPartWith(plan, budget, path);
  if (part === null || part === undefined) return null;
  const v = budgetView(plan, budget, stageOf(plan, b.stage)!);
  const where = v.stage.id === "already" ? "Now" : v.stage.name;
  const [key] = b.rest;
  const labels = (ids: string[]) => ids.map((id) => BUDGET_TILES.find((t) => t.id === id)!.label).join(", ");
  if (!key || key === "tiles") {
    const left = v.leftToAllot >= 0 ? `${usd(v.leftToAllot)} left to allot` : `${usd(-v.leftToAllot)} more allotted than comes in`;
    return `${where}: ${usd(v.allotted)} allotted a month of ${usd(v.takeHome)} after taxes, ${left}.${v.over.length ? ` The plan costs more than is allotted for ${labels(v.over)}.` : ""}`;
  }
  if (key === "over") return v.over.length ? `${where}: the plan costs more than is allotted for ${labels(v.over)}.` : `${where}: no tile costs more in the plan than is allotted to it.`;
  const t = part as TileBudget;
  const cost = t.covered ? "covered by others" : t.cost === null ? "no cost in the plan" : `${usd(t.cost)} a month in the plan`;
  return `${where}, ${t.label}: ${t.allot === null ? "nothing allotted" : `${usd(t.allot)} a month allotted`}; ${cost}${t.status === "over" ? `, ${usd(-t.gap!)} over` : t.status === "under" ? `, ${usd(t.gap)} to spare` : ""}.`;
}

/** What Reflect says of itself around money, for the tools' descriptions. */
export const MONEY_CAVEAT = "Reflect explains trade-offs with the person's own numbers and cited public estimates (USDA food plans, IRS brackets); it is not a licensed financial advisor and gives no personalized investment advice. Never infer a figure: use only what the person stated or the plan cites.";
