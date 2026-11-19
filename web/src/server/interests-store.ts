// The person's interests from Get to know you, read from the work app's hidden kinds "interest" and "interest-areas"
// (`@reflect/core/life`; levels in `@reflect/core/interests`, things in `@reflect/core/interest-catalogue`). Writes go
// through the action registry (./actions/interests.ts) so they are in the change log.
import { COMMITMENT, DEPTH, MODES, SKILL, SOURCES, isStep, sentence, type Interest, type Mode } from "@reflect/core/interests";
import { AREAS, itemOf, related, type AreaId, type CatalogItem } from "@reflect/core/interest-catalogue";
import { bodyOf } from "@reflect/core/life-body";
import { lifeRecords, type LifeRecord } from "./life-store";

export type MyInterest = Interest & { id: string; area: AreaId | null; modes: Mode[]; item: CatalogItem | null; createdAt: string };
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
    make, do: doSide, know, source: isStep(SOURCES, b.source) ? b.source : "told",
  };
}

/** Every interest the person keeps (not let go), oldest first. */
export async function myInterests(userId: string): Promise<MyInterest[]> {
  // An area taken out of the picker (music, 2026-11-19) drops its picks from view; the records stay.
  const rs = (await lifeRecords(userId, "work")).filter((r) => r.kind === "interest" && r.state !== "let-go" && !(r.body.area && !AREAS.some((a) => a.id === r.body.area)));
  return rs.map(interestOf);
}

/** The person's kept interest for one catalogue id or ref, or null. */
export async function myInterest(userId: string, ref: string): Promise<MyInterest | null> {
  return (await myInterests(userId)).find((i) => i.ref === ref) ?? null;
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
  make: i.make, do: i.do, know: i.know, href: `/me/interests/${i.ref}`,
});

/**
 * One part of what Reflect knows the person loves, by path: '' (all, with Get to know you progress), a mode
 * ('make', 'do', 'know'), an area ('books', 'podcasts'), or one interest by its ref (with the people behind it and
 * more like it). Null when the path names nothing.
 */
export async function interestsPart(userId: string, path: string) {
  const p = path.replace(/^\/+|\/+$/g, "");
  const [mine, areas] = await Promise.all([myInterests(userId), myAreas(userId)]);
  if (!p) return { count: mine.length, interests: mine.map(brief), areas: { offered: AREAS.map((a) => a.id), ...areas } };
  if ((MODE_IDS as string[]).includes(p)) return { mode: p, interests: mine.filter((i) => i.modes.includes(p as Mode)).map(brief) };
  if (AREAS.some((a) => a.id === p)) return { area: p, interests: mine.filter((i) => i.area === p).map(brief) };
  const one = mine.find((i) => i.ref === p);
  const item = one?.item ?? itemOf(p) ?? null;
  if (!one && !item) return null;
  return {
    interest: one ? brief(one) : null,
    thing: item ? { title: item.title, by: item.by, year: item.year ?? null, tags: item.tags, link: item.link, people: item.people.map((x) => ({ name: x.name, line: x.line, page: x.page })) } : null,
    more_like_it: item ? related(item.id, 6).map((r) => ({ ref: r.id, title: r.title, by: r.by })) : [],
  };
}
