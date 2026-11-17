import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAL_TILES } from "@reflect/core/calendar";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLUMN, Group } from "@/components/list-rows";
import { requireUser } from "@/server/session";
import { addFeedAction } from "../../actions";

export const metadata: Metadata = { title: "Add a calendar" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const SELECT = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";

/** Where each app keeps a calendar's address in iCal format, in the app's own words. */
const WHERE = [
  { app: "Google Calendar", how: "Settings, then the calendar under Settings for my calendars, then Integrate calendar: Secret address in iCal format." },
  { app: "Apple iCloud", how: "In Calendar on iCloud.com, share the calendar as a Public Calendar and copy its link." },
  { app: "Outlook", how: "Settings, Calendar, Shared calendars, Publish a calendar: the ICS link." },
];

/**
 * Settings, Connections, Calendar subscriptions, Add: the person pastes a calendar's address in iCal format, and may
 * name it and give it a tile. Reflect fetches it once to check it is a calendar before saving. The address is never
 * shown again after it is saved.
 */
export default async function AddCalendarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  if ((await params).id !== "calendars") notFound();
  const error = one((await searchParams).error).slice(0, 200);
  return (
    <main className={PAGE}>
      <ThingHeader search={false} back="/settings/connections/calendars" backLabel="Calendar subscriptions" crumbs={[{ label: "Settings", href: "/settings" }, { label: "Connections", href: "/settings/connections" }, { label: "Calendar subscriptions", href: "/settings/connections/calendars" }]} title="Add a calendar" />
      <div className={COLUMN}>
        <div className="grid gap-1 text-center">
          <h1 id="page-title" className="text-xl font-semibold tracking-tight">Add a calendar</h1>
          <p className="text-muted-foreground text-sm">Its events show in your calendar, read-only, and stay in step with the app that keeps them.</p>
        </div>
        <Group>
          <li className="px-4 py-4">
            <form action={addFeedAction} className="grid gap-4">
              <label className="grid gap-1 text-sm font-medium">Address in iCal format
                <Input name="url" type="text" inputMode="url" autoComplete="off" spellCheck={false} required placeholder="https://… or webcal://…" />
              </label>
              <label className="grid gap-1 text-sm font-medium">Name
                <Input name="name" maxLength={100} placeholder="The calendar's own name" />
              </label>
              <label className="grid gap-1 text-sm font-medium">Tile
                <select name="tile" defaultValue="" className={SELECT}><option value="">No tile</option>{CAL_TILES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
              </label>
              {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
              <div><Button type="submit">Subscribe</Button></div>
            </form>
          </li>
        </Group>
        <Group title="Where to find the address" id="where">
          {WHERE.map((w) => (
            <li key={w.app} className="grid gap-0.5 px-4 py-3">
              <span className="text-base">{w.app}</span>
              <span className="text-muted-foreground text-sm">{w.how}</span>
            </li>
          ))}
        </Group>
        <p className="text-muted-foreground px-4 text-center text-xs">Anyone with a secret address can read that calendar, so Reflect keeps it sealed and shows only its host.</p>
      </div>
    </main>
  );
}
