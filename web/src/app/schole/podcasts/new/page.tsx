import type { Metadata } from "next";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { newEpisodeCards } from "@/server/new-episodes";
import { LEARN } from "../../crumbs";
import { NewEpisodeCards } from "../new-episodes";

export const metadata: Metadata = { title: "New from your shows" };
export const dynamic = "force-dynamic";

/** Every episode of the shows the person keeps out in the last two weeks and not begun, newest first (Torian, 2026-11-15 07:24Z). */
export default async function NewFromShowsPage() {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.parse(today) - 14 * 86400000).toISOString().slice(0, 10);
  const cards = await newEpisodeCards(user.id, since, today, { perShow: 30, limit: 120 });
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole" crumbs={[LEARN]} title="New from your shows" />
      <h1 id="page-title" className="mt-6 text-2xl font-semibold tracking-tight">New from your shows</h1>
      <p className="text-muted-foreground mt-1 text-sm">Episodes out in the last two weeks that you have not begun.</p>
      <div className="mt-6">{cards.length ? <NewEpisodeCards cards={cards} /> : <p className="text-muted-foreground text-sm">Nothing new from your shows in the last two weeks.</p>}</div>
    </main>
  );
}
