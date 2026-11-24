"use client";

// V14 Connectors: connect the venture's accounts and see what each agent may touch (Plane AI and OpenAI connector anatomy).
import { use, useMemo, useState } from "react";
import { PlusIcon, SearchIcon, ServerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Num } from "@/components/studio/bits";
import { ScreenHead } from "@/components/studio/shell";
import { ConnectConsent, ConnectorRow, ConnectorTile } from "@/components/studio/connector-row";
import { AGENTS, agentOf, ventureOf } from "@/components/studio/data";
import { CONNECTORS, CONNECTOR_CATEGORIES, type Connector, type ConnectorCategory, type Scopes } from "@/components/studio/connect-data";

type Perm = keyof Scopes;
const PERMS: Perm[] = ["read", "write", "send"];
const key = (agent: string, conn: string) => `${agent}:${conn}`;

export default function ConnectorsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const v = ventureOf(slug);
  const [list, setList] = useState<Connector[]>(CONNECTORS);
  const [connected, setConnected] = useState<Record<string, boolean>>(() => Object.fromEntries(CONNECTORS.map((c) => [c.id, c.connected])));
  const [tab, setTab] = useState<"connected" | "available">("connected");
  const [cat, setCat] = useState<ConnectorCategory | "All">("All");
  const [q, setQ] = useState("");
  const [perms, setPerms] = useState<Record<string, Scopes>>(() => {
    const out: Record<string, Scopes> = {};
    for (const c of CONNECTORS) for (const a of c.agents) out[key(a, c.id)] = { read: c.scopes.read, write: c.scopes.write, send: c.scopes.send };
    return out;
  });
  const [mcpOpen, setMcpOpen] = useState(false);
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpName, setMcpName] = useState("");
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectPick, setConnectPick] = useState<Connector | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const setOne = (id: string, val: boolean) => setConnected((s) => ({ ...s, [id]: val }));
  const shown = useMemo(() => list.filter((c) => (tab === "connected" ? connected[c.id] : !connected[c.id]) && (cat === "All" || c.category === cat) && (!q || `${c.name} ${c.does}`.toLowerCase().includes(q.toLowerCase()))), [list, connected, tab, cat, q]);
  const live = list.filter((c) => connected[c.id]);
  const available = list.filter((c) => !connected[c.id]);
  const nConnected = live.length;

  const flip = (agent: string, conn: string, p: Perm) => setPerms((s) => {
    const cur = s[key(agent, conn)] ?? { read: false, write: false, send: false };
    return { ...s, [key(agent, conn)]: { ...cur, [p]: !cur[p] } };
  });

  const addMcp = () => {
    const name = mcpName.trim() || (() => { try { return new URL(mcpUrl).hostname; } catch { return "Custom server"; } })();
    const id = `mcp-${list.length}`;
    const c: Connector = { id, name, category: "Code", hue: 90, connected: true, account: mcpUrl, does: `Custom MCP server. Agents call the tools it lists.`, agents: ["chief-of-staff"], scopes: { read: true, write: false, send: false }, offers: { read: true, write: true, send: false }, fns: ["it"] };
    setList((l) => [...l, c]);
    setOne(id, true);
    setPerms((s) => ({ ...s, [key("chief-of-staff", id)]: { read: true, write: false, send: false } }));
    setTab("connected");
    setNote(`${name} is added. It lists its tools to the chief of staff with read access only until you widen it.`);
    setMcpOpen(false); setMcpUrl(""); setMcpName("");
  };

  return (
    <div className="pb-16">
      <ScreenHead n="V14" title="Connectors" job={`Connect ${v.name}'s accounts and see what each agent may touch.`}>
        <Button variant="outline" onClick={() => setMcpOpen(true)}><ServerIcon /><span className="hidden sm:inline">Add a custom connector</span><span className="sm:hidden">MCP</span></Button>
        <Button onClick={() => { setConnectPick(null); setConnectOpen(true); }}><PlusIcon />Connect an account</Button>
      </ScreenHead>

      <div className="space-y-6 px-4 md:px-8">
        {note ? <p className="rounded-lg border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm">{note}</p> : null}

        <section className="relative space-y-3">
          <Num n="V14.1" className="absolute -top-2 right-0" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(t) => setTab(t as typeof tab)}>
              <TabsList>
                <TabsTrigger value="connected">Connected <span className="text-muted-foreground ml-1 tabular-nums">{nConnected}</span></TabsTrigger>
                <TabsTrigger value="available">Available <span className="text-muted-foreground ml-1 tabular-nums">{list.length - nConnected}</span></TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative sm:w-64">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search connectors" className="pl-8" aria-label="Search connectors" />
            </div>
          </div>
          <div className="relative flex flex-wrap gap-1.5">
            <Num n="V14.2" className="absolute -top-2 -left-1" />
            {(["All", ...CONNECTOR_CATEGORIES] as const).map((k) => (
              <button key={k} type="button" onClick={() => setCat(k)} aria-pressed={cat === k}
                className={cn("rounded-md border px-2 py-1 text-xs", cat === k ? "border-foreground/40 bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50")}>{k}</button>
            ))}
          </div>
        </section>

        <section className="relative">
          <Num n="V14.3" className="absolute -top-2 left-2 z-10" />
          {shown.length ? (
            <div className="divide-y rounded-lg border">
              {shown.map((c) => <ConnectorRow key={c.id} c={c} connected={connected[c.id]} onConnectedChange={(val) => setOne(c.id, val)} />)}
            </div>
          ) : (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              {q ? `Nothing matches "${q}".` : tab === "connected" ? "No accounts connected in this category yet." : "Everything in this category is connected."}
            </div>
          )}
        </section>

        <section className="relative">
          <Num n="V14.4" className="absolute -top-2 right-0" />
          <h2 className="text-sm font-semibold">What each agent may touch</h2>
          <p className="text-muted-foreground mb-3 text-xs">Read sees, write drafts and changes, send sends. Every send is still held for your yes.</p>

          <div className="hidden overflow-x-auto rounded-lg border lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="bg-background sticky left-0 p-2 text-left text-xs font-medium">Agent</th>
                  {live.map((c) => (
                    <th key={c.id} className="p-2 text-left text-xs font-medium"><span className="flex items-center gap-1.5"><ConnectorTile c={c} size={18} />{c.name}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {AGENTS.map((a) => (
                  <tr key={a.id}>
                    <td className="bg-background sticky left-0 p-2 text-xs font-medium whitespace-nowrap">{a.name}</td>
                    {live.map((c) => {
                      const p = perms[key(a.id, c.id)];
                      return (
                        <td key={c.id} className="p-2">
                          <span className="inline-flex gap-0.5">
                            {PERMS.filter((k) => c.offers[k]).map((k) => (
                              <button key={k} type="button" onClick={() => flip(a.id, c.id, k)} aria-pressed={!!p?.[k]} title={`${a.name} may ${k} in ${c.name}`}
                                className={cn("size-6 rounded border text-[10px] font-semibold uppercase", p?.[k] ? "bg-foreground text-background border-foreground" : "text-muted-foreground/60 hover:bg-accent")}>{k[0]}</button>
                            ))}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y rounded-lg border lg:hidden">
            {AGENTS.map((a) => {
              const grants = live.map((c) => ({ c, p: perms[key(a.id, c.id)] })).filter((g) => g.p && (g.p.read || g.p.write || g.p.send));
              return (
                <li key={a.id} className="p-3">
                  <div className="text-sm font-medium">{a.name}</div>
                  {grants.length ? (
                    <ul className="mt-1.5 space-y-1">
                      {grants.map(({ c, p }) => (
                        <li key={c.id} className="flex items-center gap-2 text-xs">
                          <ConnectorTile c={c} size={18} />
                          <span className="min-w-0 flex-1 truncate">{c.name}</span>
                          <span className="inline-flex gap-0.5">
                            {PERMS.filter((k) => c.offers[k]).map((k) => (
                              <button key={k} type="button" onClick={() => flip(a.id, c.id, k)} aria-pressed={!!p?.[k]} aria-label={`${a.name} may ${k} in ${c.name}`}
                                className={cn("h-6 rounded border px-1.5 text-[10px] capitalize", p?.[k] ? "bg-foreground text-background border-foreground" : "text-muted-foreground")}>{k}</button>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-muted-foreground mt-1 text-xs">No connected accounts.</p>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Dialog open={mcpOpen} onOpenChange={setMcpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a custom connector</DialogTitle>
            <DialogDescription>Point to an MCP server. Its tools show up for the agents you allow, with read access first.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm"><span>MCP server URL</span><Input value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="https://mcp.example.com/sse" /></label>
            <label className="block space-y-1 text-sm"><span>Name <span className="text-muted-foreground">(optional)</span></span><Input value={mcpName} onChange={(e) => setMcpName(e.target.value)} placeholder="Team wiki" /></label>
            <p className="text-muted-foreground text-xs">Private records never leave the business. The server only sees what an agent sends in a tool call.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMcpOpen(false)}>Cancel</Button>
            <Button onClick={addMcp} disabled={!/^https?:\/\/\S+/.test(mcpUrl)}>Add server</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent>
          {connectPick ? (
            <ConnectConsent key={connectPick.id} c={connectPick} connected={false}
              onDone={(_, agents) => { setOne(connectPick.id, true); setTab("connected"); setNote(`${connectPick.name} is connected for ${agents.map((a) => agentOf(a).name).join(", ") || "no agents yet"}.`); setConnectOpen(false); }} />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Connect an account</DialogTitle>
                <DialogDescription>Pick the account. Next you choose what agents may do with it.</DialogDescription>
              </DialogHeader>
              {available.length ? (
                <ul className="max-h-[55vh] divide-y overflow-y-auto rounded-lg border">
                  {available.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => setConnectPick(c)} className="hover:bg-accent/50 flex w-full items-center gap-3 p-3 text-left">
                        <ConnectorTile c={c} size={28} />
                        <span className="min-w-0"><span className="block text-sm font-medium">{c.name}</span><span className="text-muted-foreground block text-xs">{c.category}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Every account is connected.</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
