// V22 Function: what one function should connect, by the process group (APQC level 2) each category serves.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScreenHead } from "@/components/studio/shell";
import { FUNCTIONS, fnOf, ventureHref, type FunctionId } from "@/components/studio/data";
import { forFunction } from "@/components/studio/integrations";
import { Grid, RecommendationCard } from "@/components/studio/integrations-ui";
import { integrationsContext } from "../../context";

export const dynamic = "force-dynamic";

export default async function FunctionIntegrations({ params }: { params: Promise<{ slug: string; fn: string }> }) {
  const { slug, fn } = await params;
  if (!FUNCTIONS.some((f) => f.id === fn)) notFound();
  const ctx = await integrationsContext(slug);
  const recs = forFunction(fn as FunctionId, ctx.connected);
  const needed = recs.filter((r) => r.fit === "needed");
  const groups = [...new Map(recs.flatMap((r) => r.groups).map((g) => [g.id, g])).values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return (
    <div className="pb-16">
      <ScreenHead n="V22" title={`Integrations for ${fnOf(fn as FunctionId).label}`} job="What this function's work needs from outside, by the work each kind of software serves.">
        <Link href={ventureHref(slug, `functions/${fn}`)} className="text-muted-foreground hover:text-foreground text-sm underline">Open {fnOf(fn as FunctionId).label}</Link>
      </ScreenHead>
      <div className="max-w-5xl space-y-10 px-4 md:px-8">
        {needed.length ? (
          <section>
            <h2 className="font-semibold">Needed</h2>
            <p className="text-muted-foreground mt-1 text-sm">This function&apos;s tools reach outside its files for these.</p>
            <Grid className="mt-3">{needed.map((r) => <RecommendationCard key={r.category.id} slug={slug} r={r} showFunctions={false} />)}</Grid>
          </section>
        ) : null}
        {groups.map((g) => {
          const here = recs.filter((r) => r.groups.some((x) => x.id === g.id));
          return (
            <section key={g.id}>
              <h2 className="font-semibold">{g.name}</h2>
              <Grid className="mt-3">{here.map((r) => <RecommendationCard key={r.category.id} slug={slug} r={r} showFunctions={false} />)}</Grid>
            </section>
          );
        })}
        {!recs.length ? <p className="text-muted-foreground text-sm">No kind of software in the catalog serves this function&apos;s work yet.</p> : null}
      </div>
    </div>
  );
}
