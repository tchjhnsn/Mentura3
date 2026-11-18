// Pure pieces behind the dashboard's Weather, Health and People to see cards: no I/O, so they are tested on their own.

/** Austin's centre, the only place Reflect sends Open-Meteo: a city's coordinates, nothing about the person. */
export const AUSTIN = { name: "Austin", lat: 30.2672, lon: -97.7431 } as const;

/**
 * The city for a county the person keeps in Home's "Where you live", by its seat or largest city, for the Texas
 * counties around Reflect's cities. Only these coordinates go to Open-Meteo; a county not listed falls back to Austin.
 */
const COUNTY_CITIES: Record<string, { name: string; lat: number; lon: number }> = {
  "travis tx": AUSTIN,
  "williamson tx": { name: "Round Rock", lat: 30.5083, lon: -97.6789 },
  "hays tx": { name: "San Marcos", lat: 29.8833, lon: -97.9414 },
  "bastrop tx": { name: "Bastrop", lat: 30.1105, lon: -97.3153 },
  "bexar tx": { name: "San Antonio", lat: 29.4241, lon: -98.4936 },
  "harris tx": { name: "Houston", lat: 29.7604, lon: -95.3698 },
  "dallas tx": { name: "Dallas", lat: 32.7767, lon: -96.797 },
  "tarrant tx": { name: "Fort Worth", lat: 32.7555, lon: -97.3308 },
  "collin tx": { name: "McKinney", lat: 33.1972, lon: -96.6398 },
  "denton tx": { name: "Denton", lat: 33.2148, lon: -97.1331 },
  "el paso tx": { name: "El Paso", lat: 31.7619, lon: -106.485 },
  "fort bend tx": { name: "Sugar Land", lat: 29.6197, lon: -95.6349 },
  "mclennan tx": { name: "Waco", lat: 31.5493, lon: -97.1467 },
};

/** The place to forecast: the city for the county kept, else Austin. */
export function placeFor(county: unknown, state: unknown): { name: string; lat: number; lon: number } {
  const c = typeof county === "string" ? county.trim().toLowerCase().replace(/\s+county$/, "") : "";
  const st = typeof state === "string" ? state.trim().toLowerCase() : "";
  const key = `${c} ${st === "texas" ? "tx" : st}`;
  return COUNTY_CITIES[key] ?? AUSTIN;
}

/** Open-Meteo's forecast for a place today, in Fahrenheit and the place's own time zone. */
export function forecastUrl(place: { lat: number; lon: number }, zone = "America/Chicago"): string {
  const q = new URLSearchParams({
    latitude: place.lat.toFixed(4),
    longitude: place.lon.toFixed(4),
    current: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    temperature_unit: "fahrenheit",
    timezone: zone,
    forecast_days: "1",
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

/** WMO weather codes as Open-Meteo documents them, in plain words. */
export function weatherWords(code: number | null): string {
  if (code === null) return "";
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Thunderstorms";
  return "";
}

export type Forecast = { now: number | null; high: number | null; low: number | null; rain: number | null; words: string };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const first = (v: unknown) => (Array.isArray(v) ? num(v[0]) : null);

/** Reads Open-Meteo's answer; null when it holds no temperature at all, so the card shows nothing rather than guesses. */
export function readForecast(json: unknown): Forecast | null {
  if (!json || typeof json !== "object") return null;
  const j = json as { current?: Record<string, unknown>; daily?: Record<string, unknown> };
  const now = num(j.current?.temperature_2m);
  const high = first(j.daily?.temperature_2m_max);
  const low = first(j.daily?.temperature_2m_min);
  if (now === null && high === null && low === null) return null;
  const code = num(j.current?.weather_code) ?? first(j.daily?.weather_code);
  const r = (n: number | null) => (n === null ? null : Math.round(n));
  return { now: r(now), high: r(high), low: r(low), rain: r(first(j.daily?.precipitation_probability_max)), words: weatherWords(code) };
}

/** Minutes allowed for getting somewhere in town when nothing routes the trip. It is a margin, not a travel time. */
export const TRAVEL_MARGIN = 30;

/** The clock time to leave for something that starts at `starts` (HH:MM), allowing `margin` minutes; null before midnight. */
export function leaveBy(starts: string, margin = TRAVEL_MARGIN): string | null {
  const m = /^(\d{2}):(\d{2})$/.exec(starts);
  if (!m) return null;
  const t = Number(m[1]) * 60 + Number(m[2]) - margin;
  if (t < 0) return null;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Whether a line reads like a street address (a number then a street word), so a calendar note can count as one. */
export function looksLikeAddress(s: string | null | undefined): boolean {
  if (!s) return false;
  return /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Za-z0-9.' -]{2,40}\b(?:st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|pkwy|parkway|hwy|highway|ct|court|pl|place|trl|trail|cir|circle)\b\.?/i.test(s);
}

/** A birthday from a calendar event's title ("Ana's birthday", "Birthday: Ana"), with whose it is. */
export function birthdayName(title: string): string | null {
  const t = title.trim();
  const own = /^(.+?)[’']s?\s+birthday\b/i.exec(t);
  if (own) return own[1]!.trim();
  const lead = /^birthday\s*[:\-–]\s*(.+)$/i.exec(t);
  if (lead) return lead[1]!.trim();
  return null;
}

const DAY = 86400_000;
const daysFrom = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);

export type Birthday = { name: string; day: string; inDays: number };

/** Birthdays among calendar events from today on, soonest first and each person once. */
export function birthdaysAhead(events: readonly { title: string; day: string }[], today: string, within = 30): Birthday[] {
  const seen = new Set<string>();
  const out: Birthday[] = [];
  for (const e of [...events].sort((a, b) => a.day.localeCompare(b.day))) {
    const name = birthdayName(e.title);
    const inDays = daysFrom(today, e.day);
    if (!name || inDays < 0 || inDays > within || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({ name, day: e.day, inDays });
  }
  return out;
}

/** "Today", "Tomorrow" or "In 5 days". */
export const inDaysWords = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`);

/** How long since, in words: "12 days", "3 weeks", "2 months", or "Not yet" when never. */
export const sinceWords = (d: number | null) => (d === null ? "Not yet" : d < 1 ? "Today" : d < 14 ? `${d} days` : d < 60 ? `${Math.round(d / 7)} weeks` : `${Math.round(d / 30)} months`);

/**
 * Friends the person hasn't seen in a while: those past how often they mean to see them, then those with no rhythm
 * set and a month or more since time together (or never), longest first.
 */
export function quietFriends<F extends { since: number | null; overdue: boolean; every: string | null }>(friends: readonly F[], limit = 4): F[] {
  const quiet = friends.filter((f) => f.overdue || (f.every === null && (f.since === null || f.since >= 30)));
  return [...quiet].sort((a, b) => Number(b.overdue) - Number(a.overdue) || (b.since ?? Infinity) - (a.since ?? Infinity)).slice(0, limit);
}

/**
 * The last seven days of sleep, oldest first, in hours to a tenth; null for a night not logged. A night logged twice
 * counts its first entry in the list given (the store lists the newest first), so a correction replaces, not adds.
 */
export function sleepWeek(acts: readonly { kind: string; day: string; minutes: number | null }[], today: string): { day: string; hours: number | null }[] {
  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(`${today}T00:00:00Z`) - (6 - i) * DAY).toISOString().slice(0, 10));
  return days.map((day) => {
    const mins = acts.find((a) => a.kind === "slept" && a.day === day && a.minutes)?.minutes ?? null;
    return { day, hours: mins ? Math.round((Math.min(mins, 1440) / 60) * 10) / 10 : null };
  });
}

/** Workouts kept in the last seven days (moderate, vigorous and strength sessions). */
export function workoutsThisWeek(acts: readonly { kind: string; day: string }[], today: string): number {
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * DAY).toISOString().slice(0, 10);
  return acts.filter((a) => (a.kind === "moderate" || a.kind === "vigorous" || a.kind === "strength") && a.day >= from && a.day <= today).length;
}
