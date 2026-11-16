import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { readingMinutes, summaryBlocks } from "@reflect/core/ai-text";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { ensureSummary } from "@/server/ai-text";
import { LEARN } from "../crumbs";
import { AiLabel } from "../ai-description";

export const metadata: Metadata = { title: "Summary" };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * A book's summary, about fifteen minutes to read (Torian, 2026-11-16 19:20Z: summaries "even the books that we don't
 * have on our platform", to skim before reading deeply). A model writes it once from the book's Wikipedia article and
 * it is kept for everyone, labelled as written by AI with the article linked.
 */
export default async function SummaryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const title = one(sp.t).trim().slice(0, 300);
  const by = one(sp.by).trim().slice(0, 200);
  if (!title) redirect("/schole/browse");
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/browse" crumbs={[LEARN, { label: "Browse", href: "/schole/browse" }]} title={title} />
      <article className="mx-auto mt-6 max-w-prose space-y-5">
        <header className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">Summary</p>
          <h1 id="page-title" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {by ? <p className="text-base">{by}</p> : null}
        </header>
        <Suspense fallback={<p className="text-muted-foreground">Writing the summary. The first time takes about a minute; after that it opens at once for everyone.</p>}>
          <Summary title={title} by={by} />
        </Suspense>
      </article>
    </main>
  );
}

async function Summary({ title, by }: { title: string; by: string }) {
  const s = await ensureSummary({ title, by: by || null });
  if (!s) return <p className="text-muted-foreground">There is no summary of this book yet: Wikipedia has no article that describes what it says, and a summary is written only from a source.</p>;
  return (
    <>
      <div className="text-muted-foreground space-y-1 border-y py-3 text-sm">
        <p className="text-foreground font-medium">About {readingMinutes(s.body)} min read</p>
        <AiLabel sources={s.sources} />
      </div>
      <div className="space-y-4 text-[17px] leading-relaxed">
        {summaryBlocks(s.body).map((b, i) => (b.heading ? <h2 key={i} className="pt-4 text-lg leading-snug font-semibold tracking-tight">{b.text}</h2> : <p key={i}>{b.text}</p>))}
      </div>
    </>
  );
}
