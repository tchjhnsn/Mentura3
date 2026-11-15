"use client";

import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";
import type { Audiobook } from "@reflect/core/librivox";
import { Button } from "@/components/ui/button";
import { clock, listenPlace, useListen } from "../../player";

const left = (book: Audiobook, chapter: number, at: number) => book.chapters.slice(chapter).reduce((s, c) => s + c.seconds, 0) - at;
const short = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`; };

type Props = { book: Audiobook; title: string; cover: string | null; page?: string; by?: string; /** The book page it belongs to, when there is one. */ work?: string };

/** Where the person is in a book: in the player now, else where this browser last stopped. */
function useBook({ book, title, cover, page, work = "" }: Props) {
  const listen = useListen();
  const [place, setPlace] = useState<{ chapter: number; at: number } | null>(null);
  useEffect(() => setPlace(listenPlace(book.id)), [book.id]);
  const here = listen?.book?.id === book.id;
  const playing = { ...book, work, bookTitle: title, cover, ...(page ? { page } : {}) };
  const now = here ? { chapter: listen!.chapter, at: listen!.time } : place;
  const started = Boolean(now && (now.chapter > 0 || now.at > 30));
  return { listen, here, playing, now, started };
}

/**
 * An audiobook's one filled button (Scholē page priority guides, 2026-11-15): Play with its length, or Continue naming
 * the chapter and the time left once started in this browser. Large, and full width on a phone.
 */
export function AudiobookButton(p: Props) {
  const { listen, here, playing, now, started } = useBook(p);
  const total = p.book.seconds || p.book.chapters.reduce((s, c) => s + c.seconds, 0);
  return (
    <Button size="lg" className="h-11 w-full rounded-full px-6 text-base sm:w-auto" onClick={() => (here ? listen!.toggle() : listen?.play(playing))}>
      {here && listen!.playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}
      {here && listen!.playing ? "Pause" : started && now ? `Continue chapter ${now.chapter + 1} · ${short(Math.max(60, left(p.book, now.chapter, now.at)))} left` : `Play · ${short(total)}`}
    </Button>
  );
}

/** An audiobook's chapters, numbered with their lengths; the one under way is marked with how far it has got. */
export function AudiobookChapters(p: Props & { scroll?: boolean }) {
  const { listen, here, playing, now, started } = useBook(p);
  const book = p.book;
  // A long book shows ten chapters around where you are, and the rest on asking: on a phone, 128 rows bury the page.
  const [all, setAll] = useState(false);
  const at = started && now ? now.chapter : 0;
  const from = Math.max(0, Math.min(at - 2, book.chapters.length - 10));
  const fold = !p.scroll && !all && book.chapters.length > 12;
  const shown = fold ? book.chapters.map((x, i) => [x, i] as const).slice(from, from + 10) : book.chapters.map((x, i) => [x, i] as const);
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold">Chapters <span className="text-muted-foreground font-normal">{book.chapters.length}</span></h2>
      <ol className={`divide-y rounded-lg border text-sm ${p.scroll ? "max-h-[28rem] overflow-y-auto" : ""}`}>
        {shown.map(([x, i]) => {
          const on = here && listen!.chapter === i;
          const current = started && now?.chapter === i;
          const done = Boolean(started && now && i < now.chapter);
          const share = current && x.seconds ? Math.min(1, (now!.at) / x.seconds) : 0;
          return (
            <li key={x.url} className="relative">
              <button type="button" onClick={() => listen?.play(playing, i)} aria-current={current ? "true" : undefined} className={`hover:bg-accent flex w-full items-baseline gap-3 px-3 py-2.5 text-left ${current ? "bg-muted font-semibold" : ""} ${done ? "text-muted-foreground" : ""}`}>
                <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">{on ? <PlayIcon className="inline size-3" /> : i + 1}</span>
                <span className="min-w-0 flex-1">{x.title}{x.reader && book.chapters.some((c) => c.reader !== x.reader) ? <span className="text-muted-foreground block truncate text-xs font-normal">{x.reader}</span> : null}</span>
                <span className="text-muted-foreground shrink-0 text-xs font-normal tabular-nums">{x.seconds ? clock(x.seconds) : ""}</span>
              </button>
              {current ? <span aria-hidden className="bg-foreground absolute bottom-0 left-0 h-0.5" style={{ width: `${Math.round(share * 100)}%` }} /> : null}
            </li>
          );
        })}
      </ol>
      {fold ? <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={() => setAll(true)}>All {book.chapters.length} chapters</Button> : null}
    </section>
  );
}

/**
 * An audiobook's play pill and its chapters (Torian, 2026-11-15 08:26Z, the way an episode plays), for a page that
 * shows both together, such as a book's.
 */
export function AudiobookPlay(p: Props) {
  const readers = [...new Set(p.book.chapters.map((c) => c.reader).filter(Boolean))];
  const readBy = p.by ?? (readers.length === 1 ? readers[0]! : readers.length > 1 ? `${readers.length} readers` : "");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <AudiobookButton {...p} />
        {readBy ? <span className="text-muted-foreground text-sm">Read by {readBy}</span> : null}
      </div>
      <AudiobookChapters {...p} scroll />
    </div>
  );
}
