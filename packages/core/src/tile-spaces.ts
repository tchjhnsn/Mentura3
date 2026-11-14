import { EVERY, everyDays, kindOf, type ActFacts, type RecordFacts } from "./life";

/** What the tiles' workspaces read: a person's records with their ids, and their acts. */
type Rec = RecordFacts & { id: string };

const DAY = 86400_000;
const at = (d: string) => Date.parse(`${d}T00:00:00Z`);
/** Days from one day to another, whole. */
export const daysBetween = (from: string, to: string) => Math.round((at(to) - at(from)) / DAY);
const back = (today: string, days: number) => new Date(at(today) - (days - 1) * DAY).toISOString().slice(0, 10);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const stateLabel = (app: "friends" | "mate" | "kin" | "polis", r: Rec) => kindOf(app, r.kind)?.states?.find((s) => s.id === r.state)?.label ?? null;
const isActive = (app: "friends" | "mate" | "kin" | "polis", r: Rec) => Boolean(kindOf(app, r.kind)?.states?.find((s) => s.id === r.state)?.active);
const lastOf = (acts: readonly ActFacts[], id: string, kinds: readonly string[]) => acts.filter((a) => a.record === id && kinds.includes(a.kind)).map((a) => a.day).sort().at(-1) ?? null;

/** Hall's hours together (2019): about 50 to move from acquaintance to casual friend, 90 to friend, 200 to close friend. */
export const HALL = [{ hours: 50, to: "casual friend" }, { hours: 90, to: "friend" }, { hours: 200, to: "close friend" }] as const;

/**
 * Friends' workspace: friends and close friends, those past how often the person means to see them first, then
 * longest since time together (or a call), so who has gone quiet comes up; the hours of time together kept, against
 * Hall's milestones; then the rest; and the groups the person is in, with when they last went.
 */
export function friendsSpace(records: readonly Rec[], acts: readonly ActFacts[], today: string) {
  const friends = records.filter((r) => r.kind === "friend").map((r) => {
    const saw = lastOf(acts, r.id, ["saw"]);
    const called = lastOf(acts, r.id, ["called"]);
    const last = [saw, called].filter((d): d is string => d !== null).sort().at(-1) ?? null;
    const since = last ? daysBetween(last, today) : null;
    const days = everyDays(r.body.every);
    const minutes = acts.filter((a) => a.record === r.id && a.kind === "saw").reduce((s, a) => s + (a.minutes ?? 0), 0);
    const hours = Math.round((minutes / 60) * 10) / 10;
    return {
      id: r.id, name: str(r.body.name) ?? "A friend", state: stateLabel("friends", r), active: isActive("friends", r), saw, called, since,
      every: EVERY.find((o) => o.id === r.body.every)?.label ?? null, overdue: days !== null && (since === null || since > days),
      hours, next: HALL.find((m) => m.hours > hours) ?? null,
    };
  });
  const order = (a: { since: number | null; overdue: boolean }, b: { since: number | null; overdue: boolean }) => Number(b.overdue) - Number(a.overdue) || (b.since ?? Infinity) - (a.since ?? Infinity);
  const groups = records.filter((r) => r.kind === "group" && isActive("friends", r)).map((r) => ({ id: r.id, name: str(r.body.name) ?? "A group", state: stateLabel("friends", r), last: lastOf(acts, r.id, ["attended"]) }));
  return { close: friends.filter((f) => f.active).sort(order), others: friends.filter((f) => !f.active), groups };
}

/** Mate's workspace: whether the person is seeking and what they look for, dates planned (soonest first), dates gone on (latest first), and those dates counted against their must-haves and dealbreakers. */
export function mateSpace(records: readonly Rec[], today: string) {
  const s = records.find((r) => r.kind === "seeking");
  const dates = records.filter((r) => r.kind === "date").map((r) => ({ id: r.id, who: str(r.body.who) ?? "Someone", day: str(r.body.day), where: str(r.body.where), state: r.state, learned: str(r.body.learned), again: str(r.body.again), musts: str(r.body.musts), dealbreaker: r.body.dealbreaker === true }));
  const went = dates.filter((d) => d.state === "went");
  return {
    seeking: s ? { id: s.id, state: stateLabel("mate", s), must: str(s.body.must), never: str(s.body.never), household: str(s.body.household) } : null,
    planned: dates.filter((d) => d.state === "planned" && (!d.day || d.day >= today)).sort((a, b) => (a.day ?? "9").localeCompare(b.day ?? "9")),
    went: went.sort((a, b) => (b.day ?? "").localeCompare(a.day ?? "")),
    /** The dates gone on, counted by how each met the person's must-haves and whether a dealbreaker came up. */
    tally: { all: went.filter((d) => d.musts === "met-all").length, some: went.filter((d) => d.musts === "met-some").length, none: went.filter((d) => d.musts === "met-none").length, dealbreakers: went.filter((d) => d.dealbreaker).length, of: went.length },
  };
}

/**
 * Kin's workspace: kin who need care first, each with who provides it, the care given and when last visited; the
 * rest with their age; and the hours a week of care the person gave over four weeks, which is time Work cannot use.
 */
export function kinSpace(records: readonly Rec[], acts: readonly ActFacts[], today: string) {
  const four = back(today, 28);
  const care = (id: string) => acts.filter((a) => a.kind === "cared" && a.record === id && a.day >= four && a.day <= today).reduce((s, a) => s + (a.minutes ?? 0), 0);
  const kin = records.filter((r) => r.kind === "relative" && r.state !== "died").map((r) => {
    const born = str(r.body.born);
    return { id: r.id, name: str(r.body.name) ?? "Kin", relation: str(r.body.relation), state: stateLabel("kin", r), needsCare: isActive("kin", r), carer: str(r.body.carer), age: born ? Math.floor(daysBetween(born, today) / 365.25) : null, careMinutes: care(r.id), visited: lastOf(acts, r.id, ["visited"]),
      matters: str(r.body.matters), speaks: str(r.body.speaks), where: str(r.body.where), asked: r.body.asked === true };
  });
  const minutes = kin.reduce((s, k) => s + k.careMinutes, 0);
  return { care: kin.filter((k) => k.needsCare), others: kin.filter((k) => !k.needsCare), careHours: Math.round((minutes / 60 / 4) * 10) / 10 };
}

/** Polis' workspace: where the person is a citizen and whether registered; elections coming, each with the person's plan to vote, and duties due (and whether each comes back every year), soonest first; and the offices and roles they serve in. */
export function polisSpace(records: readonly Rec[], today: string) {
  const c = records.find((r) => r.kind === "civic");
  const dated = (kind: string, state: string, key: string) => records.filter((r) => r.kind === kind && r.state === state).map((r) => ({ id: r.id, name: str(r.body.name) ?? "", day: str(r.body[key]), late: Boolean(str(r.body[key]) && str(r.body[key])! < today), body: r.body })).sort((a, b) => (a.day ?? "9").localeCompare(b.day ?? "9"));
  const HOW: Record<string, string> = { "early-in-person": "Early in person", "on-election-day": "On election day", "by-mail": "By mail" };
  return {
    civic: c ? { id: c.id, state: stateLabel("polis", c), residence: str(c.body.residence), citizenship: str(c.body.citizenship), registered: c.body.registered === true } : null,
    elections: dated("election", "coming", "day").map(({ body, ...e }) => ({ ...e, plan: body.how || body.when || body.place ? { how: HOW[String(body.how)] ?? null, when: str(body.when), place: str(body.place) } : null })),
    duties: dated("duty", "due", "due").map(({ body, ...d }) => ({ ...d, yearly: body.repeats === "every-year" })),
    serving: records.filter((r) => r.kind === "standing" && r.state === "serving").map((r) => ({ id: r.id, role: str(r.body.role) ?? "A role", where: str(r.body.body) })),
  };
}
