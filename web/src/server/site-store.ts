// A person's own site and blog (migration 0056; doc "Personal site and blog design guide", 2026-11-18). The profile
// at /p/<handle> is the site. A post is a plain-text copy of one journal work, made only when the person taps
// Publish; the journal's sealed text is never read by anyone else. Subscribers' emails are sealed with the site
// owner's key. Nothing is deleted: unpublishing and leaving mark the row.
import { randomBytes } from "node:crypto";
import { db } from "@/db/pool";
import { freeSlug, isPublishable, isSlug, isTemplate, RESERVED_SLUGS, type TemplateId } from "@reflect/core/site";
import { getWork } from "./work-store";
import { open, seal, tag } from "./crypto";

export type Post = { id: string; workId: string; slug: string; kind: string; title: string; body: string; publishedAt: string; updatedAt: string };
export type Site = { template: TemplateId; domain: string | null; domainCheckedAt: string | null };

const newId = () => randomBytes(9).toString("base64url");
const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d ? new Date(String(d)).toISOString() : null);
const toPost = (r: Record<string, unknown>): Post => ({
  id: r.id as string, workId: r.work_id as string, slug: r.slug as string, kind: r.kind as string, title: r.title as string, body: r.body as string,
  publishedAt: iso(r.published_at)!, updatedAt: iso(r.updated_at)!,
});

/** The site's settings; the default (Plain, no domain) when none were set. */
export async function siteOf(userId: string): Promise<Site> {
  const r = (await db().query("SELECT template, domain, domain_checked_at FROM site WHERE user_id = $1", [userId])).rows[0];
  return { template: isTemplate(r?.template) ? r.template : "plain", domain: r?.domain ?? null, domainCheckedAt: iso(r?.domain_checked_at) };
}

/** Sets the site's template. Returns the one before. */
export async function setTemplate(userId: string, template: TemplateId): Promise<TemplateId> {
  const before = (await siteOf(userId)).template;
  await db().query(
    "INSERT INTO site (user_id, template) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET template = EXCLUDED.template, updated_at = now()",
    [userId, template],
  );
  return before;
}

/** The person's live posts, newest first. */
export async function postsOf(userId: string, limit = 200): Promise<Post[]> {
  const r = await db().query("SELECT * FROM post WHERE user_id = $1 AND unpublished_at IS NULL ORDER BY published_at DESC LIMIT $2", [userId, limit]);
  return r.rows.map(toPost);
}

export async function postBySlug(userId: string, slug: string): Promise<Post | null> {
  if (!isSlug(slug)) return null;
  const r = await db().query("SELECT * FROM post WHERE user_id = $1 AND slug = $2 AND unpublished_at IS NULL", [userId, slug]);
  return r.rows[0] ? toPost(r.rows[0]) : null;
}

/** The live post of one work, or null when it is not published. */
export async function postForWork(userId: string, workId: string): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(workId)) return null;
  const r = await db().query("SELECT * FROM post WHERE user_id = $1 AND work_id = $2 AND unpublished_at IS NULL", [userId, workId]);
  return r.rows[0] ? toPost(r.rows[0]) : null;
}

/**
 * Publish a work, or update its post: a copy of its title and text as they are now goes on the site at the slug.
 * Only an essay, letter, plan or memoir, and only with a title. Returns the post.
 */
export async function publishWork(userId: string, workId: string, slugWanted: string | null): Promise<Post> {
  const w = await getWork(userId, workId);
  if (!w) throw new Error("No such work.");
  if (!isPublishable(w.kind)) throw new Error("Only an essay, letter, plan or memoir can be published. Your journal stays private.");
  const title = w.title.trim();
  if (!title) throw new Error("Give it a title before you publish.");
  if (!w.body.trim()) throw new Error("There is nothing written yet.");
  const cur = await postForWork(userId, workId);
  const want = slugWanted?.trim().toLowerCase() || cur?.slug || title;
  if (slugWanted && (!isSlug(want) || RESERVED_SLUGS.includes(want))) throw new Error("An address uses lowercase letters, numbers and hyphens.");
  const taken = (await db().query("SELECT slug FROM post WHERE user_id = $1 AND unpublished_at IS NULL AND work_id <> $2", [userId, workId])).rows.map((r) => r.slug as string);
  if (slugWanted && taken.includes(want)) throw new Error("Another post has that address.");
  const slug = freeSlug(want, [...taken, ...RESERVED_SLUGS]);
  if (cur) {
    const r = await db().query("UPDATE post SET slug = $3, title = $4, body = $5, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *", [cur.id, userId, slug, title, w.body]);
    return toPost(r.rows[0]);
  }
  const r = await db().query("INSERT INTO post (id, user_id, work_id, slug, kind, title, body) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", [newId(), userId, workId, slug, w.kind, title, w.body]);
  return toPost(r.rows[0]);
}

/** Take a work's post down. Returns the post that was live, or null when there was none. */
export async function unpublishWork(userId: string, workId: string): Promise<Post | null> {
  const cur = await postForWork(userId, workId);
  if (!cur) return null;
  await db().query("UPDATE post SET unpublished_at = now() WHERE id = $1 AND user_id = $2", [cur.id, userId]);
  return cur;
}

/** Put a taken-down post back as it was, unless the work has another live post or its address was taken since. */
export async function republishPost(userId: string, postId: string): Promise<void> {
  const r = (await db().query("SELECT * FROM post WHERE id = $1 AND user_id = $2", [postId, userId])).rows[0];
  if (!r) throw new Error("No such post.");
  if (!r.unpublished_at) return;
  const clash = await db().query("SELECT 1 FROM post WHERE user_id = $1 AND unpublished_at IS NULL AND (work_id = $2 OR slug = $3)", [userId, r.work_id, r.slug]);
  if (clash.rows.length) throw new Error("This work was published again since.");
  await db().query("UPDATE post SET unpublished_at = NULL WHERE id = $1", [postId]);
}

// Subscribers.

/** Someone asks to subscribe: a waiting row with a token for the confirmation link. Asking again sends a new link. */
export async function subscribe(ownerId: string, email: string): Promise<{ token: string; confirmed: boolean }> {
  const t = tag(ownerId, `subscriber:${email}`);
  const cur = (await db().query("SELECT token, confirmed_at FROM site_subscriber WHERE site_user_id = $1 AND email_tag = $2 AND left_at IS NULL", [ownerId, t])).rows[0];
  if (cur) return { token: cur.token, confirmed: !!cur.confirmed_at };
  const token = randomBytes(24).toString("base64url");
  await db().query("INSERT INTO site_subscriber (id, site_user_id, email_ct, email_tag, token) VALUES ($1, $2, $3, $4, $5)", [newId(), ownerId, seal(ownerId, email), t, token]);
  return { token, confirmed: false };
}

const TOKEN = /^[A-Za-z0-9_-]{32}$/;

/** A subscriber follows their confirmation link. Returns the site's owner, or null for an unknown token. */
export async function confirmSubscriber(token: string): Promise<string | null> {
  if (!TOKEN.test(token)) return null;
  const r = await db().query("UPDATE site_subscriber SET confirmed_at = COALESCE(confirmed_at, now()) WHERE token = $1 AND left_at IS NULL RETURNING site_user_id", [token]);
  return r.rows[0]?.site_user_id ?? null;
}

/** A subscriber leaves by the link in their email. Returns the site's owner, or null for an unknown token. */
export async function leaveSite(token: string): Promise<string | null> {
  if (!TOKEN.test(token)) return null;
  const r = await db().query("UPDATE site_subscriber SET left_at = now() WHERE token = $1 AND left_at IS NULL RETURNING site_user_id", [token]);
  return r.rows[0]?.site_user_id ?? null;
}

/** The site's confirmed subscribers (emails opened for the owner only) and how many have not confirmed yet. */
export async function subscribersOf(ownerId: string): Promise<{ confirmed: { email: string; confirmedAt: string }[]; waiting: number }> {
  const r = await db().query("SELECT email_ct, confirmed_at FROM site_subscriber WHERE site_user_id = $1 AND left_at IS NULL ORDER BY created_at", [ownerId]);
  const confirmed = r.rows.filter((x) => x.confirmed_at).map((x) => ({ email: open(ownerId, x.email_ct), confirmedAt: iso(x.confirmed_at)! }));
  return { confirmed, waiting: r.rows.length - confirmed.length };
}

/** How many confirmed subscribers the site has. */
export async function subscriberCount(ownerId: string): Promise<number> {
  const r = await db().query("SELECT count(*)::int AS n FROM site_subscriber WHERE site_user_id = $1 AND left_at IS NULL AND confirmed_at IS NOT NULL", [ownerId]);
  return r.rows[0]?.n ?? 0;
}

// Your own domain.

/** Sets or clears the site's own domain. A domain another site has is refused. */
export async function setDomain(userId: string, domain: string | null): Promise<void> {
  if (domain) {
    const other = await db().query("SELECT 1 FROM site WHERE domain = $1 AND user_id <> $2", [domain, userId]);
    if (other.rows.length) throw new Error("Another site uses that domain.");
  }
  await db().query(
    "INSERT INTO site (user_id, domain) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET domain = EXCLUDED.domain, domain_checked_at = NULL, updated_at = now()",
    [userId, domain],
  );
}

/** Marks the site's domain as pointing here. */
export async function markDomainChecked(userId: string): Promise<void> {
  await db().query("UPDATE site SET domain_checked_at = now() WHERE user_id = $1", [userId]);
}

/** Whose site a host name is, once its domain was checked. */
export async function siteForDomain(host: string): Promise<{ userId: string; handle: string | null } | null> {
  const r = await db().query(
    "SELECT s.user_id, p.handle FROM site s LEFT JOIN member_profile p ON p.user_id = s.user_id WHERE s.domain = $1 AND s.domain_checked_at IS NOT NULL",
    [host.toLowerCase()],
  );
  return r.rows[0] ? { userId: r.rows[0].user_id, handle: r.rows[0].handle ?? null } : null;
}
