import { ForYouRows } from "./for-you";
import Link from "next/link";
import { wayLesson } from "@reflect/core/way-lessons";
import { WayLessonCard } from "../way-lesson";
import { SectionHead } from "@/components/section-head";
import type { ReactNode } from "react";
import { BROWSE_MEDIA, browseWay, type BrowseMedium } from "@reflect/core/browse-media";
import { trendingBooks } from "@reflect/core/openlibrary";
import { WAYS, type Medium, type Way } from "@reflect/core/ways";
import { PAGE } from "@/components/page-header";
import { learnView } from "@/server/learn-store";
import { listItems } from "@/server/ways-store";
import { filmsToWatch, finds, listFinds } from "@/server/browse-media";
import { openLibrary } from "@/server/browse";
import { LearnHeader } from "../header";
import { BookGrid } from "../book-card";
import { MediaGrid, MediaRow, keyOf, type Find } from "./media";
import { AudiobookRow } from "../audiobooks/cards";
import { listAudiobooks } from "@/server/audiobooks";
import { TOPICS, searchScore } from "@reflect/core/audiobooks";
import { WORKS } from "@reflect/core/topic-pages";
import { PEOPLE, personHref } from "@reflect/core/historical-people";
import { IDEAS, TERMS } from "@reflect/core/great-ideas";
import { SUBJECTS, subjectRow } from "@reflect/core/subjects";
import { redirect } from "next/navigation";

export type WayPick = Way | "leisure";
export const WAY_PICKS: readonly { id: WayPick; label: string }[] = [...WAYS.map((w) => ({ id: w.id, label: w.label })), { id: "leisure", label: "Play" }];
export const isWayPick = (v: string): v is WayPick => WAY_PICKS.some((w) => w.id === v);

/** Books belong to teaching, imitation (stories) and dialectic (dialogues); every other medium to its own way. */
const inWay = (m: BrowseMedium, way: WayPick | null) => !way || (m === "books" || m === "audiobooks" ? way === "teaching" || way === "imitation" || way === "dialectic" : browseWay(m) === way);
const href = (m: BrowseMedium | "all", way: WayPick | null, q?: string) => {
  const p = new URLSearchParams();
  if (m !== "all") p.set("m", m);
  if (way) p.set("way", way);
  if (q) p.set("q", q);
  const s = p.toString();
  return `/schole/browse${s ? `?${s}` : ""}`;
};

/**
 * Browse's top: every medium as a tab (books, courses, lectures, debates, podcasts, plays, films, series, music, art,
 * games, or all of them). The way-of-learning menu is gone: the media tabs cover it (Torian, 2026-11-16 08:53Z).
 */
export function BrowseNav({ m, way, children }: { m: BrowseMedium | "all"; way: WayPick | null; children?: ReactNode }) {
  const media = BROWSE_MEDIA.filter((x) => inWay(x.id, way));
  return (
    <div className="space-y-3">
      {/* Tabs, not pills (Torian, 2026-11-16 08:37Z): one row that swipes on a phone. */}
      <nav aria-label="What to browse" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-5 border-b">
          {[{ id: "all" as const, label: "All" }, ...media].map((x) => (
            <li key={x.id} className="shrink-0">
              <Link href={href(x.id, way)} aria-current={x.id === m ? "page" : undefined} className={`-mb-px inline-block border-b-2 py-2 text-sm whitespace-nowrap ${x.id === m ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent"}`}>{x.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}


/** Discover's rows across every medium: courses, books read this week, podcasts on the person's subjects, lectures, debates, plays, films and art to take in here. Shared by Browse and Scholē's front page. */
export async function DiscoverRows({ userId, way = null, n = 12, focus = false }: { userId: string; way?: WayPick | null; n?: number;
  /** Only what plays best here, audiobooks, podcasts, films and courses (Scholē's front page, priority guides 2026-11-15). */ focus?: boolean }) {
  const [view, items] = await Promise.all([learnView(userId), listItems(userId)]);
  const mine = new Map(items.map((i) => [keyOf(i), i.id]));
  const subjects = [...new Set([...view.books.flatMap((b) => b.subjects), ...view.known, ...view.shown].map((s) => s.name))].slice(0, 2);
  const show = (x: Medium) => inWay(x, way);
  const here = (fs: Find[]) => fs.map((f) => ({ ...f, here: true }));
  const [courses, books, podcasts, films, art] = await Promise.all([
    show("course") ? finds("course").then((r) => r.found.slice(0, n)) : null,
    inWay("books", way) && !focus ? trendingBooks(openLibrary, n).catch(() => null) : null,
    show("podcast") ? finds("podcast", subjects[0] ?? "philosophy").then((r) => r.found.slice(0, n)) : null,
    show("film") ? filmsToWatch().then((f) => f.slice(0, n)) : null,
    show("art") && !focus ? finds("art").then((r) => r.found.slice(0, n)) : null,
  ]);
  return (
    <div className="space-y-8">
      {inWay("audiobooks", way) ? <AudiobookRow title="Audiobooks to hear here" books={listAudiobooks({}, n)} href={href("audiobooks", way)} /> : null}
      <MediaRow title={subjects[0] ? <>Podcasts on {subjects[0]}</> : "Podcasts on philosophy"} finds={podcasts} mine={mine} href={href("podcast", way)} />
      <MediaRow title="Films to watch here" finds={films} mine={mine} href={href("film", way)} note="Feature films in the public domain, from the Internet Archive." />
      <MediaRow title="Courses to take here" finds={courses} mine={mine} href={href("course", way)} />
      {focus ? null : <>
      {show("lecture") ? <MediaRow title="Lectures" finds={listFinds("lecture").slice(0, n)} mine={mine} href={href("lecture", way)} /> : null}
      {show("debate") ? <MediaRow title="Debates" finds={listFinds("debate").slice(0, n)} mine={mine} href={href("debate", way)} /> : null}
      {show("theatre") ? <MediaRow title="Plays to read here" finds={here(listFinds("theatre").slice(0, n))} mine={mine} href={href("theatre", way)} /> : null}
      <MediaRow title="Art to look at here" finds={art} mine={mine} href={href("art", way)} note="Public-domain works at the Art Institute of Chicago." />
      {books?.length ? (
        <section className="space-y-4">
          <SectionHead title="Books read this week" href={href("books", way)} className="pt-2" />
          <BookGrid books={books} mine={new Map(view.books.filter((b) => b.catalog?.work).map((b) => [b.catalog!.work, b.status]))} row />
        </section>
      ) : null}
      </>}
    </div>
  );
}

const NOT_HERE: Partial<Record<Medium, string>> = {
  series: "Series cannot be watched in Reflect yet; save them here for later.",
  music: "Music cannot be heard in Reflect yet, apart from recordings in the public domain.",
  game: "Games cannot be played in Reflect yet.",
  film: "Films marked Here play in Reflect from the Internet Archive's public domain; other films cannot be watched here yet.",
};

/** Browse for every medium but books: all of them together, or one medium, searched or from its catalogs and lists. */
/** One line on each way, under its heading in Browse. */
const WAY_LINE: Record<WayPick, string> = {
  teaching: "Someone who knows shows you the causes.",
  dialectic: "People arguing a question out, to watch and hear.",
  imitation: "Learn from a model: plays, films, lives.",
  practice: "Do it yourself: essays, exercises, examinations.",
  leisure: "Games, music and art for their own sake.",
};

/**
 * Browse's All tab as the guide drew it (tab "Ways and dialectic"): a section for each way, in Aristotle's order, its
 * heading the way to all of it, with a row of things to take in. Dialectic opens its own page of debates and discussions.
 */
async function WayRows({ userId }: { userId: string }) {
  const [items, courses, films, art] = await Promise.all([
    listItems(userId), finds("course").then((r) => r.found).catch(() => []), filmsToWatch(), finds("art").then((r) => r.found).catch(() => []),
  ]);
  const mine = new Map(items.map((i) => [keyOf(i), i.id]));
  const here = (fs: Find[]) => fs.map((f) => ({ ...f, here: true }));
  const head = (id: WayPick) => <SectionHead title={WAY_PICKS.find((w) => w.id === id)!.label} href={id === "dialectic" ? "/schole/dialectic" : href("all", id)} note={WAY_LINE[id]} />;
  return (
    <div className="space-y-10">
      <section className="space-y-4">{head("teaching")}<MediaGrid row finds={[...courses.slice(0, 8), ...listFinds("lecture").slice(0, 6)]} mine={mine} showMedium /></section>
      <section className="space-y-4">
        {head("dialectic")}
        <MediaGrid row finds={[...listFinds("debate").slice(0, 8), ...listFinds("discussion").slice(0, 4)]} mine={mine} showMedium />
      </section>
      <section className="space-y-4">{head("imitation")}<MediaGrid row finds={[...films.slice(0, 8), ...here(listFinds("theatre").slice(0, 6))]} mine={mine} showMedium /></section>
      <section className="space-y-3">
        {head("practice")}
        <ul className="divide-y text-sm">
          <li><Link href="/journal" className="block py-2 hover:underline hover:underline-offset-4">Write an essay in your journal, from a prompt</Link></li>
          <li><Link href={href("course", null)} className="block py-2 hover:underline hover:underline-offset-4">Put yourself under examination on a course you took</Link></li>
        </ul>
        <MediaGrid row finds={listFinds("game").slice(0, 8)} mine={mine} showMedium />
      </section>
      <section className="space-y-4">{head("leisure")}<MediaGrid row finds={[...art.slice(0, 8), ...listFinds("music").slice(0, 6)]} mine={mine} showMedium /></section>
    </div>
  );
}

export async function MediaBrowse({ userId, m, way, q }: { userId: string; m: Medium | "all"; way: WayPick | null; q: string }) {
  const [view, items] = await Promise.all([learnView(userId), listItems(userId)]);
  const mine = new Map(items.map((i) => [keyOf(i), i.id]));
  const subjects = [...new Set([...view.books.flatMap((b) => b.subjects), ...view.known, ...view.shown].map((s) => s.name))].slice(0, 2);
  const show = (x: Medium) => inWay(x, way);
  const here = (fs: Find[]) => fs.map((f) => ({ ...f, here: true }));

  if (way === "dialectic" && m === "all" && !q) redirect("/schole/dialectic");
  let body: ReactNode;
  if (m === "all") {
    if (q) {
      const media: Medium[] = (["course", "podcast", "film", "theatre", "art", "music", "series", "game"] as const).filter(show);
      const results = await Promise.all(media.map((x) => finds(x, q).then((r) => r.found.slice(0, 6)).catch(() => [])));
      body = (
        <div className="space-y-8">
          <InScholeRow q={q} />
          {inWay("audiobooks", way) ? <AudiobookRow title="Audiobooks" books={listAudiobooks({ q }, 6)} href={href("audiobooks", way, q)} /> : null}
          {inWay("books", way) ? <p className="text-sm"><Link href={`/schole/browse?q=${encodeURIComponent(q)}`} className="underline underline-offset-4">Books matching “{q}”</Link></p> : null}
          {media.map((x, i) => <MediaRow key={x} title={BROWSE_MEDIA.find((b) => b.id === x)!.label} finds={results[i]!} mine={mine} href={href(x, way, q)} />)}
          {results.every((r) => !r.length) ? <p className="text-muted-foreground text-sm">Nothing found beyond books.</p> : null}
        </div>
      );
    } else {
      // Arranged by way of learning (Torian, 2026-11-16 09:09Z: "I actually like this approach of arranging browse by
      // way"); one way's own page when a way is chosen.
      body = way ? (
        <div className="space-y-8">
          <header className="space-y-1"><h2 className="text-2xl font-semibold tracking-tight">{WAY_PICKS.find((w) => w.id === way)!.label}</h2><p className="text-muted-foreground">{WAY_LINE[way]}</p></header>
          {wayLesson(way) ? <WayLessonCard l={wayLesson(way)!} /> : null}
          <DiscoverRows userId={userId} way={way} />
        </div>
      ) : <div className="space-y-10"><WayRows userId={userId} /><ForYouRows userId={userId} /></div>;
    }
  } else {
    const lists = listFinds(m);
    const r = q || m === "course" || m === "art" ? await finds(m, q) : { found: [] as Find[] };
    const extra: ReactNode[] = [];
    if (!q && m === "film") extra.push(<MediaRow key="free" title="Free to watch here" finds={await filmsToWatch()} mine={mine} note="Feature films in the public domain, from the Internet Archive." />);
    if (!q && m === "podcast") {
      // Subjects with Reflect's editors' picks first, then what a search finds (Torian, 2026-11-16 08:24Z: "Editors'
      // canon, then listens"); then a row for each subject on the person's own shelves.
      const rows = await Promise.all(SUBJECTS.map((x) => finds("podcast", x.search).then((r) => subjectRow(x, r.found)).catch(() => subjectRow(x, []))));
      SUBJECTS.forEach((x, i) => extra.push(<MediaRow key={x.id} title={x.label} finds={rows[i]!} mine={mine} href={href("podcast", way, x.search)} note={x.picks.length ? "Reflect's editors' picks first, then the shows a search finds." : "The shows a search finds; editors' picks to come."} />));
      const own = subjects.filter((t) => !SUBJECTS.some((x) => x.search === t.toLowerCase())).slice(0, 2);
      const mineRows = await Promise.all(own.map((t) => finds("podcast", t).then((x) => x.found.slice(0, 12)).catch(() => [])));
      own.forEach((t, i) => extra.push(<MediaRow key={t} title={<>On {t}</>} finds={mineRows[i]!} mine={mine} href={href("podcast", way, t)} note="From the subjects on your shelves." />));
    }
    body = (
      <div className="space-y-8">
        {NOT_HERE[m] ? <p className="text-muted-foreground text-sm">{NOT_HERE[m]}</p> : null}
        {r.error ? <p className="text-muted-foreground text-sm">{r.error}</p> : null}
        {r.found.length ? (
          <section className="space-y-4">
            {q ? <h2 className="pt-2 text-lg font-semibold">Results for “{q}”</h2> : <h2 className="pt-2 text-lg font-semibold">{m === "course" ? "Courses to take here, from Open Yale and MIT" : "The Art Institute of Chicago's best-known works"}</h2>}
            <MediaGrid finds={r.found} mine={mine} />
          </section>
        ) : q && !r.error ? <p className="text-muted-foreground text-sm">Nothing found.</p> : null}
        {extra}
        {lists.length && !q ? <MediaRow title="From the lists" finds={m === "theatre" ? here(lists) : lists} mine={mine} note={<Link href="/schole/lists" className="underline underline-offset-4">Lists beyond books</Link>} /> : null}
        {!q && (m === "lecture" || m === "debate") ? <p className="text-muted-foreground text-sm">Any recorded {m} on YouTube, Vimeo or the Internet Archive plays here: paste its link under your library.</p> : null}
      </div>
    );
  }

  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mt-6 space-y-5">
        <BrowseNav m={m} way={way} />
        {q && m === "all" ? <h2 className="text-lg font-semibold">Results for “{q}”</h2> : null}
        {m === "podcast" ? (
          <p className="flex flex-wrap gap-x-4 text-sm"><Link href="/schole/podcasts/search" className="underline underline-offset-4">Search inside your episodes</Link><Link href="/schole/people" className="underline underline-offset-4">People you follow</Link></p>
        ) : null}
        {body}
        <p className="text-muted-foreground pt-6 text-center text-xs">Courses from Open Yale Courses and MIT OpenCourseWare (through MIT Learn), podcasts from Apple&apos;s podcast search, films from Wikidata and the Internet Archive, art from the Art Institute of Chicago, music from MusicBrainz, series from TVmaze, games from Steam.</p>
      </div>
    </main>
  );
}

/**
 * Scholē's own pages that answer a search, before anything from outside (Torian, 2026-11-16 07:33Z: The Prince should
 * not be hard to find): work pages, people and Great Ideas, the best match first.
 */
function InScholeRow({ q }: { q: string }) {
  const hits = [
    ...WORKS.map((w) => ({ s: searchScore({ title: w.title, by: w.by }, q), title: w.title, note: `Work · ${w.by}`, href: `/schole/works/${w.id}` })),
    ...PEOPLE.map((x) => ({ s: searchScore({ title: x.name, by: "" }, q), title: x.name, note: "Person", href: personHref(x) })),
    ...IDEAS.map((i) => ({ s: searchScore({ title: i.name, by: "" }, q), title: i.name, note: "Great Idea", href: `/schole/ideas/${i.id}` })),
    ...TERMS.map((t) => ({ s: searchScore({ title: t.name, by: "" }, q), title: t.name, note: "Term", href: `/schole/terms/${t.id}` })),
  ].filter((h) => h.s > 0).sort((a, b) => b.s - a.s).slice(0, 6);
  if (!hits.length) return null;
  return (
    <section className="space-y-2">
      <SectionHead title="In Scholē" note="Pages here, with every version of a work in one place." />
      <ul className="divide-y sm:max-w-xl">
        {hits.map((h) => (
          <li key={h.href} className="py-2.5">
            <Link href={h.href} className="group block">
              <span className="font-semibold group-hover:underline group-hover:underline-offset-2">{h.title}</span>
              <span className="text-muted-foreground block text-[13px]">{h.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
