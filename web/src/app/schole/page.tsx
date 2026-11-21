import type { Metadata } from "next";
import { TileAdventures } from "@/app/adventures/in-tile";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mediumOf } from "@reflect/core/ways";
import { PIANO, instrumentByUrl, instrumentHref } from "@reflect/core/instruments";
import { coverUrl } from "@reflect/core/openlibrary";
import { COLLECTIONS, itemHref, itemKey, nextInCollection, suggestCollections, type Collection, type CollectionItem } from "@reflect/core/collections";
import { addDays, isRecordEvent, occurrences } from "@reflect/core/calendar";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { Suspense } from "react";
import { ChevronRightIcon, PianoIcon, PlusIcon } from "lucide-react";
import { Head, SPACE } from "@/app/life/space";
import { calendar } from "@/server/calendar-store";
import { artOf, haveKeys } from "@/server/collections";
import { recommend } from "@reflect/core/recommend";
import { signalsOf } from "@/server/recommend";
import { Art } from "./art";
import { CollectionCard } from "./playlists/card";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { learnView } from "@/server/learn-store";
import { lastActivity, listItems, mergeInputs } from "@/server/ways-store";
import { LearnHeader } from "./header";
import { newEpisodeCards } from "@/server/new-episodes";
import { NewEpisodeCards } from "./podcasts/new-episodes";
import { Doors } from "./doors";
import { ByWay } from "./by-way";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
// The shelves' own parameters, from links made before Learn opened to the workspace.
const SHELF_KEYS = ["tab", "book", "filled", "show", "sort", "removed"];

type Card = { key: string; href: string; kind: string; title: string; by: string | null; image: string | null; share: number | null; where: string | null };

/** The one thing the person last played: the page's largest card and its one filled button (priority guides, front page P1), outline when Find your crafts holds it. */
function Hero({ c, outline }: { c: Card; outline?: boolean }) {
  return (
    <div className="bg-card flex gap-4 rounded-xl border p-4 shadow-xs">
      <Link href={c.href} className="shrink-0" aria-label={c.title}>
        <Art image={c.image} kind={c.kind} title={c.title} small className="size-24 shadow-sm" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-muted-foreground text-xs">{c.kind}</span>
        <Link href={c.href} className="line-clamp-2 text-lg font-semibold leading-snug hover:underline hover:underline-offset-4">{c.title}</Link>
        <span className="text-muted-foreground truncate text-[13px]">{[c.by, c.where].filter(Boolean).join(" · ")}</span>
        {c.share !== null ? <span className="bg-muted mt-1 block h-1 max-w-xs overflow-hidden rounded-full"><span className="bg-foreground block h-full" style={{ width: `${Math.max(2, c.share * 100)}%` }} /></span> : null}
        <div className="mt-auto pt-2"><Button asChild size="lg" variant={outline ? "outline" : "default"} className="h-10 w-full sm:w-auto sm:px-8"><Link href={c.href}>Continue</Link></Button></div>
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
            <Art image={c.image} kind={c.kind} title={c.title} className="aspect-square w-full transition-opacity group-hover:opacity-90" />
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

const dayParts = (d: string) => {
  const t = new Date(`${d}T12:00:00Z`);
  return { weekday: t.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).toUpperCase(), day: t.getUTCDate() };
};

/** The next week on the Scholē calendar, three at most, each with a date block. Nothing when the week is empty. */
async function UpNext({ userId, today }: { userId: string; today: string }) {
  const to = addDays(today, 6);
  const list = occurrences(await calendar(userId, today, to, "learn").catch(() => []), today, to).slice(0, 3);
  if (!list.length) return null;
  return (
    <section className="grid grid-cols-1 gap-3">
      <Head title="Up next" href="/schole/schedule" note="" />
      <ul className="grid grid-cols-1 gap-1">
        {list.map((o) => {
          const p = dayParts(o.day);
          return (
            <li key={`${o.event.id}-${o.day}`}>
              <Link href={isRecordEvent(o.event) ? `/life/learn/${o.event.recordId}` : `/calendar?tile=learn&day=${o.day}`} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg p-2">
                <span className="bg-muted flex size-11 shrink-0 flex-col items-center justify-center rounded-lg leading-none">
                  <span className="text-muted-foreground text-[9px] font-medium tracking-wide">{o.day === today ? "TODAY" : p.weekday}</span>
                  <span className="text-sm font-semibold">{o.day === today ? "" : p.day}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.event.title}</span>
                  {o.event.starts ? <span className="text-muted-foreground block text-[13px]">{o.event.starts}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The way in (guide "Home, browse and library", point 1): one question, what the person is working toward, answered
 * by what they want in Work; a chip picks which aim the playlists below serve. With nothing in Work, a link there.
 */
function WorkingToward({ aims, aim }: { aims: string[]; aim: string | null }) {
  return (
    <section aria-labelledby="toward" className="border-primary/40 rounded-xl border-2 p-4 sm:p-5">
      <h2 id="toward" className="text-xl font-semibold tracking-tight">What are you working toward?</h2>
      {aims.length ? (
        <>
          <p className="text-muted-foreground mt-1 text-[13px]">From your Work. Pick one and the playlists below follow it.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {aims.slice(0, 6).map((a) => (
              <li key={a}><Link href={a === aim ? "/schole" : `/schole?aim=${encodeURIComponent(a)}`} aria-current={a === aim ? "true" : undefined} className={cn("inline-flex h-8 max-w-[16rem] items-center rounded-full border px-3 text-sm", a === aim ? "bg-foreground text-background border-foreground" : "hover:bg-muted")}><span className="truncate">{a}</span></Link></li>
            ))}
            <li><Link href="/life/work/browse" aria-label="Add work you want" title="Add work you want" className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-full border border-dashed"><PlusIcon className="size-4" /></Link></li>
          </ul>
        </>
      ) : (
        <p className="text-muted-foreground mt-1 text-sm">Scholē suggests what to hear and watch from the work you want. <Link href="/life/work/browse" className="text-foreground font-medium underline underline-offset-4">Tell Reflect what you&apos;re working toward</Link>, or start with a playlist below.</p>
      )}
    </section>
  );
}

/** Learn an instrument: the piano course, where practice lives, in one line with its icon. */
function LearnInstrument() {
  return (
    <Link href={instrumentHref(PIANO)} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg p-2">
      <span className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-lg"><PianoIcon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">Learn the piano</span>
        <span className="text-muted-foreground block truncate text-[13px]">A course · {PIANO.pieces.length} pieces to listen to and practise</span>
      </span>
      <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
    </Link>
  );
}

/** The next thing in a collection the person began, when nothing of it is under way: the one suggestion Home makes once it is in use. */
function NextUp({ picks }: { picks: { c: Collection; next: CollectionItem }[] }) {
  if (!picks.length) return null;
  return (
    <section className="grid grid-cols-1 gap-3">
      <Head title="Next in your playlists" note="" />
      <ul className="grid grid-cols-1 gap-1">
        {picks.map(({ c, next }) => {
          const a = artOf(next);
          return (
            <li key={c.id}>
              <Link href={itemHref(next)} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg p-2">
                <Art image={a.image} kind={a.kind} title={next.title} tiny className="size-12 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{next.title}</span>
                  <span className="text-muted-foreground block truncate text-[13px]">Next in {c.name}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Scholē, Aristotle's leisure (Torian, 2026-11-15 02:17Z), laid out by its priority guide (2026-11-15, "The rest of
 * Scholē"). Primary: search, and the last thing the person played as the page's one large card with its one filled
 * button, Continue; the rest under way in a row of small cards. Secondary: new episodes from their shows, and Discover
 * with only audiobooks, podcasts, films and courses, the other media as chips. Tertiary: events (only when there are
 * some) and one line to the library. Highlights to restate live on Highlights, examinations on their course.
 */
/**
 * Scholē's Home (guide "Home, browse and library", Torian agreed 2026-11-15 23:07Z): what the person does next, never
 * a shelf to browse. In use, it shows Continue as the one large card with the one filled button, the rest under way,
 * the next in a collection they began, the next week on the Scholē calendar and new episodes from their shows, and
 * one line to Browse. New, or with nothing under way, it is the way in: what are you working toward, and
 * collections chosen by people that serve it.
 * Doors (Work and Scholē guide, 2026-11-21): two doors, Knowing and Doing; crafts and Making moved to Work, so
 * Continue always holds the one filled button.
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
  const [view, items, recent, signals] = await Promise.all([learnView(user.id), listItems(user.id), lastActivity(user.id).catch(() => new Map<string, number>()), signalsOf(user.id)]);
  const bookCard = (b: (typeof view.books)[number]): Card => ({
    key: b.id, kind: "Book", title: b.title, by: b.authors[0] ?? null,
    href: b.catalog?.work ? (b.place ? `/schole/works/${b.catalog.work}/read` : `/schole/works/${b.catalog.work}`) : `/schole/shelves?book=${b.id}`,
    image: b.catalog ? coverUrl(b.catalog, "M") : null, share: b.place ? Math.min(1, (b.place.chapter - 1 + b.place.at) / b.place.chapters) : null,
    where: b.place ? `Chapter ${b.place.chapter} of ${b.place.chapters}` : null,
  });
  const itemCard = (i: (typeof items)[number]): Card => {
    const kind = mediumOf(i.medium).label;
    const instrument = i.medium === "course" ? instrumentByUrl(i.url) : undefined;
    return {
      key: i.id, href: instrument ? instrumentHref(instrument) : `/schole/items/${i.id}`, kind, title: i.title, by: i.by, image: i.image,
      share: i.parts && i.part ? Math.min(1, i.part / i.parts) : null,
      where: i.parts && i.part ? `${instrument ? "Piece" : i.medium === "course" ? "Lecture" : "Part"} ${i.part} of ${i.parts}` : null,
    };
  };
  const doing = items.filter((i) => i.status === "doing");
  const now = [...view.books.filter((b) => b.status === "reading").map(bookCard), ...doing.map(itemCard)]
    .sort((a, b) => (recent.get(b.key) ?? 0) - (recent.get(a.key) ?? 0));
  const [last, ...rest] = now;
  const aims = [...signals.aims];
  const aim = aims.includes(one(sp.aim)) ? one(sp.aim) : null;
  // Playlists in the ranker's order (recommend.ts), each with the reason of its best pick; the rest after, as curated.
  const ranked = recommend(aim ? { ...signals, aims: [aim] } : signals, COLLECTIONS, 200);
  const reasonOf = new Map<string, string>();
  for (const p of ranked) if (p.collection && !reasonOf.has(p.collection.id)) reasonOf.set(p.collection.id, p.reason);
  const base = suggestCollections(aim ? [aim] : aims);
  const order = [...reasonOf.keys()];
  const suggested = [
    ...order.map((id) => base.find((x) => x.collection.id === id)!).filter(Boolean).map((x) => ({ ...x, reason: reasonOf.get(x.collection.id)! })),
    ...base.filter((x) => !reasonOf.has(x.collection.id)),
  ];

  if (!last) {
    return (
      <main className={PAGE}>
        <LearnHeader on="space" />
        <div className={`mt-4 ${SPACE}`}>
          <Doors />
          <WorkingToward aims={aims} aim={aim} />
          <section className="grid grid-cols-1 gap-4">
            <Head title="Chosen by people" href="/schole/playlists" note="" />
            <ul className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {suggested.slice(0, 3).map(({ collection, reason }) => <li key={collection.id}><CollectionCard c={collection} reason={reason} /></li>)}
            </ul>
          </section>
          <Suspense fallback={null}><UpNext userId={user.id} today={today} /></Suspense>
          <Suspense fallback={null}><TileAdventures userId={user.id} tiles={["learn"]} /></Suspense>
          <div className="[&_h2]:text-lg"><Suspense fallback={null}><NewFromShows userId={user.id} today={today} /></Suspense></div>
          <p><Link href="/schole/browse" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-sm underline-offset-4 hover:underline">Browse everything<ChevronRightIcon className="size-4" /></Link></p>
          <LearnInstrument />
          <ByWay />
        </div>
      </main>
    );
  }

  // The one suggestion Home makes once in use: the next thing in a collection the person began and has nothing of under way.
  const have = haveKeys(items);
  const doingKeys = haveKeys(doing);
  const picks = COLLECTIONS.flatMap((c) => {
    if (!c.items.some((i) => have.has(itemKey(i))) || c.items.some((i) => doingKeys.has(itemKey(i)))) return [];
    const next = nextInCollection(c, have);
    return next ? [{ c, next }] : [];
  }).slice(0, 2);
  const firstPick = suggested.find((s) => !s.collection.items.some((i) => have.has(itemKey(i))));
  return (
    <main className={PAGE}>
      <LearnHeader on="space" />
      <div className={`mt-4 ${SPACE}`}>
        <section className="grid grid-cols-1 gap-3" aria-label="Continue">
          <h2 className="text-xl font-semibold tracking-tight">Continue</h2>
          <Hero c={last} outline={false} />
        </section>
        <Doors />
        {rest.length ? (
          <section className="grid grid-cols-1 gap-3">
            <Head title="Under way" href="/schole/shelves" note="" />
            <UnderWay cards={rest} />
          </section>
        ) : null}
        <NextUp picks={picks} />
        <Suspense fallback={null}><UpNext userId={user.id} today={today} /></Suspense>
        <Suspense fallback={null}><TileAdventures userId={user.id} tiles={["learn"]} /></Suspense>
        <div className="[&_h2]:text-lg"><Suspense fallback={null}><NewFromShows userId={user.id} today={today} /></Suspense></div>
        {!rest.length && firstPick ? (
          <section className="grid grid-cols-1 gap-3">
            <Head title="Chosen by people" href="/schole/playlists" note="" />
            <CollectionCard c={firstPick.collection} reason={firstPick.reason} className="max-w-sm" />
          </section>
        ) : null}
        {!items.some((i) => i.status === "doing" && instrumentByUrl(i.url)) ? <LearnInstrument /> : null}
        <ByWay />
        <p className="border-t pt-6"><Link href="/schole/browse" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-sm underline-offset-4 hover:underline">Find something new<ChevronRightIcon className="size-4" /></Link></p>
      </div>
    </main>
  );
}
