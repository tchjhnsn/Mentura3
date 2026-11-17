// The household plan (doc "Already and Not yet design guide"; Torian, 2026-11-17 02:27Z to 02:57Z). What a person
// must earn is set by the life they aim at (Politics I.8 to 10): what life costs now (Already) and what each step
// still to be reached would cost (Not yet), from the person's own figures and, where they gave none, published
// estimates (./plan-data.ts). Each step carries forward everything before it. The plan is a tree of small parts,
// each addressed by a path ("next/costs/food"), so the chat, the MCP server and the pages fetch only the part asked
// about. Pure data and arithmetic: no I/O.
import { FEDERAL_TAX, FOOD_LEVELS, FOOD_PLANS, PAYROLL, type FoodLevel, type Source } from "./plan-data";

export type GroupId = "person" | "household" | "village";
/** The tiles in three groups, after Aristotle's order of association (Politics I.2). */
export const GROUPS: readonly { id: GroupId; label: string; tiles: readonly string[] }[] = [
  { id: "person", label: "The person", tiles: ["learn", "work", "health", "fitness"] },
  { id: "household", label: "The household", tiles: ["income", "shelter", "food", "water", "transport", "safety", "mate", "kin"] },
  { id: "village", label: "The village and polis", tiles: ["friends", "standing", "polis"] },
];

export type CostKey = "shelter" | "food" | "water" | "transport" | "safety" | "children" | "health" | "learning" | "giving" | "other";
/** The costs of a life, each kept on the tile it belongs to. Monthly, as Home asks for them. */
export const COSTS: readonly { key: CostKey; label: string; tile: string; group: GroupId }[] = [
  { key: "shelter", label: "Housing", tile: "shelter", group: "household" },
  { key: "food", label: "Food", tile: "food", group: "household" },
  { key: "water", label: "Water", tile: "water", group: "household" },
  { key: "transport", label: "Transport", tile: "transport", group: "household" },
  { key: "safety", label: "Safety", tile: "safety", group: "household" },
  { key: "children", label: "Children", tile: "kin", group: "household" },
  { key: "health", label: "Health care", tile: "health", group: "person" },
  { key: "learning", label: "Learning", tile: "learn", group: "person" },
  { key: "giving", label: "Giving", tile: "polis", group: "village" },
  { key: "other", label: "Everything else", tile: "income", group: "household" },
];
export const COST_KEYS = COSTS.map((c) => c.key);
const PROVIDED = new Set(["kin", "polis", "gifts", "nature"]);

/** Where a cost's figure came from: the person's own, a published estimate, carried from the step before, or met by others. */
export type From = "yours" | "estimate" | "carried" | "covered";
export type Line = { key: CostKey; label: string; group: GroupId; tile: string; month: number | null; year: number | null; from: From | null; source?: Source; by?: string; note?: string };
export type Tax = { federal: number; payroll: number; filing: "single" | "joint"; sources: Source[] };
export type Stage = {
  id: string;
  name: string;
  /** "already" for life as it is, else the step's order from 1. */
  order: number;
  year: number | null;
  where: string | null;
  adults: number;
  children: number;
  food: FoodLevel;
  lines: Line[];
  /** What the lines cost a year, before taxes; null when no line has a figure. */
  costs: number | null;
  tax: Tax | null;
  /** What must be earned a year before taxes to meet the costs. */
  toEarn: number | null;
  income: number;
  leftToEarn: number | null;
  /** Costs with no figure yet. */
  unknown: string[];
};
export type Plan = { already: Stage; steps: Stage[]; /** The first step not yet reached, if any. */ next: Stage | null; floor: { year: number; source: string } | null };

export type NowFacts = {
  /** Home's needs: what each costs a month and who meets it. */
  needs: readonly { key: CostKey; cost: number | null; by: string | null }[];
  /** Income coming in a year. */
  income: number;
  adults?: number;
  children?: number;
  food?: FoodLevel | null;
  where?: string | null;
  /** A livable wage the person entered for their intended household, a year. */
  floor?: number | null;
};
export type StepFacts = { id: string; name: string; order: number; year: number | null; where: string | null; adults: number | null; children: number | null; food: FoodLevel | null; costs: Partial<Record<CostKey, number>>; /** It happened: its household joins Already, and Home's needs hold its costs. */ happened?: boolean };

const avg = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
/** Food at home a month for the household, from the USDA plan at that level. Adults count as the mean of a woman and a man 19 to 50; children as the mean of the child groups. */
export function foodEstimate(level: FoodLevel, adults: number, children: number): number {
  const p = FOOD_PLANS.levels[level];
  const n = adults + children;
  if (!n) return 0;
  return Math.round(((p.woman + p.man) / 2 * adults + avg(p.children) * children) * FOOD_PLANS.sizeFactor(n));
}

function bracketTax(taxable: number, brackets: readonly (readonly [number, number])[]): number {
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [lo, rate] = brackets[i]!;
    const hi = brackets[i + 1]?.[0] ?? Infinity;
    if (taxable > lo) tax += (Math.min(taxable, hi) - lo) * rate;
  }
  return tax;
}
/** Federal income tax and the employee's payroll tax on wages of `gross` a year. */
export function taxOn(gross: number, filing: "single" | "joint"): { federal: number; payroll: number } {
  const t = FEDERAL_TAX[filing];
  return { federal: Math.round(bracketTax(Math.max(0, gross - t.deduction), t.brackets)), payroll: Math.round(gross * PAYROLL.rate) };
}
/** The wages a year that leave `net` after federal and payroll tax. */
export function grossFor(net: number, filing: "single" | "joint"): number {
  if (net <= 0) return 0;
  let lo = net, hi = net * 2 + 50_000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const t = taxOn(mid, filing);
    if (mid - t.federal - t.payroll < net) lo = mid;
    else hi = mid;
  }
  return Math.round(hi);
}

const lineOf = (key: CostKey, month: number | null, from: From | null, extra: Partial<Line> = {}): Line => {
  const c = COSTS.find((x) => x.key === key)!;
  return { key, label: c.label, group: c.group, tile: c.tile, month, year: month === null ? null : Math.round(month * 12), from, ...extra };
};

function finish(s: Omit<Stage, "costs" | "tax" | "toEarn" | "leftToEarn" | "unknown">): Stage {
  const paid = s.lines.filter((l) => l.from !== "covered");
  const known = paid.filter((l) => l.year !== null);
  const costs = known.length ? known.reduce((a, l) => a + l.year!, 0) : null;
  const filing = s.adults >= 2 ? "joint" : "single";
  const toEarn = costs === null ? null : grossFor(costs, filing);
  const t = toEarn === null ? null : taxOn(toEarn, filing);
  return {
    ...s, costs, toEarn,
    tax: t ? { ...t, filing, sources: [FEDERAL_TAX.source, PAYROLL.source] } : null,
    leftToEarn: toEarn === null ? null : Math.max(0, toEarn - s.income),
    unknown: paid.filter((l) => l.year === null).map((l) => l.label),
  };
}

/** Life as it is: Home's needs as the person gave them, food estimated when they gave no figure. */
export function alreadyStage(now: NowFacts): Stage {
  const adults = Math.max(1, now.adults ?? 1), children = Math.max(0, now.children ?? 0), food = now.food ?? "moderate";
  const lines = COSTS.map((c) => {
    const n = now.needs.find((x) => x.key === c.key);
    if (n?.by && PROVIDED.has(n.by)) return lineOf(c.key, n.cost, "covered", { by: n.by });
    if (n && n.cost !== null) return lineOf(c.key, n.cost, "yours");
    if (c.key === "food") return lineOf("food", foodEstimate(food, adults, children), "estimate", { source: FOOD_PLANS.source, note: `${FOOD_PLANS.levels[food].label} plan for ${adults + children}` });
    return lineOf(c.key, null, null);
  });
  return finish({ id: "already", name: "Already", order: 0, year: null, where: now.where ?? null, adults, children, food, lines, income: Math.round(now.income) });
}

/** A step: the stage before it, changed by what the step sets. Food is estimated again when the household changes and the person gave no figure. */
export function stepStage(before: Stage, step: StepFacts): Stage {
  const adults = step.adults ?? before.adults, children = step.children ?? before.children, food = step.food ?? before.food;
  const lines = before.lines.map((b) => {
    const own = step.costs[b.key];
    if (typeof own === "number") return lineOf(b.key, own, "yours");
    if (b.key === "food" && (b.from === "estimate" || b.from === null || step.food)) return lineOf("food", foodEstimate(food, adults, children), "estimate", { source: FOOD_PLANS.source, note: `${FOOD_PLANS.levels[food].label} plan for ${adults + children}` });
    if (b.from === "covered") return { ...b };
    return lineOf(b.key, b.month, b.month === null ? null : "carried");
  });
  return finish({ id: step.id, name: step.name, order: step.order, year: step.year, where: step.where ?? before.where, adults, children, food, lines, income: before.income });
}

/** The whole plan: Already, then each step in order, each built on the one before. */
export function buildPlan(now: NowFacts, steps: readonly StepFacts[]): Plan {
  const ordered = [...steps].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  // A step that happened is life as it is now: who is in the household and where, on top of what Home says.
  const done = ordered.filter((s) => s.happened);
  const base = done.reduce<NowFacts>((n, s) => ({ ...n, adults: s.adults ?? n.adults, children: s.children ?? n.children, food: s.food ?? n.food, where: s.where ?? n.where }), now);
  const already = alreadyStage(base);
  const out: Stage[] = [];
  let prev = already;
  for (const s of ordered.filter((x) => !x.happened)) {
    prev = stepStage(prev, s);
    out.push(prev);
  }
  return { already, steps: out, next: out[0] ?? null, floor: now.floor ? { year: Math.round(now.floor), source: "MIT Living Wage Calculator, entered by you" } : null };
}

/** A tile's one fact for a stage, from the plan; null when the plan holds nothing for it. */
export function tileFact(s: Stage, tile: string): string | null {
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  if (tile === "income") return s.id === "already" ? `${money(s.income)} a year` : s.toEarn !== null ? `${money(s.toEarn)} needed` : null;
  if (tile === "kin") return s.children ? `${s.children} ${s.children === 1 ? "child" : "children"}` : null;
  if (tile === "mate") return s.adults >= 2 ? `${s.adults} adults` : null;
  const l = s.lines.find((x) => x.tile === tile && x.key !== "other");
  if (!l || l.month === null) return null;
  return l.from === "covered" ? `Covered by ${l.by}` : `${money(l.month)} a month`;
}

/** The tiles a step changes from Already: a cost, or who is in the household. */
export function changedTiles(already: Stage, s: Stage): Set<string> {
  const out = new Set<string>();
  if (s.id === "already") return out;
  for (const l of s.lines) if (l.month !== (already.lines.find((x) => x.key === l.key)?.month ?? null)) out.add(l.tile);
  if (s.children !== already.children) out.add("kin");
  if (s.adults !== already.adults) out.add("mate");
  if (s.toEarn !== already.toEarn) out.add("income");
  return out;
}

export { FOOD_LEVELS };

/** How the parts of the plan are addressed, for the chat's and the MCP server's tool descriptions. */
export const PLAN_PATHS = "'' (the plan in brief), 'already' or 'next' or a step id (one stage), '<stage>/costs', '<stage>/costs/<shelter|food|water|transport|safety|children|health|learning|giving|other>', '<stage>/tax', '<stage>/household', '<stage>/tiles', '<stage>/tiles/<tile id>'";

const brief = (s: Stage) => ({ id: s.id, name: s.name, order: s.order, year: s.year, costs: s.costs, toEarn: s.toEarn, leftToEarn: s.leftToEarn });

/**
 * One part of the plan by its path, or null when the path names nothing. The part is the smallest piece that
 * answers: a cost line, a stage's taxes, its household, a tile's fact, a stage, or the plan in brief.
 */
export function planPart(plan: Plan, path: string): unknown {
  const [stageId, part, key, ...rest] = path.split("/").map((x) => x.trim()).filter(Boolean);
  if (rest.length) return null;
  if (!stageId) return { already: brief(plan.already), steps: plan.steps.map(brief), next: plan.next?.id ?? null, floor: plan.floor };
  const s = stageId === "already" ? plan.already : stageId === "next" ? plan.next : plan.steps.find((x) => x.id === stageId) ?? null;
  if (!s) return null;
  if (!part) return s;
  if (part === "costs") return key ? s.lines.find((l) => l.key === key) ?? null : s.lines;
  if (part === "tax") return key ? null : { tax: s.tax, toEarn: s.toEarn, costs: s.costs };
  if (part === "household") return key ? null : { adults: s.adults, children: s.children, where: s.where, food: s.food };
  if (part === "tiles") {
    const changed = changedTiles(plan.already, s);
    const tiles = GROUPS.flatMap((g) => g.tiles.map((t) => ({ tile: t, group: g.id, fact: tileFact(s, t), changed: changed.has(t) })));
    return key ? tiles.find((t) => t.tile === key) ?? null : tiles;
  }
  return null;
}

const usd = (n: number | null) => (n === null ? "not known" : `$${Math.round(n).toLocaleString("en-US")}`);
/** One plain sentence for a part of the plan, for a card the chat shows beside the part it fetched; null when the path names nothing. */
export function partSummary(plan: Plan, path: string): string | null {
  const part = planPart(plan, path);
  if (part === null || part === undefined) return null;
  const [stageId, kind, key] = path.split("/").filter(Boolean);
  if (!stageId) return `Life as it is costs ${usd(plan.already.costs)} a year. ${plan.next ? `The next step, ${plan.next.name}, needs ${usd(plan.next.toEarn)} a year before taxes, ${usd(plan.next.leftToEarn)} more than comes in.` : "No steps are laid out yet."}`;
  const s = (stageId === "already" ? plan.already : stageId === "next" ? plan.next : plan.steps.find((x) => x.id === stageId))!;
  const where = s.id === "already" ? "Now" : s.name;
  if (!kind) return `${where}: costs ${usd(s.costs)} a year; to earn ${usd(s.toEarn)} before taxes; left to earn ${usd(s.leftToEarn)}.`;
  if (kind === "costs" && key) {
    const l = part as Line;
    const how = l.from === "estimate" && l.source ? `, estimated from ${l.source.name}` : l.from === "covered" ? `, covered by ${l.by}` : l.from === "carried" ? ", carried from the step before" : l.from === "yours" ? ", your figure" : "";
    return `${where}, ${l.label.toLowerCase()}: ${l.month === null ? "no figure yet" : `${usd(l.month)} a month`}${how}.`;
  }
  if (kind === "costs") return `${where}: ${s.lines.filter((l) => l.month !== null).map((l) => `${l.label} ${usd(l.month)} a month`).join("; ") || "no costs yet"}.`;
  if (kind === "tax") return s.tax ? `${where}: federal income tax ${usd(s.tax.federal)} and payroll tax ${usd(s.tax.payroll)} a year on ${usd(s.toEarn)} of wages, filing ${s.tax.filing === "joint" ? "jointly" : "single"}.` : `${where}: no costs yet, so no taxes.`;
  if (kind === "household") return `${where}: ${s.adults} ${s.adults === 1 ? "adult" : "adults"}, ${s.children} ${s.children === 1 ? "child" : "children"}${s.where ? `, in ${s.where}` : ""}.`;
  if (kind === "tiles" && key) {
    const t = part as { tile: string; fact: string | null; changed: boolean };
    return `${where}, ${t.tile}: ${t.fact ?? "nothing set"}${t.changed ? ", changed from now" : ""}.`;
  }
  return `${where}: ${(part as { tile: string; fact: string | null }[]).filter((t) => t.fact).map((t) => `${t.tile} ${t.fact}`).join("; ")}.`;
}
