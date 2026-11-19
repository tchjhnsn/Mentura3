// The person's crafts and their Discover crafts answers, read from the work app's hidden kinds "craft" and
// "craft-likes" (`@reflect/core/life`, catalogue in `@reflect/core/crafts`). Writes go through the action registry
// (./actions/crafts.ts) so they are in the change log.
import { answersFrom, craftOf, type Answer, type Craft } from "@reflect/core/crafts";
import { lifeRecords, type LifeRecord } from "./life-store";

export type MyCraft = { record: LifeRecord; craft: Craft | null; ref: string; title: string; state: string | null };

/** A craft record is kept when it is not let go. */
export const isKeptCraft = (r: LifeRecord) => r.kind === "craft" && r.state !== "let-go";

/** One craft record with its catalogue entry, title and state. */
export function craftOfRecord(record: LifeRecord): MyCraft {
  const ref = String(record.body.ref ?? "");
  const craft = craftOf(ref) ?? null;
  return { record, craft, ref, title: String(record.body.title ?? craft?.label ?? ref), state: record.state };
}

/** Every craft the person keeps (not let go), oldest first. */
export async function myCrafts(userId: string): Promise<MyCraft[]> {
  return (await lifeRecords(userId, "work")).filter(isKeptCraft).map(craftOfRecord);
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

export type MyPicks = { worlds: string[]; picks: string[] };
const list = (v: unknown) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/** The worlds and crafts the person picked in the photo picker, in the order picked. */
export async function myPicks(userId: string): Promise<MyPicks> {
  const r = (await lifeRecords(userId, "work")).find((x) => x.kind === "craft-likes");
  return { worlds: list(r?.body.worlds), picks: list(r?.body.picks) };
}
