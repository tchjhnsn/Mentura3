import type { Metadata } from "next";
import Link from "next/link";
import { ideasByCount, termById, worksDiscussing } from "@reflect/core/great-ideas";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { LEARN } from "../crumbs";

export const metadata: Metadata = { title: "Great Ideas" };

/** The Great Ideas Scholē has passages for, the most discussed first (guide tab "Ideas and terms"). */
export default async function IdeasPage() {
  await requireUser();
  const ideas = ideasByCount();
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title="Great Ideas" />
      <header className="mt-6 max-w-prose space-y-2">
        <h1 id="page-title" className="text-3xl font-semibold tracking-tight">Great Ideas</h1>
        <p className="text-muted-foreground">The ideas the great works return to, from the 102 in Mortimer Adler&rsquo;s Syntopicon (1952). Each lists the passages that discuss it and the later terms that grew from it. More are being added.</p>
      </header>
      <ul className="mt-8 divide-y">
        {ideas.map((i) => {
          const n = worksDiscussing(i);
          return (
            <li key={i.id} className="py-4">
              <Link href={`/schole/ideas/${i.id}`} className="group block space-y-1">
                <span className="text-xl font-semibold group-hover:underline group-hover:underline-offset-4">{i.name}</span>
                <span className="block text-sm">{i.about}</span>
                <span className="text-muted-foreground block text-[13px]">{n} {n === 1 ? "work" : "works"} · terms: {i.terms.map((t) => termById(t)?.name).filter(Boolean).join(", ")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
