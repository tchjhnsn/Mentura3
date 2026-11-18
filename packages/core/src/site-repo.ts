// A personal site the person hosts themselves, controlled from Reflect through GitHub (Torian, 2026-11-18 20:47Z:
// "reflect should just be able to control the personal website (if it isn't hosted by reflect) through github").
// The site's repository is theirs; Reflect writes posts into it as commits through their GitHub connector and their
// host redeploys on push. Pure: the repository's name, where its posts live, and a post written the way that
// repository already writes them.

/** "owner/name" from what someone typed: owner/name, or a github.com address. Null when it is neither. */
export function cleanRepo(raw: unknown): string | null {
  const s = String(raw ?? "").trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\.git$/i, "").replace(/\/+$/, "");
  const m = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/.exec(s);
  return m && m[2] !== "." && m[2] !== ".." ? `${m[1]}/${m[2]}` : null;
}

/** Where blog starters keep posts, most likely first. */
export const POST_FOLDERS = ["content/posts", "app/blog/posts", "content/blog", "src/content/blog", "src/content/posts", "posts", "_posts", "blog", "src/posts", "data/blog"] as const;

export type PostsPlace = { folder: string; ext: "md" | "mdx" };

/**
 * The folder that holds the site's posts and their extension, from the repository's file paths: the folder with the
 * most Markdown files among the usual places, else any folder named posts or blog with Markdown in it. Ties go to the
 * order of POST_FOLDERS. Null when no folder holds Markdown.
 */
export function findPostsPlace(paths: readonly string[]): PostsPlace | null {
  const md = paths.filter((p) => /\.mdx?$/i.test(p) && !/(^|\/)(node_modules|\.next|archive)\//.test(p) && !/(^|\/)(README|CHANGELOG|LICENSE|AGENTS|CLAUDE)\.mdx?$/i.test(p));
  const byFolder = new Map<string, string[]>();
  for (const p of md) {
    const i = p.lastIndexOf("/");
    const f = i < 0 ? "" : p.slice(0, i);
    byFolder.set(f, [...(byFolder.get(f) ?? []), p]);
  }
  const extOf = (files: string[]): "md" | "mdx" => (files.filter((f) => /\.mdx$/i.test(f)).length > files.length / 2 ? "mdx" : "md");
  let best: { folder: string; n: number; rank: number } | null = null;
  for (const [folder, files] of byFolder) {
    const known = (POST_FOLDERS as readonly string[]).indexOf(folder);
    const named = /(^|\/)(posts|blog|articles|writing|essays)$/i.test(folder);
    if (known < 0 && !named) continue;
    const rank = known < 0 ? POST_FOLDERS.length : known;
    if (!best || files.length > best.n || (files.length === best.n && rank < best.rank)) best = { folder, n: files.length, rank };
  }
  return best ? { folder: best.folder, ext: extOf(byFolder.get(best.folder)!) } : null;
}

/** The keys of a Markdown file's front matter, in order, and whether its strings are single-quoted. */
export function frontMatterStyle(text: string): { keys: string[]; quote: "'" | '"' } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const lines = (m?.[1] ?? "").split(/\r?\n/).filter((l) => /^[A-Za-z_][\w-]*:/.test(l));
  const keys = lines.map((l) => l.slice(0, l.indexOf(":")).trim());
  const single = lines.filter((l) => /:\s*'/.test(l)).length;
  const double = lines.filter((l) => /:\s*"/.test(l)).length;
  return { keys, quote: single > double ? "'" : '"' };
}

export type RepoPost = { slug: string; title: string; kind: string; body: string; summary: string; publishedAt: string; updatedAt: string };

const DATE = /^(publishedAt|published|date|pubDate|publishDate|created)$/;
const UPDATED = /^(updatedAt|updated|lastmod|modified|updatedDate)$/;
const SUMMARY = /^(summary|description|excerpt|subtitle)$/;

/**
 * One post as a Markdown file written the way the repository already writes its posts: the front matter keys of an
 * existing post (title, a date, an updated date, a summary, a kind), in its order and quote style. Keys Reflect cannot
 * fill are left out. With no existing post it writes Reflect's own export format (title, kind, published, updated).
 */
export function repoPostFile(p: RepoPost, sample: string | null): string {
  const style = sample ? frontMatterStyle(sample) : null;
  const keys = style?.keys.length ? style.keys : ["title", "kind", "published", "updated"];
  const q = (s: string) => (style?.quote === "'" ? `'${s.replace(/'/g, "''")}'` : JSON.stringify(s));
  const own = !!style?.keys.length;
  const day = (iso: string) => (own ? q(iso.slice(0, 10)) : iso);
  const out: string[] = [];
  let summaryDone = false;
  for (const k of keys) {
    if (k === "title") out.push(`title: ${q(p.title)}`);
    else if (DATE.test(k)) out.push(`${k}: ${day(p.publishedAt)}`);
    else if (UPDATED.test(k)) out.push(`${k}: ${day(p.updatedAt)}`);
    else if (SUMMARY.test(k) && !summaryDone && k !== "subtitle") {
      out.push(`${k}: ${q(p.summary)}`);
      summaryDone = true;
    } else if (k === "kind" || k === "category") out.push(`${k}: ${own ? q(p.kind) : p.kind}`);
  }
  if (!out.some((l) => l.startsWith("title:"))) out.unshift(`title: ${q(p.title)}`);
  return `---\n${out.join("\n")}\n---\n\n${p.body.trim()}\n`;
}

/** A post's path in the repository. */
export const repoPostPath = (place: PostsPlace, slug: string) => `${place.folder ? `${place.folder}/` : ""}${slug}.${place.ext}`;

/** The branch to write to: main, else master, else the first one listed. */
export const pickBranch = (branches: readonly string[]): string | null => (branches.includes("main") ? "main" : branches.includes("master") ? "master" : branches[0] ?? null);
