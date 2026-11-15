import Link from "next/link";
import { daily } from "@reflect/core/work-browse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ExcerptOut } from "@/server/excerpt-store";
import { highlightBooks } from "@/server/highlights";
import { restateAction } from "../actions";

/**
 * Three of the person's highlights a day, the same all day, from those not yet put in their own words, each with a
 * field to say it in their own words (kept as its note). Moved here from Scholē's front page (priority guides,
 * 2026-11-15): a learning tool lives where its material is.
 */
export async function TodayHighlights({ userId, excerpts, today }: { userId: string; excerpts: ExcerptOut[]; today: string }) {
  const unsaid = excerpts.filter((e) => !e.note);
  const picked = daily(unsaid.length ? unsaid : excerpts, 3, today, userId);
  if (!picked.length) return null;
  const titles = new Map((await highlightBooks(userId, picked)).map((b) => [b.work, b.title]));
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Today</h2>
        <p className="text-muted-foreground text-sm">Three of your highlights. Say each in your own words; what you write is kept as its note.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {picked.map((e) => (
          <li key={e.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
            <blockquote className="line-clamp-6 border-l-2 pl-3 text-sm leading-relaxed">{e.quote}</blockquote>
            <Link href={`/schole/works/${e.work}`} className="text-muted-foreground text-xs hover:underline">{titles.get(e.work) ?? "The book"}</Link>
            <form action={restateAction.bind(null, e.id, e.work)} className="mt-auto grid gap-2">
              <Textarea name="words" defaultValue={e.note ?? ""} rows={3} placeholder="In your own words" aria-label="In your own words" className="text-sm" />
              <div><Button type="submit" size="sm" variant="outline">Keep it</Button></div>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
