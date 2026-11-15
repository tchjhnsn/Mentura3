import type { Metadata } from "next";
import Link from "next/link";
import { MicIcon } from "lucide-react";
import { episodeDay, episodeKey } from "@reflect/core/podcasts";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { appearancesOf, bioFor } from "@/server/guests";
import { followed } from "@/server/people";
import { browseCrumbs } from "../crumbs";
import { guestHref } from "../podcasts/mentions";

export const metadata: Metadata = { title: "People you follow" };
export const dynamic = "force-dynamic";

/**
 * The hosts and guests a person follows (Torian, 2026-11-15 16:47Z), and the newest episodes that name them, from
 * Apple Podcasts' search; each plays here.
 */
export default async function PeoplePage() {
  const user = await requireUser();
  const [people, items] = await Promise.all([followed(user.id), listItems(user.id)]);
  const some = people.slice(0, 24);
  const [bios, found] = await Promise.all([
    Promise.all(some.map((p) => bioFor(p.name).catch(() => null))),
    Promise.all(some.slice(0, 12).map((p) => appearancesOf(p.name, 8).catch(() => []))),
  ]);
  const keptBy = new Map(items.filter((i) => i.medium === "podcast" && i.url).map((i) => [i.url!, i.id]));
  const seen = new Set<string>();
  const fresh = found.flatMap((list, i) => list.map((a) => ({ ...a, who: some[i]!.name })))
    .filter((a) => { const k = `${a.feed}|${a.guid}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, 30);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse?m=podcast" crumbs={browseCrumbs("podcast")} title="People you follow" />
      <div className="mt-6 space-y-8">
        <h1 id="page-title" className="text-2xl font-semibold tracking-tight">People you follow</h1>
        {some.length ? (
          <ul className="flex flex-wrap gap-4">
            {some.map((p, i) => (
              <li key={p.name}>
                <Link href={guestHref({ name: p.name, ...(p.qid ? { qid: p.qid } : {}) })} className="flex w-20 flex-col items-center gap-1.5 text-center">
                  {bios[i]?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bios[i]!.image!} alt="" className="size-16 rounded-full border object-cover" />
                  ) : <span aria-hidden className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full text-lg font-medium">{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
                  <span className="line-clamp-2 text-xs font-medium">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">You don&apos;t follow anyone yet. Open a host or guest from a podcast and tap Follow.</p>}
        {fresh.length ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">New from people you follow</h2>
            <ul className="divide-y rounded-lg border">
              {fresh.map((a) => {
                const k = episodeKey(a.guid);
                const kept = keptBy.get(a.feed);
                const href = kept ? `/schole/items/${kept}/episodes/${k}` : `/schole/podcasts/episode?u=${encodeURIComponent(a.feed)}&k=${k}&t=${encodeURIComponent(a.show)}`;
                return (
                  <li key={`${a.feed}|${a.guid}`}>
                    <Link href={href} className="hover:bg-accent flex items-center gap-3 p-3">
                      {a.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-md border object-cover" />
                      ) : <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-md border"><MicIcon className="size-4" /></span>}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-medium">{a.title}</span>
                        <span className="text-muted-foreground block truncate text-xs">{[a.who, a.show, episodeDay(a.date, today)].filter(Boolean).join(" · ")}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
