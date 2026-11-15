import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { clock } from "@reflect/core/media";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { chaptersOf, showFor, transcriptOf } from "@/server/podcasts";
import { Chapters } from "../chapters";
import { EpisodeMarks, Notes, People } from "../parts";
import { TaskHeader } from "@/components/headers";
import { browseAddAction } from "../../actions";
import { LocalDay } from "../../items/local-day";
import { UnitPlayer } from "../../items/unit-player";
import { episodeTrack } from "../track";
import { episodeGuests } from "@reflect/core/guests";
import { commentsOn } from "@/server/comment-store";
import { Comments } from "../comments";
import { EpisodeBooks, PeopleRow } from "../mentions";

export const metadata: Metadata = { title: "Episode" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** An episode of a show not yet on your shelves, heard here; keeping the show keeps your place. */
export default async function PreviewEpisodePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const url = one(sp.u);
  const key = one(sp.k);
  if (!/^https?:\/\/\S+$/.test(url)) notFound();
  const kept = (await listItems(user.id)).find((i) => i.medium === "podcast" && i.url === url);
  if (kept) redirect(`/schole/items/${kept.id}/episodes/${key}`);
  const show = await showFor(url);
  const e = show?.episodes.find((x) => x.key === key);
  if (!show || !e) notFound();
  const title = one(sp.t) || show.title;
  const [transcript, chapters, comments] = await Promise.all([transcriptOf(e), chaptersOf(e), commentsOn(user.id, show.feed, e.key)]);
  const track = { ...episodeTrack({ episodes: show.episodes, at: show.episodes.indexOf(e), show: title, image: /^https:\/\//.test(one(sp.i)) ? one(sp.i) : show.image, item: null, feed: show.feed, previewHref: (k) => `/schole/podcasts/episode?u=${encodeURIComponent(url)}&k=${k}&t=${encodeURIComponent(title)}` }), chapters };
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: `/schole/podcasts?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`, label: "Back to the show" }} title={title} position={[e.date, e.seconds ? clock(e.seconds) : ""].filter(Boolean).join(" · ") || undefined} />
      <div className="mt-6 space-y-5">
        <header className="space-y-1">
          <EpisodeMarks e={e} />
          <h1 className="text-2xl font-semibold tracking-tight">{e.title}</h1>
        </header>
        <People people={e.people.filter((p) => p.role !== "guest")} />
        <Suspense fallback={null}><PeopleRow people={episodeGuests(e, show)} show={{ feed: show.feed, title }} /></Suspense>
        <form action={browseAddAction} className="bg-muted/50 flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
          <span className="min-w-0 flex-1">Keep the show to keep your place in each episode and take notes.</span>
          <input type="hidden" name="medium" value="podcast" /><input type="hidden" name="title" value={title} /><input type="hidden" name="url" value={url} /><LocalDay />
          <Button size="sm" name="go" value="start">Keep the show</Button>
        </form>
        <UnitPlayer item={null} unit={key} title={e.title} by={null} cite={`${title}, “${e.title}”`} youtube={null} media={{ src: e.audio, kind: e.kind }} place={null} done={false} of={null} transcript={transcript} notes={[]} next={null}
          track={track} />
        <Chapters chapters={chapters} track={e.kind === "audio" ? track : null} />
        {e.notes.length ? <section className="space-y-2"><h2 className="text-sm font-medium">Show notes</h2><Notes blocks={e.notes} /></section> : e.about ? <p className="max-w-prose text-sm whitespace-pre-line">{e.about}</p> : null}
        <Suspense fallback={null}><EpisodeBooks notes={e.notes} userId={user.id} /></Suspense>
        <Comments comments={comments} feed={show.feed} episode={e.key} path={`/schole/podcasts/episode?u=${encodeURIComponent(url)}&k=${key}`} track={e.kind === "audio" ? track : null} />
      </div>
    </main>
  );
}
