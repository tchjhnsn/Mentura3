// Published transcripts of episodes a person keeps (migration 0031), kept sealed with their key so they can be
// searched together. Append-only; the latest for an episode is the one used.
import { randomUUID } from "node:crypto";
import type { Passage } from "@reflect/core/courses";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";

export type Source = "published";
export type Kept = { item: string; unit: string; source: Source; passages: Passage[]; createdAt: string };
const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/** Keeps a transcript of an episode of a show the person keeps. */
export async function keepTranscript(userId: string, itemId: string, unit: string, source: Source, passages: Passage[]): Promise<void> {
  if (!isId(itemId) || !passages.length) return;
  const own = (await db().query("SELECT 1 FROM learn_item WHERE id = $1 AND user_id = $2", [itemId, userId])).rowCount;
  if (!own) throw new Error("That show is not on your shelves.");
  await db().query("INSERT INTO learn_transcript (id, user_id, item_id, unit, source, passages_ct) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), userId, itemId, unit, source, seal(userId, JSON.stringify(passages))]);
}

/** The latest kept transcript of an episode, or null. */
export async function keptTranscript(userId: string, itemId: string, unit: string): Promise<Kept | null> {
  if (!isId(itemId)) return null;
  try {
    const r = (await db().query<{ source: Source; passages_ct: string; created_at: Date }>("SELECT source, passages_ct, created_at FROM learn_transcript WHERE user_id = $1 AND item_id = $2 AND unit = $3 ORDER BY created_at DESC, id LIMIT 1", [userId, itemId, unit])).rows[0];
    return r ? { item: itemId, unit, source: r.source, passages: JSON.parse(open(userId, r.passages_ct)) as Passage[], createdAt: r.created_at.toISOString() } : null;
  } catch {
    return null; // before migration 0031 runs
  }
}

/** Every episode transcript the person keeps, the latest of each, for search. */
export async function allTranscripts(userId: string): Promise<Kept[]> {
  try {
    const r = await db().query<{ item_id: string; unit: string; source: Source; passages_ct: string; created_at: Date }>(
      "SELECT DISTINCT ON (item_id, unit) item_id, unit, source, passages_ct, created_at FROM learn_transcript WHERE user_id = $1 ORDER BY item_id, unit, created_at DESC, id", [userId]);
    return r.rows.map((x) => ({ item: x.item_id, unit: x.unit, source: x.source, passages: JSON.parse(open(userId, x.passages_ct)) as Passage[], createdAt: x.created_at.toISOString() }));
  } catch {
    return [];
  }
}
