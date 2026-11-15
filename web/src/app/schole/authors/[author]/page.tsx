import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon, UserIcon } from "lucide-react";
import { AUTHOR_ID, authorDetails, authorPhotoUrl, booksLike, isSort, SORTS, type CatalogEntry, type Sort } from "@reflect/core/openlibrary";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { isFilter, listBooks, openLibrary, PER, type BookSource, type Filter } from "@/server/browse";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs } from "../../crumbs";
import { BookGrid } from "../../book-card";
import { FilterMenu, SortMenu, type ListState } from "../../browse/list-menus";
import { MoreBooks } from "../../browse/more-books";
import { Clamp } from "../../people/clamp";
import { AudiobookRow } from "../../audiobooks/cards";
import { listAudiobooks } from "@/server/audiobooks";

export const metadata: Metadata = { title: "Author" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** One author: their photo, life dates and biography from Open Library, how many of their books can be read or heard free in Reflect and which, and their books in English, best rated first. */
export default async function AuthorPage({ params, searchParams }: { params: Promise<{ author: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const { author } = await params;
  if (!AUTHOR_ID.test(author)) notFound();
  const sp = await searchParams;
  const sort: Sort | undefined = isSort(one(sp.sort)) ? (one(sp.sort) as Sort) : undefined;
  const state: ListState = { ...(sort ? { sort } : {}), ...(isFilter(one(sp.filter)) ? { filter: one(sp.filter) as Filter } : {}), hide: one(sp.hide) === "1" };
  const source: BookSource = { kind: "author", id: author };
  const [a, books, view, open] = await Promise.all([
    authorDetails(author, openLibrary).catch(() => null),
    listBooks(source, 1, sort ?? "rating", state.filter).catch(() => null),
    learnView(user.id),
    // Their public-domain books, most read first, kept to those Reflect can show as text or play as audio.
    listBooks(source, 1, "readinglog", "free").then((b) => b.filter((x) => x.free?.read || x.free?.listen)).catch((): CatalogEntry[] => []),
  ]);
  if (!a) notFound();
  // Authors near this one: the authors of the most read books on the subject of their best rated book.
  const near = books?.[0] ? await booksLike(books[0], openLibrary, 24).catch((): CatalogEntry[] => []) : [];
  const related = [...new Map(near.flatMap((b) => (b.authorKeys?.[0] && b.authors[0] && b.authorKeys[0] !== author ? [[b.authorKeys[0], b.authors[0]] as const] : []))).entries()].slice(0, 8);
  const mine = new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]));
  const photo = authorPhotoUrl(a.photo, "L");
  // Their recordings on LibriVox.
  const names = a.name.toLowerCase().split(/\s+/).filter(Boolean);
  const surname = names[names.length - 1] ?? a.name.toLowerCase();
  // The first name and the surname both, so a namesake (Homer Greene for Robert Greene) is not taken for them.
  const heard = listAudiobooks({ q: surname }, 80).filter((x) => { const by = (x.by ?? "").toLowerCase(); return by.includes(surname) && by.includes(names[0] ?? surname); }).slice(0, 12);
  const meta = [a.birth || a.death ? `${a.birth ?? "?"} – ${a.death ?? ""}` : null, open.length ? freeLine(open.filter((b) => b.free?.read).length, open.filter((b) => b.free?.listen).length) : null].filter(Boolean).join(" · ");
  const H2 = "text-base font-semibold";

  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse?m=books" crumbs={browseCrumbs("books")} title={a.name} />
      <div className="mt-6 space-y-10">
        {/* The hero, as a person's page has it (priority guides, author page): photo, name, one metadata line, two lines of biography. */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={`Photo of ${a.name}`} className="size-24 shrink-0 rounded-full border object-cover shadow-sm sm:size-[120px]" />
          ) : <span aria-hidden className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center rounded-full sm:size-[120px]"><UserIcon className="size-8" /></span>}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{a.name}</h1>
              {meta ? <p className="text-muted-foreground text-[13px]">{meta}</p> : null}
            </div>
            {a.bio ? (
              <div className="text-muted-foreground">
                <Clamp text={plainBio(a.bio)}>
                  {a.wikipedia ? <a href={a.wikipedia} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 underline-offset-4 hover:underline">Wikipedia<ExternalLinkIcon className="size-3" /></a> : null}
                  <a href={`https://openlibrary.org/authors/${author}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">Open Library<ExternalLinkIcon className="size-3" /></a>
                </Clamp>
              </div>
            ) : <p className="text-muted-foreground text-sm">The open library has no biography for this author yet.</p>}
          </div>
        </header>
        {heard.length ? <AudiobookRow title="Hear them here" books={heard} href={`/schole/browse?m=audiobooks&q=${encodeURIComponent(a.name)}`} /> : null}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={H2}>Books <span className="text-muted-foreground font-normal">{SORTS[sort ?? "rating"].toLowerCase()}</span></h2>
            <div className="flex flex-wrap gap-2">
              <FilterMenu path={`/schole/authors/${author}`} base={{}} state={state} />
              <SortMenu path={`/schole/authors/${author}`} base={{}} state={state} />
            </div>
          </div>
          {books === null ? <p className="text-muted-foreground text-sm">The open library did not answer. Try again in a moment.</p> : !books.length ? <p className="text-muted-foreground text-sm">No books in English by this author in the catalog.</p> : (
            <div className="space-y-8">
              <BookGrid books={state.hide ? books.filter((b) => !mine.has(b.work)) : books} mine={mine} />
              <MoreBooks key={JSON.stringify(state)} source={source} sort={sort ?? "rating"} {...(state.filter ? { filter: state.filter } : {})} hide={state.hide} per={PER} first={books.length} />
            </div>
          )}
        </section>
        {related.length ? (
          <section className="space-y-3">
            <h2 className={H2}>Authors on the same subjects</h2>
            <ul className="flex flex-wrap gap-4">
              {related.map(([id, name]) => (
                <li key={id} className="w-20">
                  <Link href={`/schole/authors/${id}`} className="group flex flex-col items-center gap-1.5 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://covers.openlibrary.org/a/olid/${id}-M.jpg`} alt="" loading="lazy" className="bg-muted size-12 rounded-full border object-cover" />
                    <span className="line-clamp-2 text-xs leading-tight group-hover:underline">{name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="text-muted-foreground text-xs">Biography, photo and books from Open Library, written by its contributors.</p>
      </div>
    </main>
  );
}

/** A biography as plain sentences: Open Library's often carries HTML links and a Markdown source line. */
function plainBio(text: string): string {
  return text.replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1").replace(/<[^>]+>/g, "").replace(/\(\[Source\]\[\d+\]\)|\*\*Source\*\*.*$/gims, "").replace(/\[(.*?)\]\[\d+\]/g, "$1").replace(/^\s*\[\d+\]:.*$/gm, "").replace(/\s+\n/g, "\n").trim();
}

/** "12 of their most read books can be read free in Reflect, and 9 heard." */
function freeLine(read: number, listen: number): string {
  const books = (n: number) => `${n} of their most read books`;
  if (read && listen) return `${books(read)} can be read free in Reflect, and ${listen} heard.`;
  if (read) return `${books(read)} can be read free in Reflect.`;
  return `${books(listen)} can be heard free in Reflect.`;
}
