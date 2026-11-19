// The person's interests from Get to know you, read from the work app's hidden kinds "interest" and "interest-areas"
// (`@reflect/core/life`; levels in `@reflect/core/interests`, things in `@reflect/core/interest-catalogue`). Writes go
// through the action registry (./actions/interests.ts) so they are in the change log.
import { COMMITMENT, DEPTH, MODES, SKILL, SOURCES, isStep, type Interest, type Mode } from "@reflect/core/interests";
import { AREAS, itemOf, type AreaId, type CatalogItem } from "@reflect/core/interest-catalogue";
import { lifeRecords, type LifeRecord } from "./life-store";

export type MyInterest = Interest & { id: string; area: AreaId | null; modes: Mode[]; item: CatalogItem | null; createdAt: string };
const list = (v: unknown) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/** One record as an Interest: modes from the record, each side's levels only when they are known steps. */
export function interestOf(r: LifeRecord): MyInterest {
  const b = r.body, ref = String(b.ref ?? ""), item = itemOf(ref) ?? null;
  const modes = list(b.modes).filter((m): m is Mode => isStep(MODES, m));
  const c = (k: string) => (isStep(COMMITMENT, b[k]) ? b[k] : undefined);
  const make = modes.includes("make") ? { commitment: c("make_commitment"), skill: isStep(SKILL, b.make_skill) ? b.make_skill : undefined } : undefined;
  const doSide = modes.includes("do") ? { commitment: c("do_commitment"), skill: isStep(SKILL, b.do_skill) ? b.do_skill : undefined } : undefined;
  const know = modes.includes("know") ? { commitment: c("know_commitment"), depth: isStep(DEPTH, b.know_depth) ? b.know_depth : undefined } : undefined;
  const area = AREAS.find((a) => a.id === b.area)?.id ?? item?.area ?? null;
  return {
    id: r.id, ref, title: String(b.title ?? item?.title ?? ref), area, modes, item, createdAt: r.createdAt,
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
  return { done: areaIds(r?.body.done), skipped: areaIds(r?.body.skipped), sorted: r?.body.sorted === "yes", later: r?.body.later ? String(r.body.later) : null };
}
