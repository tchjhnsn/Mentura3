/**
 * Learning an instrument in Scholē (Torian, 2026-11-17: "learning piano ... goes inside of Scholē"). A course of
 * graded pieces, in the order teachers set them (the ABRSM and RCM graded syllabuses, and the method books they draw
 * on: the Notebook for Anna Magdalena Bach, Clementi's sonatinas, Schumann's Album for the Young). Each piece is in
 * the public domain, with a free recording on Wikimedia Commons to hear first and its score on IMSLP. Practice is the
 * one thing the person keeps: minutes a day on the course, and which pieces they have learned. No grading of the
 * person: a piece's grade is how hard it is, as the syllabuses place it. Pure: no I/O.
 */
import type { CollectionItem } from "./collections";
import { PIANO_PIECES } from "./instrument-pieces";

export type Era = "Baroque" | "Classical" | "Romantic" | "Modern";
export type Piece = {
  /** Its unit on the kept course: the key a learned piece is kept under. Never change one once used. */
  id: string;
  title: string;
  composer: string;
  /** When it was written or first printed. */
  year: string;
  era: Era;
  /** How hard it is, as the ABRSM and RCM syllabuses place it (approximately): 1 is a first year of lessons. */
  grade: number;
  /** The book or set it comes from. */
  from: string;
  /** Its page on IMSLP, with the free score. */
  imslp: string;
  /** A free recording on Wikimedia Commons, credited with its licence (`commons` in `./collections`). */
  recording: CollectionItem & { kind: "find" };
  /** Why it is here, in a sentence. */
  why: string;
};
export type Instrument = {
  id: string;
  name: string;
  by: string;
  about: string;
  /** The link the course is kept under on the person's shelves (a learn item's url), and its reference page. */
  url: string;
  pieces: readonly Piece[];
};

export const PIANO: Instrument = {
  id: "piano",
  name: "Piano",
  by: "Reflect's editors",
  about: "Learn the piano one piece at a time, from a first minuet to Bach's Prelude in C. Listen to each piece first, then open the free score and practise it. Every piece is in the public domain, in the order teachers set them.",
  url: "https://en.wikipedia.org/wiki/Piano_pedagogy",
  pieces: PIANO_PIECES,
};

export const INSTRUMENTS: readonly Instrument[] = [PIANO];
export const instrumentById = (id: string): Instrument | undefined => INSTRUMENTS.find((x) => x.id === id);
export const instrumentByUrl = (url: string | null | undefined): Instrument | undefined => (url ? INSTRUMENTS.find((x) => x.url === url) : undefined);
export const instrumentHref = (x: Pick<Instrument, "id">) => `/schole/courses/${x.id}`;

/** The piece to practise now: the first in order not yet learned, or null when every one is. */
export function nextPiece(pieces: readonly Piece[], learned: Iterable<string>): Piece | null {
  const done = new Set(learned);
  return pieces.find((p) => !done.has(p.id)) ?? null;
}

const DAY = 86400_000;
const dayBefore = (today: string, n: number) => new Date(Date.parse(`${today}T00:00:00Z`) - n * DAY).toISOString().slice(0, 10);

export type Session = { day: string; minutes: number | null };

/** Minutes practised on each of the last `days` days, oldest first, today last. */
export function minutesByDay(sessions: readonly Session[], today: string, days = 14): { day: string; minutes: number }[] {
  const list = Array.from({ length: days }, (_, i) => dayBefore(today, days - 1 - i));
  const by = new Map(list.map((d) => [d, 0]));
  for (const s of sessions) if (by.has(s.day)) by.set(s.day, by.get(s.day)! + (s.minutes ?? 0));
  return list.map((day) => ({ day, minutes: by.get(day)! }));
}

/** Minutes practised in the last seven days, today included. */
export const minutesThisWeek = (sessions: readonly Session[], today: string): number => minutesByDay(sessions, today, 7).reduce((n, d) => n + d.minutes, 0);

/** Days in a row, ending today or yesterday, with some practice. */
export function daysInARow(sessions: readonly Session[], today: string): number {
  const days = new Set(sessions.filter((s) => (s.minutes ?? 0) > 0 || s.minutes === null).map((s) => s.day));
  let n = 0;
  let d = days.has(today) ? today : dayBefore(today, 1);
  while (days.has(d)) { n++; d = dayBefore(d, 1); }
  return n;
}

export type InstrumentView = {
  instrument: { id: string; name: string; by: string; url: string };
  /** The person's kept course (a learn item id), or null before their first practice. */
  kept: string | null;
  current: Piece | null;
  learned: string[];
  week: number;
  inARow: number;
  days: { day: string; minutes: number }[];
  pieces: (Piece & { learned: boolean; current: boolean })[];
};

/** What the course page shows: the piece for today, practice over the last two weeks, and every piece. */
export function instrumentView(x: Instrument, s: { kept: string | null; learned: readonly string[]; sessions: readonly Session[] }, today: string): InstrumentView {
  const ids = new Set(x.pieces.map((p) => p.id));
  const learned = [...new Set(s.learned)].filter((u) => ids.has(u));
  const current = nextPiece(x.pieces, learned);
  return {
    instrument: { id: x.id, name: x.name, by: x.by, url: x.url },
    kept: s.kept, current, learned,
    week: minutesThisWeek(s.sessions, today),
    inARow: daysInARow(s.sessions, today),
    days: minutesByDay(s.sessions, today, 14),
    pieces: x.pieces.map((p) => ({ ...p, learned: learned.includes(p.id), current: p.id === current?.id })),
  };
}

export const INSTRUMENT_PATHS = "'' (today's piece and this week's minutes), 'pieces' (every piece in order, learned or not), 'pieces/<piece id>', 'practice' (minutes a day for the last 14 days)";

/** One part of the person's course on an instrument, by path, or null. */
export function instrumentPart(v: InstrumentView, path: string): unknown {
  const [head, key, ...rest] = path.split("/").filter(Boolean);
  if (rest.length) return null;
  const brief = (p: InstrumentView["pieces"][number]) => ({ id: p.id, title: p.title, composer: p.composer, era: p.era, grade: p.grade, learned: p.learned, current: p.current });
  const full = (p: InstrumentView["pieces"][number]) => ({ ...brief(p), year: p.year, from: p.from, why: p.why, score: p.imslp, recording: { url: p.recording.url, by: p.recording.by, credit: p.recording.credit } });
  if (!head) {
    const cur = v.pieces.find((p) => p.current);
    return { instrument: v.instrument.name, today: cur ? full(cur) : null, learned: v.learned.length, of: v.pieces.length, minutesThisWeek: v.week, daysInARow: v.inARow };
  }
  if (head === "pieces") {
    if (!key) return v.pieces.map(brief);
    const p = v.pieces.find((x) => x.id === key);
    return p ? full(p) : null;
  }
  if (head === "practice" && !key) return { days: v.days, minutesThisWeek: v.week, daysInARow: v.inARow };
  return null;
}
