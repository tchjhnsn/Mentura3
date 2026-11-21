// Snips (Torian, 2026-11-21: Scholē is as much Snipd as a course app): a moment the person marks while listening,
// kept as the episode or audiobook and the second it was at. There is no transcript and no AI summary (Torian ruled out
// AI snips for cost, 2026-11-15), so a snip holds no words: what the person makes of it they write in the journal.
// Each snip is one key in `person_fact` (`snip/<id>`), sealed, so no migration is needed; removing one closes its row.
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";

export type SnipTrack = { id: string; src: string; title: string; show: string; href: string; image?: string | null; item: string | null; unit: string; seconds?: number | null };
export type Snip = {
  id: string; at: number; title: string; by: string; href: string; image: string | null; createdAt: string;
  /** An episode, replayable from the moment; a chapter of an audiobook otherwise. */
  track: SnipTrack | null; chapter: number | null; chapterTitle: string | null;
};
const PREFIX = "snip/";

const clean = (s: unknown, n = 300) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export function parseSnip(text: string): Snip | null {
  try {
    const v = JSON.parse(text) as Partial<Snip>;
    if (typeof v.id !== "string" || typeof v.at !== "number" || typeof v.title !== "string" || typeof v.href !== "string") return null;
    return { id: v.id, at: v.at, title: v.title, by: v.by ?? "", href: v.href, image: v.image ?? null, createdAt: v.createdAt ?? "", track: v.track ?? null, chapter: v.chapter ?? null, chapterTitle: v.chapterTitle ?? null };
  } catch {
    return null;
  }
}

/** Keeps a snip from what the player sends; the href must be a Scholē page. */
export async function addSnip(userId: string, s: Omit<Snip, "id" | "createdAt">): Promise<Snip> {
  const href = clean(s.href, 500);
  if (!href.startsWith("/schole")) throw new Error("A snip belongs to a Scholē page.");
  const at = Math.max(0, Math.floor(Number(s.at) || 0));
  const t = s.track;
  const track: SnipTrack | null = t && typeof t.src === "string" && /^https:\/\//.test(t.src)
    ? { id: clean(t.id), src: t.src.slice(0, 1000), title: clean(t.title), show: clean(t.show), href: clean(t.href, 500), image: t.image ? clean(t.image, 1000) : null, item: t.item ? clean(t.item) : null, unit: clean(t.unit), seconds: typeof t.seconds === "number" ? t.seconds : null }
    : null;
  const snip: Snip = {
    id: randomUUID(), at, title: clean(s.title) || "Untitled", by: clean(s.by), href, image: s.image ? clean(s.image, 1000) : null,
    createdAt: new Date().toISOString(), track, chapter: typeof s.chapter === "number" ? s.chapter : null, chapterTitle: s.chapterTitle ? clean(s.chapterTitle) : null,
  };
  const day = snip.createdAt.slice(0, 10);
  await db().query("INSERT INTO person_fact (user_id, key, value_ct, valid_from, source) VALUES ($1, $2, $3, $4, 'stated')", [userId, `${PREFIX}${snip.id}`, seal(userId, JSON.stringify(snip)), day]);
  return snip;
}

/** The person's snips, newest first. */
export async function listSnips(userId: string): Promise<Snip[]> {
  const r = await db().query("SELECT value_ct FROM person_fact WHERE user_id = $1 AND key LIKE 'snip/%' AND valid_to IS NULL", [userId]);
  return (r.rows as { value_ct: string }[]).map((row) => parseSnip(open(userId, row.value_ct))).filter((s): s is Snip => !!s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Removes a snip: its row is closed, as every person_fact change is. */
export async function removeSnip(userId: string, id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await db().query("UPDATE person_fact SET valid_to = $3 WHERE user_id = $1 AND key = $2 AND valid_to IS NULL", [userId, `${PREFIX}${id}`, new Date().toISOString().slice(0, 10)]);
}
