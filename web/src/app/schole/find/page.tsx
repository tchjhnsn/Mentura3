import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { playsHere } from "@reflect/core/browse-media";
import { embedOf } from "@reflect/core/media";
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

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const https = (v: string) => (/^https:\/\//.test(v) ? v : "");

/**
 * A find from Browse that has no page of its own yet (a film, an album, a work of art): what it is, and the page's
 * acts, Start here when it can be done in Reflect and Keep for later. Tapping a card opens this (Torian, 2026-11-15:
 * tapping a thing opens it); once kept, the person's own item page is its page.
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
  const here = one(sp.h) === "1" || playsHere({ medium: medium as Medium, url, image });
  const m = mediumOf(medium as Medium);
  const square = medium === "music" || medium === "podcast" || medium === "art";
  // An album plays right here, before it is kept: Apple Music's player gives previews, and whole tracks to its subscribers.
  const album = embedOf(url);
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
            <input type="hidden" name="medium" value={medium} /><input type="hidden" name="title" value={title} />
            {by ? <input type="hidden" name="by" value={by} /> : null}{url ? <input type="hidden" name="url" value={url} /> : null}{image ? <input type="hidden" name="image" value={image} /> : null}
            <LocalDay />
            {here ? <Button name="go" value="start">Start here</Button> : null}
            <Button variant={here ? "outline" : "default"}>Keep for later</Button>
          </form>
        </div>
      </div>
      {album?.kind === "frame" && album.list ? (
        <iframe src={album.src} title={`${title} on ${album.site}`} className="mt-8 h-[450px] w-full max-w-3xl rounded-lg border" allow="autoplay; encrypted-media; fullscreen" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" loading="lazy" />
      ) : null}
    </main>
  );
}
