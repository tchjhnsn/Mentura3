import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOMAINS, BELIEF_KINDS } from "@reflect/core/book";
import { ORIGINS } from "@reflect/core/origins";
import { claimView, QUOTE_SOURCE_KINDS, SAID_AS, type Saying } from "@reflect/core/quotes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGE } from "@/components/page-header";
import { ThingHeader } from "@/components/headers";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { claimTags, loadQuotes } from "@/server/quotes-store";
import { listWorks } from "@/server/work-store";
import { workTitle } from "@reflect/core/works";

export const metadata: Metadata = { title: "Claim" };
export const dynamic = "force-dynamic";

const saidLabel = (s: Saying["said"]) => SAID_AS.find((x) => x.id === s)?.label ?? "Said, with no act tagged";
const sourceLabel = (k: string) => QUOTE_SOURCE_KINDS.find((x) => x.id === k)?.label ?? k;

/**
 * One claim (`/schole/claims/<id>`): what the person said about it over time, each saying a quote with where and when,
 * and who else says it (docs/design/REFLECT_QUOTES_2026-11-20.md). It shows what was said, never what is believed.
 */
export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ quotes, claims, details }, works] = await Promise.all([loadQuotes(user.id), listWorks(user.id)]);
  const claim = claims.find((c) => c.id === id);
  if (!claim) notFound();
  const v = claimView(id, claim.record, quotes);
  const t = claimTags(claim, details);
  const workOf = new Map(quotes.map((q) => [q.id, q.workId]));
  const titles = new Map(works.map((w) => [w.id, workTitle(w)]));
  const serves = t.kind?.object ? claims.find((c) => c.id === t.kind!.object) : null;
  const facts = [
    t.domain ? DOMAINS.find((d) => d.id === t.domain!.value)?.title : null,
    t.kind ? BELIEF_KINDS.find((k) => k.id === t.kind!.value)?.label : null,
    t.origins.length ? `From ${t.origins.map((o) => ORIGINS.find((x) => x.id === o)?.label.toLowerCase() ?? o).join(", ")}` : null,
  ].filter(Boolean);
  const where = (s: Saying) => {
    const w = workOf.get(s.quote);
    return w ? <Link href={`/journal/w/${w}`} className="underline underline-offset-2">{titles.get(w) ?? "a work"}</Link> : sourceLabel(s.source.kind);
  };
  return (
    <main className={PAGE}>
      <ThingHeader crumbs={[{ label: "Claims", href: "/schole/shelves?tab=claims" }, { label: claim.record.text }]} title={claim.record.text} />
      <h1 id="page-title" className="mt-2 text-2xl leading-snug font-semibold tracking-tight">{claim.record.text}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {v.now ? `${saidLabel(v.now.said)}, ${v.now.when}` : "You have not said it yet"}
        {facts.length ? ` · ${facts.join(" · ")}` : null}
      </p>
      {serves ? <p className="text-muted-foreground mt-1 text-sm">Serves the ideal <Link href={`/schole/claims/${serves.id}`} className="underline underline-offset-2">{serves.record.text}</Link>{t.circumstances ? `, ${t.circumstances}` : null}</p> : null}
      <div className="mt-8 space-y-6">
        <Card className="gap-3 py-5">
          <CardHeader className="px-5"><CardTitle className="flex items-center gap-2 text-sm">What you said<Badge variant="secondary">{v.mine.length}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-0 px-5">
            {v.mine.length ? null : <p className="text-muted-foreground text-sm">Nothing yet. Say so, say not or ask from your claims, or send a passage from your journal to Learn.</p>}
            {[...v.mine].reverse().map((s, i) => (
              <div key={s.quote} className={cn("py-3", i > 0 && "border-t")}>
                <p className="text-sm font-medium">{saidLabel(s.said)}</p>
                <blockquote className="mt-1 border-l-2 pl-3 text-sm">{s.text}</blockquote>
                <p className="text-muted-foreground mt-1 text-xs">{s.when} · {where(s)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        {v.others.length ? (
          <Card className="gap-3 py-5">
            <CardHeader className="px-5"><CardTitle className="flex items-center gap-2 text-sm">Who else says it<Badge variant="secondary">{v.others.length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-0 px-5">
              {v.others.map((s, i) => (
                <div key={s.quote} className={cn("py-3", i > 0 && "border-t")}>
                  <blockquote className="border-l-2 pl-3 text-sm">{s.text}</blockquote>
                  <p className="text-muted-foreground mt-1 text-xs">{s.speaker} · {s.when} · {sourceLabel(s.source.kind)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
