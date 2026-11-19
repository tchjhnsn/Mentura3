import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDaysIcon, CompassIcon, LandmarkIcon, UserRoundIcon, UsersRoundIcon } from "lucide-react";
import { SidebarButton } from "@/components/sidebar";
import { SearchButton } from "@/components/search-button";
import { PAGE } from "@/components/page-header";
import { upcomingEvents } from "@/server/events-store";
import { adventuresOf } from "@/server/adventures";
import { selfOf } from "@/server/profile-store";
import { requireUser } from "@/server/session";
import { whenOf } from "../adventures/parts";

export const metadata: Metadata = { title: "Village and polis" };
export const dynamic = "force-dynamic";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Chicago" });

/**
 * Village and polis, the shared side's home (doc "Private and shared Reflect plan", 2026-11-19). On its own host it
 * is `/`; on a shared host (previews, local) it is `/v`. What is coming up comes first, then the person's adventures,
 * then the places of the polis. Everything here is shared with someone; nothing private from Home is read.
 */
export default async function VillagePage() {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const [events, adventures, me] = await Promise.all([
    upcomingEvents({ limit: 4 }).catch(() => []),
    adventuresOf(user.id).catch(() => []),
    selfOf(user.id).catch(() => null),
  ]);
  const ahead = adventures.filter((a) => !a.done).slice(0, 3);
  return (
    <main className={PAGE}>
      <header className="flex min-h-10 items-center gap-3 py-2">
        <SidebarButton className="-ml-2" />
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight">Village and polis</h1>
        <SearchButton />
      </header>

      <div className="mt-6 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="grid content-start gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Coming up</h2>
            <Link href="/events" className="text-muted-foreground text-sm hover:underline">All events</Link>
          </div>
          {events.length ? (
            <ul className="divide-y rounded-xl border">
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="hover:bg-accent flex items-center gap-4 px-4 py-3 transition">
                    <span className="text-muted-foreground w-24 shrink-0 text-sm">{e.startsAt ? day(e.startsAt) : ""}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.title}</span>
                      {e.venue ? <span className="text-muted-foreground block truncate text-sm">{e.venue}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No events found nearby yet. <Link href="/events" className="underline">Look at events</Link></p>
          )}

          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Your adventures</h2>
            <Link href="/adventures" className="text-muted-foreground text-sm hover:underline">All adventures</Link>
          </div>
          {ahead.length ? (
            <ul className="grid gap-2 sm:grid-cols-3">
              {ahead.map((a) => (
                <li key={a.id}>
                  <Link href={`/adventures/${a.id}`} className="hover:bg-accent block rounded-xl border px-4 py-3 transition">
                    <span className="block truncate font-medium">{a.name}</span>
                    <span className="text-muted-foreground block truncate text-sm">{whenOf(a, today) ?? "Not yet"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">None yet. <Link href="/adventures" className="underline">Start an adventure</Link></p>
          )}
        </section>

        <aside className="grid content-start gap-1">
          <h2 className="text-muted-foreground px-3 pb-1 text-xs font-medium">Places</h2>
          {me ? <Place href={me.href} icon={<UserRoundIcon className="size-4" />} label="Your profile" /> : null}
          <Place href="/events" icon={<CalendarDaysIcon className="size-4" />} label="Events" />
          <Place href="/adventures" icon={<CompassIcon className="size-4" />} label="Adventures" />
          <Place href="/v/people" icon={<UsersRoundIcon className="size-4" />} label="People you've met" />
          <Place href="/life/polis" icon={<LandmarkIcon className="size-4" />} label="Polis" />
        </aside>
      </div>
    </main>
  );
}

function Place({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return <Link href={href} className="hover:bg-accent text-muted-foreground hover:text-foreground flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition">{icon}<span className="text-foreground">{label}</span></Link>;
}
