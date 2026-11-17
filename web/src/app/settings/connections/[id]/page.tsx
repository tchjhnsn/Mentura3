import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, LayoutGridIcon, PencilIcon, ShoppingCartIcon, XIcon } from "lucide-react";
import { connectorOf, stateWord, tileHref, tileLabel } from "@reflect/core/connectors";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ActionRow, COLUMN, Group, InfoRow, Initials, Row } from "@/components/list-rows";
import { connections } from "@/server/connections-store";
import { placeRecord } from "@/server/public-data";
import { requireUser } from "@/server/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = connectorOf((await params).id);
  return { title: c ? c.name : "Connections" };
}

/** Where Connect goes for a connector Reflect can connect today. */
const CONNECT: Record<string, string> = { place: "/settings/place" };

/**
 * One connector (design guide "Connections interface", Page 2): its name and state first, then the one filled button
 * (Connect) or the plain reason it cannot be connected, then what Reflect reads, what it never does, and the tiles
 * that use it.
 */
export default async function ConnectorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const c = connectorOf((await params).id);
  if (!c) notFound();
  const s = (await connections(user.id)).find((x) => x.id === c.id);
  const state = s?.state ?? "not-connected";
  const connected = state === "connected";
  const place = c.id === "place" && connected ? await placeRecord(user.id) : null;
  const connect = CONNECT[c.id];
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/connections" backLabel="Connections" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Connections", href: "/settings/connections" }]} title={c.name} />
      <div className={COLUMN}>
        <div className="grid justify-items-center gap-3 text-center">
          <Initials name={c.by.split(" ")[0]!} size="size-16 text-xl" />
          <div className="grid gap-1">
            <h1 id="page-title" className="text-2xl font-semibold tracking-tight">{c.name}</h1>
            <p className="text-muted-foreground text-sm">{c.by}</p>
          </div>
          <p className="flex items-center gap-2 text-sm">
            {connected ? <span aria-hidden="true" className="size-2 rounded-full bg-green-600" /> : null}
            <span className={connected ? "" : "text-muted-foreground"}>{connected ? stateWord(c, state) : state === "not-connected" ? "Not connected" : stateWord(c, state)}</span>
          </p>
        </div>

        {state === "not-connected" && connect ? <Button asChild size="lg" className="w-full"><Link href={connect}>Connect</Link></Button> : null}
        {state === "unavailable" ? (
          <p className="bg-muted/50 rounded-2xl border px-4 py-3 text-center text-sm">
            {c.id === "instacart" ? "Reflect cannot send lists to Instacart yet. It needs Instacart's key." : c.why}
            {c.source ? <> <a href={c.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{c.source.name}</a></> : null}
          </p>
        ) : null}

        {place ? (
          <Group title="What it holds" id="holds">
            <InfoRow label="County" value={`${place.county}, ${place.state}`} />
            <InfoRow label="Water system" value={place.water ?? "Not chosen"} />
            <ActionRow icon={<PencilIcon />} label="Change where you live" href="/settings/place" />
          </Group>
        ) : null}
        {c.id === "instacart" && connected ? (
          <Group title="Use it" id="use">
            <ActionRow icon={<ShoppingCartIcon />} label="Open this week's shopping list" href="/meals/list" />
          </Group>
        ) : null}

        <Group title="What Reflect reads" id="reads">
          {c.reads.map((r) => <li key={r} className="flex items-start gap-4 px-4 py-3 text-sm"><CheckIcon aria-hidden="true" className="text-muted-foreground mt-0.5 size-4 shrink-0" /><span>{r}</span></li>)}
        </Group>
        {c.never.length ? (
          <Group title="What Reflect never does" id="never">
            {c.never.map((r) => <li key={r} className="flex items-start gap-4 px-4 py-3 text-sm"><XIcon aria-hidden="true" className="text-muted-foreground mt-0.5 size-4 shrink-0" /><span>{r}</span></li>)}
          </Group>
        ) : null}
        <Group title="Used by" id="used">
          {c.tiles.map((t) => <Row key={t} href={tileHref(t)} icon={<LayoutGridIcon />} label={tileLabel(t)} />)}
        </Group>
      </div>
    </main>
  );
}
