import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "lucide-react";
import { coverUrl } from "@reflect/core/openlibrary";
import { HIGHLIGHT_COLORS, isHighlightColor } from "@reflect/core/excerpts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { allExcerpts } from "@/server/excerpt-store";
import { highlightBooks } from "@/server/highlights";
import { publishedBy } from "@/server/published-store";
import { LearnHeader } from "../header";
import { TodayHighlights } from "./today";
import { ExcerptItem } from "../excerpt-item";
import { COLOR } from "../colors";
import { HighlightsMore } from "./more";
import { Results } from "../passages/results";
import { PASSAGE_BOOKS } from "@/server/passages";

export const metadata: Metadata = { title: "Highlights" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Every highlight and excerpt the person keeps, from every book, grouped by book (the book with the newest first)
 * and in reading order within it; searchable by words, note or book, and narrowed by colour. Exported as Markdown,
 * sent into the journal, or added to from a Kindle's My Clippings.txt.
 */
export default async function HighlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const color = one(sp.color);
  const books = one(sp.in) === "books";
  const [excerpts, published] = await Promise.all([allExcerpts(user.id), publishedBy(user.id).catch(() => [])]);
  const byBook = await highlightBooks(user.id, excerpts);
  const low = q.toLowerCase();
  const shown = byBook
    .map((b) => ({ ...b, excerpts: b.excerpts.filter((e) => (!isHighlightColor(color) || e.color === color) && (!low || e.quote.toLowerCase().includes(low) || (e.note ?? "").toLowerCase().includes(low) || b.title.toLowerCase().includes(low) || b.author.toLowerCase().includes(low))) }))
    .filter((b) => b.excerpts.length);
  const count = shown.reduce((n, b) => n + b.excerpts.length, 0);
  const href = (c: string) => `/schole/highlights?${new URLSearchParams({ ...(q ? { q } : {}), ...(c ? { color: c } : {}) })}`;

  return (
    <>
      <LearnHeader on="highlights" />
      <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex min-w-0 flex-1 gap-2" role="search">
            {books ? <input type="hidden" name="in" value="books" /> : isHighlightColor(color) ? <input type="hidden" name="color" value={color} /> : null}
            <Input name="q" defaultValue={q} placeholder={books ? "A word or phrase inside your books" : "Search your highlights"} aria-label={books ? "Search inside your books" : "Search your highlights"} className="h-9" />
            <Button type="submit" variant="outline" size="icon" className="size-9 shrink-0" aria-label="Search"><SearchIcon /></Button>
          </form>
          <HighlightsMore />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Search in" className="bg-muted/60 inline-flex rounded-lg p-0.5 text-[13px]">
            <Link href={`/schole/highlights${q ? `?q=${encodeURIComponent(q)}` : ""}`} aria-current={!books ? "page" : undefined} className={cn("rounded-md px-3 py-1", !books ? "bg-background font-medium shadow-xs" : "text-muted-foreground")}>Your highlights</Link>
            <Link href={`/schole/highlights?in=books${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={books ? "page" : undefined} className={cn("rounded-md px-3 py-1", books ? "bg-background font-medium shadow-xs" : "text-muted-foreground")}>Inside your books</Link>
          </nav>
          {!books ? (
            <div className="flex items-center gap-1" aria-label="Colour">
              <Link href={href("")} aria-current={!isHighlightColor(color) ? "page" : undefined} className={cn("rounded-full px-2 py-0.5 text-[13px]", !isHighlightColor(color) ? "bg-muted font-medium" : "text-muted-foreground")}>All</Link>
              {HIGHLIGHT_COLORS.map((c) => (
                <Link key={c} href={href(c)} aria-label={COLOR[c].name} title={COLOR[c].name} aria-current={color === c ? "page" : undefined} className={cn("flex size-7 items-center justify-center rounded-full", color === c && "bg-muted")}><span className={cn("size-3 rounded-full", COLOR[c].dot)} /></Link>
              ))}
            </div>
          ) : null}
        </div>
        {books ? (
          q.length >= 2 ? (
            <Suspense key={q} fallback={<p className="text-muted-foreground mt-6 text-sm">Searching your books…</p>}>
              <Results userId={user.id} q={q} />
            </Suspense>
          ) : <p className="text-muted-foreground mt-6 text-[13px]">Looks for words in the whole text of the books on your shelves that read free in Reflect (up to {PASSAGE_BOOKS} of them, the ones you are reading first).</p>
        ) : <>
        <p className="text-muted-foreground mt-4 text-[13px]">{excerpts.length === 0 ? "Highlight a passage while you read, add an excerpt on a book's page, or import your Kindle highlights from More, and it shows here." : `${count} ${count === 1 ? "excerpt" : "excerpts"} from ${shown.length} ${shown.length === 1 ? "book" : "books"}${q || isHighlightColor(color) ? ` (of ${excerpts.length})` : ""}.`}</p>
        {!q && !isHighlightColor(color) ? <div className="mt-6"><TodayHighlights userId={user.id} excerpts={excerpts} today={new Date().toISOString().slice(0, 10)} /></div> : null}
        <div className="mt-6 space-y-10">
          {shown.map((b) => {
            const cover = coverUrl(b, "S");
            return (
              <section key={b.work} className="space-y-3">
                <Link href={`/schole/works/${b.work}`} className="flex items-center gap-3">
                  {cover ? <img src={cover} alt="" className="h-14 w-10 rounded-sm object-cover" /> : <span className="bg-muted h-14 w-10 rounded-sm" />}
                  <span>
                    <span className="block text-base leading-tight font-semibold">{b.title}</span>
                    <span className="text-muted-foreground text-sm">{b.author}</span>
                  </span>
                </Link>
                <ul className="space-y-4">
                  {b.excerpts.map((e) => (
                    <ExcerptItem key={e.id} reader={`/schole/works/${b.work}/read`} row={{ id: e.id, work: b.work, title: b.title, author: b.author, quote: e.quote, where: e.where ?? null, chapter: e.anchor?.chapter ?? null, note: e.note, color: e.color, published: published.find((p) => p.work === b.work && p.quote === e.quote.replace(/\s+/g, " ").trim())?.id ?? null }} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        </>}
      </main>
    </>
  );
}
