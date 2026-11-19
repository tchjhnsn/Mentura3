// virtu calendar: which season a day falls in. A season is a range of days,
// month and day ("MM-DD") inclusive, that repeats every year; one whose end is
// before its start wraps over the new year. Pure arithmetic with no imports,
// so an app can run it in the browser or on its server to set
// data-virtu-season, and the checker runs the same functions to find seasons
// that overlap. The design is docs/design/SEASONS.md.

/** A season's dates. */
export type Dated = { name: string; from: string; to: string };

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** A day's index in a leap year, 0 for 01-01 and 365 for 12-31, or null when it is not a "MM-DD" day. */
export function dayIndex(md: string): number | null {
  const m = /^(\d\d)-(\d\d)$/.exec(md);
  if (m === null) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12) return null;
  const last = DAYS_IN_MONTH[month - 1] ?? 0;
  if (day < 1 || day > last) return null;
  let i = 0;
  for (let k = 0; k < month - 1; k++) i += DAYS_IN_MONTH[k] ?? 0;
  return i + day - 1;
}

/** The day indexes a season covers, in order from its start. Empty when a date is not a day. */
export function daysOf(s: Dated): number[] {
  const a = dayIndex(s.from);
  const b = dayIndex(s.to);
  if (a === null || b === null) return [];
  const out: number[] = [];
  for (let i = a; ; i = (i + 1) % 366) {
    out.push(i);
    if (i === b) break;
  }
  return out;
}

/** "MM-DD" for a day index. */
export function dayName(index: number): string {
  let i = index;
  for (let m = 0; m < 12; m++) {
    const n = DAYS_IN_MONTH[m] ?? 0;
    if (i < n) return `${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    i -= n;
  }
  return "12-31";
}

/**
 * The season a date falls in, by the date's month and day in the given time
 * zone (the runtime's own when none is given), or null between seasons. When
 * seasons overlap the first listed wins, but the checker refuses overlaps.
 */
export function seasonOn<T extends Dated>(seasons: readonly T[], date: Date, timeZone?: string): T | null {
  let month: number;
  let day: number;
  if (timeZone === undefined) {
    month = date.getMonth() + 1;
    day = date.getDate();
  } else {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric", day: "numeric" }).formatToParts(date);
    month = Number(parts.find((p) => p.type === "month")?.value);
    day = Number(parts.find((p) => p.type === "day")?.value);
  }
  const today = dayIndex(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  if (today === null) return null;
  for (const s of seasons) if (daysOf(s).includes(today)) return s;
  return null;
}

/** Pairs of seasons that share a day, with the first day they share. */
export function overlaps(seasons: readonly Dated[]): Array<{ a: string; b: string; day: string }> {
  const out: Array<{ a: string; b: string; day: string }> = [];
  for (let i = 0; i < seasons.length; i++) {
    const si = seasons[i];
    if (si === undefined) continue;
    const mine = new Set(daysOf(si));
    for (let j = i + 1; j < seasons.length; j++) {
      const sj = seasons[j];
      if (sj === undefined) continue;
      const shared = daysOf(sj).find((d) => mine.has(d));
      if (shared !== undefined) out.push({ a: si.name, b: sj.name, day: dayName(shared) });
    }
  }
  return out;
}
