import type { TraitId } from "@reflect/core/formation";
import { lifeActs, lifeRecords, type LifeRecord } from "./life-store";
import { getWork } from "./work-store";

// What the person wrote about each quality they keep (doc "Qualities design guide"): a hidden `quality` record per
// quality, made when they first write about it, holding the journal entries as acts.

export type QualityEntry = { id: string; title: string; day: string };

/** The record that holds what was written about a quality, if any. */
export async function qualityRecord(userId: string, trait: string): Promise<LifeRecord | null> {
  return (await lifeRecords(userId, "work").catch(() => [])).find((r) => r.kind === "quality" && r.body.ref === trait) ?? null;
}

/** How many entries were written about each quality. */
export async function entryCounts(userId: string): Promise<Map<TraitId, number>> {
  const [records, acts] = await Promise.all([lifeRecords(userId, "work").catch(() => []), lifeActs(userId).catch(() => [])]);
  const out = new Map<TraitId, number>();
  for (const r of records.filter((x) => x.kind === "quality")) out.set(String(r.body.ref) as TraitId, acts.filter((a) => a.record === r.id && a.kind === "wrote").length);
  return out;
}

/** The journal entries written about a quality, newest first. */
export async function entriesAbout(userId: string, trait: string): Promise<QualityEntry[]> {
  const r = await qualityRecord(userId, trait);
  if (!r) return [];
  const acts = (await lifeActs(userId, r.id)).filter((a) => a.kind === "wrote" && a.note);
  const out: QualityEntry[] = [];
  for (const a of acts) {
    const w = await getWork(userId, a.note!);
    if (w) out.push({ id: w.id, title: w.title || w.body.replace(/^>.*\n+/, "").trim().split("\n")[0]?.replace(/^#+\s*/, "").slice(0, 120) || "Untitled", day: a.day });
  }
  return out;
}
