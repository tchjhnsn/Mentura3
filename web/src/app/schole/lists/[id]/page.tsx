import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bestListMatch, listBookQuery, listById, pathProgress } from "@reflect/core/lists";
import { coverUrl, searchBooks, type CatalogEntry } from "@reflect/core/openlibrary";
import { cn } from "@/lib/utils";
import { BookOpenIcon, HeadphonesIcon } from "lucide-react";
import { STATUS } from "../../book-card";
import { FollowList } from "./follow";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { openLibrary } from "@/server/browse";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs } from "../../crumbs";

export const metadata: Metadata = { title: "List" };
export const dynamic = "force-dynamic";

/**
 * One list, read in its order: each book numbered, found in the open library by title and author, with where the
 * person is with it, how many they have read, and the next one. Read in this order puts the books not on their
 * shelves on Want to read in the list's order.
 */
export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const list = listById((await params).id);
  if (!list) notFound();
  const [found, view] = await Promise.all([
    Promise.all(list.books.map((b) => searchBooks(listBookQuery(b), openLibrary, 6).then((r) => bestListMatch(b, r)).catch(() => null))),
    learnView(user.id),
  ]);
  const books = [...new Map(found.filter((b): b is CatalogEntry => b !== null).map((b) => [b.work, b])).values()];
  const missing = list.books.filter((_, i) => !found[i]);
  const mine = new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]));
  const progress = pathProgress(books.map((b) => mine.get(b.work) ?? null));
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/lists" crumbs={[...browseCrumbs(), { label: "Lists", href: "/schole/lists" }]} title={list.name} />
      <section className="mt-8 space-y-6">
        <div className="space-y-2">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{list.name}</h1>
          <p className="text-muted-foreground text-[13px]">{list.books.length} books · {list.source}</p>
          <p className="text-muted-foreground line-clamp-3 max-w-prose text-sm">{list.about}</p>
        </div>
        {books.length ? (
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  <span className="font-medium">{progress.read} of {books.length} read</span>
                  {progress.next !== null ? <span className="text-muted-foreground"> · next, <Link href={`/schole/works/${books[progress.next]!.work}`} className="text-foreground underline underline-offset-2">{books[progress.next]!.title}</Link></span> : <span className="text-muted-foreground"> · the whole list</span>}
                </p>
                <FollowList id={list.id} missing={books.filter((b) => !mine.has(b.work)).length} />
              </div>
              <div className="bg-border h-1 overflow-hidden rounded-full"><div className="bg-foreground/70 h-full" style={{ width: `${(progress.read / books.length) * 100}%` }} /></div>
            </div>
            <ol className="-mx-2">
              {books.map((b, i) => {
                const st = mine.get(b.work);
                const cover = coverUrl(b, "M");
                return (
                  <li key={b.work}>
                    <Link href={`/schole/works/${b.work}`} className={cn("group hover:bg-muted/60 flex items-center gap-3 rounded-lg p-2", i === progress.next && "bg-muted/60")}>
                      <span className="text-muted-foreground w-6 shrink-0 text-right text-[13px] tabular-nums">{i + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {cover ? <img src={cover} alt="" loading="lazy" className="h-[72px] w-12 shrink-0 rounded-sm border object-cover" /> : <span className="bg-muted h-[72px] w-12 shrink-0 rounded-sm border" />}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[15px] leading-snug font-medium group-hover:underline group-hover:underline-offset-2">{b.title}</span>
                        <span className="text-muted-foreground block truncate text-[13px]">{b.authors[0] ?? "Author not given"}{b.year ? ` · ${b.year}` : ""}</span>
                        {b.free?.listen || b.free?.read ? (
                          <span className="mt-1 flex gap-1">
                            {b.free.listen ? <span className="bg-muted flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"><HeadphonesIcon className="size-3" />Listen</span> : null}
                            {b.free.read ? <span className="bg-muted flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium"><BookOpenIcon className="size-3" />Read</span> : null}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-[13px]">{st ? STATUS[st] ?? "" : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </>
        ) : <p className="text-muted-foreground text-sm">The open library did not answer. Try again in a moment.</p>}
        {books.length && missing.length ? <p className="text-muted-foreground text-[13px]">Not found in the open library: {missing.map((b) => (b.author ? `${b.title} (${b.author})` : b.title)).join(", ")}.</p> : null}
      </section>
    </main>
  );
}
