// Favorite episodes (migration 0032). Each change is a new row; the latest for an episode counts.
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";

const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/** Marks an episode of a show the person keeps as a favorite, or takes the mark off. */
export async function setFavorite(userId: string, itemId: string, unit: string, favorite: boolean): Promise<void> {
  const u = unit.trim().slice(0, 300);
  if (!isId(itemId) || !u) throw new Error("no such episode");
  const own = (await db().query("SELECT 1 FROM learn_item WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [itemId, userId])).rowCount;
  if (!own) throw new Error("That show is not on your shelves.");
  await db().query("INSERT INTO learn_episode_favorite (id, user_id, item_id, unit, favorite) VALUES ($1, $2, $3, $4, $5)", [randomUUID(), userId, itemId, u, favorite]);
}

/** The episodes of a show the person has marked as favorites now. Empty before migration 0032 runs. */
export async function favoritesOf(userId: string, itemId: string): Promise<Set<string>> {
  if (!isId(itemId)) return new Set();
  try {
    const r = await db().query<{ unit: string; favorite: boolean }>(
      "SELECT DISTINCT ON (unit) unit, favorite FROM learn_episode_favorite WHERE user_id = $1 AND item_id = $2 ORDER BY unit, created_at DESC, id DESC",
      [userId, itemId],
    );
    return new Set(r.rows.filter((x) => x.favorite).map((x) => x.unit));
  } catch {
    return new Set();
  }
}
