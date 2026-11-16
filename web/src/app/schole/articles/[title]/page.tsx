import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleOfSlug, readsArticle } from "@reflect/core/articles";
import { personById, personHref } from "@reflect/core/historical-people";
import { ideaById, termById } from "@reflect/core/great-ideas";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { articleFor } from "@/server/articles";
import { LEARN } from "../../crumbs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ title: string }> }): Promise<Metadata> {
  return { title: articleOfSlug((await params).title) };
}

/**
 * An article read inside Scholē (guide "Philosophers and music", Articles): Wikipedia's text, credited under its
 * licence with a link to the original and its history, read as plain text. No model summarizes it.
 */
export default async function ArticlePage({ params, searchParams }: { params: Promise<{ title: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const title = articleOfSlug((await params).title);
  if (!readsArticle(title)) notFound();
  const from = (await searchParams).from;
  const f = typeof from === "string" ? from : "";
  const x = personById(f);
  // An article opened from an idea or a term goes back there (guide tab "Ideas and terms").
  const idea = f.startsWith("idea:") ? ideaById(f.slice(5)) : undefined;
  const term = f.startsWith("term:") ? termById(f.slice(5)) : undefined;
  const from2 = idea ? { name: idea.name, href: `/schole/ideas/${idea.id}` } : term ? { name: term.name, href: `/schole/terms/${term.id}` } : x ? { name: x.name, href: personHref(x, "about") } : null;
  const back = from2?.href ?? "/schole/browse";
  const a = await articleFor(title);
  return (
    <main className={PAGE}>
      <ThingHeader back={back} crumbs={[LEARN, ...(from2 ? [{ label: from2.name, href: back }] : [{ label: "Browse", href: "/schole/browse" }])]} title={title} />
      <article className="mt-6 max-w-prose space-y-4">
        <header className="space-y-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">{a?.title ?? title}</h1>
          <p className="text-muted-foreground text-[13px]">
            From Wikipedia, the free encyclopedia. Text under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-4">CC BY-SA 4.0</a>
            {a ? <> · <a href={a.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">Original and its authors</a></> : null}
          </p>
        </header>
        {a ? a.blocks.map((b, i) => b.kind === "h"
          ? (b.level === 2 ? <h2 key={i} className="pt-4 text-xl font-semibold tracking-tight">{b.text}</h2> : <h3 key={i} className="pt-2 font-semibold">{b.text}</h3>)
          : <p key={i} className="leading-relaxed">{b.text}</p>)
          : <p className="text-muted-foreground">Wikipedia did not answer just now. Try again in a moment.</p>}
      </article>
    </main>
  );
}
