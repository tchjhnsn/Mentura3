// The calendar, a tool (Torian, 2026-11-14 17:44Z: "Each tile will also need its own calendar (tags), and the user
// will need a master calendar"; 17:52Z: "a calendar is a tool"). An event is tagged with the tile it belongs to; a
// tile's calendar is the master calendar filtered to its tag. Repeats follow iCalendar's frequencies (RFC 5545
// FREQ=DAILY, WEEKLY, MONTHLY, YEARLY) with an optional end day. Pure: no I/O.

export const CAL_TILES = [
  { id: "learn", label: "Scholē" }, { id: "work", label: "Work" }, { id: "home", label: "Home" }, { id: "body", label: "Body" },
  { id: "friends", label: "Friends" }, { id: "mate", label: "Mate" }, { id: "kin", label: "Kin" }, { id: "polis", label: "Polis" }, { id: "ventures", label: "Ventures" }, { id: "legacy", label: "Legacy" },
] as const;
export type CalTile = (typeof CAL_TILES)[number]["id"];
export const isCalTile = (v: unknown): v is CalTile => CAL_TILES.some((t) => t.id === v);
export const tileLabel = (t: CalTile | null) => CAL_TILES.find((x) => x.id === t)?.label ?? "No tile";

export const REPEATS = [
  { id: "none", label: "Once" }, { id: "daily", label: "Every day" }, { id: "weekly", label: "Every week" }, { id: "monthly", label: "Every month" }, { id: "yearly", label: "Every year" },
] as const;
export type Repeat = (typeof REPEATS)[number]["id"];
export const isRepeat = (v: unknown): v is Repeat => REPEATS.some((r) => r.id === v);

export type CalEvent = { id: string; tile: CalTile | null; title: string; note: string | null; day: string; starts: string | null; ends: string | null; repeat: Repeat; until: string | null; recordId: string | null;
  /** The calendar it came from, for an event read from a subscribed calendar or Google Calendar (`@reflect/core/ics`). Such an event is read-only in Reflect. */
  feed?: { id: string; name: string } };
export type Occurrence = { event: CalEvent; day: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
export const addDays = (d: string, n: number) => new Date(ms(d) + n * 86400_000).toISOString().slice(0, 10);
function addMonths(d: string, n: number): string | null {
  const [y, m, day] = d.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1 + n, day));
  return t.getUTCDate() === day ? t.toISOString().slice(0, 10) : null; // the 31st skips months without one, as RFC 5545 does
}

/** Every day an event falls on from `from` through `to`, in order. */
export function occurrences(events: readonly CalEvent[], from: string, to: string): Occurrence[] {
  if (!DAY.test(from) || !DAY.test(to) || from > to) return [];
  const out: Occurrence[] = [];
  for (const e of events) {
    const last = e.until && e.until < to ? e.until : to;
    if (e.repeat === "none") {
      if (e.day >= from && e.day <= last) out.push({ event: e, day: e.day });
      continue;
    }
    for (let i = 0, d: string | null = e.day; i < 2000; i++) {
      d = e.repeat === "daily" ? addDays(e.day, i) : e.repeat === "weekly" ? addDays(e.day, 7 * i) : addMonths(e.day, e.repeat === "monthly" ? i : 12 * i);
      if (d === null) continue;
      if (d > last) break;
      if (d >= from) out.push({ event: e, day: d });
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || (a.event.starts ?? "").localeCompare(b.event.starts ?? "") || a.event.title.localeCompare(b.event.title));
}

/** The Monday on or before a day, and the 42 days of a month's grid (six weeks from the Monday on or before the 1st). */
export const mondayOf = (d: string) => addDays(d, -((new Date(ms(d)).getUTCDay() + 6) % 7));
export function monthGrid(month: string): string[] {
  const first = mondayOf(`${month}-01`);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}
export const shiftMonth = (month: string, n: number) => addMonths(`${month}-01`, n)!.slice(0, 7);

/** A record from a tile, as the calendar reads it: its id, tile, kind, state and fields. */
export type DatedRecord = { id: string; app: string; kind: string; state: string | null; body: Record<string, string | number | boolean> };

// The days the tiles' records already hold, which put them on the calendar without being entered twice: a date
// planned (Mate), an election and a duty due (Polis), a fitness goal's day (Body), and a relative's birthday each
// year (Kin). Each names the field, how to title it, and states that keep it off.
const DATED: { app: CalTile; kind: string; key: string; title: (b: DatedRecord["body"]) => string; repeat?: (b: DatedRecord["body"]) => Repeat; skip?: (r: DatedRecord) => boolean }[] = [
  { app: "mate", kind: "date", key: "day", title: (b) => `Date with ${String(b.who || "someone")}`, skip: (r) => r.state === "missed" },
  { app: "polis", kind: "election", key: "day", title: (b) => String(b.name || "Election") },
  { app: "polis", kind: "election", key: "when", title: (b) => `Vote${b.how ? `, ${String(b.how).replace(/-/g, " ")}` : ""}: ${String(b.name || "election")}`, skip: (r) => r.state === "voted" || r.state === "did-not-vote" },
  // A duty that comes back each year stays on the calendar after it is done; one that comes once leaves it.
  { app: "polis", kind: "duty", key: "due", title: (b) => `${String(b.name || "A duty")} due`, repeat: (b) => (b.repeats === "every-year" ? "yearly" : "none"), skip: (r) => r.state === "done" && r.body.repeats !== "every-year" },
  { app: "body", kind: "fitness", key: "by", title: (b) => `Goal: ${String(b.goal || "a goal")}`, skip: (r) => r.state === "reached" || r.state === "lapsed" },
  { app: "kin", kind: "relative", key: "born", title: (b) => `${String(b.name || "Kin")}'s birthday`, repeat: () => "yearly", skip: (r) => r.state === "died" },
];

/** Calendar events from the days the person's records hold. Their id is `record:<record id>:<field>`; they are edited on the record. */
export function recordEvents(records: readonly DatedRecord[]): CalEvent[] {
  const out: CalEvent[] = [];
  for (const r of records) {
    for (const d of DATED.filter((x) => x.app === r.app && x.kind === r.kind)) {
      const day = r.body[d.key];
      if (typeof day !== "string" || !DAY.test(day) || d.skip?.(r)) continue;
      out.push({ id: `record:${r.id}:${d.key}`, tile: d.app, title: d.title(r.body), note: null, day, starts: null, ends: null, repeat: d.repeat?.(r.body) ?? "none", until: null, recordId: r.id });
    }
  }
  return out;
}
export const isRecordEvent = (e: Pick<CalEvent, "id">) => e.id.startsWith("record:");
