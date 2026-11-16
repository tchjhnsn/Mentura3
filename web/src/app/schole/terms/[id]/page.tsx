import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleSlug } from "@reflect/core/articles";
import { itemHref } from "@reflect/core/collections";
import { ideaById, termById, termPrompts } from "@reflect/core/great-ideas";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { DiscussTopic } from "../../dialectic/discussion";
import { LEARN } from "../../crumbs";
import { Articles, Cite, JournalPrompt, Passages } from "../../ideas/parts";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: termById((await params).id)?.name ?? "Term" };
}

/**
 * A term under one of the Great Ideas (guide tab "Ideas and terms", frames 2 to 4). The exercises are journal prompts
 * (Torian, 2026-11-16 07:41Z): your own case first, then spotting it in stories and real cases, then an essay.
 * What a person writes goes in their journal and is never published; nothing is scored.
 */
export default async function TermPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const t = termById((await params).id);
  if (!t) notFound();
  const idea = ideaById(t.idea)!;
  const pr = termPrompts(t);
  return (
    <main className={PAGE}>
      <ThingHeader back={`/schole/ideas/${idea.id}`} crumbs={[LEARN, { label: "Great Ideas", href: "/schole/ideas" }, { label: idea.name, href: `/schole/ideas/${idea.id}` }]} title={t.name} />
      <header className="mt-6 max-w-prose space-y-3">
        <h1 id="page-title" className="text-4xl font-semibold tracking-tight">{t.name}</h1>
        <p className="text-muted-foreground text-sm">Term · under <Link href={`/schole/ideas/${idea.id}`} className="underline underline-offset-4">{idea.name}</Link></p>
        <p className="text-[17px] leading-relaxed">{t.meaning}</p>
        <div className="space-y-1.5 pt-1">
          <p className="text-sm">Start with your own life: when you were the one in a position to do it, and when it was done to you.</p>
          <JournalPrompt template="own-case" about={pr.own} label="Write about your own case" primary domains />
          <p className="text-muted-foreground text-[13px]">Opens a new entry in your journal. It stays private.</p>
        </div>
      </header>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <section className="space-y-3">
            <SectionHead title="Spot it" note="In stories first, then in real cases. Write what you see in your journal; nothing is scored." />
            <ul className="divide-y">
              {t.stories.map((s) => (
                <li key={s.what} className="space-y-2 py-4">
                  <p className="font-medium">{s.what} <span className="text-muted-foreground text-sm font-normal">{s.by}</span></p>
                  <blockquote className="border-l-2 pl-3 text-[15px] leading-relaxed">&ldquo;{s.at.words}&rdquo;</blockquote>
                  <Cite a={s.at} />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <JournalPrompt template="spot-it" about={pr.spot(s)} label="Write about it" />
                    {s.audiobook ? <Link href={`/schole/audiobooks/${s.audiobook}`} className="text-sm underline-offset-4 hover:underline">Listen to the book</Link> : null}
                  </div>
                </li>
              ))}
              {t.cases.map((c) => (
                <li key={c.what} className="space-y-2 py-4">
                  <p className="font-medium">{c.what} <span className="text-muted-foreground text-sm font-normal">real case, {c.when}</span></p>
                  <div className="flex flex-wrap items-center gap-2">
                    <JournalPrompt template="spot-it" about={pr.spot(c)} label="Write about it" />
                    <Link href={`/schole/articles/${articleSlug(c.article)}?from=term:${t.id}`} className="text-sm underline-offset-4 hover:underline">Read: {c.article}</Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <SectionHead title="Before the word" note="Passages that describe it before it had a name." />
            <Passages passages={t.before} />
          </section>
          <section className="space-y-3">
            <SectionHead title="Write an essay on it" note="When you can say what it is, where it comes from, and where you have seen it." />
            <JournalPrompt template="essay" about={pr.essay} label="Start an essay" />
          </section>
        </div>
        <aside className="space-y-8">
          <DiscussTopic kind="term" id={t.id} />
          <section className="space-y-2">
            <SectionHead title="Where the word came from" />
            <ol className="space-y-2">
              {t.origin.map((o) => <li key={o.when} className="text-sm"><span className="font-medium">{o.when}.</span> {o.what}</li>)}
            </ol>
            <p className="text-muted-foreground text-[13px]">From the Wikipedia article <Link href={`/schole/articles/${articleSlug(t.originSource)}?from=term:${t.id}`} className="underline underline-offset-4">{t.originSource}</Link>.</p>
          </section>
          <section className="space-y-2">
            <SectionHead title="Listen" />
            <ul className="divide-y">
              {t.listen.map((i) => (
                <li key={i.title} className="py-2.5">
                  <Link href={itemHref(i)} className="group block">
                    <span className="font-medium group-hover:underline group-hover:underline-offset-4">{i.title}</span>
                    <span className="text-muted-foreground block text-sm">{"by" in i && i.by ? `${i.by}. ` : ""}{i.why}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <SectionHead title="Read" />
            <Articles articles={t.articles} from={`term:${t.id}`} />
          </section>
        </aside>
      </div>
    </main>
  );
}
