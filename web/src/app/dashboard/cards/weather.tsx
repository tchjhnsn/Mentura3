import Link from "next/link";
import { CloudSunIcon, MapPinIcon } from "lucide-react";
import { calendarPart } from "@/server/calendar-tools";
import { nextGoing } from "@/server/events-store";
import { lifeRecords } from "@/server/life-store";
import { clockIn, dayIn, safe, Section, type Ctx } from "../parts";
import { forecastUrl, leaveBy, looksLikeAddress, placeFor, readForecast, TRAVEL_MARGIN, type Forecast } from "../world";
import { outsideFetch } from "@/server/outside";

/**
 * Today's weather from Open-Meteo (free, no key) for a city's coordinates, which are all that is sent. Cached for
 * 30 minutes; a slow or failed answer leaves the weather out.
 */
async function forecast(place: { lat: number; lon: number }): Promise<Forecast | null> {
  try {
    const res = await outsideFetch({ timeoutMs: 4000 })(forecastUrl(place), { next: { revalidate: 1800 } } as RequestInit);
    return res.ok ? readForecast(await res.json()) : null;
  } catch {
    return null;
  }
}

type Trip = { title: string; day: string; starts: string; address: string; href: string };

/** The next timed thing in the coming day that has an address: an event the person is going to, or a calendar event whose note is an address. */
async function nextTrip(ctx: Ctx): Promise<Trip | null> {
  const [going, cal] = await Promise.all([safe(nextGoing(ctx.userId), null), safe(calendarPart(ctx.userId, ctx.today, ctx.tomorrow), null)]);
  const nowClock = clockIn(ctx.now);
  const trips: Trip[] = [];
  if (going?.startsAt && going.address) {
    const start = new Date(going.startsAt);
    const day = dayIn(start);
    if (start > ctx.now && (day === ctx.today || day === ctx.tomorrow)) trips.push({ title: going.title, day, starts: clockIn(start), address: going.address, href: `/events/${going.id}` });
  }
  for (const e of cal?.events ?? []) {
    if (!e.starts || String(e.id).startsWith("event:") || !looksLikeAddress(e.note)) continue;
    if (e.day === ctx.today && e.starts <= nowClock) continue;
    trips.push({ title: e.title, day: e.day, starts: e.starts, address: e.note!, href: e.href });
  }
  return trips.sort((a, b) => a.day.localeCompare(b.day) || a.starts.localeCompare(b.starts))[0] ?? null;
}

/**
 * Weather and when to leave: today's weather where the person lives (the county kept in Home's "Where you live",
 * else Austin), and when to set off for the next thing with an address.
 */
export async function WeatherCard({ ctx }: { ctx: Ctx }) {
  const home = (await safe(lifeRecords(ctx.userId, "home"), [])).find((r) => r.kind === "place");
  const place = placeFor(home?.body.county, home?.body.state);
  const [f, trip] = await Promise.all([forecast(place), nextTrip(ctx)]);
  if (!f && !trip) return null;
  const leave = trip ? leaveBy(trip.starts) : null;
  const late = trip && leave && trip.day === ctx.today && leave <= clockIn(ctx.now);
  return (
    <Section title={`Weather in ${place.name}`} href={`/calendar?day=${ctx.today}`} more="Calendar">
      {f ? (
        <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
          <CloudSunIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          <span className="grid min-w-0 gap-0.5">
            <span className="text-2xl font-semibold tabular-nums">{f.now !== null ? `${f.now}°F` : f.high !== null ? `High ${f.high}°F` : ""}{f.words ? <span className="text-muted-foreground ml-2 text-base font-normal">{f.words}</span> : null}</span>
            <span className="text-muted-foreground text-sm">{[f.high !== null && f.now !== null ? `High ${f.high}°` : null, f.low !== null ? `Low ${f.low}°` : null, f.rain !== null ? `${f.rain}% chance of rain` : null].filter(Boolean).join(" · ")}</span>
          </span>
        </div>
      ) : null}
      {trip ? (
        <Link href={trip.href} className="hover:bg-accent grid gap-0.5 rounded-xl border p-4 transition">
          <span className="text-lg font-semibold">{late ? "Leave now" : leave ? `Leave by ${trip.day === ctx.today ? "" : "tomorrow "}${leave}` : `Starts ${trip.starts}`}</span>
          <span className="truncate text-sm">{trip.title} · {trip.day === ctx.today ? "" : "tomorrow "}{trip.starts}</span>
          <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-sm"><MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{trip.address}</span></span>
          <span className="text-muted-foreground text-xs">Travel time unknown: this allows {TRAVEL_MARGIN} minutes, not a routed trip.</span>
        </Link>
      ) : null}
    </Section>
  );
}
