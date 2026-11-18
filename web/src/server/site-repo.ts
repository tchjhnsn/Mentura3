// A personal site the person hosts themselves, controlled from Reflect through GitHub (Torian, 2026-11-18 20:47Z).
// Everything runs through the person's own GitHub connector from the marketplace: linking reads the repository to find
// where its posts live; Publish commits the post there written the way the repository writes posts; Unpublish
// removes that file; Ask Reflect reads and (after Send) writes any file. Their host redeploys on each push.
import { cleanRepo, findPostsPlace, pickBranch, POST_FOLDERS, repoPostFile, repoPostPath, type PostsPlace } from "@reflect/core/site-repo";
import { excerpt } from "@reflect/core/site";
import { callToolTexts, connectedTo, toolsOf, type Connection } from "./mcp-connections";
import { postRepoPath, setPostRepoPath, siteOf, type Post, type SiteRepo } from "./site-store";

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

/** Writes one file to the site's repository as a commit on its branch (creating or replacing it). */
export async function writeRepoFile(userId: string, path: string, content: string, message: string): Promise<{ path: string; repo: string }> {
  const site = (await siteOf(userId)).repo;
  if (!site) throw new Error("Your site is not linked to a repository (/settings/site/repo).");
  const c = await github(userId);
  const cur = await readRepoFile(userId, site.repo, path, site.branch);
  await callToolTexts(userId, c.id, "create_or_update_file", { ...split(site.repo), path, content, message, branch: site.branch, ...(cur?.sha ? { sha: cur.sha } : {}) });
  return { path, repo: site.repo };
}

/** Removes one file from the site's repository as a commit. Missing files are fine. */
export async function deleteRepoFile(userId: string, path: string, message: string): Promise<void> {
  const site = (await siteOf(userId)).repo;
  if (!site) return;
  const c = await github(userId);
  const cur = await readRepoFile(userId, site.repo, path, site.branch);
  if (!cur) return;
  await callToolTexts(userId, c.id, "delete_file", { ...split(site.repo), path, message, branch: site.branch, ...(cur.sha ? { sha: cur.sha } : {}) });
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

/**
 * Publishes a post to the site's repository when the site is linked: the file goes in the posts folder, written like
 * the posts already there. A renamed slug removes the old file. Returns the path, or null when the site is not linked.
 */
export async function publishToRepo(userId: string, post: Post): Promise<string | null> {
  const site = (await siteOf(userId)).repo;
  if (!site) return null;
  const c = await github(userId);
  const place = { folder: site.folder, ext: site.ext };
  const path = repoPostPath(place, post.slug);
  const before = await postRepoPath(userId, post.id);
  // An existing post shows how this repository writes front matter.
  let sample: string | null = null;
  const others = (await listFolder(userId, c, site.repo, site.folder, site.branch)).filter((p) => p !== path && p.endsWith(`.${site.ext}`));
  if (others[0]) sample = (await readRepoFile(userId, site.repo, others[0], site.branch))?.text ?? null;
  const file = repoPostFile({ slug: post.slug, title: post.title, kind: post.kind, body: post.body, summary: excerpt(post.body, 160), publishedAt: post.publishedAt, updatedAt: post.updatedAt }, sample);
  await writeRepoFile(userId, path, file, `${before ? "Update" : "Publish"} "${post.title}" from Reflect`);
  if (before && before !== path) await deleteRepoFile(userId, before, `Move "${post.title}" to ${path} from Reflect`);
  await setPostRepoPath(userId, post.id, path);
  return path;
}

/** Removes a post's file from the site's repository when it was written there. */
export async function unpublishFromRepo(userId: string, post: Post): Promise<void> {
  const path = await postRepoPath(userId, post.id);
  if (!path) return;
  await deleteRepoFile(userId, path, `Unpublish "${post.title}" from Reflect`);
  await setPostRepoPath(userId, post.id, null);
}
