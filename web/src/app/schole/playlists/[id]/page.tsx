import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { collectionById, itemHref, itemKey, nextInCollection } from "@reflect/core/collections";
import { topicPageById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { haveKeys, sizeLine } from "@/server/collections";
import { browseCrumbs } from "../../crumbs";
import { Fan, PlaylistRows } from "../card";

export const metadata: Metadata = { title: "Playlist" };
export const dynamic = "force-dynamic";

/**
 * A playlist chosen by a person: who chose it and why, its things in order as rows that open them, and one filled
 * button that starts the first thing the person has not begun (guide "Home, browse and library").
 */
export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const c = collectionById((await params).id);
  if (!c) notFound();
  const have = haveKeys(await listItems(user.id).catch(() => []));
  const next = nextInCollection(c, have) ?? c.items[0]!;
  const begun = c.items.some((i) => have.has(itemKey(i)));
  const topic = c.topics?.[0] ? topicPageById(c.topics[0]) : undefined;
  return (
    <main className={PAGE}>
      <ThingHeader back={topic ? `/schole/topics/${topic.id}` : "/schole/playlists"} crumbs={[...browseCrumbs(), topic ? { label: topic.name, href: `/schole/topics/${topic.id}` } : { label: "Playlists", href: "/schole/playlists" }]} title={c.name} action={<Button asChild size="sm"><Link href={itemHref(next)}>{begun ? "Continue" : "Start"}</Link></Button>} />
      <div className="mt-8 space-y-8">
        <header className="grid gap-6 sm:grid-cols-[16rem_1fr] sm:gap-8">
          <Fan items={c.items} className="h-40" />
          <div className="min-w-0 space-y-3 sm:pt-2">
            <div className="space-y-1">
              <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{c.name}</h1>
              <p className="text-muted-foreground text-[13px]">Chosen by {c.by} · {sizeLine(c.items)}{topic ? <> · in <Link href={`/schole/topics/${topic.id}`} className="text-foreground underline-offset-4 hover:underline">{topic.name}</Link></> : null}</p>
            </div>
            <p className="text-muted-foreground max-w-prose">{c.about}</p>
            <Button asChild size="lg" className="h-10 w-full sm:w-auto sm:px-8"><Link href={itemHref(next)} className="min-w-0"><span className="truncate">{begun ? `Continue with ${next.title}` : `Start with ${next.title}`}</span></Link></Button>
          </div>
        </header>
        <PlaylistRows items={c.items} have={have} />
      </div>
    </main>
  );
}
