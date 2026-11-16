/**
 * Articles read inside Scholē (Torian, 2026-11-16 03:09Z: "articles about the times, similar to how we include books";
 * "go" at 03:19Z on the guide "Philosophers and music"). The first source is Wikipedia, whose text may be shown with
 * credit under CC BY-SA 4.0. Only articles a person page names are read, as plain text (no HTML from outside),
 * and no model summarizes them. Pure: the text is read here; the fetch is the server's.
 */
import { PEOPLE } from "./historical-people";

export type Block = { kind: "h"; level: 2 | 3; text: string } | { kind: "p"; text: string };
export type Article = { title: string; url: string; blocks: Block[] };

/** Sections of reference apparatus, left out. */
const SKIP = /^(see also|references|notes|footnotes|citations|sources|bibliography|further reading|external links|works cited|literature)$/i;

/** The articles Scholē reads, by title: every one a person page names. */
export function articleTitles(): string[] {
  return [...new Set(PEOPLE.flatMap((x) => x.articles.map((a) => a.title)))];
}

/** Whether a title is one Scholē reads. */
export const readsArticle = (title: string): boolean => articleTitles().includes(title);

/** A title as it goes in a path: "Musical_system_of_ancient_Greece". */
export const articleSlug = (title: string): string => encodeURIComponent(title.replace(/ /g, "_"));
export const articleOfSlug = (slug: string): string => decodeURIComponent(slug).replace(/_/g, " ");

/** Wikipedia's plain-text extract ("== History ==" headings) as headings and paragraphs, apparatus left out. */
export function readExtract(text: string): Block[] {
  const out: Block[] = [];
  let skipping = 0;
  for (const raw of text.split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const h = /^(={2,6})\s*(.*?)\s*\1$/.exec(line);
    if (h) {
      const level = h[1]!.length;
      if (skipping && level > skipping) continue;
      skipping = SKIP.test(h[2]!) ? level : 0;
      if (!skipping && h[2]) out.push({ kind: "h", level: level === 2 ? 2 : 3, text: h[2] });
      continue;
    }
    if (!skipping) out.push({ kind: "p", text: line });
  }
  // A heading with nothing under it says nothing.
  return out.filter((b, i) => b.kind === "p" || (out[i + 1] !== undefined && !(out[i + 1]!.kind === "h" && (out[i + 1] as { level: number }).level <= b.level)));
}

/** Reads the MediaWiki answer for one page (formatversion 2) into an article; null when it is missing or empty. */
export function readArticle(json: string | null): Article | null {
  if (!json) return null;
  try {
    const page = (JSON.parse(json) as { query?: { pages?: { title?: string; fullurl?: string; extract?: string; missing?: boolean }[] } }).query?.pages?.[0];
    if (!page || page.missing || !page.title || !page.extract) return null;
    const blocks = readExtract(page.extract);
    return blocks.length ? { title: page.title, url: page.fullurl ?? `https://en.wikipedia.org/wiki/${articleSlug(page.title)}`, blocks } : null;
  } catch { return null; }
}
