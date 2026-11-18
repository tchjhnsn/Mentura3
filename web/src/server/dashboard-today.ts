// What the dashboard shows, read once for the places beyond its page (dashboard, 2026-11-18): the glance at
// /dashboard/glance, the morning brief, `/api/dashboard` and the `dashboard_today` action. Also the household's view
// and the view of a member someone keeps. Every read fails soft: a broken store leaves its part empty.
import { budgetView } from "@reflect/core/budget";
import { cardSummary } from "@reflect/core/home-cards";
import { kindOf, titleOf } from "@reflect/core/life";
import { relationLabel, type Member } from "@reflect/core/household";
import { clockIn, dayIn } from "@/app/dashboard/parts";
import { calendarPart } from "./calendar-tools";
import { incomingRequests } from "./connect-store";
import { nextGoing, upcomingEvents } from "./events-store";
import { homeCardsToday } from "./home-cards-store";
import { householdOf } from "./household-store";
import { lifeRecords } from "./life-store";
import { threadsOf } from "./messages-store";
import { planOf } from "./plan";
import { namesMember, nextItem, type DayItem, type TodayFacts } from "./dashboard-reach";

const safe = <T,>(p: Promise<T>, none: T) => p.catch(() => none);
const dayAfter = (day: string, n = 1) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

const itemOf = (e: { id: string; day: string; title: string; when: string; starts: string | null; note?: string | null; href: string; tile_label?: string }): DayItem =>
  ({ id: e.id, day: e.day, title: e.title, when: e.when, starts: e.starts, note: e.note ?? null, href: e.href, tile_label: e.tile_label });

/** The person's calendar items from `from` for `days` days. */
async function itemsOf(userId: string, from: string, days: number): Promise<DayItem[]> {
  const cal = await safe(calendarPart(userId, from, dayAfter(from, days - 1)), null);
  return (cal?.events ?? []).map(itemOf);
}

/** Everything the dashboard shows the person now, as plain facts. */
export async function todayFacts(userId: string, now = new Date()): Promise<TodayFacts> {
  const day = dayIn(now);
  const tomorrow = dayAfter(day);
  const [items, requests, threads, planned, going, nearby, cards] = await Promise.all([
    itemsOf(userId, day, 2),
    safe(incomingRequests(userId), []),
    safe(threadsOf(userId), []),
    safe(planOf(userId), null),
    safe(nextGoing(userId), null),
    safe(upcomingEvents({ from: now, limit: 4 }), []),
    safe(homeCardsToday(userId, day), []),
  ]);
  const today = items.filter((e) => e.day === day);
  const v = planned ? budgetView(planned.plan, planned.budget) : null;
  const events = [
    ...(going?.startsAt ? [{ id: going.id, title: going.title, starts_at: going.startsAt, venue: going.venue ?? null, going: true, href: `/events/${going.id}` }] : []),
    ...nearby.filter((e) => e.id !== going?.id).slice(0, 3).map((e) => ({ id: e.id, title: e.title, starts_at: e.startsAt, venue: e.venue ?? null, going: false, href: `/events/${e.id}` })),
  ];
  return {
    day,
    next: nextItem(today, clockIn(now)),
    today,
    tomorrow: items.filter((e) => e.day === tomorrow),
    people: [
      ...requests.slice(0, 3).map((r) => ({ name: r.from.name, why: "wants to connect" as const, text: r.event ? `Met at ${r.event.title}` : "Wants to connect", href: "/life/friends" })),
      ...threads.filter((t) => t.last && !t.last.you).slice(0, 3).map((t) => ({ name: t.name, why: "wrote to you" as const, text: t.last!.text, href: `/life/friends/messages/${encodeURIComponent(t.id)}` })),
    ],
    money: { left_to_allot: v?.leftToAllot ?? 0, allotted: v?.allotted ?? 0, take_home: v?.takeHome ?? 0, href: "/plan" },
    events,
    cards: cards.map((c) => ({ id: c.id, title: c.title, tile: c.tile, summary: cardSummary(c, day) })),
  };
}

/** One of the person's records that names a member. */
export type NamedRecord = { id: string; app: string; title: string; state: string | null; href: string };

async function recordsNaming(userId: string, names: readonly string[]): Promise<Map<string, NamedRecord[]>> {
  const out = new Map<string, NamedRecord[]>(names.map((n) => [n, []]));
  const records = await safe(lifeRecords(userId), []);
  for (const r of records) {
    const k = kindOf(r.app, r.kind);
    if (!k || k.hidden) continue;
    const text = Object.values(r.body).filter((x): x is string => typeof x === "string").join(" \n ");
    for (const n of names) if (namesMember(text, n)) out.get(n)!.push({ id: r.id, app: r.app, title: titleOf(k, r.body) || k.label, state: r.state, href: `/life/${r.app}/${r.id}` });
  }
  return out;
}

const naming = (e: DayItem, name: string) => namesMember(e.title, name) || namesMember(e.note, name);

/** A member as the household view shows them: who, and what on the person's calendar and records names them. `kept`
 * when they have no login and the person may open their dashboard. */
export type MemberDoing = { id: string; name: string; relation: string; account: boolean; kept: boolean; items: DayItem[]; records: NamedRecord[] };

export type HouseholdView = {
  members: MemberDoing[];
  /** The week's items on the person's calendar that name someone in the household. */
  shared: DayItem[];
  money: TodayFacts["money"];
};

/** The household's view for one member of it, or null when they have no household with anyone else in it. */
export async function householdView(userId: string, now = new Date()): Promise<HouseholdView | null> {
  const h = await safe(householdOf(userId), null);
  const others = (h?.members ?? []).filter((m) => !m.you);
  if (!h || !others.length) return null;
  const day = dayIn(now);
  const [week, records, planned] = await Promise.all([itemsOf(userId, day, 7), recordsNaming(userId, others.map((m) => m.name)), safe(planOf(userId), null)]);
  const v = planned ? budgetView(planned.plan, planned.budget) : null;
  const members = others.map((m): MemberDoing => ({
    id: m.id, name: m.name, relation: relationLabel(m.relation), account: m.account, kept: !m.account,
    items: week.filter((e) => naming(e, m.name)), records: records.get(m.name) ?? [],
  }));
  return {
    members,
    shared: week.filter((e) => others.some((m) => naming(e, m.name))),
    money: { left_to_allot: v?.leftToAllot ?? 0, allotted: v?.allotted ?? 0, take_home: v?.takeHome ?? 0, href: "/plan" },
  };
}

/** A member without a login in the person's household (an elder, a child), whom anyone in it may look after. What
 * their dashboard shows comes from the person's own calendar and records, so it reveals nothing of anyone else's. */
export async function keptMember(userId: string, memberId: string): Promise<{ member: Member; householdId: string } | null> {
  if (!/^[0-9a-f-]{36}$/.test(memberId)) return null;
  const h = await safe(householdOf(userId), null);
  const m = h?.members.find((x) => x.id === memberId);
  return h && m && !m.you && !m.account ? { member: m, householdId: h.id } : null;
}

/** The dashboard of a member someone keeps: the next two weeks of the keeper's items and records that name them. */
export async function memberView(userId: string, memberId: string, now = new Date()) {
  const kept = await keptMember(userId, memberId);
  if (!kept) return null;
  const { member } = kept;
  const day = dayIn(now);
  const [items, records] = await Promise.all([itemsOf(userId, day, 14), recordsNaming(userId, [member.name])]);
  const mine = items.filter((e) => naming(e, member.name));
  const today = mine.filter((e) => e.day === day);
  return {
    member: { id: member.id, name: member.name, relation: relationLabel(member.relation), born: member.born ?? null, dependent: Boolean(member.dependent) },
    next: nextItem(today, clockIn(now)) ?? mine[0] ?? null,
    items: mine,
    records: records.get(member.name) ?? [],
  };
}
