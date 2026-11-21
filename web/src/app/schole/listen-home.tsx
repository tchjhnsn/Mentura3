// S1.0 Listen first (Torian, 2026-11-21 19:03Z: Scholē is as much Audible and Snipd as a course app). The top of Home is
// what the person is listening to or watching: the last thing played as one large card with Continue, the rest under
// way in a row, and new episodes from their shows. With nothing under way, playlists chosen by people. This is the old
// front page's Continue (guide "Home, browse and library", 2026-11-15), kept.
import Link from "next/link";
import { Suspense } from "react";
import { mediumOf } from "@reflect/core/ways";
import { instrumentByUrl, instrumentHref } from "@reflect/core/instruments";
import { coverUrl } from "@reflect/core/openlibrary";
import { COLLECTIONS, suggestCollections } from "@reflect/core/collections";
import { recommend } from "@reflect/core/recommend";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { learnView } from "@/server/learn-store";
import { lastActivity, listItems, mergeInputs } from "@/server/ways-store";
import { newEpisodeCards } from "@/server/new-episodes";
import { signalsOf } from "@/server/recommend";
import { Art } from "./art";
import { CollectionCard } from "./playlists/card";
import { NewEpisodeCards } from "./podcasts/new-episodes";

type Card = { key: string; href: string; kind: string; title: string; by: string | null; image: string | null; share: number | null; where: string | null };

function Hero({ c }: { c: Card }) {
  return (
    <div className="bg-card flex gap-4 rounded-xl border p-4">
      <Link href={c.href} className="shrink-0" aria-label={c.title}><Art image={c.image} kind={c.kind} title={c.title} small className="size-24 shadow-sm sm:size-28" /></Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{c.kind}</span>
        <Link href={c.href} className="line-clamp-2 text-lg font-semibold leading-snug hover:underline">{c.title}</Link>
        <span className="text-muted-foreground truncate text-[13px]">{[c.by, c.where].filter(Boolean).join(" · ")}</span>
        {c.share !== null ? <span className="bg-muted mt-1 block h-1 max-w-xs overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : null}
        <div className="mt-auto pt-2"><Button asChild size="lg" className="w-full sm:w-auto sm:px-8"><Link href={c.href}>Continue</Link></Button></div>
      </div>
    </div>
  );
}

function UnderWay({ cards }: { cards: Card[] }) {
  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {cards.map((c) => (
        <li key={c.key} className="w-28 shrink-0 snap-start">
          <Link href={c.href} className="group block space-y-1.5">
            <Art image={c.image} kind={c.kind} title={c.title} className="aspect-square w-full transition-opacity group-hover:opacity-90" />
            <span className="line-clamp-2 text-sm font-medium leading-tight group-hover:underline">{c.title}</span>
            {c.share !== null ? <span className="bg-muted block h-1 overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : <span className="text-muted-foreground block text-xs">{c.kind}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function NewFromShows({ userId, today }: { userId: string; today: string }) {
  const since = new Date(Date.parse(today) - 14 * 86400000).toISOString().slice(0, 10);
  const fresh = await newEpisodeCards(userId, since, today, { limit: 3 }).catch(() => []);
  if (!fresh.length) return null;
  return (
    <section className="relative">
      <Num n="S1.6" className="absolute -top-2 right-0" />
      <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-semibold">New from your shows</h2><Link href="/schole/podcasts/new" className="text-muted-foreground text-sm hover:underline">All new episodes</Link></div>
      <NewEpisodeCards cards={fresh} row />
    </section>
  );
}

export async function ListenHome({ userId }: { userId: string }) {
  await mergeInputs(userId).catch(() => 0);
  const today = new Date().toISOString().slice(0, 10);
  // A store that cannot answer leaves its part empty rather than taking Home down with it.
  const [view, items, recent, signals] = await Promise.all([
    learnView(userId).catch(() => ({ books: [] as Awaited<ReturnType<typeof learnView>>["books"] })),
    listItems(userId).catch(() => [] as Awaited<ReturnType<typeof listItems>>),
    lastActivity(userId).catch(() => new Map<string, number>()),
    signalsOf(userId).catch(() => null),
  ]);
  const books: Card[] = view.books.filter((b) => b.status === "reading").map((b) => ({
    key: b.id, kind: b.place ? "Audiobook" : "Book", title: b.title, by: b.authors[0] ?? null,
    href: b.catalog?.work ? (b.place ? `/schole/works/${b.catalog.work}/read` : `/schole/works/${b.catalog.work}`) : `/schole/shelves?book=${b.id}`,
    image: b.catalog ? coverUrl(b.catalog, "M") : null, share: b.place ? Math.min(1, (b.place.chapter - 1 + b.place.at) / b.place.chapters) : null,
    where: b.place ? `Chapter ${b.place.chapter} of ${b.place.chapters}` : null,
  }));
  const doing: Card[] = items.filter((i) => i.status === "doing").map((i) => {
    const instrument = i.medium === "course" ? instrumentByUrl(i.url) : undefined;
    return {
      key: i.id, href: instrument ? instrumentHref(instrument) : `/schole/items/${i.id}`, kind: mediumOf(i.medium).label, title: i.title, by: i.by, image: i.image,
      share: i.parts && i.part ? Math.min(1, i.part / i.parts) : null,
      where: i.parts && i.part ? `${instrument ? "Piece" : i.medium === "course" ? "Lecture" : "Part"} ${i.part} of ${i.parts}` : null,
    };
  });
  const now = [...doing, ...books].sort((a, b) => (recent.get(b.key) ?? 0) - (recent.get(a.key) ?? 0));
  const [last, ...rest] = now;
  const aims = signals ? [...signals.aims] : [];
  const ranked = signals ? recommend(signals, COLLECTIONS, 200) : [];
  const reasonOf = new Map<string, string>();
  for (const p of ranked) if (p.collection && !reasonOf.has(p.collection.id)) reasonOf.set(p.collection.id, p.reason);
  const base = suggestCollections(aims);
  const suggested = [
    ...[...reasonOf.keys()].map((id) => base.find((x) => x.collection.id === id)).filter((x): x is (typeof base)[number] => !!x).map((x) => ({ ...x, reason: reasonOf.get(x.collection.id)! })),
    ...base.filter((x) => !reasonOf.has(x.collection.id)).map((x) => ({ ...x, reason: undefined as string | undefined })),
  ];
  return (
    <div className="space-y-10">
      <section className="relative" aria-label="Continue listening">
        <Num n="S1.0" className="absolute -top-2 right-0" />
        <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-semibold">Continue listening</h2><Link href="/schole/shelves" className="text-muted-foreground text-sm hover:underline">Your library</Link></div>
        {last ? (
          <div className="space-y-3"><Hero c={last} />{rest.length ? <UnderWay cards={rest} /> : null}</div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">Nothing playing yet. Start with a podcast, an audiobook, or a playlist people put together.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline"><Link href="/schole/browse?m=podcast">Find a podcast</Link></Button>
              <Button asChild variant="outline"><Link href="/schole/browse?m=audiobooks">Find an audiobook</Link></Button>
            </div>
            <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {suggested.slice(0, 3).map(({ collection, reason }) => <li key={collection.id}><CollectionCard c={collection} reason={reason} /></li>)}
            </ul>
          </div>
        )}
      </section>
      <Suspense fallback={null}><NewFromShows userId={userId} today={today} /></Suspense>
    </div>
  );
}
