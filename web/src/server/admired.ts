import { exemplarById, type Admired, type TraitId } from "@reflect/core/formation";
import { lifeRecords, type LifeRecord } from "./life-store";

// The people the person keeps as inspirations in Work, with the traits of theirs they chose (formation.ts).

/** Each person kept, newest first, as the ranker reads them; people no longer in the catalogue are left out. */
export async function admiredOf(userId: string): Promise<(Admired & { record: LifeRecord })[]> {
  const work = await lifeRecords(userId, "work").catch(() => []);
  return work.filter((r) => r.kind === "admired").reverse().flatMap((record) => {
    const e = exemplarById(String(record.body.ref ?? ""));
    if (!e) return [];
    const traits = String(record.body.traits ?? "").split(",").filter((t): t is TraitId => e.traits.some((x) => x.trait === t));
    return [{ exemplar: e.id, traits, record }];
  });
}
