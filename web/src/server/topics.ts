// Topics a person follows, and the playlists Reflect made for them when they asked (migration 0035). The model
// picks only from what the topic holds (@reflect/core/made-playlists); its answer is checked before it is kept.
import { randomUUID } from "node:crypto";
import { generateText } from "ai";
import { db } from "@/db/pool";
import type { CollectionItem } from "@reflect/core/collections";
import { madePrompt, readMade, storedItems } from "@reflect/core/made-playlists";
import { topicCandidates, topicPageById } from "@reflect/core/topic-pages";
import { chatModel } from "./chat-model";
import { bioFor } from "./guests";
import { personHref, personNamed } from "@reflect/core/historical-people";

const TOPIC = /^[a-z0-9-]{2,40}$/;

/** Follows a topic, or stops. Each change is a new row; the latest counts. */
export async function setTopicFollow(userId: string, topic: string, follow: boolean): Promise<void> {
  if (!TOPIC.test(topic)) throw new Error("No such topic.");
  await db().query("INSERT INTO topic_follow (id, user_id, topic, follow) VALUES ($1, $2, $3, $4)", [randomUUID(), userId, topic, follow]);
}

/** The topics a person follows now. Empty before migration 0035 runs. */
export async function followedTopics(userId: string): Promise<string[]> {
  try {
    const r = await db().query<{ topic: string; follow: boolean }>(
      "SELECT DISTINCT ON (topic) topic, follow FROM topic_follow WHERE user_id = $1 ORDER BY topic, created_at DESC, id DESC", [userId]);
    return r.rows.filter((x) => x.follow).map((x) => x.topic);
  } catch {
    return [];
  }
}

export type Made = { id: string; topic: string; name: string; aim: string | null; ask: string | null; items: CollectionItem[]; at: string; saved: boolean };

type Row = { id: string; topic: string; name: string; aim: string | null; ask: string | null; items: unknown; created_at: Date; saved: boolean | null };
const SELECT = `SELECT p.id, p.topic, p.name, p.aim, p.ask, p.items, p.created_at,
  (SELECT s.saved FROM made_playlist_save s WHERE s.playlist_id = p.id ORDER BY s.created_at DESC, s.id DESC LIMIT 1) AS saved
  FROM made_playlist p`;
const out = (r: Row): Made => ({ id: r.id, topic: r.topic, name: r.name, aim: r.aim, ask: r.ask, items: storedItems(r.items), at: r.created_at.toISOString(), saved: r.saved === true });

/** One made playlist of the person's, or null. */
export async function madeById(userId: string, id: string): Promise<Made | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    const r = await db().query<Row>(`${SELECT} WHERE p.user_id = $1 AND p.id = $2`, [userId, id]);
    return r.rows[0] ? out(r.rows[0]) : null;
  } catch {
    return null;
  }
}

/** The person's made playlists, newest first: in one topic, or the saved ones in all. Empty before migration 0035. */
export async function madeList(userId: string, o: { topic?: string; saved?: boolean } = {}): Promise<Made[]> {
  try {
    const r = await db().query<Row>(`${SELECT} WHERE p.user_id = $1 ${o.topic ? "AND p.topic = $2" : ""} ORDER BY p.created_at DESC LIMIT 50`, o.topic ? [userId, o.topic] : [userId]);
    const all = r.rows.map(out);
    return o.saved ? all.filter((m) => m.saved) : all;
  } catch {
    return [];
  }
}

export async function setSaved(userId: string, id: string, saved: boolean): Promise<void> {
  const m = await madeById(userId, id);
  if (!m) throw new Error("No such playlist.");
  await db().query("INSERT INTO made_playlist_save (id, user_id, playlist_id, saved) VALUES ($1, $2, $3, $4)", [randomUUID(), userId, id, saved]);
}

/**
 * Makes a playlist for the person from a topic, keeps it and returns its id. One model call (a second if the first
 * answer cannot be used). `instead` is the playlist they asked to replace; `done` the keys of things they finished.
 */
export async function makePlaylist(userId: string, topic: string, o: { aims: readonly string[]; ask?: string; instead?: string; done?: ReadonlySet<string> }): Promise<string> {
  const t = topicPageById(topic);
  if (!t) throw new Error("No such topic.");
  const model = chatModel();
  if (!model) throw new Error("Making a playlist needs the model, which is not set up here.");
  const before = o.instead ? await madeById(userId, o.instead) : null;
  const candidates = topicCandidates(t);
  const ask = o.ask?.replace(/\s+/g, " ").trim().slice(0, 300) || undefined;
  const prompt = madePrompt({ topic: t.name, aims: o.aims, ask, instead: before?.items.map((i) => i.title), done: o.done }, candidates);
  for (let i = 0; i < 2; i++) {
    const { text } = await generateText({ model, prompt });
    const made = readMade(text, candidates);
    if (!made) continue;
    const id = randomUUID();
    await db().query("INSERT INTO made_playlist (id, user_id, topic, name, aim, ask, items) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, topic, made.name, o.aims[0]?.slice(0, 200) ?? null, ask ?? null, JSON.stringify(made.items)]);
    return id;
  }
  throw new Error("The playlist could not be made just now. Try again in a moment.");
}


export type Face = { name: string; image: string | null; href: string | null };

/** The faces of a topic's people, from their Wikipedia pages (kept a day), each opening their person page, else their author page, when there is one. */
export async function facesOf(people: readonly { name: string; wiki: string; ol?: string }[]): Promise<Face[]> {
  return Promise.all(people.map(async (p) => {
    const bio = await bioFor(p.name, `https://en.wikipedia.org/wiki/${p.wiki}`).catch(() => null);
    const own = personNamed(p.name);
    return { name: p.name, image: bio?.image ?? null, href: own ? personHref(own) : p.ol ? `/schole/authors/${p.ol}` : null };
  }));
}
