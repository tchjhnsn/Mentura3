import type { Metadata } from "next";
import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { itemHref, itemKey, type CollectionItem } from "@reflect/core/collections";
import { DIALECTIC_SHELVES, OLD_ARGUMENTS, eraLine, eraOf, formatOf, mixOldNew, weekOf } from "@reflect/core/dialectic-media";
import { rankDialectics } from "@reflect/core/dialectics";
import { wayLesson } from "@reflect/core/way-lessons";
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
export default async function DialecticPage() {
  const user = await requireUser();
  const [items, disliked, fresh] = await Promise.all([listItems(user.id).catch(() => []), dislikedKeys(user.id), newDebates()]);
  const week = weekOf(new Date());
  const ok = (i: CollectionItem) => !(i.kind === "find" && i.url && disliked.has(i.url));
  const ranked = rankDialectics(keptWorks(items));
  const shelf = (id: string) => DIALECTIC_SHELVES.find((s) => s.id === id)!;
  // The debates and the old arguments, in turn; the featured one leads, old one week and new the next.
  const debates = mixOldNew([...shelf("debates").items, ...OLD_ARGUMENTS], week, week % 2 ? "old" : "new").filter(ok);
  // The featured one is a video when the week's side has one, so the page opens on something to watch.
  const side = week % 2 ? "old" : "new";
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

        <section className="space-y-3" aria-labelledby="questions">
          <SectionHead title={<span id="questions">Questions</span>} href="/schole/dialectic/questions" note="Each opens a playlist of the recordings that argue it, both sides." />
          <QuestionsGrid ranked={ranked.slice(0, 6)} row week={week} />
        </section>

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

        <div id="what-dialectic-is" className="scroll-mt-20"><WayLessonCard l={lesson} /></div>
      </div>
    </main>
  );
}
