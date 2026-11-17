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

/**
 * The core estate planning documents, in the order the standard checklists put them (American Bar Association, "Estate
 * Planning"; Nolo, "Estate Planning Basics"): a will, guardians for minor children (named in the will), a durable power
 * of attorney for finances, an advance health care directive (living will and health care proxy), beneficiary
 * designations on accounts and policies, and life insurance. `id` is the Plan kind's choice in `./life`.
 */
export const LEGACY_DOCS = [
  { id: "will", label: "Will", what: "Last will and testament: who receives what, and who is executor" },
  { id: "guardians-for-children", label: "Guardians for children", what: "Who raises your children under 18, named in your will" },
  { id: "power-of-attorney", label: "Power of attorney", what: "Durable power of attorney: who acts for you if you cannot" },
  { id: "end-of-life-wishes", label: "End-of-life wishes", what: "Advance directive: living will and health care proxy" },
  { id: "beneficiaries", label: "Beneficiaries", what: "Beneficiary designations on retirement accounts and policies" },
  { id: "life-insurance", label: "Life insurance", what: "A policy that provides for those who depend on you" },
] as const;
export type LegacyDocId = (typeof LEGACY_DOCS)[number]["id"];

/** A life event the standard checklists say to review a plan after: a child born. Dated by day, or by year only. */
export type LifeEvent = { what: string; day?: string; year?: number };
type Member = { name: string; relation: string; born?: number };
const CHILD = /\b(son|daughter|child|stepson|stepdaughter)\b/i;

/**
 * The children the person has stated, from Kin (a relation such as "Son", with the day born) and the household
 * (a son or daughter or a foster child, with the year born): how many are under 18, and each birth as a life event.
 * Nothing is guessed: a child with no birth day or year is counted as under 18 only when the household marks them a dependent.
 */
export function childrenOf(kin: readonly Rec[], members: readonly (Member & { dependent?: boolean })[], today: string): { minors: number; events: LifeEvent[] } {
  const year = Number(today.slice(0, 4));
  const fromKin = kin.filter((r) => r.kind === "relative" && r.state !== "died" && CHILD.test(str(r.body.relation) ?? "")).map((r) => ({ name: str(r.body.name) ?? "A child", born: str(r.body.born) }));
  const names = new Set(fromKin.map((k) => k.name.toLowerCase()));
  const fromHome = members.filter((m) => (m.relation === "child" || m.relation === "foster") && !names.has(m.name.toLowerCase()));
  const minors = fromKin.filter((k) => k.born && daysBetween(k.born, today) < 18 * 365.25).length + fromHome.filter((m) => (m.born ? year - m.born < 18 : m.dependent === true)).length;
  const events: LifeEvent[] = [
    ...fromKin.filter((k) => k.born).map((k) => ({ what: `${k.name} was born`, day: k.born! })),
    ...fromHome.filter((m) => m.born).map((m) => ({ what: `${m.name} was born`, year: m.born! })),
  ];
  return { minors, events };
}

/**
 * Legacy's workspace (estate planning): each core document, in place when a Plan for it is Planned or Kept current;
 * who is named and where it is kept; and review due when it was last reviewed over a year ago or a life event came
 * after the last review (a document with no review date is never called due: nothing is guessed). Guardians count
 * among the core documents only when the person has a child under 18 or has kept a plan for them. Then the other
 * plans, the vaults, the bucket list and letters (who they are to, never their words).
 */
export function legacySpace(records: readonly Rec[], acts: readonly ActFacts[], today: string, life: { minors: number; events: readonly LifeEvent[] } = { minors: 0, events: [] }) {
  const plans = records.filter((r) => r.kind === "plan").map((r) => {
    const set = str(r.body.reviewed);
    const act = lastOf(acts, r.id, ["reviewed"]);
    const reviewed = [set, act].filter((d): d is string => d !== null).sort().at(-1) ?? null;
    const inPlace = r.state === "planned" || r.state === "current";
    const event = reviewed ? life.events.filter((e) => (e.day ? e.day > reviewed : e.year !== undefined && e.year > Number(reviewed.slice(0, 4)))).sort((a, b) => (b.day ?? `${b.year}`).localeCompare(a.day ?? `${a.year}`))[0] ?? null : null;
    const old = reviewed !== null && daysBetween(reviewed, today) > 365;
    const review = inPlace && (old || event !== null) ? (event ? `${event.what} since it was reviewed` : "Last reviewed over a year ago") : null;
    return { id: r.id, name: str(r.body.name), state: r.state, inPlace, who: str(r.body.who), where: str(r.body.where), reviewed, review };
  });
  const best = (id: string) => plans.filter((p) => p.name === id).sort((a, b) => Number(b.inPlace) - Number(a.inPlace) || (b.reviewed ?? "").localeCompare(a.reviewed ?? ""))[0] ?? null;
  const docs = LEGACY_DOCS.map((d) => {
    const p = best(d.id);
    const status: "in-place" | "not-yet" | "review" = !p?.inPlace ? "not-yet" : p.review ? "review" : "in-place";
    return { ...d, record: p?.id ?? null, status, who: p?.who ?? null, where: p?.where ?? null, reviewed: p?.reviewed ?? null, review: p?.review ?? null, core: d.id !== "guardians-for-children" || life.minors > 0 || p !== null };
  });
  const core = docs.filter((d) => d.core);
  const vault = records.find((r) => r.kind === "vault");
  const wishes = records.filter((r) => r.kind === "wish").map((r) => ({ id: r.id, what: str(r.body.what) ?? "A wish", state: r.state }));
  return {
    docs, done: core.filter((d) => d.status !== "not-yet").length, of: core.length,
    /** The first core document not in place, in the checklist's order. */
    next: core.find((d) => d.status === "not-yet") ?? null,
    /** The first core document in place whose review is due. */
    due: core.find((d) => d.status === "review") ?? null,
    /** Plans for something else ("Other"), or kept with no document named. */
    others: plans.filter((p) => !LEGACY_DOCS.some((d) => d.id === p.name)).map(({ id, state, who, where, inPlace }) => ({ id, state, who, where, inPlace })),
    vault: vault ? { id: vault.id, to: str(vault.body.to) } : null,
    wishes: { open: wishes.filter((w) => w.state !== "done"), done: wishes.filter((w) => w.state === "done").length },
    letters: records.filter((r) => r.kind === "letter").map((r) => ({ id: r.id, to: str(r.body.to) ?? "Someone" })),
    kept: records.some((r) => r.kind === "plan"),
  };
}
