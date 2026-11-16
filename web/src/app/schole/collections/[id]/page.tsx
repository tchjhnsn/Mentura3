import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { collectionById, itemHref, itemKey, nextInCollection } from "@reflect/core/collections";
import { hoursOf } from "@reflect/core/audiobooks";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { artOf, haveKeys, sizeLine } from "@/server/collections";
import { browseCrumbs } from "../../crumbs";
import { Art } from "../../art";
import { Fan } from "../card";

export const metadata: Metadata = { title: "Collection" };
export const dynamic = "force-dynamic";

/**
 * A collection chosen by a person: who chose it and why, its things in order as rows that open them, and one filled
 * button that starts the first thing the person has not begun (guide "Home, browse and library").
 */
export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const c = collectionById((await params).id);
  if (!c) notFound();
  const have = haveKeys(await listItems(user.id).catch(() => []));
  const next = nextInCollection(c, have) ?? c.items[0]!;
  const begun = c.items.some((i) => have.has(itemKey(i)));
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/collections" crumbs={[...browseCrumbs(), { label: "Collections", href: "/schole/collections" }]} title={c.name} action={<Button asChild size="sm"><Link href={itemHref(next)}>{begun ? "Continue" : "Start"}</Link></Button>} />
      <div className="mt-8 space-y-8">
        <header className="grid gap-6 sm:grid-cols-[16rem_1fr] sm:gap-8">
          <Fan c={c} className="h-40" />
          <div className="min-w-0 space-y-3 sm:pt-2">
            <div className="space-y-1">
              <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{c.name}</h1>
              <p className="text-muted-foreground text-[13px]">Chosen by {c.by} · {sizeLine(c.items)}</p>
            </div>
            <p className="text-muted-foreground max-w-prose">{c.about}</p>
            <Button asChild size="lg" className="h-10 w-full sm:w-auto sm:px-8"><Link href={itemHref(next)} className="min-w-0"><span className="truncate">{begun ? `Continue with ${next.title}` : `Start with ${next.title}`}</span></Link></Button>
          </div>
        </header>
        <ol className="max-w-3xl divide-y">
          {c.items.map((i, n) => {
            const a = artOf(i);
            return (
              <li key={itemKey(i)}>
                <Link href={itemHref(i)} className="hover:bg-muted/60 -mx-2 flex items-start gap-3 rounded-lg px-2 py-3">
                  <span className="text-muted-foreground w-5 shrink-0 pt-3.5 text-right text-sm tabular-nums">{n + 1}</span>
                  <Art image={a.image} kind={a.kind} title={i.title} tiny className="size-14 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{i.title}</span>
                    <span className="text-muted-foreground block truncate text-[13px]">{[a.kind, i.by, a.seconds ? hoursOf(a.seconds) : null].filter(Boolean).join(" · ")}</span>
                    {i.why ? <span className="text-foreground/80 mt-0.5 line-clamp-2 block text-sm">{i.why}</span> : null}
                  </span>
                  {have.has(itemKey(i)) ? <span className="text-muted-foreground shrink-0 text-xs">Kept</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
