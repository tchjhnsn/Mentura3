// Like and Dislike (migration 0039; Torian, 2026-11-16 19:25Z, card): private to the person, used to steer Up next and
// For you, never shown as counts. Each change is a new row; the latest for a thing counts, and 'none' takes it off.
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";

export type Reaction = "like" | "dislike";
const REACTIONS = new Set(["like", "dislike", "none"]);

/** A thing's key: its link when it has one, else its medium and title. */
export const reactionKey = (t: { url?: string | null; medium: string; title: string }): string =>
  (t.url?.trim() || `${t.medium}|${t.title.trim().toLowerCase()}`).slice(0, 1200);

export async function setReaction(userId: string, key: string, reaction: Reaction | "none"): Promise<void> {
  const k = key.trim().slice(0, 1200);
  if (!k || !REACTIONS.has(reaction)) throw new Error("not a reaction");
  await db().query("INSERT INTO media_reaction (id, user_id, key, reaction) VALUES ($1, $2, $3, $4)", [randomUUID(), userId, k, reaction]);
}

/** The person's reaction to a thing now, or null. Null before migration 0039 runs. */
export async function reactionOf(userId: string, key: string): Promise<Reaction | null> {
  try {
    const r = await db().query<{ reaction: string }>("SELECT reaction FROM media_reaction WHERE user_id = $1 AND key = $2 ORDER BY created_at DESC, id DESC LIMIT 1", [userId, key]);
    const x = r.rows[0]?.reaction;
    return x === "like" || x === "dislike" ? x : null;
  } catch {
    return null;
  }
}

/** Every thing the person likes and dislikes now, by key. Both empty before migration 0039 runs. */
export async function reactionsOf(userId: string): Promise<{ liked: Set<string>; disliked: Set<string> }> {
  try {
    const r = await db().query<{ key: string; reaction: string }>("SELECT DISTINCT ON (key) key, reaction FROM media_reaction WHERE user_id = $1 ORDER BY key, created_at DESC, id DESC", [userId]);
    return { liked: new Set(r.rows.filter((x) => x.reaction === "like").map((x) => x.key)), disliked: new Set(r.rows.filter((x) => x.reaction === "dislike").map((x) => x.key)) };
  } catch {
    return { liked: new Set(), disliked: new Set() };
  }
}

/** Every thing the person dislikes now, to leave out of Up next. Empty before migration 0039 runs. */
export async function dislikedKeys(userId: string): Promise<Set<string>> {
  return (await reactionsOf(userId)).disliked;
}
