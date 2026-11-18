import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, PlusIcon, SearchIcon } from "lucide-react";
import { MARKET, MARKET_CATEGORIES, marketReady, type MarketCategory } from "@reflect/core/marketplace";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { connectionsOf } from "@/server/mcp-connections";
import { Mark } from "./parts";

export const metadata: Metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * The marketplace (2026-11-18), laid out like the connector directories in Claude and ChatGPT: what you have connected
 * first, then every connector as a card with its mark, name, maker and one line, filtered by category or by name.
 * Each card opens the connector's page, where Connect is the one filled act. Any other MCP server can be added by its
 * address.
 */
export default async function Marketplace({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim().toLowerCase();
  const cat = MARKET_CATEGORIES.some((c) => c.id === one(sp.c)) ? (one(sp.c) as MarketCategory) : null;
  const mine = await connectionsOf(user.id).catch(() => []);
  const connected = new Set(mine.filter((m) => m.status === "connected").map((m) => m.connector));
  const shown = MARKET.filter((c) => (!cat || c.category === cat) && (!q || `${c.name} ${c.by} ${c.line}`.toLowerCase().includes(q)));
  const custom = mine.filter((m) => !m.catalog && m.status === "connected");
  const chip = (id: MarketCategory | null, label: string) => (
    <Link key={id ?? "all"} href={id ? `/marketplace?c=${id}` : "/marketplace"} aria-current={cat === id ? "page" : undefined}
      className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm transition", cat === id ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>
      {label}
    </Link>
  );
  return (
    <main className={PAGE}>
      <ThingHeader back="/settings/connections" backLabel="Connections" crumbs={[{ label: "Connections", href: "/settings/connections" }]} title="Marketplace"
        action={<Button asChild size="sm" variant="outline"><Link href="/marketplace/add"><PlusIcon />Add by address</Link></Button>} />
      <div className="mx-auto mt-6 grid w-full max-w-5xl gap-8 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-1">
            <h1 id="page-title" className="text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="text-muted-foreground max-w-xl">Connect your own accounts. Reflect acts as you in them, only for what you ask.</p>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex"><Link href="/marketplace/add"><PlusIcon />Add by address</Link></Button>
        </div>

        <form action="/marketplace" className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          {cat ? <input type="hidden" name="c" value={cat} /> : null}
          <input name="q" defaultValue={q} placeholder="Search connectors" aria-label="Search connectors" className="bg-card focus-visible:ring-ring/50 h-11 w-full rounded-xl border pr-3 pl-9 outline-none focus-visible:ring-2" />
        </form>

        <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {chip(null, "All")}
          {MARKET_CATEGORIES.map((c) => chip(c.id, c.label))}
        </nav>

        {!q && !cat && (connected.size || custom.length) ? (
          <section aria-labelledby="yours" className="grid gap-3">
            <h2 id="yours" className="text-lg font-semibold">Connected</h2>
            <ul className="flex flex-wrap gap-2">
              {MARKET.filter((c) => connected.has(c.id)).map((c) => (
                <li key={c.id}><Link href={`/marketplace/${c.id}`} className="hover:bg-accent flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm"><Mark id={c.id} name={c.name} size="size-7 text-xs" />{c.name}</Link></li>
              ))}
              {custom.map((m) => (
                <li key={m.id}><Link href={`/marketplace/${encodeURIComponent(m.connector)}`} className="hover:bg-accent flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm"><Mark id={m.connector} name={m.name} size="size-7 text-xs" />{m.name}</Link></li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="all" className="grid gap-3">
          <h2 id="all" className="text-lg font-semibold">{cat ? MARKET_CATEGORIES.find((c) => c.id === cat)!.label : q ? `Results for "${q}"` : "All connectors"}</h2>
          {shown.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => {
                const on = connected.has(c.id);
                const ready = marketReady(c, process.env);
                return (
                  <li key={c.id}>
                    <Link href={`/marketplace/${c.id}`} className="bg-card hover:bg-accent/60 flex h-full gap-3 rounded-2xl border p-4 transition">
                      <Mark id={c.id} name={c.name} />
                      <span className="grid min-w-0 flex-1 content-start gap-0.5">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-semibold">{c.name}</span>
                          {on ? <Badge variant="secondary" className="gap-1"><CheckIcon className="size-3" />Connected</Badge> : !ready ? <Badge variant="outline" className="text-muted-foreground font-normal">Needs setup</Badge> : null}
                        </span>
                        <span className="text-muted-foreground text-xs">By {c.by}</span>
                        <span className="text-muted-foreground mt-1 line-clamp-2 text-sm">{c.line}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No connector by that name. <Link href="/marketplace/add" className="text-foreground underline underline-offset-2">Add one by its address</Link>.</p>
          )}
        </section>
      </div>
    </main>
  );
}
