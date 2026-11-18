// The dashboard's morning brief (Torian, 2026-11-18, dashboard item 6) and the facts behind it and the ask bar's
// suggestions. Code reads the facts from the person's own stores; a model only phrases them, citing each by id, and
// a sentence that cites nothing known is dropped (`readBrief`). One brief a person a day is kept sealed in
// dashboard_brief (migration 0053), so a reload does not ask the model again. With no model, or before 0053 runs,
// the brief is the facts themselves. No journal text and no message text is ever a fact.
import { cache } from "react";
import { generateText } from "ai";
import { budgetView } from "@reflect/core/budget";
import { briefFacts, briefLines, briefPrompt, plainBrief, readBrief, suggestionsFrom, DEFAULT_SUGGESTIONS, type BriefInput, type BriefLine, type Fact } from "@/app/dashboard/brief";
import { clockIn, eventWhen, hourIn } from "@/app/dashboard/parts";
import { db } from "@/db/pool";
import { calendarPart } from "./calendar-tools";
import { chatModel, CHAT_MODEL } from "./chat-model";
import { incomingRequests } from "./connect-store";
import { open, seal } from "./crypto";
import { nextGoing, upcomingEvents } from "./events-store";
import { learnView } from "./learn-store";
import { lifeRecords } from "./life-store";
import { threadsOf } from "./messages-store";
import { planOf } from "./plan";

const safe = <T,>(p: Promise<T>, none: T) => p.catch(() => none);
const WEEK = 7 * 86400_000;

/** What the brief and the suggestions read, once a request (React's cache), each part failing soft on its own. */
export const briefInputOf = cache(async (userId: string, today: string): Promise<BriefInput> => {
  const now = new Date();
  const [cal, requests, threads, plan, going, events, learn, ventures] = await Promise.all([
    safe(calendarPart(userId, today, today), null),
    safe(incomingRequests(userId), []),
    safe(threadsOf(userId), []),
    safe(planOf(userId), null),
    safe(nextGoing(userId), null),
    safe(upcomingEvents({ from: now, limit: 60 }), []),
    safe(learnView(userId), null),
    safe(lifeRecords(userId, "ventures"), []),
  ]);
  const v = plan ? budgetView(plan.plan, plan.budget) : null;
  const soon = (iso: string | null | undefined) => !!iso && Date.parse(iso) - now.getTime() < WEEK;
  return {
    calendar: (cal?.events ?? []).filter((e) => e.day === today).map((e) => ({ title: e.title, when: e.when, starts: e.starts ?? null, href: e.href })),
    clock: clockIn(now),
    requests: requests.map((r) => ({ name: r.from.name })),
    waiting: threads.filter((t) => t.last && !t.last.you).map((t) => ({ name: t.name, href: `/life/friends/messages/${encodeURIComponent(t.id)}` })),
    money: v ? { set: v.unset.length < v.tiles.length, leftToAllot: v.leftToAllot } : null,
    going: going?.startsAt && soon(going.startsAt) ? { title: going.title, when: eventWhen(going.startsAt), href: `/events/${going.id}` } : null,
    eventsThisWeek: events.filter((e) => soon(e.startsAt) && e.id !== going?.id).length,
    reading: (learn?.books ?? []).filter((b) => b.status === "reading").map((b) => ({ title: b.title, href: b.catalog?.work ? `/schole/works/${b.catalog.work}` : "/schole/reading" })),
    building: ventures.filter((r) => r.kind === "venture" && (r.state === "starting" || r.state === "operating")).map((r) => ({ name: String(r.body.name ?? "A venture"), href: `/life/ventures/${r.id}` })),
  };
});

/** The facts for today, once a request. */
export const factsOf = cache(async (userId: string, today: string): Promise<Fact[]> => briefFacts(await briefInputOf(userId, today)));

/** The ask bar's four suggestions from the person's state; the defaults when the facts take more than a moment. */
export async function suggestionsOf(userId: string, today: string, waitMs = 2000): Promise<string[]> {
  const late = new Promise<null>((r) => setTimeout(() => r(null), waitMs));
  const facts = await Promise.race([safe(factsOf(userId, today), null), late]);
  return facts ? suggestionsFrom(facts) : [...DEFAULT_SUGGESTIONS];
}

export type Brief = { lines: BriefLine[]; by: "model" | "plain" };

const greetingAt = (now: Date) => { const h = hourIn(now); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

async function kept(userId: string, today: string): Promise<BriefLine[] | null> {
  try {
    const r = await db().query<{ body_ct: string }>("SELECT body_ct FROM dashboard_brief WHERE user_id = $1 AND day = $2", [userId, today]);
    if (!r.rows[0]) return null;
    const lines = JSON.parse(open(userId, r.rows[0].body_ct)) as BriefLine[];
    return Array.isArray(lines) && lines.length ? lines : null;
  } catch {
    return null;
  }
}

/**
 * Today's brief: the one kept, else one a model writes now from the facts and keeps, else the facts in plain
 * sentences (not kept, so a model can write it later). `fresh` writes it again.
 */
export async function briefOf(userId: string, today: string, opts: { fresh?: boolean; now?: Date } = {}): Promise<Brief> {
  if (!opts.fresh) {
    const have = await kept(userId, today);
    if (have) return { lines: have, by: "model" };
  }
  const facts = await factsOf(userId, today);
  const plain: Brief = { lines: briefLines(plainBrief(facts), facts), by: "plain" };
  const model = chatModel();
  if (!model || !facts.length) return plain;
  try {
    const { text } = await generateText({ model, prompt: briefPrompt(facts, greetingAt(opts.now ?? new Date())), abortSignal: AbortSignal.timeout(25_000) });
    const lines = briefLines(readBrief(text, facts), facts);
    if (!lines.length) return plain;
    await db().query(
      `INSERT INTO dashboard_brief (user_id, day, body_ct, model) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, day) DO UPDATE SET body_ct = EXCLUDED.body_ct, model = EXCLUDED.model, created_at = now()`,
      [userId, today, seal(userId, JSON.stringify(lines)), process.env.REFLECT_CHAT_MODEL ?? CHAT_MODEL],
    ).catch(() => undefined);
    return { lines, by: "model" };
  } catch {
    return plain;
  }
}
