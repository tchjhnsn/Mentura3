import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeadphonesIcon } from "lucide-react";
import { audiobookTopics, hoursOf, topicOf } from "@reflect/core/audiobooks";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { audiobookById, coverOf, listAudiobooks, recordingOf } from "@/server/audiobooks";
import { browseCrumbs } from "../../crumbs";
import { AudiobookRow, readBy } from "../cards";
import { AudiobookButton, AudiobookChapters } from "./play";
import { Clamp } from "../../people/clamp";

export const metadata: Metadata = { title: "Audiobook" };
export const dynamic = "force-dynamic";

/**
 * An audiobook from LibriVox, heard here the way an episode is (Torian, 2026-11-15 08:26Z), laid out by the Scholē
 * page priority guides: cover, title and author with Play (or Continue, naming the chapter) as the page's largest
 * control; one metadata line, topics and two lines about the recording; the chapters as a list under the hero; more
 * by the same author and on its first topic at the foot.
 */
export default async function AudiobookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,7}$/.test(id)) notFound();
  const entry = audiobookById(id);
  const rec = await recordingOf(id);
  if (!rec) notFound();
  const title = entry?.title ?? rec.title;
  const cover = entry ? coverOf(entry) : null;
  const topics = entry ? audiobookTopics(entry.genres).map(topicOf).filter((t) => t !== undefined) : [];
  const author = entry?.by.split(",")[0]?.trim() ?? "";
  const same = author ? listAudiobooks({ q: author, language: "all" }, 13).filter((a) => a.id !== id).slice(0, 12) : [];
  const like = topics[0] ? listAudiobooks({ topic: topics[0].id, language: entry?.language ?? "English" }, 13).filter((a) => a.id !== id).slice(0, 12) : [];
  const props = { book: rec, title, cover, page: `/schole/audiobooks/${id}` };
  const meta = [hoursOf(rec.seconds || entry?.seconds || 0), `${rec.chapters.length} chapters`, entry ? readBy(entry) : null, entry && entry.language !== "English" ? entry.language : null].filter(Boolean).join(" · ");
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse?m=audiobooks" crumbs={browseCrumbs("audiobooks")} title={title} />
      <div className="mt-8 space-y-10">
        <header className="grid gap-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
          <div className="mx-auto w-44 sm:mx-0 sm:w-full">
            <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center overflow-hidden rounded-lg border shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {cover ? <img src={cover} alt={`Cover of ${title}`} className="size-full object-cover" /> : <HeadphonesIcon className="size-8" />}
            </div>
          </div>
          <div className="min-w-0 space-y-4 sm:pt-2">
            <div className="space-y-1.5">
              <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{title}</h1>
              {entry?.by ? <p className="text-base">{entry.by}</p> : null}
              <p className="text-muted-foreground text-[13px]">{meta}</p>
            </div>
            {topics.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {topics.map((t) => <li key={t.id}><Link href={`/schole/topics/${t.id}`} className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-6 items-center rounded-full border px-2.5 text-xs">{t.label}</Link></li>)}
              </ul>
            ) : null}
            <AudiobookButton {...props} />
            {rec.about ? (
              <div className="text-muted-foreground">
                <Clamp text={rec.about}>
                  From <a href={rec.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">LibriVox</a>, read by volunteers; the book is in the public domain. <Link href={`/schole/browse?m=books&q=${encodeURIComponent(`${title} ${author}`.trim())}`} className="underline underline-offset-2">Find the book</Link>
                </Clamp>
              </div>
            ) : <p className="text-muted-foreground text-xs"><Link href={`/schole/browse?m=books&q=${encodeURIComponent(`${title} ${author}`.trim())}`} className="underline underline-offset-2">Find the book</Link> to keep it on your shelves or read it.</p>}
          </div>
        </header>
        <div className="max-w-3xl"><AudiobookChapters {...props} /></div>
        <div className="space-y-8">
          <AudiobookRow title={<>More by {author}</>} books={same} href={`/schole/browse?m=audiobooks&q=${encodeURIComponent(author)}&language=all`} />
          {topics[0] ? <AudiobookRow title={<>More on {topics[0].label}</>} books={like} href={`/schole/topics/${topics[0].id}`} /> : null}
        </div>
      </div>
    </main>
  );
}
