import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listItems, listUnits } from "@/server/ways-store";
import { showFor } from "@/server/podcasts";
import { ThingHeader } from "@/components/headers";
import { browseCrumbs } from "../crumbs";
import { ShowView } from "./show-view";

export const metadata: Metadata = { title: "Podcast" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** A podcast's own page in Reflect, to explore before following it: its episodes, each heard here straight away. */
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
      <ShowView show={show} title={title} by={by} image={image} url={url} userId={user.id} kept={kept ? { id: kept.id, following: kept.status === "doing" } : null} units={units} episodeHref={episodeHref} />
    </main>
  );
}
