import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { excerpt, headings, markdownToHtml, readingMinutes } from "@reflect/core/site";
import { Face } from "@/components/dash";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { currentUser } from "@/server/session";
import { ownerOf, profilePage } from "@/server/profile-store";
import { postBySlug, postsOf, siteOf } from "@/server/site-store";
import { profileHref } from "@/server/actions/profiles";
import { SubscribeButton } from "../subscribe";
import { postDay, SiteFooter, WritingList } from "../site-parts";

export const dynamic = "force-dynamic";

async function load(key: string, slug: string) {
  const owner = await ownerOf(key);
  if (!owner) return null;
  const [post, p] = await Promise.all([postBySlug(owner.id, slug), profilePage(owner.id, null)]);
  return post && p ? { owner, post, p } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ key: string; slug: string }> }): Promise<Metadata> {
  const { key, slug } = await params;
  const x = await load(key, slug).catch(() => null);
  if (!x) return { title: "Post" };
  return {
    title: `${x.post.title} · ${x.p.name}`,
    description: excerpt(x.post.body, 160),
    authors: [{ name: x.p.name }],
    alternates: { types: { "application/rss+xml": `${profileHref(x.p)}/feed.xml` } },
    openGraph: { type: "article", title: x.post.title, description: excerpt(x.post.body, 160), publishedTime: x.post.publishedAt },
  };
}

/**
 * A post on a person's site (doc "Personal site and blog design guide", page 2): a serif title and body in a 680px
 * column, the author line, Subscribe below the text, the contents at the side on wide screens and more writing at
 * the foot. Anyone can read it, signed in or not.
 */
export default async function PostPage({ params }: { params: Promise<{ key: string; slug: string }> }) {
  const { key, slug } = await params;
  const x = await load(key, slug);
  if (!x) notFound();
  const { owner, post, p } = x;
  const href = profileHref(p);
  if (owner.redirect || (owner.handle && decodeURIComponent(key) !== owner.handle)) redirect(`${href}/${post.slug}`);
  const [user, others, site] = await Promise.all([currentUser().catch(() => null), postsOf(owner.id, 4), siteOf(owner.id).catch(() => ({ template: "plain" as const }))]);
  const isOwner = user?.id === owner.id;
  const more = others.filter((o) => o.id !== post.id).slice(0, 3);
  const contents = headings(post.body);
  const updated = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 60 * 60 * 1000;

  return (
    <main className={PAGE}>
      <ThingHeader search={!!user} back={href} backLabel={p.name} crumbs={[{ label: p.name, href }]} title={post.title}
        action={isOwner ? <Button asChild variant="outline" size="sm"><Link href={`/journal/w/${post.workId}`}>Edit</Link></Button> : undefined} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,680px)_14rem] lg:justify-center">
        <article className="mx-auto w-full max-w-[680px] min-w-0">
          <h1 id="page-title" className="font-serif text-4xl leading-tight font-semibold tracking-tight break-words sm:text-5xl">{post.title}</h1>
          <div className="mt-5 flex items-center gap-3">
            <Link href={href} aria-label={p.name}><Face name={p.name} size={36} /></Link>
            <div className="min-w-0 text-sm">
              <Link href={href} className="font-medium hover:underline">{p.name}</Link>
              <p className="text-muted-foreground">
                {postDay(post.publishedAt)} · {readingMinutes(post.body)} min read{updated ? ` · Updated ${postDay(post.updatedAt)}` : ""}
              </p>
            </div>
            {isOwner ? <Button asChild variant="outline" size="sm" className="ml-auto"><Link href={`/journal/w/${post.workId}`}>Edit</Link></Button> : null}
          </div>
          <div className="writing post-body mt-10" dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }} />
          {!isOwner ? (
            <section aria-label="Subscribe" className="bg-muted/40 mt-14 flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Get {p.name}&apos;s writing</p>
                <p className="text-muted-foreground text-sm">New posts by email. Leave any time.</p>
              </div>
              <SubscribeButton ownerId={p.id} name={p.name} />
            </section>
          ) : null}
          {more.length ? (
            <section aria-label="More writing" className="mt-14">
              <h2 className="mb-3 text-lg font-semibold">More writing</h2>
              <WritingList posts={more} href={href} serif={site.template === "notebook"} />
            </section>
          ) : null}
          <SiteFooter href={href} />
        </article>
        {contents.length > 1 ? (
          <nav aria-label="Contents" className="hidden lg:block">
            <div className="sticky top-20 grid gap-2 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Contents</p>
              {contents.map((h) => <a key={h.id} href={`#${h.id}`} className={cn("text-muted-foreground hover:text-foreground leading-snug")}>{h.text}</a>)}
            </div>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
