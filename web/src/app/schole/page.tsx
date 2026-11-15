import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mediumOf } from "@reflect/core/ways";
import { coverUrl } from "@reflect/core/openlibrary";
import { BROWSE_MEDIA } from "@reflect/core/browse-media";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { Suspense } from "react";
import { ChevronRightIcon, SearchIcon } from "lucide-react";
import { CoverImg } from "./cover-img";
import { Input } from "@/components/ui/input";
import { Head, SPACE } from "@/app/life/space";
import { DiscoverRows } from "./browse/media-page";
import { Upcoming } from "@/app/life/upcoming";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { lastActivity, listItems, mergeInputs } from "@/server/ways-store";
import { LearnHeader } from "./header";
import { newEpisodeCards } from "@/server/new-episodes";
import { NewEpisodeCards } from "./podcasts/new-episodes";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
// The shelves' own parameters, from links made before Learn opened to the workspace.
const SHELF_KEYS = ["tab", "book", "filled", "show", "sort", "removed"];

type Card = { key: string; href: string; kind: string; title: string; by: string | null; image: string | null; share: number | null; where: string | null };

/** The one thing the person last played: the page's largest card and its one filled button (priority guides, front page P1). */
function Hero({ c }: { c: Card }) {
  return (
    <div className="bg-card flex gap-4 rounded-xl border p-4 shadow-xs">
      <Link href={c.href} className="shrink-0" aria-label={c.title}>
        <span className="bg-muted text-muted-foreground relative flex size-24 items-center justify-center overflow-hidden rounded-lg border text-xs shadow-sm">{c.kind}{c.image ? <CoverImg src={c.image} className="absolute inset-0 size-full object-cover" /> : null}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-xs">{c.kind}</span>
        <Link href={c.href} className="line-clamp-2 text-lg font-semibold leading-snug hover:underline hover:underline-offset-4">{c.title}</Link>
        <span className="text-muted-foreground truncate text-[13px]">{[c.by, c.where].filter(Boolean).join(" · ")}</span>
        {c.share !== null ? <span className="bg-muted mt-1 block h-1 max-w-xs overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : null}
        <div className="mt-auto pt-2"><Button asChild size="lg" className="h-10 w-full sm:w-auto sm:px-8"><Link href={c.href}>Continue</Link></Button></div>
      </div>
    </div>
  );
}

/** The rest of what is under way: small cards in one row, art, title and progress; a tap opens it. */
function UnderWay({ cards }: { cards: Card[] }) {
  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {cards.map((c) => (
        <li key={c.key} className="w-28 shrink-0 snap-start">
          <Link href={c.href} className="group block space-y-1.5">
            <span className="bg-muted text-muted-foreground relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border px-2 text-center text-xs transition-opacity group-hover:opacity-90">{c.kind}{c.image ? <CoverImg src={c.image} className="absolute inset-0 size-full object-cover" /> : null}</span>
            <span className="line-clamp-2 text-sm font-medium leading-tight group-hover:underline">{c.title}</span>
            {c.share !== null ? <span className="bg-muted block h-1 overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : <span className="text-muted-foreground block text-xs">{c.kind}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Episodes of the shows the person keeps, out in the last two weeks and not yet begun. Nothing when there are none. */
async function NewFromShows({ userId, today }: { userId: string; today: string }) {
  const since = new Date(Date.parse(today) - 14 * 86400000).toISOString().slice(0, 10);
  const fresh = await newEpisodeCards(userId, since, today, { limit: 3 });
  if (!fresh.length) return null;
  return (
    <section className="grid grid-cols-1 gap-3">
      <Head title="New from your shows" href="/schole/podcasts/new" note="Episodes out in the last two weeks that you have not begun." />
      <NewEpisodeCards cards={fresh} row />
    </section>
  );
}

function Loading() {
  return <p className="text-muted-foreground text-sm">Finding what to read, hear and watch…</p>;
}

/**
 * Scholē, Aristotle's leisure (Torian, 2026-11-15 02:17Z), laid out by its priority guide (2026-11-15, "The rest of
 * Scholē"). Primary: search, and the last thing the person played as the page's one large card with its one filled
 * button, Continue; the rest under way in a row of small cards. Secondary: new episodes from their shows, and Discover
 * with only audiobooks, podcasts, films and courses, the other media as chips. Tertiary: events (only when there are
 * some) and one line to the library. Highlights to restate live on Highlights, examinations on their course.
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
  const [view, items, recent] = await Promise.all([learnView(user.id), listItems(user.id), lastActivity(user.id).catch(() => new Map<string, number>())]);
  const bookCard = (b: (typeof view.books)[number]): Card => ({
    key: b.id, kind: "Book", title: b.title, by: b.authors[0] ?? null,
    href: b.catalog?.work ? (b.place ? `/schole/works/${b.catalog.work}/read` : `/schole/works/${b.catalog.work}`) : `/schole/shelves?book=${b.id}`,
    image: b.catalog ? coverUrl(b.catalog, "M") : null, share: b.place ? Math.min(1, (b.place.chapter - 1 + b.place.at) / b.place.chapters) : null,
    where: b.place ? `Chapter ${b.place.chapter} of ${b.place.chapters}` : null,
  });
  const itemCard = (i: (typeof items)[number]): Card => {
    const kind = mediumOf(i.medium).label;
    return {
      key: i.id, href: `/schole/items/${i.id}`, kind, title: i.title, by: i.by, image: i.image,
      share: i.parts && i.part ? Math.min(1, i.part / i.parts) : null,
      where: i.parts && i.part ? `${i.medium === "course" ? "Lecture" : "Part"} ${i.part} of ${i.parts}` : null,
    };
  };
  // Under way, the last played first (priority guides, front page: one large card, the rest in a row).
  const now = [...view.books.filter((b) => b.status === "reading").map(bookCard), ...items.filter((i) => i.status === "doing").map(itemCard)]
    .sort((a, b) => (recent.get(b.key) ?? 0) - (recent.get(a.key) ?? 0));
  const [last, ...rest] = now;
  const kept = view.books.length + items.length;
  const others = BROWSE_MEDIA.filter((m) => !["audiobooks", "podcast", "film", "course"].includes(m.id));
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

        {last ? (
          <section className="grid grid-cols-1 gap-3" aria-label="Continue">
            <h2 className="text-xl font-semibold tracking-tight">Continue</h2>
            <Hero c={last} />
            {rest.length ? <UnderWay cards={rest} /> : null}
          </section>
        ) : null}

        <div className="[&_h2]:text-xl"><Suspense fallback={null}><NewFromShows userId={user.id} today={today} /></Suspense></div>

        <section className="grid grid-cols-1 gap-3">
          {/* Discover is a section and its rows are parts of it, so its heading is larger and theirs smaller. */}
          <h2 className="text-xl font-semibold tracking-tight"><Link href="/schole/browse" className="group inline-flex items-center gap-0.5 hover:underline hover:underline-offset-4">Discover<ChevronRightIcon className="text-muted-foreground size-5 transition group-hover:translate-x-0.5" /></Link></h2>
          <div className="space-y-6 [&_h2]:text-base"><Suspense fallback={<Loading />}><DiscoverRows userId={user.id} n={6} focus /></Suspense></div>
          <nav aria-label="More to explore" className="pt-2">
            <h3 className="text-muted-foreground mb-2 text-sm">More to explore</h3>
            <ul className="flex flex-wrap gap-1.5">
              {others.map((m) => <li key={m.id}><Link href={`/schole/browse?m=${m.id}`} className="hover:bg-muted inline-flex h-8 items-center rounded-full border px-3 text-sm">{m.label}</Link></li>)}
            </ul>
          </nav>
        </section>

        <Upcoming userId={user.id} tile="learn" today={today} title="Events" note="Lectures, readings and gatherings on your Scholē calendar in the next two weeks." hideEmpty />

        <section id="library" className="scroll-mt-20 border-t pt-6">
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <Link href="/schole/shelves" className="text-base font-semibold hover:underline hover:underline-offset-4">Your library</Link>
            <span className="text-muted-foreground">{kept} kept</span>
            {[["Highlights", "/schole/highlights"], ["Lists", "/schole/lists"], ["Reading", "/schole/reading"]].map(([label, href]) => <Link key={href} href={href!} className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">{label}</Link>)}
          </p>
        </section>
      </div>
    </main>
  );
}
