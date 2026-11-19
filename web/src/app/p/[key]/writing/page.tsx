import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { currentUser } from "@/server/session";
import { ownerOf, profilePage } from "@/server/profile-store";
import { postsOf, siteOf } from "@/server/site-store";
import { profileHref } from "@/server/actions/profiles";
import { SiteFooter, WritingList } from "../site-parts";
import { PageScreen } from "../page-view";
import { publishedPage } from "@/server/site-pages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Writing" };

/** Everything a person has published, newest first. */
export default async function AllWriting({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const owner = await ownerOf(key);
  if (!owner) notFound();
  const p = await profilePage(owner.id, null);
  if (!p) notFound();
  const href = profileHref(p);
  if (owner.redirect || (owner.handle && decodeURIComponent(key) !== owner.handle)) redirect(`${href}/writing`);
  const [user, posts, site, page] = await Promise.all([currentUser().catch(() => null), postsOf(owner.id), siteOf(owner.id).catch(() => ({ template: "plain" as const })), publishedPage(owner.id, "writing").catch(() => null)]);
  // The Writing page, once its owner published it in the site editor; until then every post as a list.
  if (page) return <PageScreen ownerId={owner.id} page={page} p={p} posts={posts} href={href} viewerId={user?.id ?? null} serif={site.template === "notebook"} />;
  return (
    <main className={PAGE}>
      <ThingHeader search={!!user} back={href} backLabel={p.name} crumbs={[{ label: p.name, href }]} title="Writing" />
      <div className="mx-auto mt-6 w-full max-w-[680px]">
        <h1 id="page-title" className="mb-6 text-3xl font-bold tracking-tight">Writing</h1>
        {posts.length ? <WritingList posts={posts} href={href} serif={site.template === "notebook"} /> : <p className="text-muted-foreground">Nothing published yet.</p>}
        <SiteFooter href={href} />
      </div>
    </main>
  );
}
