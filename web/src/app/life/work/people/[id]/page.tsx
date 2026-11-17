import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeadphonesIcon } from "lucide-react";
import { exemplarById, ROLES, traitById } from "@reflect/core/formation";
import { itemHref } from "@reflect/core/collections";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { admiredOf } from "@/server/admired";
import { admireAction } from "../../admire-action";
import { Credit } from "../../parts";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: exemplarById((await params).id)?.name ?? "Person" };
}

/**
 * A person who did a broad role well (doc "Scholē subjects by ICP and recommendations", Work aims): the traits they
 * name in their own book, each quoted with where it is, to choose the ones you want to build. What you choose steers
 * Scholē's recommendations.
 */
export default async function ExemplarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = exemplarById(id);
  if (!e) notFound();
  const user = await requireUser();
  const kept = (await admiredOf(user.id)).find((a) => a.exemplar === id) ?? null;
  const roles = ROLES.filter((r) => r.exemplars.includes(id)).map((r) => r.name);
  return (
    <main className={PAGE}>
      <ThingHeader back="/life/work/people" backLabel="People" crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/life/work" }]} title={e.name} />
      <form action={admireAction.bind(null, id)} className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">{roles.join(", ")}</p>
            <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{e.name}</h1>
            <p className="text-muted-foreground">{e.what}</p>
            {e.page ? <p className="text-sm"><Link href={e.page} className="underline underline-offset-2">Their page in Scholē</Link></p> : null}
          </div>
          <Button type="submit">{kept ? "Save" : "It inspires me"}</Button>
        </div>

        <section className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Traits in their own words</h2>
            <p className="text-muted-foreground text-sm">Choose the ones you want to build. Scholē then suggests what teaches them.</p>
          </div>
          <ul className="grid gap-3">
            {e.traits.map((t) => {
              const trait = traitById(t.trait)!;
              return (
                <li key={t.trait}>
                  <label className="has-[:checked]:border-foreground has-[:checked]:bg-accent flex cursor-pointer gap-3 rounded-xl border p-4 transition">
                    <input type="checkbox" name="trait" value={t.trait} defaultChecked={kept?.traits.includes(t.trait) ?? false} className="mt-1 size-4 shrink-0" />
                    <span className="grid gap-1.5">
                      <span className="font-semibold">{trait.name}</span>
                      <span className="text-muted-foreground text-sm">{trait.about}</span>
                      <q className="border-l-2 pl-3 text-sm italic">{t.quote}</q>
                      <span className="text-muted-foreground text-xs">{e.book.title}, {t.where}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="grid gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Their book</h2>
          <Link href={itemHref(e.book)} className="hover:bg-accent flex items-center gap-3 rounded-xl border p-4 transition">
            <HeadphonesIcon className="text-muted-foreground size-5 shrink-0" />
            <span className="grid"><span className="font-medium">{e.book.title}</span><span className="text-muted-foreground text-sm">{e.book.why}</span></span>
          </Link>
        </section>

        <Credit>Quotes from the <a href={`https://www.gutenberg.org/ebooks/${e.gutenberg}`} className="underline underline-offset-2">Project Gutenberg text</a> of {e.book.title}; recordings may use another edition or translation.</Credit>
      </form>
    </main>
  );
}
