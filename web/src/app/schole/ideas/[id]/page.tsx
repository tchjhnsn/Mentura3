import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ideaById, mostIn, termById, worksDiscussing } from "@reflect/core/great-ideas";
import { workById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/section-head";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { LEARN } from "../../crumbs";
import { Articles, Passages } from "../parts";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: ideaById((await params).id)?.name ?? "Idea" };
}

/**
 * One of the Great Ideas (guide tab "Ideas and terms", frame 1): the name biggest, where it is listed, how many works
 * here discuss it, one filled button for where to start, its passages by era, and the terms that grew from it.
 */
export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const idea = ideaById((await params).id);
  if (!idea) notFound();
  const start = workById(idea.start)!;
  const most = workById(mostIn(idea));
  const n = worksDiscussing(idea);
  const terms = idea.terms.flatMap((id) => { const t = termById(id); return t ? [t] : []; });
  return (
    <main className={PAGE}>
      <ThingHeader back="/schole/ideas" crumbs={[LEARN, { label: "Great Ideas", href: "/schole/ideas" }]} title={idea.name} />
      <header className="mt-6 max-w-prose space-y-3">
        <h1 id="page-title" className="text-4xl font-semibold tracking-tight">{idea.name}</h1>
        <p className="text-muted-foreground text-sm">{idea.from}.</p>
        <p className="text-[17px] leading-relaxed">{idea.about}</p>
        <p className="text-sm">Discussed in {n} {n === 1 ? "work" : "works"} here{most ? <>, most in the {most.title}</> : null}.</p>
        <Button asChild className="mt-1 h-auto min-h-10 whitespace-normal"><Link href={`/schole/works/${start.id}`}>Start with the {start.title}</Link></Button>
      </header>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 space-y-4">
          <SectionHead title="Passages" note="Where the great works discuss it, cited by standard numbering." />
          <Passages passages={idea.passages} />
        </section>
        <aside className="space-y-8">
          {terms.length ? (
            <section className="space-y-2">
              <SectionHead title="Terms that grew from it" />
              <ul className="divide-y">
                {terms.map((t) => (
                  <li key={t.id} className="py-2.5">
                    <Link href={`/schole/terms/${t.id}`} className="group block">
                      <span className="font-medium group-hover:underline group-hover:underline-offset-4">{t.name}</span>
                      <span className="text-muted-foreground block text-sm">{t.meaning}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="space-y-2">
            <SectionHead title="Read" />
            <Articles articles={idea.articles} from={`idea:${idea.id}`} />
          </section>
        </aside>
      </div>
    </main>
  );
}
