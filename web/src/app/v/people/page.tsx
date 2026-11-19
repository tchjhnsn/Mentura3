import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, ClockIcon, MessageCircleIcon, UserPlusIcon, XIcon } from "lucide-react";
import { austinDay, dayLabel } from "@reflect/core/events";
import { rankBuilders, type BuildStatus } from "@reflect/core/build";
import { SidebarButton } from "@/components/sidebar";
import { SearchButton } from "@/components/search-button";
import { PAGE } from "@/components/page-header";
import { MemberFace } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/session";
import { incomingRequests, peopleMet, type Incoming, type MetPerson } from "@/server/connect-store";
import { buildCandidates, buildStatuses, incomingBuildRequests } from "@/server/build-store";
import { connectBackAction, notNowAction } from "@/app/events/connect-actions";
import { BuildPeople, BuildRequestRows } from "./build-people";

export const metadata: Metadata = { title: "People you've met" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const at = (e: { title: string; startsAt: string | null }) => `${e.title}${e.startsAt ? `, ${dayLabel(austinDay(e.startsAt))}` : ""}`;
const profile = (p: { id: string; handle?: string | null }) => `/p/${encodeURIComponent(p.handle ?? p.id)}`;
const messageHref = (id: string) => `/life/friends/messages/${encodeURIComponent(id)}`;

/**
 * People you've met, on Village and polis (doc "Private and shared Reflect plan", 2026-11-19, step 6): the shared half
 * of Friends and Ventures. Requests first (Connect requests and requests to build, answered with a tap), then everyone
 * the person met at an event or connected with, each a face and a name that opens their profile with where they met,
 * then people to build with. What the person keeps about a friend, and their ventures, stay on Home: nothing here
 * reads the journal, the household, the budget, the life plan or the ideas. Opened from a venture
 * (`?venture=<id>`), people to build with can be asked to build it.
 */
export default async function PeoplePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const error = one(sp.error);
  const venture = /^[0-9a-f-]{36}$/i.test(one(sp.venture)) ? one(sp.venture) : null;
  // Before migration 0050 is applied the tables are missing; each part then shows as empty.
  const [requests, asked, met, candidates, status] = await Promise.all([
    incomingRequests(user.id).catch((): Incoming[] => []),
    incomingBuildRequests(user.id).catch(() => []),
    peopleMet(user.id).catch((): MetPerson[] => []),
    buildCandidates(user.id).catch(() => ({ interests: [] as string[], list: [] })),
    venture ? buildStatuses(user.id, venture).catch(() => new Map<string, BuildStatus>()) : Promise.resolve(new Map<string, BuildStatus>()),
  ]);
  const builders = rankBuilders(user.id, candidates.interests, candidates.list, status);
  const waiting = requests.length + asked.length;
  // Someone who asked shows under Requests, not again under Everyone.
  const asking = new Set(requests.map((r) => r.from.id));
  const everyone = met.filter((p) => !asking.has(p.id));
  return (
    <main className={PAGE}>
      <header className="flex min-h-10 items-center gap-3 py-2">
        <SidebarButton className="-ml-2" />
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight">People you&apos;ve met</h1>
        <SearchButton />
      </header>

      <div className="mt-6 grid max-w-3xl gap-10">
        {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}

        {waiting ? (
          <section aria-labelledby="requests" className="grid gap-3">
            <h2 id="requests" className="text-xl font-semibold tracking-tight">Requests</h2>
            <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={profile(r.from)} className="flex min-w-0 flex-1 items-center gap-3">
                    <MemberFace name={r.from.name} image={r.from.image} size={48} />
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate font-medium">{r.from.name}</span>
                      <span className="text-muted-foreground text-sm">{r.event ? `Met at ${at(r.event)}` : "Asked to connect"}</span>
                    </span>
                  </Link>
                  <span className="flex shrink-0 gap-1">
                    <form action={connectBackAction.bind(null, r.from.id)}><Button type="submit" size="icon" aria-label={`Connect back with ${r.from.name}`} title="Connect back"><CheckIcon /></Button></form>
                    <form action={notNowAction.bind(null, r.id)}><Button type="submit" variant="ghost" size="icon" aria-label="Not now" title="Not now"><XIcon /></Button></form>
                  </span>
                </li>
              ))}
              <BuildRequestRows requests={asked} />
            </ul>
          </section>
        ) : null}

        {everyone.length || !requests.length ? <section aria-labelledby="met" className="grid gap-3">
          <h2 id="met" className="text-xl font-semibold tracking-tight">Everyone</h2>
          {everyone.length ? (
            <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
              {everyone.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={profile(p)} className="flex min-w-0 flex-1 items-center gap-3">
                    <MemberFace name={p.name} image={p.image} size={48} />
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-sm">{p.event ? `Met at ${at(p.event)}` : "Connected"}</span>
                    </span>
                  </Link>
                  {p.connected ? (
                    <Button asChild variant="ghost" size="icon" aria-label={`Message ${p.name}`} title="Message"><Link href={messageHref(p.id)}><MessageCircleIcon /></Link></Button>
                  ) : p.requested ? (
                    <Button variant="ghost" size="icon" disabled aria-label={`Asked to connect with ${p.name}`} title="Requested"><ClockIcon /></Button>
                  ) : (
                    <form action={connectBackAction.bind(null, p.id)}><Button type="submit" variant="outline" size="icon" aria-label={`Connect with ${p.name}`} title="Connect"><UserPlusIcon /></Button></form>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No one yet. Check in at an <Link href="/events" className="text-primary hover:underline">event</Link> and the people you meet show here.</p>
          )}
        </section> : null}

        <section id="build" aria-labelledby="build-title" className="grid scroll-mt-20 gap-3">
          <div className="grid gap-0.5">
            <h2 id="build-title" className="text-xl font-semibold tracking-tight">People to build with</h2>
            {venture ? <span className="text-muted-foreground text-sm">Ask someone to build your venture with you</span> : null}
          </div>
          <BuildPeople venture={venture} people={builders} />
        </section>
      </div>
    </main>
  );
}
