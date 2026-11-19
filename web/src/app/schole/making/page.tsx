import type { Metadata } from "next";
import Link from "next/link";
import { CRAFT_GROUPS, craftsIn, doorOf } from "@reflect/core/crafts";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { myCrafts } from "@/server/crafts-store";

export const metadata: Metadata = { title: "Making" };
export const dynamic = "force-dynamic";

/** The ten groups name only a few of their crafts on the card; the group page lists them all. */
const SHOWN = 3;

/**
 * The Making door (doc "Scholē landing design guide"): the ten craft groups after Hugh of St Victor's mechanical arts,
 * each with its English and Latin names, a few of its crafts, how many there are and how many of them the person keeps.
 */
export default async function MakingPage() {
  const user = await requireUser();
  const door = doorOf("making")!;
  const mine = await myCrafts(user.id);
  const byGroup = new Map<string, number>();
  for (const c of mine) if (c.craft) byGroup.set(c.craft.group, (byGroup.get(c.craft.group) ?? 0) + 1);
  return (
    <main className={PAGE}>
      <ThingHeader crumbs={[{ label: "Scholē", href: "/schole" }]} title={door.label} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1.5">
          <h1 id="page-title" className="text-[28px] leading-tight font-semibold tracking-tight">
            {door.label}
          </h1>
          <p className="text-muted-foreground">{door.about}</p>
          <p className="text-muted-foreground text-xs">{door.source}</p>
        </div>

        <section aria-labelledby="groups" className="grid gap-3">
          <h2 id="groups" className="sr-only">Craft groups</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CRAFT_GROUPS.map((g, i) => {
              const crafts = craftsIn(g.id);
              const kept = byGroup.get(g.id) ?? 0;
              return (
                <li key={g.id}>
                  <Link href={`/schole/making/${g.id}`} className="hover:bg-accent grid h-full content-start gap-1.5 rounded-lg border p-4 transition">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 font-semibold">{g.label}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">{crafts.length} crafts</span>
                    </span>
                    <span className="text-muted-foreground text-sm">{crafts.slice(0, SHOWN).map((c) => c.label).join(", ")}, and more</span>
                    {kept ? <span className="text-sm font-medium">{kept === 1 ? "1 of yours" : `${kept} of yours`}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="text-sm">
          <Link href="/schole/discover" className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Not sure where to start? Discover crafts</Link>
        </p>
      </div>
    </main>
  );
}
