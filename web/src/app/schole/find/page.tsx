import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { playsHere } from "@reflect/core/browse-media";
import { audioOf, embedOf } from "@reflect/core/media";
import { mediumOf, type Medium } from "@reflect/core/ways";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { browseCrumbs } from "../crumbs";
import { browseAddAction } from "../actions";
import { LocalDay } from "../items/local-day";
import { wayLabel } from "../browse/media";
import { PlayButton } from "../play-button";
import { debateRecord } from "@reflect/core/dialectic-media";
import { curated, upNext } from "@reflect/core/up-next";
import { BookmarkIcon } from "lucide-react";
import { DebateFacts, whenWhere } from "../dialectic/debate-record";
import { ROUND_ACTION, VideoFrame, WatchDetails, WatchView } from "../watch";
import { Reactions } from "../reactions";
import { ShareButton } from "../share-button";
import { Suspense } from "react";
import { AiDescription, debateArticle } from "../ai-description";
import { dislikedKeys, reactionKey, reactionOf } from "@/server/reaction-store";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const https = (v: string) => (/^https:\/\//.test(v) ? v : "");

/** The verb for doing a thing in Reflect, by its medium: Watch, Listen, Play, View, Read or Start. */
export const verbOf = (medium: string): string =>
  ({ Watched: "Watch", Heard: "Listen", Played: "Play", Read: "Read", Finished: "Start" } as Record<string, string>)[mediumOf(medium as Medium).done] ?? (medium === "art" ? "View" : "Watch");

/**
 * A find from Browse that has no page of its own yet (a film, an album, a work of art). A video plays at the top of a
 * watch page (Torian, 2026-11-16 18:45Z: "It should look like you're on YouTube preparing to watch a video"), with Save
 * beside the channel and Up next beside or below it. Anything else shows what it is, with the medium's verb (Watch,
 * Listen, Play, View) as the one filled button when it can be done in Reflect, and Save. Once saved, the person's own
 * item page is its page.
 */
export default async function FindPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const medium = one(sp.m);
  const title = one(sp.t).trim();
  if (!medium || !title) redirect("/schole/browse");
  const kept = (await listItems(user.id)).find((i) => i.medium === medium && i.title.toLowerCase() === title.toLowerCase());
  if (kept) redirect(`/schole/items/${kept.id}`);
  const by = one(sp.by);
  const url = https(one(sp.u));
  const image = https(one(sp.i));
  const year = one(sp.y);
  const credit = one(sp.c);
  // A free recording (Wikimedia Commons) plays in Scholē's own player, with who recorded it and its licence.
  const free = medium === "music" ? audioOf(url) : null;
  const here = one(sp.h) === "1" || playsHere({ medium: medium as Medium, url, image });
  const m = mediumOf(medium as Medium);
  const square = medium === "music" || medium === "podcast" || medium === "art";
  // An album plays right here, before it is kept: Apple Music's player gives previews, and whole tracks to its subscribers.
  const album = embedOf(url);
  const record = medium === "debate" ? debateRecord(url) : null;
  const hidden = (
    <>
      <input type="hidden" name="medium" value={medium} /><input type="hidden" name="title" value={title} />
      {by ? <input type="hidden" name="by" value={by} /> : null}{url ? <input type="hidden" name="url" value={url} /> : null}{image ? <input type="hidden" name="image" value={image} /> : null}
      <LocalDay />
    </>
  );
  // A video plays right here, at the top, the way a video site opens one.
  const video = album?.kind === "youtube"
    ? <VideoFrame src={`https://www.youtube-nocookie.com/embed/${album.id}?rel=0${album.start ? `&start=${album.start}` : ""}`} title={title} />
    : album?.kind === "frame" && album.tall ? <VideoFrame src={album.src} title={`${title} on ${album.site}`} /> : null;
  if (video) {
    const key = reactionKey({ url, medium, title });
    const [reaction, disliked] = await Promise.all([reactionOf(user.id, key), dislikedKeys(user.id)]);
    const next = upNext({ url, title }, 20).filter((i) => !disliked.has(i.kind === "find" && i.url ? i.url : `${i.kind === "find" ? i.medium : i.kind}|${i.title.toLowerCase()}`)).slice(0, 10);
    return (
      <main className={PAGE}>
        <ThingHeader back={`/schole/browse?m=${medium}`} crumbs={browseCrumbs(medium)} title={title} />
        <WatchView
          main={<>
            {video}
            <WatchDetails
              title={title} channel={by} detail={[m.label, wayLabel(medium as Medium)].join(" · ")}
              actions={<>
                <Reactions reactionKey={key} current={reaction} back="/schole/find" />
                <ShareButton title={title} />
                <form action={browseAddAction}>{hidden}<button type="submit" className={ROUND_ACTION} aria-label={`Save ${title}`}><BookmarkIcon />Save</button></form>
              </>}
              meta={record ? whenWhere(record) : year || null}
              description={<>
                <Suspense fallback={curated(url)?.why ? <p>{curated(url)!.why}</p> : <p className="text-muted-foreground">Writing a description…</p>}>
                  <AiDescription thing={{ key, title, by, kind: m.label.toLowerCase(), article: debateArticle(record?.source.url) }} fallback={curated(url)?.why ? <p>{curated(url)!.why}</p> : null} />
                </Suspense>
                {record ? <DebateFacts r={record} /> : null}
              </>}
            />
          </>}
          upNext={next}
        />
      </main>
    );
  }
  return (
    <main className={PAGE}>
      <ThingHeader back={`/schole/browse?m=${medium}`} crumbs={browseCrumbs(medium)} title={title} />
      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className={`w-48 shrink-0 rounded-lg border object-cover ${square ? "aspect-square" : "aspect-[2/3]"}`} />
        ) : null}
        <div className="min-w-0 space-y-3">
          <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{title}</h1>
          {by ? <p className="text-muted-foreground">{by}</p> : null}
          <p className="text-muted-foreground text-sm">{[m.label, wayLabel(medium as Medium), year].filter(Boolean).join(" · ")}</p>
          <form action={browseAddAction} className="flex flex-wrap gap-2">
            {hidden}
            {free ? <PlayButton src={free.src} title={title} by={by} href={`/schole/find?m=music&t=${encodeURIComponent(title)}&u=${encodeURIComponent(url)}`} label="Play" /> : here ? <Button name="go" value="start">{verbOf(medium)}</Button> : null}
            <Button variant={here || free ? "outline" : "default"}><BookmarkIcon />Save</Button>
          </form>
          {free ? (
            <p className="text-muted-foreground text-xs">
              {credit ? `${credit}. ` : ""}Free to play from <a href={free.page} target="_blank" rel="noreferrer" className="underline underline-offset-2">Wikimedia Commons</a>, where its licence is.
            </p>
          ) : null}
        </div>
      </div>
      {album?.kind === "frame" && album.site === "Apple Music" ? (
        <iframe src={album.src} title={`${title} on ${album.site}`} className={`mt-8 ${album.list ? "h-[450px]" : "h-[175px]"} w-full max-w-3xl rounded-lg border`} allow="autoplay; encrypted-media; fullscreen" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" loading="lazy" />
      ) : null}
    </main>
  );
}
