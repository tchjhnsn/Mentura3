import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { itemHref } from "@reflect/core/collections";
import { QUESTION_MEDIA, formatOf, mixOldNew, weekOf } from "@reflect/core/dialectic-media";
import { holds } from "../../questions-grid";
import { dialecticById } from "@reflect/core/dialectics";
import { workById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { haveKeys } from "@/server/collections";
import { listItems } from "@/server/ways-store";
import { LEARN } from "../../../crumbs";
import { PlaylistRows } from "../../../playlists/card";

export const metadata: Metadata = { title: "Question" };
export const dynamic = "force-dynamic";

/**
 * A standing question: what it asks, the recordings that argue it (the first one the page's filled button), and the
 * positions taken on it across the ages, each with the place in the work where it is argued.
 */
export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const d = dialecticById((await params).id);
  if (!d) notFound();
  // New and old in turn, as on the Dialectic page (one old for every new, 2026-11-16).
  const media = mixOldNew(QUESTION_MEDIA[d.id] ?? [], weekOf(new Date()));
  const have = haveKeys(await listItems(user.id).catch(() => []));
  const sides = [...new Set(d.positions.map((x) => x.side))];
  const first = media[0];
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, { label: "Questions", href: "/schole/dialectic/questions" }]} title={d.question} />
      <div className="mt-6 space-y-10">
        <header className="max-w-2xl space-y-2">
          <p className="text-muted-foreground text-sm">Question · {d.subject}</p>
          <h1 id="page-title" className="text-4xl leading-tight font-semibold tracking-tight">{d.question}</h1>
          <p className="text-muted-foreground text-[17px]">{d.about}</p>
          {first ? <Button asChild className="mt-2 h-auto min-h-10 rounded-full whitespace-normal"><Link href={itemHref(first)}>{formatOf(first) === "Video" ? "Watch" : "Listen to"}: {first.title}</Link></Button> : null}
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="min-w-0 space-y-2">
            <SectionHead title="Watch and listen" note={`${holds(media)}, a new one and an old one in turn.`} />
            <PlaylistRows items={media} have={have} numbered={false} />
          </section>
          <aside className="space-y-3" aria-labelledby="positions">
            <SectionHead title={<span id="positions">Where each side is argued</span>} note="Places in the works, not quotations." />
            <ul className="space-y-3">
              {sides.map((side) => (
                <li key={side} className="space-y-2 rounded-lg border p-3">
                  <p className="font-semibold">{side}</p>
                  {d.positions.filter((x) => x.side === side).map((x) => {
                    const w = x.work ? workById(x.work) : undefined;
                    return (
                      <div key={`${x.who}-${x.at}`} className="space-y-0.5">
                        <p className="text-sm"><span className="font-medium">{x.who}</span><span className="text-muted-foreground"> · {w ? <Link href={`/schole/works/${w.id}`} className="underline underline-offset-4">{w.title}</Link> : x.title}, {x.at}</span></p>
                        <p className="text-muted-foreground text-sm leading-relaxed">{x.holds}</p>
                      </div>
                    );
                  })}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
