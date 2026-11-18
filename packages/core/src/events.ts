// Events and connections (doc "Events and connections design guide", 2026-11-18): the shared shapes and pure rules
// the Events tool, check-in, Friends and Ventures all use. Tables: web/src/db/migrations/0050_events.sql.

/** Where an event came from: hosted in Reflect, or Eddy's Austin feed (eddyhdzg.com, attributed on every page). */
export type EventSource = "reflect" | "eddy";

/** One event as every page and action reads it. */
export type EventOut = {
  id: string;
  source: EventSource;
  hostUser: string | null;
  status: "draft" | "published" | "cancelled";
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venue: string | null;
  address: string | null;
  /** Where to register when the event lives on another site (Luma, Eventbrite...); null for a Reflect event. */
  url: string | null;
  coverUrl: string | null;
  tags: string[];
  price: string | null;
  city: string;
  /** Who it is for, in the host's words ("looking for a co-founder"). */
  forWhom: string | null;
};

/** The fields a row of `event` is written from: an event from a feed, or a hosted event's parts. */
export type EventInput = Omit<EventOut, "id" | "hostUser" | "status"> & { sourceId: string | null };

/** Eddy's feed, attributed wherever one of its events is shown. */
export const EDDY = { name: "Eddy's Austin events", href: "https://eddyhdzg.com/events", api: "https://eddyhdzg.com/api/rest/v1/events" } as const;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * One event from Eddy's feed (GET /api/rest/v1/events) as an event row, or null when it lacks an id, a title or a
 * start, or is online only. Its registration link is the first platform's url.
 */
export function fromEddy(raw: unknown): EventInput | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const id = str(e.id), title = str(e.title), starts = str(e.startDate);
  if (!id || !title || !starts || e.isOnline === true) return null;
  const venue = e.venue && typeof e.venue === "object" ? (e.venue as Record<string, unknown>) : null;
  const platforms = Array.isArray(e.platforms) ? (e.platforms as Record<string, unknown>[]) : [];
  const first = platforms.find((p) => str(p.url)) ?? null;
  const tags = Array.isArray(e.tags) ? (e.tags as Record<string, unknown>[]).map((t) => str(t.label)).filter((t): t is string => t !== null) : [];
  const price = e.isFree === true ? "Free" : first && str(first.price) && str(first.price) !== "0" ? `$${str(first.price)}` : null;
  return {
    source: "eddy",
    sourceId: id,
    title: title.slice(0, 200),
    description: str(e.shortDescription) ?? str(e.description),
    startsAt: starts,
    endsAt: str(e.endDate),
    venue: str(venue?.name) ?? str(e.venueNotes),
    address: str(venue?.formattedAddress),
    url: first ? str(first.url) : null,
    coverUrl: str(e.imageUrl) ?? str(e.thumbUrl),
    tags,
    price,
    city: "austin",
    forWhom: null,
  };
}

/** The day an instant falls on in Austin's time zone (YYYY-MM-DD), for grouping events by day. */
export function austinDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** A day heading such as "Thu, Nov 20". */
export function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00Z`));
}

/** A time such as "6:00 PM" in Austin. */
export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** Interests as kept: trimmed, lower case, unique, at most 12 of at most 40 characters. */
export function cleanInterests(raw: readonly unknown[]): string[] {
  const out: string[] = [];
  for (const v of raw) {
    const s = typeof v === "string" ? v.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40) : "";
    if (s && !out.includes(s)) out.push(s);
    if (out.length === 12) break;
  }
  return out;
}

/** The interests two people share, in the first person's order. */
export const sharedInterests = (mine: readonly string[], theirs: readonly string[]) => mine.filter((i) => theirs.includes(i));

/** Aristotle's three friendships (Ethics VIII.3); a connection made at an event starts as utility. */
export const FRIEND_KINDS = [
  { id: "utility", label: "Of use" },
  { id: "pleasure", label: "Of pleasure" },
  { id: "good", label: "Of the good" },
] as const;
export type FriendKind = (typeof FRIEND_KINDS)[number]["id"];
export const isFriendKind = (v: unknown): v is FriendKind => FRIEND_KINDS.some((k) => k.id === v);

/** How long a Connect tap waits for the other person's tap. */
export const CONNECT_DAYS = 7;

/** Whether an event is running at `now`: from its start to its end, or six hours after a start with no end. */
export function isRunning(e: Pick<EventOut, "startsAt" | "endsAt">, now = new Date()): boolean {
  if (!e.startsAt) return false;
  const start = Date.parse(e.startsAt) - 60 * 60 * 1000; // doors open an hour early
  const end = e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt) + 6 * 60 * 60 * 1000;
  return now.getTime() >= start && now.getTime() <= end;
}
