import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookIcon, ExternalLinkIcon, StarIcon } from "lucide-react";
import { googleVolume, readerUrl } from "@reflect/core/googlebooks";
import { authorWorks, booksLike, coverUrl, workAccess, workDetails, workEntry, type CatalogEntry } from "@reflect/core/openlibrary";
import { categoryOf, showCall, themaCategory } from "@reflect/core/thema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { listClaims, type ClaimOut } from "@/server/claims-store";
import { listIdeas, type IdeaOut } from "@/server/ideas-store";
import { hardcoverFor } from "@/server/hardcover";
import { ideasNaming } from "@reflect/core/ideas";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs, shelfCrumbs } from "../../crumbs";
import { AddBook } from "../../add-book";
import { Reader, type ReadLink } from "./reader";
import { textSource } from "@/server/texts";
import { audiobookFor } from "@/server/audio";
import { excerptsOf } from "@/server/excerpt-store";
import { publishedBy } from "@/server/published-store";
import { whereOf } from "@/server/highlights";
import { Excerpts } from "./excerpts";
import { AudiobookButton, AudiobookChapters } from "../../audiobooks/[id]/play";
import { Clamp } from "../../people/clamp";
import { SyllabusTabs } from "../../courses/syllabus-tabs";
import { workById } from "@reflect/core/topic-pages";
import { haveKeys } from "@/server/collections";
import { listItems } from "@/server/ways-store";
import { ClassicWork } from "./classic";
import { AuthorName, BookGrid } from "../../book-card";
import { setBookStatusAction } from "../../actions";

export const metadata: Metadata = { title: "Book" };
export const dynamic = "force-dynamic";

const STATUS = [["want", "Want to read"], ["reading", "Reading"], ["read", "Read"]] as const;
const STANCE: Record<string, string> = { belief: "Belief", disbelief: "Disbelief", suspension: "Suspension of judgment" };
const cached = (url: string) => fetch(url, { headers: { "user-agent": "reflect-app" }, next: { revalidate: 86400 } });
const Label = ({ children }: { children: ReactNode }) => <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{children}</h3>;

/**
 * One book's page, for any book in the open library: its cover, what it is about, its readers' ratings, a
 * the whole book to read or hear free when it is in the public domain (the Internet Archive, Project Gutenberg,
 * Standard Ebooks, LibriVox) or a preview from Google Books, its contents and editions, where it sits in Thema,
 * books like it and more by its author, where you are with it when it is yours, and the claims that cite it or
 * are on its subjects and the ideas that came from it.
 */
export default async function WorkPage({ params }: { params: Promise<{ work: string }> }) {
  const user = await requireUser();
  const { work } = await params;
  const classic = workById(work);
  if (classic) return <ClassicWork w={classic} have={haveKeys(await listItems(user.id).catch(() => []))} />;
  if (!/^OL\d+W$/.test(work)) notFound();
  const [entry, details, access, view, claims, excerpts, published, ideas] = await Promise.all([
    workEntry(work, cached).catch(() => null),
    workDetails(work, cached).catch(() => null),
    workAccess(work, cached).catch(() => null),
    learnView(user.id),
    listClaims(user.id).catch((): ClaimOut[] => []),
    excerptsOf(user.id, work).catch(() => []),
    publishedBy(user.id).catch(() => []),
    listIdeas(user.id).catch((): IdeaOut[] => []),
  ]);
  if (!entry && !details) notFound();
  const mine = view.books.find((b) => b.catalog?.work === work);
  const title = entry?.title ?? mine?.title ?? "Untitled";
  const authors = entry?.authors ?? mine?.authors ?? [];
  const authorKeys = entry?.authorKeys ?? mine?.catalog?.authorKeys ?? [];
  const isbns = [...(entry?.isbn ? [entry.isbn] : []), ...(details?.editions.first.map((e) => e.isbn).filter((x): x is string => Boolean(x)) ?? [])];
  const [google, byAuthor, audio, like, text, ranked] = await Promise.all([
    googleVolume({ title, authors, ...(entry?.isbn ? { isbn: entry.isbn } : {}) }, cached, process.env.GOOGLE_BOOKS_API_KEY).catch(() => null),
    authorKeys[0] ? authorWorks(authorKeys[0], cached, { limit: 7, sort: "rating" }).then((b) => b.filter((x) => x.work !== work).slice(0, 6)).catch((): CatalogEntry[] => []) : Promise.resolve([] as CatalogEntry[]),
    audiobookFor({ title, authors, ...(entry?.year ? { year: entry.year } : {}) }, access),
    entry ? booksLike({ work, subjects: details?.subjects.length ? details.subjects : entry.subjects }, cached).catch((): CatalogEntry[] => []) : Promise.resolve([] as CatalogEntry[]),
    access?.access === "public" || access?.gutenberg.length || access?.standardEbooks.length || (entry?.year ?? 9999) < 1930 ? textSource({ title, authors }, access) : Promise.resolve(null),
    hardcoverFor({ title, authors, isbns }).catch((): Awaited<ReturnType<typeof hardcoverFor>> => ({ book: null })),
  ]);
  const hc = ranked.book?.editions.length ? ranked.book : null;
  // Without a text in Reflect: a scan at the Internet Archive, or a loan from Open Library, off the page.
  const links: ReadLink[] = text ? [] : [
    ...(access?.access === "public" && access.archive ? [{ name: "Scanned book at the Internet Archive", href: `https://archive.org/details/${access.archive}` }] : []),
    ...(access?.access === "borrowable" && access.edition ? [{ name: "Borrow from Open Library", href: `https://openlibrary.org/books/${access.edition}` }] : []),
  ];
  const preview = google?.read ? { src: readerUrl(google.read.id), full: google.read.full } : null;
  const shelved = new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]));
  const subjects = details?.subjects.length ? details.subjects : entry?.subjects ?? [];
  const category = themaCategory(categoryOf({ ...(entry?.lcc ? { lcc: entry.lcc } : {}), subjects }) ?? "");
  const cover = entry?.cover ? coverUrl(entry, "L") : mine?.catalog ? coverUrl(mine.catalog, "L") : null;
  const description = details?.description ?? google?.description ?? null;
  const mySubjects = new Set(mine?.subjects.map((s) => s.id) ?? []);
  const lower = title.toLowerCase();
  // Claims that cite the book (a passage kept as a claim cites it), then claims on its subjects.
  const cites = (c: ClaimOut) => c.holders.some((h) => `${h.name} ${h.citation ?? ""}`.toLowerCase().includes(lower));
  const fromIt = claims.filter(cites);
  const related = claims.filter((c) => !cites(c) && c.subject && mySubjects.has(c.subject.id));
  // Ideas of the person's that came from the book, may have, or have it as a recommendation.
  const bearing = ideasNaming(ideas, mine ? `book:${mine.id}` : null, title);

  const sec = (title: string, body: ReactNode) => <section className="space-y-3"><h2 className="text-base font-semibold">{title}</h2>{body}</section>;
  const claimsBody = (
    <div className="max-w-prose space-y-5 text-sm">
      {fromIt.length ? (
        <div className="space-y-3">
          <Label>Claims citing it</Label>
          {fromIt.map((c) => (
            <div key={c.id}>
              <p className="font-medium">{c.text}</p>
              <p className="text-muted-foreground text-xs">{[c.stance ? STANCE[c.stance.stance] : "No stance", c.holders.map((h) => [h.name, h.citation].filter(Boolean).join(", ")).join("; ")].filter(Boolean).join(" · ")}</p>
            </div>
          ))}
        </div>
      ) : null}
      {bearing.length ? (
        <div className="space-y-3">
          <Label>Your ideas</Label>
          {bearing.map(({ idea, how }) => (
            <div key={idea.id}>
              <p className="font-medium">{idea.title}</p>
              {idea.statement ? <p className="text-muted-foreground line-clamp-3">{idea.statement}</p> : null}
              <p className="text-muted-foreground text-xs">{how === "from" ? "Came from this book" : how === "maybe" ? "May have come from this book" : `This book ${how} it`}</p>
            </div>
          ))}
        </div>
      ) : null}
      {related.length ? (
        <div className="space-y-3">
          <Label>Claims on its subjects</Label>
          {related.map((c) => (
            <div key={c.id}>
              <p className="font-medium">{c.text}</p>
              <p className="text-muted-foreground text-xs">{[c.stance ? STANCE[c.stance.stance] : "No stance", c.subject?.name].filter(Boolean).join(" · ")}</p>
            </div>
          ))}
        </div>
      ) : null}
      {!fromIt.length && !bearing.length && !related.length ? <p className="text-muted-foreground">None yet. Claims that cite this book or are on its subjects, and ideas that came from it, show here.</p> : null}
    </div>
  );
  const editions = (
    <div className="max-w-2xl space-y-6">
      {details?.editions.count ? (
        <section className="space-y-2">
          <Label>{details.editions.count.toLocaleString("en-US")} {details.editions.count === 1 ? "edition" : "editions"}</Label>
          <ul className="divide-y rounded-md border text-sm">
            {details.editions.first.slice(0, 6).map((e, i) => (
              <li key={`${e.isbn ?? e.title}-${i}`} className="flex items-center gap-3 px-3 py-2">
                <div className="bg-muted h-12 w-8 shrink-0 overflow-hidden rounded-sm border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.cover ? <img src={`https://covers.openlibrary.org/b/id/${e.cover}-S.jpg`} alt="" loading="lazy" className="size-full object-cover" /> : null}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{e.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">{[e.publisher, e.year, e.pages ? `${e.pages} pages` : null, e.language?.toUpperCase()].filter(Boolean).join(" · ")}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {hc ? (
        <section className="space-y-2">
          <Label>Most read editions on Hardcover</Label>
          <ol className="divide-y rounded-md border text-sm">
            {hc.editions.slice(0, 8).map((e, i) => (
              <li key={e.id} className="flex items-start gap-3 px-3 py-2">
                <span className="text-muted-foreground w-5 pt-0.5 text-right text-xs tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block">{e.title}</span>
                  <span className="text-muted-foreground block text-xs">{[`${e.readers.toLocaleString("en-US")} ${e.readers === 1 ? "reader" : "readers"}`, e.rating ? `★ ${e.rating.toFixed(2)}` : null, e.translators.length ? `translated by ${e.translators.join(", ")}` : null, e.publisher, e.year, e.pages ? `${e.pages} pages` : null, e.format, e.language && e.language !== "English" ? e.language : null].filter(Boolean).join(" · ")}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-muted-foreground text-xs">Hardcover readers and average Hardcover ratings{hc.rating ? ` (the book: ★ ${hc.rating.toFixed(2)} from ${hc.ratings.toLocaleString("en-US")} ratings)` : ""}, from <a href={`https://hardcover.app/books/${hc.slug}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">Hardcover</a>.</p>
        </section>
      ) : ranked.error ? <p className="text-muted-foreground text-xs">Hardcover edition rankings did not load: {ranked.error}.</p> : null}
      {!details?.editions.count && !hc ? <p className="text-muted-foreground text-sm">No editions in the catalog.</p> : null}
    </div>
  );
  const detailsTab = (
    <div className="max-w-2xl space-y-5 text-xs">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Category</dt><dd className="text-sm">{category ? <Link className="underline-offset-4 hover:underline" href={`/schole/browse?cat=${category.code}`}>{category.heading}</Link> : "Not yet placed"}</dd></div>
        <div><dt className="text-muted-foreground">Library of Congress call number</dt><dd className="text-sm">{entry?.lcc?.[0] ? showCall(entry.lcc[0]) : "None in the catalog"}</dd></div>
      </dl>
      {subjects.length ? (
        <div className="space-y-2">
          <p className="text-muted-foreground">Subjects in the catalog</p>
          <div className="flex flex-wrap gap-1.5">{subjects.slice(0, 16).map((x) => <Badge key={x} asChild variant="outline" className="text-muted-foreground font-normal"><Link href={`/schole/browse?q=${encodeURIComponent(x)}`}>{x}</Link></Badge>)}</div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1">
        <Button asChild variant="ghost" size="sm"><a href={`https://openlibrary.org/works/${work}`} target="_blank" rel="noreferrer">Open Library<ExternalLinkIcon /></a></Button>
        {google?.link ? <Button asChild variant="ghost" size="sm"><a href={google.link} target="_blank" rel="noreferrer">Google Books<ExternalLinkIcon /></a></Button> : null}
      </div>
    </div>
  );
  const tabs = [
    ...(audio ? [{ id: "listen", label: "Chapters", content: <div id="listen" className="max-w-3xl"><AudiobookChapters book={audio} work={work} title={title} cover={cover} scroll /></div> }] : []),
    ...(details?.contents.length ? [{ id: "contents", label: "Contents", content: <ol className="max-w-prose space-y-0.5 text-sm">{details.contents.map((c, i) => <li key={i} className="whitespace-pre-wrap">{c}</li>)}</ol> }] : []),
    { id: "editions", label: "Editions", content: editions },
    ...(mine || fromIt.length || related.length || bearing.length ? [{ id: "claims", label: "Claims and ideas", content: claimsBody }] : []),
    { id: "details", label: "Details", content: detailsTab },
  ];
  const meta = [entry?.year ? `First published ${entry.year}` : null, details?.editions.count ? `${details.editions.count.toLocaleString("en-US")} ${details.editions.count === 1 ? "edition" : "editions"}` : null].filter(Boolean).join(" · ");

  return (
    <main className={PAGE}>
      <ThingHeader back={mine ? "/schole" : "/schole/browse"} crumbs={mine ? shelfCrumbs(mine.way) : browseCrumbs("books")} title={title} action={text ? <Button asChild size="sm"><Link href={`/schole/works/${work}/read`}>{mine?.place ? "Continue reading" : "Read"}</Link></Button> : undefined} />
      <div className="mt-8 space-y-10">
        <header className="grid gap-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
          <div className="mx-auto w-40 sm:mx-0 sm:w-full">
            <div className="bg-muted aspect-[2/3] overflow-hidden rounded-md border shadow-md">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={`Cover of ${title}`} className="size-full object-cover" />
              ) : <div className="text-muted-foreground flex size-full items-center justify-center"><BookIcon className="size-8" /></div>}
            </div>
          </div>
          <div className="min-w-0 space-y-4 sm:pt-2">
            <div className="space-y-1.5">
              <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="text-base">{authors.length ? authors.map((name, i) => <span key={`${name}-${i}`}>{i ? ", " : ""}<AuthorName name={name} id={authorKeys[i]} /></span>) : "Author not given"}</p>
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-[13px]">{details?.rating ? <><Rating r={details.rating} />{meta ? <span>·</span> : null}</> : null}<span>{meta}</span></p>
            </div>
            {/* Listening first (Torian, 2026-11-15 08:24Z; decision 3): Listen is the filled button whenever a recording exists, Read beside it in outline. */}
            <div className="flex flex-wrap items-start gap-2">
              {audio ? <AudiobookButton book={audio} work={work} title={title} cover={cover} /> : null}
              {text || preview || links.length ? <Reader links={links} work={work} kept={mine?.place ?? null} preview={preview} secondary={Boolean(audio)} {...(text ? { here: `/schole/works/${work}/read` } : {})} /> : null}
            </div>
            {!audio && !text && !preview ? <p className="text-muted-foreground text-sm">There is no free recording or text of this book, so it can&apos;t be heard or read in Reflect yet.</p> : null}
            {mine ? (
              <form action={setBookStatusAction} className="bg-muted/60 inline-flex rounded-lg p-0.5" aria-label="Where you are with it">
                <input type="hidden" name="book" value={mine.id} />
                {STATUS.map(([id, label]) => <button key={id} name="status" value={id} aria-pressed={mine.status === id} className={`h-7 rounded-md px-3 text-xs font-medium ${mine.status === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
              </form>
            ) : entry ? <AddBook entry={entry} quiet={Boolean(audio || text || preview)} /> : null}
            {description ? (
              <div className="text-muted-foreground">
                <Clamp text={description}>From {details?.description ? "Open Library" : "Google Books"}, written by its contributors.</Clamp>
              </div>
            ) : null}
          </div>
        </header>
        <div className="max-w-3xl space-y-10">
          <Excerpts work={work} rows={excerpts.map((e) => ({ id: e.id, work, title, author: authors[0] ?? "", quote: e.quote, where: whereOf(e), chapter: e.anchor?.chapter ?? null, note: e.note, color: e.color, published: published.find((p) => p.work === work && p.quote === e.quote.replace(/\s+/g, " ").trim())?.id ?? null }))} {...(text ? { reader: `/schole/works/${work}/read` } : {})} />
        </div>
        <SyllabusTabs tabs={tabs} />
        {like.length ? sec("Books like this", <BookGrid books={like} mine={shelved} cols="md:grid-cols-4 lg:grid-cols-6" row />) : null}
        {byAuthor.length && authorKeys[0] ? (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">More by {authors[0]}</h2>
              <Link href={`/schole/authors/${authorKeys[0]}`} className="text-muted-foreground shrink-0 text-sm underline-offset-4 hover:underline">All their books</Link>
            </div>
            <BookGrid books={byAuthor} mine={shelved} cols="md:grid-cols-4 lg:grid-cols-6" row />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Rating({ r }: { r: { average: number; count: number } }) {
  return (
    <span className="inline-flex items-center gap-1">
      <StarIcon className="text-foreground size-3.5 fill-current" />
      <span className="text-foreground font-medium">{r.average.toFixed(1)}</span>
      <span>({r.count.toLocaleString("en-US")} on Open Library)</span>
    </span>
  );
}
