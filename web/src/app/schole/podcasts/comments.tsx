"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ReplyIcon, Trash2Icon } from "lucide-react";
import type { EpisodeComment } from "@/server/comment-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { stamp as clock, useListen, type Track } from "../player";
import { commentAction, removeCommentAction, type CommentState } from "./comment-actions";

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function Post({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}>{pending ? "Posting" : label}</Button>;
}

type Where = { feed: string; episode: string; path: string; track: Track | null };

/** The box to say something, or to answer a comment; it can carry the place the person is at in the episode. */
function CommentForm({ where, parent, onDone, autoFocus = false }: { where: Where; parent?: string; onDone?: () => void; autoFocus?: boolean }) {
  const [state, act] = useActionState<CommentState, FormData>(commentAction, {});
  const listen = useListen();
  const form = useRef<HTMLFormElement>(null);
  const [withTime, setWithTime] = useState(false);
  const here = Boolean(where.track && listen?.track?.id === where.track.id && listen.time > 1);
  const at = here ? Math.floor(listen!.time) : null;
  useEffect(() => { if (state.ok) { form.current?.reset(); setWithTime(false); onDone?.(); } }, [state.ok, onDone]);
  return (
    <form ref={form} action={act} className="space-y-2">
      <input type="hidden" name="feed" value={where.feed} />
      <input type="hidden" name="episode" value={where.episode} />
      <input type="hidden" name="path" value={where.path} />
      {parent ? <input type="hidden" name="parent" value={parent} /> : null}
      {withTime && at !== null ? <input type="hidden" name="at" value={at} /> : null}
      <label htmlFor={`c-${parent ?? "new"}`} className="sr-only">{parent ? "Your reply" : "Your comment"}</label>
      <Textarea id={`c-${parent ?? "new"}`} name="body" required maxLength={4000} rows={parent ? 2 : 3} autoFocus={autoFocus} placeholder={parent ? "Reply" : "Say something about this episode"} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {here ? (
          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            <input type="checkbox" checked={withTime} onChange={(e) => setWithTime(e.target.checked)} className="accent-foreground" />
            At {clock(at!)} in the episode
          </label>
        ) : <span />}
        <div className="flex items-center gap-2">
          {onDone && parent ? <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button> : null}
          <Post label={parent ? "Reply" : "Post"} />
        </div>
      </div>
      {state.error ? <p className="text-destructive text-xs">{state.error}</p> : null}
    </form>
  );
}

function One({ c, replies, where }: { c: EpisodeComment; replies: EpisodeComment[]; where: Where }) {
  const [replying, setReplying] = useState(false);
  const listen = useListen();
  return (
    <li className="space-y-2">
      <div className="flex gap-3">
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
        ) : <span aria-hidden className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">{c.removed ? "" : c.name.slice(0, 1).toUpperCase()}</span>}
        <div className="min-w-0 flex-1 space-y-1">
          {c.removed ? <p className="text-muted-foreground text-sm italic">Taken down by its author.</p> : (
            <>
              <p className="text-xs"><span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {ago(c.createdAt)}</span>
                {c.at !== null ? <> <span className="text-muted-foreground">·</span> <button type="button" className="text-muted-foreground tabular-nums underline underline-offset-2 hover:text-foreground" onClick={() => where.track && listen?.playTrack(where.track, c.at!)}>at {clock(c.at)}</button></> : null}
              </p>
              <p className="text-sm whitespace-pre-line break-words">{c.body}</p>
            </>
          )}
          {!c.removed ? (
            <div className="-ml-2 flex items-center">
              {!c.parentId ? <Button type="button" size="sm" variant="ghost" className="text-muted-foreground h-7" onClick={() => setReplying((v) => !v)}><ReplyIcon />Reply</Button> : null}
              {c.mine ? (
                <form action={removeCommentAction}>
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="path" value={where.path} />
                  <Button type="submit" size="icon" variant="ghost" className="text-muted-foreground size-7" aria-label="Take down your comment" title="Take down your comment"><Trash2Icon /></Button>
                </form>
              ) : null}
            </div>
          ) : null}
          {replies.length ? <ul className="space-y-3 border-l pt-1 pl-4">{replies.map((r) => <One key={r.id} c={r} replies={[]} where={where} />)}</ul> : null}
          {replying ? <CommentForm where={where} parent={c.id} onDone={() => setReplying(false)} autoFocus /> : null}
        </div>
      </div>
    </li>
  );
}

/**
 * An episode's comments (Torian, 2026-11-15 16:20Z): people talking to each other about it, not questions to a model.
 * The newest come first, each with its replies under it oldest first; a comment can carry the place in the episode it
 * is about, and tapping that plays from there.
 */
export function Comments({ comments, feed, episode, path, track }: { comments: EpisodeComment[] } & Where) {
  const where = { feed, episode, path, track };
  const top = comments.filter((c) => !c.parentId).reverse();
  const shown = comments.filter((c) => !c.removed).length;
  return (
    <section className="space-y-4" id="comments">
      <h2 className="text-sm font-medium">Comments{shown ? ` · ${shown}` : ""}</h2>
      <CommentForm where={where} />
      {top.length ? <ul className="space-y-5">{top.map((c) => <One key={c.id} c={c} replies={comments.filter((r) => r.parentId === c.id)} where={where} />)}</ul> : <p className="text-muted-foreground text-sm">No one has said anything yet.</p>}
    </section>
  );
}
