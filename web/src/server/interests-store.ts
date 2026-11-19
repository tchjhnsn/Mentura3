// The person's interests, read from the work app's hidden kinds "interest" and "interest-areas" (Get to know you) and
// "craft" (Scholē's crafts, read as Make interests by `@reflect/core/craft-interests`; the craft records are not
// copied or changed). Levels in `@reflect/core/interests`, things in `@reflect/core/interest-catalogue`. Writes go
// through the action registry (./actions/interests.ts, ./actions/crafts.ts) so they are in the change log.
import { COMMITMENT, DEPTH, MODES, SKILL, SOURCES, isStep, sentence, type Interest, type Mode } from "@reflect/core/interests";
import { AREAS, itemOf, related, type AreaId, type CatalogItem } from "@reflect/core/interest-catalogue";
import { bodyOf } from "@reflect/core/life-body";
import { craftAsInterest, type CraftDetails } from "@reflect/core/craft-interests";
import { craftOf, firstProjectOf, groupOf, related as relatedCrafts } from "@reflect/core/crafts";
import { lifeActs, lifeRecords, type LifeAct, type LifeRecord } from "./life-store";
import { craftOfRecord, isKeptCraft } from "./crafts-store";

/** One interest as Reflect reads it. `craft` is set when a Scholē craft record stands behind it (a Make interest). */
export type MyInterest = Interest & { id: string; area: AreaId | null; modes: Mode[]; item: CatalogItem | null; createdAt: string; craft: CraftDetails | null };
const list = (v: unknown) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/** One record as an Interest: modes from the record, each side's levels only when they are known steps. */
export function interestOf(r: LifeRecord): MyInterest {
  const b = bodyOf("interest", r.body), ref = b.ref ?? "", item = itemOf(ref) ?? null;
  const modes = list(b.modes).filter((m): m is Mode => isStep(MODES, m));
  const c = (v: string | undefined) => (isStep(COMMITMENT, v) ? v : undefined);
  const make = modes.includes("make") ? { commitment: c(b.make_commitment), skill: isStep(SKILL, b.make_skill) ? b.make_skill : undefined } : undefined;
  const doSide = modes.includes("do") ? { commitment: c(b.do_commitment), skill: isStep(SKILL, b.do_skill) ? b.do_skill : undefined } : undefined;
  const know = modes.includes("know") ? { commitment: c(b.know_commitment), depth: isStep(DEPTH, b.know_depth) ? b.know_depth : undefined } : undefined;
  const area = AREAS.find((a) => a.id === b.area)?.id ?? item?.area ?? null;
  return {
    id: r.id, ref, title: b.title ?? item?.title ?? ref, area, modes, item, createdAt: r.createdAt,
    make, do: doSide, know, source: isStep(SOURCES, b.source) ? b.source : "told", craft: null,
  };
}

/** One kept craft record, with its acts, as a Make interest: ref `craft:<id>`, levels from its state and stage. */
export function interestOfCraft(r: LifeRecord, acts: readonly LifeAct[] = []): MyInterest {
  const c = craftOfRecord(r);
  const i = craftAsInterest({ ref: c.ref, title: c.title, state: c.state, body: r.body }, acts.filter((a) => a.record === r.id));
  return { ...i, id: r.id, area: null, modes: ["make"], item: null, createdAt: r.createdAt };
}

/**
 * Every interest the person keeps (not let go), oldest first: the interest records and, unless `crafts` is false,
 * each kept craft as a Make interest. Get to know you's Sort and dashboard card pass `crafts: false`, since they
 * count and sort only Get to know you picks and `set_interest` writes only interest records. When an interest record
 * already names a craft (`craft:<id>`), that one record stands and the craft's details ride on it.
 */
export async function myInterests(userId: string, { crafts = true }: { crafts?: boolean } = {}): Promise<MyInterest[]> {
  const all = await lifeRecords(userId, "work");
  // An area taken out of the picker (music, 2026-11-19) drops its picks from view; the records stay.
  const mine = all.filter((r) => r.kind === "interest" && r.state !== "let-go" && !(r.body.area && !AREAS.some((a) => a.id === r.body.area))).map(interestOf);
  if (!crafts) return mine;
  const kept = all.filter(isKeptCraft).filter((r) => craftOf(String(r.body.ref ?? "")));
  if (!kept.length) return mine;
  const acts = (await Promise.all(kept.map((r) => lifeActs(userId, r.id)))).flat();
  const byRef = new Map(mine.map((i) => [i.ref, i]));
  const out = [...mine];
  for (const r of kept) {
    const c = interestOfCraft(r, acts);
    const had = byRef.get(c.ref);
    if (had) had.craft = c.craft;
    else out.push(c);
  }
  return out.sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
}

/** The person's kept interest for one catalogue id or ref (`craft:<id>` for a craft), or null. */
export async function myInterest(userId: string, ref: string): Promise<MyInterest | null> {
  return (await myInterests(userId, { crafts: ref.startsWith("craft:") })).find((i) => i.ref === ref) ?? null;
}

export type MyAreas = { done: AreaId[]; skipped: AreaId[]; sorted: boolean; later: string | null };
const areaIds = (v: unknown) => list(v).filter((x): x is AreaId => AREAS.some((a) => a.id === x));

/** Which Get to know you areas the person finished or skipped, whether they sorted, and until when the card waits. */
export async function myAreas(userId: string): Promise<MyAreas> {
  const r = (await lifeRecords(userId, "work")).find((x) => x.kind === "interest-areas");
  const b = bodyOf("interest-areas", r?.body);
  return { done: areaIds(b.done), skipped: areaIds(b.skipped), sorted: b.sorted === "yes", later: b.later || null };
}

const MODE_IDS = MODES.map((m) => m.id);
/** One interest as chat, MCP and /api/interests read it: the thing, how the person holds it in plain words, and its levels. */
const brief = (i: MyInterest) => ({
  ref: i.ref, title: i.title, area: i.area, modes: i.modes, source: i.source,
  says: i.modes.map((m) => sentence(i, m)).filter((s): s is string => !!s),
  make: i.make, do: i.do, know: i.know, href: i.craft?.href ?? `/me/interests/${i.ref}`,
  ...(i.craft ? { craft: i.craft } : {}),
});

/** A Scholē craft as the one-thing part reads it: its group, first project and the crafts most like it. */
function craftThing(ref: string) {
  const c = craftOf(ref.replace(/^craft:/, ""));
  if (!c) return null;
  const p = firstProjectOf(c.id);
  return {
    thing: { title: c.label, group: groupOf(c.group)?.label ?? null, first_project: p ? { name: p.name, minutes: p.minutes, href: `/schole/crafts/${c.id}/project` } : null, href: `/schole/crafts/${c.id}` },
    more_like_it: relatedCrafts(c.id).map((id) => ({ ref: `craft:${id}`, title: craftOf(id)?.label ?? id })),
  };
}

/**
 * One part of what Reflect knows the person loves, by path: '' (all, with Get to know you progress), a mode
 * ('make', 'do', 'know'), an area ('books', 'podcasts'), or one interest by its ref (with the people behind it and
 * more like it; `craft:<id>` for a Scholē craft, with its first project and related crafts). Kept crafts are read as
 * Make interests. Null when the path names nothing.
 */
export async function interestsPart(userId: string, path: string) {
  const p = path.replace(/^\/+|\/+$/g, "");
  const [mine, areas] = await Promise.all([myInterests(userId), myAreas(userId)]);
  if (!p) return { count: mine.length, interests: mine.map(brief), areas: { offered: AREAS.map((a) => a.id), ...areas } };
  if ((MODE_IDS as string[]).includes(p)) return { mode: p, interests: mine.filter((i) => i.modes.includes(p as Mode)).map(brief) };
  if (AREAS.some((a) => a.id === p)) return { area: p, interests: mine.filter((i) => i.area === p).map(brief) };
  const one = mine.find((i) => i.ref === p);
  if (p.startsWith("craft:")) {
    const c = craftThing(p);
    if (!one && !c) return null;
    return { interest: one ? brief(one) : null, thing: c?.thing ?? null, more_like_it: c?.more_like_it ?? [] };
  }
  const item = one?.item ?? itemOf(p) ?? null;
  if (!one && !item) return null;
  return {
    interest: one ? brief(one) : null,
    thing: item ? { title: item.title, by: item.by, year: item.year ?? null, tags: item.tags, link: item.link, people: item.people.map((x) => ({ name: x.name, line: x.line, page: x.page })) } : null,
    more_like_it: item ? related(item.id, 6).map((r) => ({ ref: r.id, title: r.title, by: r.by })) : [],
  };
}
