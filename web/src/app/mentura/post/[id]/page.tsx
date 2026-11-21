"use client";

// M12 Post, after Contra's post detail (data.ts REFS.post): the post in full, a "Post your reply" box right under it, then
// the replies, each with a like. Your replies are kept across screens (store.tsx) and count on the post in the feed.
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, HeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { ME, POSTS } from "@/components/mentura/data";
import { Face, PostCard } from "@/components/mentura/parts";
import { useMentura } from "@/components/mentura/store";

type Reply = { by: string; when: string; text: string; likes: number };

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { posts, replies: kept, addReply, has, toggle } = useMentura();
  const post = [...posts, ...POSTS].find((p) => p.id === id);
  const [text, setText] = useState("");
  if (!post) return <p className="text-muted-foreground p-8 text-sm">This post is gone. <Link href="/mentura" className="underline">Back to Home</Link></p>;
  const replies = [...(post.thread ?? []), ...(kept[post.id] ?? [])];
  const reply = () => { const t = text.trim(); if (!t) return; addReply(post.id, t); setText(""); };

  return (
    <div data-virtu-screen="M12" className="px-4 py-5 md:px-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/mentura" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"><ArrowLeftIcon className="size-4" />Home</Link>
          <Num n="M12" className="ml-auto" />
        </div>

        <PostCard post={post} first full />

        <form onSubmit={(e) => { e.preventDefault(); reply(); }} className="bg-card relative flex items-start gap-3 rounded-xl border p-3">
          <Num n="M12.1" className="absolute -top-2 right-3" />
          <Face handle={ME} size={32} name={false} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Post your reply" aria-label="Post your reply"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); reply(); } }}
            className="placeholder:text-muted-foreground min-h-10 flex-1 resize-none bg-transparent pt-1.5 text-[15px] outline-none" />
          <Button type="submit" size="sm" disabled={!text.trim()}>Reply</Button>
        </form>

        <section className="relative">
          <Num n="M12.2" className="absolute -top-2 right-0" />
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Replies · {replies.length}</h2>
          {replies.length ? (
            <ul className="divide-y rounded-xl border">
              {replies.map((r, i) => { const key = `${post.id}:${i}`; return <ReplyRow key={key} r={r} liked={has("likes", key)} onLike={() => toggle("likes", key)} />; })}
            </ul>
          ) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No replies yet. Be the first to answer.</p>}
        </section>
      </div>
    </div>
  );
}

function ReplyRow({ r, liked, onLike }: { r: Reply; liked: boolean; onLike: () => void }) {
  return (
    <li className="p-4">
      <Face handle={r.by} size={32} sub={r.when} />
      <p className="mt-2 pl-[42px] text-[15px] leading-relaxed">{r.text}</p>
      <div className="mt-2 pl-[42px]">
        <button type="button" onClick={onLike} aria-pressed={liked} className={cn("text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs", liked && "text-rose-600")}>
          <HeartIcon className={cn("size-4", liked && "fill-current")} />{r.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </li>
  );
}
