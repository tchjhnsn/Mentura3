// Check in, connect, and where you met (doc "Events and connections design guide", 2026-11-18): the rules, kept
// apart from Postgres so they can be tested. Tokens are random and only their sha256 hex is kept (event.door_token_hash,
// member_profile.personal_token_hash). Connect is mutual: one tap is a request; the other person's tap makes both
// friends (friend_link with met_event) and marks both requests accepted, in one transaction (./connect-store.ts).
import { createHash, randomBytes } from "node:crypto";
import { pairOf } from "@reflect/core/messages";
import { CONNECT_DAYS, isRunning, type EventOut } from "@reflect/core/events";

/** The sha256 hex of a token, as kept. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** A new random token and its hash. Only the hash is stored; the token is shown once, in a QR. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

/** Whether a string can be a token at all, before it is hashed and looked up. */
export const tokenShaped = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(t);

type Timed = Pick<EventOut, "startsAt" | "endsAt">;
const HOUR = 60 * 60 * 1000;
/** When an event ends: its end, or six hours after a start with no end (as isRunning reads it). */
const endOf = (e: Timed) => (e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt!) + 6 * HOUR);

/**
 * Where the Here page stands for one person: "closed" (not checked in, or outside the window, so nothing shows),
 * "open" while the event runs, and "ended" for two hours after, when only Connected tonight shows.
 */
export function hereState(e: Timed, checkedIn: boolean, now = new Date()): "closed" | "open" | "ended" {
  if (!checkedIn || !e.startsAt) return "closed";
  if (isRunning(e, now)) return "open";
  const t = now.getTime();
  const end = endOf(e);
  return t > end && t <= end + 2 * HOUR ? "ended" : "closed";
}

/** Whether a person can check in now: a published event hosted in Reflect, while it runs (doors open an hour early). */
export const canCheckIn = (e: Timed & Pick<EventOut, "source" | "status">, now = new Date()) => e.source === "reflect" && e.status === "published" && isRunning(e, now);

/** When a Connect tap made at `now` lapses. */
export const lapsesAt = (now: Date) => new Date(now.getTime() + CONNECT_DAYS * 24 * HOUR);

/** One open (unanswered, not lapsed) connect request. */
export type OpenRequest = { id: string; from: string; to: string; eventId: string | null };

/** The writes one Connect tap makes, all inside one transaction. Postgres in the app, a fake in tests. */
export interface ConnectTx {
  /** The open request from one person to another, not lapsed at `now`; lapsed ones are cleared first. */
  openRequest(from: string, to: string, now: Date): Promise<OpenRequest | null>;
  insertRequest(r: { from: string; to: string; eventId: string | null; expiresAt: Date }): Promise<OpenRequest>;
  accept(ids: string[], now: Date): Promise<void>;
  /** Makes the pair friends (user_a < user_b), keeping an existing link, and sets met_event when it has none. */
  link(a: string, b: string, metEvent: string | null): Promise<void>;
  /** Sets how one person sees the friendship, only when they have not chosen. */
  kindIfMissing(userId: string, otherId: string, kind: "utility"): Promise<void>;
}

/** What a Connect tap did: a request now waiting for the other person, or both are friends. */
export type ConnectResult = { state: "requested"; requestId: string } | { state: "connected"; requestId: string; accepted: string[] };

/**
 * One Connect tap from `from` to `to` at an event. It keeps the person's open request (or makes one); when the other
 * person already has an open request to them, both are accepted, a friend_link is made with the event they met at,
 * and each starts seeing the friendship as one of use.
 */
export async function connectWith(tx: ConnectTx, from: string, to: string, eventId: string | null, now = new Date()): Promise<ConnectResult> {
  if (from === to) throw new Error("That is you.");
  const mine = (await tx.openRequest(from, to, now)) ?? (await tx.insertRequest({ from, to, eventId, expiresAt: lapsesAt(now) }));
  const theirs = await tx.openRequest(to, from, now);
  if (!theirs) return { state: "requested", requestId: mine.id };
  const accepted = [mine.id, theirs.id];
  await tx.accept(accepted, now);
  const [a, b] = pairOf(from, to);
  await tx.link(a, b, theirs.eventId ?? mine.eventId);
  await tx.kindIfMissing(from, to, "utility");
  await tx.kindIfMissing(to, from, "utility");
  return { state: "connected", requestId: mine.id, accepted };
}

/** A person as the Here page shows them: name and face, and only what they chose to show. Never an email. */
export type HerePerson = { id: string; name: string; line: string | null; interests: string[]; builds: boolean };
