"use client";

// The profile view shared by M6 My profile and M7 Someone's profile, after Contra's profile and About pages: a header
// with a large face, roles (attributes on the one account), the "Open to" line, name, line and actions, "Followed by" faces and a banner; then tabs for
// Work, Posts, Ventures, Events and About, chosen by ?tab=. The profile and account are shared with Reflect; Mentura
// shows them in public for founding work.
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BriefcaseIcon, MapPinIcon, PlusIcon, Share2Icon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { EVENTS, ME, PEOPLE, POSTS, VENTURES, isA, messageHref, personOf, roleLine, ventureOf, type Person } from "./data";
import { EventRow, Face, Faces, FollowButton, PostCard, VentureCard } from "./parts";
import { useAllPosts, useMentura } from "./store";

const TABS = ["Work", "Posts", "Businesses", "Events", "About"] as const;
type Tab = (typeof TABS)[number];

/** Mock names of companies an investor has backed. */
const BACKED: Record<string, { name: string; line: string; year: string }[]> = {
  maya: [{ name: "League Pay", line: "Payroll for youth sports leagues.", year: "2026" }, { name: "Grit Gear", line: "Smart padding for youth football.", year: "2025" }, { name: "Fieldhouse", line: "Booking for indoor courts.", year: "2024" }],
  james: [{ name: "Coach Notes", line: "Practice plans that coaches share.", year: "2025" }, { name: "Tutor Bus", line: "After-school tutoring on the ride home.", year: "2024" }],
  priya: [{ name: "Gridline", line: "Energy forecasts for small utilities.", year: "2026" }, { name: "Ledgerly", line: "Bookkeeping for trades businesses.", year: "2025" }, { name: "Carbonplan Ops", line: "Emissions reporting for mid-size firms.", year: "2024" }],
};

export function ProfileView({ handle, mine, n }: { handle: string; mine?: boolean; n: "M6" | "M7" }) {
  return <Suspense><View handle={handle} mine={mine} n={n} /></Suspense>;
}

function View({ handle, mine, n }: { handle: string; mine?: boolean; n: string }) {
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "Work";
  const { roles } = useMentura();
  const found = personOf(handle);
  const p: Person = found.handle === ME ? { ...found, roles } : found;
  const base = mine ? "/mentura/profile" : `/mentura/p/${p.handle}`;

  return (
    <div data-virtu-screen={n} className="px-4 py-5 md:px-8">
      <Header p={p} mine={mine} n={n} />

      <nav className="relative mt-6 flex gap-1 overflow-x-auto border-b" aria-label="Profile sections">
        <Num n={`${n}.2`} className="absolute -top-2 right-0" />
        {TABS.map((t) => (
          <Link key={t} href={t === "Work" ? base : `${base}?tab=${t}`} scroll={false} aria-current={tab === t ? "page" : undefined}
            className={cn("-mb-px shrink-0 border-b-2 px-3 py-2 text-sm", tab === t ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent")}>{t}</Link>
        ))}
      </nav>

      <div className="relative mt-5">
        {tab === "Work" ? <Work p={p} mine={mine} n={n} /> : null}
        {tab === "Posts" ? <Posts p={p} n={n} /> : null}
        {tab === "Businesses" ? <Ventures p={p} n={n} /> : null}
        {tab === "Events" ? <Events p={p} n={n} /> : null}
        {tab === "About" ? <About p={p} n={n} /> : null}
      </div>
    </div>
  );
}

function Header({ p, mine, n }: { p: Person; mine?: boolean; n: string }) {
  const v = p.venture ? ventureOf(p.venture) : undefined;
  const followedBy = PEOPLE.filter((x) => x.handle !== p.handle).slice(0, 3);
  const hue = v?.hue ?? p.hue;
  const { has, say } = useMentura();
  const followers = p.followers + (has("follows", p.handle) ? 1 : 0);
  const share = async () => {
    const url = `${window.location.origin}${mine ? `/mentura/p/${p.handle}` : window.location.pathname}`;
    try { await navigator.clipboard.writeText(url); say("Link to the profile copied."); } catch { say(url); }
  };
  return (
    <section className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start">
      <Num n={n} className="absolute -top-2 left-0" />
      <Num n={`${n}.1`} className="absolute -top-2 right-0" />
      <div className="min-w-0 pt-3">
        <Face handle={p.handle} size={88} name={false} />
        <p className="mt-4 text-sm font-medium">{roleLine(p)}</p>
        {p.open ? <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400"><span className="size-2 shrink-0 rounded-full bg-emerald-500" />{p.open}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight break-words md:text-4xl">{p.name}</h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-[15px] leading-relaxed">{p.line}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {mine ? (
            <Button asChild><Link href="/mentura/profile/edit">Edit profile</Link></Button>
          ) : (
            <>
              <Button asChild><Link href={messageHref(p.handle)}>Message</Link></Button>
              <FollowButton handle={p.handle} size="sm" />
            </>
          )}
          <Button variant="outline" size="icon-sm" aria-label="Share profile" title="Share profile" onClick={share}><Share2Icon /></Button>
        </div>
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
          <Faces handles={followedBy.map((x) => x.handle)} size={22} />
          <span className="min-w-0">Followed by {followedBy.slice(0, 2).map((x) => x.name.split(" ")[0]).join(", ")} and {Math.max(followers - 2, 0).toLocaleString()} others</span>
        </div>
      </div>
      <div className="relative grid aspect-[16/10] content-end overflow-hidden rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, oklch(0.78 0.11 ${hue}), oklch(0.42 0.13 ${(hue + 40) % 360}))` }}>
        {v ? (
          <Link href={`/mentura/ventures/${v.slug}`} className="block rounded-lg bg-black/35 p-3 backdrop-blur-sm">
            <span className="block text-xs opacity-80">Building</span>
            <span className="block text-lg font-semibold leading-snug">{v.name}</span>
            <span className="block text-sm opacity-90">{v.line}</span>
          </Link>
        ) : (
          <span className="block rounded-lg bg-black/35 p-3 text-sm backdrop-blur-sm">{p.tags.join(" · ")}</span>
        )}
      </div>
    </section>
  );
}

function Work({ p, mine, n }: { p: Person; mine?: boolean; n: string }) {
  const made = POSTS.filter((x) => x.by === p.handle && x.kind === "Made");
  return (
    <section className="relative">
      <Num n={`${n}.3`} className="absolute -top-2 right-0" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {made.map((x) => (
          <Link key={x.id} href={`/mentura/post/${x.id}`} className="group block min-w-0">
            <span className="grid aspect-[4/3] place-items-end overflow-hidden rounded-xl p-3" style={{ background: `linear-gradient(135deg, oklch(0.75 0.1 ${x.media?.hue ?? p.hue}), oklch(0.45 0.12 ${x.media?.hue ?? p.hue}))` }}>
              <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white">{x.when}</span>
            </span>
            <span className="mt-2 block truncate text-sm font-medium group-hover:underline">{x.media?.title ?? x.text}</span>
            <span className="text-muted-foreground line-clamp-2 block text-xs">{x.text}</span>
          </Link>
        ))}
        {mine ? (
          <Link href="/mentura?compose=1" className="text-muted-foreground hover:text-foreground hover:border-foreground/30 grid aspect-[4/3] place-items-center rounded-xl border border-dashed text-sm">
            <span className="flex flex-col items-center gap-2"><PlusIcon className="size-5" />Add work</span>
          </Link>
        ) : null}
      </div>
      {!made.length && !mine ? <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">{p.name.split(" ")[0]} has not posted work yet.</p> : null}
    </section>
  );
}

function Posts({ p, n }: { p: Person; n: string }) {
  const posts = useAllPosts(POSTS).filter((x) => x.by === p.handle);
  return (
    <section className="relative max-w-2xl space-y-4">
      <Num n={`${n}.4`} className="absolute -top-2 right-0" />
      {posts.length ? posts.map((x, i) => <PostCard key={x.id} post={x} first={i === 0} />) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No posts yet.</p>}
    </section>
  );
}

function Ventures({ p, n }: { p: Person; n: string }) {
  const ventures = VENTURES.filter((v) => v.team.includes(p.handle));
  const backed = BACKED[p.handle] ?? [];
  return (
    <section className="relative space-y-6">
      <Num n={`${n}.5`} className="absolute -top-2 right-0" />
      {ventures.length ? <div className="grid gap-4 md:grid-cols-2">{ventures.map((v, i) => <VentureCard key={v.slug} v={v} first={i === 0} />)}</div> : null}
      {isA(p, "Investor") ? (
        <div>
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Backed</h2>
          <ul className="divide-y rounded-xl border">
            {backed.map((b) => (
              <li key={b.name} className="flex items-center gap-3 p-3">
                <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-lg text-sm font-medium">{b.name[0]}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{b.name}</span><span className="text-muted-foreground block truncate text-xs">{b.line}</span></span>
                <span className="text-muted-foreground shrink-0 text-xs">{b.year}</span>
              </li>
            ))}
            {!backed.length ? <li className="text-muted-foreground p-3 text-sm">No investments shown yet.</li> : null}
          </ul>
        </div>
      ) : null}
      {!ventures.length && !isA(p, "Investor") ? <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No businesses yet.</p> : null}
    </section>
  );
}

function Events({ p, n }: { p: Person; n: string }) {
  const events = EVENTS.filter((e) => e.host === p.handle || e.going.includes(p.handle));
  return (
    <section className="relative max-w-2xl">
      <Num n={`${n}.6`} className="absolute -top-2 right-0" />
      {events.length ? (
        <div className="space-y-1 rounded-xl border p-2">
          {events.map((e, i) => (
            <div key={e.id}>
              <EventRow ev={e} first={i === 0} />
              <p className="text-muted-foreground px-2 pb-1 text-xs">{e.host === p.handle ? "Hosting" : "Going"} · {e.when}</p>
            </div>
          ))}
        </div>
      ) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No events yet.</p>}
    </section>
  );
}

function About({ p, n }: { p: Person; n: string }) {
  const first = p.name.split(" ")[0];
  const v = p.venture ? ventureOf(p.venture) : undefined;
  return (
    <section className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Num n={`${n}.7`} className="absolute -top-2 right-0" />
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight">Meet {first}</h2>
        <p className="text-muted-foreground mt-2 text-sm"><span className="text-foreground font-medium">{p.following.toLocaleString()}</span> following · <span className="text-foreground font-medium">{p.followers.toLocaleString()}</span> followers</p>
        <div className="mt-4 max-w-2xl space-y-3 text-[15px] leading-relaxed">
          <p>{p.line}</p>
          <p>{first} is {/^[AEIOU]/.test(p.roles[0] ?? "") ? "an" : "a"} {p.roles.map((r) => r.toLowerCase()).join(" and ")} in {p.city}{v ? `, building ${v.name}: ${v.line.charAt(0).toLowerCase()}${v.line.slice(1)}` : p.fund ? `, writing checks through ${p.fund}.` : "."}</p>
          <p>Ask {first} about {p.tags.map((t) => t.toLowerCase()).join(", ")}.</p>
        </div>
      </div>
      <aside className="h-fit space-y-4 rounded-xl border p-4">
        <div>
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Skills</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="bg-muted rounded-md px-2 py-0.5 text-xs">{t}</span>)}</div>
        </div>
        <p className="flex items-center gap-2 text-sm"><MapPinIcon className="text-muted-foreground size-4 shrink-0" />{p.city}</p>
        {p.fund ? <p className="flex items-center gap-2 text-sm"><BriefcaseIcon className="text-muted-foreground size-4 shrink-0" />{p.fund}</p> : null}
        {v ? <p className="flex items-center gap-2 text-sm"><BriefcaseIcon className="text-muted-foreground size-4 shrink-0" /><Link href={`/mentura/ventures/${v.slug}`} className="hover:underline">{v.name}</Link></p> : null}
        {p.open ? (
          <div>
            <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Looking for</h3>
            <p className="mt-1 flex items-start gap-2 text-sm"><SparklesIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />{p.open}</p>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
