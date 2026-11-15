import { Suspense } from "react";
import { showGuests } from "@reflect/core/guests";
import { GuestChips, ShowBooks, ShowHosts } from "./mentions";
import { hoursOf, usualLength } from "@reflect/core/audiobooks";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listItems, listUnits } from "@/server/ways-store";
import { showFor } from "@/server/podcasts";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs } from "../crumbs";
import { browseAddAction } from "../actions";
import { LocalDay } from "../items/local-day";
import { EpisodeList } from "./episode-list";
import { ShowFacts } from "./parts";
import { episodeRows } from "./track";

export const metadata: Metadata = { title: "Podcast" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** A podcast's own page in Reflect, to explore before keeping it: its episodes, each heard here straight away. */
export default async function ShowPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const url = one(sp.u);
  if (!/^https?:\/\/\S+$/.test(url)) notFound();
  const [show, items] = await Promise.all([showFor(url), listItems(user.id)]);
  const kept = items.find((i) => i.medium === "podcast" && i.url === url);
  const units = kept ? await listUnits(user.id, kept.id) : [];
  const title = one(sp.t) || show?.title || "Podcast";
  const by = one(sp.by);
  const image = one(sp.i) || show?.image || "";
  const episodeHref = (key: string) => (kept ? `/schole/items/${kept.id}/episodes/${key}` : `/schole/podcasts/episode?u=${encodeURIComponent(url)}&k=${key}&t=${encodeURIComponent(title)}`);
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse?m=podcast" crumbs={browseCrumbs("podcast")} title={title} />
      <div className="mt-6 space-y-6">
        <header className="flex gap-4">
          {/^https:\/\//.test(image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-28 shrink-0 rounded-lg border object-cover" />
          ) : null}
          <div className="min-w-0 space-y-2">
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{title}</h1>
            {by ? <p className="text-muted-foreground">{by}</p> : null}
            <p className="text-muted-foreground text-sm">{show ? `${show.episodes.length} episodes, each heard here${usualLength(show.episodes.map((e) => e.seconds)) ? `, usually about ${hoursOf(usualLength(show.episodes.map((e) => e.seconds))!)} long` : ""}` : "The show's feed could not be read just now."}</p>
            {kept ? <Button asChild size="sm" variant="outline"><Link href={`/schole/items/${kept.id}`}>On your shelves</Link></Button> : (
              <form action={browseAddAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="medium" value="podcast" /><input type="hidden" name="title" value={title} /><input type="hidden" name="url" value={url} />
                {by ? <input type="hidden" name="by" value={by} /> : null}{/^https:\/\//.test(image) ? <input type="hidden" name="image" value={image} /> : null}<LocalDay />
                <Button size="sm" name="go" value="start">Keep and listen</Button>
                <Button size="sm" variant="outline">Want to</Button>
              </form>
            )}
          </div>
        </header>
        {show ? <ShowFacts show={show} /> : null}
        {show ? <Suspense fallback={null}><ShowHosts show={show} link={url} /></Suspense> : null}
        {show ? <GuestChips guests={showGuests(show, 16)} show={{ feed: show.feed, title }} title="Recent guests" /> : null}
        {show ? <Suspense fallback={null}><ShowBooks show={show} userId={user.id} /></Suspense> : null}
        {show?.episodes.length ? <EpisodeList rows={episodeRows(show.episodes, episodeHref, units)} show={title} image={/^https:\/\//.test(image) ? image : show.image} item={kept?.id ?? null} feed={show.feed} /> : null}
        <p className="text-muted-foreground text-xs">Played from the show&apos;s own feed. Reflect keeps no copy.</p>
      </div>
    </main>
  );
}
