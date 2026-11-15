/**
 * The people of podcasts (Torian, 2026-11-15 16:47Z): who hosts a show, the shows a person hosts, and where to find
 * them (X first, then Instagram, YouTube, TikTok and their own site). Read from Wikidata, which links a podcast
 * (Apple Podcasts id P5842, feed P1019) to its presenters (P371) and a person to their accounts; and, for a show
 * Wikidata does not know, from the feed's own hosts or its author when that is a person's name. Pure: queries are
 * built and answers read here, fetched by the caller.
 */
import type { Show } from "./podcasts.ts";

export const SPARQL = "https://query.wikidata.org/sparql";
const QID = /^Q\d{1,12}$/;
const str = (s: string) => `"${s.replace(/[\\"]/g, "\\$&")}"`;

type Binding = Record<string, { value: string } | undefined>;
function rows(text: string | null): Binding[] {
  try { return ((JSON.parse(text ?? "") as { results?: { bindings?: Binding[] } }).results?.bindings ?? []); } catch { return []; }
}
const qidOf = (uri: string | undefined) => uri?.match(/\/(Q\d+)$/)?.[1] ?? null;

/** A feed's address as Wikidata may hold it: with and without https, with and without a closing slash. */
export function feedForms(feed: string): string[] {
  const bare = feed.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return [...new Set(["https://", "http://"].flatMap((p) => [`${p}${bare}`, `${p}${bare}/`]))];
}

/** The query for a show's hosts, by its Apple Podcasts id and its feed. */
export function hostsQuery(o: { apple?: string | null; feed?: string | null }): string | null {
  const parts: string[] = [];
  if (o.apple && /^\d{3,15}$/.test(o.apple)) parts.push(`{ ?show wdt:P5842 ${str(o.apple)} }`);
  if (o.feed) parts.push(`{ ?show wdt:P1019 ?f . FILTER(STR(?f) IN (${feedForms(o.feed).map(str).join(", ")})) }`);
  if (!parts.length) return null;
  return `SELECT DISTINCT ?host ?hostLabel ?article WHERE { ${parts.join(" UNION ")} ?show wdt:P371 ?host . OPTIONAL { ?article schema:about ?host ; schema:isPartOf <https://en.wikipedia.org/> . } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 12`;
}

export type Host = { name: string; qid?: string; /** Their English Wikipedia page. */ wiki?: string };

/** A hosts query's answer read into hosts. */
export function readHosts(text: string | null): Host[] {
  const out: Host[] = [];
  for (const r of rows(text)) {
    const name = r.hostLabel?.value?.trim();
    const qid = qidOf(r.host?.value);
    if (!name || /^Q\d+$/.test(name) || out.some((h) => h.name === name)) continue;
    out.push({ name, ...(qid ? { qid } : {}), ...(r.article?.value ? { wiki: r.article.value } : {}) });
  }
  return out;
}

/** A show's hosts from its own feed: the people it names as hosts, else its author when that is one person's name. */
export function feedHosts(show: Pick<Show, "author" | "people" | "episodes">): Host[] {
  const named = show.people.filter((p) => p.role === "host").map((p) => p.name.trim()).filter(Boolean);
  if (named.length) return [...new Set(named)].map((name) => ({ name }));
  const author = (show.author ?? "").split(/\s*[:|–—,(]\s*|\s+-\s+/)[0]!.trim();
  return /^[A-Z][\p{L}'’.-]+(?: [A-Z][\p{L}'’.-]+){1,2}$/u.test(author) && !/\b(Media|Network|Studios?|Podcasts?|Radio|News|Productions?|LLC|Inc|Company|Group|Times|Post|Lab|Show|Wire)\b/.test(author) ? [{ name: author }] : [];
}

/** The query for what Wikidata says of a person: their accounts and the podcasts they host. */
export function personQuery(qid: string): string | null {
  if (!QID.test(qid)) return null;
  return `SELECT ?kind ?v ?show ?showLabel ?apple ?feed WHERE {
  { VALUES (?prop ?kind) { (wdt:P2002 "x") (wdt:P2003 "instagram") (wdt:P2397 "youtube") (wdt:P7085 "tiktok") (wdt:P856 "site") } wd:${qid} ?prop ?v . }
  UNION
  { ?show wdt:P371 wd:${qid} . ?show wdt:P31/wdt:P279* wd:Q24634210 . OPTIONAL { ?show wdt:P5842 ?apple } OPTIONAL { ?show wdt:P1019 ?feed } BIND("show" AS ?kind) }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 60`;
}

export type Link = { kind: "x" | "instagram" | "youtube" | "tiktok" | "site"; label: string; href: string };
export type HostedShow = { title: string; apple?: string; feed?: string };

const LINK: Record<Link["kind"], (v: string) => Link | null> = {
  x: (v) => (/^\w{1,15}$/.test(v) ? { kind: "x", label: `@${v}`, href: `https://x.com/${v}` } : null),
  instagram: (v) => (/^[\w.]{1,30}$/.test(v) ? { kind: "instagram", label: "Instagram", href: `https://www.instagram.com/${v}/` } : null),
  youtube: (v) => (/^UC[\w-]{22}$/.test(v) ? { kind: "youtube", label: "YouTube", href: `https://www.youtube.com/channel/${v}` } : null),
  tiktok: (v) => (/^[\w.]{1,30}$/.test(v) ? { kind: "tiktok", label: "TikTok", href: `https://www.tiktok.com/@${v}` } : null),
  site: (v) => (/^https?:\/\/\S+$/.test(v) ? { kind: "site", label: (() => { try { return new URL(v).hostname.replace(/^www\./, ""); } catch { return "Website"; } })(), href: v } : null),
};
const ORDER: Link["kind"][] = ["x", "instagram", "youtube", "tiktok", "site"];

/** A person query's answer read into their accounts (X first) and the podcasts they host. */
export function readPerson(text: string | null): { links: Link[]; shows: HostedShow[] } {
  const links: Link[] = [];
  const shows: HostedShow[] = [];
  for (const r of rows(text)) {
    const kind = r.kind?.value;
    if (kind === "show") {
      const title = r.showLabel?.value?.trim();
      if (!title || /^Q\d+$/.test(title)) continue;
      const had = shows.find((s) => s.title === title);
      const apple = r.apple?.value, feed = r.feed?.value;
      if (had) { if (!had.apple && apple) had.apple = apple; if (!had.feed && feed) had.feed = feed; continue; }
      shows.push({ title, ...(apple ? { apple } : {}), ...(feed ? { feed } : {}) });
    } else if (kind && kind in LINK && r.v?.value) {
      const l = LINK[kind as Link["kind"]](r.v.value.trim());
      // One account of each kind, and at most two sites.
      if (l && !links.some((x) => x.href === l.href) && (l.kind === "site" ? links.filter((x) => x.kind === "site").length < 2 : !links.some((x) => x.kind === l.kind))) links.push(l);
    }
  }
  links.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return { links, shows };
}

/**
 * Apple's podcast search (`entity=podcast`) read into shows named as the person's own: "The Ben Shapiro Show",
 * "Titans on Tomorrow with Ben Shapiro", "Lex Fridman Podcast", or any show Apple lists by them. A show that is only
 * about them ("If Ben Shapiro Were a Democrat", "Ben Shapiro - Biography Flash") is left out.
 */
export function namedShows(text: string | null, name: string): (HostedShow & { image?: string; by?: string })[] {
  let results: unknown = [];
  try { results = (JSON.parse(text ?? "") as { results?: unknown }).results ?? []; } catch { return []; }
  const who = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const own = new RegExp(`^(?:the )?${who}(?:'s?)? (?:show|podcast|hour|program|experience)\\b|\\b(?:with|w/|hosted by|featuring) ${who}\\s*$|^${who}(?: podcast)?$`, "i");
  return (Array.isArray(results) ? results : []).flatMap((r: Record<string, unknown>) => {
    const title = typeof r.collectionName === "string" ? r.collectionName.trim() : "";
    const artist = typeof r.artistName === "string" ? r.artistName.trim().toLowerCase() : "";
    if (!title || typeof r.collectionId !== "number" || !(own.test(title) || artist === name.toLowerCase())) return [];
    const image = typeof r.artworkUrl600 === "string" ? r.artworkUrl600 : undefined;
    const by = typeof r.artistName === "string" ? r.artistName : undefined;
    const feed = typeof r.feedUrl === "string" ? r.feedUrl : undefined;
    return [{ title, apple: String(r.collectionId), ...(feed ? { feed } : {}), ...(image ? { image } : {}), ...(by ? { by } : {}) }];
  }).slice(0, 4);
}
