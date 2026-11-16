// Discussions on topics (migration 0037): posts on a curated dialectic, an idea, a term, a work or a person; each read
// by a model for its stance and its level (its points, up to 5), which the author may correct for stance only; and
// written debates formed from a post, argued in turns within a character count. Reads are empty before 0037 runs.
import { randomUUID } from "node:crypto";
import { generateText } from "ai";
import { gradePrompt, isStance, parseGrade, parseTopic, pointsFor, type Level, type Stance } from "@reflect/core/argument";
import { LIMITS, clean, formatById, nextTurn } from "@reflect/core/dialectic";
import { dialecticById } from "@reflect/core/dialectics";
import { ideaById, termById } from "@reflect/core/great-ideas";
import { workById } from "@reflect/core/topic-pages";
import { db } from "@/db/pool";
import { chatModel } from "./chat-model";
import { createDebate, getDebate, type Person } from "./dialectic-store";

export type TopicPost = {
  id: string; topic: string; parentId: string | null; who: Person; body: string; createdAt: string; mine: boolean; removed: boolean;
  stance: Stance | null; level: Level | null; why: string | null; corrected: boolean;
};

const isId = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const person = (id: string, name: string | null, image: string | null): Person => ({ id, name: name?.trim() || "Someone", image });

/** What a topic asks or is, for the model: a dialectic's question, else the topic's name. */
function topicText(topic: string): { kind: "question" | "topic"; text: string } | null {
  const t = parseTopic(topic);
  if (!t) return null;
  if (t.kind === "dialectic") { const d = dialecticById(t.id); return d ? { kind: "question", text: d.question } : null; }
  if (t.kind === "idea") { const i = ideaById(t.id); return i ? { kind: "topic", text: i.name } : null; }
  if (t.kind === "term") { const x = termById(t.id); return x ? { kind: "topic", text: x.name } : null; }
  if (t.kind === "work") { const w = workById(t.id); return w ? { kind: "topic", text: `${w.title}, by ${w.by}` } : null; }
  return { kind: "topic", text: t.id };
}

export async function postsOn(userId: string, topic: string): Promise<TopicPost[]> {
  if (!topicText(topic)) return [];
  try {
    const rows = (await db().query<{ id: string; topic: string; parent_id: string | null; user_id: string; name: string | null; image: string | null; body: string; created_at: Date; removed: boolean; stance: Stance | null; level: number | null; why: string | null; own: Stance | null }>(
      `SELECT p.id, p.topic, p.parent_id, p.user_id, u.name, u.image, p.body, p.created_at, (r.post_id IS NOT NULL) AS removed,
              g.stance, g.level, g.why, s.stance AS own
         FROM topic_post p JOIN "user" u ON u.id = p.user_id LEFT JOIN topic_post_removed r ON r.post_id = p.id
         LEFT JOIN LATERAL (SELECT stance, level, why FROM topic_post_grade WHERE post_id = p.id ORDER BY created_at DESC LIMIT 1) g ON true
         LEFT JOIN LATERAL (SELECT stance FROM topic_post_stance WHERE post_id = p.id AND user_id = p.user_id ORDER BY created_at DESC LIMIT 1) s ON true
        WHERE p.topic = $1 ORDER BY p.created_at LIMIT 2000`, [topic])).rows;
    const posts: TopicPost[] = rows.map((r) => ({
      id: r.id, topic: r.topic, parentId: r.parent_id, who: person(r.user_id, r.name, r.image), body: r.removed ? "" : r.body, createdAt: r.created_at.toISOString(),
      mine: r.user_id === userId, removed: r.removed, stance: r.own ?? r.stance, level: (r.level as Level | null) ?? null, why: r.why, corrected: Boolean(r.own),
    }));
    const answered = new Set(posts.filter((p) => !p.removed && p.parentId).map((p) => p.parentId));
    return posts.filter((p) => !p.removed || answered.has(p.id));
  } catch {
    return [];
  }
}

/** How many posts each topic has, for lists. */
export async function postCounts(topics: string[]): Promise<Map<string, number>> {
  if (!topics.length) return new Map();
  try {
    const r = await db().query<{ topic: string; n: string }>("SELECT p.topic, count(*) AS n FROM topic_post p LEFT JOIN topic_post_removed r ON r.post_id = p.id WHERE r.post_id IS NULL AND p.topic = ANY($1) GROUP BY p.topic", [topics]);
    return new Map(r.rows.map((x) => [x.topic, Number(x.n)]));
  } catch {
    return new Map();
  }
}

/** The person's points: the sum of the levels of their posts still up. */
export async function pointsOf(userId: string): Promise<{ points: number; posts: number }> {
  try {
    const r = await db().query<{ level: number | null }>(
      `SELECT (SELECT level FROM topic_post_grade WHERE post_id = p.id ORDER BY created_at DESC LIMIT 1) AS level
         FROM topic_post p LEFT JOIN topic_post_removed r ON r.post_id = p.id WHERE p.user_id = $1 AND r.post_id IS NULL`, [userId]);
    return { points: r.rows.reduce((n, x) => n + pointsFor(x.level), 0), posts: r.rows.length };
  } catch {
    return { points: 0, posts: 0 };
  }
}

/** Has a model read a post: its stance toward what it answers, and its level. Nothing when no model is set up. */
async function grade(postId: string, body: string, to: { kind: "post" | "question" | "topic"; text: string }): Promise<void> {
  const model = chatModel();
  if (!model) return;
  try {
    const { text } = await generateText({ model, prompt: gradePrompt(body, to), abortSignal: AbortSignal.timeout(25_000) });
    const g = parseGrade(text);
    if (g) await db().query("INSERT INTO topic_post_grade (id, post_id, stance, level, why, model) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), postId, g.stance, g.level, g.why || null, "gpt-oss-120b"]);
  } catch {
    // Unread posts show as not read yet; reading can be asked again.
  }
}

/** Posts on a topic, or answers a post on it, and has the post read. Returns the new post's id. */
export async function addPost(userId: string, topic: string, body: unknown, parentId?: string | null): Promise<string> {
  const text = clean(body, LIMITS.post);
  if (!text) throw new Error("Write something first, up to 2,000 characters.");
  const about = topicText(topic);
  if (!about) throw new Error("No such topic.");
  let to: { kind: "post" | "question" | "topic"; text: string } = about;
  const parent = parentId && isId(parentId) ? parentId : null;
  if (parent) {
    const p = (await db().query<{ body: string }>("SELECT body FROM topic_post WHERE id = $1 AND topic = $2", [parent, topic])).rows[0];
    if (!p) throw new Error("That post is not in this discussion.");
    to = { kind: "post", text: p.body };
  }
  const id = randomUUID();
  await db().query("INSERT INTO topic_post (id, topic, user_id, parent_id, body) VALUES ($1, $2, $3, $4, $5)", [id, topic, userId, parent, text]);
  await grade(id, text, to);
  return id;
}

/** The author says which way their own post leans, when the model read it wrong. */
export async function correctStance(userId: string, postId: string, stance: unknown): Promise<void> {
  if (!isId(postId) || !isStance(stance)) throw new Error("No such post.");
  if (!(await db().query("SELECT 1 FROM topic_post WHERE id = $1 AND user_id = $2", [postId, userId])).rowCount) throw new Error("Only its author can say which way a post leans.");
  await db().query("INSERT INTO topic_post_stance (id, post_id, user_id, stance) VALUES ($1, $2, $3, $4)", [randomUUID(), postId, userId, stance]);
}

export async function removePost(userId: string, postId: string): Promise<void> {
  if (!isId(postId) || !(await db().query("SELECT 1 FROM topic_post WHERE id = $1 AND user_id = $2", [postId, userId])).rowCount) throw new Error("Only its author can take a post down.");
  await db().query("INSERT INTO topic_post_removed (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id) DO NOTHING", [postId, userId]);
}

/** Reads again a post the model has not read yet (or could not). */
export async function regrade(postId: string): Promise<void> {
  if (!isId(postId)) return;
  const p = (await db().query<{ topic: string; body: string; parent: string | null }>("SELECT p.topic, p.body, q.body AS parent FROM topic_post p LEFT JOIN topic_post q ON q.id = p.parent_id WHERE p.id = $1", [postId])).rows[0];
  const about = p ? topicText(p.topic) : null;
  if (p && about) await grade(postId, p.body, p.parent ? { kind: "post", text: p.parent } : about);
}

/* ---------- written debates ---------- */

/**
 * Forms a written debate from a post: its author argues for it (or against, if they choose), and someone takes the
 * other seat. The debate starts at once; turns are written in order within each step's character count.
 */
export async function formDebate(userId: string, postId: string, f: { motion: unknown; side: unknown }): Promise<string> {
  if (!isId(postId)) throw new Error("No such post.");
  const p = (await db().query<{ topic: string }>("SELECT topic FROM topic_post WHERE id = $1", [postId])).rows[0];
  if (!p) throw new Error("No such post.");
  const t = parseTopic(p.topic);
  const work = t?.kind === "work" ? t.id : t?.kind === "dialectic" ? dialecticById(t.id)?.positions.find((x) => x.work)?.work ?? null : null;
  const id = await createDebate(userId, { motion: f.motion, workId: work, source: null, format: "written", startsAt: new Date().toISOString(), side: f.side === "against" ? "against" : "for" });
  await db().query("INSERT INTO debate_origin (debate_id, post_id) VALUES ($1, $2)", [id, postId]);
  return id;
}

export type Turn = { n: number; step: string; side: "for" | "against"; who: Person; body: string; createdAt: string };

export async function turnsOf(debateId: string): Promise<Turn[]> {
  if (!isId(debateId)) return [];
  try {
    const d = await getDebate(debateId);
    const f = d ? formatById(d.format) : undefined;
    if (!d || !f?.written) return [];
    const rows = (await db().query<{ n: number; user_id: string; name: string | null; image: string | null; body: string; created_at: Date }>(
      `SELECT t.n, t.user_id, u.name, u.image, t.body, t.created_at FROM debate_turn t JOIN "user" u ON u.id = t.user_id WHERE t.debate_id = $1 ORDER BY t.n`, [debateId])).rows;
    return rows.map((r) => ({ n: r.n, step: f.steps[Math.floor(r.n / 2)]?.label ?? "", side: r.n % 2 === 0 ? "for" : "against", who: person(r.user_id, r.name, r.image), body: r.body, createdAt: r.created_at.toISOString() }));
  } catch {
    return [];
  }
}

/** Writes the next turn, when it is the person's: they hold that side's seat and keep within the step's count. */
export async function writeTurn(userId: string, debateId: string, body: unknown): Promise<void> {
  const d = await getDebate(debateId);
  const f = d ? formatById(d.format) : undefined;
  if (!d || !f?.written) throw new Error("That is not a written debate.");
  const n = (await turnsOf(debateId)).length;
  const next = nextTurn(f, n);
  if (!next) throw new Error("This debate is finished.");
  if (d.state === "upcoming") throw new Error("This debate has not started.");
  if (d.seats[next.side]?.id !== userId) throw new Error("It is not your turn.");
  const max = f.steps[next.step]!.chars ?? 1000;
  const text = clean(body, max);
  if (!text) throw new Error(`Write up to ${max.toLocaleString("en-US")} characters.`);
  await db().query("INSERT INTO debate_turn (id, debate_id, user_id, n, body) VALUES ($1, $2, $3, $4, $5)", [randomUUID(), debateId, userId, n, text]);
}

/** The post a debate was formed from, with its topic. */
export async function debateOrigin(debateId: string): Promise<{ postId: string; topic: string } | null> {
  if (!isId(debateId)) return null;
  try {
    const r = (await db().query<{ post_id: string; topic: string }>("SELECT o.post_id, p.topic FROM debate_origin o JOIN topic_post p ON p.id = o.post_id WHERE o.debate_id = $1", [debateId])).rows[0];
    return r ? { postId: r.post_id, topic: r.topic } : null;
  } catch {
    return null;
  }
}
