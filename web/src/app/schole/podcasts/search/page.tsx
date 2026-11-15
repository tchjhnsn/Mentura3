import type { Metadata } from "next";
import Link from "next/link";
import { findInTranscripts } from "@reflect/core/transcripts";
import { clock } from "@reflect/core/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { showFor } from "@/server/podcasts";
import { allTranscripts } from "@/server/transcript-store";
import { LEARN } from "../../crumbs";

export const metadata: Metadata = { title: "Search your episodes" };
export const dynamic = "force-dynamic";

/**
 * A word or phrase looked for in every episode transcript the person keeps (published ones and ones made for them),
 * each place opening the episode at that moment (Torian, 2026-11-15 "Build all").
 */
export default async function SearchEpisodesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const q = ((await searchParams).q ?? "").trim().slice(0, 200);
  const sets = await allTranscripts(user.id);
  const hits = q ? findInTranscripts(sets.map((s) => ({ of: s, passages: s.passages })), q, 150) : [];
  const items = new Map((await listItems(user.id)).filter((i) => i.medium === "podcast").map((i) => [i.id, i]));
  const shows = new Map(await Promise.all([...new Set(hits.map((h) => h.of.item))].map(async (id) => [id, await showFor(items.get(id)?.url ?? null)] as const)));
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse?m=podcast" crumbs={[LEARN, { label: "Podcasts", href: "/schole/browse?m=podcast" }]} title="Search your episodes" />
      <h1 id="page-title" className="mt-6 text-2xl font-semibold tracking-tight">Search your episodes</h1>
      <p className="text-muted-foreground mt-1 text-sm">In the transcripts of {sets.length} {sets.length === 1 ? "episode" : "episodes"} of shows you keep.</p>
      <form className="mt-4 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="A word or a phrase" aria-label="A word or a phrase" className="h-10" />
        <Button type="submit" className="h-10">Search</Button>
      </form>
      {q ? (
        hits.length ? (
          <ol className="mt-6 divide-y rounded-lg border text-sm">
            {hits.map((h, i) => {
              const ep = shows.get(h.of.item)?.episodes.find((e) => e.key === h.of.unit);
              return (
                <li key={i}>
                  <Link href={`/schole/items/${h.of.item}/episodes/${h.of.unit}${h.at !== null ? `?at=${h.at}` : ""}`} className="hover:bg-accent block space-y-1 px-4 py-3">
                    <span className="block font-medium">{ep?.title ?? "An episode"}</span>
                    <span className="text-muted-foreground block text-xs">{[items.get(h.of.item)?.title, h.at !== null ? clock(h.at) : null, h.who].filter(Boolean).join(" · ")}</span>
                    <span className="block">{h.text}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : <p className="text-muted-foreground mt-6 text-sm">Not found.</p>
      ) : null}
    </main>
  );
}
