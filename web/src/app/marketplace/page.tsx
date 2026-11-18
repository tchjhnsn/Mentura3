import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheckIcon, CheckIcon, ChevronDownIcon, GlobeIcon, PlusIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { CONNECTORS, PUBLIC_SOURCES } from "@reflect/core/connectors";
import { MARKET, MARKET_CATEGORIES, PLUGINS, marketById, marketReady, pluginReady, type MarketCategory } from "@reflect/core/marketplace";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { AssistantRow } from "@/components/connector-rows";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { requireUser } from "@/server/session";
import { connections } from "@/server/connections-store";
import { connectedAssistants } from "@/server/connected-assistants";
import { connectionsOf } from "@/server/mcp-connections";
import { pluginsOf } from "@/server/plugins";
import { skillsOf } from "@/server/skills";
import { mcpResource } from "@/server/site";
import { disconnectAssistantAction } from "../settings/connections/actions";
import { connectAction, toggleSkillAction } from "./actions";
import { Logo } from "./logos";
import { Mark } from "./parts";

export const metadata: Metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
type Tab = "connectors" | "skills" | "plugins";
type View = "yours" | "discover";

/** Built-in connections by the tile they serve, in the marketplace's categories. */
const BUILT_IN_CATEGORY: Record<string, MarketCategory> = { household: "life", ventures: "money", person: "life", polis: "data" };

/** One connector card, as either kind: a remote MCP server from the catalog or one of Reflect's built-in connections. */
type Card = { key: string; logo: string; name: string; by: string; line: string; verified: boolean; connected: boolean; href: string; category: MarketCategory; connect: "form" | "link" | "setup" | null };

/**
 * The marketplace (Torian, 2026-11-18 22:54Z: modelled on Claude's Settings, Customize): one place for every account
 * Reflect works through. Connectors, Skills and Plugins tabs; Yours (what you have) and Discover (everything);
 * search; one Add menu. A connector card shows its logo, a verified mark for a server made by the service itself,
 * what you can do with it, and a + that connects from the card.
 */
export default async function Marketplace({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab: Tab = one(sp.tab) === "plugins" ? "plugins" : one(sp.tab) === "skills" ? "skills" : "connectors";
  const view: View = one(sp.view) === "yours" ? "yours" : "discover";
  const q = one(sp.q).trim().toLowerCase();
  const cat = MARKET_CATEGORIES.some((c) => c.id === one(sp.c)) ? (one(sp.c) as MarketCategory) : null;
  const [mine, builtIn, added, skills, assistants] = await Promise.all([
    connectionsOf(user.id).catch(() => []), connections(user.id).catch(() => []), pluginsOf(user.id).catch(() => []), skillsOf(user.id).catch(() => []),
    view === "yours" && tab === "connectors" ? connectedAssistants(auth, user.id).catch(() => []) : Promise.resolve([]),
  ]);
  const connected = new Set(mine.filter((m) => m.status === "connected").map((m) => m.connector));
  const builtState = new Map(builtIn.map((s) => [s.id, s]));
  const href = (p: Record<string, string | null>) => {
    const u = new URLSearchParams();
    const next = { tab: tab === "connectors" ? null : tab, view: view === "discover" ? null : view, c: cat, q: q || null, ...p };
    for (const [k, v] of Object.entries(next)) if (v) u.set(k, v);
    const s = u.toString();
    return s ? `/marketplace?${s}` : "/marketplace";
  };

  const cards: Card[] = [
    ...MARKET.map((c): Card => ({
      key: c.id, logo: c.id, name: c.name, by: c.by, line: c.line, verified: true, connected: connected.has(c.id), href: `/marketplace/${c.id}`, category: c.category,
      connect: marketReady(c, process.env) ? "form" : "setup",
    })),
    ...CONNECTORS.filter((c) => c.availability === "built").map((c): Card => ({
      key: `builtin:${c.id}`, logo: c.id, name: c.name, by: c.by, line: c.reads[0] ?? "", verified: false, connected: builtState.get(c.id)?.state === "connected",
      href: `/settings/connections/${c.id}`, category: BUILT_IN_CATEGORY[c.group] ?? "life", connect: c.setup ? "setup" : "link",
    })),
    ...mine.filter((m) => !m.catalog && m.status === "connected").map((m): Card => ({
      key: m.connector, logo: m.connector, name: m.name, by: new URL(m.serverUrl).hostname, line: "Added by its address.", verified: false, connected: true,
      href: `/marketplace/${encodeURIComponent(m.connector)}`, category: "data", connect: null,
    })),
  ];
  const matches = (c: { name: string; by: string; line: string; category: MarketCategory }) => (!cat || c.category === cat) && (!q || `${c.name} ${c.by} ${c.line}`.toLowerCase().includes(q));
  const shownCards = cards.filter((c) => (view === "yours" ? c.connected : true) && matches(c));
  const notYet = CONNECTORS.filter((c) => c.availability !== "built");
  const plugins = PLUGINS.filter((p) => (view === "yours" ? added.some((a) => a.id === p.id) : true) && matches({ ...p, by: p.by }));
  const addedIds = new Set(added.map((p) => p.id));

  const tabLink = (t: Tab, label: string) => (
    <Link key={t} href={href({ tab: t === "connectors" ? null : t, c: null, q: null })} aria-current={tab === t ? "page" : undefined}
      className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", tab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
      {label}
    </Link>
  );
  const viewLink = (v: View, label: string) => (
    <Link key={v} href={href({ view: v === "discover" ? null : v })} aria-current={view === v ? "page" : undefined}
      className={cn("rounded-md px-3 py-1 text-sm transition", view === v ? "bg-background text-foreground border shadow-xs" : "text-muted-foreground hover:text-foreground border border-transparent")}>
      {label}
    </Link>
  );
  const chip = (id: MarketCategory | null, label: string) => (
    <Link key={id ?? "all"} href={href({ c: id })} aria-current={cat === id ? "page" : undefined}
      className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm transition", cat === id ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>
      {label}
    </Link>
  );

  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Marketplace" />
      <div className="mx-auto mt-6 grid w-full max-w-4xl gap-6 pb-16">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">Your own accounts, and skills for Ask Reflect. Reflect acts as you only for what you ask, and waits for Send before it changes anything.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Kind" className="flex gap-1">{tabLink("connectors", "Connectors")}{tabLink("skills", "Skills")}{tabLink("plugins", "Plugins")}</nav>
          {tab !== "skills" ? <nav aria-label="Show" className="bg-muted flex gap-1 rounded-lg p-1">{viewLink("yours", "Yours")}{viewLink("discover", "Discover")}</nav> : null}
          <form action="/marketplace" className="relative min-w-48 flex-1">
            {tab !== "connectors" ? <input type="hidden" name="tab" value={tab} /> : null}
            {view === "yours" ? <input type="hidden" name="view" value="yours" /> : null}
            {cat ? <input type="hidden" name="c" value={cat} /> : null}
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input name="q" defaultValue={q} placeholder="Search" aria-label={`Search ${tab}`} className="bg-card focus-visible:ring-ring/50 h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus-visible:ring-2" />
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button><PlusIcon />Add<ChevronDownIcon className="opacity-70" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href="/marketplace/add">Connector by its address</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/marketplace/skills/new">Write a skill</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {tab !== "skills" ? (
          <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {chip(null, "All")}
            {MARKET_CATEGORIES.map((c) => chip(c.id, c.label))}
          </nav>
        ) : null}

        {tab === "connectors" ? (
          <>
            <section aria-labelledby="cards" className="grid gap-3">
              <div className="flex items-baseline gap-2">
                <h2 id="cards" className="text-lg font-semibold">{view === "yours" ? "Connected" : cat ? MARKET_CATEGORIES.find((c) => c.id === cat)!.label : q ? `Results for "${q}"` : "All connectors"}</h2>
                <span className="text-muted-foreground bg-muted rounded-md px-1.5 text-xs">{shownCards.length}</span>
              </div>
              {shownCards.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {shownCards.map((c) => (
                    <li key={c.key} className="bg-card hover:bg-accent/50 relative flex gap-3 rounded-2xl border p-4 transition">
                      <Logo id={c.logo} name={c.name} />
                      <span className="grid min-w-0 flex-1 content-start gap-0.5">
                        <Link href={c.href} className="flex items-center gap-1.5 font-semibold after:absolute after:inset-0 after:rounded-2xl">
                          <span className="truncate">{c.name}</span>
                          {c.verified ? <BadgeCheckIcon className="text-muted-foreground size-4 shrink-0" aria-label={`Made by ${c.by}`} /> : null}
                        </Link>
                        <span className="text-muted-foreground line-clamp-2 text-sm">{c.line}</span>
                        <span className="text-muted-foreground text-xs">by {c.by}</span>
                      </span>
                      <span className="relative z-10 shrink-0">
                        {c.connected ? (
                          <span className="grid size-8 place-items-center rounded-lg border border-green-600/40 text-green-600" aria-label="Connected"><CheckIcon className="size-4" /></span>
                        ) : c.connect === "form" ? (
                          <form action={connectAction.bind(null, c.key)}><Button type="submit" size="icon" variant="outline" className="size-8" aria-label={`Connect ${c.name}`}><PlusIcon /></Button></form>
                        ) : c.connect === "link" ? (
                          <Button asChild size="icon" variant="outline" className="size-8"><Link href={c.href} aria-label={`Connect ${c.name}`}><PlusIcon /></Link></Button>
                        ) : c.connect === "setup" ? (
                          <span className="text-muted-foreground text-xs">Needs setup</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : view === "yours" ? (
                <p className="text-muted-foreground text-sm">Nothing connected yet. <Link href={href({ view: null })} className="text-foreground underline underline-offset-2">Discover connectors</Link>.</p>
              ) : (
                <p className="text-muted-foreground text-sm">No connector by that name. <Link href="/marketplace/add" className="text-foreground underline underline-offset-2">Add one by its address</Link>.</p>
              )}
            </section>

            {view === "yours" ? (
              <>
                <section aria-labelledby="assistants" className="grid gap-2">
                  <h2 id="assistants" className="text-lg font-semibold">Assistants using Reflect</h2>
                  <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
                    {assistants.length ? assistants.map((a) => <AssistantRow key={a.clientId} name={a.name} since={a.since} disconnect={disconnectAssistantAction.bind(null, a.clientId)} />)
                      : <li className="text-muted-foreground px-4 py-4 text-sm">None. To use Reflect from Claude or ChatGPT, add {mcpResource()} there as a custom connector.</li>}
                  </ul>
                </section>
                <Link href="/settings/connections/public" className="bg-card hover:bg-accent flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                  <GlobeIcon className="text-muted-foreground size-5" /><span className="grid flex-1"><span>{PUBLIC_SOURCES.length} public sources Reflect reads</span><span className="text-muted-foreground">Read for everyone, nothing to connect</span></span>
                </Link>
              </>
            ) : !q && !cat ? (
              <details className="group">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Not available yet ({notYet.length})</summary>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {notYet.map((c) => (
                    <li key={c.id}><Link href={`/settings/connections/${c.id}`} className="hover:bg-accent flex items-center gap-3 rounded-xl border px-3 py-2 text-sm"><Logo id={c.id} name={c.by} size="size-8" glyph="size-5" /><span className="grid"><span>{c.name}</span><span className="text-muted-foreground text-xs">{c.by}</span></span></Link></li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : null}

        {tab === "plugins" ? (
          <section aria-labelledby="plugins" className="grid gap-3">
            <div className="flex items-baseline gap-2">
              <h2 id="plugins" className="text-lg font-semibold">{view === "yours" ? "Added" : "All plugins"}</h2>
              <span className="text-muted-foreground bg-muted rounded-md px-1.5 text-xs">{plugins.length}</span>
            </div>
            {plugins.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {plugins.map((p) => {
                  const works = pluginReady(p, connected).works;
                  return (
                    <li key={p.id} className="bg-card hover:bg-accent/50 relative flex gap-3 rounded-2xl border p-4 transition">
                      <Mark id={`plugin:${p.id}`} name={p.name} />
                      <span className="grid min-w-0 flex-1 content-start gap-0.5">
                        <Link href={`/marketplace/plugins/${p.id}`} className="font-semibold after:absolute after:inset-0 after:rounded-2xl">{p.name}</Link>
                        <span className="text-muted-foreground line-clamp-2 text-sm">{p.line}</span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          {p.connectors.map((c) => <Logo key={c} id={c} name={marketById(c)?.name ?? c} size="size-4 rounded" glyph="size-3" />)}
                          <span className="ml-1">{works ? "Ready" : `Uses ${p.connectors.map((c) => marketById(c)?.name ?? c).join(" or ")}`}</span>
                        </span>
                      </span>
                      {addedIds.has(p.id) ? <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-green-600/40 text-green-600" aria-label="Added"><CheckIcon className="size-4" /></span> : null}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-muted-foreground text-sm">{view === "yours" ? <>No plugins added. <Link href={href({ view: null })} className="text-foreground underline underline-offset-2">Discover plugins</Link>.</> : "No plugin by that name."}</p>}
          </section>
        ) : null}

        {tab === "skills" ? (
          <>
            <section aria-labelledby="your-skills" className="grid gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 id="your-skills" className="text-lg font-semibold">Your skills</h2>
                <Button asChild variant="outline" size="sm"><Link href="/marketplace/skills/new"><PlusIcon />Write a skill</Link></Button>
              </div>
              {skills.filter((s) => !q || `${s.name} ${s.description}`.toLowerCase().includes(q)).length ? (
                <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
                  {skills.filter((s) => !q || `${s.name} ${s.description}`.toLowerCase().includes(q)).map((s) => (
                    <li key={s.id} className="hover:bg-accent/50 relative flex items-center gap-3 px-4 py-3">
                      <SparklesIcon className="text-muted-foreground size-5 shrink-0" />
                      <span className="grid min-w-0 flex-1">
                        <Link href={`/marketplace/skills/${s.id}`} className="truncate font-medium after:absolute after:inset-0">{s.name}</Link>
                        <span className="text-muted-foreground truncate text-sm">{s.description}</span>
                      </span>
                      <form action={toggleSkillAction.bind(null, s.id, !s.enabled)} className="relative z-10">
                        <button type="submit" role="switch" aria-checked={s.enabled} aria-label={`${s.name} on`} className={cn("inline-flex h-6 w-10 items-center rounded-full border p-0.5 transition", s.enabled ? "bg-primary justify-end" : "bg-muted")}>
                          <span className="bg-background size-4 rounded-full shadow" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">{q ? "No skill by that name." : "A skill tells Ask Reflect how you want something done: how you plan a week, the voice you write in, what to check before a decision. Write one and it is followed whenever it fits."}</p>
              )}
            </section>
            {added.length ? (
              <section aria-labelledby="plugin-skills" className="grid gap-3">
                <h2 id="plugin-skills" className="text-lg font-semibold">From your plugins</h2>
                <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
                  {added.map((p) => (
                    <li key={p.id}><Link href={`/marketplace/plugins/${p.id}`} className="hover:bg-accent flex items-center gap-3 px-4 py-3"><Mark id={`plugin:${p.id}`} name={p.name} size="size-6 text-[11px]" /><span className="grid min-w-0 flex-1"><span className="font-medium">{p.name}</span><span className="text-muted-foreground line-clamp-1 text-sm">{p.skill}</span></span></Link></li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
