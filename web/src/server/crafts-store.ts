// The person's crafts and their Discover crafts answers, read from the work app's hidden kinds "craft" and
// "craft-likes" (`@reflect/core/life`, catalogue in `@reflect/core/crafts`). Writes go through the action registry
// (./actions/crafts.ts) so they are in the change log.
import { answersFrom, craftOf, type Answer, type Craft } from "@reflect/core/crafts";
import { lifeRecords, type LifeRecord } from "./life-store";

export type MyCraft = { record: LifeRecord; craft: Craft | null; ref: string; title: string; state: string | null };

/** Every craft the person keeps (not let go), oldest first. */
export async function myCrafts(userId: string): Promise<MyCraft[]> {
  const rs = (await lifeRecords(userId, "work")).filter((r) => r.kind === "craft" && r.state !== "let-go");
  return rs.map((record) => {
    const ref = String(record.body.ref ?? "");
    const craft = craftOf(ref) ?? null;
    return { record, craft, ref, title: String(record.body.title ?? craft?.label ?? ref), state: record.state };
  });
}

/** The person's kept craft for one catalogue id, or null. */
export async function myCraft(userId: string, ref: string): Promise<MyCraft | null> {
  return (await myCrafts(userId)).find((c) => c.ref === ref) ?? null;
}

/** The person's answers to the Discover crafts activities. */
export async function myAnswers(userId: string): Promise<Record<string, Answer>> {
  const r = (await lifeRecords(userId, "work")).find((x) => x.kind === "craft-likes");
  return r ? answersFrom(r.body as { likes?: unknown; unsure?: unknown; nots?: unknown }) : {};
}
