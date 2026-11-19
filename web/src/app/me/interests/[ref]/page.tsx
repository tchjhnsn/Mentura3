import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { areaOf, itemOf, related, topicsOf } from "@reflect/core/interest-catalogue";
import { MODES, sentence } from "@reflect/core/interests";
import { Button } from "@/components/ui/button";
import { SidebarButton } from "@/components/sidebar";
import { requireUser } from "@/server/session";
import { myInterest } from "@/server/interests-store";
import { Cover } from "../../cover";
import { PickButton } from "./pick-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }): Promise<Metadata> {
  return { title: itemOf((await params).ref)?.title ?? "Interest" };
}

const OPEN: Record<string, string> = { books: "Open Library", podcasts: "Apple Podcasts", music: "Wikipedia" };

/**
 * An interest's page (design guide "Get to know you: person dashboard", page 6, the interest card): the thing, how the
 * person holds it in plain words, the people behind it, where to read, hear or follow it, and more like it.
 */
export default async function InterestPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const item = itemOf(ref);
  if (!item) notFound();
  const user = await requireUser();
  const mine = await myInterest(user.id, ref);
  const area = areaOf(item.area);
  const round = item.area === "music";
  const lines = mine ? MODES.map((m) => sentence(mine, m.id)).filter((s): s is string => !!s) : [];
  const more = related(ref, 6);
  // A solo musician's only person is the musician; the hero already shows them.
  const people = item.people.filter((p) => p.name !== item.title);

  return (
    <main className="mx-auto grid min-h-screen max-w-3xl grid-cols-[minmax(0,1fr)] content-start gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <SidebarButton />
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">Dashboard</Link>
      </header>

      <section className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 sm:gap-6">
        <Cover src={item.image} name={item.title} round={round} eager className="size-28 sm:size-40" />
        <div className="grid min-w-0 gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{area?.label.replace(/s$/, "")}</span>
          <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
          {item.by || item.year ? <p className="text-muted-foreground">{[item.by, item.year].filter(Boolean).join(", ")}</p> : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {mine
              ? <Button asChild><Link href={`/me/get-to-know-you/sort?focus=${ref}`}>Set how you hold it</Link></Button>
              : <PickButton refId={ref} />}
            {item.link ? <a href={item.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">{OPEN[item.area] ?? "Open"}<ExternalLink className="size-3.5" /></a> : null}
          </div>
        </div>
      </section>

      {mine ? (
        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">How you hold it</h2>
          {lines.length ? lines.map((l) => <p key={l} className="text-[15px]">{l}</p>) : <p className="text-muted-foreground text-sm">Picked, not placed yet.</p>}
          <p className="text-muted-foreground text-xs">You told us.</p>
        </section>
      ) : null}

      {people.length ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">{item.area === "music" ? "Who" : "The people behind it"}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {people.map((p) => (
              <li key={p.name}>
                <a href={p.page ?? undefined} target="_blank" rel="noreferrer" className="hover:bg-muted/60 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg p-1.5">
                  <Cover src={p.image} name={p.name} round className="size-16" />
                  <span className="grid min-w-0">
                    <span className="font-medium">{p.name}</span>
                    {p.line ? <span className="text-muted-foreground line-clamp-2 text-sm">{p.line}</span> : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topicsOf(item).length ? (
        <section className="grid gap-2">
          <h2 className="text-lg font-semibold">What it is about</h2>
          <p className="text-muted-foreground text-[15px]">{topicsOf(item).join(", ")}</p>
        </section>
      ) : null}

      {more.length ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">More like it</h2>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6">
            {more.map((m) => (
              <li key={m.id}>
                <Link href={`/me/interests/${m.id}`} className="grid gap-1.5">
                  <Cover src={m.image} name={m.title} round={round} className="aspect-square w-full" />
                  <span className="line-clamp-2 text-sm leading-tight font-medium">{m.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
