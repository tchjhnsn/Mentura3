// The site's pages in the exported Next.js project (plan "Appearance, Virtu and the site editor", PR 5: "MDX export").
// Each published page is content/pages/<path>.mdx (Home is index.mdx), rendered at build time by next-mdx-remote with a
// component map in components/reflect/ that draws what Reflect's renderer draws (web/src/app/p/[key]/page-view.tsx),
// with the same class names, so the site design's CSS (app/design.css: Virtu's --virtu- properties, the site's look and
// each block's shape and frame) applies the same. A <Part> is a snapshot in content/parts/<id>.json, taken at export
// and only for parts the access rule allows. Pure: site-export.ts calls it for the files.
import { pageToMdx, type PartSnapshot } from "./site-mdx";
import { HOME } from "./site-page";

export type ExportPage = { path: string; title: string; body: string };
export type ExportSite = {
  /** The published pages: Home (path ""), Writing and added pages, with their published Markdown. */
  pages: readonly ExportPage[];
  /** The parts the pages may show, by source: only those mayShowPart allows. */
  parts: ReadonlyMap<string, PartSnapshot>;
  /** The site's design as CSS: Virtu's tokens, the site's look, and the block shapes and frames the pages name. */
  css: string;
  /** The shapes in the catalog that draw an edge, so a block's surface gets virtu-edge only under those. */
  edged: readonly string[];
};

export const NO_SITE: ExportSite = { pages: [], parts: new Map(), css: "", edged: [] };

/** The pinned version of next-mdx-remote the project installs (6.0.0, 2026-02-12). */
export const MDX_REMOTE = "6.0.0";

/** A page's file name under content/pages/: Home is index. */
export const pageFileName = (path: string) => `${path === HOME ? "index" : path}.mdx`;

/** A page as its MDX file: a front matter with the title, then the page. */
export function pageFile(title: string, mdx: string): string {
  return `---\ntitle: ${JSON.stringify(title)}\n---\n\n${mdx}`;
}

/** Every file the pages add: the pages, the part snapshots, the design, the page reader and the component map. */
export function pageFiles(site: ExportSite): Record<string, string> {
  const files: Record<string, string> = {};
  for (const p of site.pages) {
    const { mdx, parts } = pageToMdx(p.body, site.parts);
    files[`content/pages/${pageFileName(p.path)}`] = pageFile(p.title, mdx);
    for (const [id, snap] of Object.entries(parts)) files[`content/parts/${id}.json`] = `${JSON.stringify(snap, null, 2)}\n`;
  }
  files["app/design.css"] = designCss(site.css);
  files["lib/pages.ts"] = PAGES_TS;
  files["components/reflect/look.tsx"] = lookTsx(site.edged);
  files["components/reflect/media.tsx"] = MEDIA_TSX;
  files["components/reflect/writing.tsx"] = WRITING_TSX;
  files["components/reflect/you.tsx"] = YOU_TSX;
  files["components/reflect/part.tsx"] = PART_TSX;
  files["components/reflect/index.tsx"] = INDEX_TSX;
  files["components/reflect/mdx-page.tsx"] = MDX_PAGE_TSX;
  return files;
}

/** The site's design, then the page's colours and type mapped onto it as Reflect's .site-design does. */
export function designCss(css: string): string {
  const head = "/* Your site's design from Reflect: Virtu's --virtu- properties, the site's look, and each block's shape and frame. */\n";
  if (!css.trim()) return `${head}/* No design was set, so the plain colours in globals.css apply. */\n`;
  return `${head}${css.trim()}

body.site-design {
  --fg: var(--virtu-color-role-foreground);
  --bg: var(--virtu-color-role-background);
  --muted: var(--virtu-color-role-muted-foreground);
  --line: var(--virtu-color-role-border);
  --accent: var(--virtu-color-role-primary);
  --surface: var(--virtu-color-role-muted);
  font-family: var(--virtu-type-family-body);
}
body.site-design :is(h1, h2, h3) { font-family: var(--virtu-type-family-display); font-weight: var(--virtu-type-weight-heading); }
body.site-design :is(p, li) > a { color: var(--virtu-color-role-link); }
`;
}

/** The styles of the components, added to globals.css. */
export const COMPONENT_CSS = `
.page-body { display: grid; gap: 28px; }
.page-body > * { margin: 0; }
.page-body figure { margin: 0; display: grid; gap: 8px; }
.page-body figcaption { text-align: center; color: var(--muted); font-size: 0.875rem; }
.photo { display: block; width: 100%; border-radius: 12px; object-fit: cover; }
.gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
@media (min-width: 640px) { .gallery { grid-template-columns: repeat(3, 1fr); } }
.gallery img { display: block; aspect-ratio: 1; width: 100%; object-fit: cover; border-radius: 8px; }
.video { aspect-ratio: 16 / 9; width: 100%; border: 0; border-radius: 12px; }
.embed { display: grid; gap: 2px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; text-decoration: none; }
.quote { margin: 0; padding-left: 16px; border-left: 2px solid var(--line); font-family: Georgia, "Iowan Old Style", serif; font-size: 1.125rem; font-style: italic; }
.quote footer { margin-top: 8px; border: 0; padding: 0; font-size: 0.875rem; font-style: normal; color: var(--muted); }
.quote.shaped { border-left: 0; padding: 20px; background: var(--surface, rgba(127, 127, 127, 0.08)); }
.callout { padding: 16px; border-radius: 12px; white-space: pre-line; background: var(--surface, rgba(127, 127, 127, 0.08)); }
.button { display: inline-block; padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; text-decoration: none; }
.profile { display: flex; align-items: flex-start; gap: 16px; }
.profile.shaped { padding: 20px; background: var(--surface, rgba(127, 127, 127, 0.08)); }
.profile h1 { margin: 4px 0 0; }
.face { display: grid; place-items: center; width: 80px; height: 80px; flex: none; border-radius: 9999px; background: var(--line); font-size: 1.75rem; font-weight: 600; }
.links { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 0; padding: 0; }
.links a { display: inline-block; padding: 6px 12px; border: 1px solid var(--line); border-radius: 9999px; font-size: 0.875rem; text-decoration: none; }
.part { display: grid; gap: 8px; }
.part.boxed { padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface, rgba(127, 127, 127, 0.08)); }
.part h3 { margin: 0; }
.part ul { margin: 0; padding-left: 20px; }
.now h2 { margin: 0 0 4px; font-size: 0.875rem; color: var(--muted); }
`;

const PAGES_TS = `import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** A page of the site: its address ("" for Home), its title and its MDX. */
export type Page = { path: string; title: string; source: string };

const DIR = join(process.cwd(), "content", "pages");

function read(name: string): Page {
  const text = readFileSync(join(DIR, name), "utf8");
  const m = /^---\\n([\\s\\S]*?)\\n---\\n?/.exec(text);
  const t = /^title:\\s*(.+)$/m.exec(m?.[1] ?? "");
  const raw = t?.[1]?.trim() ?? "";
  const path = name.replace(/\\.mdx$/, "");
  return { path: path === "index" ? "" : path, title: raw.startsWith('"') ? JSON.parse(raw) : raw || path, source: m ? text.slice(m[0].length) : text };
}

/** Every page in content/pages/. */
export function pages(): Page[] {
  try {
    return readdirSync(DIR).filter((n) => n.endsWith(".mdx")).map(read);
  } catch {
    return [];
  }
}

export const page = (path: string) => pages().find((p) => p.path === path) ?? null;
`;

function lookTsx(edged: readonly string[]): string {
  return `import type { ReactNode } from "react";

/*
 * A block's shape and frame, as on Reflect: the wrapper carries virtu-block-shape-<name> and virtu-block-frame-<name>,
 * which app/design.css styles, and the block's surface carries the shape's corner (and its edge, when it has one).
 */
export type Look = { shape?: string; frame?: string };

const EDGED = new Set<string>(${JSON.stringify([...edged])});

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** The classes for a block's surface under its shape. */
export const surface = (shape?: string) => (shape ? cx("virtu-shape-card", EDGED.has(shape) && "virtu-edge") : "");

export function Dress({ shape, frame, children }: Look & { children: ReactNode }) {
  if (!shape && !frame) return <>{children}</>;
  return <div className={cx(shape && "virtu-block-shape-" + shape, frame && "virtu-block-frame-" + frame)}>{children}</div>;
}

/** A web address a page may point to: https or http, or a path on this site. */
export const safeUrl = (u?: string) => (typeof u === "string" && /^(https?:\\/\\/[^/]|\\/(?!\\/))/i.test(u) && !/[\\s<>"]/.test(u) ? u : null);
`;
}

const MEDIA_TSX = `import { cx, Dress, safeUrl, surface, type Look } from "./look";

const host = (u: string) => {
  try {
    return new URL(u).host.replace(/^www\\./, "");
  } catch {
    return u;
  }
};

function videoEmbed(src: string): string | null {
  const y = /^https:\\/\\/(?:www\\.)?(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([\\w-]{6,20})/.exec(src);
  if (y) return "https://www.youtube-nocookie.com/embed/" + y[1];
  const v = /^https:\\/\\/(?:www\\.)?vimeo\\.com\\/(\\d{4,12})/.exec(src);
  return v ? "https://player.vimeo.com/video/" + v[1] : null;
}

export function Photo({ src, alt, caption, shape, frame }: { src: string; alt?: string; caption?: string } & Look) {
  const s = safeUrl(src);
  if (!s) return null;
  return (
    <Dress shape={shape} frame={frame}>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s} alt={alt ?? ""} loading="lazy" className={cx("photo virtu-shape-photo", surface(shape))} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </Dress>
  );
}

export function Gallery({ images, caption, shape, frame }: { images: string[]; caption?: string } & Look) {
  const srcs = (Array.isArray(images) ? images : []).map(safeUrl).filter((s): s is string => !!s);
  return (
    <Dress shape={shape} frame={frame}>
      <figure>
        <div className="gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {srcs.map((s, i) => <img key={i} src={s} alt="" loading="lazy" className={surface(shape)} />)}
        </div>
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    </Dress>
  );
}

export function Video({ src, caption }: { src: string; caption?: string }) {
  const s = safeUrl(src);
  if (!s) return null;
  const embed = videoEmbed(s);
  return (
    <figure>
      {embed ? <iframe src={embed} title={caption || "Video"} allow="encrypted-media; picture-in-picture; fullscreen" className="video" /> : <video src={s} controls className="video" />}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function Audio({ src, title }: { src: string; title?: string }) {
  const s = safeUrl(src);
  return s ? <figure>{title ? <figcaption>{title}</figcaption> : null}<audio src={s} controls style={{ width: "100%" }} /></figure> : null;
}

export function Embed({ url, title }: { url: string; title?: string }) {
  const u = safeUrl(url);
  return u ? (
    <a href={u} target="_blank" rel="noreferrer nofollow" className="embed">
      <strong>{title || host(u)}</strong>
      <span className="muted small">{host(u)}</span>
    </a>
  ) : null;
}
`;

const WRITING_TSX = `import Link from "next/link";
import { day, minutes, posts } from "@/lib/content";
import { cx, Dress, safeUrl, surface, type Look } from "./look";

export function Quote({ text, cite, shape, frame }: { text: string; cite?: string } & Look) {
  return (
    <Dress shape={shape} frame={frame}>
      <blockquote className={cx("quote", shape && "shaped", surface(shape))}>
        <p style={{ margin: 0, whiteSpace: "pre-line" }}>{text}</p>
        {cite ? <footer>{cite}</footer> : null}
      </blockquote>
    </Dress>
  );
}

export function Callout({ text, shape, frame }: { text: string } & Look) {
  return <Dress shape={shape} frame={frame}><div className={cx("callout", surface(shape))}>{text}</div></Dress>;
}

export function Divider() {
  return <hr style={{ border: 0, borderTop: "1px solid var(--line)", width: "100%" }} />;
}

export function Button({ label, href }: { label: string; href: string }) {
  const h = safeUrl(href);
  return h ? <div><a href={h} className="button">{label}</a></div> : null;
}

export function PostList({ limit = 3 }: { limit?: number }) {
  const all = posts();
  if (!all.length) return null;
  return (
    <div>
      <ul className="plain">
        {all.slice(0, limit).map((p) => (
          <li key={p.slug}>
            <Link href={"/" + p.slug}>{p.title}</Link>
            <div className="muted small">{day(p.published)} · {minutes(p.body)} min read</div>
          </li>
        ))}
      </ul>
      {all.length > limit ? <p className="small"><Link href="/writing">All writing</Link></p> : null}
    </div>
  );
}

export function Now({ text }: { text: string }) {
  return (
    <section className="now">
      <h2>Now</h2>
      <p style={{ margin: 0, whiteSpace: "pre-line" }}>{text}</p>
    </section>
  );
}
`;

const YOU_TSX = `import { profile } from "@/lib/content";
import { cx, Dress, surface, type Look } from "./look";

const initials = (name: string) => name.split(/\\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Face, name and handle, with the site look's slot classes as on Reflect. */
export function ProfileCard({ shape, frame }: Look) {
  return (
    <Dress shape={shape} frame={frame}>
      <section aria-label="Who" className={cx("profile virtu-slot-card virtu-shape-card", shape && "shaped", surface(shape))}>
        <div className="face virtu-slot-avatar virtu-shape-avatar">{initials(profile.name)}</div>
        <div>
          <h1>{profile.name}</h1>
          {profile.handle ? <p className="muted small" style={{ margin: 0 }}>@{profile.handle}</p> : null}
        </div>
      </section>
    </Dress>
  );
}

export function Links() {
  if (!profile.socials.length) return null;
  return (
    <ul className="links">
      {profile.socials.map((s) => <li key={s.url}><a href={s.url} rel="me noreferrer" target="_blank">{s.label}</a></li>)}
    </ul>
  );
}
`;

const PART_TSX = `import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cx, Dress, surface, type Look } from "./look";

type Snapshot = { title: string; lines: string[]; items: string[] };

/** A part of a tile or the household as it was when the site was exported (content/parts/<id>.json). */
export function Part({ snapshot, view = "card", shape, frame }: { snapshot: string; view?: string } & Look) {
  if (!/^[0-9a-f]{16}$/.test(snapshot ?? "")) return null;
  let s: Snapshot;
  try {
    s = JSON.parse(readFileSync(join(process.cwd(), "content", "parts", snapshot + ".json"), "utf8")) as Snapshot;
  } catch {
    return null;
  }
  return (
    <Dress shape={shape} frame={frame}>
      <section className={cx("part", (view === "card" || shape) && "boxed virtu-shape-card", surface(shape))}>
        <h3>{s.title}</h3>
        {s.lines.length ? <p className="muted small" style={{ margin: 0 }}>{s.lines.join(" · ")}</p> : null}
        {s.items.length ? <ul className="small">{s.items.map((i, n) => <li key={n}>{i}</li>)}</ul> : null}
      </section>
    </Dress>
  );
}
`;

const INDEX_TSX = `import { Audio, Embed, Gallery, Photo, Video } from "./media";
import { Part } from "./part";
import { Button, Callout, Divider, Now, PostList, Quote } from "./writing";
import { Links, ProfileCard } from "./you";

/** Every component a page may hold, as Reflect's library names them. A page holds no other code. */
export const components = { Photo, Gallery, Video, Audio, Embed, Quote, Callout, Divider, Button, PostList, ProfileCard, Links, Now, Part };
`;

const MDX_PAGE_TSX = `import { MDXRemote } from "next-mdx-remote/rsc";
import { components } from "./index";

/**
 * A page's MDX drawn with the component map. Its values are literal (words, numbers, lists), which next-mdx-remote
 * reads as expressions, so blockJS is off; blockDangerousJS stays on.
 */
export function MdxPage({ source }: { source: string }) {
  return (
    <div className="page-body">
      <MDXRemote source={source} components={components} options={{ blockJS: false, blockDangerousJS: true }} />
    </div>
  );
}
`;
