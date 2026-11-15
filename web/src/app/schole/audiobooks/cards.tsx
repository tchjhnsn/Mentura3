import Link from "next/link";
import type { ReactNode } from "react";
import { HeadphonesIcon } from "lucide-react";
import { hoursOf, type Audiobook } from "@reflect/core/audiobooks";
import { SectionHead } from "@/components/section-head";
import { coverOf } from "@/server/audiobooks";

/** Who reads a recording, as a listener chooses: one reader, many readers, or a cast. */
export const readBy = (a: Audiobook) => (a.dramatic ? "Dramatic reading" : a.readers > 1 ? `${a.readers} readers` : a.readers === 1 ? "One reader" : null);

/** One recording as a card: its cover, title, author, and how long it runs and who reads it. Tapping it opens its page. */
function AudiobookCard({ a }: { a: Audiobook }) {
  const cover = coverOf(a);
  return (
    <li className="group min-w-0">
      <Link href={`/schole/audiobooks/${a.id}`} className="flex flex-col gap-2">
        <div className="bg-muted text-muted-foreground relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border transition group-hover:opacity-90 [&_svg]:size-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover ? <img src={cover} alt="" loading="lazy" className="size-full object-cover" /> : <HeadphonesIcon />}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="line-clamp-2 text-sm font-medium group-hover:underline group-hover:underline-offset-2">{a.title}</p>
          {a.by ? <p className="text-muted-foreground line-clamp-1 text-xs">{a.by}</p> : null}
          <p className="text-muted-foreground text-[11px]">{[a.seconds ? hoursOf(a.seconds) : null, readBy(a), a.language !== "English" ? a.language : null].filter(Boolean).join(" · ")}</p>
        </div>
      </Link>
    </li>
  );
}

export function AudiobookGrid({ books, row = false }: { books: Audiobook[]; row?: boolean }) {
  return (
    <ul className={row ? "-mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&>li]:w-36 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto" : "grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6"}>
      {books.map((a) => <AudiobookCard key={a.id} a={a} />)}
    </ul>
  );
}

/** A titled row of recordings, with a link to the whole list. */
export function AudiobookRow({ title, books, href, note }: { title: ReactNode; books: Audiobook[]; href?: string; note?: ReactNode }) {
  if (!books.length) return null;
  return (
    <section className="space-y-4">
      <SectionHead title={title} note={note} href={href} className="pt-2" />
      <AudiobookGrid books={books} row />
    </section>
  );
}
