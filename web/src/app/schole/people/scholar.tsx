import Link from "next/link";
import { itemHref } from "@reflect/core/collections";
import type { Scholar, ScholarArticle } from "@reflect/core/scholars";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { listItems } from "@/server/ways-store";
import { haveKeys } from "@/server/collections";
import { bioFor } from "@/server/guests";
import { followed } from "@/server/people";
import { orcidWorks, type OrcidWork } from "@/server/orcid";
import { LEARN } from "../crumbs";
import { CoverImg } from "../cover-img";
import { PlaylistRows } from "../playlists/card";
import { Clamp } from "./clamp";
import { PersonFollowButton } from "./follow-button";
import { coursesCiting } from "@reflect/core/start-argument";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** One article: its title, then where and when; a DOI opens the publisher's page, which may ask for a subscription. */
function Article({ a }: { a: ScholarArticle | OrcidWork }) {
  return (
    <li className="space-y-0.5 py-2.5">
      <p className="text-[15px] leading-snug font-medium">{a.title}</p>
      <p className="text-muted-foreground text-[13px]">
        {[a.venue, a.year].filter(Boolean).join(", ")}
        {a.doi ? <>{a.venue || a.year ? " · " : ""}<a href={`https://doi.org/${a.doi}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">Publisher&apos;s page</a></> : null}
      </p>
    </li>
  );
}

/**
 * A modern scholar the practice and its course draw on (Torian, 2026-11-16 22:33Z): who they are, why the course reads
 * them, then what of theirs can be watched or heard here (talks, podcasts, recordings of their books), their books
 * (each opens its page; all of them on their Open Library author page), and their articles (the key ones by hand, the
 * rest from their ORCID record). Articles are citations: most sit behind a publisher's paywall and cannot be read here.
 */
export async function ScholarPerson({ x, userId }: { x: Scholar; userId: string }) {
  const [items, follows, bio, more] = await Promise.all([
    listItems(userId).catch(() => []),
    followed(userId).catch(() => []),
    x.wiki ? bioFor(x.name, `https://en.wikipedia.org/wiki/${x.wiki}`).catch(() => null) : Promise.resolve(null),
    x.orcid ? orcidWorks(x.orcid) : Promise.resolve([]),
  ]);
  const have = haveKeys(items);
  const following = follows.some((f) => f.name.toLowerCase() === x.name.toLowerCase());
  const listed = new Set(x.articles.map((a) => norm(a.title)));
  const rest = more.filter((w) => !listed.has(norm(w.title)) && !x.books.some((b) => norm(b.title) === norm(w.title)));
  const first = x.talks[0] ?? x.listen?.[0] ?? x.audio[0] ?? null;
  const courses = coursesCiting(x.id);
  const dates = x.born ? `${x.born}${x.died ? ` to ${x.died}` : ""}` : null;
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/courses/argument" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title={x.name} />
      <div className="mt-6 space-y-10">
        <header className="space-y-4">
          <div className="flex items-start gap-4">
            <span className="bg-muted text-muted-foreground relative flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border text-lg font-medium sm:size-16">
              {bio?.image ? <CoverImg src={bio.image} className="absolute inset-0 size-full object-cover object-top" /> : x.name.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(-2).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 id="page-title" className="text-3xl leading-tight font-semibold tracking-tight">{x.name}</h1>
                <PersonFollowButton name={x.name} qid={bio?.qid ?? null} following={following} />
              </div>
              <p className="text-muted-foreground text-[13px]">{[dates, x.what].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <p className="max-w-prose text-[17px] leading-relaxed">{x.role}</p>
          {bio?.about ? <div className="text-muted-foreground"><Clamp text={bio.about}>From <a href={bio.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">Wikipedia</a>.</Clamp></div> : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {first ? <Button asChild size="lg" className="h-auto min-h-10 max-w-full py-2 text-left whitespace-normal sm:px-8"><Link href={itemHref(first)}>{first.kind === "find" ? "Watch" : "Listen to"} {first.title.length > 60 ? `${first.title.slice(0, 60)}...` : first.title}</Link></Button> : null}
            {courses.map((c) => <Link key={c.href} href={c.href} className="text-muted-foreground text-sm underline-offset-4 hover:underline">In the course {c.title}</Link>)}
          </div>
        </header>
        <div className="max-w-3xl space-y-10">
          {x.talks.length ? <section className="space-y-2"><SectionHead title="Talks" note={`${x.name} speaking.`} /><PlaylistRows items={x.talks} have={have} numbered={false} /></section> : null}
          {x.audio.length ? <section className="space-y-2"><SectionHead title="Podcasts" note="Episodes with them, and their lectures published as podcasts." /><PlaylistRows items={x.audio} have={have} numbered={false} /></section> : null}
          {x.listen?.length ? <section className="space-y-2"><SectionHead title="Listen" note="Their books read aloud." /><PlaylistRows items={x.listen} have={have} numbered={false} /></section> : null}
          {!x.talks.length && !x.audio.length && !x.listen?.length ? <p className="text-muted-foreground text-sm">No recordings of {x.name} speaking were found, so only their writing is listed.</p> : null}
          {x.books.length ? (
            <section className="space-y-2">
              <SectionHead title="Books" href={x.ol[0] ? `/schole/authors/${x.ol[0]}` : undefined} note={x.ol[0] ? "Each opens its page. The heading opens every book Open Library has of theirs." : undefined} />
              <ul className="divide-y">
                {[...x.books].sort((a, b) => (a.year ?? 0) - (b.year ?? 0)).map((b) => (
                  <li key={b.title}>
                    {b.ol ? (
                      <Link href={`/schole/works/${b.ol}`} className="hover:bg-muted/60 -mx-2 block rounded-md px-2 py-2.5">
                        <span className="text-[15px] font-medium">{b.title}</span>{b.year ? <span className="text-muted-foreground text-[13px]"> · {b.year}</span> : null}
                      </Link>
                    ) : <p className="py-2.5"><span className="text-[15px] font-medium">{b.title}</span>{b.year ? <span className="text-muted-foreground text-[13px]"> · {b.year}</span> : null}</p>}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {x.articles.length || rest.length ? (
            <section className="space-y-2">
              <SectionHead title="Articles" note="Where an article is not open access it cannot be read here; Publisher's page opens it at the publisher." />
              <ul className="divide-y">{x.articles.map((a) => <Article key={a.title} a={a} />)}</ul>
              {rest.length ? (
                <details className="group">
                  <summary className="text-muted-foreground cursor-pointer py-2 text-sm underline-offset-4 hover:underline">All {rest.length} more on their ORCID record</summary>
                  <ul className="divide-y">{rest.map((a, i) => <Article key={i} a={a} />)}</ul>
                </details>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
