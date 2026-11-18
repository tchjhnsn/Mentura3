import { rssXml } from "@reflect/core/site";
import { ownerOf, profilePage } from "@/server/profile-store";
import { postsOf } from "@/server/site-store";
import { profileHref } from "@/server/actions/profiles";
import { siteUrl } from "@/server/site";

export const dynamic = "force-dynamic";

/** A person's site as an RSS feed: each published post with its full text. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const owner = await ownerOf((await params).key);
  const p = owner ? await profilePage(owner.id, null) : null;
  if (!owner || !p) return new Response("Not found", { status: 404 });
  const posts = await postsOf(owner.id, 50);
  const xml = rssXml({ title: p.name, link: `${siteUrl()}${profileHref(p)}`, description: p.line ?? `Writing by ${p.name}` }, posts);
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
