import { appOf, CYCLE, everyDays, MET, PROVIDER, type ActFacts, type RecordFacts } from "./life";

/** Needs met by someone other than the person: what Work does not have to earn for. */
export const COVERED_BY = new Set(["kin", "polis", "gifts", "nature"]);

export type NeedView = {
  id: string;
  label: string;
  stated: boolean;
  how: string | null;
  by: string | null;
  byId: string | null;
  covered: boolean;
  cost: number | null;
  done: number;
  of: number;
  missing: string[];
  /** How often the person means to check the standard again, as they chose it. */
  cycle: string | null;
  /** The last day they checked it, from their "Checked the standard" acts. */
  checked: string | null;
  /** The day it is due again, and whether that day has passed (it comes back when it lapses). */
  due: string | null;
  lapsed: boolean;
};

const labelOf = (l: readonly { id: string; label: string }[], v: unknown) => l.find((o) => o.id === v)?.label ?? null;

/**
 * Each of Home's needs as the person stated it: how it is met and by whom, what it costs a month, and which parts
 * of its standard are in place and which are not. A need never stated has every part missing.
 */
export function homeNeeds(records: readonly (RecordFacts & { id?: string })[], acts: readonly ActFacts[] = [], today?: string): NeedView[] {
  return appOf("home").kinds.filter((k) => k.one && !k.hidden).map((k) => {
    const r = records.find((x) => x.kind === k.id);
    const b = r?.body ?? {};
    const checks = k.fields.filter((f) => f.kind === "check");
    const byId = typeof b.by === "string" ? b.by : null;
    const cycle = typeof b.cycle === "string" ? b.cycle : null;
    const checked = r?.id ? acts.filter((a) => a.record === r.id && a.kind === "checked").map((a) => a.day).sort().at(-1) ?? null : null;
    const days = everyDays(cycle);
    const due = checked && days ? new Date(Date.parse(`${checked}T00:00:00Z`) + days * 86400_000).toISOString().slice(0, 10) : null;
    return {
      id: k.id, label: k.label, stated: Boolean(r),
      how: labelOf(MET, b.how), by: labelOf(PROVIDER, b.by), byId,
      covered: byId !== null && COVERED_BY.has(byId),
      cost: typeof b.cost === "number" ? b.cost : null,
      done: checks.filter((f) => b[f.key] === true).length, of: checks.length,
      missing: checks.filter((f) => b[f.key] !== true).map((f) => f.label),
      cycle: labelOf(CYCLE, cycle), checked, due, lapsed: Boolean(today && due && due <= today),
    };
  });
}

/** What the person pays for Home a month, and what others cover; null when no cost is given at all. */
export function homeCost(needs: readonly NeedView[]): { pay: number | null; covered: NeedView[] } {
  const paid = needs.filter((n) => !n.covered && n.cost !== null);
  return { pay: paid.length ? paid.reduce((s, n) => s + n.cost!, 0) : null, covered: needs.filter((n) => n.covered) };
}

/** Housing's share of income, as a whole percent, from what it costs a month and income a year; null without both. */
export function housingShare(costMonth: number | null, incomeYear: number): number | null {
  return costMonth !== null && incomeYear > 0 ? Math.round((costMonth * 12 / incomeYear) * 100) : null;
}

/** Whole days of water stored for the household, at a gallon a person a day (Ready.gov); null when not stated. */
export function waterDays(gallons: number | null, people: number): number | null {
  return gallons !== null && people > 0 ? Math.floor(gallons / people) : null;
}

/**
 * The parts of a need's standard Reflect can mark from the person's own figures (doc "Household tiles design guide"):
 * housing under 30% of income, water stored for three days and for two weeks, and a second way of getting around.
 * A part it cannot know is left out, to be marked by hand.
 */
export function markedByReflect(need: string, f: { share?: number | null; days?: number | null; ways?: number }): Record<string, boolean> {
  if (need === "shelter") return f.share === null || f.share === undefined ? {} : { thirty: f.share < 30 };
  if (need === "water") return f.days === null || f.days === undefined ? {} : { stored: f.days >= 3, "two-weeks": f.days >= 14 };
  if (need === "transport") return f.ways === undefined ? {} : { backup: f.ways >= 2 };
  return {};
}
