// V21 Category: one kind of software, the work it serves (APQC process groups by function) and its integrations.
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScreenHead } from "@/components/studio/shell";
import { fnOf } from "@/components/studio/data";
import { categoryOf, clusterOf, functionsOf } from "@/components/studio/integrations";
import { CategorySection, FitBadge, Reasons } from "@/components/studio/integrations-ui";
import { WhyThis } from "@/components/studio/integrations-why";
import { recommendationFor } from "@/components/studio/recommend";
import { groupOf } from "@/components/studio/tools";
import { integrationsContext } from "../../context";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ team: string; slug: string; category: string }> }) {
  const { team, slug, category: id } = await params;
  const category = categoryOf(id);
  if (!category) notFound();
  const ctx = await integrationsContext(team, slug);
  const cluster = category.cluster ? clusterOf(category.cluster) : undefined;
  const r = recommendationFor(category.id, { ...ctx.profile, connected: ctx.connected });
  return (
    <div className="pb-16">
      <ScreenHead n="V21" title={category.name} job={category.line} />
      <div className="max-w-5xl space-y-8 px-4 md:px-8">
        <CategorySection team={team} slug={slug} category={category} connected={ctx.connected} head={false} />
        {r ? (
          <section className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">For {ctx.name}</h2>
              {r.connected ? <Badge variant="secondary" className="font-normal">Connected</Badge> : r.later ? <Badge variant="outline" className="text-muted-foreground font-normal">Later</Badge> : <FitBadge fit={r.fit} />}
            </div>
            <div className="mt-2"><Reasons team={team} slug={slug} r={r} /></div>
            <div className="mt-2"><WhyThis slug={slug} category={category.id} /></div>
          </section>
        ) : null}
        {cluster ? (
          <section className="rounded-xl border p-4">
            <div className="flex items-center gap-2"><h2 className="font-semibold">Why it is needed</h2><Badge variant="outline" className="font-normal">{cluster.title}</Badge></div>
            <p className="text-muted-foreground mt-1 text-sm">{cluster.why}.</p>
          </section>
        ) : null}
        <section>
          <h2 className="font-semibold">The work it serves</h2>
          <ul className="mt-3 divide-y rounded-xl border">
            {functionsOf(category).map((fn) => (
              <li key={fn} className="px-4 py-3">
                <div className="text-sm font-medium">{fnOf(fn).label}{ctx.functions.includes(fn) ? null : <span className="text-muted-foreground font-normal"> · not turned on</span>}</div>
                <div className="text-muted-foreground text-sm">{category.groups.map(groupOf).filter((g) => g?.function === fn).map((g) => g!.name).join("; ")}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
