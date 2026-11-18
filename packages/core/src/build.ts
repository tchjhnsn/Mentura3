// People to build with (doc "Events and connections design guide", 2026-11-18): on one of the person's ventures, the
// people who want to build something, drawn from their connections and from people checked in at the same events,
// ranked by the interests they share. Pure rules and words only; the rows are in web/src/server/build-store.ts.
import { sharedInterests } from "./events";

/** How the person knows someone shown: a connection (friend_link), or someone checked in at an event they went to. */
export type BuildVia = "connection" | "event";

/** Where two people met: the event's title and when it started (null when it has no start). */
export type MetAt = { event: string; startsAt: string | null };

/** Someone who wants to build, as the store reads them before ranking. */
export type BuildCandidate = { id: string; name: string; image: string | null; interests: string[]; via: BuildVia; met: MetAt | null };

/** Where the person stands with someone shown, for one venture: nothing yet, asked and waiting (or not now), or yes. */
export type BuildStatus = "none" | "requested" | "yes";

/** Someone shown under "People to build with", ranked. */
export type BuildPerson = BuildCandidate & { shared: string[]; why: string; status: BuildStatus };

/** Why someone is shown, in one line under their name (everyone shown wants to build, so it is not said). */
export function whyShown(via: BuildVia, shared: number): string {
  if (shared) return `Shares ${shared === 1 ? "one" : shared} of your interests`;
  return via === "connection" ? "One of your connections" : "Was at an event you went to";
}

/** "Met at Founders Night, Fri, Nov 20" (the day in Austin), or "Met at Founders Night" when the event has no start. */
export function metLine(m: MetAt): string {
  if (!m.startsAt) return `Met at ${m.event}`;
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric" }).format(new Date(m.startsAt));
  return `Met at ${m.event}, ${day}`;
}

/**
 * The people to show, one row each, never the person: a connection wins over the same person met only at an event
 * (keeping the event they met at if the connection has none), ranked by shared interests, then connections before
 * people from events, then name.
 */
export function rankBuilders(me: string, myInterests: readonly string[], list: readonly BuildCandidate[], status: ReadonlyMap<string, BuildStatus> = new Map()): BuildPerson[] {
  const byId = new Map<string, BuildCandidate>();
  for (const c of list) {
    if (c.id === me) continue;
    const had = byId.get(c.id);
    if (!had) byId.set(c.id, c);
    else if (c.via === "connection" && had.via === "event") byId.set(c.id, { ...c, met: c.met ?? had.met });
    else if (!had.met && c.met) byId.set(c.id, { ...had, met: c.met });
  }
  return [...byId.values()]
    .map((c): BuildPerson => {
      const shared = sharedInterests(myInterests, c.interests);
      return { ...c, shared, why: whyShown(c.via, shared.length), status: status.get(c.id) ?? "none" };
    })
    .sort((p, q) => q.shared.length - p.shared.length || (p.via === q.via ? 0 : p.via === "connection" ? -1 : 1) || p.name.localeCompare(q.name));
}

/** What the person asked sees: "Asked to build Rosa's Prints with Ann". */
export const askedLine = (venture: string, from: string) => `Asked to build ${venture} with ${from}`;
