/**
 * Time to finish (Torian, 2026-11-16 19:20Z: "if they listen to it in 2x speed, they could listen to all of it within 60
 * hours instead"): how long a list takes at each listening speed, and how much a day it asks to be done by a date.
 * Pure: no I/O.
 */
export const SPEEDS = [1, 1.25, 1.5, 2] as const;

/** Seconds at a speed. */
export const atSpeed = (seconds: number, speed: number): number => (speed > 0 ? seconds / speed : seconds);

/** Whole days from one day to another (ISO dates), counting both ends; 0 when the date has passed. */
export function daysUntil(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

/** For each speed, the minutes a day it takes to finish `seconds` in `days`. */
export function dailyPlan(seconds: number, days: number): { speed: number; minutesADay: number }[] {
  return SPEEDS.map((speed) => ({ speed, minutesADay: days > 0 ? Math.ceil(atSpeed(seconds, speed) / 60 / days) : Infinity }));
}

/** A length said the way people say it: "45 min", "3 h 20 min", "120 h". */
export function hours(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h >= 20 || !r ? `${h} h` : `${h} h ${r} min`;
}
