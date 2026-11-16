import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCwIcon, Trash2Icon } from "lucide-react";
import { STANCES, stanceLabel } from "@reflect/core/argument";
import { LIMITS } from "@reflect/core/dialectic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { postThread, type TopicPost } from "@/server/discussion-store";
import { LEARN } from "../../../crumbs";
import { correctStanceAction, formDebateAction, regradeAction, removeTopicPostAction } from "../../actions";
import { Compose } from "../../compose";
import { FeedPost } from "../../discussion";

export const metadata: Metadata = { title: "Post" };
export const dynamic = "force-dynamic";

/** Replies under a reply, indented one step at a time. */
function Replies({ of, all, path }: { of: string; all: TopicPost[]; path: string }) {
  const kids = all.filter((p) => p.parentId === of);
  if (!kids.length) return null;
  return (
    <ul className="divide-y">
      {kids.map((k) => (
        <li key={k.id}>
          <FeedPost item={{ post: k }} path={path} />
          {all.some((x) => x.parentId === k.id) ? <div className="ml-5 border-l pl-3"><Replies of={k.id} all={all} path={path} /></div> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * A post on its own page: the post it answers (when it is a reply), the post large, the author's own controls, Debate
 * this, the reply box and every reply under it.
 */
export default async function PostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const t = await postThread(user.id, id);
  if (!t) notFound();
  const p = t.post;
  const path = `/schole/dialectic/p/${p.id}`;
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/dialectic" crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }]} title="Post" />
      <div className="mx-auto mt-4 max-w-xl">
        {t.parent ? <div className="opacity-80"><FeedPost item={{ post: t.parent }} path={path} /></div> : null}
        <div className={t.parent ? "border-t" : ""}><FeedPost item={{ post: p }} path={path} big linked={false} /></div>

        {p.why && !p.removed ? <p className="text-muted-foreground -mt-1 pb-2 pl-14 text-xs">Why: {p.why}</p> : null}

        {p.mine && !p.removed ? (
          <div className="flex flex-wrap items-center gap-2 border-t py-2 pl-14">
            {p.parentId || p.topic ? (
              <form action={correctStanceAction} className="flex flex-wrap items-center gap-1">
                <input type="hidden" name="path" value={path} /><input type="hidden" name="post" value={p.id} />
                <span className="text-muted-foreground mr-1 text-xs">It</span>
                {STANCES.map((s) => <Button key={s} type="submit" name="stance" value={s} variant={p.stance === s ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-xs" aria-pressed={p.stance === s}>{s === "neither" ? "takes no side" : stanceLabel[s].toLowerCase()}</Button>)}
              </form>
            ) : null}
            <span className="flex-1" />
            {!p.level ? <form action={regradeAction}><input type="hidden" name="path" value={path} /><input type="hidden" name="post" value={p.id} /><Button type="submit" variant="ghost" size="icon" className="size-7" aria-label="Read it again" title="Read it again"><RefreshCwIcon /></Button></form> : null}
            <form action={removeTopicPostAction}><input type="hidden" name="path" value="/schole/dialectic" /><input type="hidden" name="post" value={p.id} /><Button type="submit" variant="ghost" size="icon" className="size-7" aria-label="Take it down" title="Take it down"><Trash2Icon /></Button></form>
          </div>
        ) : null}

        {!p.removed && !p.debate ? (
          <details id="debate" open={Boolean(sp.debate)} className="border-t py-3">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-sm">Debate this</summary>
            <form action={formDebateAction} className="mt-3 space-y-3 rounded-lg border p-3">
              <input type="hidden" name="post" value={p.id} />
              <label className="block space-y-1 text-sm"><span className="font-medium">Motion</span>
                <Input name="motion" required minLength={8} maxLength={200} defaultValue={p.body.length <= 200 ? p.body : ""} placeholder="This house holds that…" />
              </label>
              <fieldset className="flex gap-4 text-sm"><legend className="sr-only">Your side</legend>
                <label className="flex items-center gap-1.5"><input type="radio" name="side" value="for" defaultChecked /> I argue for</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="side" value="against" /> I argue against</label>
              </fieldset>
              <p className="text-muted-foreground text-xs">A written debate: each side writes in turn within a character count, For first in each round. It starts now, and anyone can take the other seat.</p>
              <Button type="submit" size="sm" className="rounded-full">Start the debate</Button>
            </form>
          </details>
        ) : null}

        <div id="reply" className="border-t py-3">
          <Compose path={path} max={LIMITS.post} placeholder={`Reply to ${p.who.name}`} parent={p.id} rows={2} cta="Reply" />
        </div>

        <section className="border-t" aria-label="Replies">
          {t.replies.length ? <Replies of={p.id} all={t.replies} path={path} /> : <p className="text-muted-foreground py-6 text-sm">No replies yet.</p>}
        </section>
        <p className="py-4 text-sm"><Link href="/schole/dialectic" className="text-muted-foreground hover:underline">Back to the feed</Link></p>
      </div>
    </main>
  );
}
