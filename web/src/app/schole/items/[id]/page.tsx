import { debateRecord } from "@reflect/core/dialectic-media";
import { curated, upNext } from "@reflect/core/up-next";
import { rerank } from "@reflect/core/recommend";
import { signalsOf } from "@/server/recommend";
import { clock } from "@reflect/core/media";
import { cn } from "@/lib/utils";
import { DebateFacts, whenWhere } from "../../dialectic/debate-record";
import { ROUND_ACTION, WatchDetails, WatchView } from "../../watch";
import { Reactions } from "../../reactions";
import { ShareButton } from "../../share-button";
import { Suspense } from "react";
import { AiDescription, debateArticle } from "../../ai-description";
import { reactionKey, reactionOf } from "@/server/reaction-store";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShowView } from "../../podcasts/show-view";
import { CourseView } from "../../courses/course-view";
import Link from "next/link";
import { BookmarkIcon, CheckIcon, ChevronRightIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { embedOf } from "@reflect/core/media";
import { WAYS, mediumOf, placeOf } from "@reflect/core/ways";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { getItem, listUnits } from "@/server/ways-store";
import { lecturesOf } from "@/server/courses";
import { reasonFor } from "@/server/learn-reason-store";
import { showFor } from "@/server/podcasts";
import { openLibrary } from "@/server/browse";
import "@/server/free";
import { searchBooks, type CatalogEntry } from "@reflect/core/openlibrary";
import { COURSE_SITES, courseSite } from "@reflect/core/courses";
import { listIdeas, type IdeaOut } from "@/server/ideas-store";
import { ideasNaming } from "@reflect/core/ideas";
import { learnView } from "@/server/learn-store";
import { ThingHeader } from "@/components/headers";
import { favoritesOf } from "@/server/favorite-store";
import { shelfCrumbs } from "../../crumbs";
import {
  addItemSubjectsAction, addSessionAction, changeItemAction, editItemAction, removeItemAction, removeItemSubjectAction, removeSessionAction,
  setItemDatesAction, setItemFactsAction, setTranscriptAction,
} from "../../actions";
import { LocalDay } from "../local-day";
import { ItemMedia } from "./media";
import { Artwork } from "./artwork";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";

const SELECT = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";
const Note = ({ children }: { children: ReactNode }) => <p className="text-muted-foreground text-sm">{children}</p>;
// Plain sections, not cards (priority guides, 2026-11-15).
const plainSection = (title: string, body: ReactNode, id?: string) => (
  <section className="space-y-3" id={id}><h2 className="text-base font-semibold">{title}</h2><div className="space-y-3">{body}</div></section>
);
const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

/**
 * One learn item: its status and dates, its way, what it taught you (dated lessons, the latest publishable), and
 * what its way asks for: the claims argued in a debate and whether you took part, the parts of a course, the
 * sessions of a practice. A video or recording plays here with your place kept and notes at a moment; a pasted
 * transcript is searched and quoted. Subjects, the book it adapts, editing and removing are here too.
 */
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const item = await getItem(user.id, (await params).id);
  if (!item) notFound();
  const [view, ideas] = await Promise.all([learnView(user.id), listIdeas(user.id).catch((): IdeaOut[] => [])]);
  // An item merged from an older input keeps its id, so an idea may name it either way.
  const bearing = [...new Map([...ideasNaming(ideas, `item:${item.id}`, item.title), ...ideasNaming(ideas, `input:${item.id}`, item.title)].map((b) => [b.idea.id, b])).values()];
  const [course, show, units, reason] = await Promise.all([
    item.medium === "course" ? lecturesOf(item.url) : null,
    item.medium === "podcast" ? showFor(item.url) : null,
    item.medium === "course" || item.medium === "podcast" ? listUnits(user.id, item.id) : [],
    item.medium === "course" && item.url ? reasonFor(user.id, item.url) : null,
  ]);
  const favorites = item.medium === "podcast" ? await favoritesOf(user.id, item.id) : null;
  // A play or a debate kept in writing is read (and often heard) in Reflect, as a book.
  const text = (item.medium === "theatre" || (item.medium === "debate" && !embedOf(item.url)))
    ? (await searchBooks([item.title.replace(/\s*\(.*\)\s*$/, ""), item.by].filter(Boolean).join(" "), openLibrary, 5).catch((): CatalogEntry[] => [])).find((b) => b.free)
    : undefined;
  const lectures = course?.lectures ?? [];
  const finished = new Set(units.filter((u) => u.doneOn).map((u) => u.unit));
  const begun = new Map(units.map((u) => [u.unit, u]));
  const nextLecture = lectures.find((l) => !finished.has(String(l.n)));
  const m = mediumOf(item.medium);
  const place = placeOf(item);
  const way = item.way ?? m.way;
  const embed = embedOf(item.url);
  const books = view.books.filter((b) => b.catalog?.work);
  const adapts = item.work ? books.find((b) => b.catalog!.work === item.work) : undefined;
  const subjectIds = new Set(item.subjects.map((s) => s.id));
  const related = view.books.filter((b) => b.subjects.some((s) => subjectIds.has(s.id)));
  const practice = way === "practice" || item.medium === "game";
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);
  const recent = item.sessions.filter((s) => s.day >= since);
  const minutes = item.sessions.reduce((n, s) => n + (s.minutes ?? 0), 0);
  const hidden = <input type="hidden" name="item" value={item.id} />;
  // Every kept item's own sections are plain sections in one "Yours" block at the foot (priority guides, kept items).
  const section = plainSection;
  const taught = <>
        {bearing.length ? section("Your ideas", (
          <div className="space-y-3">
            {bearing.map(({ idea, how }) => (
              <div key={idea.id} className="text-sm">
                <p className="font-medium">{idea.title}</p>
                {idea.statement ? <p className="text-muted-foreground line-clamp-3">{idea.statement}</p> : null}
                <p className="text-muted-foreground text-xs">{how === "from" ? `Came from this ${m.label.toLowerCase()}` : how === "maybe" ? `May have come from this ${m.label.toLowerCase()}` : `This ${m.label.toLowerCase()} ${how} it`}</p>
              </div>
            ))}
          </div>
        )) : null}
  </>;
  const shelfFacts = <>
        {section("Way of learning", (
          <form action={changeItemAction} className="space-y-2">
            {hidden}
            <div className="flex flex-wrap gap-2">{WAYS.map((w) => <Button key={w.id} size="sm" name="way" value={w.id} variant={way === w.id ? "secondary" : "ghost"} aria-pressed={way === w.id}>{w.label}</Button>)}</div>
            {item.way ? <Button size="sm" variant="ghost" name="way" value="">Back to {WAYS.find((w) => w.id === m.way)!.label.toLowerCase()}, from its medium</Button> : null}
          </form>
        ))}

        {section("Subjects", (
          <>
            {item.subjects.length ? (
              <div className="flex flex-wrap gap-1.5">
                {item.subjects.map((s) => (
                  <form key={s.id} action={removeItemSubjectAction}>{hidden}<input type="hidden" name="subject" value={s.id} /><Badge variant="secondary" className="gap-1">{s.name}<button aria-label={`Remove ${s.name}`} className="ml-1">×</button></Badge></form>
                ))}
              </div>
            ) : <Note>Subjects it is about, like a book&apos;s, count toward what you are learning.</Note>}
            <form action={addItemSubjectsAction} className="flex gap-2">{hidden}<Input name="subjects" placeholder="Justice, Utilitarianism" className="h-9" required /><Button size="sm" variant="outline">Add</Button></form>
            {related.length ? <p className="text-sm">Books on your shelves on the same subjects: {related.slice(0, 6).map((b, i) => <span key={b.id}>{i ? ", " : ""}{b.catalog?.work ? <Link href={`/schole/works/${b.catalog.work}`} className="underline underline-offset-4">{b.title}</Link> : b.title}</span>)}</p> : null}
          </>
        ))}
  </>;
  const editing = <>
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">Edit</summary>
          <form action={editItemAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            {hidden}
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Title<Input name="title" defaultValue={item.title} required maxLength={300} /></label>
            <label className="block space-y-1.5 text-sm font-medium">By<Input name="by" defaultValue={item.by ?? ""} maxLength={200} /></label>
            <label className="block space-y-1.5 text-sm font-medium">Link<Input name="url" type="url" defaultValue={item.url ?? ""} maxLength={1000} /></label>
            <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Picture (https link)<Input name="image" type="url" defaultValue={item.image ?? ""} maxLength={1000} /></label>
            {books.length ? (
              <label className="block space-y-1.5 text-sm font-medium sm:col-span-2">Adapts or stages a book on your shelves
                <select name="work" className={SELECT} defaultValue={item.work ?? ""}>
                  <option value="">None</option>
                  {books.map((b) => <option key={b.id} value={b.catalog!.work}>{b.title}</option>)}
                </select>
              </label>
            ) : null}
            <div className="sm:col-span-2"><Button size="sm">Save</Button></div>
          </form>
        </details>

        <form action={removeItemAction}>{hidden}<Button size="sm" variant="ghost">Remove from your shelves</Button></form>
  </>;
  const statusLabel = (st: "want" | "doing" | "done") => (st === "want" ? "Want to" : st === "doing" ? m.doing : m.done);
  const status = section("Status", (
    <>
      <form action={changeItemAction} className="bg-muted/60 inline-flex rounded-lg p-0.5 text-sm" role="group" aria-label="Status">
        {hidden}<LocalDay />
        {(["want", "doing", "done"] as const).map((st) => (
          <button key={st} name="status" value={st} aria-pressed={item.status === st} className={item.status === st ? "bg-background rounded-md px-3 py-1 font-medium shadow-xs" : "text-muted-foreground hover:text-foreground rounded-md px-3 py-1"}>{statusLabel(st)}</button>
        ))}
      </form>
      <form action={setItemDatesAction} className="flex flex-wrap items-end gap-3 text-sm">
        {hidden}
        <label className="space-y-1">Started<Input type="date" name="started" defaultValue={item.startedOn ?? ""} className="h-9 w-40" /></label>
        <label className="space-y-1">Finished<Input type="date" name="finished" defaultValue={item.finishedOn ?? ""} className="h-9 w-40" /></label>
        <Button size="sm" variant="outline">Save dates</Button>
      </form>
    </>
  ));
  const yoursHead = <h2 className="text-lg font-semibold tracking-tight">Yours</h2>;
  if (item.medium === "course" && courseSite(item.url)) {
    return <CourseView userId={user.id} u={item.url!} t={item.title} by={item.by ?? ""} footer={<div className="space-y-8">{yoursHead}{taught}{status}{shelfFacts}{editing}</div>} />;
  }
  if (item.medium === "podcast") {
    return (
      <main className={PAGE}>
        <ThingHeader back="/schole" crumbs={shelfCrumbs(place)} title={item.title} />
        <ShowView show={show} title={item.title} by={item.by ?? ""} image={item.image ?? ""} url={item.url ?? ""} userId={user.id} kept={{ id: item.id, following: item.status === "doing" }} units={units} favorites={favorites} episodeHref={(k) => `/schole/items/${item.id}/episodes/${k}`} footer={<div className="space-y-8">{taught}{shelfFacts}{editing}</div>} />
      </main>
    );
  }
  const metaLine = [m.label, item.by, statusLabel(item.status as "want" | "doing" | "done"), item.tookPart ? "took part" : null, item.parts ? `${item.part ?? 0} of ${item.parts}` : null].filter(Boolean).join(" · ");
  // A video or recording that plays here is a watch page (Torian, 2026-11-16 18:45Z): the player first, the title,
  // the channel line with Watched and Saved, the description, Up next, and the rest folded under Details.
  if (embed && (embed.kind === "youtube" || embed.tall) && !lectures.length) {
    const record = item.medium === "debate" ? debateRecord(item.url) : null;
    const why = curated(item.url)?.why;
    const done = item.status === "done";
    const key = reactionKey({ url: item.url, medium: item.medium, title: item.title });
    const [reaction, signals] = await Promise.all([reactionOf(user.id, key), signalsOf(user.id)]);
    const next = rerank(upNext({ url: item.url, title: item.title }, 20), signals).slice(0, 10);
    const shareHref = item.url && embed.kind === "youtube" ? `/schole/find?m=${item.medium}&t=${encodeURIComponent(item.title)}${item.by ? `&by=${encodeURIComponent(item.by)}` : ""}&u=${encodeURIComponent(item.url)}${item.image ? `&i=${encodeURIComponent(item.image)}` : ""}&h=1` : undefined;
    const transcriptForm = section("Transcript", (
      <form action={setTranscriptAction} className="space-y-2">
        {hidden}
        <Note>Paste the transcript (on YouTube: More, then Show transcript, then copy it) to search it and quote it with its moment. YouTube does not let other sites fetch it.</Note>
        <Textarea name="transcript" rows={4} defaultValue={item.transcriptText ?? ""} />
        <Button size="sm" variant="outline">Save transcript</Button>
      </form>
    ));
    return (
      <main className={PAGE}>
        <ThingHeader back="/schole" crumbs={shelfCrumbs(place)} title={item.title} />
        <WatchView
          upNext={next}
          main={
            <ItemMedia id={item.id} title={item.title} by={item.by} embed={embed} place={item.place} transcript={item.transcriptText}>
              <WatchDetails
                title={item.title} channel={item.by}
                detail={[m.label, WAYS.find((w) => w.id === way)?.label].filter(Boolean).join(" · ")}
                actions={<>
                  <Reactions reactionKey={key} current={reaction} back={`/schole/items/${item.id}`} />
                  <ShareButton title={item.title} path={shareHref} />
                  <form action={changeItemAction}>
                    {hidden}<LocalDay />
                    <button name="status" value={done ? "doing" : "done"} aria-pressed={done} className={cn(ROUND_ACTION, done && "bg-foreground text-background hover:bg-foreground/90")}><CheckIcon />{m.done}</button>
                  </form>
                  <span className={ROUND_ACTION} title="Saved to your library"><BookmarkIcon className="fill-current" />Saved</span>
                </>}
                meta={[record ? whenWhere(record) : null, item.place && embed.kind === "youtube" ? `picks up at ${clock(item.place)}` : null, item.finishedOn ? `finished ${fmt(item.finishedOn)}` : null].filter(Boolean).join(" · ") || null}
                description={<>
                  <Suspense fallback={why ? <p>{why}</p> : <p className="text-muted-foreground">Writing a description…</p>}>
                    <AiDescription thing={{ key, title: item.title, by: item.by, kind: m.label.toLowerCase(), article: debateArticle(record?.source.url) }} fallback={why ? <p>{why}</p> : null} />
                  </Suspense>
                  {record ? <DebateFacts r={record} /> : null}
                  {adapts ? <p>Adapts <Link href={`/schole/works/${item.work}`} className="underline underline-offset-4">{adapts.title}</Link></p> : null}
                </>}
                after={
                  <details className="group border-t pt-4">
                    <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden"><ChevronRightIcon className="size-4 transition group-open:rotate-90" />Details</summary>
                    <div className="mt-6 space-y-8">{status}{taught}{shelfFacts}{transcriptForm}{editing}</div>
                  </details>
                }
              />
            </ItemMedia>
          }
        />
      </main>
    );
  }
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole" crumbs={shelfCrumbs(place)} title={item.title} action={nextLecture ? <Button size="sm" asChild><Link href={`/schole/items/${item.id}/lectures/${nextLecture.n}`}>{finished.size || begun.size ? "Continue" : "Start"}: Lecture {nextLecture.n}</Link></Button> : undefined} />
      <div className="mt-6 space-y-8">
        {/* The hero (priority guides, kept items): picture, title and one metadata line; the page's own act follows it. */}
        <header className="flex items-start gap-4 sm:gap-6">
          {item.image && item.medium !== "art" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="size-24 shrink-0 rounded-xl border object-cover shadow-md sm:size-40" />
          ) : null}
          <div className="min-w-0 flex-1 space-y-1">
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h1>
            <p className="text-muted-foreground text-[13px]">{metaLine}</p>
            {adapts ? <p className="text-sm">Adapts <Link href={`/schole/works/${item.work}`} className="underline underline-offset-4">{adapts.title}</Link></p> : null}
          </div>
        </header>

        {item.medium === "art" && item.image ? section("Look at it here", <Artwork src={item.image} title={item.title} />, "artwork") : null}

        {text ? section(text.free?.read ? "Read it here" : "Listen here", (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {text.free?.read ? <Button size="sm" asChild><Link href={`/schole/works/${text.work}/read`}>Read {text.title}</Link></Button> : null}
            {text.free?.listen ? <Button size="sm" variant="outline" asChild><Link href={`/schole/works/${text.work}#listen`}>Listen to it</Link></Button> : null}
            <span className="text-muted-foreground">{text.authors.join(", ")}{text.year ? `, ${text.year}` : ""}, in Reflect&apos;s reader with highlights and excerpts.</span>
          </div>
        ), "text") : null}

        {lectures.length ? section("Lectures", (
          <>
            {nextLecture ? <Button size="sm" asChild><Link href={`/schole/items/${item.id}/lectures/${nextLecture.n}`}>{finished.size || begun.size ? "Continue" : "Start"}: {nextLecture.title}</Link></Button> : <Note>You have finished every lecture.</Note>}
            <ol className="divide-y text-sm">
              {lectures.map((l) => {
                const u = begun.get(String(l.n));
                return (
                  <li key={l.n} className="flex items-center gap-3 py-2">
                    <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">{l.n}</span>
                    <Link href={`/schole/items/${item.id}/lectures/${l.n}`} className="min-w-0 flex-1 underline-offset-4 hover:underline">{l.title}</Link>
                    <span className="text-muted-foreground shrink-0 text-xs">{u?.doneOn ? "Finished" : u?.place ? "Under way" : ""}</span>
                  </li>
                );
              })}
            </ol>
            <p className="text-muted-foreground text-xs">Each lecture plays here from {COURSE_SITES[course!.site].name}, under the {COURSE_SITES[course!.site].license} license, with its transcript beside it.</p>
          </>
        ), "lectures") : null}


        {embed || item.transcript ? section(embed ? `${m.done === "Heard" ? "Listen" : "Watch"} here` : "Transcript", <ItemMedia id={item.id} title={item.title} by={item.by} embed={embed} place={item.place} transcript={item.transcriptText} />) : null}

        {item.medium === "debate" && debateRecord(item.url) ? section("The debate", <div className="space-y-1.5 text-sm"><p className="font-semibold">{whenWhere(debateRecord(item.url)!)}</p><DebateFacts r={debateRecord(item.url)!} /></div>, "debate") : null}

        {!lectures.length && (item.medium === "course" || item.parts) ? section("Parts", (
          <form action={setItemFactsAction} className="flex flex-wrap items-center gap-2 text-sm">
            {hidden}
            <Button size="sm" variant="outline" name="step" value="-1" aria-label="One part back">−</Button>
            <span className="tabular-nums">{item.part ?? 0} of {item.parts ?? "?"}</span>
            <Button size="sm" variant="outline" name="step" value="1" aria-label="One more part">+</Button>
            <label className="ml-4 flex items-center gap-2">Parts in all<Input type="number" name="parts" min={1} max={10000} defaultValue={item.parts ?? ""} className="h-8 w-24" /></label>
            <Button size="sm" variant="ghost">Save</Button>
          </form>
        )) : null}

        {practice ? section("Practice", (
          <>
            <Note>{item.sessions.length ? `${recent.length} ${recent.length === 1 ? "session" : "sessions"} in the last 30 days · ${item.sessions.length} in all${minutes ? ` · ${Math.round(minutes / 6) / 10} hours` : ""}` : "We become what we repeatedly do. Keep each time you practise."}</Note>
            <form action={addSessionAction} className="flex flex-wrap items-end gap-2 text-sm">
              {hidden}<LocalDay />
              <label className="space-y-1">Day (today if blank)<Input type="date" name="on" className="h-9 w-40" /></label>
              <label className="space-y-1">Minutes<Input type="number" name="minutes" min={1} max={1440} className="h-9 w-24" /></label>
              <label className="min-w-40 flex-1 space-y-1">Note<Input name="note" maxLength={2000} className="h-9" /></label>
              <Button size="sm">Keep session</Button>
            </form>
            {item.sessions.length ? (
              <ul className="divide-y text-sm">
                {item.sessions.slice(0, 30).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                    <span>{fmt(s.day)}{s.minutes ? ` · ${s.minutes} min` : ""}{s.note ? <span className="text-muted-foreground"> · {s.note}</span> : null}</span>
                    <form action={removeSessionAction}>{hidden}<input type="hidden" name="session" value={s.id} /><Button size="sm" variant="ghost">Remove</Button></form>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )) : null}

        <div className="space-y-8 border-t pt-8">
        {yoursHead}
        {status}
        {taught}
        <details className="group space-y-8">
          <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden"><ChevronRightIcon className="size-4 transition group-open:rotate-90" />Way of learning, subjects{embed || item.transcript ? ", transcript" : ""} and editing</summary>
          <div className="mt-6 space-y-8">
        {shelfFacts}

        {embed || item.transcript ? section("Transcript", (
          <form action={setTranscriptAction} className="space-y-2">
            {hidden}
            <Note>Paste the transcript (on YouTube: More, then Show transcript, then copy it) to search it and quote it with its moment. YouTube does not let other sites fetch it.</Note>
            <Textarea name="transcript" rows={4} defaultValue={item.transcriptText ?? ""} />
            <Button size="sm" variant="outline">{item.transcript ? "Save transcript" : "Keep transcript"}</Button>
          </form>
        )) : null}

        {editing}
          </div>
        </details>
        </div>
      </div>
    </main>
  );
}
