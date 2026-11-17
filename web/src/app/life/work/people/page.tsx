import type { Metadata } from "next";
import Link from "next/link";
import { exemplarById, ROLES, traitById } from "@reflect/core/formation";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { admiredOf } from "@/server/admired";

export const metadata: Metadata = { title: "People who inspire you" };
export const dynamic = "force-dynamic";
const GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3";

/**
 * People who inspire you (doc "Work design guide": moved behind a link from the workspace). For a broad role, the
 * people who did it well, each with the traits they name in their own book; the ones kept steer Scholē.
 */
export default async function PeoplePage() {
  const user = await requireUser();
  const admired = await admiredOf(user.id);
  return (
    <main className={PAGE}>
      <ThingHeader back="/life/work" backLabel="Work" crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/life/work" }]} title="People who inspire you" />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">People who inspire you</h1>
          <p className="text-muted-foreground">Choose the people you want to be like and the traits of theirs to build. Scholē suggests what teaches them.</p>
        </div>
        {admired.length ? (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Yours</h2>
            <ul className={GRID}>
              {admired.map((a) => {
                const e = exemplarById(a.exemplar)!;
                return (
                  <li key={a.exemplar}>
                    <Link href={`/life/work/people/${a.exemplar}`} className="bg-card hover:bg-accent flex h-full flex-col gap-2 rounded-xl border p-4 shadow-xs transition">
                      <span className="text-muted-foreground text-xs">{ROLES.filter((r) => r.exemplars.includes(a.exemplar)).map((r) => r.name).join(", ")}</span>
                      <span className="font-medium leading-snug">{e.name}</span>
                      <span className="text-muted-foreground mt-auto text-xs">Building {a.traits.map((t) => traitById(t)!.name.toLowerCase()).join(", ")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {ROLES.map((r) => {
          const left = r.exemplars.filter((x) => !admired.some((a) => a.exemplar === x));
          if (!left.length) return null;
          return (
            <section key={r.id} id={r.id} className="grid scroll-mt-20 gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{r.plural}</h2>
              <ul className={GRID}>
                {left.map((x) => {
                  const e = exemplarById(x)!;
                  return (
                    <li key={x}>
                      <Link href={`/life/work/people/${x}`} className="hover:bg-accent flex h-full flex-col gap-1.5 rounded-xl border p-4 transition">
                        <span className="font-medium leading-snug">{e.name}</span>
                        <span className="text-muted-foreground line-clamp-2 text-sm">{e.what}</span>
                        <span className="text-muted-foreground mt-auto text-xs">{e.traits.map((t) => traitById(t.trait)!.name).join(", ")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
