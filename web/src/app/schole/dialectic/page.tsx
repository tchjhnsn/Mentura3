import type { Metadata } from "next";
import Link from "next/link";
import { itemHref } from "@reflect/core/collections";
import { DIALECTIC_SHELVES } from "@reflect/core/dialectic-media";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { requireUser } from "@/server/session";
import { artOf, haveKeys } from "@/server/collections";
import { listItems } from "@/server/ways-store";
import { Art } from "../art";
import { LearnHeader } from "../header";
import { PlaylistRows } from "../playlists/card";

export const metadata: Metadata = { title: "Dialectic" };
export const dynamic = "force-dynamic";

/**
 * Dialectic to watch and listen to (Torian, 2026-11-16 18:18Z: "We can not do interactive dialectics. Instead, we can
 * allow you to watch dialectics... videos and audios of dialectic conversations"). One debate first, with the page's
 * one filled button; then shelves: famous debates, conversations with philosophers, discussions, and Plato's dialogues
 * read aloud. The feed, rooms and threads built earlier stay in the code, off the page, to come back to later.
 */
export default async function DialecticPage() {
  const user = await requireUser();
  const have = haveKeys(await listItems(user.id).catch(() => []));
  const first = DIALECTIC_SHELVES[0]!.items[0]!;
  const art = artOf(first);
  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mt-6 space-y-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Dialectic</h1>
          <p className="text-muted-foreground">Watch and listen to people argue a question out.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-center" aria-label="Start here">
          <Link href={itemHref(first)} className="block overflow-hidden rounded-xl border">
            <Art image={art.image} kind={art.kind} title={first.title} className="aspect-video w-full" />
          </Link>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Start here · debate</p>
            <h2 className="text-2xl leading-tight font-semibold tracking-tight">{first.title}</h2>
            <p className="text-sm">{first.by}</p>
            {first.why ? <p className="text-muted-foreground">{first.why}</p> : null}
            <Button asChild className="mt-1 rounded-full"><Link href={itemHref(first)}>Listen</Link></Button>
          </div>
        </section>

        {DIALECTIC_SHELVES.map((s) => (
          <section key={s.id} className="space-y-2" aria-labelledby={`shelf-${s.id}`}>
            <SectionHead title={<span id={`shelf-${s.id}`}>{s.title}</span>} note={s.note} />
            <PlaylistRows items={s.id === "debates" ? s.items.slice(1) : s.items} have={have} numbered={false} />
          </section>
        ))}
      </div>
    </main>
  );
}
