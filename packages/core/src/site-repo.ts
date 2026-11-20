// A personal site the person hosts themselves, in its own repository (Torian, 2026-11-18 20:47Z). Since 2026-11-20
// ("Files out, no site code") Reflect does not edit the site: it delivers the files of its published/ folder
// (./published.ts) into the repository's content folders only, the posts folder and a folder for profile.json, works.json
// and index.json, through the person's GitHub connector, and their host redeploys on push. The site's code is written in
// its own repository, with Claude Code or Virtu. Pure: the repository's name, where its posts live, where each
// published file lands, and whether a path is inside the content folders.

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

/** A post's path in the repository. */
export const repoPostPath = (place: PostsPlace, slug: string) => `${place.folder ? `${place.folder}/` : ""}${slug}.${place.ext}`;

/** The branch to write to: main, else master, else the first one listed. */
export const pickBranch = (branches: readonly string[]): string | null => (branches.includes("main") ? "main" : branches.includes("master") ? "master" : branches[0] ?? null);

/**
 * Whether a GitHub tool's arguments name this repository ("owner/name"): `owner` with `repo`, or a whole name in
 * `repo`, `repository` or `full_name`, in any case. It tells a write to the person's site repository, which goes
 * public when their host redeploys, from a write anywhere else.
 */
export function namesRepo(args: unknown, repo: string): boolean {
  if (!args || typeof args !== "object") return false;
  const a = args as Record<string, unknown>;
  const want = repo.toLowerCase();
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (str(a.owner) && str(a.repo) && `${str(a.owner)}/${str(a.repo)}`.toLowerCase() === want) return true;
  return [a.repo, a.repository, a.full_name].some((v) => cleanRepo(v)?.toLowerCase() === want);
}

/** Where profile.json, works.json and index.json land in the site's repository unless the person names another folder. */
export const DEFAULT_DATA_FOLDER = "content/reflect";

/** A folder in a repository as someone typed it: relative, no "..", no leading or trailing slash. Null otherwise. */
export function cleanFolder(raw: unknown): string | null {
  const f = String(raw ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!f || f.length > 200 || !/^[A-Za-z0-9._\/-]+$/.test(f)) return null;
  return f.split("/").some((part) => part === "" || part === "." || part === "..") ? null : f;
}

/** The files of published/ that land in the data folder. */
const DATA_FILES: readonly string[] = ["profile.json", "works.json", "index.json"];

const SLUG_PART = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

/** The content folders of the site's repository: the posts folder with its extension, and the folder for the data. */
export type ContentPlace = { posts: string; ext: "md" | "mdx"; data: string };

/**
 * Where a file of published/ lands in the site's repository: a post in the posts folder (with the folder's extension),
 * profile.json, works.json and index.json in the data folder. Any other path is refused.
 */
export function contentPath(place: ContentPlace, publishedPath: string): string {
  const post = /^posts\/([a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?)\.md$/.exec(publishedPath);
  if (post) return repoPostPath({ folder: place.posts, ext: place.ext }, post[1]!);
  if (DATA_FILES.includes(publishedPath)) return `${place.data}/${publishedPath}`;
  throw new Error(`Reflect delivers only its posts, profile.json, works.json and index.json; ${publishedPath} is none of them.`);
}

/**
 * Whether a repository path is inside the content folders: a post file directly in the posts folder, or profile.json,
 * works.json or index.json in the data folder. Reflect writes nothing else in the site's repository.
 */
export function insideContent(place: ContentPlace, repoPath: string): boolean {
  if (DATA_FILES.some((f) => repoPath === `${place.data}/${f}`)) return true;
  const prefix = place.posts ? `${place.posts}/` : "";
  if (!repoPath.startsWith(prefix) || !repoPath.endsWith(`.${place.ext}`)) return false;
  return SLUG_PART.test(repoPath.slice(prefix.length, -(place.ext.length + 1)));
}
