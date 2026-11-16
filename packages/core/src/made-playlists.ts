/**
 * Playlists made for one person (Torian, 2026-11-16 01:10Z: "playlists specifically curated by ai for the user";
 * 01:17Z agreeing to the guide "Topics and playlists"). The model picks only from what a topic already holds, by key,
 * and writes a reason for each pick; anything it names that is not in the list is dropped, so Reflect never invents a
 * work or a link. A playlist is made only when the person asks. It is marked as Reflect's, never as a person's choice.
 * Pure: the prompt is built and the answer read here; the call is the server's.
 */
import { itemKey, kindOf, type CollectionItem } from "./collections";

export type MadePlaylist = { name: string; items: CollectionItem[] };

export type MadeAsk = {
  topic: string;
  /** What the person told Work they are working toward, newest first. */
  aims: readonly string[];
  /** What they typed to change it ("shorter, more music"), if anything. */
  ask?: string;
  /** Titles of the playlist they asked to replace, to make a different one. */
  instead?: readonly string[];
  /** Keys of things they already finished, to leave out. */
  done?: ReadonlySet<string>;
};

const line = (i: CollectionItem, n: number) => `${n + 1}. [${kindOf(i)}] ${i.title}, ${i.by}`;

/** The prompt: the candidates numbered, what the person is working toward, and the answer's exact shape. */
export function madePrompt(a: MadeAsk, candidates: readonly CollectionItem[]): string {
  const open = candidates.filter((c) => !a.done?.has(itemKey(c)));
  return [
    `You make one playlist for one person from the topic "${a.topic}" in Scholē, Reflect's place for listening, watching and looking.`,
    "Pick only from the numbered list. Never name anything that is not on it.",
    "Pick 5 to 8 items and put them in the order to take them, mixing kinds where it helps (a recording, then a podcast or lecture that explains it, music or art beside it).",
    "For each, write one plain sentence on why it is there for this person and what it adds after the one before. Start with what it does, not \"It\". No praise words, no exclamation marks.",
    "Name the playlist in at most six plain words by the question or theme it follows (like \"Justice, from the Greeks\" or \"How Socrates died\"), never by its kinds of media.",
    a.aims.length ? `They are working toward: ${a.aims.slice(0, 3).join("; ")}.` : "They have not said what they are working toward.",
    a.ask ? `They asked: ${a.ask.slice(0, 300)}` : "",
    a.instead?.length ? `Make it different from their last one: ${a.instead.slice(0, 8).join("; ")}.` : "",
    "",
    "The list:",
    ...open.map((c) => line(c, candidates.indexOf(c))),
    "",
    'Answer with JSON only: {"name": "...", "items": [{"n": 3, "why": "..."}, ...]}',
  ].filter((x) => x !== "").join("\n");
}

/** Reads the model's answer against the candidates: known numbers only, each once, 3 to 10 items; null when unusable. */
export function readMade(text: string, candidates: readonly CollectionItem[]): MadePlaylist | null {
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return null;
  let j: unknown;
  try { j = JSON.parse(m[0]); } catch { return null; }
  const o = (j && typeof j === "object" ? j : {}) as { name?: unknown; items?: unknown };
  const name = typeof o.name === "string" ? o.name.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  const seen = new Set<number>();
  const items: CollectionItem[] = [];
  for (const raw of Array.isArray(o.items) ? o.items : []) {
    const r = (raw && typeof raw === "object" ? raw : {}) as { n?: unknown; why?: unknown };
    const n = typeof r.n === "number" ? r.n : Number(r.n);
    const c = Number.isInteger(n) ? candidates[n - 1] : undefined;
    if (!c || seen.has(n)) continue;
    seen.add(n);
    const why = typeof r.why === "string" ? r.why.replace(/\s+/g, " ").trim().slice(0, 240) : "";
    items.push({ ...c, ...(why ? { why } : {}) } as CollectionItem);
    if (items.length === 10) break;
  }
  if (!name || items.length < 3) return null;
  return { name, items };
}

/** Reads a stored playlist's items back, keeping only well-formed ones. */
export function storedItems(v: unknown): CollectionItem[] {
  if (!Array.isArray(v)) return [];
  return v.filter((i): i is CollectionItem => {
    if (!i || typeof i !== "object") return false;
    const x = i as Record<string, unknown>;
    if (typeof x.title !== "string" || typeof x.by !== "string") return false;
    switch (x.kind) {
      case "audiobook": return typeof x.id === "string" && /^\d+$/.test(x.id);
      case "course": return typeof x.url === "string" && x.url.startsWith("https://");
      case "episode": return typeof x.feed === "string" && typeof x.key === "string";
      case "find": return typeof x.medium === "string";
      default: return false;
    }
  });
}
