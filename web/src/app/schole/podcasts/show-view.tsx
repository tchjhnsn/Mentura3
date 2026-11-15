import { Suspense, type ReactNode } from "react";
import { PlusIcon } from "lucide-react";
import { hoursOf, usualLength } from "@reflect/core/audiobooks";
import { showGuests } from "@reflect/core/guests";
import type { Show } from "@reflect/core/podcasts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { browseAddAction } from "../actions";
import { LocalDay } from "../items/local-day";
import { Clamp } from "../people/clamp";
import { EpisodeList } from "./episode-list";
import { HostsLine, PeopleRow, ShowBooks } from "./mentions";
import { People } from "./parts";
import { FollowButton, ShowActions } from "./show-actions";
import { ShowTabs } from "./show-tabs";
import { episodeRows, episodeTrack } from "./track";

type Unit = { unit: string; place: number | null; doneOn: string | null };

/** Follow a show not yet on the shelves: it is kept as one you follow, and its own page on your shelves opens. */
export function FollowNew({ title, url, by, image }: { title: string; url: string; by: string; image: string }) {
  return (
    <form action={browseAddAction} className="shrink-0">
      <input type="hidden" name="medium" value="podcast" /><input type="hidden" name="title" value={title} /><input type="hidden" name="url" value={url} />
      {by ? <input type="hidden" name="by" value={by} /> : null}{/^https:\/\//.test(image) ? <input type="hidden" name="image" value={image} /> : null}<LocalDay />
      <Button size="sm" variant="outline" name="go" value="start"><PlusIcon />Follow</Button>
    </form>
  );
}

/**
 * A show's page, laid out by the Scholē page priority guides (2026-11-15). Primary: art, title, Play latest (the one
 * filled button), Follow at the top right, and the episodes right under the hero. Secondary, inside the hero: the
 * metadata line, the hosts as one line of faces, and two lines of description. Tertiary: recent guests, books,
 * categories and support links, in an About tab on a phone and a side column on a wide screen. One view for a show
 * explored from browse and a show on the person's shelves.
 */
export function ShowView({ show, title, by, image, url, userId, kept, units = [], favorites = null, episodeHref, footer }: {
  show: Show | null; title: string; by: string; image: string; url: string; userId: string;
  /** The show on the person's shelves, if it is. */ kept: { id: string; following: boolean } | null;
  units?: Unit[]; favorites?: Set<string> | null; episodeHref: (key: string) => string;
  /** What the person keeps about the show on their shelves, at the foot of About. */ footer?: ReactNode;
}) {
  const art = /^https:\/\//.test(image) ? image : show?.image ?? "";
  const usual = show ? usualLength(show.episodes.map((e) => e.seconds)) : null;
  const meta = show ? [`${show.episodes.length} episodes`, usual ? `usually ${hoursOf(usual)}` : null, show.categories[0] ?? null].filter(Boolean).join(" · ") : "The show's feed could not be read just now.";
  const resumeAt = show ? show.episodes.findIndex((e) => { const u = units.find((x) => x.unit === e.key); return Boolean(u?.place && !u.doneOn); }) : -1;
  const track = show?.episodes.length ? episodeTrack({ episodes: show.episodes, at: Math.max(0, resumeAt), show: title, image: art || null, item: kept?.id ?? null, feed: show.feed, units, previewHref: episodeHref }) : null;
  const follow = kept ? <FollowButton item={kept.id} following={kept.following} /> : <FollowNew title={title} url={url} by={by} image={image} />;
  const ref = show ? { feed: show.feed, title } : null;

  const about = show ? (
    <>
      <Suspense fallback={null}><PeopleRow people={showGuests(show, 12)} show={ref} title="Recent guests" small /></Suspense>
      <Suspense fallback={null}><ShowBooks show={show} userId={userId} limit={6} cols="md:grid-cols-3 lg:grid-cols-3" /></Suspense>
      {show.categories.length || show.people.length || show.funding.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Details</h2>
          {show.categories.length ? <p className="flex flex-wrap gap-1.5">{show.categories.map((c) => <Badge key={c} variant="outline" className="text-muted-foreground font-normal">{c}</Badge>)}</p> : null}
          <People people={show.people} />
          {show.funding.length ? <p className="text-sm">{show.funding.map((f, i) => <a key={i} href={f.url} target="_blank" rel="noreferrer nofollow" className="text-muted-foreground hover:text-foreground mr-3 underline underline-offset-2">{f.text}</a>)}</p> : null}
          <p className="text-muted-foreground text-xs">Played from the show&apos;s own feed. Reflect keeps no copy.</p>
        </section>
      ) : null}
      {footer}
    </>
  ) : footer;

  return (
    <div className="mt-6 space-y-8">
      {/* On a phone the art sits on its own row with Follow beside it, so the title gets the full width. */}
      <header className="sm:flex sm:items-start sm:gap-6">
        <div className="flex items-start justify-between gap-4">
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" className="size-24 shrink-0 rounded-xl border object-cover shadow-md sm:size-40" />
          ) : <span />}
          <div className="sm:hidden">{follow}</div>
        </div>
        <div className="mt-4 min-w-0 flex-1 space-y-3 sm:mt-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 id="page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="text-muted-foreground text-[13px]">{by ? <>{by} · </> : null}{meta}</p>
            </div>
            <div className="hidden sm:block">{follow}</div>
          </div>
          {show ? <Suspense fallback={null}><HostsLine show={show} link={url} /></Suspense> : null}
          {show?.about ? <div className="text-muted-foreground"><Clamp text={show.about} /></div> : null}
          <ShowActions resume={resumeAt >= 0} track={track} />
        </div>
      </header>
      <ShowTabs
        episodes={show?.episodes.length ? (
          <EpisodeList rows={episodeRows(show.episodes, episodeHref, units, favorites)} show={title} image={art || null} item={kept?.id ?? null} feed={show.feed} />
        ) : <p className="text-muted-foreground text-sm">{show ? "No episodes in the feed yet." : "The show's feed could not be read just now."}</p>}
        about={about}
      />
    </div>
  );
}
