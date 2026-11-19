import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GROUPS, tileFact } from "@reflect/core/plan";
import { ThingHeader } from "@/components/headers";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { PAGE } from "@/components/page-header";
import { dashboardFacts } from "@/server/dashboard";
import { requireUser } from "@/server/session";
import { GLYPHS, hrefOf, MINE, toneOf, type Tone } from "../../home-tiles";

export const dynamic = "force-dynamic";
const SAY: Record<Tone, string> = { action: "In action", thought: "In thought", unstated: "Not stated yet" };
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = GROUPS.find((x) => x.id === id);
  return { title: g?.label ?? "Reflect" };
}

/**
 * A group's dashboard (Torian, 2026-11-17): The person, The household, or The village and polis, after the three groups
 * of the main dashboard. Each of the group's tiles is a row with its figure, and opens the tile. The household also
 * shows what it costs and what it leaves to earn, and what is kept at home.
 */
export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: gid } = await params;
  // The village and polis is on the shared side, whose home is Village and polis (src/lib/sides.ts).
  if (gid === "village") redirect("/v");
  const g = GROUPS.find((x) => x.id === gid);
  if (!g) notFound();
  const { facts, plan } = await dashboardFacts(user.id);
  const s = plan.already;
  const covered = s.lines.filter((l) => g.tiles.includes(l.tile) && l.from === "covered");
  const month = s.lines.filter((l) => g.tiles.includes(l.tile) && l.from !== "covered" && l.month !== null).reduce((n, l) => n + (l.month ?? 0), 0);

  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title={g.label} />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-3xl font-bold tracking-tight">{g.label}</h1>

        {g.id === "household" ? (
          <Link href="/plan" className="bg-card hover:bg-accent grid gap-1 rounded-2xl border p-5 transition">
            <span className="text-muted-foreground text-sm">The household pays a month</span>
            <span className="text-4xl font-bold tracking-tight">{month ? money(month) : "Not known"}</span>
            <span className="text-muted-foreground text-sm">
              {month ? "" : "Give what a need costs to see it. "}
              {covered.length ? `Covered by others: ${covered.map((l) => l.label.toLowerCase()).join(", ")}. ` : ""}
              {s.leftToEarn !== null ? `${money(s.leftToEarn)} a year left to earn.` : "See the budget."}
            </span>
          </Link>
        ) : null}

        <Group>
          {g.tiles.map((id) => {
            const t = MINE.find((x) => x.id === id);
            const href = t && hrefOf(t);
            if (!t || !href) return null;
            return (
              <Row
                key={id}
                href={href}
                icon={<svg viewBox="0 0 100 100" aria-hidden="true"><path d={GLYPHS[t.id]} className="fill-current" fillRule="evenodd" /></svg>}
                label={t.label}
                value={tileFact(s, id) ?? SAY[toneOf(t, facts)]}
              />
            );
          })}
        </Group>

        {g.id === "household" ? (
          <Group title="Kept at home" id="kept">
            <Row href="/life/home?k=firearm" label="Firearms" sub="Training and safe storage for each one you keep" />
            <Row href="/life/home?k=belonging" label="Belongings" sub="What you own of value, so a loss can be shown and claimed" />
          </Group>
        ) : null}
      </div>
    </main>
  );
}
