"use client";

import Link from "next/link";
import { useTransition } from "react";
import { NotebookPenIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Snip } from "@/server/snips-store";
import { stamp, useListen } from "../player";
import { removeSnipAction } from "./actions";

export function SnipRow({ s }: { s: Snip }) {
  const listen = useListen();
  const [pending, start] = useTransition();
  const about = `${s.title}${s.by ? `, ${s.by}` : ""}, at ${stamp(s.at)}`;
  return (
    <div className="flex items-center gap-3 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {s.image ? <img src={s.image} alt="" className="size-12 shrink-0 rounded-md border object-cover" /> : <span className="bg-muted size-12 shrink-0 rounded-md" />}
      <div className="min-w-0 flex-1">
        <Link href={s.href} className="block truncate font-medium hover:underline">{s.title}</Link>
        <p className="text-muted-foreground truncate text-xs tabular-nums">{[s.by, s.chapterTitle, `at ${stamp(s.at)}`, s.createdAt ? new Date(s.createdAt).toLocaleDateString() : null].filter(Boolean).join(" · ")}</p>
      </div>
      {s.track && listen ? (
        <Button size="sm" variant="secondary" onClick={() => listen.playTrack({ ...s.track!, image: s.track!.image ?? null }, s.at)} aria-label={`Play ${s.title} from ${stamp(s.at)}`}><PlayIcon />Play from here</Button>
      ) : (
        <Button size="sm" variant="secondary" asChild><Link href={s.href}><PlayIcon />Open</Link></Button>
      )}
      <Button size="icon-sm" variant="ghost" asChild aria-label="Write about it in your journal" title="Write about it in your journal">
        <Link href={`/journal/new?about=${encodeURIComponent(about)}&domain=learn`}><NotebookPenIcon /></Link>
      </Button>
      <Button size="icon-sm" variant="ghost" disabled={pending} aria-label="Remove this snip" title="Remove this snip" onClick={() => start(() => removeSnipAction(s.id))}><Trash2Icon /></Button>
    </div>
  );
}
