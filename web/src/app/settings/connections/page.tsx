import type { Metadata } from "next";
import { GlobeIcon, PuzzleIcon, StoreIcon } from "lucide-react";
import { CONNECTORS, GROUPS, GROUP_LABEL, PUBLIC_SOURCES } from "@reflect/core/connectors";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { COLUMN, Group, Row } from "@/components/list-rows";
import { AssistantRow, ConnectorRow } from "@/components/connector-rows";
import { auth } from "@/server/auth";
import { connectedAssistants } from "@/server/connected-assistants";
import { connections } from "@/server/connections-store";
import { mcpResource } from "@/server/site";
import { disconnectAssistantAction } from "./actions";
import { requireUser } from "@/server/session";
import { connectionsOf } from "@/server/mcp-connections";
import { pluginsOf } from "@/server/plugins";
import { Mark } from "@/app/marketplace/parts";

export const metadata: Metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

/**
 * Settings, Connections (design guide "Connections interface", Page 1): what you have connected first, then what you
 * could connect, grouped as the tiles are, then the assistants connected to Reflect over MCP (Ask Reflect plan, step 11),
 * each with Disconnect, then the public data Reflect reads, folded into one row.
 */
export default async function ConnectionsPage() {
  const user = await requireUser();
  const [states, assistants, market, plugins] = await Promise.all([connections(user.id), connectedAssistants(auth, user.id), connectionsOf(user.id).catch(() => []), pluginsOf(user.id).catch(() => [])]);
  const linked = market.filter((m) => m.status === "connected");
  const of = new Map(states.map((s) => [s.id, s]));
  const connected = CONNECTORS.filter((c) => of.get(c.id)?.state === "connected");
  // Within a group, what can be connected comes before what cannot.
  const rank = (id: string) => (of.get(id)?.state === "not-connected" ? 0 : 1);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings" backLabel="Settings" crumbs={[{ label: "Settings", href: "/settings" }]} title="Connections" />
      <div className={COLUMN}>
        <h1 id="page-title" className="text-center text-xl font-semibold tracking-tight">Connections</h1>
        <Group title="Your accounts" id="yours">
          {connected.length ? connected.map((c) => <ConnectorRow key={c.id} c={c} s={of.get(c.id)} />) : <li className="text-muted-foreground px-4 py-4 text-sm">Nothing connected yet. Connect here or from a tile.</li>}
        </Group>
        <Group title="From the marketplace" id="market">
          {linked.map((m) => <Row key={m.id} href={`/marketplace/${encodeURIComponent(m.connector)}`} icon={<Mark id={m.connector} name={m.name} size="size-6 text-[11px]" />} label={m.name} value="Connected" />)}
          <Row href="/marketplace?tab=plugins" icon={<PuzzleIcon />} label="Plugins" value={plugins.length ? `${plugins.length} added` : undefined} sub={plugins.length ? undefined : "Skills for Ask Reflect"} />
          <Row href="/marketplace" icon={<StoreIcon />} label="Browse the marketplace" sub="GitHub, Vercel, Resend, Gmail and more" />
        </Group>
        {GROUPS.map((g) => {
          const rest = CONNECTORS.filter((c) => c.group === g && of.get(c.id)?.state !== "connected").sort((a, b) => rank(a.id) - rank(b.id));
          return rest.length ? (
            <Group key={g} title={GROUP_LABEL[g]} id={`g-${g}`}>
              {rest.map((c) => <ConnectorRow key={c.id} c={c} s={of.get(c.id)} />)}
            </Group>
          ) : null;
        })}
        <Group title="Assistants" id="assistants">
          {assistants.length ? (
            assistants.map((a) => <AssistantRow key={a.clientId} name={a.name} since={a.since} disconnect={disconnectAssistantAction.bind(null, a.clientId)} />)
          ) : (
            <li className="text-muted-foreground px-4 py-4 text-sm">No assistants connected. To use Reflect from Claude or ChatGPT, add {mcpResource()} as a custom connector there.</li>
          )}
        </Group>
        <Group title="Public data" id="public">
          <Row href="/settings/connections/public" icon={<GlobeIcon />} label={`${PUBLIC_SOURCES.length} sources Reflect reads`} sub="Read for everyone, nothing to connect" />
        </Group>
      </div>
    </main>
  );
}
