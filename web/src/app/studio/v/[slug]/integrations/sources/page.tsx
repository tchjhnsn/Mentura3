// V27 Sources of truth: for each kind of record, where this business keeps it, Reflect or a connected service
// (spec "Integrations: formal specification", Sources of truth design, F4, M4), after Lindy's Connections table.
// It reads the business's source map in Naive and the person's connections, and a person chooses a source here:
// a connected service that Reflect can read the kind from, or Use Reflect (chooseSource, M4).
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenHead } from "@/components/studio/shell";
import { isSample, ventureHref } from "@/components/studio/data";
import { studioUnavailable } from "@/server/naive";
import { integrationOf } from "@/components/studio/integrations";
import { M4, failureAction } from "@/components/studio/integrations-machines";
import { sourcesOf, type KindSource } from "@/components/studio/integrations-sources";
import { chooseSource } from "../actions";
import { integrationsContext, sourceMapOf } from "../context";

export const dynamic = "force-dynamic";

const nameOf = (service: string | null) => (service ? integrationOf(service)?.name ?? service : "a service");

function Status({ s }: { s: KindSource }) {
  if (s.state === "outside") return <Badge variant="secondary" className="font-normal">From {nameOf(s.service)}</Badge>;
  if (s.state === "unreachable") return <Badge variant="destructive" className="font-normal">Unreachable</Badge>;
  return <Badge variant="outline" className="font-normal">In Reflect</Badge>;
}

export default async function SourcesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error: refused } = await searchParams;
  const [ctx, { map, error }] = await Promise.all([integrationsContext(slug), sourceMapOf(slug)]);
  const kinds = sourcesOf(map, ctx.connections, ctx.id);
  // A sample, or a site with no venture store, has no source map to write, so it offers no choice.
  const canChoose = !isSample(slug) && !studioUnavailable();
  const accountOf = (id: string) => ctx.connections.find((c) => c.id === id)?.account ?? null;
  return (
    <div className="pb-16">
      <ScreenHead n="V27" title="Sources of truth" job={`Where ${ctx.name} keeps each kind of record: in Reflect, or in a service you connected.`}>
        <Button variant="outline" size="sm" asChild><Link href={ventureHref(slug, "integrations/connected")}>Connected</Link></Button>
      </ScreenHead>
      <div className="max-w-4xl space-y-3 px-4 md:px-8">
        <p className="text-muted-foreground text-sm">Choosing a service moves and copies nothing: Reflect reads that kind of record from the service from then on. If it loses access, it says so here and never quietly falls back to its own copy.</p>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {refused ? <p className="text-destructive text-sm" role="alert">{refused}</p> : null}
        <ul className="divide-y rounded-xl border">
          {kinds.map((s) => {
            const ready = s.candidates.filter((c) => c.adapter);
            const waiting = s.candidates.filter((c) => !c.adapter);
            return (
              <li key={s.kind.type} className="flex flex-wrap items-start gap-3 px-4 py-3" data-machine-state={`M4:${s.state}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">{s.kind.name}<Status s={s} /></div>
                  <p className="text-muted-foreground text-sm">{s.kind.line}</p>
                  {s.state === "unreachable" ? (
                    <p className="text-destructive mt-1 text-sm">Reflect cannot reach {nameOf(s.service)} for this. {failureAction(M4, "unreachable")} to read it again.</p>
                  ) : null}
                  {ready.length ? <p className="text-muted-foreground mt-1 text-xs">Can come from {ready.map((c) => nameOf(c.connection.connector)).join(", ")}.</p> : null}
                  {waiting.length ? <p className="text-muted-foreground mt-1 text-xs">Reflect cannot read {s.kind.name.toLowerCase()} from {waiting.map((c) => nameOf(c.connection.connector)).join(", ")} yet.</p> : null}
                  {!s.candidates.length && s.state === "reflect" ? <p className="text-muted-foreground mt-1 text-xs">None of your connected services keeps {s.kind.name.toLowerCase()}.</p> : null}
                </div>
                {error || !canChoose ? null : (
                  <div className="flex flex-wrap gap-2">
                    {ready.filter((c) => !(s.state === "outside" && s.connection?.id === c.connection.id)).map((c) => {
                      const account = accountOf(c.connection.id);
                      return (
                        <form key={c.connection.id} action={chooseSource.bind(null, slug, s.kind.type)}>
                          <input type="hidden" name="connection" value={c.connection.id} />
                          <Button type="submit" size="sm" variant="outline">Use {nameOf(c.connection.connector)}{account ? ` (${account})` : ""}</Button>
                        </form>
                      );
                    })}
                    {s.state === "reflect" ? null : (
                      <form action={chooseSource.bind(null, slug, s.kind.type)}>
                        <input type="hidden" name="connection" value="" />
                        <Button type="submit" size="sm" variant={s.state === "unreachable" ? "default" : "outline"}>Use Reflect</Button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
