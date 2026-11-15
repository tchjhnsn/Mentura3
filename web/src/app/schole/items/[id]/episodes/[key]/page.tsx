import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clock } from "@reflect/core/media";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { getItem, listUnits } from "@/server/ways-store";
import { chaptersOf, showFor, transcriptOf } from "@/server/podcasts";
import { keepTranscript, keptTranscript } from "@/server/transcript-store";
import { latestQuiz } from "@/server/quiz-store";
import { LectureQuiz } from "../../../quiz";
import { Chapters } from "../../../../podcasts/chapters";
import { EpisodeMarks, Notes, People } from "../../../../podcasts/parts";
import { TaskHeader } from "@/components/headers";
import { UnitPlayer } from "../../../unit-player";
import { episodeTrack } from "../../../../podcasts/track";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";

/** One episode of a podcast, heard inside Reflect from the show's own feed, with its transcript when it has one. */
export default async function EpisodePage({ params, searchParams }: { params: Promise<{ id: string; key: string }>; searchParams: Promise<{ at?: string }> }) {
  const user = await requireUser();
  const { id, key } = await params;
  const item = await getItem(user.id, id);
  if (!item) notFound();
  const show = await showFor(item.url);
  const at = show?.episodes.findIndex((e) => e.key === key) ?? -1;
  if (!show || at < 0) notFound();
  const e = show.episodes[at]!;
  const [published, units, chapters, kept, quiz] = await Promise.all([transcriptOf(e), listUnits(user.id, id), chaptersOf(e), keptTranscript(user.id, id, key), latestQuiz(user.id, id, key)]);
  // A published transcript is kept too, so it can be searched with the rest.
  if (published.length && !kept) await keepTranscript(user.id, id, key, "published", published).catch(() => {});
  const transcript = published.length ? published : kept?.passages ?? [];
  const at0 = /^\d{1,6}$/.test((await searchParams).at ?? "") ? Number((await searchParams).at) : null;
  const base = { ...episodeTrack({ episodes: show.episodes, at, show: item.title, image: item.image, item: id, feed: show.feed, units }), chapters };
  // Opened from a search, it plays from the place found.
  const track = at0 !== null ? { ...base, place: at0 } : base;
  const unit = units.find((u) => u.unit === key);
  const older = show.episodes[at + 1];
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: `/schole/items/${id}`, label: "Back to the show" }} title={item.title} position={[e.date, e.seconds ? clock(e.seconds) : ""].filter(Boolean).join(" · ") || undefined} />
      <div className="mt-6 space-y-5">
        <header className="flex gap-4">
          {e.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.image} alt="" className="size-24 shrink-0 rounded-lg border object-cover" />
          ) : null}
          <div className="min-w-0 space-y-1">
            <EpisodeMarks e={e} />
            <h1 className="text-2xl font-semibold tracking-tight">{e.title}</h1>
            {item.by ? <p className="text-muted-foreground">{item.by}</p> : null}
          </div>
        </header>
        <People people={e.people} />
        <UnitPlayer
          item={id} unit={key} title={e.title} by={item.by} cite={[item.by, `${item.title}, “${e.title}”`].filter(Boolean).join(", ")}
          youtube={null} media={{ src: e.audio, kind: e.kind }} place={at0 ?? unit?.place ?? null} done={Boolean(unit?.doneOn)} of={null}
          transcript={transcript} notes={item.notes.filter((x) => x.unit === key)} next={older ? `/schole/items/${id}/episodes/${older.key}` : null}
          track={track}
          noTranscript={<p className="text-muted-foreground text-sm">The show publishes no transcript for this episode.</p>}
        />
        {transcript.length ? <LectureQuiz item={id} unit={key} transcript={transcript} start={quiz} of="The episode" /> : null}
        <Chapters chapters={chapters} track={e.kind === "audio" ? track : null} />
        {e.notes.length ? <section className="space-y-2"><h2 className="text-sm font-medium">Show notes</h2><Notes blocks={e.notes} /></section> : e.about ? <p className="max-w-prose text-sm whitespace-pre-line">{e.about}</p> : null}
        <p className="text-muted-foreground text-xs">Played from the show&apos;s own feed. Reflect keeps no copy.</p>
      </div>
    </main>
  );
}
