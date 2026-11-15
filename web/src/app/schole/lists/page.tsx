import type { Metadata } from "next";
import Link from "next/link";
import { LISTS, bestListMatch, listBookQuery, type ListBook } from "@reflect/core/lists";
import { ITEM_LISTS } from "@reflect/core/item-lists";
import { coverUrl, searchBooks } from "@reflect/core/openlibrary";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { openLibrary } from "@/server/browse";
import { LearnHeader, LibraryTabs } from "../header";
import { ICON } from "../browse/media";

export const metadata: Metadata = { title: "Lists" };

/** The first books of a list, as covers, found in the open library (cached for an hour). */
async function firstCovers(books: readonly ListBook[]) {
  const found = await Promise.all(books.slice(0, 4).map((b) => searchBooks(listBookQuery(b), openLibrary, 6).then((r) => bestListMatch(b, r)).catch(() => null)));
  return found.map((b) => (b ? coverUrl(b, "M") : null));
}

/** Up to four covers fanned out, the first in front; a blank card where a cover is missing. */
function Fan({ covers }: { covers: (string | null)[] }) {
  return (
    <div className="bg-muted/60 relative flex h-36 items-end justify-center overflow-hidden rounded-lg border pt-4">
      {covers.map((c, i) => {
        const offset = (i - (covers.length - 1) / 2) * 44;
        return (
          <div key={i} className="bg-background absolute bottom-[-10px] h-28 w-[74px] overflow-hidden rounded-sm border shadow-sm" style={{ transform: `translateX(${offset}px) rotate(${(i - (covers.length - 1) / 2) * 5}deg)`, zIndex: covers.length - i }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c ? <img src={c} alt="" loading="lazy" className="size-full object-cover" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/** Lists chosen by others, each with who chose it: books first, then courses, debates, plays and films. */
export default async function ListsPage() {
  await requireUser();
  const covers = await Promise.all(LISTS.map((l) => firstCovers(l.books)));
  return (
    <main className={PAGE}>
      <LearnHeader on="lists" />
      <LibraryTabs on="lists" className="mt-4" />
      <section className="mt-6 space-y-8">
        <p className="text-muted-foreground text-[13px]">Lists chosen by others, each credited to its source.</p>
        <ul className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {LISTS.map((l, n) => (
            <li key={l.id}>
              <Link href={`/schole/lists/${l.id}`} className="group block space-y-2.5">
                <Fan covers={covers[n]!} />
                <div className="space-y-0.5">
                  <p className="font-semibold group-hover:underline group-hover:underline-offset-2">{l.name}</p>
                  <p className="text-muted-foreground line-clamp-1 text-[13px]">{l.books.length} books · {l.source}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Courses, debates, plays and films</h2>
          <ul className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
            {ITEM_LISTS.map((l) => {
              const media = [...new Set(l.items.map((i) => i.medium))];
              return (
                <li key={l.id}>
                  <Link href={`/schole/lists/items/${l.id}`} className="group hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg p-2">
                    <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-5">{ICON[media[0]!]}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium group-hover:underline group-hover:underline-offset-2">{l.name}</span>
                      <span className="text-muted-foreground block truncate text-[13px]">{l.items.length} {l.items.length === 1 ? "item" : "items"} · {l.source}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
