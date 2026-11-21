"use client";

// L1.6 A unit's media (Torian, 2026-11-21: a course uses every medium Scholē has): the audiobook chapters for that part
// of the work, played in Scholē's player; podcast episodes on it; lectures on it. Reading is the lessons below.
import { HeadphonesIcon, MicIcon, PlayIcon, PauseIcon, TvIcon } from "lucide-react";
import type { Audiobook } from "@reflect/core/librivox";
import type { Episode, Lecture, UnitMedia } from "@reflect/core/aristotle/media";
import { Num } from "@/components/studio/bits";
import { useListen } from "../../player";

export type Book = { book: Audiobook; title: string; cover: string | null; page: string };

const mins = (s: number) => `${Math.max(1, Math.round(s / 60))} min`;

function Out({ href, icon: Icon, title, by, minutes }: { href: string; icon: typeof MicIcon; title: string; by: string; minutes?: number }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="hover:bg-accent flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="min-w-0 flex-1"><span className="block truncate">{title}</span><span className="text-muted-foreground block truncate text-xs">{[by, minutes ? `${minutes} min` : null].filter(Boolean).join(" · ")}</span></span>
    </a>
  );
}

export function UnitMediaRow({ media, book }: { media: UnitMedia | null; book: Book | null }) {
  const listen = useListen();
  const chapters = (media?.chapters ?? []).map((n) => n - 1).filter((i) => book && i >= 0 && i < book.book.chapters.length);
  const episodes: Episode[] = media?.episodes ?? [];
  const lectures: Lecture[] = media?.lectures ?? [];
  if (!chapters.length && !episodes.length && !lectures.length) return null;
  const playing = book ? { ...book.book, work: "", bookTitle: book.title, cover: book.cover, page: book.page } : null;
  return (
    <div className="relative mt-3 grid gap-2 sm:grid-cols-2">
      <Num n="L1.6" className="absolute -top-2 right-0" />
      {playing && book && chapters.length ? (() => {
        // One row for the unit's part of the recording: it plays from the first chapter, or the one already playing,
        // and the player goes on chapter by chapter.
        const here = listen?.book?.id === book.book.id && chapters.includes(listen.chapter);
        const seconds = chapters.reduce((n, i) => n + book.book.chapters[i]!.seconds, 0);
        const first = book.book.chapters[chapters[0]!]!.title;
        return (
          <button type="button" onClick={() => (here ? listen!.toggle() : listen?.play(playing, chapters[0]))} className="hover:bg-accent flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm">
            {here && listen!.playing ? <PauseIcon className="size-4 shrink-0" /> : <HeadphonesIcon className="text-muted-foreground size-4 shrink-0" />}
            <span className="min-w-0 flex-1"><span className="block truncate">{here && listen!.playing ? "Pause" : here ? "Resume" : "Listen to this part"}</span><span className="text-muted-foreground block truncate text-xs">Audiobook · {chapters.length === 1 ? first : `${chapters.length} chapters from ${first}`} · {mins(seconds)}</span></span>
            {here && listen!.playing ? null : <PlayIcon className="text-muted-foreground size-3.5" />}
          </button>
        );
      })() : null}
      {episodes.map((e) => <Out key={e.url} href={e.url} icon={MicIcon} title={e.title} by={e.show} minutes={e.minutes} />)}
      {lectures.map((l) => <Out key={l.url} href={l.url} icon={TvIcon} title={l.title} by={l.by} minutes={l.minutes} />)}
    </div>
  );
}

/** Course-wide episodes and lectures, beside About this course. */
export function CourseMediaList({ episodes, lectures }: { episodes: Episode[]; lectures: Lecture[] }) {
  if (!episodes.length && !lectures.length) return null;
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {episodes.map((e) => <Out key={e.url} href={e.url} icon={MicIcon} title={e.title} by={e.show} minutes={e.minutes} />)}
      {lectures.map((l) => <Out key={l.url} href={l.url} icon={TvIcon} title={l.title} by={l.by} minutes={l.minutes} />)}
    </div>
  );
}
