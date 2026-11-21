"use client";

// M12 Post, after Contra's feed post opened on its own: the post in full, its thread of replies, and a reply composer.
import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, HeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Num } from "@/components/studio/bits";
import { ME, postOf } from "@/components/mentura/data";
import { Composer, Face, PostCard } from "@/components/mentura/parts";

type Reply = { by: string; when: string; text: string; likes: number };

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const post = postOf(id);
  const [mine, setMine] = useState<Reply[]>([]);
  const replies = [...(post.thread ?? []), ...mine];

  return (
    <div data-virtu-screen="M12" className="px-4 py-5 md:px-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/mentura" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"><ArrowLeftIcon className="size-4" />Home</Link>
          <Num n="M12" className="ml-auto" />
        </div>

        <PostCard post={post} first full />

        <section className="relative">
          <Num n="M12.1" className="absolute -top-2 right-0" />
          <h2 className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">Replies · {replies.length}</h2>
          {replies.length ? (
            <ul className="divide-y rounded-xl border">
              {replies.map((r, i) => <ReplyRow key={i} r={r} />)}
            </ul>
          ) : <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">No replies yet. Be the first to answer.</p>}
        </section>

        <div className="relative">
          <Num n="M12.2" className="absolute -top-2 right-0" />
          <Composer placeholder="Write a reply" onPost={(text) => setMine((m) => [...m, { by: ME, when: "now", text, likes: 0 }])} />
        </div>
      </div>
    </div>
  );
}

function ReplyRow({ r }: { r: Reply }) {
  const [liked, setLiked] = useState(false);
  return (
    <li className="p-4">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1"><Face handle={r.by} size={32} sub={r.when} /></span>
      </div>
      <p className="mt-2 pl-[42px] text-[15px] leading-relaxed">{r.text}</p>
      <div className="mt-2 pl-[42px]">
        <button type="button" onClick={() => setLiked(!liked)} aria-pressed={liked} className={cn("text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs", liked && "text-rose-600")}>
          <HeartIcon className={cn("size-4", liked && "fill-current")} />{r.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </li>
  );
}
