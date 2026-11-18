import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import { USE_LABEL, marketById, marketReady, type MarketUse } from "@reflect/core/marketplace";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { connectionsOf, toolsOf } from "@/server/mcp-connections";
import { connectAction, disconnectAction } from "../actions";
import { Mark } from "../parts";

export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const USE_HREF: Record<MarketUse, string> = { "site-push": "/settings/site/export", "site-email": "/settings/site", "site-deploy": "/settings/site/export" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = marketById(decodeURIComponent((await params).id));
  return { title: c?.name ?? "Connector" };
}

/** One connector: what it lets Reflect do, Connect as the one filled act, and once connected its tools and Disconnect. */
export default async function ConnectorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const id = decodeURIComponent((await params).id);
  const sp = await searchParams;
  const cat = marketById(id);
  const mine = (await connectionsOf(user.id).catch(() => [])).find((m) => m.connector === id && m.status === "connected") ?? null;
  if (!cat && !mine) notFound();
  const name = cat?.name ?? mine!.name;
  const ready = cat ? marketReady(cat, process.env) : true;
  const back = `/marketplace/${encodeURIComponent(id)}`;
  let tools: { name: string; description?: string }[] | null = null;
  let toolsError: string | null = null;
  if (mine) {
    try {
      tools = await toolsOf(user.id, mine.id);
    } catch (e) {
      toolsError = e instanceof Error ? e.message : "Could not reach it.";
    }
  }
  const error = one(sp.error);
  return (
    <main className={PAGE}>
      <ThingHeader back="/marketplace" backLabel="Marketplace" crumbs={[{ label: "Marketplace", href: "/marketplace" }]} title={name} />
      <div className="mx-auto mt-6 grid w-full max-w-2xl gap-8 pb-16">
        <section className="flex flex-wrap items-start gap-4">
          <Mark id={id} name={name} size="size-16 text-2xl" />
          <div className="grid min-w-0 flex-1 gap-1">
            <h1 id="page-title" className="text-3xl font-bold tracking-tight">{name}</h1>
            <p className="text-muted-foreground text-sm">{cat ? `By ${cat.by}` : mine!.serverUrl}</p>
            {cat ? <p className="mt-1">{cat.line}</p> : null}
          </div>
          <div className="grid w-full gap-2 sm:w-auto">
            {mine ? (
              <>
                <span className="text-primary inline-flex items-center gap-1.5 text-sm font-medium"><CheckIcon className="size-4" />Connected</span>
                <form action={disconnectAction.bind(null, mine.id, back)}><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground px-0">Disconnect</Button></form>
              </>
            ) : ready ? (
              <form action={connectAction.bind(null, id)}><Button type="submit" size="lg" className="w-full sm:w-auto">Connect</Button></form>
            ) : (
              <Button size="lg" disabled className="w-full sm:w-auto">Needs setup</Button>
            )}
          </div>
        </section>

        {one(sp.connected) ? <p className="bg-muted rounded-xl px-4 py-3 text-sm" role="status">{name} is connected. Reflect acts as you there only when you ask.</p> : null}
        {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
        {cat && !ready ? (
          <p className="bg-muted/50 rounded-xl border px-4 py-3 text-sm">{cat.by} asks apps to register with it once before people can sign in. This Reflect has not yet ({cat.clientEnv?.join(" and ")}).</p>
        ) : null}

        {cat ? (
          <section className="grid gap-2">
            <h2 className="text-lg font-semibold">What Reflect does with it</h2>
            <ul className="grid list-disc gap-1 pl-5">{cat.does.map((d) => <li key={d}>{d}</li>)}</ul>
          </section>
        ) : null}

        {cat?.uses?.length ? (
          <section className="grid gap-2">
            <h2 className="text-lg font-semibold">Used in Reflect</h2>
            <ul className="grid gap-1">{cat.uses.map((u) => <li key={u}><Link href={USE_HREF[u]} className="hover:underline">{USE_LABEL[u]}</Link></li>)}</ul>
          </section>
        ) : null}

        {mine ? (
          <section className="grid gap-2">
            <h2 className="text-lg font-semibold">Tools</h2>
            {tools ? (
              tools.length ? (
                <ul className="divide-y rounded-2xl border">
                  {tools.slice(0, 60).map((t) => (
                    <li key={t.name} className="grid gap-0.5 px-4 py-2.5">
                      <code className="text-sm">{t.name}</code>
                      {t.description ? <span className="text-muted-foreground line-clamp-2 text-sm">{t.description}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">It offers no tools.</p>
            ) : <p className="text-muted-foreground text-sm">{toolsError}</p>}
            <p className="text-muted-foreground text-xs">Ask Reflect can read with these when you ask, and waits for your Send before anything that changes something.</p>
          </section>
        ) : null}

        <footer className="text-muted-foreground grid gap-2 border-t pt-4 text-xs">
          <p>Your sign-in is kept sealed with your key. Reflect never sees your password. Disconnect any time.</p>
          {cat ? <a href={cat.docs} target="_blank" rel="noreferrer" className="hover:text-foreground inline-flex items-center gap-1">{cat.by}&apos;s page about it <ExternalLinkIcon className="size-3" /></a> : null}
        </footer>
      </div>
    </main>
  );
}
