/**
 * Dialectic, the way of learning that needs other people (Topics I.1-2: reputable opinions tested by question and
 * answer). Torian, 2026-11-16 09:09Z, built from the guide tab "Ways and dialectic": debates (a motion, two sides, a
 * host and a format), rooms (a live table on one work or question) and threads (a question answered in writing).
 * Pure rules here; the store keeps the rows.
 */

export type Side = "for" | "against";
export const SIDES: readonly { id: Side; label: string }[] = [{ id: "for", label: "For" }, { id: "against", label: "Against" }];

export type FormatStep = { label: string; minutes: number };
export type Format = { id: string; label: string; about: string; steps: readonly FormatStep[] };

/**
 * Debate formats. "Two sides" is the plain shape of a parliamentary or Oxford-style debate; the disputation follows
 * the medieval quaestio (Aquinas's articles: objections, "on the contrary", "I answer that", replies to objections).
 */
export const FORMATS: readonly Format[] = [
  {
    id: "two-sides", label: "Two sides", about: "Each side opens, answers the other, takes questions from the floor and closes.",
    steps: [{ label: "Opening, each side", minutes: 6 }, { label: "Rebuttal, each side", minutes: 4 }, { label: "Questions from the floor", minutes: 15 }, { label: "Closing, each side", minutes: 3 }],
  },
  {
    id: "disputation", label: "Disputation", about: "The medieval form: objections first, then the contrary, the answer and the replies.",
    steps: [{ label: "The question is put", minutes: 2 }, { label: "Objections", minutes: 8 }, { label: "On the contrary", minutes: 3 }, { label: "I answer that", minutes: 8 }, { label: "Replies to the objections", minutes: 8 }],
  },
];
export const formatById = (id: string): Format | undefined => FORMATS.find((f) => f.id === id);
export const formatMinutes = (f: Format): number => f.steps.reduce((n, s) => n + s.minutes, 0);

export const LIMITS = { motion: [8, 200], title: [3, 120], question: [8, 300], source: 200, body: 4000, chat: 1000, speakers: 8 } as const;

/** Text as typed, trimmed and without control characters, or null when outside its bounds. */
export function clean(v: unknown, max: number, min = 1): string | null {
  if (typeof v !== "string") return null;
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim();
  return s.length >= min && s.length <= max ? s : null;
}

export type DebateState = "upcoming" | "live" | "ended";

/**
 * Where a debate stands: live while its room is open; ended once its room has closed, or three hours past its start
 * with no room opened; upcoming otherwise.
 */
export function debateState(d: { startsAt: string; roomOpen: boolean; roomClosed: boolean }, now: Date = new Date()): DebateState {
  if (d.roomOpen) return "live";
  if (d.roomClosed) return "ended";
  return now.getTime() > Date.parse(d.startsAt) + 3 * 3600_000 ? "ended" : "upcoming";
}

/** Who holds a seat: the first person to take each side, never the same person on both. */
export function seated(seats: readonly { side: Side; userId: string; at: string }[]): Partial<Record<Side, string>> {
  const out: Partial<Record<Side, string>> = {};
  for (const s of [...seats].sort((a, b) => a.at.localeCompare(b.at))) {
    if (out[s.side] || Object.values(out).includes(s.userId)) continue;
    out[s.side] = s.userId;
  }
  return out;
}

/**
 * Who is in a room: each person's latest join or leave counts, and a join older than the cutoff (a tab left open)
 * no longer does. Speakers are the host and whoever the host let speak; a raised hand stands until it is answered.
 */
export function roomPeople(r: {
  host: string;
  moves: readonly { userId: string; kind: "join" | "leave"; at: string }[];
  hands: readonly { userId: string; at: string }[];
  grants: readonly { userId: string; at: string }[];
}, now: Date = new Date(), cutoffMs = 2 * 3600_000): { present: string[]; speakers: string[]; listeners: string[]; hands: string[] } {
  const last = new Map<string, { kind: "join" | "leave"; at: string }>();
  for (const m of [...r.moves].sort((a, b) => a.at.localeCompare(b.at))) last.set(m.userId, m);
  const present = [...last].filter(([, m]) => m.kind === "join" && now.getTime() - Date.parse(m.at) < cutoffMs).map(([u]) => u);
  const granted = new Map<string, string>();
  for (const g of r.grants) if (!granted.has(g.userId) || granted.get(g.userId)! < g.at) granted.set(g.userId, g.at);
  const speakers = [r.host, ...[...granted.keys()].filter((u) => u !== r.host)].filter((u) => present.includes(u)).slice(0, LIMITS.speakers);
  const hands = [...new Map(r.hands.map((h) => [h.userId, h.at]))].filter(([u, at]) => present.includes(u) && !speakers.includes(u) && !(granted.get(u)! >= at)).map(([u]) => u);
  return { present, speakers, listeners: present.filter((u) => !speakers.includes(u)), hands };
}
