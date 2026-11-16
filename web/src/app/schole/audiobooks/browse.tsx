import Link from "next/link";
import { LENGTHS, READERS, TOPICS, topicOf } from "@reflect/core/audiobooks";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { languages, listAudiobooks } from "@/server/audiobooks";
import { LearnHeader } from "../header";
import { Menu } from "../browse/category-menu";
import { BrowseNav, type WayPick } from "../browse/media-page";
import { AudiobookGrid, AudiobookRow } from "./cards";

const PER = 48;
export type AudiobookParams = { topic: string; length: string; readers: string; language: string; q: string; page: number; /** Every recording, most listened first. */ all?: boolean };

const href = (p: Partial<AudiobookParams>) => {
  const s = new URLSearchParams({ m: "audiobooks" });
  for (const k of ["topic", "length", "readers", "language", "q"] as const) if (p[k]) s.set(k, p[k]!);
  if (p.page && p.page > 1) s.set("page", String(p.page));
  if (p.all) s.set("all", "1");
  return `/schole/browse?${s}`;
};

/** The topics the first page shows a row of, in order. */
const FRONT = ["philosophy", "religion", "history", "fiction", "poetry", "lives", "society", "science", "children"];

/**
 * Browse's Audiobooks (Torian, 2026-11-15 08:24Z: audiobooks first): every LibriVox recording, all of which play
 * here, most listened first, by topic, length, who reads it and language. With nothing chosen, a row for the most
 * listened and one for each main topic.
 */
export function AudiobookBrowse({ p, way }: { p: AudiobookParams; way: WayPick | null }) {
  const keep = { topic: p.topic, length: p.length, readers: p.readers, language: p.language, q: p.q, all: p.all };
  const chosen = Boolean(p.all || p.topic || p.length || p.readers || p.q || (p.language && p.language !== "English"));
  const topic = topicOf(p.topic);
  const langs = languages().slice(0, 16);
  let body;
  if (!chosen) {
    body = (
      <div className="space-y-8">
        <AudiobookRow title="Audiobooks" books={listAudiobooks({}, 12)} href={href({ all: true })} note="Reflect's editors' picks first, then the most listened." />
        <AudiobookRow title="Under two hours" books={listAudiobooks({ length: "short" }, 12)} href={href({ length: "short" })} />
        {FRONT.map((t) => <AudiobookRow key={t} title={topicOf(t)!.label} books={listAudiobooks({ topic: t }, 12)} href={href({ topic: t })} />)}
        <AudiobookRow title="Dramatic readings" books={listAudiobooks({ readers: "cast" }, 12)} href={href({ readers: "cast" })} />
      </div>
    );
  } else {
    const books = listAudiobooks({ ...keep, language: p.language || "English" }, PER + 1, (p.page - 1) * PER);
    body = (
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2">
          <h2 className="text-lg font-semibold">{p.q ? `Results for “${p.q}”` : [topic?.label, LENGTHS.find((l) => l.id === p.length)?.label.toLowerCase(), READERS.find((r) => r.id === p.readers)?.label.toLowerCase(), p.language && p.language !== "English" ? `in ${p.language === "all" ? "every language" : p.language}` : null].filter(Boolean).join(", ").replace(/^./, (c) => c.toUpperCase()) || "Every recording"}</h2>
          {topic ? <Link href={`/schole/topics/${topic.id}`} className="text-sm underline underline-offset-4">Podcasts and audiobooks on {topic.label}</Link> : null}
        </div>
        {books.length ? <AudiobookGrid books={books.slice(0, PER)} /> : <p className="text-muted-foreground text-sm">No recording matches. Try fewer choices.</p>}
        <div className="flex justify-between pt-2">
          {p.page > 1 ? <Button asChild variant="outline"><Link href={href({ ...keep, page: p.page - 1 })}>Back</Link></Button> : <span />}
          {books.length > PER ? <Button asChild variant="outline"><Link href={href({ ...keep, page: p.page + 1 })}>More</Link></Button> : null}
        </div>
      </section>
    );
  }
  return (
    <main className={PAGE}>
      <LearnHeader on="browse" />
      <div className="mt-6 space-y-5">
        <BrowseNav m="audiobooks" way={way} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0">
          <Menu label="Topic" lead={1} items={[{ href: href({ ...keep, topic: "" }), label: "Every topic", on: !p.topic }, ...TOPICS.filter((t) => t.genre).map((t) => ({ href: href({ ...keep, topic: t.id }), label: t.label, on: p.topic === t.id }))]} />
          <Menu label="Length" lead={1} items={[{ href: href({ ...keep, length: "" }), label: "Any length", on: !p.length }, ...LENGTHS.map((l) => ({ href: href({ ...keep, length: l.id }), label: l.label, on: p.length === l.id }))]} />
          <Menu label="Read by" lead={1} items={[{ href: href({ ...keep, readers: "" }), label: "Any reader", on: !p.readers }, ...READERS.map((r) => ({ href: href({ ...keep, readers: r.id }), label: r.label, on: p.readers === r.id }))]} />
          <Menu label="Language" lead={1} items={[{ href: href({ ...keep, language: "all" }), label: "Every language", on: p.language === "all" }, ...langs.map((l) => ({ href: href({ ...keep, language: l.language }), label: `${l.language} (${l.count.toLocaleString("en-US")})`, on: (p.language || "English") === l.language }))]} />
        </div>
        <p className="text-muted-foreground text-sm">Every one plays here: books in the public domain, read aloud by LibriVox&apos;s volunteers.</p>
        {body}
        <p className="text-muted-foreground pt-6 text-center text-xs">Recordings from LibriVox, kept by the Internet Archive. Reflect&apos;s editors&apos; picks come first, then the most listened by the Archive&apos;s download counts.</p>
      </div>
    </main>
  );
}
