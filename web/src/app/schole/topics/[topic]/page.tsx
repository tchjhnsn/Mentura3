import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS, topicOf } from "@reflect/core/audiobooks";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { listItems } from "@/server/ways-store";
import { listAudiobooks, topPodcasts } from "@/server/audiobooks";
import { LEARN } from "../../crumbs";
import { AudiobookRow } from "../../audiobooks/cards";
import { MediaRow, keyOf } from "../../browse/media";
import { topicPageById, TOPIC_PAGES } from "@reflect/core/topic-pages";
import { haveKeys } from "@/server/collections";
import { facesOf, followedTopics, madeList } from "@/server/topics";
import { TopicView } from "./topic-view";
import { TopicFollow } from "../make";

export const metadata: Metadata = { title: "Topic" };
export const dynamic = "force-dynamic";

/**
 * One topic. A place, period or school (The Greeks) has a topic page of its own, grouped by form (guide "Topics and
 * playlists", Torian 2026-11-16 01:17Z). A listening subject (Torian, 2026-11-15 08:26Z) shows the top podcasts on
 * Apple in it and the most listened audiobooks under it, side by side, under the same title and Follow.
 */
export default async function TopicPage({ params, searchParams }: { params: Promise<{ topic: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const id = (await params).topic;
  const page = topicPageById(id);
  if (page) {
    const f = (await searchParams).f;
    const [items, following, made, faces] = await Promise.all([listItems(user.id).catch(() => []), followedTopics(user.id), madeList(user.id, { topic: page.id }), facesOf(page.people)]);
    return (
      <main className={PAGE}>
        <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title={page.name} />
        <TopicView t={page} form={typeof f === "string" ? f : null} following={following.includes(page.id)} have={haveKeys(items)} made={made} faces={faces} />
      </main>
    );
  }
  const t = topicOf(id);
  if (!t) notFound();
  const [items, podcasts, following] = await Promise.all([listItems(user.id), topPodcasts(t.apple, 24).catch(() => []), followedTopics(user.id)]);
  const mine = new Map(items.map((i) => [keyOf(i), i.id]));
  const books = t.genre ? listAudiobooks({ topic: t.id }, 24) : [];
  const short = t.genre ? listAudiobooks({ topic: t.id, length: "short" }, 12) : [];
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title={t.label} />
      <div className="mt-6 space-y-8">
        <div className="flex items-start justify-between gap-3">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{t.label}</h1>
          <TopicFollow topic={t.id} following={following.includes(t.id)} />
        </div>
        <nav aria-label="Other topics" className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <ul className="flex gap-1.5 pb-1">
            {[...TOPIC_PAGES.map((x) => ({ id: x.id, label: x.name })), ...TOPICS].map((x) => (
              <li key={x.id}><Link href={`/schole/topics/${x.id}`} aria-current={x.id === t.id ? "page" : undefined} className={`inline-flex h-8 items-center rounded-full border px-3 text-sm whitespace-nowrap ${x.id === t.id ? "bg-foreground text-background border-foreground" : "hover:bg-muted"}`}>{x.label}</Link></li>
            ))}
          </ul>
        </nav>
        <MediaRow title="Top podcasts" finds={podcasts.slice(0, 12)} mine={mine} note="Apple Podcasts' chart in this topic, today." />
        <AudiobookRow title="Audiobooks" books={books.slice(0, 12)} href={`/schole/browse?m=audiobooks&topic=${t.id}`} note="Reflect's editors' picks first, then the most listened on LibriVox." />
        <AudiobookRow title="Audiobooks under two hours" books={short} href={`/schole/browse?m=audiobooks&topic=${t.id}&length=short`} />
        {podcasts.length > 12 ? <MediaRow title="More podcasts" finds={podcasts.slice(12)} mine={mine} /> : null}
        {!podcasts.length && !books.length ? <p className="text-muted-foreground text-sm">Nothing found in this topic right now.</p> : null}
      </div>
    </main>
  );
}
