// The life stages as the framework's lifecycle (docs/design/REFLECT_FRAMEWORK_2026-11-19.md, step 5), the way
// Naive has venture phases with exit criteria and a need-now engine. The stages are the states of the Ventures of
// a Lifetime statechart (`REGIONS` in ./lifetime.ts), one region at a time, in the order the statechart lists them.
// Each stage brings forward the life apps and record kinds that matter in it, and carries gates toward it.
//
// Gates are soft for the most part (docs/design/REFLECT_DOMAIN_2026-11-12.md, "Life stages", decided 2026-11-12):
// a soft gate is a suggestion computed from the person's records, shown as evidence and never declared met. Only
// the person says a stage is done, by keeping a passage. A gate is hard only where another person's consent is
// needed, such as a joint vault, which opens only when both partners join.
//
// Background, cited and not used as terms: Aristotle describes the ages of life and the concerns of each in
// Rhetoric II.12-14 (youth, the prime of life, old age). He defines change as the actuality of what is potential,
// as such (Physics III.1, 201a10-11). Read that way, a soft gate shows what the records make possible, and only
// the person's passage makes a stage actual. Pure: no I/O.
import type { ActFacts, Body, LifeAppId } from "./life.ts";
import { appOf, everyDays, incomeSummary, kindOf } from "./life.ts";
import { lifeState, NEEDS, REGIONS, type Need, type NeedState, type Passage, type Region } from "./lifetime.ts";

/** One record the person keeps in a life app, as needNow reads it. */
export type LifeRecordFacts = { id: string; app: LifeAppId; kind: string; state: string | null; body: Body };
/** How one need of self-preservation is met (needs/<need>.md in a vault). */
export type NeedFacts = { need: Need; state: NeedState; runway?: string; keptAt?: string };
/** Everything needNow reads: the person's records, acts, needs and passages, and today's date (YYYY-MM-DD). */
export type LifeRecords = { today: string; records: readonly LifeRecordFacts[]; acts: readonly ActFacts[]; needs: readonly NeedFacts[]; passages: readonly Passage[] };
/** Where the person is in each region: the latest passage in it (`lifeState` in ./lifetime.ts). */
export type StageState = ReturnType<typeof lifeState>;

/** What a soft gate finds in the records: whether they show it, and the records that say so. */
export type GateEvidence = { shown: boolean; because: string };
export type SoftGate = { kind: "soft"; id: string; text: string; test: (r: LifeRecords) => GateEvidence };
/** A hard gate: something the stage opens that waits on another person's consent. No other hard gate is allowed. */
export type ConsentGate = { kind: "consent"; id: string; text: string; of: string; opens: string };
export type Gate = SoftGate | ConsentGate;
export type KindRef = { app: LifeAppId; kind: string };
export type Stage = { region: Region; state: string; label: string; intro: string; apps: readonly LifeAppId[]; kinds: readonly KindRef[]; gates: readonly Gate[] };

const of = (r: LifeRecords, app: LifeAppId, kind: string) => r.records.filter((x) => x.app === app && x.kind === kind);
const title = (x: LifeRecordFacts) => {
  const k = kindOf(x.app, x.kind);
  const v = k ? x.body[k.title] : undefined;
  return v === undefined || v === "" ? x.kind : String(v);
};
const names = (xs: readonly LifeRecordFacts[]) => xs.map(title).join(", ");
const ref = (app: LifeAppId, kind: string): KindRef => ({ app, kind });
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

function stage(region: Region, state: string, label: string, intro: string, kinds: KindRef[], gates: Gate[]): Stage {
  return { region, state, label, intro, apps: [...new Set(kinds.map((k) => k.app))], kinds, gates };
}

function incomeGate(r: LifeRecords): GateEvidence {
  const s = incomeSummary(r.records.filter((x) => x.app === "work"));
  if (s.need === null) return { shown: false, because: "no intended household with what it needs a year" };
  return { shown: (s.share ?? 0) >= 100, because: `income coming in is $${s.year.toLocaleString("en-US")} a year, ${s.share}% of the $${s.need.toLocaleString("en-US")} your intended household needs` };
}

function anyIn(app: LifeAppId, kind: string, states: readonly string[] | null, what: string): (r: LifeRecords) => GateEvidence {
  return (r) => {
    const xs = of(r, app, kind).filter((x) => states === null || (x.state !== null && states.includes(x.state)));
    return xs.length ? { shown: true, because: `${what}: ${names(xs)}` } : { shown: false, because: `no ${what} in your records` };
  };
}

/**
 * The lifecycle: every state of the statechart, region by region, in the statechart's order. A region's states are
 * an order, not a ladder: every app stays open in every stage, earlier stages never close, and a passage can go
 * back (a bond that ends returns to seeking).
 */
export const LIFECYCLE: readonly Stage[] = [
  stage("provide", "learning", "Learning", "Learning what work will ask of you: the credentials it needs and the work you imagine.",
    [ref("work", "credential"), ref("work", "imagined")],
    [{ kind: "soft", id: "work-imagined", text: "work you imagine or a credential it needs is stated", test: (r) => {
      const xs = [...of(r, "work", "imagined"), ...of(r, "work", "credential")];
      return xs.length ? { shown: true, because: `stated: ${names(xs)}` } : { shown: false, because: "no imagined work or credential in your records" };
    } }]),
  stage("provide", "working", "Working", "Working and providing: your work, your income, and the household it is measured against.",
    [ref("work", "work"), ref("work", "income"), ref("work", "household")],
    [
      { kind: "soft", id: "work-kept", text: "work is sought or under way", test: anyIn("work", "work", ["seeking", "working"], "work sought or under way") },
      { kind: "soft", id: "income-coming-in", text: "income is coming in", test: anyIn("work", "income", ["coming-in"], "income coming in") },
    ]),
  stage("belonging", "affiliating", "Affiliating", "Making friends and joining groups.",
    [ref("friends", "friend"), ref("friends", "group")],
    [
      { kind: "soft", id: "friend-kept", text: "a friend is kept", test: anyIn("friends", "friend", ["friend", "close"], "friends") },
      { kind: "consent", id: "group-admits", text: "A group or village admits its members. Reflect keeps the membership you state; it cannot admit you.", of: "the group", opens: "membership" },
    ]),
  stage("belonging", "gaining-status", "Gaining status", "Standing among others: offices and roles you are trusted with, and civic life.",
    [ref("polis", "standing"), ref("polis", "civic"), ref("polis", "election"), ref("polis", "duty")],
    [
      { kind: "soft", id: "group-member", text: "you are a member of a group", test: anyIn("friends", "group", ["member", "serving", "leading"], "groups you belong to") },
      { kind: "soft", id: "civic-stated", text: "where you are a citizen is stated", test: anyIn("polis", "civic", null, "civic record") },
    ]),
  stage("line", "seeking-a-mate", "Seeking a mate", "Seeking a mate, with the household you intend already stated.",
    [ref("mate", "seeking"), ref("mate", "date"), ref("work", "household")],
    [
      { kind: "soft", id: "household-stated", text: "your intended household is stated", test: anyIn("work", "household", null, "intended household") },
      { kind: "soft", id: "income-covers", text: "your income covers what your intended household needs", test: incomeGate },
      { kind: "soft", id: "needs-stated", text: "every need says how it is met", test: (r) => {
        const missing = NEEDS.filter((n) => !r.needs.some((x) => x.need === n));
        return missing.length ? { shown: false, because: `not stated: ${missing.join(", ")}` } : { shown: true, because: `all ${NEEDS.length} needs say how they are met` };
      } },
    ]),
  stage("line", "pair-bond", "Pair bond", "A pair bond, and planning the household together.",
    [ref("mate", "seeking"), ref("work", "household"), ref("legacy", "plan")],
    [
      { kind: "soft", id: "seeking-pair-bond", text: "what you are looking for says you are in a pair bond", test: anyIn("mate", "seeking", ["pair-bond"], "a pair bond") },
      { kind: "consent", id: "joint-vault", text: "A joint vault opens only when both partners join.", of: "your partner", opens: "a joint vault" },
    ]),
  stage("line", "raising-children", "Raising children", "Raising children: income's target becomes the intended household.",
    [ref("work", "household"), ref("legacy", "plan")],
    [
      { kind: "soft", id: "household-children", text: "your intended household names children", test: (r) => {
        const h = of(r, "work", "household")[0];
        const n = h && typeof h.body.children === "number" ? h.body.children : 0;
        return n > 0 ? { shown: true, because: `your intended household names ${n} child${n === 1 ? "" : "ren"}` } : { shown: false, because: h ? "your intended household names no children" : "no intended household in your records" };
      } },
      { kind: "soft", id: "income-covers", text: "your income covers what your intended household needs", test: incomeGate },
    ]),
  stage("line", "caring-for-kin", "Caring for kin", "Caring for kin, often alongside raising children.",
    [ref("kin", "relative"), ref("legacy", "plan")],
    [{ kind: "soft", id: "relative-needs-help", text: "a relative needs help", test: anyIn("kin", "relative", ["some-help", "regular-care", "full-care"], "kin who need help") }]),
];

/** Problems with a lifecycle definition: every statechart state once and in order, real apps and kinds, consent-only hard gates. */
export function checkLifecycle(stages: readonly Stage[] = LIFECYCLE): string[] {
  const out: string[] = [];
  const want = (Object.keys(REGIONS) as Region[]).flatMap((region) => REGIONS[region].map((state) => `${region}.${state}`));
  const have = stages.map((s) => `${s.region}.${s.state}`);
  if (have.join(" ") !== want.join(" ")) out.push(`the stages must be the statechart's states in order: ${want.join(", ")}`);
  for (const s of stages) {
    const at = `${s.region}.${s.state}`;
    for (const k of s.kinds) if (!kindOf(k.app, k.kind)) out.push(`${at}: no kind ${k.app}/${k.kind}`);
    const apps = [...new Set(s.kinds.map((k) => k.app))];
    if (apps.join(" ") !== s.apps.join(" ")) out.push(`${at}: apps must be the apps of its kinds`);
    const ids = s.gates.map((g) => g.id);
    if (new Set(ids).size !== ids.length) out.push(`${at}: gate ids repeat`);
    for (const g of s.gates) {
      if (g.kind === "consent" && (!g.of.trim() || !g.opens.trim())) out.push(`${at}: hard gate ${g.id} must name whose consent it waits on and what it opens`);
      if (g.kind !== "consent" && g.kind !== "soft") out.push(`${at}: gate ${String((g as { id: string }).id)} is hard without consent; only consent may be a hard gate`);
    }
  }
  return out;
}

export const stageOf = (region: Region, state: string): Stage | undefined => LIFECYCLE.find((s) => s.region === region && s.state === state);

/** One thing to attend to now, and the records it is read from. */
export type NeedNowItem = { region: Region | null; stage: string | null; about: string; text: string; because: string };
export type NextStage = {
  region: Region;
  to: string;
  label: string;
  gates: readonly ({ kind: "soft"; id: string; text: string } & GateEvidence | { kind: "consent"; id: string; text: string; of: string; opens: string })[];
};
export type NeedNow = { stages: readonly { region: Region; state: string | null; since: string | null; label: string | null }[]; now: readonly NeedNowItem[]; next: readonly NextStage[] };

type Rule = (r: LifeRecords) => { text: string; because: string }[];

const lastAct = (r: LifeRecords, id: string, kinds: readonly string[]) => r.acts.filter((a) => a.record === id && kinds.includes(a.kind)).map((a) => a.day).sort().at(-1) ?? null;

/** What each kind brings to attend to, read from its records. A kind with no rule is only checked for being stated. */
const RULES: Record<string, Rule> = {
  "work/credential": (r) => of(r, "work", "credential").filter((x) => x.state === "needed" || x.state === "lapsed").map((x) => ({
    text: `${x.state === "lapsed" ? "Renew" : "Start on"} ${title(x)}${typeof x.body.for === "string" ? `, needed for ${x.body.for}` : ""}`,
    because: `the credential is marked ${x.state}`,
  })),
  "work/work": (r) => of(r, "work", "work").filter((x) => x.state === "between").map((x) => ({ text: `Between work: ${title(x)}`, because: "your work record says between work" })),
  "work/income": (r) => {
    const s = incomeSummary(r.records.filter((x) => x.app === "work"));
    const out: { text: string; because: string }[] = [];
    if (s.unknown) out.push({ text: `Give ${s.unknown} income record${s.unknown === 1 ? "" : "s"} a yearly figure`, because: "an amount, or hours when paid by the hour, is missing" });
    if (s.need !== null && (s.share ?? 0) < 100) out.push({ text: `Income covers ${s.share}% of what your intended household needs`, because: `$${s.year.toLocaleString("en-US")} a year coming in against $${s.need.toLocaleString("en-US")} needed` });
    return out;
  },
  "work/household": (r) => of(r, "work", "household").filter((x) => typeof x.body.need !== "number").map(() => ({ text: "Say what your intended household needs a year", because: "your intended household has no yearly need, so income cannot be measured against it" })),
  "friends/friend": (r) => of(r, "friends", "friend").flatMap((x) => {
    const days = everyDays(x.body.every);
    if (days === null || (x.state !== "friend" && x.state !== "close")) return [];
    const last = lastAct(r, x.id, ["saw", "called"]);
    if (last && addDays(last, days) > r.today) return [];
    return [{ text: `See or call ${title(x)}`, because: `you meant to every ${days} days; ${last ? `last on ${last}` : "no time together kept yet"}` }];
  }),
  "polis/civic": (r) => of(r, "polis", "civic").filter((x) => x.body.registered !== true).map(() => ({ text: "Register to vote, or mark that you are", because: "your civic record does not say you are registered" })),
  "polis/election": (r) => of(r, "polis", "election").filter((x) => x.state === "coming" && typeof x.body.day === "string" && x.body.day >= r.today && x.body.day <= addDays(r.today, 30)).map((x) => ({
    text: `Plan your vote in ${title(x)}`, because: `it is on ${String(x.body.day)}${typeof x.body.when === "string" ? `, and you mean to vote on ${x.body.when}` : ", and you have not said when you will vote"}`,
  })),
  "polis/duty": (r) => of(r, "polis", "duty").filter((x) => x.state === "due" && typeof x.body.due === "string" && x.body.due <= addDays(r.today, 30)).map((x) => ({
    text: `${title(x)} is due`, because: `due ${String(x.body.due)}${String(x.body.due) < r.today ? ", which has passed" : ""}`,
  })),
  "mate/date": (r) => of(r, "mate", "date").filter((x) => (x.state === "went" && !x.body.learned) || (x.state === "missed" && !x.body.how)).map((x) => ({
    text: x.state === "went" ? `Write what you learned from the date with ${title(x)}` : `Say why the date with ${title(x)} was missed`,
    because: "looking back on each date is how the next one does not repeat it",
  })),
  "kin/relative": (r) => of(r, "kin", "relative").flatMap((x) => {
    const out: { text: string; because: string }[] = [];
    const care = x.state === "some-help" || x.state === "regular-care" || x.state === "full-care";
    if (care && x.body.carer === "no-one-yet") out.push({ text: `Find who will care for ${title(x)}`, because: "your record says no one provides care yet" });
    if (care) {
      const last = lastAct(r, x.id, ["visited", "cared"]);
      if (!last || addDays(last, 30) <= r.today) out.push({ text: `Visit ${title(x)}`, because: `${title(x)} needs help, and ${last ? `the last visit or care kept was ${last}` : "no visit or care is kept yet"}` });
    }
    if (x.state !== "died" && x.body.asked !== true) out.push({ text: `Ask ${title(x)} what they would want`, because: "the record does not say you asked them rather than guessed" });
    return out;
  }),
  "legacy/plan": (r) => {
    const lastPassage = [...r.passages].map((p) => p.on).sort().at(-1) ?? null;
    return of(r, "legacy", "plan").flatMap((x) => {
      if (x.state === "unplanned") return [{ text: `Make a plan: ${title(x)}`, because: "it is marked unplanned" }];
      const reviewed = typeof x.body.reviewed === "string" ? x.body.reviewed : null;
      if (lastPassage && (!reviewed || reviewed < lastPassage)) return [{ text: `Review ${title(x)}`, because: `plans are revisited at each life event; your latest passage is ${lastPassage}${reviewed ? ` and it was last reviewed ${reviewed}` : " and it has no review date"}` }];
      return [];
    });
  },
};

const RUNWAY_DAYS: Record<string, number> = { d: 1, w: 7, m: 30.4, y: 365 };

function needItems(r: LifeRecords): NeedNowItem[] {
  const out: NeedNowItem[] = [];
  for (const n of NEEDS) {
    const x = r.needs.find((y) => y.need === n);
    if (!x) {
      out.push({ region: null, stage: null, about: `needs/${n}`, text: `Say how ${n} is met`, because: `needs/${n}.md is not kept; every need is attended to in every stage` });
      continue;
    }
    const m = x.state === "stocked" && x.runway && x.keptAt ? /^(\d+)([dwmy])$/.exec(x.runway) : null;
    if (!m || !x.keptAt) continue;
    const end = addDays(x.keptAt.slice(0, 10), Math.round(Number(m[1]) * RUNWAY_DAYS[m[2]!]!));
    if (end <= addDays(r.today, 30)) out.push({ region: null, stage: null, about: `needs/${n}`, text: end < r.today ? `Restock ${n}` : `Restock ${n} by ${end}`, because: `stocked on ${x.keptAt.slice(0, 10)} for ${x.runway}, which ${end < r.today ? "ran out" : "runs out"} on ${end}` });
  }
  return out;
}

function evaluate(s: Stage, r: LifeRecords): NextStage {
  return {
    region: s.region,
    to: s.state,
    label: s.label,
    gates: s.gates.map((g) => (g.kind === "soft" ? { kind: "soft" as const, id: g.id, text: g.text, ...g.test(r) } : { kind: "consent" as const, id: g.id, text: g.text, of: g.of, opens: g.opens })),
  };
}

/**
 * What the person's records suggest attending to now, in the stage they are in in each region, each item with the
 * records it is read from (after Naive's need-now, EE-028): the needs, in every stage; the kinds the current stages
 * bring forward that are not stated yet or that a record flags; and the next stage in each region with what the
 * records show for its gates. It suggests and explains; it never declares a stage done.
 */
export function needNow(stageState: StageState, records: LifeRecords): NeedNow {
  const regions = Object.keys(REGIONS) as Region[];
  const stages = regions.map((region) => {
    const at = stageState[region];
    const s = at ? stageOf(region, at.state) : undefined;
    return { region, state: at?.state ?? null, since: at?.since ?? null, label: s?.label ?? null };
  });
  const now: NeedNowItem[] = [...needItems(records)];
  const seen = new Set(now.map((i) => `${i.about} ${i.text}`));
  const push = (i: NeedNowItem) => {
    const key = `${i.about} ${i.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    now.push(i);
  };
  const next: NextStage[] = [];
  for (const { region, state } of stages) {
    const s = state ? stageOf(region, state) : undefined;
    if (!s) {
      push({ region, stage: null, about: `life/${region}`, text: `Keep a passage in ${region} when one has happened`, because: "life/passages.jsonl has none in this region" });
      const first = stageOf(region, REGIONS[region][0]);
      if (first) next.push(evaluate(first, records));
      continue;
    }
    for (const k of s.kinds) {
      const kind = kindOf(k.app, k.kind)!;
      const about = `${k.app}/${k.kind}`;
      if (!of(records, k.app, k.kind).length) push({ region, stage: s.state, about, text: `Nothing kept yet for ${kind.plural} in ${appOf(k.app).label}`, because: `${s.label} brings this kind of record forward` });
      for (const i of RULES[about]?.(records) ?? []) push({ region, stage: s.state, about, ...i });
    }
    const after = REGIONS[region][(REGIONS[region] as readonly string[]).indexOf(s.state) + 1];
    const n = after ? stageOf(region, after) : undefined;
    if (n) next.push(evaluate(n, records));
  }
  return { stages, now, next };
}

/**
 * How needs are met, read from the life app records the web app keeps: Home's food, water, shelter, transport and
 * safety each say how they are met. Health, income and knowledge have no such field there, so they are left out.
 */
export function needsFromLife(records: readonly LifeRecordFacts[]): NeedFacts[] {
  const out: NeedFacts[] = [];
  for (const n of NEEDS) {
    const x = records.find((y) => y.app === "home" && y.kind === n);
    const how = x?.body.how;
    if (typeof how === "string" && ["self-provided", "stocked", "supplied", "cared-for"].includes(how)) out.push({ need: n, state: how as NeedState });
  }
  return out;
}
