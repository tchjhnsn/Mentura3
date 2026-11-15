"use client";

import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import type { Audiobook } from "@reflect/core/librivox";
import { Button } from "@/components/ui/button";
import { clock, listenPlace, useListen } from "../../player";

const left = (book: Audiobook, chapter: number, at: number) => book.chapters.slice(chapter).reduce((s, c) => s + c.seconds, 0) - at;
const short = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`; };

/**
 * An audiobook's play pill and its chapters (Torian, 2026-11-15 08:26Z, the way an episode plays): Play with its
 * length, or Continue with the time left once started in this browser; each chapter plays from its start.
 */
export function AudiobookPlay({ book, title, cover, page, by, work = "" }: { book: Audiobook; title: string; cover: string | null; page?: string; by?: string; /** The book page it belongs to, when there is one. */ work?: string }) {
  const listen = useListen();
  const [place, setPlace] = useState<{ chapter: number; at: number } | null>(null);
  useEffect(() => setPlace(listenPlace(book.id)), [book.id]);
  const here = listen?.book?.id === book.id;
  const playing = { ...book, work, bookTitle: title, cover, ...(page ? { page } : {}) };
  const now = here ? { chapter: listen!.chapter, at: listen!.time } : place;
  const started = Boolean(now && (now.chapter > 0 || now.at > 30));
  const readers = [...new Set(book.chapters.map((c) => c.reader).filter(Boolean))];
  const readBy = by ?? (readers.length === 1 ? readers[0]! : readers.length > 1 ? `${readers.length} readers` : "");
  const total = book.seconds || book.chapters.reduce((s, c) => s + c.seconds, 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button className="rounded-full" onClick={() => (here ? listen!.toggle() : listen?.play(playing))}>
          {here && listen!.playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}
          {here && listen!.playing ? "Pause" : started && now ? `Continue · ${short(Math.max(60, left(book, now.chapter, now.at)))} left` : `Play · ${short(total)}`}
        </Button>
        {readBy ? <span className="text-muted-foreground text-sm">Read by {readBy}</span> : null}
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-medium">Chapters</h2>
        <ol className="max-h-[28rem] divide-y overflow-y-auto rounded-lg border text-sm">
          {book.chapters.map((x, i) => {
            const on = here && listen!.chapter === i;
            return (
              <li key={x.url}>
                <button type="button" onClick={() => listen?.play(playing, i)} aria-current={on ? "true" : undefined} className={`hover:bg-accent flex w-full items-baseline gap-3 px-3 py-2 text-left ${on ? "bg-muted font-medium" : ""}`}>
                  <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">{on ? <PlayIcon className="inline size-3" /> : i + 1}</span>
                  <span className="min-w-0 flex-1">{x.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{x.seconds ? clock(x.seconds) : ""}{x.reader && book.chapters.some((c) => c.reader !== x.reader) ? ` · ${x.reader}` : ""}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
