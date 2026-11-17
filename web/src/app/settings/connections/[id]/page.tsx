import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarIcon, CheckIcon, LayoutGridIcon, PencilIcon, PlusIcon, ShoppingCartIcon, Trash2Icon, UnplugIcon, XIcon } from "lucide-react";
import { tileLabel as calTileLabel } from "@reflect/core/calendar";
import { connectorOf, stateWord, tileHref, tileLabel } from "@reflect/core/connectors";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ActionRow, COLUMN, Group, InfoRow, Initials, Row } from "@/components/list-rows";
import { feeds } from "@/server/calendar-feeds";
import { connections } from "@/server/connections-store";
import { googleState } from "@/server/google-calendar";
import { microsoftState } from "@/server/microsoft-calendar";
import { placeRecord } from "@/server/public-data";
import { requireUser } from "@/server/session";
import { disconnectGoogleAction, disconnectMicrosoftAction, removeFeedAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = connectorOf((await params).id);
  return { title: c ? c.name : "Connections" };
}

/** Where Connect goes for a connector Reflect can connect today. */
const CONNECT: Record<string, string> = { place: "/settings/place", calendars: "/settings/connections/calendars/add", "google-calendar": "/api/connect/google/start", "microsoft-calendar": "/api/connect/microsoft/start" };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * One connector (design guide "Connections interface", Page 2): its name and state first, then the one filled button
 * (Connect) or the plain reason it cannot be connected, then what Reflect reads, what it never does, and the tiles
 * that use it.
 */
export default async function ConnectorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const error = one((await searchParams).error).slice(0, 200);
  const c = connectorOf((await params).id);
  if (!c) notFound();
  const s = (await connections(user.id)).find((x) => x.id === c.id);
  const state = s?.state ?? "not-connected";
  const connected = state === "connected";
  const place = c.id === "place" && connected ? await placeRecord(user.id) : null;
  const connect = CONNECT[c.id];
  const subscribed = c.id === "calendars" && connected ? await feeds(user.id) : [];
  // A calendar connected two-way (Google, Outlook): which calendar it syncs, when, its last error, and how to disconnect.
  const twoWay = !connected ? null
    : c.id === "google-calendar" ? { state: googleState(user.id), calendar: "Primary", disconnect: disconnectGoogleAction }
    : c.id === "microsoft-calendar" ? { state: microsoftState(user.id), calendar: "Default", disconnect: disconnectMicrosoftAction }
    : null;
  const held = twoWay ? await twoWay.state : null;
  const synced = twoWay && held ? { ...held, calendar: twoWay.calendar, disconnect: twoWay.disconnect } : null;
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

        {/* Connect for Google and Outlook Calendar starts its OAuth flow at an API route, so it is a plain link, not a client-side one. */}
        {state === "not-connected" && connect ? <Button asChild size="lg" className="w-full">{connect.startsWith("/api/") ? <a href={connect}>Connect</a> : <Link href={connect}>Connect</Link>}</Button> : null}
        {error ? <p role="alert" className="text-destructive text-center text-sm">{error}</p> : null}
        {state === "unavailable" ? (
          <p className="bg-muted/50 rounded-2xl border px-4 py-3 text-center text-sm">
            {c.id === "instacart" ? "Reflect cannot send lists to Instacart yet. It needs Instacart's key." : c.setup ?? c.why}
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
        {c.id === "calendars" && connected ? (
          <Group title="Your calendars" id="calendars">
            {subscribed.map((f) => (
              <li key={f.id} className="flex min-h-14 items-center gap-4 px-4 py-3">
                <CalendarIcon aria-hidden="true" className="text-muted-foreground size-5 shrink-0" />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-base">{f.name}</span>
                  {/* The address is a secret: only its host is ever shown. */}
                  <span className={f.lastError ? "text-destructive truncate text-sm" : "text-muted-foreground truncate text-sm"}>{f.lastError ?? `${f.host}${f.tile ? ` · ${calTileLabel(f.tile)}` : ""}`}</span>
                </span>
                <form action={removeFeedAction.bind(null, f.id)}>
                  <Button type="submit" variant="ghost" size="icon" aria-label={`Remove ${f.name}`}><Trash2Icon /></Button>
                </form>
              </li>
            ))}
            <ActionRow icon={<PlusIcon />} label="Add a calendar" href="/settings/connections/calendars/add" />
            <ActionRow icon={<CalendarIcon />} label="Open the calendar" href="/calendar" />
          </Group>
        ) : null}
        {synced ? (
          <Group title="What it holds" id="holds">
            <InfoRow label="Calendar" value={synced.calendar} />
            <InfoRow label="Connected" value={new Date(synced.connectedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} />
            {synced.lastError ? <InfoRow label="Last sync" value={<span className="text-destructive">{synced.lastError}</span>} /> : null}
            <ActionRow icon={<CalendarIcon />} label="Open the calendar" href="/calendar" />
            <ActionRow icon={<UnplugIcon />} label="Disconnect" action={synced.disconnect} danger />
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
