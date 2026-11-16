import Link from "next/link";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
import { LEVELS, STANCES, pointsFor, stanceLabel, type Stance } from "@reflect/core/argument";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { postCounts, type TopicPost } from "@/server/discussion-store";
import { topicKey, type TopicKind } from "@reflect/core/argument";
import { correctStanceAction, formDebateAction, regradeAction, removeTopicPostAction, topicPostAction } from "./actions";
import { Face } from "./parts";

const hidden = (path: string, topic: string) => <><input type="hidden" name="path" value={path} /><input type="hidden" name="topic" value={topic} /></>;

const STANCE_TONE: Record<Stance, string> = {
  supports: "border-emerald-600/40 text-emerald-700 dark:text-emerald-400",
  opposes: "border-rose-600/40 text-rose-700 dark:text-rose-400",
  neither: "text-muted-foreground",
};

/** Which way a post leans and how developed it is: the model's reading, or the author's correction of the stance. */
function Reading({ p, reply }: { p: TopicPost; reply: boolean }) {
  if (!p.level || !p.stance) return <span className="text-muted-foreground text-xs">Not read yet</span>;
  const l = LEVELS.find((x) => x.level === p.level)!;
  const to = reply ? "the post it answers" : "the question";
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className={cn("rounded-full border px-2 py-0.5 font-medium", STANCE_TONE[p.stance])} title={`${stanceLabel[p.stance]} ${to}${p.corrected ? ", as its author says" : ""}`}>
        {stanceLabel[p.stance]}{p.corrected ? " · by its author" : ""}
      </span>
      <span className="text-muted-foreground" title={`${l.name}: ${l.hint}${p.why ? ` ${p.why}` : ""}`}>
        <span className="text-foreground font-semibold">{l.label}</span> {l.name} · {pointsFor(p.level)} {pointsFor(p.level) === 1 ? "point" : "points"}
      </span>
    </span>
  );
}

function PostItem({ p, all, topic, path }: { p: TopicPost; all: TopicPost[]; topic: string; path: string }) {
  const kids = all.filter((x) => x.parentId === p.id);
  return (
    <li className="space-y-3">
      <div className="flex gap-3">
        <Face p={p.removed ? null : p.who} size={32} empty={p.removed} />
        <div className="min-w-0 flex-1 space-y-1.5">
          {p.removed ? <p className="text-muted-foreground text-sm italic">Taken down by its author.</p> : <>
            <p className="text-sm font-medium">{p.who.name}</p>
            <p className="leading-relaxed whitespace-pre-line">{p.body}</p>
            <Reading p={p} reply={Boolean(p.parentId)} />
            {p.why ? <p className="text-muted-foreground text-xs">{p.why}</p> : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
              <details className="group">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Reply</summary>
                <form action={topicPostAction} className="mt-2 w-[min(36rem,80vw)] space-y-2">
                  {hidden(path, topic)}<input type="hidden" name="parent" value={p.id} />
                  <Textarea name="body" required rows={3} maxLength={2000} aria-label={`Reply to ${p.who.name}`} />
                  <Button type="submit" variant="outline" size="sm">Reply</Button>
                </form>
              </details>
              <details className="group">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Debate this</summary>
                <form action={formDebateAction} className="mt-2 w-[min(36rem,80vw)] space-y-2 rounded-lg border p-3">
                  <input type="hidden" name="post" value={p.id} />
                  <label className="block space-y-1 text-sm"><span className="font-medium">Motion</span>
                    <Input name="motion" required minLength={8} maxLength={200} defaultValue={p.body.length <= 200 ? p.body : ""} placeholder="This house holds that…" />
                  </label>
                  <fieldset className="flex gap-4 text-sm"><legend className="sr-only">Your side</legend>
                    <label className="flex items-center gap-1.5"><input type="radio" name="side" value="for" defaultChecked /> I argue for</label>
                    <label className="flex items-center gap-1.5"><input type="radio" name="side" value="against" /> I argue against</label>
                  </fieldset>
                  <p className="text-muted-foreground text-xs">A written debate: each side writes in turn within a character count, For first in each round. It starts now; someone takes the other seat.</p>
                  <Button type="submit" size="sm">Start the debate</Button>
                </form>
              </details>
              {p.mine ? (
                <details className="group">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Wrong stance?</summary>
                  <form action={correctStanceAction} className="mt-2 flex flex-wrap gap-1.5">
                    {hidden(path, topic)}<input type="hidden" name="post" value={p.id} />
                    {STANCES.map((s) => <Button key={s} type="submit" name="stance" value={s} variant="outline" size="sm" aria-pressed={p.stance === s}>{stanceLabel[s]}</Button>)}
                  </form>
                </details>
              ) : null}
              {p.mine && !p.level ? (
                <form action={regradeAction}>{hidden(path, topic)}<input type="hidden" name="post" value={p.id} /><Button type="submit" variant="ghost" size="icon" className="size-7" aria-label="Read it again" title="Read it again"><RefreshCwIcon /></Button></form>
              ) : null}
              {p.mine ? (
                <form action={removeTopicPostAction}>{hidden(path, topic)}<input type="hidden" name="post" value={p.id} /><Button type="submit" variant="ghost" size="icon" className="size-7" aria-label="Take it down" title="Take it down"><Trash2Icon /></Button></form>
              ) : null}
            </div>
          </>}
        </div>
      </div>
      {kids.length ? <ul className="ml-4 space-y-5 border-l pl-4">{kids.map((k) => <PostItem key={k.id} p={k} all={all} topic={topic} path={path} />)}</ul> : null}
    </li>
  );
}

/** How a post is read and what it earns, the ladder in full. */
export function PointsLadder() {
  return (
    <details className="text-sm">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer">How posts earn points</summary>
      <div className="mt-2 space-y-2">
        <p className="text-muted-foreground">A model reads each post for which way it leans (you can correct that on your own post) and how developed its argument is. The level is its points, up to 5.</p>
        <ol className="divide-y rounded-lg border">
          {LEVELS.map((l) => <li key={l.level} className="flex gap-3 px-3 py-2"><span className="w-6 font-semibold">{l.label}</span><span><span className="font-medium">{l.name}.</span> <span className="text-muted-foreground">{l.hint}</span></span></li>)}
        </ol>
      </div>
    </details>
  );
}

/**
 * A discussion on a topic (Torian, 2026-11-16 09:43Z and 10:08Z): posts and replies to them, each read by a model for
 * its stance and its level; any post can be formalized into a written debate.
 */
export function Discussion({ topic, posts, path, prompt }: { topic: string; posts: TopicPost[]; path: string; prompt: string }) {
  const top = posts.filter((p) => !p.parentId);
  const n = posts.filter((p) => !p.removed).length;
  return (
    <section className="space-y-5" aria-labelledby="discussion">
      <div className="space-y-1">
        <h2 id="discussion" className="text-lg font-semibold tracking-tight">Discussion{n ? <span className="text-muted-foreground font-normal"> · {n}</span> : null}</h2>
        <PointsLadder />
      </div>
      <form action={topicPostAction} className="space-y-2">
        {hidden(path, topic)}
        <Textarea name="body" required rows={4} maxLength={2000} placeholder={prompt} aria-label={prompt} />
        <div className="flex items-center gap-3"><Button type="submit">Post</Button><span className="text-muted-foreground text-xs">Give your reason, a case and a source to earn more.</span></div>
      </form>
      {top.length ? <ul className="space-y-6">{top.map((p) => <PostItem key={p.id} p={p} all={posts} topic={topic} path={path} />)}</ul>
        : <p className="text-muted-foreground text-sm">No posts yet. Say where you stand and why.</p>}
    </section>
  );
}

/** Where a topic's discussion lives. */
export const topicHref = (kind: string, id: string) => `/schole/dialectic/on/${kind}/${encodeURIComponent(id)}`;

/** A link to a topic's discussion with its count, for an idea, term or work page. */
export function DiscussLink({ kind, id, count }: { kind: string; id: string; count: number }) {
  return (
    <Link href={topicHref(kind, id)} className="hover:bg-muted/50 block rounded-lg border p-3">
      <span className="font-medium">Discuss it</span>
      <span className="text-muted-foreground block text-sm">{count ? `${count} ${count === 1 ? "post" : "posts"} · ` : ""}Each post is read for its stance and earns up to 5 points.</span>
    </Link>
  );
}

/** The discussion link for a topic, with its post count looked up. */
export async function DiscussTopic({ kind, id }: { kind: TopicKind; id: string }) {
  const n = (await postCounts([topicKey(kind, id)])).get(topicKey(kind, id)) ?? 0;
  return <DiscussLink kind={kind} id={id} count={n} />;
}
