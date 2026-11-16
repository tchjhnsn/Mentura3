import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listDebates } from "@/server/dialectic-store";
import { feed, pointsOf } from "@/server/discussion-store";
import { LearnHeader } from "../header";
import { Feed, PointsLadder, WriteBox } from "./discussion";

export const metadata: Metadata = { title: "Dialectic" };
export const dynamic = "force-dynamic";

/**
 * Dialectic as a feed (Torian, 2026-11-16 17:56Z "essentially be a Twitter style feed", 17:59Z "build"): a write box,
 * then posts newest first, from everyone or from the people you follow; no ranking by popularity. Each post can carry a
 * topic as its tag; the curated questions and debates are one link away.
 */
export default async function DialecticPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const following = (await searchParams).tab === "following";
  const [items, points, debates] = await Promise.all([feed(user.id, { following }), pointsOf(user.id), listDebates()]);
  const live = debates.live.length;
  const tab = (on: boolean) => `relative flex-1 py-3 text-center text-sm ${on ? "font-semibold" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mx-auto mt-6 max-w-xl">
        <header className="flex items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Dialectic</h1>
          <p className="text-right text-sm"><span className="text-lg font-semibold tabular-nums">{points.points}</span> <span className="text-muted-foreground">{points.points === 1 ? "point" : "points"}</span></p>
        </header>

        <nav className="mt-3 flex border-b" aria-label="Feeds">
          <Link href="/schole/dialectic" className={tab(!following)} aria-current={!following ? "page" : undefined}>Everyone{!following ? <span className="bg-foreground absolute inset-x-1/3 bottom-0 h-0.5 rounded-full" /> : null}</Link>
          <Link href="/schole/dialectic?tab=following" className={tab(following)} aria-current={following ? "page" : undefined}>Following{following ? <span className="bg-foreground absolute inset-x-1/3 bottom-0 h-0.5 rounded-full" /> : null}</Link>
        </nav>

        <div className="border-b py-3">
          <WriteBox path="/schole/dialectic" />
        </div>

        <Link href="/schole/dialectic/questions" className="hover:bg-muted/50 flex items-center gap-2 border-b py-3 text-sm">
          <span className="min-w-0 flex-1"><span className="font-medium">Questions and debates</span><span className="text-muted-foreground block text-xs">Standing questions argued across the ages{live ? ` · ${live} debate${live === 1 ? "" : "s"} live` : ""}</span></span>
          <ChevronRightIcon className="text-muted-foreground size-4" />
        </Link>

        <Feed items={items} path="/schole/dialectic" empty={following ? "No posts from people you follow yet. Open someone's name to follow them." : "No posts yet. Write the first."} />
        <div className="border-t py-4"><PointsLadder /></div>
      </div>
    </main>
  );
}
