"use client";

// M1 Home, after Contra's home (data.ts REFS.home): topic tabs (C12), the composer (C5), suggested events, and the feed of
// posts (C4) from founders and investors; a right rail (C13) with people to follow, events coming up and trending topics.
// Posting, following and saving are kept across screens (store.tsx). Create, Post lands here with ?compose=1.
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchIcon, TrendingUpIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Num } from "@/components/studio/bits";
import { EVENTS, ME, PEOPLE, POSTS, TOPICS } from "@/components/mentura/data";
import { useAllPosts, useMentura } from "@/components/mentura/store";
import { Composer, EventRow, Face, FollowButton, PostCard } from "@/components/mentura/parts";

const TABS = ["For you", "Following", "Your posts", "Saved"] as const;

export default function Home() {
  return <Suspense><Feed /></Suspense>;
}

function Feed() {
  const params = useSearchParams();
  const topic = params.get("topic");
  const compose = params.get("compose") === "1";
  const { follows, saved, addPost, say } = useMentura();
  const [tab, setTab] = useState<(typeof TABS)[number]>("For you");
  const all = useAllPosts(POSTS);
  const shown = all.filter((p) => (topic ? p.tags.includes(topic) : tab === "Your posts" ? p.by === ME : tab === "Following" ? follows.includes(p.by) : tab === "Saved" ? saved.includes(p.id) : true));
  const post = (text: string, kind: Parameters<typeof addPost>[1], tags: string[]) => { addPost(text, kind, tags); setTab("For you"); say("Posted. It is at the top of the feed and on your profile."); };

  return (
    <div data-virtu-screen="M1" className="grid gap-8 px-4 py-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <div className="relative flex items-center gap-1 overflow-x-auto pb-1">
          <Num n="M1" className="mr-1" />
          <Num n="C12" className="absolute -top-1 right-0" />
          {TABS.map((t) => (
            <Link key={t} href="/mentura" onClick={() => setTab(t)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm", !topic && tab === t ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>{t}</Link>
          ))}
          <span className="text-muted-foreground flex shrink-0 items-center gap-1 px-2 text-sm"><SearchIcon className="size-3.5" />Topics</span>
          {TOPICS.map((t) => <Link key={t} href={`/mentura?topic=${t}`} className={cn("shrink-0 rounded-full px-2.5 py-1.5 text-sm", topic === t ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>#{t}</Link>)}
        </div>

        <Composer onPost={post} focus={compose} />

        {!topic && tab === "For you" ? (
          <section className="relative">
            <Num n="M1.1" className="absolute -top-2 right-0" />
            <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Coming up near you</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {EVENTS.slice(0, 2).map((e) => (
                <Link key={e.id} href={`/mentura/events/${e.id}`} className="relative grid min-h-36 content-between overflow-hidden rounded-xl p-4 text-white" style={{ background: `linear-gradient(135deg, oklch(0.35 0.08 ${e.id === "e1" ? 330 : 140}), oklch(0.2 0.04 260))` }}>
                  <span><span className="block text-xs opacity-80">{e.kind}</span><span className="block text-lg font-semibold leading-snug">{e.title}</span></span>
                  <span className="flex items-end justify-between text-sm"><span>{e.when}</span><span className="opacity-80">{e.going.length} going</span></span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {topic ? <p className="text-sm">Posts tagged <span className="font-medium">#{topic}</span>. <Link href="/mentura" className="text-muted-foreground underline-offset-4 hover:underline">Clear</Link></p> : null}
        <div className="space-y-4">
          {shown.length ? shown.map((p, i) => <PostCard key={p.id} post={p} first={i === 0} />) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">{tab === "Saved" ? "Nothing saved yet. Tap the bookmark on a post to keep it here." : tab === "Following" ? "Follow people to see their posts here." : "Nothing here yet. Post what you made this week."}</p>}
        </div>
      </div>

      <aside className="relative hidden space-y-6 lg:block">
        <Num n="C13" className="absolute -top-2 right-0" />
        <section className="rounded-xl border p-4">
          <div className="flex items-center justify-between"><h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">People to know</h2><Link href="/mentura/discover" className="text-muted-foreground text-xs hover:text-foreground">See all</Link></div>
          <ul className="mt-3 space-y-3">
            {PEOPLE.filter((p) => p.handle !== ME).slice(0, 4).map((p) => <li key={p.handle} className="flex items-center gap-2"><span className="min-w-0 flex-1"><Face handle={p.handle} size={32} /></span><FollowButton handle={p.handle} size="xs" /></li>)}
          </ul>
        </section>
        <section className="rounded-xl border p-3">
          <div className="flex items-center justify-between px-1"><h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Events</h2><Link href="/mentura/events" className="text-muted-foreground text-xs hover:text-foreground">View all</Link></div>
          <div className="mt-2 space-y-1">{EVENTS.map((e, i) => <EventRow key={e.id} ev={e} first={i === 0} />)}</div>
        </section>
        <section className="px-1">
          <h2 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">Trending <TrendingUpIcon className="size-3.5" /></h2>
          <ul className="mt-3 space-y-3">
            {[["sportstech", "Demo day on Dec 13 has eight founders."], ["cofounder", "Who is looking, and for what."], ["naive", "Businesses that moved a phase this week."]].map(([t, d]) => (
              <li key={t}><Link href={`/mentura?topic=${t}`} className="block"><span className="text-sm font-medium">#{t}</span><span className="text-muted-foreground block text-xs">{d}</span></Link></li>
            ))}
          </ul>
        </section>
        <Link href="/mentura/profile" className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-1 text-xs"><UserRoundIcon className="size-3.5" />Your posts and profile</Link>
      </aside>
    </div>
  );
}
