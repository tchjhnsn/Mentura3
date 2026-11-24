// V23 Integration detail, and V26 when it is connected: after Vercel's integration page, the overview on the left and
// the facts on the right; Connect leads to V24, Disconnect clears the sign-in.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { marketReady } from "@reflect/core/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/marketplace/logos";
import { Num } from "@/components/studio/bits";
import { fnOf, ventureHref } from "@/components/studio/data";
import { categoriesOf, functionsOf, integrationOf } from "@/components/studio/integrations";
import { Fact, FitBadge } from "@/components/studio/integrations-ui";
import { forBusiness } from "@/components/studio/integrations";
import { disconnectIntegration } from "../actions";
import { integrationsContext } from "../context";

export const dynamic = "force-dynamic";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default async function IntegrationPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ connected?: string; disconnected?: string; error?: string }> }) {
  const { slug, id: raw } = await params;
  const id = decodeURIComponent(raw);
  const c = integrationOf(id);
  if (!c) notFound();
  const [ctx, sp] = await Promise.all([integrationsContext(slug), searchParams]);
  const conn = ctx.connections.find((x) => x.connector === id && x.status === "connected");
  const ready = marketReady(c, process.env);
  const cats = categoriesOf(id);
  const fns = [...new Set(cats.flatMap(functionsOf))];
  const recs = forBusiness(ctx.functions).filter((r) => cats.some((k) => k.id === r.category.id));
  return (
    <div className="pb-16" data-virtu-screen={conn ? "V26" : "V23"}>
      <div className="px-4 pt-5 md:px-8 md:pt-8">
        <Link href={ventureHref(slug, "integrations")} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"><ArrowLeftIcon className="size-4" />Back to Integrations</Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Num n={conn ? "V26" : "V23"} />
            <Logo id={c.id} name={c.name} />
            <div>
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{c.name}</h1>
              <p className="text-muted-foreground text-sm">{c.line}</p>
            </div>
          </div>
          {conn ? <Badge variant="secondary" className="font-normal">Connected</Badge>
            : ready ? <Button asChild><Link href={ventureHref(slug, `integrations/${encodeURIComponent(id)}/connect`)}>Connect</Link></Button>
            : <Badge variant="outline" className="font-normal">Needs setup by Reflect</Badge>}
        </div>
        {sp.connected ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">{c.name} is connected. Reflect reads it when you ask, and anything that writes or sends waits for your Send.</p> : null}
        {sp.disconnected ? <p className="bg-muted mt-4 rounded-lg px-3 py-2 text-sm">{c.name} is disconnected. Reflect no longer holds your sign-in.</p> : null}
        {sp.error ? <p className="text-destructive mt-4 text-sm">{sp.error}</p> : null}
      </div>
      <div className="mt-6 grid max-w-5xl gap-8 px-4 md:grid-cols-[1fr_16rem] md:px-8">
        <div className="space-y-8">
          <section>
            <h2 className="font-semibold">What Reflect does with it</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{c.does.map((d) => <li key={d}>{d}</li>)}</ul>
            <p className="text-muted-foreground mt-3 text-sm">Reads run when you ask. Anything that writes, sends or pays waits for you to tap Send on a card that names it.</p>
          </section>
          {recs.length ? (
            <section>
              <h2 className="font-semibold">Why {ctx.name} would use it</h2>
              <ul className="mt-2 divide-y rounded-xl border">
                {recs.map((r) => (
                  <li key={r.category.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium">{r.category.name}<FitBadge fit={r.fit} /></div>
                    <p className="text-muted-foreground mt-1 text-sm">{r.why}</p>
                    <p className="text-muted-foreground mt-1 text-xs">For {r.functions.map((f) => fnOf(f).label).join(", ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {conn ? (
            <section className="rounded-xl border p-4">
              <h2 className="font-semibold">Disconnect</h2>
              <p className="text-muted-foreground mt-1 text-sm">Reflect forgets your sign-in. Every business you own loses it, not only {ctx.name}.</p>
              <form action={disconnectIntegration.bind(null, slug, id, conn.id)} className="mt-3"><Button variant="destructive" size="sm" type="submit">Disconnect {c.name}</Button></form>
            </section>
          ) : null}
        </div>
        <aside className="divide-y text-sm">
          {conn ? <Fact label="Connected">{day(conn.connectedAt)}</Fact> : null}
          <Fact label="Categories">
            <div className="flex flex-wrap gap-1">{cats.map((k) => <Link key={k.id} href={ventureHref(slug, `integrations/category/${k.id}`)}><Badge variant="outline" className="font-normal hover:underline">{k.name}</Badge></Link>)}</div>
          </Fact>
          <Fact label="Functions it serves">{fns.map((f) => fnOf(f).label).join(", ")}</Fact>
          <Fact label="Sign in">With your own {c.by} account</Fact>
          <Fact label="Made by">{c.by}</Fact>
          <Fact label="Resources"><a href={c.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">Documentation<ExternalLinkIcon className="size-3" /></a></Fact>
        </aside>
      </div>
    </div>
  );
}
