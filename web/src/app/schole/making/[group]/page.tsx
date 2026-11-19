import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTESTS, CRAFT_STATES, craftsIn, groupOf } from "@reflect/core/crafts";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { myCrafts } from "@/server/crafts-store";
import { MINE, hrefOf } from "@/app/home-tiles";
import { RotatingName } from "../../rotating-name";
import { groupNames } from "../../names";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  return { title: groupOf((await params).group)?.label ?? "Craft group" };
}

const stateLabel = (s: string | null) => CRAFT_STATES.find((x) => x.id === s)?.label ?? null;

/**
 * One craft group (doc "Scholē landing design guide"): where the group comes from, then its crafts, each marked with
 * the person's place in it. The performance group says that contests are crafts too, with training kept in Fitness.
 */
export default async function GroupPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  const g = groupOf(group);
  if (!g) notFound();
  const user = await requireUser();
  const mine = new Map((await myCrafts(user.id)).map((c) => [c.ref, c.state]));
  const crafts = craftsIn(g.id);
  const names = groupNames(g);
  const fitnessTile = MINE.find((t) => t.id === "fitness");
  const fitness = (fitnessTile && hrefOf(fitnessTile)) ?? "/life/body";
  return (
    <main className={PAGE}>
      <ThingHeader crumbs={[{ label: "Scholē", href: "/schole" }, { label: "Making", href: "/schole/making" }]} title={g.label} />
      <div className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1.5">
          <h1 id="page-title" className="text-[28px] leading-tight font-semibold tracking-tight">
            <RotatingName names={names} labelEn={g.label} />
          </h1>
          <p className="text-muted-foreground">{g.after.charAt(0).toUpperCase() + g.after.slice(1)}.</p>
        </div>

        {g.id === "performance" ? (
          <p className="text-sm">
            Contests are crafts too: their end is the performance itself. Training for them is kept in{" "}
            <Link href={fitness} className="underline underline-offset-2">Fitness</Link>.
          </p>
        ) : null}

        <section aria-labelledby="crafts" className="grid gap-2">
          <h2 id="crafts" className="font-semibold">{crafts.length} crafts</h2>
          <ul className="grid border-y sm:grid-cols-2 sm:gap-x-6">
            {crafts.map((c) => {
              const state = stateLabel(mine.get(c.id) ?? null);
              const contest = g.id === "performance" && CONTESTS.includes(c.id);
              return (
                <li key={c.id} className="border-b last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                  <Link href={`/schole/crafts/${c.id}`} className="hover:bg-accent flex items-baseline justify-between gap-3 py-3 transition">
                    <span className="min-w-0">
                      <span className={state ? "font-semibold" : undefined}>{c.label}</span>
                      {contest ? <span className="text-muted-foreground text-sm"> · contest</span> : null}
                    </span>
                    {state ? <span className="text-muted-foreground shrink-0 text-sm">{state}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
