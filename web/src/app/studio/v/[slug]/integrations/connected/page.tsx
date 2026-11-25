// V25 Connected: every account the person has connected, with the categories each fills, and sign-ins left unfinished.
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/marketplace/logos";
import { ScreenHead } from "@/components/studio/shell";
import { ventureHref } from "@/components/studio/data";
import { categoriesOf } from "@/components/studio/integrations";
import { connectIntegration } from "../actions";
import { integrationsContext, usableBy } from "../context";

export const dynamic = "force-dynamic";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default async function ConnectedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await integrationsContext(slug);
  return (
    <div className="pb-16">
      <ScreenHead n="V25" title="Connected" job="Accounts you have signed in to, and which of your businesses use each.">
        <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "integrations")}>Browse integrations</Link></Button>
      </ScreenHead>
      <div className="max-w-3xl px-4 md:px-8">
        {ctx.connections.length ? (
          <ul className="divide-y rounded-xl border">
            {ctx.connections.map((c) => {
              const inCatalog = !!c.catalog;
              const href = inCatalog ? ventureHref(slug, `integrations/${encodeURIComponent(c.connector)}`) : "/marketplace";
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Logo id={c.connector} name={c.name} size="size-9" glyph="size-5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {c.name}{c.account ? <span className="text-muted-foreground font-normal">{c.account}</span> : null}
                      {c.status === "pending" ? <Badge variant="outline" className="font-normal">Sign-in not finished</Badge> : null}
                      {c.status === "expired" ? <Badge variant="destructive" className="font-normal">Needs reconnect</Badge> : null}
                      {c.status === "connected" && !usableBy(c, ctx.id) ? <Badge variant="outline" className="font-normal">Not used by {ctx.name}</Badge> : null}
                      {c.status === "connected" && c.businesses !== null && usableBy(c, ctx.id) ? <Badge variant="outline" className="font-normal">{c.businesses.length === 1 ? "Only this business" : `${c.businesses.length} businesses`}</Badge> : null}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {[...categoriesOf(c.connector).map((k) => k.name), inCatalog ? null : "Your own server", c.connectedAt ? `Connected ${day(c.connectedAt)}` : null].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {c.status === "pending" && inCatalog ? (
                    <form action={connectIntegration.bind(null, slug, c.connector)}><input type="hidden" name="account" value={c.account ?? ""} /><Button size="sm" type="submit">Finish</Button></form>
                  ) : c.status === "expired" && inCatalog ? (
                    <form action={connectIntegration.bind(null, slug, c.connector)}><input type="hidden" name="account" value={c.account ?? ""} /><Button size="sm" type="submit">Reconnect</Button></form>
                  ) : (
                    <Button variant="outline" size="sm" asChild><Link href={href}>Manage</Link></Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium">Nothing connected yet</p>
            <p className="text-muted-foreground mt-1 text-sm">Start with what {ctx.name} needs.</p>
            <Button size="sm" className="mt-3" asChild><Link href={ventureHref(slug, "integrations")}>See recommendations</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
