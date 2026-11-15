import Link from "next/link";
import { searchShelves } from "@/server/passages";

/** Where a word or phrase occurs in the whole text of the person's books that read free in Reflect, each place opening the reader at it. */
export async function Results({ userId, q }: { userId: string; q: string }) {
  const { books, searched, unread } = await searchShelves(userId, q);
  const total = books.reduce((n, b) => n + b.total, 0);
  return (
    <section className="mt-6 space-y-8">
      <p className="text-muted-foreground text-sm">
        {searched === 0 ? "None of the books on your shelves can be read free in Reflect yet." : total === 0 ? `“${q}” is not in the ${searched} ${searched === 1 ? "book" : "books"} searched.` : `“${q}” occurs ${total} ${total === 1 ? "time" : "times"} in ${books.length} of the ${searched} ${searched === 1 ? "book" : "books"} searched.`}
        {unread ? ` ${unread} ${unread === 1 ? "text" : "texts"} did not load; try again in a moment.` : ""}
      </p>
      {books.map((b) => (
        <div key={b.work} className="space-y-2">
          <p className="flex flex-wrap items-baseline justify-between gap-2">
            <Link href={`/schole/works/${b.work}`} className="text-base font-semibold hover:underline">{b.title}</Link>
            <Link href={`/schole/works/${b.work}/read?q=${encodeURIComponent(q)}`} className="text-muted-foreground text-xs underline-offset-2 hover:underline">{b.total} {b.total === 1 ? "place" : "places"}{b.total > b.hits.length ? ", see all" : ""}</Link>
          </p>
          <p className="text-muted-foreground -mt-2 text-sm">{b.author}</p>
          <ol className="space-y-2">
            {b.hits.map((h, i) => (
              <li key={i}>
                <Link href={`/schole/works/${b.work}/read?c=${h.chapter}&find=${encodeURIComponent(q)}&p=${h.p}`} className="hover:bg-muted/60 -mx-3 block rounded-lg p-3">
                  <span className="text-muted-foreground block text-xs">{b.chapters[i]}</span>
                  <span className="mt-1 block font-serif">{h.before}<mark className="rounded-sm bg-sky-200/80 text-inherit">{h.match}</mark>{h.after}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}
