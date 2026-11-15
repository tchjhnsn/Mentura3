/**
 * Guests and books in podcast episodes, read from what the feed already says (Torian, 2026-11-15 16:20Z: guest
 * pages and book mentions first; no AI, for cost). A guest comes from the feed's own people (Podcasting 2.0's
 * `podcast:person` with the role guest), from the show notes' opening ("Kevin Ryan is one of the leading..."), or from
 * the title in the forms shows use ("#499 – Gary Gallagher: ...", "... | Dr. Anna Lembke", "... with Robert Greene").
 * A book comes from the show notes: a link to a bookshop or a book catalog, or a line marked "(book)". The caller
 * checks each book against Open Library and keeps only those it finds. Pure: nothing is fetched here.
 */
import type { Episode, NoteBlock, Show } from "./podcasts.ts";

const WORD = "[A-Z\\u00C0-\\u00DE][\\p{L}'’.-]*";
/** A person's name as titles and notes write it: two to four capitalised words, a title such as Dr. allowed first. */
const NAME = `(?:(?:Dr|Prof|Professor|Sir|Rev|Fr|Gen|Sen|Rep|Gov)\\.? )?${WORD}(?: (?:[A-Z]\\.|${WORD}|de|van|von|da|del|bin|al)){1,3}`;
const nameRe = new RegExp(`^${NAME}$`, "u");
/** A name in a title: two or three words, so a phrase such as "Relationship Tools That Work" is not taken. */
const SHORT = `(?:(?:Dr|Prof|Professor)\\.? )?${WORD}(?: (?:[A-Z]\\.|${WORD}|de|van|von|da|del|bin|al)){1,2}`;
const TITLE_FORMS = [
  new RegExp(`^#?\\d+\\s*[–—:-]\\s*(${SHORT})\\s*[:–—|]`, "u"), // #499 – Gary Gallagher: ...
  new RegExp(`[|]\\s*(${NAME})\\s*$`, "u"), // ... | Dr. Anna Lembke
  new RegExp(`\\bwith (${SHORT})(?=$|[,:;.!?|–—(]| on | about | and )`, "u"), // ... with Robert Greene
  new RegExp(`[–—]\\s*(${SHORT})(?= of |$)`, "u"), // #884: ... — Kevin Ryan of DoubleClick
];
const OPENING = new RegExp(`^(${NAME}),? (?:is|was|has been|serves as)\\b (?:a|an|the|one|currently|best|widely|known|founder|co-?founder|professor|author|chief|director|president|ceo|host)`, "iu");
/** Words that look like a name but are not one: places, groups, words a title starts with. */
const NOT_NAMES = /^(The|This|Our|My|Your|How|Why|What|When|Where|Who|In|On|At|An|A|Episode|Part|Season|Bonus|Q&A|Live|Special|New|Best|Top|AI|Tips|Tools|Lessons|Stories|Random|Ask|United|North|South|East|West|Saudi|Silicon|Wall|White|Supreme|World|Middle|Holy|Mental|Artificial|Russia|Ukraine|China|America|American|Chinese|Israel|Iran|Europe|European)\b/;

export type Guest = { name: string; /** The guest's Wikipedia page, when the notes link it. */ wiki?: string; /** Their picture, when the feed's person tag gives one. */ image?: string };

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/^(Dr|Prof|Professor)\.? /, (m) => m.replace(/\.?\s$/, ". ")).trim();
const plainText = (b: NoteBlock) => b.parts.map((p) => p.text).join("").replace(/\s+/g, " ").trim();
const sameName = (a: string, b: string) => a.toLowerCase().replace(/^(dr|prof|professor)\.? /, "") === b.toLowerCase().replace(/^(dr|prof|professor)\.? /, "");
/** A guest's name with a title such as Dr. taken off, as a page or a search uses it. */
export const bareName = (n: string) => n.replace(/^(?:Dr|Prof|Professor|Sir|Rev|Fr|Gen|Sen|Rep|Gov)\.? /, "").trim();

function isName(n: string, hosts: readonly string[]): boolean {
  if (!nameRe.test(n) || NOT_NAMES.test(n)) return false;
  const words = bareName(n).split(" ");
  if (words.length < 2 || words.some((w) => w.length > 20)) return false;
  // A segment named for the show or an event, not a person: "All-In Summit", "All-In Liquidity IPO Panel".
  if (/\b(Panel|Summit|Interview|Roundtable|Debate|Mailbag|Recap|Preview|Special|Edition|Conference|Festival|Awards?)$/i.test(n)) return false;
  // A name led by the show's own hyphenated name is the show's, not a person's ("All-In DC" on All-In).
  const first = words[0]!.toLowerCase();
  if (first.includes("-") && hosts.some((h) => h.trim().toLowerCase().split(/\s+/)[0] === first)) return false;
  return !hosts.some((h) => h && (sameName(h, n) || h.toLowerCase().includes(bareName(n).toLowerCase())));
}

/** The guests of an episode, by the feed's people, the notes' opening sentences and the title, the host left out. */
export function episodeGuests(e: Pick<Episode, "title" | "notes" | "people">, show: Pick<Show, "title" | "author" | "people">): Guest[] {
  const hosts = [show.author ?? "", show.title, ...show.people.filter((p) => p.role !== "guest").map((p) => p.name), ...e.people.filter((p) => p.role === "host").map((p) => p.name)];
  const out: Guest[] = [];
  const add = (raw: string, wiki?: string, image?: string | null) => {
    const name = clean(raw);
    if (!isName(name, hosts) || out.some((g) => sameName(g.name, name))) return;
    out.push({ name, ...(wiki ? { wiki } : {}), ...(image ? { image } : {}) });
  };
  for (const p of e.people) if (p.role === "guest") add(p.name, p.href && /wikipedia\.org\/wiki\//.test(p.href) ? p.href : undefined, p.image);
  const wikis = e.notes.flatMap((b) => b.parts).filter((p) => p.href && /^https:\/\/en\.wikipedia\.org\/wiki\//.test(p.href)).map((p) => p.href!);
  const wikiFor = (name: string) => wikis.find((w) => decodeURIComponent(w).replace(/_/g, " ").toLowerCase().includes(bareName(name).split(" ").at(-1)!.toLowerCase()));
  // The opening sentences of the notes, where shows introduce the guest.
  for (const b of e.notes.filter((x) => !x.list).slice(0, 3)) {
    for (const sentence of plainText(b).split(/(?<=[.!?])\s+/).slice(0, 3)) {
      const m = OPENING.exec(sentence);
      if (m) add(m[1]!, wikiFor(m[1]!));
    }
  }
  // A name taken from the title counts only when the notes name the person too (a pipe at the end is a show's own form).
  const said = e.notes.map(plainText).join(" ").toLowerCase();
  TITLE_FORMS.forEach((re, i) => {
    const m = re.exec(e.title);
    if (m && (i === 1 || said.includes(bareName(m[1]!).toLowerCase()))) add(m[1]!, wikiFor(m[1]!));
  });
  return out.slice(0, 4);
}

/** Every guest of a show, the most recent first, with the episodes each appeared in (by key). */
export function showGuests(show: Pick<Show, "title" | "author" | "people"> & { about?: string | null; episodes: readonly Pick<Episode, "key" | "title" | "notes" | "people">[] }, limit = 48): (Guest & { episodes: string[] })[] {
  const out = new Map<string, Guest & { episodes: string[] }>();
  // People the show's own description names are its hosts (All-In: "Chamath Palihapitiya, Jason Calacanis, David Sacks..."), not guests.
  const about = (show.about ?? "").toLowerCase();
  for (const e of show.episodes) {
    for (const g of episodeGuests(e, show)) {
      if (about.includes(bareName(g.name).toLowerCase())) continue;
      const k = bareName(g.name).toLowerCase();
      const had = out.get(k);
      if (had) { had.episodes.push(e.key); if (!had.wiki && g.wiki) had.wiki = g.wiki; if (!had.image && g.image) had.image = g.image; } else out.set(k, { ...g, episodes: [e.key] });
    }
  }
  return [...out.values()].slice(0, limit);
}

export type BookMention = { title: string; author?: string; href?: string; /** The ISBN in the link, when it has one. */ isbn?: string };

const STORE = /(?:^|\.)(amzn\.to|amazon\.[a-z.]+|bookshop\.org|goodreads\.com|openlibrary\.org|audible\.[a-z.]+|books\.google\.[a-z.]+|barnesandnoble\.com|penguinrandomhouse\.com|harpercollins\.com|simonandschuster\.com|hachettebookgroup\.com|macmillan\.com|indiebound\.org|libro\.fm)$/i;
const BOOKISH = /(?:^|\.)(bookshop\.org|goodreads\.com|openlibrary\.org|audible\.[a-z.]+|books\.google\.[a-z.]+|barnesandnoble\.com|penguinrandomhouse\.com|harpercollins\.com|simonandschuster\.com|hachettebookgroup\.com|macmillan\.com|indiebound\.org|libro\.fm)$/i;
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const urlish = (s: string) => /^(https?:\/\/|www\.)|\.(com|org|to|net)\b/i.test(s.trim());

/** A book's title and author from the words around its link: "The Union War (book):", "Range by David Epstein". */
function titleOf(text: string): { title: string; author?: string } | null {
  let t = text.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().replace(/[\s:–—-]+$/, "");
  t = t.replace(/^[*•·\-–—\s]+/, "").replace(/\((?:the )?(?:book|audiobook|novel|essay)\)/i, "").trim();
  const by = /^[“"']?(.+?)[”"']?,? by ([A-Z][\p{L}.'’ -]+?)(?:\s*[([,:;–—|].*)?$/u.exec(t);
  const title = (by ? by[1]! : t).replace(/^[“"']|[”"']$/g, "").replace(/\s*[:–—|-]\s*$/, "").trim();
  if (title.length < 2 || title.length > 120 || title.split(" ").length > 14 || /^(buy|get|order|link|here|book|books)$/i.test(title)) return null;
  // A sentence, an offer or a store, not a title.
  if (/^(amazon|audible|kindle|apple|spotify|libro)\b|free trial|\$\d|% off|promo|discount|subscri|\bcode\b/i.test(title) || /\b(is|has|was|were|published|includes?|including|called|author of)\b|’s book|'s book|^In \w+ \d{4}/.test(title)) return null;
  return { title, ...(by ? { author: by[2]!.trim() } : {}) };
}

/**
 * The books an episode's notes mention: a link to a bookshop or book catalog, with the title taken from the link's
 * words or the line it is on; a store that sells more than books (Amazon) counts only when the line says "(book)",
 * names an author ("by ..."), or sits under a heading about books.
 */
export function episodeBooks(notes: readonly NoteBlock[]): BookMention[] {
  const out: BookMention[] = [];
  let underBooks = false;
  for (const b of notes) {
    const line = plainText(b);
    if (!b.list && !b.parts.some((p) => p.href)) { underBooks = /\bbooks?\b|reading list|mentioned|recommend/i.test(line) && line.length < 80; continue; }
    const links = b.parts.filter((p) => p.href && STORE.test(host(p.href)));
    const marked = /\((?:the )?(?:book|audiobook|novel)\)/i.test(line);
    if (!links.length && !marked) continue;
    for (const l of links.length ? links : [{ text: line, href: undefined as string | undefined }]) {
      const bookish = Boolean(l.href && BOOKISH.test(host(l.href)));
      // The link's own words are the title; "by ..." just after them names the author.
      const own = l.text && !urlish(l.text) && l.text.trim().length > 1 ? l.text.trim() : null;
      const after = own ? new RegExp(`${own.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[”"']?,? (by [A-Z][\\p{L}.'’ -]+?)(?=$|[([,:;–—|.])`, "u").exec(line)?.[1] : null;
      const text = own ? (after ? `${own} ${after}` : own) : line;
      const t = titleOf(text);
      if (!t || !(bookish || marked || t.author || underBooks)) continue;
      if (out.some((x) => x.title.toLowerCase() === t.title.toLowerCase())) continue;
      const isbn = l.href ? /(?:^|\D)(97[89]\d{10})(?:\D|$)/.exec(l.href)?.[1] ?? /\/(?:dp|gp\/product|isbn)\/(\d{9}[\dX])(?:[/?]|$)/i.exec(l.href)?.[1] : undefined;
      out.push({ ...t, ...(l.href ? { href: l.href } : {}), ...(isbn ? { isbn } : {}) });
    }
  }
  return out.slice(0, 24);
}

/** The books a show's episodes mention most, then most recently. */
export function showBooks(show: { episodes: readonly Pick<Episode, "notes">[] }, limit = 24): (BookMention & { count: number })[] {
  const out = new Map<string, BookMention & { count: number }>();
  for (const e of show.episodes) {
    for (const b of episodeBooks(e.notes)) {
      const k = b.title.toLowerCase().replace(/^the /, "");
      const had = out.get(k);
      if (had) { had.count++; if (!had.author && b.author) had.author = b.author; } else out.set(k, { ...b, count: 1 });
    }
  }
  return [...out.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Whether a catalog's title is the book a show's notes named. */
export function sameBook(named: string, found: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/^(the|a|an) /, "").replace(/\s+/g, " ").trim();
  const a = n(named), b = n(found);
  return Boolean(a && b) && (a === b || (a.includes(" ") && b.startsWith(`${a} `)) || (b.includes(" ") && a.startsWith(`${b} `)) || (a.length > 12 && b.includes(a)));
}

export type Appearance = { title: string; show: string; feed: string; guid: string; date: string | null; seconds: number | null; image: string | null; collection: string | null };

/** Apple's episode search (`itunes.apple.com/search?entity=podcastEpisode`) read into episodes that name the person. */
export function appleAppearances(text: string | null, name: string): Appearance[] {
  let results: unknown = [];
  try { results = (JSON.parse(text ?? "") as { results?: unknown }).results ?? []; } catch { return []; }
  const who = bareName(name).toLowerCase();
  const seen = new Set<string>();
  return (Array.isArray(results) ? results : []).flatMap((r: Record<string, unknown>) => {
    const s = (k: string) => (typeof r[k] === "string" ? (r[k] as string).trim() : "");
    const title = s("trackName"), feed = s("feedUrl"), guid = s("episodeGuid");
    if (!title || !/^https?:\/\//.test(feed) || !guid) return [];
    if (!`${title} ${s("description")}`.toLowerCase().includes(who)) return [];
    const k = `${feed}|${guid}`;
    if (seen.has(k)) return [];
    seen.add(k);
    const ms = typeof r.trackTimeMillis === "number" ? r.trackTimeMillis : null;
    return [{ title, show: s("collectionName"), feed, guid, date: s("releaseDate").slice(0, 10) || null, seconds: ms ? Math.round(ms / 1000) : null, image: s("artworkUrl600") || s("artworkUrl160") || null, collection: typeof r.collectionId === "number" ? String(r.collectionId) : null }];
  });
}

export type Bio = { name: string; about: string; description: string | null; image: string | null; href: string; /** Its Wikidata item. */ qid?: string };

/** Wikipedia's page summary (`/api/rest_v1/page/summary/<title>`) read into a bio, or null when it is not one person's page. */
export function wikiBio(text: string | null): Bio | null {
  let j: Record<string, unknown>;
  try { j = JSON.parse(text ?? "") as Record<string, unknown>; } catch { return null; }
  if (j.type !== "standard" || typeof j.extract !== "string" || !j.extract.trim()) return null;
  const description = typeof j.description === "string" ? j.description : null;
  // A person's page says what they are ("American historian"); a place or a thing rarely has a birth year or a trade.
  if (description && /disambiguation|^(city|town|village|country|river|company|album|film|song|band|genus|species)\b/i.test(description)) return null;
  const urls = (j.content_urls as { desktop?: { page?: string } } | undefined)?.desktop?.page;
  const thumb = (j.thumbnail as { source?: string } | undefined)?.source ?? null;
  const qid = typeof j.wikibase_item === "string" && /^Q\d+$/.test(j.wikibase_item) ? j.wikibase_item : null;
  return { name: typeof j.title === "string" ? j.title : "", about: j.extract.trim(), description, image: thumb, href: urls ?? "", ...(qid ? { qid } : {}) };
}
