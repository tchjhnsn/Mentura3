import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PenLineIcon } from "lucide-react";
import { itemHref } from "@reflect/core/collections";
import { exemplarHref, keptQualities, traitById } from "@reflect/core/formation";
import { recommend } from "@reflect/core/recommend";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { admiredOf } from "@/server/admired";
import { signalsOf } from "@/server/recommend";
import { entriesAbout } from "@/server/qualities";
import { Steps } from "@/app/life/work/steps";
import { takeOffQualityAction, writeQualityAction } from "../actions";
import { Faces } from "../faces";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: traitById((await params).id)?.name ?? "Quality" };
}

/**
 * A quality (doc "Qualities design guide"): what it is and the one act, writing about it; who the person saw it in,
 * in their own words; what in Scholē teaches it; and what they wrote about it.
 */
export default async function QualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trait = traitById(id);
  if (!trait) notFound();
  const user = await requireUser();
  const [admired, signals, entries] = await Promise.all([admiredOf(user.id), signalsOf(user.id), entriesAbout(user.id, trait.id)]);
  const q = keptQualities(admired).find((x) => x.trait.id === trait.id) ?? null;
  // What teaches this quality: the ranker's picks for this one quality, as the people it was seen in practised it.
  const teach = recommend({ ...signals, aims: [], follows: [], liked: new Set(), admired: (q?.from ?? []).map((e) => ({ exemplar: e.id, traits: [trait.id] })) }, undefined, 40)
    .filter((p) => p.reason.toLowerCase().includes(trait.name.toLowerCase())).slice(0, 5);
  const seen = (q?.from ?? []).map((e) => ({ e, ev: e.traits.find((t) => t.trait === trait.id)! }));
  const seenIn = (
    <section aria-labelledby="seen" className="grid content-start gap-3">
      <h2 id="seen" className="font-semibold">Seen in</h2>
      {seen.length ? (
        <ul className="grid gap-4">
          {seen.map(({ e, ev }) => (
            <li key={e.id} className="grid gap-1.5">
              <Link href={exemplarHref(e)} className="flex items-center gap-2 font-medium hover:underline"><Faces people={[e]} size="lg" />{e.name}</Link>
              <q className="text-muted-foreground text-sm">{ev.quote}</q>
              <span className="text-muted-foreground text-xs">{e.book.title}, {ev.where}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-muted-foreground text-sm">Not kept yet. Press + on it on the page of someone who names it in Scholē.</p>}
    </section>
  );
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/qualities" backLabel="Qualities" crumbs={[{ label: "Scholē", href: "/schole" }, { label: "Qualities", href: "/schole/qualities" }]} title={trait.name} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <h1 id="page-title" className="text-[28px] leading-tight font-semibold tracking-tight">{trait.name}</h1>
            <p className="text-muted-foreground">{trait.about}</p>
          </div>
          <form action={writeQualityAction.bind(null, trait.id)}><Button type="submit"><PenLineIcon />Write about it</Button></form>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid content-start gap-8">
            <div className="lg:hidden">{seenIn}</div>
            <Steps title="What teaches it" empty={<>Nothing in Scholē for it yet. <Link href="/schole/browse" className="underline underline-offset-2">Browse Scholē</Link>.</>} rows={teach.map((p) => ({ key: `${p.item.kind}:${p.item.title}`, href: itemHref(p.item), label: `${p.item.title}, ${p.item.by}`, reason: p.reason }))} />
            <section aria-labelledby="wrote" className="grid gap-2">
              <h2 id="wrote" className="font-semibold">What you wrote about it</h2>
              {entries.length ? (
                <ul className="divide-y border-y text-sm">
                  {entries.map((w) => <li key={w.id}><Link href={`/journal/w/${w.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 py-2.5"><span className="min-w-0 truncate">{w.title}</span><span className="text-muted-foreground shrink-0 text-xs">{w.day}</span></Link></li>)}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Nothing written yet.</p>}
            </section>
          </div>
          <aside className="hidden lg:block">{seenIn}</aside>
        </div>
        {q ? <div className="border-t pt-4"><form action={takeOffQualityAction.bind(null, trait.id)}><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">Take it off</Button></form></div> : null}
      </div>
    </main>
  );
}
