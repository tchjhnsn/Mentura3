import type { Metadata } from "next";
import Link from "next/link";
import { byMonth, calendar, streak } from "@reflect/core/habits";
import { coverUrl } from "@reflect/core/openlibrary";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { goalFor, learnView, readingDays } from "@/server/learn-store";
import { listItems } from "@/server/ways-store";
import { mediumOf } from "@reflect/core/ways";
import { ROW_LINE } from "../row-line";
import { LearnHeader } from "../header";
import { FinishedDay, Goal, WantList } from "./parts";
import { heardIn } from "@reflect/core/podcast-library";
import { keptShows } from "@/server/podcast-library";

export const metadata: Metadata = { title: "Reading" };
export const dynamic = "force-dynamic";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * The person's reading: what they are reading now, a goal for the year if they set one, the days they read in
 * Reflect, Want to read in their own order, and the books they finished, year by year, each with the day.
 */
export default async function ReadingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const thisYear = Number(today.slice(0, 4));
  const view = await learnView(user.id);
  const finished = view.books.filter((b) => b.status === "read" && b.finishedOn);
  const years = [...new Set([thisYear, ...finished.map((b) => Number(b.finishedOn!.slice(0, 4)))])].sort((a, b) => b - a);
  const asked = Number(one((await searchParams).y));
  const year = years.includes(asked) ? asked : thisYear;
  const from = `${thisYear - 1}-${today.slice(5)}`;
  const [goal, days] = await Promise.all([goalFor(user.id, year), readingDays(user.id, from, today)]);
  const months = byMonth(finished, year);
  const doneInYear = [...months.values()].reduce((n, l) => n + l.length, 0);
  const reading = view.books.filter((b) => b.status === "reading");
  const want = view.books.filter((b) => b.status === "want").sort((a, b) => (a.wantRank ?? 1e9) - (b.wantRank ?? 1e9));
  const run = streak(days, today);
  const weeks = calendar(days, today, 26);
  const thisYearDays = days.filter((d) => d.startsWith(`${thisYear}-`)).length;
  const cover = (b: (typeof view.books)[number], size: "S" | "M" = "S") => (b.catalog ? coverUrl(b.catalog, size) : null);
  const heard = heardIn(year, await keptShows(user.id).catch(() => []));
  const hours = (s: number) => (s >= 3600 ? `${Math.round((s / 3600) * 10) / 10} hours` : `${Math.round(s / 60)} minutes`);
  const items = (await listItems(user.id).catch(() => [])).filter((i) => i.status === "done" && i.finishedOn?.startsWith(`${year}-`)).sort((a, b) => a.finishedOn!.localeCompare(b.finishedOn!));

  return (
    <>
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
        <LearnHeader on="reading" />
        <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          <div className="min-w-0 space-y-12">
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Reading now</h2>
          {reading.length ? (
            <ul className={ROW_LINE}>
              {reading.map((b, n) => {
                const href = b.catalog?.work ? `/schole/works/${b.catalog.work}${b.place ? "/read" : ""}` : null;
                const pct = b.place ? Math.round((b.place.chapter / b.place.chapters) * 100) : null;
                return (
                  <li key={b.id} className="min-w-0 space-y-2">
                    <Link href={href ?? "#"} className="group block space-y-2">
                      <div className="bg-muted relative aspect-[2/3] overflow-hidden rounded-md border transition group-hover:opacity-90">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {cover(b, "M") ? <img src={cover(b, "M")!} alt="" className="size-full object-cover" /> : <span className="text-muted-foreground flex size-full items-center justify-center p-2 text-center text-xs">{b.title}</span>}
                        {pct !== null ? <span className="bg-foreground/10 absolute inset-x-0 bottom-0 h-1"><span className="bg-foreground/70 block h-full" style={{ width: `${pct}%` }} /></span> : null}
                      </div>
                      <span className="block space-y-0.5">
                        <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:underline group-hover:underline-offset-2">{b.title}</span>
                        <span className="text-muted-foreground block truncate text-xs">{b.place ? `Chapter ${b.place.chapter} of ${b.place.chapters}` : b.authors[0] ?? ""}</span>
                      </span>
                    </Link>
                    {n === 0 && href ? <Button asChild size="sm" className="w-full"><Link href={href}>{b.place ? "Continue" : "Open"}</Link></Button> : null}
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-muted-foreground text-sm">No book marked Reading. <Link href="/schole/browse?m=books" className="text-foreground underline underline-offset-2">Find one in Browse</Link>.</p>}
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Want to read</h2>
          <WantList books={want.map((b) => ({ id: b.id, title: b.title, author: b.authors[0] ?? "", work: b.catalog?.work ?? null, cover: cover(b) }))} />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Your year in books, {year}</h2>
            {years.length > 1 ? (
              <nav className="flex flex-wrap gap-1 text-sm" aria-label="Year">
                {years.map((y) => <Link key={y} href={`/schole/reading?y=${y}`} aria-current={y === year ? "page" : undefined} className={cn("rounded-full border px-3 py-1", y === year && "bg-muted")}>{y}</Link>)}
              </nav>
            ) : null}
          </div>
          {doneInYear ? (
            <>
              <p className="text-sm">{doneInYear} {doneInYear === 1 ? "book" : "books"} finished in {year}.</p>
              <div className="space-y-6">
                {[...months.entries()].map(([m, list]) => (
                  <div key={m} className="space-y-2">
                    <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{MONTHS[m - 1]}</h3>
                    <ul className="space-y-2">
                      {list.map((b) => (
                        <li key={b.id} className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {cover(b) ? <img src={cover(b)!} alt="" className="h-12 w-8 rounded-sm object-cover" /> : <span className="bg-muted h-12 w-8 rounded-sm" />}
                          <span className="min-w-0 flex-1">
                            {b.catalog?.work ? <Link href={`/schole/works/${b.catalog.work}`} className="block truncate text-sm font-medium hover:underline">{b.title}</Link> : <span className="block truncate text-sm font-medium">{b.title}</span>}
                            <span className="text-muted-foreground block truncate text-xs">{b.authors[0] ?? ""}</span>
                          </span>
                          <FinishedDay bookId={b.id} day={b.finishedOn!} max={today} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-muted-foreground text-sm">No books finished in {year} yet. When you mark a book Read, the day is kept here, and you can change it.</p>}
        </section>

        {heard.episodes ? (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Episodes heard, {year}</h2>
            <p className="text-sm">{heard.episodes} {heard.episodes === 1 ? "episode" : "episodes"} heard to the end, {hours(heard.seconds)}.</p>
            <ul className="space-y-2">
              {heard.shows.map((s) => (
                <li key={s.item} className="flex items-center gap-3 text-sm">
                  <Link href={`/schole/items/${s.item}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{s.title}</Link>
                  <span className="text-muted-foreground shrink-0 text-xs">{s.episodes} · {hours(s.seconds)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Beyond books, {year}</h2>
          {items.length ? (
            <ul className="space-y-2">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-16 shrink-0 text-xs">{MONTHS[Number(i.finishedOn!.slice(5, 7)) - 1]?.slice(0, 3)} {Number(i.finishedOn!.slice(8, 10))}</span>
                  <Link href={`/schole/items/${i.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{i.title}</Link>
                  <span className="text-muted-foreground shrink-0 text-xs">{mediumOf(i.medium).done}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-sm">No lectures, films, music or games finished in {year} yet.</p>}
        </section>
          </div>
          <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start lg:border-l lg:pl-8">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Goal</h2>
          <Goal year={year} goal={goal} done={doneInYear} />
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Days of learning</h2>
          <p className="text-muted-foreground text-[13px]">{thisYearDays} {thisYearDays === 1 ? "day" : "days"} in {thisYear}{run > 1 ? `, the last ${run} in a row` : ""}.</p>
          <div className="overflow-x-auto" title="A day counts when you read a book on your shelves in Reflect, or start, finish, watch or practise something on your shelves.">
            <div className="flex gap-[2px] lg:gap-px" role="img" aria-label={`Days read over the last 26 weeks: ${days.filter((d) => d >= weeks[0]![0]!.day).length}`}>
              {weeks.map((w, i) => (
                <div key={i} className="flex flex-col gap-[2px] lg:gap-px">
                  {w.map((d, j) => <span key={j} title={d ? `${d.day}${d.read ? ", read" : ""}` : undefined} className={cn("size-2 rounded-[2px] lg:size-[6px]", !d ? "bg-transparent" : d.read ? "bg-foreground/70" : "bg-muted")} />)}
                </div>
              ))}
            </div>
          </div>
        </section>

          </aside>
        </div>
      </main>
    </>
  );
}
