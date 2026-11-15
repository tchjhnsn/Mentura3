// Comments on podcast episodes (migration 0033): what people say to each other about an episode. Shared by everyone
// who opens the episode; only the author can take a comment down, and a taken-down comment that has replies stays as
// a gap so the replies keep their place.
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";

export type EpisodeComment = { id: string; parentId: string | null; name: string; image: string | null; body: string; at: number | null; createdAt: string; mine: boolean; removed: boolean };

const isFeed = (f: string) => /^https?:\/\/\S{3,1990}$/.test(f);
const isKey = (k: string) => /^[\w.:-]{1,300}$/.test(k);

/** The comments on an episode, oldest first, with each author's name. Empty before migration 0033 runs. */
export async function commentsOn(userId: string, feed: string, episode: string): Promise<EpisodeComment[]> {
  if (!isFeed(feed) || !isKey(episode)) return [];
  try {
    const r = await db().query<{ id: string; parent_id: string | null; user_id: string; name: string | null; image: string | null; body: string; at: number | null; created_at: Date; removed: boolean }>(
      `SELECT c.id, c.parent_id, c.user_id, u.name, u.image, c.body, c.at, c.created_at, (r.comment_id IS NOT NULL) AS removed
         FROM episode_comment c JOIN "user" u ON u.id = c.user_id LEFT JOIN episode_comment_removed r ON r.comment_id = c.id
        WHERE c.feed = $1 AND c.episode = $2 ORDER BY c.created_at, c.id LIMIT 2000`,
      [feed, episode],
    );
    const rows = r.rows.map((x) => ({ id: x.id, parentId: x.parent_id, name: x.name?.trim() || "Someone", image: x.image, body: x.removed ? "" : x.body, at: x.at, createdAt: x.created_at.toISOString(), mine: x.user_id === userId, removed: x.removed }));
    // A taken-down comment stays only while it has replies that are still up.
    const answered = new Set(rows.filter((x) => !x.removed && x.parentId).map((x) => x.parentId));
    return rows.filter((x) => !x.removed || answered.has(x.id));
  } catch {
    return [];
  }
}

/** Says something about an episode, or answers a comment on it. Returns the new comment's id. */
export async function addComment(userId: string, c: { feed: string; episode: string; body: string; parentId?: string | null; at?: number | null }): Promise<string> {
  const body = c.body.replace(/\r\n/g, "\n").trim().slice(0, 4000);
  if (!body) throw new Error("Write something first.");
  if (!isFeed(c.feed) || !isKey(c.episode)) throw new Error("No such episode.");
  const parent = c.parentId && /^[0-9a-f-]{36}$/i.test(c.parentId) ? c.parentId : null;
  if (parent) {
    const p = await db().query("SELECT 1 FROM episode_comment WHERE id = $1 AND feed = $2 AND episode = $3", [parent, c.feed, c.episode]);
    if (!p.rowCount) throw new Error("That comment is not on this episode.");
  }
  const at = typeof c.at === "number" && Number.isFinite(c.at) && c.at >= 0 && c.at <= 360000 ? Math.floor(c.at) : null;
  const id = randomUUID();
  await db().query("INSERT INTO episode_comment (id, user_id, feed, episode, parent_id, at, body) VALUES ($1, $2, $3, $4, $5, $6, $7)", [id, userId, c.feed, c.episode, parent, at, body]);
  return id;
}

/** Takes down a comment its author wrote. */
export async function removeComment(userId: string, id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("No such comment.");
  const own = await db().query("SELECT 1 FROM episode_comment WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!own.rowCount) throw new Error("Only its author can take a comment down.");
  await db().query("INSERT INTO episode_comment_removed (comment_id, user_id) VALUES ($1, $2) ON CONFLICT (comment_id) DO NOTHING", [id, userId]);
}
