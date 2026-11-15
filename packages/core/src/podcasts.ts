/**
 * Hearing a podcast inside Reflect. A show is found by its Apple Podcasts link (Apple's lookup gives its feed) or by
 * its feed itself; the feed lists each episode with its audio file, which Reflect plays in its own player, and a
 * transcript when the show publishes one (the Podcasting 2.0 transcript tag). Nothing is copied. Fetching is passed
 * in, so it runs anywhere.
 */
import { passagesFromCaptions, plain, type Passage } from "./courses";

/** A run of show notes: text, or text that links somewhere. */
export type NotePart = { text: string; href?: string };
/** Show notes as blocks of parts, read from the feed's HTML without keeping any of its markup. */
export type NoteBlock = { list: boolean; parts: NotePart[] };
/** Someone on a show or an episode (the Podcasting 2.0 person tag): a host, a guest, and so on. */
export type Person = { name: string; role: string; href: string | null; image: string | null };
export type Chapter = { at: number; title: string; href?: string | null; image?: string | null };
export type Episode = {
  key: string; title: string; date: string | null; seconds: number | null; audio: string; about: string | null;
  transcript: { url: string; type: string } | null;
  /** Video when the enclosure is a video file. */
  kind: "audio" | "video";
  season: number | null; number: number | null; type: "full" | "trailer" | "bonus";
  image: string | null; notes: NoteBlock[]; people: Person[];
  /** Chapters given in the feed itself (Podlove), else the address of a chapters file (Podcasting 2.0). */
  chapters: Chapter[]; chaptersUrl: string | null;
};
export type Show = { title: string; feed: string; episodes: Episode[]; image: string | null; author: string | null; about: string | null; categories: string[]; people: Person[]; funding: { url: string; text: string }[] };
export type Fetch = (url: string) => Promise<string | null>;

/** A short id for an episode, stable across reads of the feed (FNV-1a of its guid, else its audio address). */
export function episodeKey(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  let g = 0xcbf29ce4;
  for (let i = s.length - 1; i >= 0; i--) { g ^= s.charCodeAt(i); g = Math.imul(g, 0x01000193) >>> 0; }
  return h.toString(36) + g.toString(36);
}

const tag = (xml: string, name: string) => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(xml);
  if (!m) return null;
  const v = m[1]!.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
  return plain(v) || null;
};
const attr = (el: string, name: string) => new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i").exec(el)?.[1]?.replace(/&amp;/g, "&") ?? null;
const https = (u: string | null) => (u && /^https?:\/\/\S+$/i.test(u) ? u : null);
/** The raw inside of a tag: CDATA unwrapped, markup kept. */
const raw = (xml: string, name: string) => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(xml);
  return m ? m[1]!.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1") : null;
};
const num = (v: string | null) => (v && /^\d{1,5}$/.test(v.trim()) ? Number(v.trim()) : null);

/**
 * Show notes read into blocks of text and links. The feed's HTML (escaped or not) is split at paragraphs, line breaks
 * and list items; only text and http(s) links are kept, so nothing of the feed's markup reaches the page.
 */
export function readNotes(html: string | null): NoteBlock[] {
  if (!html) return [];
  let h = html;
  if (!/<[a-z]/i.test(h) && /&lt;[a-z]/i.test(h)) h = h.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  h = h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");
  const blocks: NoteBlock[] = [];
  for (const chunk of h.split(/<\/?(?:p|div|h[1-6]|ul|ol|blockquote)\b[^>]*>|<br\s*\/?>|\n\s*\n/i)) {
    const items = chunk.split(/<li\b[^>]*>/i);
    items.forEach((piece, i) => {
      const parts: NotePart[] = [];
      let last = 0;
      const text = (t: string) => { const v = plain(t); if (v) parts.push({ text: v }); };
      for (const a of piece.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
        text(piece.slice(last, a.index));
        const href = https(attr(`<a ${a[1]}>`, "href"));
        const label = plain(a[2]!);
        if (label) parts.push(href ? { text: label, href } : { text: label });
        last = a.index! + a[0].length;
      }
      text(piece.slice(last));
      if (parts.length) blocks.push({ list: i > 0, parts });
    });
    if (blocks.length >= 200) break;
  }
  return blocks;
}

const people = (xml: string): Person[] => [...xml.matchAll(/<podcast:person\b([^>]*)>([\s\S]*?)<\/podcast:person>/gi)].map((m) => {
  const el = `<p ${m[1]}>`;
  return { name: plain(m[2]!), role: (attr(el, "role") ?? "host").toLowerCase(), href: https(attr(el, "href")), image: https(attr(el, "img")) };
}).filter((p) => p.name).slice(0, 20);

/** A Podlove start time, "00:01:02.500" or "62". */
const start = (v: string | null) => {
  if (!v) return null;
  const m = /^(?:(\d+):)?(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(v.trim());
  if (!m) return null;
  const parts = [m[1], m[2], m[3]].filter((x) => x !== undefined).map(Number);
  return Math.floor(parts.reduce((s, x) => s * 60 + x, 0));
};

/** A Podcasting 2.0 chapters file (JSON) read into chapters, in order. */
export function readChapters(json: string | null): Chapter[] {
  try {
    const j = JSON.parse(json ?? "") as { chapters?: { startTime?: number; title?: string; url?: string; img?: string; toc?: boolean }[] };
    return (j.chapters ?? []).filter((c) => typeof c.startTime === "number" && c.title && c.toc !== false)
      .map((c) => ({ at: Math.floor(c.startTime!), title: String(c.title).slice(0, 200), href: https(c.url ?? null), image: https(c.img ?? null) }))
      .sort((a, b) => a.at - b.at).slice(0, 300);
  } catch {
    return [];
  }
}

/** How long an episode is: "3600", "1:00:00" or "59:59". */
export function duration(v: string | null): number | null {
  if (!v) return null;
  if (/^\d+$/.test(v.trim())) return Number(v.trim());
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(v.trim());
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

/** A show's feed read into its episodes, newest first, up to 3000 (the whole catalog the feed gives). */
export function readFeed(xml: string, feed: string): Show {
  const head = xml.split(/<item[\s>]/i)[0] ?? "";
  const episodes: Episode[] = [];
  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)) {
    const it = m[1]!;
    const enc = /<enclosure\b[^>]*>/i.exec(it)?.[0];
    const audio = https(enc ? attr(enc, "url") : null);
    const mime = enc ? attr(enc, "type") ?? "" : "";
    const title = tag(it, "title");
    if (!audio || !title) continue;
    const tr = [...it.matchAll(/<podcast:transcript\b[^>]*>/gi)].map((t) => ({ url: https(attr(t[0], "url")), type: attr(t[0], "type") ?? "" })).filter((t) => t.url && /vtt|srt|text\/plain|html/i.test(t.type));
    const best = tr.find((t) => /vtt/i.test(t.type)) ?? tr.find((t) => /srt/i.test(t.type)) ?? tr[0];
    const date = tag(it, "pubDate");
    const d = date ? new Date(date) : null;
    episodes.push({
      key: episodeKey(tag(it, "guid") ?? audio), title, date: d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null,
      seconds: duration(tag(it, "itunes:duration")), audio: audio.replace(/^http:/, "https:"),
      about: (tag(it, "itunes:summary") ?? tag(it, "description"))?.slice(0, 2000) ?? null,
      transcript: best ? { url: best.url!, type: best.type } : null,
      kind: /^video\//i.test(mime) || /\.(mp4|m4v|mov|webm)(\?|$)/i.test(audio) ? "video" : "audio",
      season: num(tag(it, "itunes:season") ?? tag(it, "podcast:season")), number: num(tag(it, "itunes:episode") ?? tag(it, "podcast:episode")),
      type: (/^(trailer|bonus)$/i.exec(tag(it, "itunes:episodeType") ?? "")?.[0]?.toLowerCase() as "trailer" | "bonus" | undefined) ?? "full",
      image: https(attr(/<itunes:image\b[^>]*>/i.exec(it)?.[0] ?? "", "href")),
      notes: readNotes(raw(it, "content:encoded") ?? raw(it, "description") ?? raw(it, "itunes:summary")),
      people: people(it),
      chapters: [...it.matchAll(/<psc:chapter\b[^>]*>/gi)].map((c) => ({ at: start(attr(c[0], "start")), title: attr(c[0], "title") ?? "" })).filter((c): c is Chapter => c.at !== null && Boolean(c.title)),
      chaptersUrl: https(attr(/<podcast:chapters\b[^>]*>/i.exec(it)?.[0] ?? "", "url")),
    });
    if (episodes.length >= 3000) break;
  }
  episodes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const image = https(attr(/<itunes:image\b[^>]*>/i.exec(head)?.[0] ?? "", "href")) ?? https(tag(/<image>[\s\S]*?<\/image>/i.exec(head)?.[0] ?? "", "url"));
  return {
    title: tag(head, "title") ?? "", feed, episodes, image,
    author: tag(head, "itunes:author") ?? tag(head, "managingEditor"),
    about: (tag(head, "itunes:summary") ?? tag(head, "description"))?.slice(0, 3000) ?? null,
    categories: [...new Set([...head.matchAll(/<itunes:category\b[^>]*>/gi)].map((c) => attr(c[0], "text")).filter((x): x is string => Boolean(x)))],
    people: people(head),
    funding: [...head.matchAll(/<podcast:funding\b([^>]*)>([\s\S]*?)<\/podcast:funding>/gi)].map((m) => ({ url: https(attr(`<f ${m[1]}>`, "url")), text: plain(m[2]!) || "Support the show" })).filter((x): x is { url: string; text: string } => Boolean(x.url)),
  };
}

/** The feed of a show from its Apple Podcasts link, or the link itself when it is a feed. */
export async function feedOf(raw: string, f: Fetch): Promise<string | null> {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (u.hostname === "podcasts.apple.com") {
    const id = /\/id(\d+)/.exec(u.pathname)?.[1];
    if (!id) return null;
    const j = await f(`https://itunes.apple.com/lookup?id=${id}&entity=podcast`);
    try { return https((JSON.parse(j ?? "{}") as { results?: { feedUrl?: string }[] }).results?.[0]?.feedUrl ?? null); } catch { return null; }
  }
  return u.protocol === "https:" || u.protocol === "http:" ? raw : null;
}

/** A show and its episodes, from its link. */
export async function showOf(raw: string | null, f: Fetch): Promise<Show | null> {
  if (!raw) return null;
  const feed = await feedOf(raw, f);
  const xml = feed ? await f(feed) : null;
  if (!xml || !/<rss|<channel/i.test(xml)) return null;
  return readFeed(xml, feed!);
}

/** An episode's published transcript as passages. */
export async function episodeTranscript(e: Episode, f: Fetch): Promise<Passage[]> {
  if (!e.transcript) return [];
  const t = await f(e.transcript.url);
  if (!t) return [];
  if (/vtt|srt/i.test(e.transcript.type)) return passagesFromCaptions(t);
  const text = /html/i.test(e.transcript.type) ? t.replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "") : t;
  return text.split(/\n\s*\n|\n/).map((x) => x.trim()).filter(Boolean).slice(0, 2000).map((x) => ({ at: null, heading: false, who: null, text: x }));
}

/** An episode's chapters: those in the feed, else its chapters file. */
export async function episodeChapters(e: Episode, f: Fetch): Promise<Chapter[]> {
  if (e.chapters.length) return e.chapters;
  return e.chaptersUrl ? readChapters(await f(e.chaptersUrl)) : [];
}
