import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mediumOf } from "@reflect/core/ways";
import { coverUrl } from "@reflect/core/openlibrary";
import { daily } from "@reflect/core/work-browse";
import { BROWSE_MEDIA } from "@reflect/core/browse-media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { allExcerpts } from "@/server/excerpt-store";
import { highlightBooks } from "@/server/highlights";
import { restateAction } from "./actions";
import { PAGE } from "@/components/page-header";
import { Suspense } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Head, SPACE } from "@/app/life/space";
import { DiscoverRows } from "./browse/media-page";
import { Upcoming } from "@/app/life/upcoming";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { listExaminations } from "@/server/examination-store";
import { listItems, mergeInputs } from "@/server/ways-store";
import { LearnHeader } from "./header";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
// The shelves' own parameters, from links made before Learn opened to the workspace.
const SHELF_KEYS = ["tab", "book", "filled", "show", "sort", "removed"];
const ROW = "-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&>li]:w-72 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto";
const LINK = "text-muted-foreground hover:text-foreground text-sm underline-offset-2 hover:underline";

type Card = { key: string; href: string; kind: string; title: string; by: string | null; image: string | null; share: number | null; go?: string };

function Cards({ cards }: { cards: Card[] }) {
  return (
    <ul className={ROW}>
      {cards.map((c) => (
        <li key={c.key}>
          <Link href={c.href} className="bg-card hover:bg-accent flex h-full gap-3 rounded-xl border p-3 shadow-xs transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {c.image ? <img src={c.image} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-sm border object-cover" /> : null}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-muted-foreground text-xs">{c.kind}</span>
              <span className="line-clamp-2 text-sm font-medium leading-snug">{c.title}</span>
              {c.by ? <span className="text-muted-foreground truncate text-xs">{c.by}</span> : null}
              {c.share !== null ? <span className="bg-muted mt-auto block h-1 overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : null}
              {c.go ? <span className="text-xs font-medium">{c.go}</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Loading() {
  return <p className="text-muted-foreground text-sm">Finding what to read, hear and watch…</p>;
}

/**
 * Scholē, Aristotle's leisure (Torian, 2026-11-15 02:17Z: "an app for reading and listening to books, listening to
 * podcasts, watching videos ... listening to music, and maybe even games ... We may even show events here ... The
 * user would still have their personal Library"; 03:27Z "Go"). Its front is where you open something: search, every
 * medium, what you are in the middle of to resume, rows to discover across every medium, the events on Scholē's
 * calendar, and your library, with what you want next and three highlights a day to say in your own words.
 */
export default async function SpacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (/^[0-9a-f-]{36}$/.test(one(sp.item))) redirect(`/schole/items/${one(sp.item)}`);
  if (one(sp.tab) === "library") redirect(`/schole/browse${one(sp.q) ? `?q=${encodeURIComponent(one(sp.q))}` : ""}`);
  if (SHELF_KEYS.some((k) => one(sp[k]))) {
    const p = new URLSearchParams();
    for (const k of SHELF_KEYS) if (one(sp[k])) p.set(k, one(sp[k]));
    redirect(`/schole/shelves?${p}`);
  }
  const user = await requireUser();
  await mergeInputs(user.id).catch(() => 0);
  const today = new Date().toISOString().slice(0, 10);
  const [view, items, exams, excerpts] = await Promise.all([learnView(user.id), listItems(user.id), listExaminations(user.id).catch(() => []), allExcerpts(user.id).catch(() => [])]);
  const bookCard = (b: (typeof view.books)[number], resume: boolean): Card => ({
    key: b.id, kind: "Book", title: b.title, by: b.authors[0] ?? null,
    href: b.catalog?.work ? (resume && b.place ? `/schole/works/${b.catalog.work}/read` : `/schole/works/${b.catalog.work}`) : `/schole/shelves?book=${b.id}`,
    image: b.catalog ? coverUrl(b.catalog, "M") : null, share: b.place ? Math.min(1, (b.place.chapter - 1 + b.place.at) / b.place.chapters) : null,
    ...(resume ? { go: b.place ? `Continue at chapter ${b.place.chapter}` : "Open" } : {}),
  });
  const itemCard = (i: (typeof items)[number], resume: boolean): Card => ({
    key: i.id, href: `/schole/items/${i.id}`, kind: mediumOf(i.medium).label, title: i.title, by: i.by, image: i.image,
    share: i.parts && i.part ? Math.min(1, i.part / i.parts) : null,
    ...(resume ? { go: i.parts && i.part ? `Continue: ${i.part} of ${i.parts}` : "Continue" } : {}),
  });
  const now = [...view.books.filter((b) => b.status === "reading").map((b) => bookCard(b, true)), ...items.filter((i) => i.status === "doing").map((i) => itemCard(i, true))];
  const next = [
    ...view.books.filter((b) => b.status === "want").sort((a, b) => (a.wantRank ?? 1e9) - (b.wantRank ?? 1e9)).map((b) => bookCard(b, false)),
    ...items.filter((i) => i.status === "want").map((i) => itemCard(i, false)),
  ].filter((c, i, all) => all.findIndex((x) => x.title.toLowerCase() === c.title.toLowerCase() && x.by === c.by) === i);
  const open = exams.filter((e) => e.status === "open");
  // Today's highlights to restate: three a day, the same all day, from those not yet put in the person's own words.
  const unsaid = excerpts.filter((e) => !e.note);
  const picked = daily(unsaid.length ? unsaid : excerpts, 3, today, user.id);
  const titles = new Map((await highlightBooks(user.id, picked)).map((b) => [b.work, b.title]));
  const kept = view.books.length + items.length;
  return (
    <main className={PAGE}>
      <LearnHeader on="space" />
      <div className={`mt-4 ${SPACE}`}>
        <div className="grid grid-cols-1 gap-3">
          <form action="/schole/browse" role="search" className="relative">
            <input type="hidden" name="m" value="all" />
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input name="q" placeholder="Search books, courses, podcasts, films, music and art" aria-label="Search Scholē" className="h-11 pl-9" />
          </form>
          <nav aria-label="Every medium" className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <ul className="flex gap-1.5 pb-1">
              {BROWSE_MEDIA.map((m) => <li key={m.id}><Link href={`/schole/browse?m=${m.id}`} className="hover:bg-muted inline-flex h-8 items-center rounded-full border px-3 text-sm whitespace-nowrap">{m.label}</Link></li>)}
            </ul>
          </nav>
        </div>

        {now.length ? (
          <section className="grid grid-cols-1 gap-3">
            <Head title="Continue" note="What you are in the middle of, where you left it." />
            <Cards cards={now} />
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Head title="Discover" note="To read, hear, watch and look at here." />
            <Link href="/schole/browse" className={LINK}>Browse everything</Link>
          </div>
          <Suspense fallback={<Loading />}><DiscoverRows userId={user.id} n={6} /></Suspense>
        </section>

        <Upcoming userId={user.id} tile="learn" today={today} title="Events" note="Lectures, readings and gatherings on your Scholē calendar in the next two weeks." />

        <section id="library" className="grid grid-cols-1 scroll-mt-20 gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Head title="Your library" note={kept ? `${kept} kept, on your shelves by the ways of learning.` : "What you keep, on your shelves by the ways of learning."} />
            <Link href="/schole/shelves" className={LINK}>Open your shelves</Link>
          </div>
          <ul className="flex flex-wrap gap-2 text-sm">
            {[["Reading", "/schole/reading"], ["Highlights", "/schole/highlights"], ["Claims", "/schole/shelves?tab=claims"], ["Lists", "/schole/lists"]].map(([label, href]) => <li key={href}><Link href={href!} className="hover:bg-accent block rounded-lg border px-3 py-2 font-medium">{label}</Link></li>)}
          </ul>
          {next.length ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-semibold">Next</h3>
                {next.length > 6 ? <Link href="/schole/shelves?show=want" className={LINK}>All {next.length}</Link> : null}
              </div>
              <Cards cards={next.slice(0, 6)} />
            </div>
          ) : null}
          {picked.length ? (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <h3 className="font-semibold">Today</h3>
                <p className="text-muted-foreground text-sm">Three of your highlights. Say each in your own words; what you write is kept as its note.</p>
              </div>
              <ul className={ROW}>
                {picked.map((e) => (
                  <li key={e.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
                    <blockquote className="line-clamp-6 border-l-2 pl-3 text-sm leading-relaxed">{e.quote}</blockquote>
                    <Link href={`/schole/works/${e.work}`} className="text-muted-foreground text-xs hover:underline">{titles.get(e.work) ?? "The book"}</Link>
                    <form action={restateAction.bind(null, e.id, e.work)} className="mt-auto grid gap-2">
                      <Textarea name="words" defaultValue={e.note ?? ""} rows={3} placeholder="In your own words" aria-label="In your own words" className="text-sm" />
                      <div><Button type="submit" size="sm" variant="outline">Keep it</Button></div>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {open.length ? (
            <div className="grid grid-cols-1 gap-3">
              <h3 className="font-semibold">Your examinations</h3>
              <ul className="divide-y rounded-xl border text-sm">
                {open.slice(0, 5).map((e) => <li key={e.id}><Link href={`/schole/examinations/${e.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 px-4 py-2"><span className="min-w-0 truncate font-medium">{e.courseTitle}</span><span className="text-muted-foreground shrink-0 text-xs">{e.examiners.length} {e.examiners.length === 1 ? "examiner" : "examiners"}</span></Link></li>)}
                {open.length > 5 ? <li className="text-muted-foreground px-4 py-2 text-xs">{open.length - 5} more open</li> : null}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
