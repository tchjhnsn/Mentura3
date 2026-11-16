import Link from "next/link";
import { MessageCircleIcon, Repeat2Icon, ScaleIcon } from "lucide-react";
import { LEVELS, parseTopic, pointsFor, stanceLabel, topicKey, type Stance, type TopicKind } from "@reflect/core/argument";
import { LIMITS } from "@reflect/core/dialectic";
import { DIALECTICS } from "@reflect/core/dialectics";
import { IDEAS, TERMS } from "@reflect/core/great-ideas";
import { WORKS } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { postCounts, topicName, type FeedItem, type TopicPost } from "@/server/discussion-store";
import { repostAction } from "./actions";
import { Compose, type TagGroup } from "./compose";
import { Face } from "./parts";

/** Where a topic's feed lives. */
export const topicHref = (kind: string, id: string) => `/schole/dialectic/on/${kind}/${encodeURIComponent(id)}`;
const tagHref = (topic: string | null) => { const t = topic ? parseTopic(topic) : null; return t ? topicHref(t.kind, t.id) : null; };

/** How long ago, the way feeds say it: now, 5m, 3h, 2d, then the date. */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Every topic a post can be tagged with, grouped, for the write box. */
export const TAGS: TagGroup[] = [
  { label: "Questions", options: DIALECTICS.map((d) => ({ value: topicKey("dialectic", d.id), label: d.question })) },
  { label: "Great Ideas", options: IDEAS.map((i) => ({ value: topicKey("idea", i.id), label: i.name })) },
  { label: "Terms", options: TERMS.map((t) => ({ value: topicKey("term", t.id), label: t.name })) },
  { label: "Works", options: [...WORKS].sort((a, b) => a.title.localeCompare(b.title)).map((w) => ({ value: topicKey("work", w.id), label: `${w.title}, ${w.by}` })) },
];

export function WriteBox({ path, topic, placeholder = "Say where you stand, and why" }: { path: string; topic?: string; placeholder?: string }) {
  return <Compose path={path} max={LIMITS.post} placeholder={placeholder} {...(topic ? { topic } : { tags: TAGS })} />;
}

const STANCE_TONE: Record<Stance, string> = {
  supports: "text-emerald-700 dark:text-emerald-400",
  opposes: "text-rose-700 dark:text-rose-400",
  neither: "text-muted-foreground",
};

/** Which way a post leans (when it answers something) and how developed it is, as one small line. */
export function Reading({ p }: { p: TopicPost }) {
  if (!p.level || !p.stance) return <p className="text-muted-foreground text-xs">Not read yet</p>;
  const l = LEVELS.find((x) => x.level === p.level)!;
  const answers = Boolean(p.parentId || p.topic);
  return (
    <p className="text-muted-foreground text-xs" title={`${l.name}: ${l.hint}${p.why ? ` ${p.why}` : ""}`}>
      {answers && p.stance !== "neither" ? <><span className={cn("font-medium", STANCE_TONE[p.stance])}>{stanceLabel[p.stance]}{p.corrected ? " (by its author)" : ""}</span> · </> : null}
      <span className="text-foreground font-semibold">{l.label}</span> {l.name} · {pointsFor(p.level)} {pointsFor(p.level) === 1 ? "point" : "points"}
    </p>
  );
}

/** A post in a feed: who, when, its tag, the text, its reading, and reply, repost and Debate this as icons. */
export function FeedPost({ item, path, big = false, linked = true }: { item: FeedItem | { post: TopicPost; repostedBy?: null }; path: string; big?: boolean; linked?: boolean }) {
  const p = item.post;
  const href = `/schole/dialectic/p/${p.id}`;
  const tag = topicName(p.topic);
  const tagLink = tagHref(p.topic);
  return (
    <article className="relative flex gap-3 py-3">
      <Link href={`/schole/dialectic/u/${p.who.id}`} className="relative z-10 shrink-0" aria-label={p.who.name}><Face p={p.removed ? null : p.who} size={big ? 44 : 40} empty={p.removed} /></Link>
      <div className="min-w-0 flex-1 space-y-1">
        {item.repostedBy ? <p className="text-muted-foreground flex items-center gap-1 text-xs"><Repeat2Icon className="size-3.5" />{item.repostedBy.name} reposted</p> : null}
        <p className="flex min-w-0 items-baseline gap-1 text-sm">
          <Link href={`/schole/dialectic/u/${p.who.id}`} className="relative z-10 truncate font-semibold hover:underline">{p.who.name}</Link>
          <span className="text-muted-foreground shrink-0">· {ago(p.createdAt)}</span>
        </p>
        {tag && tagLink ? <Link href={tagLink} className="text-muted-foreground relative z-10 line-clamp-1 text-xs hover:underline">on {tag}</Link> : null}
        {p.removed ? <p className="text-muted-foreground text-sm italic">Taken down by its author.</p> : (
          <p className={cn("leading-relaxed break-words whitespace-pre-line", big ? "text-[17px]" : "text-[15px]")}>
            {linked ? <Link href={href} className="after:absolute after:inset-0">{p.body}</Link> : p.body}
          </p>
        )}
        {p.removed ? null : <Reading p={p} />}
        {p.debate ? (
          <Link href={`/schole/dialectic/debates/${p.debate.id}`} className="hover:bg-muted/50 relative z-10 mt-1 flex items-center gap-2 rounded-lg border p-2.5 text-sm">
            <ScaleIcon className="text-muted-foreground size-4 shrink-0" /><span className="min-w-0"><span className="text-muted-foreground block text-xs">Written debate</span><span className="line-clamp-2 font-medium">{p.debate.motion}</span></span>
          </Link>
        ) : null}
        {p.removed ? null : (
          <div className="text-muted-foreground relative z-10 -ml-2 flex items-center gap-4 pt-0.5">
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 font-normal"><Link href={`${href}#reply`} aria-label="Reply" title="Reply"><MessageCircleIcon className="size-4" />{p.replies || ""}</Link></Button>
            <form action={repostAction}>
              <input type="hidden" name="post" value={p.id} /><input type="hidden" name="on" value={p.reposted ? "0" : "1"} /><input type="hidden" name="path" value={path} />
              <Button type="submit" variant="ghost" size="sm" className={cn("h-8 gap-1.5 px-2 font-normal", p.reposted && "text-emerald-700 dark:text-emerald-400")} aria-label={p.reposted ? "Undo repost" : "Repost"} title={p.reposted ? "Undo repost" : "Repost"} aria-pressed={p.reposted}><Repeat2Icon className="size-4" />{p.reposts || ""}</Button>
            </form>
            {p.debate ? null : <Button asChild variant="ghost" size="sm" className="h-8 px-2"><Link href={`${href}?debate=1#debate`} aria-label="Debate this" title="Debate this"><ScaleIcon className="size-4" /></Link></Button>}
          </div>
        )}
      </div>
    </article>
  );
}

/** A feed: posts newest first, or a note when there are none. */
export function Feed({ items, path, empty }: { items: FeedItem[]; path: string; empty: string }) {
  if (!items.length) return <p className="text-muted-foreground py-6 text-sm">{empty}</p>;
  return <ul className="divide-y">{items.map((i) => <li key={`${i.post.id}-${i.repostedBy?.id ?? ""}`}><FeedPost item={i} path={path} /></li>)}</ul>;
}

/** How a post is read and what it earns, the ladder in full. */
export function PointsLadder() {
  return (
    <details className="text-sm">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer">How posts earn points</summary>
      <div className="mt-2 space-y-2">
        <p className="text-muted-foreground">A model reads each post for how developed its argument is, and, when it answers a question, a topic or another post, which way it leans (you can correct that on your own post). The level is its points, up to 5.</p>
        <ol className="divide-y rounded-lg border">
          {LEVELS.map((l) => <li key={l.level} className="flex gap-3 px-3 py-2"><span className="w-6 font-semibold">{l.label}</span><span><span className="font-medium">{l.name}.</span> <span className="text-muted-foreground">{l.hint}</span></span></li>)}
        </ol>
      </div>
    </details>
  );
}

/** A link to a topic's feed with its count, for an idea, term or work page. */
export function DiscussLink({ kind, id, count }: { kind: string; id: string; count: number }) {
  return (
    <Link href={topicHref(kind, id)} className="hover:bg-muted/50 block rounded-lg border p-3">
      <span className="font-medium">Discuss it</span>
      <span className="text-muted-foreground block text-sm">{count ? `${count} ${count === 1 ? "post" : "posts"} in Dialectic` : "Posts tagged with it in Dialectic"}</span>
    </Link>
  );
}

/** The discussion link for a topic, with its post count looked up. */
export async function DiscussTopic({ kind, id }: { kind: TopicKind; id: string }) {
  const n = (await postCounts([topicKey(kind, id)])).get(topicKey(kind, id)) ?? 0;
  return <DiscussLink kind={kind} id={id} count={n} />;
}
