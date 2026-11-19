/**
 * Meetings (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): a meeting a person hosts on a
 * venture, its guests, agenda, notes, follow-ups and prep, held on an outside call link or, once the deployment has a
 * Daily key, in a call embedded in the meeting page. Pure: when a meeting is live, when Join opens, how its parts are
 * cleaned, and the words its pages show. Nothing here reads a store or the clock unless given one.
 */

/** A meeting's state as its pages show it. "draft" has no start yet; "cancelled" was cancelled by the host. */
export type MeetingState = "draft" | "scheduled" | "live" | "ended" | "cancelled";

/** Join opens this many minutes before the start. */
export const JOIN_EARLY_MIN = 10;
/** A meeting stays live this many minutes past its planned end, so a call that runs over is not cut off. */
export const LIVE_AFTER_MIN = 30;
/** The length a new meeting starts with. */
export const DEFAULT_MINUTES = 45;
/** The title a new meeting starts with; the host renames it. */
export const DRAFT_MEETING_TITLE = "New meeting";

export type MeetingTimes = { startsAt: string | null; minutes: number; cancelled: boolean };

const MIN = 60_000;

/** The meeting's state at `now`. */
export function meetingState(m: MeetingTimes, now = new Date()): MeetingState {
  if (m.cancelled) return "cancelled";
  if (!m.startsAt) return "draft";
  const start = Date.parse(m.startsAt);
  const t = now.getTime();
  if (t < start - JOIN_EARLY_MIN * MIN) return "scheduled";
  if (t <= start + (m.minutes + LIVE_AFTER_MIN) * MIN) return "live";
  return "ended";
}

/** Whether Join is open: from ten minutes before the start until thirty minutes past the planned end. */
export const canJoin = (m: MeetingTimes, now = new Date()) => meetingState(m, now) === "live";

/** When Join opens, as an instant, or null with no start. */
export const joinOpensAt = (m: Pick<MeetingTimes, "startsAt">) => (m.startsAt ? new Date(Date.parse(m.startsAt) - JOIN_EARLY_MIN * MIN).toISOString() : null);

/** The planned end, or null with no start. */
export const endsAt = (m: Pick<MeetingTimes, "startsAt" | "minutes">) => (m.startsAt ? new Date(Date.parse(m.startsAt) + m.minutes * MIN).toISOString() : null);

/** The parts of a meeting the host sets one at a time, as the page and set_meeting_part name them. */
export const MEETING_PARTS = ["title", "starts_at", "minutes", "agenda", "call_url", "venture_id"] as const;
export type MeetingPart = (typeof MEETING_PARTS)[number];
export const isMeetingPart = (v: unknown): v is MeetingPart => MEETING_PARTS.includes(v as MeetingPart);

/**
 * A part's value as the row keeps it, from what the person gave: the title trimmed and required, a start as an instant
 * (empty clears it), a length of 5 to 480 minutes, the agenda as text, a call link that is https, and a venture id.
 * Throws a plain error naming what is wrong.
 */
export function cleanMeetingPart(part: MeetingPart, value: unknown): string | number | null {
  const text = typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  switch (part) {
    case "title": {
      const t = text.replace(/\s+/g, " ").slice(0, 200);
      if (!t) throw new Error("Name the meeting.");
      return t;
    }
    case "starts_at": {
      if (!text) return null;
      const t = Date.parse(text);
      if (Number.isNaN(t)) throw new Error("That is not a date and time.");
      return new Date(t).toISOString();
    }
    case "minutes": {
      const n = Math.round(Number(text));
      if (!Number.isFinite(n) || n < 5 || n > 480) throw new Error("Give a length from 5 to 480 minutes.");
      return n;
    }
    case "agenda":
      return text ? text.slice(0, 8000) : null;
    case "call_url": {
      if (!text) return null;
      let u: URL;
      try { u = new URL(text); } catch { throw new Error("Give the call's link (https://...)."); }
      if (u.protocol !== "https:") throw new Error("Give the call's link (https://...).");
      return u.toString().slice(0, 2000);
    }
    case "venture_id":
      return text ? text.slice(0, 100) : null;
  }
}

/** An email address trimmed and lowercased, or a plain error. */
export function cleanEmail(value: unknown): string {
  const e = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 254) throw new Error("Give an email address.");
  return e;
}

/** The agenda's items, one per non-empty line, with any list marker ("1.", "-", "*") taken off. */
export function agendaItems(agenda: string | null): string[] {
  if (!agenda) return [];
  return agenda.split("\n").map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim()).filter(Boolean);
}

/** A follow-up: what is to be done, by whom, by when, and whether it is done. */
export type Followup = { id: string; text: string; owner: string | null; due: string | null; done: boolean };

/** A follow-up's text and owner cleaned, and its due day (YYYY-MM-DD) or null. Throws a plain error. */
export function cleanFollowup(input: { text: unknown; owner?: unknown; due?: unknown }): { text: string; owner: string | null; due: string | null } {
  const text = typeof input.text === "string" ? input.text.replace(/\s+/g, " ").trim().slice(0, 500) : "";
  if (!text) throw new Error("Say what is to be done.");
  const owner = typeof input.owner === "string" && input.owner.trim() ? input.owner.replace(/\s+/g, " ").trim().slice(0, 100) : null;
  const dueText = typeof input.due === "string" ? input.due.trim() : "";
  if (dueText && !/^\d{4}-\d{2}-\d{2}$/.test(dueText)) throw new Error("Give the due day as YYYY-MM-DD.");
  return { text, owner, due: dueText || null };
}

/**
 * The prep a host keeps for one meeting (design guide, Meeting prep): key points, questions with answers (each marked
 * once rehearsed), assets with presenter notes, facts about the other person (each with its source), and a checklist.
 * Kept whole, sealed with the host's key; only the host reads it.
 */
export type MeetingPrep = {
  keyPoints: string[];
  questions: { id: string; question: string; answer: string; rehearsed: boolean }[];
  assets: { id: string; name: string; url: string | null; notes: string }[];
  about: { id: string; fact: string; source: string }[];
  checklist: { id: string; text: string; done: boolean }[];
};

/** The checklist every prep starts with. */
export const PREP_CHECKLIST = ["Devices tested", "Fallback link ready", "Assets open"] as const;

export const emptyPrep = (): MeetingPrep => ({
  keyPoints: [],
  questions: [],
  assets: [],
  about: [],
  checklist: PREP_CHECKLIST.map((text, i) => ({ id: `c${i + 1}`, text, done: false })),
});

/** A prep read from storage, with any missing or malformed part replaced by its empty form. */
export function readPrep(value: unknown): MeetingPrep {
  const v = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof MeetingPrep, unknown>>;
  const base = emptyPrep();
  const arr = <T>(x: unknown, ok: (y: unknown) => y is T): T[] => (Array.isArray(x) ? x.filter(ok) : []);
  const obj = (y: unknown): y is Record<string, unknown> => !!y && typeof y === "object";
  const str = (y: unknown): y is string => typeof y === "string";
  return {
    keyPoints: arr(v.keyPoints, str),
    questions: arr(v.questions, obj).filter((q) => str(q.id) && str(q.question)).map((q) => ({ id: q.id as string, question: q.question as string, answer: str(q.answer) ? q.answer : "", rehearsed: q.rehearsed === true })),
    assets: arr(v.assets, obj).filter((a) => str(a.id) && str(a.name)).map((a) => ({ id: a.id as string, name: a.name as string, url: str(a.url) ? a.url : null, notes: str(a.notes) ? a.notes : "" })),
    about: arr(v.about, obj).filter((f) => str(f.id) && str(f.fact) && str(f.source) && (f.source as string).trim() !== "").map((f) => ({ id: f.id as string, fact: f.fact as string, source: f.source as string })),
    checklist: Array.isArray(v.checklist) ? arr(v.checklist, obj).filter((c) => str(c.id) && str(c.text)).map((c) => ({ id: c.id as string, text: c.text as string, done: c.done === true })) : base.checklist,
  };
}

/** How many questions are rehearsed, as the prep page counts them ("12 of 18 rehearsed"), never a score. */
export const rehearsedCount = (p: MeetingPrep) => ({ done: p.questions.filter((q) => q.rehearsed).length, of: p.questions.length });

/** Words for where a meeting stands, for the line under its title. Times are in `tz` (default America/Chicago). */
export function stateLine(m: MeetingTimes, now = new Date(), tz = "America/Chicago"): string {
  const s = meetingState(m, now);
  if (s === "cancelled") return "Cancelled";
  if (s === "draft") return "Pick a time";
  const start = Date.parse(m.startsAt!);
  const when = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(start));
  if (s === "ended") return `Ended, ${when}`;
  if (s === "live") return now.getTime() < start ? `Starts in ${Math.max(1, Math.ceil((start - now.getTime()) / MIN))} minutes` : "Live now";
  const mins = Math.ceil((start - now.getTime()) / MIN);
  return mins <= 60 ? `Starts in ${mins} minutes, ${when}` : when;
}
