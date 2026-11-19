import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, PencilIcon } from "lucide-react";
import { markdownToHtml } from "@reflect/core/site";
import { parsePage, partsOf, safeUrl, type Block, type Props } from "@reflect/core/site-page";
import { Face } from "@/components/dash";
import { ServiceIcon } from "@/components/service-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProfilePage } from "@/server/profile-store";
import type { Post } from "@/server/site-store";
import { partCard, visibleParts, type PartCard } from "@/server/part-share";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { SiteFooter, WritingList } from "./site-parts";

/** What every component on a page may draw from. */
export type PageContext = { p: ProfilePage; posts: Post[]; href: string; ownerId: string; isOwner: boolean; act: ReactNode; serif: boolean };

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** A YouTube or Vimeo link as its embed address, else null. */
function videoEmbed(src: string): string | null {
  const y = /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,20})/.exec(src);
  if (y) return `https://www.youtube-nocookie.com/embed/${y[1]}`;
  const v = /^https:\/\/(?:www\.)?vimeo\.com\/(\d{4,12})/.exec(src);
  return v ? `https://player.vimeo.com/video/${v[1]}` : null;
}

const host = (u: string) => {
  try {
    return new URL(u).host.replace(/^www\./, "");
  } catch {
    return u;
  }
};

/** The profile card: face, name and handle, and the visitor's act. Keeps the look's slot classes so the site design still applies. */
function ProfileCard({ c }: { c: PageContext }) {
  return (
    <section aria-label="Who" className="virtu-slot-card virtu-shape-card md:bg-muted/40 flex items-start gap-4 md:rounded-xl md:p-5">
      {/* virtu-slot-avatar and virtu-shape-avatar: the site's look (src/server/site-design.ts) can round it and decorate it. */}
      <div className="virtu-slot-avatar virtu-shape-avatar shrink-0 rounded-full"><Face name={c.p.name} size={80} /></div>
      <div className="min-w-0 flex-1 pt-1">
        <h1 id="page-title" className={cn("text-3xl font-bold tracking-tight break-words", c.serif && "font-serif")}>{c.p.name}</h1>
        {c.p.handle ? <p className="text-muted-foreground text-sm">@{c.p.handle}</p> : null}
      </div>
      {c.act ? <div className="hidden shrink-0 gap-2 sm:flex">{c.act}</div> : null}
    </section>
  );
}

function Links({ c }: { c: PageContext }) {
  if (!c.p.socials?.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {c.p.socials.map((s) => (
        <li key={s.id}>
          <a href={s.url} target="_blank" rel="me noreferrer" className="hover:bg-accent flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition">
            <ServiceIcon service={s.service} className="text-muted-foreground" />
            <span>{s.handle ?? s.label}</span>
            {s.confirmedBy ? <CheckIcon className="text-primary size-3.5" aria-label="Confirmed" /> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A shared part as a card; for the owner, a quiet line when it is no longer shared. Visitors see nothing in its place. */
function PartView({ card, view, owner }: { card: PartCard | null; view: string; owner: boolean }) {
  if (!card) return owner ? <p className="text-muted-foreground text-sm italic">This part is no longer shared.</p> : null;
  return (
    <section className={cn("grid gap-2", view === "card" && "virtu-shape-card bg-muted/40 rounded-xl border p-4")}>
      <h3 className="font-semibold">{card.title}</h3>
      {card.lines.length ? <p className="text-muted-foreground text-sm">{card.lines.join(" · ")}</p> : null}
      {card.items.length ? <ul className="grid list-disc gap-1 pl-5 text-sm">{card.items.map((i, n) => <li key={n}>{i}</li>)}</ul> : null}
    </section>
  );
}

/** One component, from the fixed map. A name outside the library never reaches here: the parser refuses it. */
function ComponentView({ name, props, c, parts }: { name: string; props: Props; c: PageContext; parts: Map<string, PartCard | null> }) {
  switch (name) {
    case "Photo": {
      const src = safeUrl(props.src);
      if (!src) return null;
      const round = props.shape === "round";
      return (
        <figure className="grid gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={str(props.alt)} loading="lazy" className={cn("virtu-shape-photo w-full rounded-xl object-cover", round && "mx-auto aspect-square max-w-xs rounded-full")} />
          {props.caption ? <figcaption className="text-muted-foreground text-center text-sm">{str(props.caption)}</figcaption> : null}
        </figure>
      );
    }
    case "Gallery": {
      const srcs = (Array.isArray(props.images) ? props.images : []).map(safeUrl).filter((s): s is string => !!s);
      return (
        <figure className="grid gap-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {srcs.map((s, i) => <img key={i} src={s} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />)}
          </div>
          {props.caption ? <figcaption className="text-muted-foreground text-center text-sm">{str(props.caption)}</figcaption> : null}
        </figure>
      );
    }
    case "Video": {
      const src = safeUrl(props.src);
      if (!src) return null;
      const embed = videoEmbed(src);
      return (
        <figure className="grid gap-2">
          {embed ? <iframe src={embed} title={str(props.caption) || "Video"} allow="encrypted-media; picture-in-picture; fullscreen" className="aspect-video w-full rounded-xl border-0" /> : <video src={src} controls className="w-full rounded-xl" />}
          {props.caption ? <figcaption className="text-muted-foreground text-center text-sm">{str(props.caption)}</figcaption> : null}
        </figure>
      );
    }
    case "Audio": {
      const src = safeUrl(props.src);
      return src ? <figure className="grid gap-2">{props.title ? <figcaption className="text-sm font-medium">{str(props.title)}</figcaption> : null}<audio src={src} controls className="w-full" /></figure> : null;
    }
    case "Embed": {
      const u = safeUrl(props.url);
      return u ? (
        <a href={u} target="_blank" rel="noreferrer nofollow" className="hover:bg-accent grid gap-0.5 rounded-xl border p-4 transition">
          <span className="font-medium">{str(props.title) || host(u)}</span>
          <span className="text-muted-foreground truncate text-sm">{host(u)}</span>
        </a>
      ) : null;
    }
    case "Quote":
      return (
        <blockquote className="border-l-2 pl-4 font-serif text-lg italic">
          <p className="whitespace-pre-line">{str(props.text)}</p>
          {props.cite ? <footer className="text-muted-foreground mt-2 text-sm not-italic">{str(props.cite)}</footer> : null}
        </blockquote>
      );
    case "Callout":
      return <div className="bg-muted/60 rounded-xl p-4 whitespace-pre-line">{str(props.text)}</div>;
    case "Divider":
      return <hr className="my-2" />;
    case "Button": {
      const h = safeUrl(props.href);
      return h ? <div><Button asChild variant="outline"><a href={h}>{str(props.label)}</a></Button></div> : null;
    }
    case "PostList": {
      const limit = typeof props.limit === "number" ? props.limit : 3;
      if (!c.posts.length) return c.isOwner ? <p className="text-muted-foreground text-sm">Your posts show here once you publish from your journal.</p> : null;
      return (
        <div className="grid gap-3">
          <WritingList posts={c.posts.slice(0, limit)} href={c.href} serif={c.serif} />
          {c.posts.length > limit ? <Link href={`${c.href}/writing`} className="text-sm font-medium hover:underline">All writing</Link> : null}
        </div>
      );
    }
    case "ProfileCard":
      return <ProfileCard c={c} />;
    case "Links":
      return <Links c={c} />;
    case "Now":
      return (
        <section className="grid gap-1">
          <h2 className="text-muted-foreground text-sm font-medium">Now</h2>
          <p className="whitespace-pre-line">{str(props.text)}</p>
        </section>
      );
    case "Part":
      return <PartView card={parts.get(str(props.source)) ?? null} view={str(props.view) || "card"} owner={c.isOwner} />;
    default:
      return null;
  }
}

/** Reads every part the page shows, once: a part the access rule refuses is null. */
async function loadParts(blocks: readonly Block[], c: PageContext): Promise<Map<string, PartCard | null>> {
  const sources = partsOf(blocks);
  const ok = sources.length ? await visibleParts(c.ownerId, sources).catch(() => new Set<string>()) : new Set<string>();
  const cards = await Promise.all(sources.map(async (s) => [s, ok.has(s) ? await partCard(c.ownerId, s).catch(() => null) : null] as const));
  return new Map(cards);
}

/**
 * A published page of a person's site: its Markdown drawn with a fixed component map (`@reflect/core/site-page`).
 * Markdown is escaped by markdownToHtml; a line the parser refuses is left out, so nothing outside the library is drawn.
 */
export async function PageView({ body, c, editHref }: { body: string; c: PageContext; editHref: string | null }) {
  const { blocks } = parsePage(body);
  const parts = await loadParts(blocks, c);
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      {editHref ? (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground"><Link href={editHref}><PencilIcon />Edit page</Link></Button>
        </div>
      ) : null}
      {blocks.map((b, i) =>
        b.kind === "markdown" ? (
          <div key={i} className={cn("writing post-body", c.serif && "font-serif")} dangerouslySetInnerHTML={{ __html: markdownToHtml(b.text) }} />
        ) : (
          <ComponentView key={i} name={b.name} props={b.props} c={c} parts={parts} />
        ),
      )}
    </div>
  );
}

/**
 * A published page other than Home (Writing or an added page) as a whole screen: the header back to the site, the
 * page's title, its text and the site's foot. Visitors see it as everyone does; the owner gets Edit.
 */
export async function PageScreen({ ownerId, page, p, posts, href, viewerId, serif }: {
  ownerId: string; page: { id: string; title: string; body: string }; p: ProfilePage; posts: Post[]; href: string; viewerId: string | null; serif: boolean;
}) {
  const isOwner = viewerId === ownerId;
  return (
    <main className={PAGE}>
      <ThingHeader search={!!viewerId} back={href} backLabel={p.name} crumbs={[{ label: p.name, href }]} title={page.title} />
      <div className="mx-auto mt-6 grid w-full max-w-2xl gap-6">
        <h1 id="page-title" className={cn("text-3xl font-bold tracking-tight break-words", serif && "font-serif")}>{page.title}</h1>
        <PageView body={page.body} editHref={isOwner ? `/site/pages/${page.id}` : null} c={{ p, posts, href, ownerId, isOwner, act: null, serif }} />
        <SiteFooter href={href} />
      </div>
    </main>
  );
}
