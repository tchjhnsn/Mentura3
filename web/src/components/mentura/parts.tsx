"use client";

// Mentura's shared parts, each numbered (data.ts, PARTS). People are faces with names, never pills.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BookmarkIcon, HeartIcon, MessageCircleIcon, Repeat2Icon, HashIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Num } from "@/components/studio/bits";
import { ME, personOf, roleLine, TOPICS, ventureOf, type Event, type Post, type PublicVenture } from "./data";
import { useMentura } from "./store";

/** C6 Face, with the name beside it unless told not to. */
export function Face({ handle, size = 36, name = true, sub, plain }: { handle: string; size?: number; name?: boolean; sub?: string; /** No link, for use inside another link. */ plain?: boolean }) {
  const p = personOf(handle);
  const initials = p.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const dot = <span aria-hidden className="grid shrink-0 place-items-center rounded-full font-medium text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `oklch(0.6 0.12 ${p.hue})` }}>{initials}</span>;
  if (!name) return plain ? <span title={p.name} className="shrink-0">{dot}<span className="sr-only">{p.name}</span></span> : <Link href={href(handle)} title={p.name} className="shrink-0">{dot}<span className="sr-only">{p.name}</span></Link>;
  return (
    <Link href={href(handle)} className="inline-flex min-w-0 items-center gap-2.5">
      {dot}
      <span className="min-w-0"><span className="block truncate text-sm font-medium hover:underline">{p.name}</span><span className="text-muted-foreground block truncate text-xs">{sub ?? roleLine(p)}</span></span>
    </Link>
  );
}
export const href = (handle: string) => (handle === ME ? "/mentura/profile" : `/mentura/p/${handle}`);

/** A row of overlapping faces, for who is going or who follows. */
export function Faces({ handles, size = 24 }: { handles: string[]; size?: number }) {
  return <span className="flex -space-x-1.5">{handles.slice(0, 4).map((h) => <span key={h} className="ring-background rounded-full ring-2"><Face handle={h} size={size} name={false} plain /></span>)}</span>;
}

/** C7 Follow button. */
export function FollowButton({ handle, size = "sm" }: { handle: string; size?: "sm" | "xs" }) {
  const { has, toggle, say } = useMentura();
  if (handle === ME) return null;
  const on = has("follows", handle);
  return <Button variant={on ? "ghost" : "outline"} size={size} onClick={(e) => { e.preventDefault(); toggle("follows", handle); if (!on) say(`Following ${personOf(handle).name}. Their posts show under Following.`); }} aria-pressed={on}>{on ? "Following" : "Follow"}</Button>;
}

const KIND_TONE: Record<Post["kind"], string> = { Made: "text-emerald-700 dark:text-emerald-400", Doing: "text-sky-700 dark:text-sky-400", Asking: "text-amber-700 dark:text-amber-400", Milestone: "text-fuchsia-700 dark:text-fuchsia-400", Note: "text-muted-foreground" };

/** C4 Post: who, what they made or are doing, the venture it belongs to, and the reactions. */
export function PostCard({ post, first, full }: { post: Post; first?: boolean; full?: boolean }) {
  const p = personOf(post.by);
  const { has, toggle, replies, say } = useMentura();
  const liked = has("likes", post.id);
  const saved = has("saved", post.id);
  const reposted = has("reposts", post.id);
  const mine = replies[post.id]?.length ?? 0;
  return (
    <article className="bg-card relative rounded-xl border p-4 md:p-5">
      {first ? <Num n="C4" className="absolute -top-2 left-4" /> : null}
      <div className="flex items-start gap-3">
        <Face handle={post.by} size={40} name={false} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
            <Link href={href(post.by)} className="font-medium hover:underline">{p.name}</Link>
            <span className="text-muted-foreground">· {post.when}</span>
            <span className={cn("text-xs font-medium", KIND_TONE[post.kind])}>{post.kind === "Note" ? "" : post.kind}</span>
            <span className="ml-auto"><FollowButton handle={post.by} size="xs" /></span>
          </div>
          <Link href={`/mentura/post/${post.id}`} className={cn("mt-1 block text-[15px] leading-relaxed", !full && "line-clamp-4")}>{post.text}</Link>
          {post.media ? (
            <div className="mt-3 grid aspect-[16/9] max-h-72 w-full place-items-end overflow-hidden rounded-lg p-3" style={{ background: `linear-gradient(135deg, oklch(0.75 0.1 ${post.media.hue}), oklch(0.45 0.12 ${post.media.hue}))` }}>
              <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white">{post.media.title}</span>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {post.venture ? <Link href={`/mentura/ventures/${post.venture}`} className="bg-muted hover:bg-accent rounded-md px-2 py-0.5 text-xs font-medium">{ventureOf(post.venture).name}</Link> : null}
            {post.tags.map((t) => <Link key={t} href={`/mentura?topic=${t}`} className="text-muted-foreground hover:text-foreground text-xs">#{t}</Link>)}
          </div>
          <div className="text-muted-foreground mt-3 flex items-center gap-5 text-xs">
            <button type="button" onClick={() => toggle("likes", post.id)} aria-pressed={liked} className={cn("flex items-center gap-1 hover:text-foreground", liked && "text-rose-600")}><HeartIcon className={cn("size-4", liked && "fill-current")} />{post.likes + (liked ? 1 : 0)}</button>
            <Link href={`/mentura/post/${post.id}`} className="flex items-center gap-1 hover:text-foreground"><MessageCircleIcon className="size-4" />{post.replies + mine}</Link>
            <button type="button" onClick={() => { toggle("reposts", post.id); if (!reposted) say("Reposted to your followers."); }} aria-pressed={reposted} aria-label="Repost" className={cn("flex items-center gap-1 hover:text-foreground", reposted && "text-emerald-600")}><Repeat2Icon className="size-4" />{post.reposts + (reposted ? 1 : 0)}</button>
            <button type="button" onClick={() => { toggle("saved", post.id); if (!saved) say("Saved. Find it under Saved on Home."); }} aria-pressed={saved} aria-label="Save" className="ml-auto hover:text-foreground"><BookmarkIcon className={cn("size-4", saved && "fill-current text-foreground")} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** C5 Composer, after Contra's "What are you working on?" box: say what you made or are doing, its kind and its tags.
 * Posting adds it to the top of the feed and to your profile (store.tsx). `focus` puts the cursor in it (Create, Post). */
export function Composer({ onPost, placeholder, focus }: { onPost: (text: string, kind: Post["kind"], tags: string[]) => void; placeholder?: string; focus?: boolean }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Post["kind"]>("Made");
  const [tags, setTags] = useState<string[]>([]);
  const box = useRef<HTMLTextAreaElement>(null);
  const me = personOf(ME);
  useEffect(() => { if (focus) box.current?.focus(); }, [focus]);
  return (
    <div className="bg-card relative rounded-xl border p-4">
      <Num n="C5" className="absolute -top-2 left-4" />
      <div className="flex gap-3">
        <Face handle={ME} size={40} name={false} />
        <textarea ref={box} value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={placeholder ?? `What are you working on, ${me.name.split(" ")[0]}?`} aria-label="Write a post"
          className="placeholder:text-muted-foreground min-h-14 flex-1 resize-none bg-transparent pt-2 text-[15px] outline-none" />
      </div>
      {tags.length ? <div className="mt-1 flex flex-wrap gap-1.5 pl-[52px]">{tags.map((t) => <button key={t} type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="bg-muted hover:bg-accent flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs">#{t}<XIcon className="size-3" /></button>)}</div> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1 pl-[52px]">
        {(["Made", "Doing", "Asking", "Milestone"] as const).map((k) => <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={cn("rounded-md px-2 py-1 text-xs", kind === k ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60")}>{k === "Asking" ? "Asking for" : k}</button>)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="text-muted-foreground hover:bg-accent/60 ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs"><HashIcon className="size-3.5" />Add tags</button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Topics</DropdownMenuLabel>
            {TOPICS.map((t) => <DropdownMenuCheckboxItem key={t} checked={tags.includes(t)} onSelect={(e) => e.preventDefault()} onCheckedChange={(on) => setTags(on ? [...tags, t] : tags.filter((x) => x !== t))}>#{t}</DropdownMenuCheckboxItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="ml-auto" size="sm" disabled={!text.trim()} onClick={() => { onPost(text.trim(), kind, tags); setText(""); setTags([]); }}>Post</Button>
      </div>
    </div>
  );
}

/** C9 Event row: the date block, title, place and who is going. */
export function EventRow({ ev, first }: { ev: Event; first?: boolean }) {
  return (
    <Link href={`/mentura/events/${ev.id}`} className="hover:bg-accent/50 relative flex items-center gap-3 rounded-lg p-2">
      {first ? <Num n="C9" className="absolute -top-1 right-1" /> : null}
      <span className="bg-muted grid size-12 shrink-0 place-items-center rounded-lg text-center text-[10px] font-semibold leading-tight">{ev.day.split(" ")[0]}<span className="text-base">{ev.day.split(" ")[1]}</span></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{ev.title}</span><span className="text-muted-foreground block truncate text-xs">{ev.place}</span></span>
      <Faces handles={ev.going} size={22} />
    </Link>
  );
}

/** C10 Venture card. */
export function VentureCard({ v, first }: { v: PublicVenture; first?: boolean }) {
  return (
    <Link href={`/mentura/ventures/${v.slug}`} className="bg-card hover:border-foreground/30 relative flex gap-3 rounded-xl border p-4">
      {first ? <Num n="C10" className="absolute -top-2 right-3" /> : null}
      <span className="size-11 shrink-0 rounded-lg" style={{ background: `oklch(0.65 0.13 ${v.hue})` }} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{v.name}</span>
        <span className="text-muted-foreground line-clamp-2 block text-sm">{v.line}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="bg-muted rounded px-1.5 py-0.5">{v.phase}</span>{v.raising ? <span className="text-muted-foreground">Raising {v.raising}</span> : null}</span>
      </span>
    </Link>
  );
}

/** The heading every Mentura screen starts with. */
export function Head({ n, title, job, children }: { n: string; title: string; job?: string; children?: ReactNode }) {
  return (
    <div data-virtu-screen={n} className="flex flex-wrap items-start justify-between gap-3 pb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><Num n={n} /><h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{title}</h1></div>
        {job ? <p className="text-muted-foreground mt-1 text-sm">{job}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
