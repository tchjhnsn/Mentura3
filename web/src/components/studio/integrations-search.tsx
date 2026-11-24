"use client";

// V20 Integrations, after Vercel's Marketplace: search, what this business should connect, then every category with
// its integrations. A search hides the rest and shows the matches in one grid.
import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { MARKET } from "@reflect/core/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScreenHead } from "./shell";
import { ventureHref, type FunctionId } from "./data";
import { CATEGORIES, forBusiness, search } from "./integrations";
import { CategorySection, Grid, IntegrationCard, RecommendationCard } from "./integrations-ui";

export function Marketplace({ slug, name, functions, connected: ids }: { slug: string; name: string; functions: FunctionId[]; connected: string[] }) {
  const [q, setQ] = useState("");
  const connected = useMemo(() => new Set(ids), [ids]);
  const recs = useMemo(() => forBusiness(functions, connected).filter((r) => !r.connected).slice(0, 6), [functions, connected]);
  const hits = useMemo(() => (q.trim() ? search(q) : null), [q]);
  return (
    <div className="pb-16">
      <ScreenHead n="V20" title="Integrations" job={`Connect the services ${name} works in, so Reflect can read them when you ask and draft for you.`}>
        <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "integrations/connected")}>Connected{ids.length ? ` (${ids.length})` : ""}</Link></Button>
      </ScreenHead>
      <div className="max-w-5xl space-y-10 px-4 md:px-8">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${MARKET.length} integrations`} aria-label="Search integrations" className="pl-9" />
        </div>
        {hits ? (
          hits.length ? <Grid>{hits.map((c) => <IntegrationCard key={c.id} slug={slug} c={c} connected={connected.has(c.id)} />)}</Grid>
            : <p className="text-muted-foreground text-sm">Nothing matches &ldquo;{q}&rdquo;. <Link href="/marketplace/add" className="text-foreground underline">Add your own server</Link> by its address.</p>
        ) : (
          <>
            {recs.length ? (
              <section>
                <h2 className="font-semibold">Recommended for {name}</h2>
                <p className="text-muted-foreground mt-1 text-sm">From the work its functions do. Needed means that work cannot stay in files.</p>
                <Grid className="mt-3">{recs.map((r) => <RecommendationCard key={r.category.id} slug={slug} r={r} />)}</Grid>
              </section>
            ) : null}
            {CATEGORIES.filter((c) => c.members.length).map((c) => <CategorySection key={c.id} slug={slug} category={c} connected={connected} />)}
          </>
        )}
      </div>
    </div>
  );
}
