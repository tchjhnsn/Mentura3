// How soon each dashboard card needs the person, as a score from 0 (nothing pressing) to 100 (now). Pure, so it is
// tested on its own (urgency.test.ts); each card's `urgency(ctx)` in cards/index.ts reads its data and calls these.
import type { CardSize, DashLayout } from "@/server/dashboard-layout";

/** Minutes from one clock time to another on the same day, both HH:MM; negative when `to` has passed. */
export function minutesBetween(from: string, to: string): number {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return m(to) - m(from);
}

/**
 * Something that starts in so many minutes: within half an hour is the most pressing, then within the hour, three
 * hours and a day. One that started under an hour ago is still on; one older, or more than a day off, scores nothing.
 */
export function soonScore(minutes: number | null): number {
  if (minutes === null || !Number.isFinite(minutes)) return 0;
  if (minutes < -60) return 0;
  if (minutes < 0) return 70;
  if (minutes <= 30) return 90;
  if (minutes <= 60) return 75;
  if (minutes <= 180) return 50;
  if (minutes <= 24 * 60) return 25;
  return 0;
}

/** People waiting on an answer (connect requests, messages): more of them, and one waiting over a day, rank higher. */
export function waitingScore(count: number, oldestHours: number): number {
  if (count <= 0) return 0;
  return Math.min(85, 60 + Math.min(15, (count - 1) * 5) + (oldestHours >= 24 ? 10 : 0));
}

/** Something past its due day: the most pressing of all, more so the later it is. */
export function overdueScore(daysLate: number): number {
  if (!(daysLate > 0)) return 0;
  return Math.min(98, 85 + Math.ceil(daysLate) * 3);
}

/** Hours from an ISO time to now; 0 when it cannot be read. */
export function hoursSince(iso: string | null | undefined, now: Date): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? Math.max(0, (now.getTime() - t) / 3_600_000) : 0;
}

export type Arranged = {
  /** The cards shown, in order: the person's own order when they set one, else by urgency. */
  order: string[];
  hidden: string[];
  /** The most urgent card when any card scores above 0; a phone shows it first whatever the order. */
  lead: string | null;
  size: Record<string, CardSize>;
  /** Whether the order is the person's own. */
  custom: boolean;
};

/**
 * Orders the cards. Without an order of the person's own, cards rank by score, ties keeping the registry's order. With
 * one, it is kept, and a card it does not name (a new card) follows in urgency order. Hidden cards are left out. A
 * card's size is the person's, else wide for a main-column card and normal for a side one.
 */
export function arrange(defs: readonly { id: string; column: "main" | "side" }[], scores: Readonly<Record<string, number>>, layout: DashLayout): Arranged {
  const known = new Set(defs.map((d) => d.id));
  const hidden = layout.hidden.filter((id) => known.has(id));
  const visible = defs.filter((d) => !hidden.includes(d.id));
  const score = (id: string) => scores[id] ?? 0;
  const ranked = visible.map((d, i) => ({ id: d.id, i })).sort((a, b) => score(b.id) - score(a.id) || a.i - b.i).map((x) => x.id);
  const own = layout.order.filter((id) => visible.some((d) => d.id === id));
  const order = own.length ? [...own, ...ranked.filter((id) => !own.includes(id))] : ranked;
  const top = ranked[0];
  const size: Record<string, CardSize> = {};
  for (const d of defs) size[d.id] = layout.size[d.id] ?? (d.column === "main" ? "wide" : "normal");
  return { order, hidden, lead: top && score(top) > 0 ? top : null, size, custom: own.length > 0 };
}

/** Moves one id to another's place in a list; the list unchanged when either is missing. */
export function moveTo(list: readonly string[], id: string, over: string): string[] {
  const from = list.indexOf(id);
  const to = list.indexOf(over);
  if (from < 0 || to < 0 || from === to) return [...list];
  const out = list.filter((x) => x !== id);
  out.splice(to, 0, id);
  return out;
}

/** Whether a Today item can be moved to another day here: the person's own one-off event, not a feed's, a connected
 * calendar's, an event they are going to or a record's day. Own events have a UUID id; the rest are prefixed. */
export function movable(e: { id: string; repeat?: string | null; from_record?: boolean }): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id) && (e.repeat ?? "none") === "none" && !e.from_record;
}

/** The day after a YYYY-MM-DD day. */
export function nextDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
