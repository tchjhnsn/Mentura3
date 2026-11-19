// A site's pages in Markdown (migration 0062, `@reflect/core/site-page`; plan "Appearance, Virtu and the site editor",
// PR 3). Home ('') and Writing ('writing') are always listed; their rows are made from the template the first time
// the owner opens them, so a site nobody edited keeps the profile layout. The draft saves itself; Publish copies it
// to published_body, the only text visitors see. Nothing is deleted: removing a page marks it.
import { randomBytes } from "node:crypto";
import { db } from "@/db/pool";
import { checkPage, FIXED_PAGES, HOME, isPagePath, templateFor, WRITING } from "@reflect/core/site-page";
import { freeSlug } from "@reflect/core/site";

export type SitePage = {
  id: string; path: string; title: string; body: string; publishedBody: string | null; publishedAt: string | null;
  version: number; updatedAt: string; fixed: boolean;
};
/** A row of the Pages list: a fixed page not opened yet has no id. */
export type PageRow = { id: string | null; path: string; title: string; published: boolean; draft: boolean; fixed: boolean };

const newId = () => randomBytes(9).toString("base64url");
const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d ? new Date(String(d)).toISOString() : null);
const isFixed = (path: string) => path === HOME || path === WRITING;
const toPage = (r: Record<string, unknown>): SitePage => ({
  id: r.id as string, path: r.path as string, title: r.title as string, body: r.body as string,
  publishedBody: (r.published_body as string | null) ?? null, publishedAt: iso(r.published_at), version: Number(r.version),
  updatedAt: iso(r.updated_at)!, fixed: isFixed(r.path as string),
});
const ID = /^[A-Za-z0-9_-]{12}$/;

/** The site's pages for the Pages list: Home, Writing, then added pages in the order they were made. */
export async function pagesOf(userId: string): Promise<PageRow[]> {
  const rows = (await db().query("SELECT * FROM site_page WHERE site_user_id = $1 AND removed_at IS NULL ORDER BY created_at, id", [userId])).rows.map(toPage);
  const row = (p: SitePage): PageRow => ({ id: p.id, path: p.path, title: p.title, published: p.publishedBody !== null, draft: p.publishedBody !== p.body, fixed: p.fixed });
  const fixed = FIXED_PAGES.map((f) => {
    const p = rows.find((r) => r.path === f.path);
    return p ? row(p) : { id: null, path: f.path, title: f.title, published: false, draft: false, fixed: true };
  });
  return [...fixed, ...rows.filter((r) => !r.fixed).map(row)];
}

export async function pageById(userId: string, id: string): Promise<SitePage | null> {
  if (!ID.test(id)) return null;
  const r = (await db().query("SELECT * FROM site_page WHERE id = $1 AND site_user_id = $2 AND removed_at IS NULL", [id, userId])).rows[0];
  return r ? toPage(r) : null;
}

export async function pageByPath(userId: string, path: string): Promise<SitePage | null> {
  const r = (await db().query("SELECT * FROM site_page WHERE site_user_id = $1 AND path = $2 AND removed_at IS NULL", [userId, path])).rows[0];
  return r ? toPage(r) : null;
}

/** What visitors see at a path: the published title and text, or null when the page was never published. */
export async function publishedPage(userId: string, path: string): Promise<{ id: string; title: string; body: string; publishedAt: string } | null> {
  const p = await pageByPath(userId, path);
  return p?.publishedBody != null ? { id: p.id, title: p.title, body: p.publishedBody, publishedAt: p.publishedAt! } : null;
}

/** Home or Writing, made from its template the first time it is opened. Returns its id. */
export async function ensureFixedPage(userId: string, path: string, line: string | null): Promise<string> {
  if (!isFixed(path)) throw new Error("No such page.");
  const cur = await pageByPath(userId, path);
  if (cur) return cur.id;
  const title = FIXED_PAGES.find((f) => f.path === path)!.title;
  const r = await db().query(
    "INSERT INTO site_page (id, site_user_id, path, title, body) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (site_user_id, path) WHERE removed_at IS NULL DO NOTHING RETURNING id",
    [newId(), userId, path, title, templateFor(path, { line })],
  );
  return (r.rows[0]?.id as string | undefined) ?? (await pageByPath(userId, path))!.id;
}

/** Paths a new page or a renamed one cannot take: other pages' and live posts'. */
async function takenPaths(userId: string, exceptId: string | null): Promise<string[]> {
  const [pages, posts] = await Promise.all([
    db().query("SELECT path FROM site_page WHERE site_user_id = $1 AND removed_at IS NULL AND id <> $2", [userId, exceptId ?? ""]),
    db().query("SELECT slug FROM post WHERE user_id = $1 AND unpublished_at IS NULL", [userId]),
  ]);
  return [...pages.rows.map((r) => r.path as string), ...posts.rows.map((r) => r.slug as string)];
}

/** Adds an empty page at a free path. Returns its id. */
export async function addPage(userId: string): Promise<string> {
  const path = freeSlug("page", [...(await takenPaths(userId, null)), "home", "parts", "writing"]);
  const id = newId();
  await db().query("INSERT INTO site_page (id, site_user_id, path, title, body) VALUES ($1, $2, $3, $4, '')", [id, userId, path, "Untitled"]);
  return id;
}

/** Saves the draft. Refuses text the library does not allow, and a save from a window that is behind. Returns the new version. */
export async function savePageDraft(userId: string, id: string, body: string, version: number): Promise<{ version: number } | { error: string }> {
  if (body.length > 200_000) return { error: "This page is too long to keep." };
  const errors = checkPage(body);
  if (errors.length) return { error: `Line ${errors[0]!.line}: ${errors[0]!.message}` };
  const r = await db().query(
    "UPDATE site_page SET body = $3, version = version + 1, updated_at = now() WHERE id = $1 AND site_user_id = $2 AND removed_at IS NULL AND version = $4 RETURNING version",
    [id, userId, body, version],
  );
  if (!r.rows[0]) return { error: "This page changed in another window. Reload to see it." };
  return { version: Number(r.rows[0].version) };
}

/** Puts the draft live. */
export async function publishPage(userId: string, id: string): Promise<SitePage> {
  const p = await pageById(userId, id);
  if (!p) throw new Error("No such page.");
  const errors = checkPage(p.body);
  if (errors.length) throw new Error(`Line ${errors[0]!.line}: ${errors[0]!.message}`);
  const r = await db().query("UPDATE site_page SET published_body = body, published_at = now() WHERE id = $1 AND site_user_id = $2 RETURNING *", [id, userId]);
  return toPage(r.rows[0]);
}

/** Takes a page down; Home and Writing go back to the profile layout. */
export async function unpublishPage(userId: string, id: string): Promise<void> {
  await db().query("UPDATE site_page SET published_body = NULL, published_at = NULL WHERE id = $1 AND site_user_id = $2", [id, userId]);
}

export async function setPageTitle(userId: string, id: string, title: string): Promise<void> {
  const t = title.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!t) throw new Error("Give the page a title.");
  await db().query("UPDATE site_page SET title = $3, updated_at = now() WHERE id = $1 AND site_user_id = $2 AND removed_at IS NULL", [id, userId, t]);
}

/** Moves an added page to another address. Home and Writing keep theirs. */
export async function setPagePath(userId: string, id: string, path: string): Promise<void> {
  const p = await pageById(userId, id);
  if (!p) throw new Error("No such page.");
  if (p.fixed) throw new Error(`${p.title} keeps its address.`);
  const want = path.trim().toLowerCase();
  if (!isPagePath(want)) throw new Error("An address uses lowercase letters, numbers and hyphens, and not one your site already uses.");
  if ((await takenPaths(userId, id)).includes(want)) throw new Error("A page or post already has that address.");
  await db().query("UPDATE site_page SET path = $3, updated_at = now() WHERE id = $1 AND site_user_id = $2", [id, userId, want]);
}

/** Removes an added page. Home and Writing cannot be removed. */
export async function removePage(userId: string, id: string): Promise<void> {
  const p = await pageById(userId, id);
  if (!p) return;
  if (p.fixed) throw new Error(`${p.title} cannot be removed.`);
  await db().query("UPDATE site_page SET removed_at = now() WHERE id = $1 AND site_user_id = $2", [id, userId]);
}

/** Page paths of the site, so a post never takes one. */
export async function pagePaths(userId: string): Promise<string[]> {
  return (await db().query("SELECT path FROM site_page WHERE site_user_id = $1 AND removed_at IS NULL", [userId])).rows.map((r) => r.path as string);
}

/**
 * The site's pages as JSON for the API (/api/site/pages/<path>): '' lists them, 'home' is Home, any other path one
 * page with its draft and what is live. Owner only.
 */
export async function sitePagesPart(userId: string, path: string): Promise<unknown> {
  const p = path.replace(/^\/+|\/+$/g, "");
  if (!p) return pagesOf(userId);
  const page = await pageByPath(userId, p === "home" ? HOME : p);
  if (!page) return null;
  return { path: page.path, title: page.title, draft: page.body, published: page.publishedBody, publishedAt: page.publishedAt, version: page.version, updatedAt: page.updatedAt };
}
