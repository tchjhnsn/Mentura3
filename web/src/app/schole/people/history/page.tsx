import type { Metadata } from "next";
import Link from "next/link";
import { ERAS } from "@reflect/core/historical";
import { peopleOfEra, personHref } from "@reflect/core/historical-people";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { requireUser } from "@/server/session";
import { facesOf } from "@/server/topics";
import { LEARN } from "../../crumbs";
import { CoverImg } from "../../cover-img";

export const metadata: Metadata = { title: "People in history" };
export const dynamic = "force-dynamic";

/** Everyone in history with a page in Scholē, by era, each era opening its topic. */
export default async function PeopleInHistory() {
  await requireUser();
  const eras = ERAS.map((e) => ({ e, people: peopleOfEra(e.id) })).filter((x) => x.people.length);
  const faces = await Promise.all(eras.map((x) => facesOf(x.people)));
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title="People in history" />
      <h1 id="page-title" className="mt-6 text-3xl font-semibold tracking-tight">People in history</h1>
      <p className="text-muted-foreground mt-1 max-w-prose">What each made, what was written about them, who they knew and what they read.</p>
      <div className="mt-8 space-y-10">
        {eras.map(({ e, people }, k) => (
          <section key={e.id} className="space-y-2">
            <SectionHead title={e.label} note={e.when} href={`/schole/topics/${e.topics[0]}`} />
            <ul className="grid max-w-4xl gap-x-6 sm:grid-cols-2">
              {people.map((x, n) => (
                <li key={x.id} className="min-w-0">
                  <Link href={personHref(x)} className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <span className="bg-muted relative block size-12 shrink-0 overflow-hidden rounded-full border">{faces[k]![n]?.image ? <CoverImg src={faces[k]![n]!.image!} className="absolute inset-0 size-full object-cover object-top" /> : null}</span>
                    <span className="min-w-0">
                      <span className="block font-medium">{x.name}</span>
                      <span className="text-muted-foreground block truncate text-[13px]">{x.born} to {x.died} · {x.what}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
