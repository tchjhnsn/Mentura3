// The dashboard's weekly look back (Torian, 2026-11-18, dashboard item 11): what the person did in each tile over a
// week, from the acts and records they kept and their calendar, and the qualities they wrote about. Facts only; no
// model writes any of it.
import { kindOf, TILE_KIND, type LifeAppId } from "@reflect/core/life";

/** The week to look back on: on a Monday the whole week before, otherwise this week from Monday through today. */
export function weekRange(today: string): { from: string; to: string; last: boolean } {
  const d = new Date(`${today}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 is Monday
  const day = (n: number) => new Date(d.getTime() + n * 86400_000).toISOString().slice(0, 10);
  if (dow === 0) return { from: day(-7), to: day(-1), last: true };
  return { from: day(-dow), to: today, last: false };
}

/** Whether the look back opens by itself: on Sundays and Mondays. */
export const weekOpens = (today: string) => [0, 1].includes(new Date(`${today}T12:00:00Z`).getUTCDay());

export type WeekInput = {
  records: { id: string; app: LifeAppId; kind: string; body: Record<string, unknown>; createdAt: string }[];
  acts: { record: string; kind: string; day: string; minutes: number | null }[];
  calendar: { day: string; tile: string | null }[];
  readingDays: number;
  finished: { title: string }[];
  /** A quality's name by its id, for the `quality` records Work keeps. */
  traitName: (id: string) => string | undefined;
};

export type WeekTile = { tile: string; label: string; href: string; lines: string[] };
export type WeekLook = { tiles: WeekTile[]; qualities: { id: string; name: string; entries: number; href: string }[] };

const LABEL: Record<string, string> = { work: "Work", income: "Income", food: "Food", water: "Water", shelter: "Shelter", transport: "Transport", safety: "Safety", home: "Home", health: "Health", fitness: "Fitness", body: "Body", friends: "Friends", standing: "Standing", mate: "Mate", kin: "Kin", polis: "Polis", ventures: "Ventures", legacy: "Legacy" };
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
const hours = (m: number) => {
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h} ${h === 1 ? "hour" : "hours"}${r ? ` ${r} minutes` : ""}` : `${m} minutes`;
};

/** The tile a record belongs to: its kind's own tile, else its app's. */
function tileOf(app: LifeAppId, kind: string): string | null {
  const own = Object.entries(TILE_KIND).find(([, t]) => t.app === app && t.kind === kind);
  if (own) return own[0];
  const whole = Object.entries(TILE_KIND).find(([, t]) => t.app === app && !t.kind);
  return whole ? whole[0] : null;
}

const hrefOf = (tile: string) => (tile === "food" ? "/meals" : !TILE_KIND[tile] ? `/life/${tile}` : `/life/${TILE_KIND[tile].app}${TILE_KIND[tile].kind ? `?k=${TILE_KIND[tile].kind}` : ""}`);

/** What the week holds, tile by tile, in the order of the home screen; tiles with nothing are left out. */
export function weekLook(i: WeekInput, range: { from: string; to: string }): WeekLook {
  const inWeek = (day: string) => day >= range.from && day <= range.to;
  const byId = new Map(i.records.map((r) => [r.id, r]));
  const lines = new Map<string, string[]>();
  const push = (tile: string, line: string) => lines.set(tile, [...(lines.get(tile) ?? []), line]);

  if (i.readingDays || i.finished.length) {
    const learn: string[] = [];
    if (i.readingDays) learn.push(`Read on ${i.readingDays === 1 ? "1 day" : `${i.readingDays} days`}`);
    for (const b of i.finished.slice(0, 3)) learn.push(`Finished ${b.title}`);
    lines.set("learn", learn);
  }

  // Acts, summed by tile and kind of act: "Trained with 3 times, 2.5 hours".
  const sums = new Map<string, { tile: string; done: string; n: number; minutes: number }>();
  const qualities = new Map<string, number>();
  for (const a of i.acts) {
    if (!inWeek(a.day)) continue;
    const r = byId.get(a.record);
    if (!r) continue;
    if (r.kind === "quality") { if (a.kind === "wrote") qualities.set(String(r.body.ref ?? ""), (qualities.get(String(r.body.ref ?? "")) ?? 0) + 1); continue; }
    const tile = tileOf(r.app, r.kind);
    const act = kindOf(r.app, r.kind)?.acts?.find((x) => x.id === a.kind);
    if (!tile || !act || act.hidden) continue;
    const key = `${tile}|${act.id}|${r.kind}`;
    const s = sums.get(key) ?? { tile, done: act.done, n: 0, minutes: 0 };
    s.n += 1;
    s.minutes += a.minutes ?? 0;
    sums.set(key, s);
  }
  for (const s of sums.values()) push(s.tile, `${s.done} ${times(s.n)}${s.minutes ? `, ${hours(s.minutes)}` : ""}`.replace(/ (with|for|as|about|toward|on) (once|twice|\d+ times)/, " $2"));

  // Records added this week: "Added 2 friends".
  const added = new Map<string, { tile: string; one: string; many: string; n: number }>();
  for (const r of i.records) {
    if (!inWeek(r.createdAt.slice(0, 10)) || r.kind === "quality") continue;
    const k = kindOf(r.app, r.kind);
    const tile = tileOf(r.app, r.kind);
    if (!k || !tile || k.hidden) continue;
    const key = `${tile}|${r.kind}`;
    const label = k.label.toLowerCase();
    const a = added.get(key) ?? { tile, one: k.one ? `Filled in ${label}` : `Added ${/^[aeiou]/.test(label) ? "an" : "a"} ${label}`, many: `Added ${k.plural.toLowerCase()}`, n: 0 };
    a.n += 1;
    added.set(key, a);
  }
  for (const a of added.values()) push(a.tile, a.n === 1 ? a.one : a.many.replace(/^Added /, `Added ${a.n} `));

  // The calendar: events kept against a tile.
  const cal = new Map<string, number>();
  for (const e of i.calendar) if (inWeek(e.day) && e.tile && (e.tile in LABEL || e.tile === "learn")) cal.set(e.tile, (cal.get(e.tile) ?? 0) + 1);
  for (const [tile, n] of cal) push(tile, `${n === 1 ? "1 event" : `${n} events`} on the calendar`);

  const order = ["learn", ...Object.keys(LABEL)];
  const tiles = order.filter((t) => lines.get(t)?.length).map((t) => ({
    tile: t, label: t === "learn" ? "Scholē" : LABEL[t] ?? t, href: t === "learn" ? "/schole/reading" : hrefOf(t), lines: lines.get(t)!,
  }));
  const named = [...qualities].flatMap(([id, entries]) => {
    const name = i.traitName(id);
    return name ? [{ id, name, entries, href: `/schole/qualities/${encodeURIComponent(id)}` }] : [];
  }).sort((a, b) => b.entries - a.entries);
  return { tiles, qualities: named };
}
