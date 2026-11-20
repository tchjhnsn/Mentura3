// A personal site the person hosts themselves (Torian, 2026-11-18 20:47Z), in its own repository. Reflect outputs files
// and never the site's code (Torian, 2026-11-20 03:16Z, "Files out, no site code"): Publish delivers the post file and
// the manifest that @reflect/core/published made through the presentation gate into the repository's content folders
// only (the posts folder linking found, and a folder for profile.json and index.json, content/reflect unless the
// person names another), and Unpublish takes the post and its manifest line out. Any other path is refused. Everything
// runs through the person's own GitHub connector; their host redeploys on each push. Ask Reflect may read the
// repository; the site's code is changed in its own repository, with Claude Code or Virtu.
import { cleanRepo, contentPath, findPostsPlace, insideContent, pickBranch, POST_FOLDERS, type ContentPlace, type PostsPlace } from "@reflect/core/site-repo";
import { emptyIndex, isGated, parseIndex, postPath, publishPost, slugOfPath, unpublish, type Approval, type Publication, type PublishedIndex } from "@reflect/core/published";
import { callToolTexts, connectedTo, toolsOf, type Connection } from "./mcp-connections";
import { postRepoPath, setPostRepoPath, siteDataFolder, siteOf, type Post, type SiteRepo } from "./site-store";

const parse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

async function github(userId: string): Promise<Connection> {
  const c = await connectedTo(userId, "github");
  if (!c) throw new Error("Connect GitHub first (/marketplace/github).");
  return c;
}

const split = (repo: string) => {
  const [owner, name] = repo.split("/") as [string, string];
  return { owner, repo: name };
};

/** Every "path" (or "name" with a "type") the tool's answer lists. */
function pathsIn(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) for (const x of v) pathsIn(x, out);
  else if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.path === "string" && (o.type === undefined || o.type === "file" || o.type === "blob")) out.push(o.path);
    for (const k of ["tree", "items", "entries", "files"]) if (o[k]) pathsIn(o[k], out);
  }
  return out;
}

/** A file's text and its blob sha, or null when it is not there. */
export async function readRepoFile(userId: string, repo: string, path: string, ref?: string): Promise<{ text: string; sha: string | null } | null> {
  const c = await github(userId);
  try {
    const r = await callToolTexts(userId, c.id, "get_file_contents", { ...split(repo), path, ...(ref ? { ref } : {}) });
    const all = r.texts.join("\n");
    const meta = parse(all) as { content?: string; encoding?: string; sha?: string } | null;
    const sha = /SHA:\s*([0-9a-f]{40})/i.exec(all)?.[1] ?? (meta && typeof meta.sha === "string" ? meta.sha : null);
    if (r.resources.length) return { text: r.resources.join("\n"), sha };
    if (meta?.content && meta.encoding === "base64") return { text: Buffer.from(meta.content, "base64").toString("utf8"), sha };
    if (Array.isArray(parse(all))) return null;
    return { text: all, sha };
  } catch (e) {
    if (e instanceof Error && /not\s*found|404|no such/i.test(e.message)) return null;
    throw e;
  }
}

/** The paths of the files in a folder (one level), or [] when it is not there. */
async function listFolder(userId: string, c: Connection, repo: string, path: string, ref?: string): Promise<string[]> {
  try {
    const r = await callToolTexts(userId, c.id, "get_file_contents", { ...split(repo), path: path.endsWith("/") ? path : `${path}/`, ...(ref ? { ref } : {}) });
    return pathsIn(parse(r.texts.join("\n")) ?? r.structured);
  } catch {
    return [];
  }
}

/** Every file path in the repository: the whole tree when the connector offers it, else the usual post folders. */
async function repoPaths(userId: string, c: Connection, repo: string, branch: string): Promise<string[]> {
  const tools = await toolsOf(userId, c.id);
  if (tools.some((t) => t.name === "get_repository_tree")) {
    try {
      const r = await callToolTexts(userId, c.id, "get_repository_tree", { ...split(repo), tree_sha: branch, recursive: true });
      const paths = pathsIn(parse(r.texts.join("\n")) ?? r.structured);
      if (paths.length) return paths;
    } catch {
      // Falls back to the usual folders.
    }
  }
  const found: string[] = [];
  for (const f of POST_FOLDERS) found.push(...(await listFolder(userId, c, repo, f, branch)));
  return found;
}

/** Links the site to a repository: finds its branch and where its posts live. Returns what it found. */
export async function inspectRepo(userId: string, raw: string): Promise<SiteRepo> {
  const repo = cleanRepo(raw);
  if (!repo) throw new Error("Give the repository as owner/name.");
  const c = await github(userId);
  let branches: string[] = [];
  try {
    const r = await callToolTexts(userId, c.id, "list_branches", { ...split(repo) });
    const v = parse(r.texts.join("\n")) ?? r.structured;
    branches = (Array.isArray(v) ? v : []).map((b) => (b as { name?: string }).name).filter((n): n is string => typeof n === "string");
  } catch (e) {
    throw new Error(e instanceof Error && /not\s*found|404/i.test(e.message) ? `GitHub has no repository ${repo} that you can reach.` : "GitHub did not answer. Try again.");
  }
  const branch = pickBranch(branches);
  if (!branch) throw new Error(`${repo} has no branches yet.`);
  const place: PostsPlace = findPostsPlace(await repoPaths(userId, c, repo, branch)) ?? { folder: "content/posts", ext: "md" };
  return { repo, branch, folder: place.folder, ext: place.ext };
}

/** The person's repositories, most recently pushed first, for picking one. */
export async function myRepos(userId: string): Promise<string[]> {
  const c = await github(userId);
  const me = await callToolTexts(userId, c.id, "get_me", {});
  const login = ((me.structured as { login?: string } | null)?.login ?? (parse(me.texts.join("\n")) as { login?: string } | null)?.login) as string | undefined;
  if (!login) return [];
  try {
    const r = await callToolTexts(userId, c.id, "search_repositories", { query: `user:${login} fork:true`, sort: "updated", perPage: 30, minimal_output: true });
    const v = (parse(r.texts.join("\n")) ?? r.structured) as { items?: { full_name?: string }[] } | { full_name?: string }[] | null;
    const items = Array.isArray(v) ? v : (v?.items ?? []);
    return items.map((i) => i.full_name).filter((n): n is string => typeof n === "string").slice(0, 30);
  } catch {
    return [];
  }
}

/** The linked repository and its content folders, or null when the site is not linked. */
export async function contentPlaceOf(userId: string): Promise<{ site: SiteRepo; place: ContentPlace } | null> {
  const site = (await siteOf(userId)).repo;
  if (!site) return null;
  return { site, place: { posts: site.folder, ext: site.ext, data: await siteDataFolder(userId) } };
}

const outside = (site: SiteRepo, place: ContentPlace, path: string) =>
  new Error(`Reflect writes only its content in ${site.repo}: posts in ${place.posts || "the top folder"}/ and profile.json and index.json in ${place.data}/. ${path} is outside them. Your site's code lives in its own repository; change it there with Claude Code or Virtu.`);

/** Writes one file in the content folders as a commit on the branch. Refuses any path outside them. */
export async function writeContentFile(userId: string, site: SiteRepo, place: ContentPlace, path: string, content: string, message: string): Promise<void> {
  if (!insideContent(place, path)) throw outside(site, place, path);
  const c = await github(userId);
  const cur = await readRepoFile(userId, site.repo, path, site.branch);
  await callToolTexts(userId, c.id, "create_or_update_file", { ...split(site.repo), path, content, message, branch: site.branch, ...(cur?.sha ? { sha: cur.sha } : {}) });
}

/** Removes one file in the content folders as a commit. Missing files are fine; a path outside them is refused. */
export async function deleteContentFile(userId: string, site: SiteRepo, place: ContentPlace, path: string, message: string): Promise<void> {
  if (!insideContent(place, path)) throw outside(site, place, path);
  const c = await github(userId);
  const cur = await readRepoFile(userId, site.repo, path, site.branch);
  if (!cur) return;
  await callToolTexts(userId, c.id, "delete_file", { ...split(site.repo), path, message, branch: site.branch, ...(cur.sha ? { sha: cur.sha } : {}) });
}

/** The manifest in the repository's data folder, or an empty one. Throws on a file that is not Reflect's manifest. */
export async function repoIndex(userId: string, site: SiteRepo, place: ContentPlace): Promise<PublishedIndex> {
  const f = await readRepoFile(userId, site.repo, `${place.data}/index.json`, site.branch);
  if (!f) return emptyIndex();
  const r = parseIndex(f.text);
  if (!r.index) throw new Error(`${place.data}/index.json in ${site.repo} is not Reflect's manifest (${r.problems[0]}); move it, or name another folder in Settings, Your site, Your own site on GitHub.`);
  return r.index;
}

/** Delivers a publication made through the gate: its files into the content folders (the manifest last), then removals. */
export async function deliver(userId: string, site: SiteRepo, place: ContentPlace, pub: Publication, message: string): Promise<string[]> {
  if (!isGated(pub)) throw new Error("Only what passed the presentation gate is delivered to your site.");
  const paths = pub.write.map((w) => contentPath(place, w.path));
  const gone = pub.remove.map((r) => contentPath(place, r));
  for (const p of [...paths, ...gone]) if (!insideContent(place, p)) throw outside(site, place, p);
  for (const [i, w] of pub.write.entries()) await writeContentFile(userId, site, place, paths[i]!, w.bytes, message);
  for (const p of gone) await deleteContentFile(userId, site, place, p, message);
  return paths;
}

/** A file in the site's repository, for Ask Reflect: a folder's listing or a file's text. */
export async function browseRepo(userId: string, path: string): Promise<{ repo: string; path: string; files?: string[]; text?: string }> {
  const site = (await siteOf(userId)).repo;
  if (!site) throw new Error("Your site is not linked to a repository (/settings/site/repo).");
  const c = await github(userId);
  const p = path.replace(/^\/+/, "");
  if (!p || p.endsWith("/")) return { repo: site.repo, path: p, files: await listFolder(userId, c, site.repo, p || "/", site.branch) };
  const f = await readRepoFile(userId, site.repo, p, site.branch);
  if (!f) {
    const files = await listFolder(userId, c, site.repo, p, site.branch);
    if (files.length) return { repo: site.repo, path: p, files };
    throw new Error(`${site.repo} has no file ${p}.`);
  }
  return { repo: site.repo, path: p, text: f.text.slice(0, 40_000) };
}

/** A post as the core's published/ export takes it: the same fields a vault's work gives. */
export const postInput = (post: Post) => ({ slug: post.slug, title: post.title, kind: post.kind, body: post.body, date: post.publishedAt, updated: post.updatedAt });

/**
 * Delivers a post to the site's repository when the site is linked: the post file and the manifest the core made
 * through the gate (`approval` is the record that passed and the person's approval), into the content folders. A
 * renamed slug takes the old file and its manifest line out. Returns the post's path, or null when the site is not linked.
 */
export async function publishToRepo(userId: string, post: Post, approval: Approval): Promise<string | null> {
  const at = await contentPlaceOf(userId);
  if (!at) return null;
  const before = await postRepoPath(userId, post.id);
  const was = before ? before.slice(before.lastIndexOf("/") + 1).replace(/\.mdx?$/, "") : undefined;
  const pub = publishPost(await repoIndex(userId, at.site, at.place), approval, postInput(post), was ? { replaces: was } : {});
  await deliver(userId, at.site, at.place, pub, `${before ? "Update" : "Publish"} "${post.title}" from Reflect`);
  const path = contentPath(at.place, postPath(post.slug));
  await setPostRepoPath(userId, post.id, path);
  return path;
}

/** Takes a post's file and its manifest line out of the site's repository when it was delivered there. */
export async function unpublishFromRepo(userId: string, post: Post): Promise<void> {
  const path = await postRepoPath(userId, post.id);
  const at = await contentPlaceOf(userId);
  if (!path || !at) return;
  const slug = path.slice(path.lastIndexOf("/") + 1).replace(/\.mdx?$/, "");
  const index = await repoIndex(userId, at.site, at.place);
  const entry = index.entries.find((e) => e.kind === "post" && slugOfPath(e.path) === slug);
  if (entry) await deliver(userId, at.site, at.place, unpublish(index, entry.path), `Unpublish "${post.title}" from Reflect`);
  // A post delivered before the manifest existed has no line in it; its file still goes when it is in the posts folder.
  else if (insideContent(at.place, path)) await deleteContentFile(userId, at.site, at.place, path, `Unpublish "${post.title}" from Reflect`);
  await setPostRepoPath(userId, post.id, null);
}
