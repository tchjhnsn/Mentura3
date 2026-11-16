// Dialectic's feed (migrations 0037 and 0038): short posts, each optionally tagged with a topic (a curated dialectic, an
// idea, a term, a work or a person), replies, reposts and following people; each post read by a model for its stance and
// its level (its points, up to 5), which the author may correct for stance only; and written debates formed from a
// post, argued in turns within a character count. Reads are empty before the migrations run.
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
  id: string; topic: string | null; parentId: string | null; who: Person; body: string; createdAt: string; mine: boolean; removed: boolean;
  stance: Stance | null; level: Level | null; why: string | null; corrected: boolean;
  /** Replies still up, reposts in force, whether the viewer reposted it, and the debate formed from it. */
  replies: number; reposts: number; reposted: boolean; debate: { id: string; motion: string } | null;
};
/** An entry in a feed: a post, and who reposted it when that is why it is here. */
export type FeedItem = { post: TopicPost; repostedBy: Person | null; at: string };

const isId = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const person = (id: string, name: string | null, image: string | null): Person => ({ id, name: name?.trim() || "Someone", image });

/** What a topic asks or is, for the model: a dialectic's question, else the topic's name. */
export function topicText(topic: string): { kind: "question" | "topic"; text: string } | null {
  const t = parseTopic(topic);
  if (!t) return null;
  if (t.kind === "dialectic") { const d = dialecticById(t.id); return d ? { kind: "question", text: d.question } : null; }
  if (t.kind === "idea") { const i = ideaById(t.id); return i ? { kind: "topic", text: i.name } : null; }
  if (t.kind === "term") { const x = termById(t.id); return x ? { kind: "topic", text: x.name } : null; }
  if (t.kind === "work") { const w = workById(t.id); return w ? { kind: "topic", text: `${w.title}, by ${w.by}` } : null; }
  return { kind: "topic", text: t.id };
}

/** A topic's short name, for its tag on a post. */
export function topicName(topic: string | null): string | null {
  if (!topic) return null;
  const t = parseTopic(topic);
  if (!t) return null;
  if (t.kind === "dialectic") return dialecticById(t.id)?.question ?? null;
  if (t.kind === "idea") return ideaById(t.id)?.name ?? null;
  if (t.kind === "term") return termById(t.id)?.name ?? null;
  if (t.kind === "work") return workById(t.id)?.title ?? null;
  return t.id;
}

type PRow = {
  id: string; topic: string | null; parent_id: string | null; user_id: string; name: string | null; image: string | null; body: string; created_at: Date; removed: boolean;
  stance: Stance | null; level: number | null; why: string | null; own: Stance | null; replies: string; reposts: string; reposted: boolean; debate_id: string | null; motion: string | null;
};

/** Posts with their reading, counts and debate, by a WHERE over p (the post), with the viewer as $1. */
async function loadPosts(userId: string, where: string, args: unknown[], order = "p.created_at", limit = 200): Promise<TopicPost[]> {
  const rows = (await db().query<PRow>(
    `SELECT p.id, p.topic, p.parent_id, p.user_id, u.name, u.image, p.body, p.created_at, (r.post_id IS NOT NULL) AS removed,
            g.stance, g.level, g.why, s.stance AS own,
            (SELECT count(*) FROM topic_post c LEFT JOIN topic_post_removed cr ON cr.post_id = c.id WHERE c.parent_id = p.id AND cr.post_id IS NULL) AS replies,
            (SELECT count(*) FROM (SELECT DISTINCT ON (x.user_id) x.repost FROM topic_post_repost x WHERE x.post_id = p.id ORDER BY x.user_id, x.created_at DESC) y WHERE y.repost) AS reposts,
            COALESCE((SELECT x.repost FROM topic_post_repost x WHERE x.post_id = p.id AND x.user_id = $1 ORDER BY x.created_at DESC LIMIT 1), false) AS reposted,
            o.debate_id, d.motion
       FROM topic_post p JOIN "user" u ON u.id = p.user_id LEFT JOIN topic_post_removed r ON r.post_id = p.id
       LEFT JOIN LATERAL (SELECT stance, level, why FROM topic_post_grade WHERE post_id = p.id ORDER BY created_at DESC LIMIT 1) g ON true
       LEFT JOIN LATERAL (SELECT stance FROM topic_post_stance WHERE post_id = p.id AND user_id = p.user_id ORDER BY created_at DESC LIMIT 1) s ON true
       LEFT JOIN LATERAL (SELECT debate_id FROM debate_origin WHERE post_id = p.id ORDER BY created_at LIMIT 1) o ON true
       LEFT JOIN debate d ON d.id = o.debate_id
      WHERE ${where} ORDER BY ${order} LIMIT ${limit}`, [userId, ...args])).rows;
  return rows.map((r) => ({
    id: r.id, topic: r.topic, parentId: r.parent_id, who: person(r.user_id, r.name, r.image), body: r.removed ? "" : r.body, createdAt: r.created_at.toISOString(),
    mine: r.user_id === userId, removed: r.removed, stance: r.own ?? r.stance, level: (r.level as Level | null) ?? null, why: r.why, corrected: Boolean(r.own),
    replies: Number(r.replies), reposts: Number(r.reposts), reposted: r.reposted, debate: r.debate_id && r.motion ? { id: r.debate_id, motion: r.motion } : null,
  }));
}

/**
 * A feed, newest first: posts that start a conversation (not replies) and reposts of them. Everyone's, or only the
 * people the viewer follows (and the viewer), or one topic's, or one person's. No ranking by popularity.
 */
export async function feed(userId: string, f: { following?: boolean; topic?: string; author?: string } = {}): Promise<FeedItem[]> {
  try {
    const cond: string[] = ["p.parent_id IS NULL", "r.post_id IS NULL"];
    const args: unknown[] = [];
    if (f.topic) { args.push(f.topic); cond.push(`p.topic = $${args.length + 1}`); }
    if (f.author) { args.push(f.author); cond.push(`p.user_id = $${args.length + 1}`); }
    const posts = await loadPosts(userId, cond.join(" AND "), args, "p.created_at DESC", 300);
    let items: FeedItem[] = posts.map((post) => ({ post, repostedBy: null, at: post.createdAt }));
    if (!f.topic) {
      // Reposts in force: the latest row for each person and post says yes.
      const rp = (await db().query<{ post_id: string; user_id: string; name: string | null; image: string | null; created_at: Date }>(
        `SELECT * FROM (SELECT DISTINCT ON (x.post_id, x.user_id) x.post_id, x.user_id, u.name, u.image, x.created_at, x.repost
           FROM topic_post_repost x JOIN "user" u ON u.id = x.user_id ORDER BY x.post_id, x.user_id, x.created_at DESC) y
          WHERE y.repost ${f.author ? "AND y.user_id = $1" : ""} ORDER BY y.created_at DESC LIMIT 300`, f.author ? [f.author] : [])).rows;
      const byId = new Map(posts.map((p) => [p.id, p]));
      const missing = rp.map((x) => x.post_id).filter((id) => !byId.has(id));
      if (missing.length) for (const p of await loadPosts(userId, "p.id = ANY($2) AND r.post_id IS NULL", [missing])) byId.set(p.id, p);
      for (const x of rp) { const post = byId.get(x.post_id); if (post) items.push({ post, repostedBy: person(x.user_id, x.name, x.image), at: x.created_at.toISOString() }); }
    }
    if (f.following) {
      const follows = await following(userId);
      follows.add(userId);
      items = items.filter((i) => follows.has(i.repostedBy?.id ?? i.post.who.id));
    }
    // A post shows once, where it last came into the feed (its posting or its latest repost).
    const seen = new Set<string>();
    return items.sort((a, b) => b.at.localeCompare(a.at)).filter((i) => !seen.has(i.post.id) && Boolean(seen.add(i.post.id))).slice(0, 200);
  } catch {
    return [];
  }
}

/** One post with every reply under it, in order, and the post it answers when it is a reply. */
export async function postThread(userId: string, postId: string): Promise<{ post: TopicPost; replies: TopicPost[]; parent: TopicPost | null } | null> {
  if (!isId(postId)) return null;
  try {
    const [post] = await loadPosts(userId, "p.id = $2", [postId]);
    if (!post) return null;
    const ids = (await db().query<{ id: string }>(
      `WITH RECURSIVE t AS (SELECT id FROM topic_post WHERE parent_id = $1 UNION ALL SELECT c.id FROM topic_post c JOIN t ON c.parent_id = t.id) SELECT id FROM t LIMIT 2000`, [postId])).rows.map((r) => r.id);
    const all = ids.length ? await loadPosts(userId, "p.id = ANY($2)", [ids], "p.created_at", 2000) : [];
    const answered = new Set(all.filter((p) => !p.removed && p.parentId).map((p) => p.parentId));
    const parent = post.parentId ? (await loadPosts(userId, "p.id = $2", [post.parentId]))[0] ?? null : null;
    return { post, replies: all.filter((p) => !p.removed || answered.has(p.id)), parent };
  } catch {
    return null;
  }
}

/** Posts on one topic, oldest first, for the debate page's origin and older callers. */
export async function postsOn(userId: string, topic: string): Promise<TopicPost[]> {
  if (!topicText(topic)) return [];
  try {
    return await loadPosts(userId, "p.topic = $2", [topic], "p.created_at", 2000);
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
async function grade(postId: string, body: string, to: { kind: "post" | "question" | "topic"; text: string } | null): Promise<void> {
  const model = chatModel();
  if (!model) return;
  try {
    const { text } = await generateText({ model, prompt: gradePrompt(body, to), abortSignal: AbortSignal.timeout(25_000) });
    const g = parseGrade(text);
    if (g) await db().query("INSERT INTO topic_post_grade (id, post_id, stance, level, why, model) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), postId, to ? g.stance : "neither", g.level, g.why || null, "gpt-oss-120b"]);
  } catch {
    // Unread posts show as not read yet; reading can be asked again.
  }
}

/**
 * Posts, with a topic as its tag or none, or answers a post (taking its topic), and has the post read. Returns the new
 * post's id.
 */
export async function addPost(userId: string, topic: string | null, body: unknown, parentId?: string | null): Promise<string> {
  const text = clean(body, LIMITS.post);
  if (!text) throw new Error(`Write something first, up to ${LIMITS.post} characters.`);
  let tag = topic || null;
  let to: { kind: "post" | "question" | "topic"; text: string } | null = null;
  const parent = parentId && isId(parentId) ? parentId : null;
  if (parent) {
    const p = (await db().query<{ body: string; topic: string | null }>("SELECT body, topic FROM topic_post WHERE id = $1", [parent])).rows[0];
    if (!p) throw new Error("That post is not here.");
    tag = p.topic;
    to = { kind: "post", text: p.body };
  } else if (tag) {
    to = topicText(tag);
    if (!to) throw new Error("No such topic.");
  }
  const id = randomUUID();
  await db().query("INSERT INTO topic_post (id, topic, user_id, parent_id, body) VALUES ($1, $2, $3, $4, $5)", [id, tag, userId, parent, text]);
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
  const p = (await db().query<{ topic: string | null; body: string; parent: string | null }>("SELECT p.topic, p.body, q.body AS parent FROM topic_post p LEFT JOIN topic_post q ON q.id = p.parent_id WHERE p.id = $1", [postId])).rows[0];
  if (!p) return;
  await grade(postId, p.body, p.parent ? { kind: "post", text: p.parent } : p.topic ? topicText(p.topic) : null);
}

/** Reposts a post, or takes the repost back. */
export async function repost(userId: string, postId: string, on: boolean): Promise<void> {
  if (!isId(postId)) throw new Error("No such post.");
  await db().query("INSERT INTO topic_post_repost (id, post_id, user_id, repost) VALUES ($1, $2, $3, $4)", [randomUUID(), postId, userId, on]);
}

/** Follows a person, or stops. */
export async function follow(userId: string, targetId: string, on: boolean): Promise<void> {
  if (!targetId || targetId === userId) throw new Error("You can't follow yourself.");
  await db().query("INSERT INTO user_follow (id, user_id, target_id, follow) VALUES ($1, $2, $3, $4)", [randomUUID(), userId, targetId, on]);
}

/** The people someone follows. */
export async function following(userId: string): Promise<Set<string>> {
  try {
    const r = await db().query<{ target_id: string }>("SELECT target_id FROM (SELECT DISTINCT ON (target_id) target_id, follow FROM user_follow WHERE user_id = $1 ORDER BY target_id, created_at DESC) x WHERE follow", [userId]);
    return new Set(r.rows.map((x) => x.target_id));
  } catch {
    return new Set();
  }
}

/** A person for their page: name and picture, and how many follow them and they follow. */
export async function personPage(targetId: string): Promise<{ who: Person; followers: number; follows: number } | null> {
  try {
    const u = (await db().query<{ id: string; name: string | null; image: string | null }>('SELECT id, name, image FROM "user" WHERE id = $1', [targetId])).rows[0];
    if (!u) return null;
    const count = async (col: "user_id" | "target_id", other: "user_id" | "target_id") => Number((await db().query<{ n: string }>(
      `SELECT count(*) AS n FROM (SELECT DISTINCT ON (${other}) follow FROM user_follow WHERE ${col} = $1 ORDER BY ${other}, created_at DESC) x WHERE follow`, [targetId])).rows[0]?.n ?? 0);
    return { who: person(u.id, u.name, u.image), followers: await count("target_id", "user_id"), follows: await count("user_id", "target_id") };
  } catch {
    return null;
  }
}

/* ---------- written debates ---------- */

/**
 * Forms a written debate from a post: its author argues for it (or against, if they choose), and someone takes the
 * other seat. The debate starts at once; turns are written in order within each step's character count.
 */
export async function formDebate(userId: string, postId: string, f: { motion: unknown; side: unknown }): Promise<string> {
  if (!isId(postId)) throw new Error("No such post.");
  const p = (await db().query<{ topic: string | null }>("SELECT topic FROM topic_post WHERE id = $1", [postId])).rows[0];
  if (!p) throw new Error("No such post.");
  const t = p.topic ? parseTopic(p.topic) : null;
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
export async function debateOrigin(debateId: string): Promise<{ postId: string; topic: string | null } | null> {
  if (!isId(debateId)) return null;
  try {
    const r = (await db().query<{ post_id: string; topic: string | null }>("SELECT o.post_id, p.topic FROM debate_origin o JOIN topic_post p ON p.id = o.post_id WHERE o.debate_id = $1", [debateId])).rows[0];
    return r ? { postId: r.post_id, topic: r.topic } : null;
  } catch {
    return null;
  }
}
