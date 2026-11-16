import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { itemHref, itemKey } from "@reflect/core/collections";
import { topicPageById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { haveKeys, sizeLine } from "@/server/collections";
import { madeById } from "@/server/topics";
import { browseCrumbs } from "../../../crumbs";
import { Fan, PlaylistRows } from "../../card";
import { ChangeIt, MakeButton, SaveMade } from "../../../topics/make";

export const metadata: Metadata = { title: "Made for you" };
export const dynamic = "force-dynamic";

/**
 * A playlist Reflect made for the person (guide "Topics and playlists", points 9 to 11): marked as Reflect's in small
 * type with what it was made from, never as a person's choice; Play is the one filled button; Save, Another, and
 * Change it in plain words.
 */
export default async function MadePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const m = await madeById(user.id, (await params).id);
  if (!m || !m.items.length) notFound();
  const t = topicPageById(m.topic);
  const have = haveKeys(await listItems(user.id).catch(() => []));
  const next = m.items.find((i) => !have.has(itemKey(i))) ?? m.items[0]!;
  const from = m.ask ? `You asked: “${m.ask}”` : m.aim ? `For “${m.aim}”, from your Work` : t ? `From what Scholē holds in ${t.name}` : null;
  return (
    <main className={PAGE}>
      <ThingHeader back={t ? `/schole/topics/${t.id}` : "/schole/lists"} crumbs={[...browseCrumbs(), ...(t ? [{ label: t.name, href: `/schole/topics/${t.id}` }] : [])]} title={m.name} />
      <div className="mt-8 space-y-8">
        <header className="grid gap-6 sm:grid-cols-[16rem_1fr] sm:gap-8">
          <Fan items={m.items} className="h-40" />
          <div className="min-w-0 space-y-3 sm:pt-1">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Made for you by Reflect</p>
              <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{m.name}</h1>
              {from ? <p className="text-muted-foreground text-[13px]">{from}</p> : null}
              <p className="text-muted-foreground text-[13px]">{sizeLine(m.items)} · no person chose this</p>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <Button asChild size="lg" className="h-10 px-8"><Link href={itemHref(next)}>Play</Link></Button>
              <div className="flex items-center gap-2 pt-1"><SaveMade id={m.id} saved={m.saved} /><MakeButton topic={m.topic} label="Another" instead={m.id} /></div>
            </div>
          </div>
        </header>
        <PlaylistRows items={m.items} have={have} />
        <ChangeIt topic={m.topic} instead={m.id} />
        <p className="text-muted-foreground max-w-prose text-xs">Every item is already in Scholē; Reflect picks from what is here and never invents one.</p>
      </div>
    </main>
  );
}
