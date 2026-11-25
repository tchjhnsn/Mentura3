// V22 Function: what one function should connect, by the process group (APQC level 2) each category serves.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHead } from "@/components/studio/shell";
import { FUNCTIONS, fnOf, businessHref, type FunctionId } from "@/components/studio/data";
import { forFunction } from "@/components/studio/integrations";
import { Grid, ScoredCard } from "@/components/studio/integrations-ui";
import { recommend } from "@/components/studio/recommend";
import { integrationsContext } from "../../context";

export const dynamic = "force-dynamic";

export default async function FunctionIntegrations({ params }: { params: Promise<{ team: string; slug: string; fn: string }> }) {
  const { team, slug, fn } = await params;
  if (!FUNCTIONS.some((f) => f.id === fn)) notFound();
  const ctx = await integrationsContext(team, slug);
  const recs = forFunction(fn as FunctionId, ctx.connected);
  // Each card is scored for the whole business (phase, industry, regulation, funding), so its reasons match V20's.
  const scored = new Map(recommend({ ...ctx.profile, functions: [...new Set([...ctx.profile.functions, fn as FunctionId])], connected: ctx.connected }).map((r) => [r.category.id, r]));
  const card = (id: string) => { const r = scored.get(id); return r ? <ScoredCard key={id} team={team} slug={slug} r={r} /> : null; };
  const needed = recs.filter((r) => r.fit === "needed");
  const groups = [...new Map(recs.flatMap((r) => r.groups).map((g) => [g.id, g])).values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return (
    <div className="pb-16">
      <ScreenHead n="V22" title={`Integrations for ${fnOf(fn as FunctionId).label}`} job="What this function's work needs from outside, by the work each kind of software serves.">
        <Link href={businessHref(team, slug, `functions/${fn}`)} className="text-muted-foreground hover:text-foreground text-sm underline">Open {fnOf(fn as FunctionId).label}</Link>
      </ScreenHead>
      <div className="max-w-5xl space-y-10 px-4 md:px-8">
        {needed.length ? (
          <section>
            <h2 className="font-semibold">Needed</h2>
            <p className="text-muted-foreground mt-1 text-sm">This function&apos;s tools reach outside its files for these.</p>
            <Grid className="mt-3">{needed.map((r) => card(r.category.id))}</Grid>
          </section>
        ) : null}
        {groups.map((g) => {
          const here = recs.filter((r) => r.groups.some((x) => x.id === g.id));
          return (
            <section key={g.id}>
              <h2 className="font-semibold">{g.name}</h2>
              <Grid className="mt-3">{here.map((r) => card(r.category.id))}</Grid>
            </section>
          );
        })}
        {!recs.length ? <p className="text-muted-foreground text-sm">No kind of software in the catalog serves this function&apos;s work yet.</p> : null}
      </div>
    </div>
  );
}
