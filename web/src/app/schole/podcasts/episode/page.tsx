import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hoursOf } from "@reflect/core/audiobooks";
import { episodeDay } from "@reflect/core/podcasts";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { chaptersOf, showFor, transcriptOf } from "@/server/podcasts";
import { Chapters } from "../chapters";
import { EpisodeMarks, Notes } from "../parts";
import { TaskHeader } from "@/components/headers";
import { FollowNew } from "../show-view";
import { UnitPlayer } from "../../items/unit-player";
import { episodeTrack } from "../track";
import { episodeGuests } from "@reflect/core/guests";
import { commentsOn } from "@/server/comment-store";
import { Comments } from "../comments";
import { EpisodeBooks, PeopleLine } from "../mentions";

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
  const image = /^https:\/\//.test(one(sp.i)) ? one(sp.i) : show.image ?? "";
  const art = e.image ?? image;
  const showHref = `/schole/podcasts?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`;
  const today = new Date().toISOString().slice(0, 10);
  const line = [episodeDay(e.date, today), e.season && e.number ? `S${e.season} E${e.number}` : e.number ? `E${e.number}` : null, e.seconds ? hoursOf(e.seconds) : null].filter(Boolean).join(" · ");
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: showHref, label: "Back to the show" }} title={title} />
      <div className="mt-6 space-y-10">
        <UnitPlayer item={null} unit={key} title={e.title} by={null} cite={`${title}, “${e.title}”`} youtube={null} media={{ src: e.audio, kind: e.kind }} place={null} done={false} of={null} transcript={transcript} notes={[]} next={null}
          track={track}
          between={e.kind === "audio" ? <Chapters chapters={chapters} track={track} /> : null}
          episode={{
            art: art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={art} alt="" className="size-24 shrink-0 rounded-xl border object-cover shadow-md sm:size-32" />
            ) : <span />,
            follow: <FollowNew title={title} url={url} by="" image={image} />,
            heading: <>
              <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tabular-nums">{line ? <span>{line}</span> : null}<EpisodeMarks e={{ ...e, season: null, number: null }} /></p>
              <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-[26px] sm:leading-tight">{e.title}</h1>
              <p className="text-muted-foreground text-sm"><Link href={showHref} className="hover:text-foreground underline-offset-4 hover:underline">{title}</Link></p>
              <Suspense fallback={null}><PeopleLine people={episodeGuests(e, show)} show={{ feed: show.feed, title }} /></Suspense>
            </>,
            showNotes: e.notes.length ? <Notes blocks={e.notes} /> : e.about ? <p className="max-w-prose text-sm whitespace-pre-line">{e.about}</p> : null,
            comments: <Comments comments={comments} feed={show.feed} episode={e.key} path={`/schole/podcasts/episode?u=${encodeURIComponent(url)}&k=${key}`} track={e.kind === "audio" ? track : null} heading={false} />,
            commentCount: comments.filter((c) => !c.removed).length,
          }}
        />
        <Suspense fallback={null}><EpisodeBooks notes={e.notes} userId={user.id} /></Suspense>
        <p className="text-muted-foreground text-xs">Follow the show to keep your place in each episode and take notes. Played from the show&apos;s own feed; Reflect keeps no copy.</p>
      </div>
    </main>
  );
}
