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
import { AudiobookPlay } from "./play";

export const metadata: Metadata = { title: "Audiobook" };
export const dynamic = "force-dynamic";

/**
 * An audiobook from LibriVox, heard here the way an episode is (Torian, 2026-11-15 08:26Z): its cover, who wrote and
 * reads it, how long it runs and its topics; a play pill and its chapters; what LibriVox says of it; and more by the
 * same author and on its first topic.
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
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse?m=audiobooks" crumbs={browseCrumbs("audiobooks")} title={title} />
      <div className="mt-8 grid gap-8 md:grid-cols-[13rem_1fr]">
        <div className="mx-auto w-48 md:mx-0 md:w-full">
          <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center overflow-hidden rounded-lg border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {cover ? <img src={cover} alt={`Cover of ${title}`} className="size-full object-cover" /> : <HeadphonesIcon className="size-8" />}
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <h1 id="page-title" className="text-3xl leading-tight font-semibold tracking-tight">{title}</h1>
            {entry?.by ? <p className="text-muted-foreground">{entry.by}</p> : null}
            <p className="text-muted-foreground text-sm">{[hoursOf(rec.seconds || entry?.seconds || 0), `${rec.chapters.length} chapters`, entry ? readBy(entry) : null, entry && entry.language !== "English" ? entry.language : null].filter(Boolean).join(" · ")}</p>
            {topics.length ? (
              <ul className="flex flex-wrap gap-1.5 pt-1">
                {topics.map((t) => <li key={t.id}><Link href={`/schole/topics/${t.id}`} className="hover:bg-muted inline-flex h-7 items-center rounded-full border px-2.5 text-xs">{t.label}</Link></li>)}
              </ul>
            ) : null}
          </div>
          <AudiobookPlay book={rec} title={title} cover={cover} page={`/schole/audiobooks/${id}`} />
          {rec.about ? (
            <section className="space-y-2">
              <h2 className="text-sm font-medium">About this recording</h2>
              <p className="max-w-prose text-sm leading-relaxed">{rec.about}</p>
              <p className="text-muted-foreground text-xs">From <a href={rec.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">LibriVox</a>, read by volunteers; the book is in the public domain.</p>
            </section>
          ) : null}
          <p className="text-sm"><Link href={`/schole/browse?m=books&q=${encodeURIComponent(`${title} ${author}`.trim())}`} className="underline underline-offset-4">Find the book</Link> <span className="text-muted-foreground">to keep it on your shelves or read it.</span></p>
        </div>
      </div>
      <div className="mt-10 space-y-8">
        <AudiobookRow title={<>More by {author}</>} books={same} href={`/schole/browse?m=audiobooks&q=${encodeURIComponent(author)}&language=all`} />
        {topics[0] ? <AudiobookRow title={<>More on {topics[0].label}</>} books={like} href={`/schole/topics/${topics[0].id}`} /> : null}
      </div>
    </main>
  );
}
