// A person's own site and blog (doc "Personal site and blog design guide", 2026-11-18). The profile at /p/<handle> is
// the site; a post is a published copy of one journal work, made public only when the person taps Publish. The
// journal itself is never published: entries, examinations, exercises and decisions cannot be posted. Everything
// here is pure: slugs, templates, reading time, a small safe Markdown renderer, the RSS feed and the files of the
// exported Next.js project.
import type { WorkKind } from "./works";

/** The kinds of work that can be published. A journal entry, an examination, an exercise or a decision never can. */
export const PUBLISHABLE: readonly WorkKind[] = ["essay", "letter", "plan", "memoir"];
export const isPublishable = (k: unknown): k is WorkKind => typeof k === "string" && (PUBLISHABLE as readonly string[]).includes(k);

/** The site's look. Plain is the profile as it is; Builder puts what the person builds first; Notebook is a serif reading layout with writing first. */
export const TEMPLATES = [
  { id: "plain", label: "Plain", line: "Your profile as it is, with your writing first." },
  { id: "builder", label: "Builder", line: "What you are building first, then your writing." },
  { id: "notebook", label: "Notebook", line: "A serif reading layout: your writing as a list." },
] as const;
export type TemplateId = (typeof TEMPLATES)[number]["id"];
export const isTemplate = (t: unknown): t is TemplateId => typeof t === "string" && TEMPLATES.some((x) => x.id === t);

/** A post's address on the site: lowercase letters, digits and hyphens, 1 to 60 characters, not starting or ending with a hyphen. */
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
export const isSlug = (s: unknown): s is string => typeof s === "string" && SLUG.test(s);
/** Words the site's own pages use, so no post may take them. */
export const RESERVED_SLUGS = ["feed.xml", "rss", "subscribe", "writing", "edit", "settings"];

/** A slug from a title: accents dropped, everything else not a letter or digit made a hyphen. "post" when nothing is left. */
export function slugify(title: string): string {
  const s = title.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const cut = s.slice(0, 60).replace(/-+$/g, "");
  return cut && !RESERVED_SLUGS.includes(cut) ? cut : "post";
}

/** The next free slug: the wanted one, else it with -2, -3 and so on. */
export function freeSlug(want: string, taken: readonly string[]): string {
  const base = isSlug(want) ? want : slugify(want);
  if (!taken.includes(base)) return base;
  for (let i = 2; ; i++) {
    const s = `${base.slice(0, 60 - String(i).length - 1).replace(/-+$/g, "")}-${i}`;
    if (!taken.includes(s)) return s;
  }
}

/** Minutes to read at 230 words a minute, at least one. */
export function readingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/** Markdown as plain text: marks, links and headings stripped. */
export function plainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The opening of a post, for lists and the feed: up to `max` characters, cut at a word. */
export function excerpt(md: string, max = 180): string {
  const t = plainText(md);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s.,;:]+$/, "")}...`;
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const safeHref = (u: string) => {
  const t = u.trim();
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(t) ? t : null;
};

/** Inline marks on already escaped text: code, bold, italic, links. */
function inline(raw: string): string {
  const codes: string[] = [];
  let s = escapeHtml(raw).replace(/`([^`]+)`/g, (_m, c: string) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text: string, href: string) => {
    const h = safeHref(href.replace(/&amp;/g, "&"));
    return h ? `<a href="${escapeHtml(h)}" rel="nofollow">${text}</a>` : text;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>").replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => codes[Number(i)] ?? "");
}

/** A heading's id: its text as a slug. */
export const headingId = (text: string) => slugify(plainText(text)) || "section";

/** The second-level headings of a post, for its contents. */
export function headings(md: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  let fence = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ id: headingId(m[1]!), text: plainText(m[1]!) });
  }
  return out;
}

/**
 * Markdown to HTML, safe to put on a page: every character of the source is escaped, and only these marks become
 * tags: headings, paragraphs, block quotes, lists, code, rules, bold, italic and links (web and mail links only).
 */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  const para: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`);
    para.length = 0;
  };
  while (i < lines.length) {
    const line = lines[i]!;
    if (/^\s*```/.test(line)) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]!)) code.push(lines[i++]!);
      i++;
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      flush();
      const level = Math.min(6, h[1]!.length + (h[1]!.length === 1 ? 1 : 0));
      out.push(`<h${level} id="${headingId(h[2]!)}">${inline(h[2]!)}</h${level}>`);
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      out.push("<hr>");
      i++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      flush();
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i]!)) q.push(lines[i++]!.replace(/^\s*>\s?/, ""));
      out.push(`<blockquote>${markdownToHtml(q.join("\n"))}</blockquote>`);
      continue;
    }
    const ul = /^\s*[-*+]\s+/;
    const ol = /^\s*\d+[.)]\s+/;
    if (ul.test(line) || ol.test(line)) {
      flush();
      const re = ul.test(line) ? ul : ol;
      const tagName = re === ul ? "ul" : "ol";
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i]!)) {
        let item = lines[i++]!.replace(re, "");
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]!) && !re.test(lines[i]!)) item += ` ${lines[i++]!.trim()}`;
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(`<${tagName}>${items.join("")}</${tagName}>`);
      continue;
    }
    if (!line.trim()) {
      flush();
      i++;
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flush();
  return out.join("\n");
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export type FeedPost = { slug: string; title: string; body: string; publishedAt: string; updatedAt?: string };

/** The site's RSS 2.0 feed: each post with its title, link, date and full text. */
export function rssXml(site: { title: string; link: string; description: string }, posts: readonly FeedPost[]): string {
  const base = site.link.replace(/\/+$/, "");
  const items = posts
    .map((p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(`${base}/${p.slug}`)}</link>
      <guid isPermaLink="true">${escapeXml(`${base}/${p.slug}`)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(excerpt(p.body, 300))}</description>
      <content:encoded><![CDATA[${markdownToHtml(p.body).replace(/]]>/g, "]]&gt;")}]]></content:encoded>
    </item>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(site.description)}</description>
${items}
  </channel>
</rss>
`;
}

/** What subscribers download: one email a line under a header, confirmed ones only. */
export function subscribersCsv(rows: readonly { email: string; confirmedAt: string }[]): string {
  const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return ["email,subscribed_at", ...rows.map((r) => `${cell(r.email)},${r.confirmedAt}`)].join("\n") + "\n";
}

/** A sane email address, lowercased and trimmed, or null. */
export function cleanEmail(raw: unknown): string | null {
  const e = String(raw ?? "").trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}

/** A domain the person can point at their site: a lowercase host name with at least one dot, no scheme or path. */
export function cleanDomain(raw: unknown): string | null {
  const d = String(raw ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  return d.length <= 253 && /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d) ? d : null;
}

/** Where a custom domain's CNAME record points. */
export const CNAME_TARGET = "cname.vercel-dns.com";
