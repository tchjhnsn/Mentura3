import Link from "next/link";
import { KINDS } from "@reflect/core/works";
import { lastWork } from "@/server/work-store";
import { safe, Section, type Ctx } from "../parts";
import { ago, workName } from "../tiles";

/** Journal: the work last written in, by its title and when, with Continue. No text of the work beyond its title. */
export async function JournalCard({ ctx }: { ctx: Ctx }) {
  const w = await safe(lastWork(ctx.userId), null);
  if (!w) {
    return (
      <Section title="Journal" href="/journal" more="Journal">
        <Link href="/journal/new" className="text-muted-foreground hover:text-foreground text-sm">Start writing in your journal</Link>
      </Section>
    );
  }
  const href = `/journal/w/${w.id}`;
  return (
    <Section title="Journal" href="/journal" more="Journal">
      <Link href={href} className="bg-card hover:bg-accent flex items-center justify-between gap-4 rounded-xl border p-4 transition">
        <span className="grid min-w-0 gap-0.5">
          <span className="text-muted-foreground text-sm">{KINDS[w.kind].label} · edited {ago(w.savedAt, ctx.now)}</span>
          <span className="truncate font-semibold">{workName(w)}</span>
        </span>
        <span className="text-primary shrink-0 text-sm font-medium">Continue</span>
      </Link>
    </Section>
  );
}
