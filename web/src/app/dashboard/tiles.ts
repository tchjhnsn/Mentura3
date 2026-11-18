// Pure working-out for the dashboard's tile cards (Venture, Scholē, Food, Spending, Journal, Habits): which record a
// card shows and the words or figures it puts on it. No I/O, so it is tested on its own (tiles.test.ts).
import type { TileBudget } from "@reflect/core/budget";
import type { HomeCard } from "@reflect/core/home-cards";
import { streakOf } from "@reflect/core/home-cards";
import { KINDS, type WorkKind } from "@reflect/core/works";

const RANK: Record<string, number> = { starting: 0, operating: 1, idea: 2 };

/** The venture a card shows: one starting first, then operating, then an idea, the latest changed of each; never paused or closed. */
export function ventureInProgress<T extends { kind: string; state: string | null; updatedAt: string }>(records: readonly T[]): T | null {
  const open = records.filter((r) => r.kind === "venture" && r.state !== null && r.state in RANK);
  open.sort((a, b) => RANK[a.state!]! - RANK[b.state!]! || b.updatedAt.localeCompare(a.updatedAt));
  return open[0] ?? null;
}

/**
 * The venture's next step, in one line, from what is kept: start it in Naive while it has no files; else ask someone
 * who builds when there are people not yet asked; else what an operating venture clears a month; else what it sells.
 * Nothing is invented: null when none of these is known.
 */
export function ventureNext(v: { state: string | null; body: Record<string, unknown> }, o: { files: number; notAsked: number }): string | null {
  if (!o.files) return "Next: start it in Naive to keep its files";
  if (o.notAsked) return `Next: ask ${o.notAsked === 1 ? "one person" : `${o.notAsked} people`} to build with you`;
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);
  const rev = num(v.body.revenue), cost = num(v.body.costs);
  if (v.state === "operating" && (rev !== null || cost !== null)) {
    const net = Math.round((rev ?? 0) - (cost ?? 0));
    return `${net < 0 ? "-" : ""}$${Math.abs(net).toLocaleString("en-US")} a month after costs`;
  }
  return typeof v.body.what === "string" && v.body.what.trim() ? v.body.what.trim() : null;
}

/** The media a person listens to or watches; reading and playing are left to their own pages. */
export const LISTEN_WATCH: ReadonlySet<string> = new Set(["lecture", "course", "debate", "discussion", "podcast", "film", "series", "theatre", "music"]);

/** What is under way to listen to or watch, latest touched first (by the activity times Scholē keeps, else when added). */
export function underWay<T extends { id: string; medium: string; status: string; at: string }>(items: readonly T[], recent: ReadonlyMap<string, number>): T[] {
  const when = (i: T) => recent.get(i.id) ?? (Date.parse(i.at) || 0);
  return items.filter((i) => i.status === "doing" && LISTEN_WATCH.has(i.medium)).sort((a, b) => when(b) - when(a));
}

/** How far through an item is, 0 to 1, when it has parts; null otherwise. */
export const shareOf = (i: { part: number | null; parts: number | null }) => (i.parts && i.part ? Math.min(1, i.part / i.parts) : null);

/** The food allotment held against this month's food receipts; null when the budget allots nothing to Food. */
export function foodLeft(allot: number | null | undefined, spent: number): { allot: number; spent: number; left: number; share: number } | null {
  if (typeof allot !== "number" || !Number.isFinite(allot) || allot < 0) return null;
  return { allot, spent, left: Math.round((allot - spent) * 100) / 100, share: allot > 0 ? Math.min(1, spent / allot) : spent > 0 ? 1 : 0 };
}

export type SpendRow = { tile: string; label: string; allot: number; spent: number | null; share: number; over: boolean };

/**
 * One row a tile with an allotment. `spent` is set only for tiles whose spending Reflect records (today Food, from
 * confirmed receipts); for those the bar is spent against the allotment. A tile without recorded spending has a null
 * `spent`, and its bar is its allotment against the largest allotment, so the sizes compare.
 */
export function spendRows(tiles: readonly Pick<TileBudget, "tile" | "label" | "allot">[], spent: Readonly<Record<string, number>>): SpendRow[] {
  const allotted = tiles.filter((t): t is typeof t & { allot: number } => typeof t.allot === "number" && t.allot > 0);
  const top = Math.max(1, ...allotted.map((t) => t.allot));
  return allotted.map((t) => {
    const s = t.tile in spent ? spent[t.tile]! : null;
    return { tile: t.tile, label: t.label, allot: t.allot, spent: s, share: s === null ? t.allot / top : Math.min(1, s / t.allot), over: s !== null && s > t.allot };
  });
}

/** A journal work's name for the dashboard: its own title, else "Untitled" and its kind. Never a line of its text. */
export function workName(w: { title: string; kind: WorkKind }): string {
  return w.title.trim() || `Untitled ${KINDS[w.kind].label.toLowerCase()}`;
}

export type HabitView =
  | { id: string; kind: "streak"; title: string; label: string; days: number; marked: boolean }
  | { id: string; kind: "checklist"; title: string; items: { text: string; done: boolean }[] };

/** Today's streak and checklist Home cards as the Habits card draws them; other kinds are left to their own card. */
export function habitsOf(cards: readonly HomeCard[], today: string): HabitView[] {
  return cards.flatMap((c): HabitView[] => {
    const k = c.content;
    if (k.kind === "streak") return [{ id: c.id, kind: "streak", title: c.title, label: k.label, days: streakOf(k.days, today), marked: k.days.includes(today) }];
    if (k.kind === "checklist") return [{ id: c.id, kind: "checklist", title: c.title, items: k.items }];
    return [];
  });
}

/** "5 minutes ago", "3 hours ago", "yesterday", "4 days ago", else the date. */
export function ago(iso: string, now: Date): string {
  const s = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} minutes ago`;
  if (s < 86400) { const h = Math.round(s / 3600); return `${h} ${h === 1 ? "hour" : "hours"} ago`; }
  const d = Math.floor(s / 86400);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: d > 300 ? "numeric" : undefined, timeZone: "America/Chicago" }).format(new Date(iso));
}
