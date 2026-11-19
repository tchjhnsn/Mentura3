// Text a model writes about a thing (migration 0039; Torian, 2026-11-16 19:29Z, build): a description of a recording
// and a fifteen-minute summary of a book, written once from Wikipedia, kept in ai_text and shared by everyone, and
// shown labelled as written by AI with its sources. A model never writes without sources.
import { randomUUID } from "node:crypto";
import { generateText } from "ai";
import { descriptionPrompt, readAiText, summaryPrompt, type AiKind, type Source } from "@reflect/core/ai-text";
import { db } from "@/db/pool";
import { chatModel } from "./chat-model";
import { outsideFetch } from "@/server/outside";

export type AiText = { body: string; sources: { label: string; url: string }[]; model: string };

const MODEL = "gpt-oss-120b";
// Things a model already declined in this process (no source, or sources not about it), so a page does not ask again.
const declined = new Set<string>();

/** The latest text a model wrote for a thing, or null. Null before migration 0039 runs. */
export async function aiTextFor(key: string, kind: AiKind): Promise<AiText | null> {
  try {
    const r = await db().query<{ body: string; sources: AiText["sources"]; model: string }>(
      "SELECT body, sources, model FROM ai_text WHERE key = $1 AND kind = $2 ORDER BY created_at DESC, id DESC LIMIT 1", [key.slice(0, 1200), kind]);
    return r.rows[0] ?? null;
  } catch {
    return null;
  }
}

async function wiki(params: Record<string, string>): Promise<unknown> {
  const q = new URLSearchParams({ ...params, format: "json", formatversion: "2" });
  try {
    const r = await outsideFetch({ timeoutMs: 8000 })(`https://en.wikipedia.org/w/api.php?${q}`, { headers: { "user-agent": "reflect-app" }, next: { revalidate: 86400 } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** The Wikipedia article that best matches a search, as a source: its lead only, or the whole article. */
export async function wikipediaSource(search: string, whole: boolean, near = search): Promise<Source | null> {
  const found = (await wiki({ action: "query", list: "search", srsearch: search, srlimit: "5" })) as { query?: { search?: { title: string }[] } } | null;
  const hits = (found?.query?.search ?? []).map((h) => h.title);
  // The first hit whose title shares a word with the thing's own title, else the first hit.
  const words = new Set(near.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3));
  const title = hits.find((h) => h.toLowerCase().split(/[^\p{L}\p{N}]+/u).some((w) => words.has(w))) ?? hits[0];
  return title ? articleSource(title, whole) : null;
}

/** A Wikipedia article by its title, as a source: its lead only, or the whole article. */
export async function articleSource(title: string, whole: boolean): Promise<Source | null> {
  const page = (await wiki({ action: "query", prop: "extracts", explaintext: "1", redirects: "1", titles: title, ...(whole ? {} : { exintro: "1" }) })) as { query?: { pages?: { title: string; extract?: string }[] } } | null;
  const p = page?.query?.pages?.[0];
  const text = p?.extract?.trim();
  if (!p || !text || text.length < 200) return null;
  return { label: `Wikipedia, “${p.title}”`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`, text };
}

async function write(key: string, kind: AiKind, prompt: string, sources: Source[], timeoutMs: number): Promise<AiText | null> {
  const model = chatModel();
  if (!model) return null;
  try {
    const { text } = await generateText({ model, prompt, abortSignal: AbortSignal.timeout(timeoutMs) });
    const body = readAiText(text, kind);
    if (!body) { declined.add(`${kind}:${key}`); return null; }
    const kept = sources.map((s) => ({ label: s.label, url: s.url }));
    await db().query("INSERT INTO ai_text (id, key, kind, body, sources, model) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), key.slice(0, 1200), kind, body, JSON.stringify(kept), MODEL]);
    return { body, sources: kept, model: MODEL };
  } catch {
    return null;
  }
}

/** A thing's description: the one kept, else one written now from Wikipedia. Null when there is no source or model. */
export async function ensureDescription(t: { key: string; title: string; by?: string | null; kind: string; article?: string | null }): Promise<AiText | null> {
  const have = await aiTextFor(t.key, "description");
  if (have || declined.has(`description:${t.key}`)) return have;
  const source = (t.article ? await articleSource(t.article, false) : null) ?? await wikipediaSource([t.title, t.by].filter(Boolean).join(" "), false, t.title);
  if (!source) { declined.add(`description:${t.key}`); return null; }
  return write(t.key, "description", descriptionPrompt(t, [source]), [source], 45_000);
}

/** The key a book's summary is kept under, whether or not the book is on Reflect. */
export const summaryKey = (title: string, by?: string | null) => `book:${title.trim().toLowerCase()}|${(by ?? "").trim().toLowerCase()}`;

/** A book's fifteen-minute summary: the one kept, else one written now from its Wikipedia article. */
export async function ensureSummary(t: { title: string; by?: string | null }): Promise<AiText | null> {
  const key = summaryKey(t.title, t.by);
  const have = await aiTextFor(key, "summary");
  if (have || declined.has(`summary:${key}`)) return have;
  const source = await wikipediaSource([t.title, t.by, "book"].filter(Boolean).join(" "), true, t.title);
  if (!source) { declined.add(`summary:${key}`); return null; }
  return write(key, "summary", summaryPrompt(t, [source]), [source], 180_000);
}
