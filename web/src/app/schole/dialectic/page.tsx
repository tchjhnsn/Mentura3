import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlayIcon } from "lucide-react";
import { collectionById, itemHref, itemKey, type CollectionItem } from "@reflect/core/collections";
import { DIALECTIC_SHELVES, OLD_ARGUMENTS, QUESTION_SUBJECTS, SUBJECTS, eraLine, eraOf, isSubject, subjectsOf, type Subject, formatOf, mixOldNew, weekOf } from "@reflect/core/dialectic-media";
import { rankDialectics } from "@reflect/core/dialectics";
import { wayLesson } from "@reflect/core/way-lessons";
import { DIALECTIC_PLAYLISTS } from "@reflect/core/start-dialectic";
import { DEBATE_COURSES } from "@reflect/core/start-debates";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { requireUser } from "@/server/session";
import { artOf } from "@/server/collections";
import { keptWorks } from "@/server/kept-works";
import { listItems } from "@/server/ways-store";
import { dislikedKeys } from "@/server/reaction-store";
import { newDebates } from "@/server/new-debates";
import { Art } from "../art";
import { WayLessonCard } from "../way-lesson";
import { LearnHeader } from "../header";
import { CardRow, FormatChip } from "../media-card";
import { QuestionsGrid } from "./questions-grid";
import { CollectionCard, Fan } from "../playlists/card";

export const metadata: Metadata = { title: "Dialectic" };
export const dynamic = "force-dynamic";

/**
 * Dialectic to watch and listen to, laid out by its design guide (2026-11-16, approved 20:06Z; Torian 19:56Z: the page
 * went stale, all 20th century, too horizontal, no telling a video from a podcast, no telling what a question opens).
 * One old for every new, C.S. Lewis's rule (card, 20:00Z), changing each Monday: one recording first with the page's one
 * filled button, then new debates from the channels' feeds, the questions (each showing what it holds), the debates
 * (new and old arguments in turn) as cards, and the other shelves as rows of cards. What dialectic is folds under the
 * title. Things the person disliked are left out.
 */
export default async function DialecticPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = (await searchParams).s;
  const picked = Array.isArray(sp) ? sp[0] : sp;
  const subject: Subject | null = isSubject(picked) ? picked : null;
  const [items, disliked, fresh] = await Promise.all([listItems(user.id).catch(() => []), dislikedKeys(user.id), newDebates()]);
  const week = weekOf(new Date());
  const liked = (i: CollectionItem) => !(i.kind === "find" && i.url && disliked.has(i.url));
  const ok = (i: CollectionItem) => liked(i) && (!subject || subjectsOf(i).includes(subject));
  // The rail: All, then each subject that has something to watch or hear.
  const everything = [...DIALECTIC_SHELVES.flatMap((x) => x.items), ...OLD_ARGUMENTS, ...fresh].filter(liked);
  const rail = SUBJECTS.filter((x) => everything.some((i) => subjectsOf(i).includes(x.id)));
  const ranked = rankDialectics(keptWorks(items)).filter(({ d }) => !subject || (QUESTION_SUBJECTS[d.id] ?? []).includes(subject));
  const shelf = (id: string) => DIALECTIC_SHELVES.find((s) => s.id === id)!;
  // The debates and the old arguments, in turn; the featured one leads, old one week and new the next.
  const debates = mixOldNew([...shelf("debates").items, ...OLD_ARGUMENTS], week, week % 2 ? "old" : "new").filter(ok);
  // The featured one is a video when the week's side has one, so the page opens on something to watch.
  const side = week % 2 ? "old" : "new";
  if (!debates.length) debates.push(...mixOldNew(everything.filter(ok), week));
  if (!debates.length) redirect("/schole/dialectic");
  const first = debates.find((i) => formatOf(i) === "Video" && (eraOf(i)?.era === "contemporary") === (side === "new")) ?? debates[0]!;
  const others = debates.filter((i) => i !== first);
  const grid = others.slice(0, 9);
  const shown = new Set([first, ...grid].map(itemKey));
  const art = artOf(first);
  const verb = formatOf(first) === "Video" ? "Watch" : "Listen";
  const lesson = wayLesson("dialectic")!;
  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mt-6 space-y-12">
        <header className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Dialectic</h1>
            <a href="#what-dialectic-is" className="text-sm font-medium underline-offset-4 hover:underline">What is dialectic?</a>
          </div>
          <p className="text-muted-foreground">Watch and listen to people argue a question out: one new for every old, changing each Monday.</p>
          {/* Subjects as tabs, one row that swipes on a phone (Torian, 2026-11-16 20:27Z), like Browse's tabs. */}
          <nav aria-label="Subjects" className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <ul className="flex gap-5 border-b">
              {[{ id: null, label: "All" }, ...rail].map((x) => (
                <li key={x.id ?? "all"} className="shrink-0">
                  <Link href={x.id ? `/schole/dialectic?s=${x.id}` : "/schole/dialectic"} scroll={false} aria-current={x.id === subject ? "page" : undefined} className={`-mb-px inline-block border-b-2 py-2 text-sm whitespace-nowrap ${x.id === subject ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent"}`}>{x.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <section className="grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center" aria-label="Featured">
          <Link href={itemHref(first)} className="group relative block overflow-hidden rounded-xl" aria-label={`${verb} ${first.title}`}>
            <span className="bg-muted relative block aspect-video">
              {formatOf(first) === "Video"
                ? <Art image={art.image} kind={art.kind} title={first.title} className="size-full rounded-none border-0" />
                : <Art image={art.image} kind={art.kind} title={first.title} className="absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2 rounded-none border-0" />}
            </span>
            <span className="absolute inset-0 flex items-center justify-center"><span className="flex size-16 items-center justify-center rounded-full bg-black/70 text-white transition group-hover:bg-black/85"><PlayIcon className="ml-1 size-7 fill-current" /></span></span>
            <FormatChip i={first} className="bottom-3 left-3 text-xs" />
          </Link>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{[formatOf(first), eraLine(first)].filter(Boolean).join(" · ")}</p>
            <h2 className="text-2xl leading-tight font-semibold tracking-tight">{first.title}</h2>
            <p className="text-[15px]">{first.by}</p>
            {first.why ? <p className="text-muted-foreground text-[15px]">{first.why}</p> : null}
            <Button asChild className="mt-2 rounded-full px-6"><Link href={itemHref(first)}><PlayIcon className="fill-current" />{verb}</Link></Button>
          </div>
        </section>

        {fresh.filter(ok).length ? (
          <section className="space-y-3" aria-labelledby="new-debates">
            <SectionHead title={<span id="new-debates">New debates</span>} note="The latest whole debates from Jubilee, Open to Debate and the Oxford and Cambridge Unions." />
            <CardRow items={fresh.filter(ok)} />
          </section>
        ) : null}

        {ranked.length ? <section className="space-y-3" aria-labelledby="questions">
          <SectionHead title={<span id="questions">Questions</span>} href="/schole/dialectic/questions" note="Each opens a playlist of the recordings that argue it, both sides." />
          <QuestionsGrid ranked={ranked.slice(0, 6)} row week={week} />
        </section> : null}

        <section className="space-y-3" aria-labelledby="debates">
          <SectionHead title={<span id="debates">Debates</span>} note="A new debate, then an older argument, in turn." />
          <CardRow items={others} wide limit={9} />
        </section>

        {DIALECTIC_SHELVES.filter((s) => s.id !== "debates").map((s) => {
          const rest = mixOldNew(s.items, week).filter((i) => ok(i) && !shown.has(itemKey(i)));
          return rest.length ? (
            <section key={s.id} className="space-y-3" aria-labelledby={`shelf-${s.id}`}>
              <SectionHead title={<span id={`shelf-${s.id}`}>{s.title}</span>} note={s.note} />
              <CardRow items={rest} />
            </section>
          ) : null;
        })}

        {/* The ways of questioning the page borrows from, each a playlist (Torian, 2026-11-16 20:33Z). */}
        {subject ? null : (
          <section className="space-y-3" aria-labelledby="methods">
            <SectionHead title={<span id="methods">Methods of dialectic</span>} href="/schole/courses/dialectic" note="A course: each method as a playlist, with practice on one of Plato's dialogues after it." />
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
              {DIALECTIC_PLAYLISTS.map((c) => <CollectionCard key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {/* Courses on the quarrels new art and new inventions start (Torian, 2026-11-16 22:33Z). */}
        {subject ? null : (
          <section className="space-y-3" aria-labelledby="quarrels">
            <SectionHead title={<span id="quarrels">Quarrels over art and machines</span>} note="Two courses: each new art and each new invention starts a quarrel that echoes an older one." />
            <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
              {DEBATE_COURSES.map((c) => (
                <Link key={c.id} href={`/schole/courses/debates/${c.id}`} className="group block space-y-2">
                  <Fan items={c.units.flatMap((u) => collectionById(u.playlist)?.items.slice(0, 1) ?? [])} className="h-32" />
                  <p className="leading-snug font-medium group-hover:underline group-hover:underline-offset-4">{c.name}</p>
                  <p className="text-muted-foreground text-sm">Course · {c.units.length} units</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div id="what-dialectic-is" className="scroll-mt-20"><WayLessonCard l={lesson} /></div>
      </div>
    </main>
  );
}
