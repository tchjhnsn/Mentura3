// Connections made at events (doc "Events and connections design guide", 2026-11-18): the person's incoming connect
// requests and the friends they made and where they met, a Connect to someone checked in to the same event (or back to
// someone who asked), how they see a friendship (Aristotle's three, FRIEND_KINDS), and what they show people they
// meet. The Here page, the Friends tile and Settings run the same entries. (The id `connections` is the connectors
// read in ./life.ts, so the read here is `connect_requests`.)
import { z } from "zod";
import { FRIEND_KINDS, cleanInterests, isFriendKind } from "@reflect/core/events";
import { hereState } from "../connect";
import { checkedIn, connect, friendsMet, incomingRequests, isCheckedIn, profileOf, recentCheckins, saveProfile, setFriendKind, withdrawRequest, type Met, type Profile } from "../connect-store";
import { action, type ActionContext, type LoggedChange } from "./types";

const eventHref = (id: string) => `/events/${id}`;
const metOut = (m: Met) => ({ name: m.name, met_at: m.event ? { title: m.event.title, starts_at: m.event.startsAt, href: eventHref(m.event.id) } : null, kind: FRIEND_KINDS.find((k) => k.id === m.kind)?.label ?? null, since: m.since });

export const connectRequestsAction = action({
  id: "connect_requests",
  title: "Read connect requests and people met",
  description: "Read who asked to connect with the person at an event (they answer with Connect back or Not now in the Friends tile, or connect_with), and the friends they made through Connect with the event where they met and how the person sees each friendship. Never shows anyone's email.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ limit: z.number().int().min(1).max(100).default(20) }),
  run: async ({ userId }, { limit }) => {
    const [incoming, met] = await Promise.all([incomingRequests(userId), friendsMet(userId)]);
    return {
      incoming: incoming.map((r) => ({ name: r.from.name, at: r.at, event: r.event ? { title: r.event.title, href: eventHref(r.event.id) } : null })),
      connections: met.slice(0, limit).map(metOut),
      href: "/life/friends",
    };
  },
});

/** Who a Connect can reach: someone with an open request to the person, or someone checked in to the same running event. */
export async function reachable(userId: string, to: string): Promise<{ id: string; name: string; eventId: string | null }> {
  const want = to.trim().toLowerCase();
  const fits = (p: { id: string; name: string }) => p.id === to || p.name.toLowerCase() === want;
  const asked = (await incomingRequests(userId)).filter((r) => fits(r.from));
  if (asked.length === 1) return { ...asked[0]!.from, eventId: asked[0]!.event?.id ?? null };
  const found: { id: string; name: string; eventId: string }[] = [];
  for (const e of await recentCheckins(userId)) {
    if (hereState(e, await isCheckedIn(e.id, userId)) !== "open") continue;
    for (const p of await checkedIn(e.id)) if (p.id !== userId && fits(p) && !found.some((f) => f.id === p.id)) found.push({ id: p.id, name: p.name, eventId: e.id });
  }
  if (found.length > 1 || asked.length > 1) throw new Error(`More than one person here is called ${to}. Use the Connect button under their face.`);
  if (!found.length) throw new Error("Connect reaches people checked in to the same event as you while it runs, and anyone who asked to connect with you.");
  return found[0]!;
}

export const connectWithAction = action({
  id: "connect_with",
  title: "Connect with someone met at an event",
  description: "Tap Connect for the person: with someone checked in to the same event as them while it runs, or back to someone who asked to connect with them (see connect_requests). Connect is mutual: until the other person taps too it is only a request, which shows to them in their requests and lapses after 7 days; once both tap, they are friends in Reflect with the event where they met. Only when the person asks. Undo takes back a request not yet answered.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ to: z.string().min(1).max(200).describe("The other person's name as shown at the event, or their id") }),
  run: async ({ userId }, { to }) => {
    const p = await reachable(userId, to);
    const r = await connect(userId, p.id, p.eventId);
    return { to: p.name, state: r.state, request: r.requestId, href: r.state === "connected" ? `/life/friends/messages/${encodeURIComponent(p.id)}` : p.eventId ? `${eventHref(p.eventId)}/here` : "/life/friends" };
  },
  change: (r) => ({ after: { request: r.request, state: r.state } }),
  undo: async ({ userId }: ActionContext, c: LoggedChange) => {
    const a = c.after as { request?: unknown; state?: unknown } | null;
    if (typeof a?.request !== "string") throw new Error("This change cannot be undone.");
    if (a.state === "connected" || !(await withdrawRequest(userId, a.request))) throw new Error("You are connected now; that cannot be taken back here.");
  },
});

/** One of the person's friends from Connect or an invite, by name or id. */
async function friendOf(userId: string, who: string): Promise<Met> {
  const want = who.trim().toLowerCase();
  const all = (await friendsMet(userId)).filter((m) => m.id === who || m.name.toLowerCase() === want);
  if (all.length > 1) throw new Error(`More than one friend is called ${who}.`);
  if (!all[0]) throw new Error("No such friend in Reflect.");
  return all[0];
}

const KIND = z.enum(["utility", "pleasure", "good"]);

export const setFriendKindAction = action({
  id: "set_friend_kind",
  title: "Say what a friendship is",
  description: `Keep how the person sees one friendship in Reflect, for them alone (the friend never sees it): ${FRIEND_KINDS.map((k) => `${k.id} (${k.label})`).join(", ")}, after Aristotle (Ethics VIII.3); null clears it. Only the person's own judgment, when they ask.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ friend: z.string().min(1).max(200).describe("The friend's name, or id"), kind: KIND.nullable() }),
  before: async ({ userId }, { friend }) => {
    const f = await friendOf(userId, friend).catch(() => null);
    return f ? { friend: f.id, kind: f.kind } : null;
  },
  run: async ({ userId }, { friend, kind }) => {
    const f = await friendOf(userId, friend);
    await setFriendKind(userId, f.id, kind);
    return { friend: f.name, id: f.id, kind: FRIEND_KINDS.find((k) => k.id === kind)?.label ?? null };
  },
  change: (_r, _i, before) => ({ before }),
  undo: async ({ userId }, c) => {
    const b = c.before as { friend?: unknown; kind?: unknown } | null;
    if (typeof b?.friend !== "string") throw new Error("This change cannot be undone.");
    await setFriendKind(userId, b.friend, isFriendKind(b.kind) ? b.kind : null);
  },
});

const profileOut = (p: Profile) => ({ line: p.line, interests: p.interests, builds: p.builds, href: "/settings/profile" });

export const profileAction = action({
  id: "profile",
  title: "Read what people see",
  description: "Read what the person shows people they meet at events: one line, their interests, and whether they want to build something. Their name and face always show; nothing else shows until they write it.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => profileOut(await profileOf(userId)),
});

export const setProfileAction = action({
  id: "set_profile",
  title: "Change what people see",
  description: "Change what the person shows people they meet at events: their one line (up to 120 characters; empty clears it), their interests (up to 12, kept lower case), and whether they want to build something. Fields left out stay as they are. Only the person's own words.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    line: z.string().max(120).nullable().optional(),
    interests: z.array(z.string().max(40)).max(24).optional(),
    builds: z.boolean().optional(),
  }),
  before: async ({ userId }) => profileOf(userId),
  run: async ({ userId }, input) => {
    const now = await profileOf(userId);
    const next = await saveProfile(userId, {
      line: input.line === undefined ? now.line : input.line,
      interests: input.interests === undefined ? now.interests : cleanInterests(input.interests),
      builds: input.builds ?? now.builds,
    });
    return profileOut(next);
  },
  change: (r, _i, before) => ({ before, after: { line: r.line, interests: r.interests, builds: r.builds } }),
  undo: async ({ userId }, c) => {
    const b = c.before as Partial<Profile> | null;
    if (!b || typeof b !== "object") throw new Error("This change cannot be undone.");
    await saveProfile(userId, { line: typeof b.line === "string" ? b.line : null, interests: Array.isArray(b.interests) ? b.interests : [], builds: b.builds === true });
  },
});
