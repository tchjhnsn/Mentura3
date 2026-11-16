/**
 * Audiobooks first (Torian, 2026-11-15 08:24Z): LibriVox's recordings as a listener browses them, and one set of
 * topics shared by podcasts and audiobooks, so a topic shows both. A podcast's topic comes from its Apple category
 * (each feed names one); an audiobook's from LibriVox's genres. Pure: the catalog's lines are passed in.
 */

/** One recording from `src/data/audiobooks.txt`. */
export type Audiobook = {
  id: string; title: string; by: string; seconds: number; readers: number; dramatic: boolean; downloads: number;
  genres: string[]; language: string; item: string;
};

/** A catalog line (`id|title|author|seconds|readers|dramatic|downloads|genres|language|item`) read, or null. */
export function readAudiobook(line: string): Audiobook | null {
  const [id, title, by, seconds, readers, dramatic, downloads, genres, language, item] = line.split("|");
  if (!id || !/^\d+$/.test(id) || !title) return null;
  return {
    id, title, by: by ?? "", seconds: Number(seconds) || 0, readers: Number(readers) || 0, dramatic: dramatic === "1", downloads: Number(downloads) || 0,
    genres: (genres ?? "").split(";").filter(Boolean), language: language || "English", item: item ?? "",
  };
}

export type Topic = { id: string; label: string; /** Apple Podcasts genre ids that belong to it. */ apple: number[]; /** LibriVox genres that belong to it. */ genre: RegExp | null };

/** The topics Browse offers for listening, in its menu's order. */
export const TOPICS: readonly Topic[] = [
  { id: "philosophy", label: "Philosophy", apple: [1443], genre: /philosoph|ethics|logic/i },
  { id: "religion", label: "Religion & Spirituality", apple: [1314, 1439, 1440, 1441, 1444, 1463, 1464, 1438, 1442], genre: /religio|bible|christian|theolog|spiritual|sermon|devotion|hymn|king james|world english|standard version|church|saints/i },
  { id: "history", label: "History", apple: [1487], genre: /^(history|ancient|medieval|early modern|modern|modern \(19th c\)|war & military|military)|histor(y|ies)\b/i },
  { id: "society", label: "Society & Politics", apple: [1324, 1511, 1325, 1302], genre: /politic|law|social|sociolog|government|essays/i },
  { id: "science", label: "Science & Nature", apple: [1533, 1477, 1478, 1479, 1480, 1481, 1482], genre: /science|astronomy|physics|mathemat|chemistry|biolog|nature|animals|earth|botany|geology/i },
  { id: "mind", label: "Mind & Health", apple: [1512, 1520, 1521, 1517, 1518, 1519], genre: /psycholog|medical|health|self-help|cooking|house & home|family life|parenting/i },
  { id: "business", label: "Business & Economics", apple: [1321, 1410, 1412, 1413, 1491, 1492, 1493, 1494], genre: /business|economic|finance/i },
  { id: "technology", label: "Technology", apple: [1318], genre: /technolog|engineering|invention/i },
  { id: "fiction", label: "Fiction", apple: [1483, 1484, 1485, 1486], genre: /fiction|short stor|novel|romance|westerns|myths|fairy tales|epistolary|single author/i },
  { id: "poetry", label: "Poetry & Plays", apple: [], genre: /poetry|sonnet|epic|plays|drama|tragedy|ballad|verse/i },
  { id: "lives", label: "Biography & Memoir", apple: [], genre: /biograph|memoir|autobiograph|letters|diaries/i },
  { id: "arts", label: "Arts & Culture", apple: [1301, 1310, 1309, 1402, 1405, 1406, 1459], genre: /\bart\b|\barts\b|music|literary criticism|linguistic|languages|culture/i },
  { id: "travel", label: "Travel & Places", apple: [1320], genre: /travel|geography|exploration/i },
  { id: "children", label: "Children & Family", apple: [1305], genre: /children/i },
  { id: "comedy", label: "Comedy & Humor", apple: [1303], genre: /humo(u)?r|satire|comed/i },
  { id: "crime", label: "Crime & Mystery", apple: [1488], genre: /crime|mystery|detective/i },
  { id: "news", label: "News", apple: [1489], genre: null },
  { id: "education", label: "Learning", apple: [1304], genre: /education|textbook|school|grammar|instruction/i },
  { id: "sports", label: "Sports & Leisure", apple: [1545, 1502], genre: /sport|games|hobbies|outdoor/i },
];
export const topicOf = (id: unknown): Topic | undefined => TOPICS.find((t) => t.id === id);

/** The topics LibriVox's genres put a recording under. History and science never take a story; a story is fiction. */
export function audiobookTopics(genres: readonly string[]): string[] {
  const out = new Set<string>();
  for (const g of genres) {
    for (const t of TOPICS) {
      if (!t.genre || !t.genre.test(g)) continue;
      if ((t.id === "history" || t.id === "science") && /fiction/i.test(g)) continue;
      out.add(t.id);
    }
  }
  return [...out];
}

/** The topic of a podcast by its Apple category name ("Philosophy", "Religion & Spirituality"), or null. */
export function podcastTopic(categories: readonly string[]): string | null {
  const names: Record<string, string> = {
    philosophy: "philosophy", "religion & spirituality": "religion", christianity: "religion", history: "history", "society & culture": "society", government: "society",
    science: "science", "health & fitness": "mind", "mental health": "mind", business: "business", technology: "technology", fiction: "fiction", arts: "arts", music: "arts",
    "tv & film": "arts", "places & travel": "travel", "kids & family": "children", comedy: "comedy", "true crime": "crime", news: "news", education: "education", sports: "sports", leisure: "sports",
  };
  for (const c of categories) { const t = names[c.toLowerCase()]; if (t) return t; }
  return null;
}

/** How long a recording runs, as a listener sorts audiobooks. */
export const LENGTHS = [
  { id: "short", label: "Under 2 hours", fits: (s: number) => s > 0 && s < 7200 },
  { id: "medium", label: "2 to 8 hours", fits: (s: number) => s >= 7200 && s < 28800 },
  { id: "long", label: "Over 8 hours", fits: (s: number) => s >= 28800 },
] as const;
/** Who reads it: one reader, many readers taking turns, or a cast (a dramatic reading). */
export const READERS = [
  { id: "one", label: "One reader", fits: (a: Audiobook) => a.readers === 1 && !a.dramatic },
  { id: "many", label: "Many readers", fits: (a: Audiobook) => a.readers > 1 && !a.dramatic },
  { id: "cast", label: "Dramatic reading", fits: (a: Audiobook) => a.dramatic },
] as const;

export type AudiobookQuery = { topic?: string; length?: string; readers?: string; language?: string; q?: string; /** Recordings Reflect's editors name (canon.ts), ranked before the rest. */ canon?: ReadonlySet<string> };

/** Words as a search compares them: lower case, accents dropped ("Niccolò" is "niccolo"), punctuation as spaces. */
export const searchWords = (s: string): string[] => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
/** Articles left out of a search: LibriVox titles drop a leading "The" ("Prince", not "The Prince"). */
const ARTICLES = new Set(["the", "a", "an"]);

/**
 * How well a recording answers a search, or 0 when it does not (Torian, 2026-11-16 07:33Z: The Prince should not be hard
 * to find). Every word must be a whole word of the title or author (so "prince" does not find "Princess"); then an exact
 * title ranks first, a title that starts with the words next, then the words in the title, then only in the author.
 */
export function searchScore(a: Pick<Audiobook, "title" | "by">, q: string): number {
  const words = searchWords(q).filter((w) => !ARTICLES.has(w));
  if (!words.length) return 1;
  const title = searchWords(a.title).filter((w) => !ARTICLES.has(w));
  const both = new Set([...title, ...searchWords(a.by)]);
  if (!words.every((w) => both.has(w))) return 0;
  if (title.join(" ") === words.join(" ")) return 4;
  if (title.slice(0, words.length).join(" ") === words.join(" ")) return 3;
  return words.every((w) => title.includes(w)) ? 2 : 1;
}

/** Recordings that match, in a topic, of a length, read by one, many or a cast, in a language: the best match to a search first, then the editors' canon, then the most downloaded. */
export function findAudiobooks(all: readonly Audiobook[], o: AudiobookQuery, limit = 48, offset = 0): Audiobook[] {
  const t = topicOf(o.topic);
  const len = LENGTHS.find((x) => x.id === o.length);
  const who = READERS.find((x) => x.id === o.readers);
  const q = o.q ?? "";
  const lang = o.language || "English";
  return all
    .filter((a) => (lang === "all" || a.language === lang) && (!len || len.fits(a.seconds)) && (!who || who.fits(a)) && (!t || audiobookTopics(a.genres).includes(t.id)))
    .map((a) => ({ a, s: searchScore(a, q) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || Number(Boolean(o.canon?.has(y.a.id))) - Number(Boolean(o.canon?.has(x.a.id))) || y.a.downloads - x.a.downloads)
    .map((x) => x.a)
    .slice(offset, offset + limit);
}

/** The languages recordings are in, the most recorded first. */
export function audiobookLanguages(all: readonly Audiobook[]): { language: string; count: number }[] {
  const n = new Map<string, number>();
  for (const a of all) n.set(a.language, (n.get(a.language) ?? 0) + 1);
  return [...n].map(([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count);
}

/** A recording's length as a person says it: "14h 20m", "52m". */
export function hoursOf(s: number): string {
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`;
}

/** The middle length of a show's episodes, for "usually about 1h 10m", or null with fewer than three. */
export function usualLength(seconds: readonly (number | null)[]): number | null {
  const s = seconds.filter((x): x is number => typeof x === "number" && x > 60).sort((a, b) => a - b);
  return s.length >= 3 ? s[Math.floor(s.length / 2)]! : null;
}

/** Apple's chart of top podcasts in a genre (`itunes.apple.com/us/rss/toppodcasts/limit=N/genre=ID/json`) read into shows. */
export function appleChart(text: string | null): { medium: "podcast"; title: string; by?: string; url: string; image?: string; source: string }[] {
  let entries: unknown = [];
  try { entries = (JSON.parse(text ?? "") as { feed?: { entry?: unknown } }).feed?.entry ?? []; } catch { return []; }
  const label = (v: unknown) => (v && typeof v === "object" && typeof (v as { label?: unknown }).label === "string" ? (v as { label: string }).label.trim() : "");
  return (Array.isArray(entries) ? entries : [entries]).flatMap((e: Record<string, unknown>) => {
    const title = label(e["im:name"]);
    const url = ((e.link as { attributes?: { href?: string } } | undefined)?.attributes?.href ?? "").replace(/\?.*$/, "");
    if (!title || !/podcasts\.apple\.com\/.+\/id\d+/.test(url)) return [];
    const images = Array.isArray(e["im:image"]) ? (e["im:image"] as unknown[]) : [];
    const image = label(images[images.length - 1]).replace(/\/\d+x\d+bb\.(png|jpg)$/, "/600x600bb.jpg");
    const by = label(e["im:artist"]);
    return [{ medium: "podcast" as const, title, url, source: "Apple Podcasts", ...(by ? { by } : {}), ...(image ? { image } : {}) }];
  });
}
