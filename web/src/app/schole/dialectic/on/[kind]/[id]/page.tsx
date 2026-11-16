import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPIC_KINDS, topicKey, type TopicKind } from "@reflect/core/argument";
import { dialecticById } from "@reflect/core/dialectics";
import { ideaById, termById } from "@reflect/core/great-ideas";
import { workById } from "@reflect/core/topic-pages";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { feed } from "@/server/discussion-store";
import { LEARN } from "../../../../crumbs";
import { Feed, WriteBox, topicHref } from "../../../discussion";

export const metadata: Metadata = { title: "Discussion" };
export const dynamic = "force-dynamic";

/** What a topic is, for its page: a name, a line under it, and the page it belongs to. */
function about(kind: TopicKind, id: string): { name: string; line: string; href: string | null } | null {
  if (kind === "dialectic") { const d = dialecticById(id); return d ? { name: d.question, line: d.about, href: null } : null; }
  if (kind === "idea") { const i = ideaById(id); return i ? { name: i.name, line: "Great Idea", href: `/schole/ideas/${i.id}` } : null; }
  if (kind === "term") { const t = termById(id); return t ? { name: t.name, line: t.meaning, href: `/schole/terms/${t.id}` } : null; }
  if (kind === "work") { const w = workById(id); return w ? { name: w.title, line: `${w.by}, ${w.when}`, href: `/schole/works/${w.id}` } : null; }
  return null;
}

/**
 * A topic's discussion (Torian, 2026-11-16 09:43Z: threads "more so topic based", a term or a person can be a topic).
 * A curated dialectic shows its question and the positions taken on it across the ages, each with the place in the
 * work where it is argued; then the discussion.
 */
export default async function TopicPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const user = await requireUser();
  const p = await params;
  const kind = p.kind as TopicKind;
  const id = decodeURIComponent(p.id);
  if (!TOPIC_KINDS.includes(kind)) notFound();
  const a = about(kind, id);
  if (!a) notFound();
  const topic = topicKey(kind, id);
  const items = await feed(user.id, { topic });
  const d = kind === "dialectic" ? dialecticById(id) : undefined;
  const sides = d ? [...new Set(d.positions.map((x) => x.side))] : [];
  return (
    <main className={PAGE}>
      <ThingHeader back={d ? "/schole/dialectic/questions" : "/schole/dialectic"} crumbs={[LEARN, { label: "Dialectic", href: "/schole/dialectic" }, ...(d ? [{ label: "Questions", href: "/schole/dialectic/questions" }] : [])]} title={a.name} />
      <div className="mx-auto mt-6 max-w-xl space-y-8">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm">{d ? `Dialectic · ${d.subject}` : kind === "work" ? "Discussion · work" : kind === "term" ? "Discussion · term" : "Discussion · idea"}</p>
          <h1 id="page-title" className="text-3xl leading-tight font-semibold tracking-tight">{a.name}</h1>
          <p className="text-muted-foreground">{a.line}</p>
          {a.href ? <Link href={a.href} className="text-sm underline underline-offset-4">Open its page</Link> : null}
        </header>

        {d ? (
          <section className="space-y-3" aria-label="Positions across the ages">
            <h2 className="text-lg font-semibold tracking-tight">Positions across the ages</h2>
            <ul className="space-y-3">
              {sides.map((side) => (
                <li key={side} className="space-y-2 rounded-lg border p-4">
                  <p className="font-semibold">{side}</p>
                  <ul className="space-y-3">
                    {d.positions.filter((x) => x.side === side).map((x) => {
                      const w = x.work ? workById(x.work) : undefined;
                      return (
                        <li key={`${x.who}-${x.at}`} className="space-y-0.5">
                          <p className="text-sm"><span className="font-medium">{x.who}</span><span className="text-muted-foreground"> · {w ? <Link href={`/schole/works/${w.id}`} className="underline underline-offset-4">{w.title}</Link> : x.title}, {x.at}</span></p>
                          <p className="text-[15px] leading-relaxed">{x.holds}</p>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">Places, not quotations: read the passage in the work to see it argued.</p>
          </section>
        ) : null}

        <section aria-labelledby="posts" className="space-y-2">
          <h2 id="posts" className="text-lg font-semibold tracking-tight">Posts{items.length ? <span className="text-muted-foreground font-normal"> · {items.length}</span> : null}</h2>
          <div className="border-b pb-3"><WriteBox path={topicHref(kind, id)} topic={topic} placeholder={d ? `Where do you stand: ${d.question}` : `What do you make of ${a.name}?`} /></div>
          <Feed items={items} path={topicHref(kind, id)} empty="No posts yet. Say where you stand and why." />
        </section>
      </div>
    </main>
  );
}
