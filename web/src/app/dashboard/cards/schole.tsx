import Link from "next/link";
import { mediumOf } from "@reflect/core/ways";
import { instrumentByUrl, instrumentHref } from "@reflect/core/instruments";
import { lastActivity, listItems } from "@/server/ways-store";
import { Art } from "@/app/schole/art";
import { safe, Section, type Ctx } from "../parts";
import { shareOf, underWay } from "../tiles";

/** Scholē: what the person is listening to or watching, the latest first, with Resume to where they left off. */
export async function ScholeCard({ ctx }: { ctx: Ctx }) {
  const [items, recent] = await Promise.all([safe(listItems(ctx.userId), []), safe(lastActivity(ctx.userId), new Map<string, number>())]);
  const now = underWay(items, recent);
  if (!now.length) return null;
  const hrefOf = (i: (typeof now)[number]) => {
    const instrument = i.medium === "course" ? instrumentByUrl(i.url) : undefined;
    return instrument ? instrumentHref(instrument) : `/schole/items/${i.id}`;
  };
  const [last, ...rest] = now;
  const share = shareOf(last!);
  const where = last!.parts && last!.part ? `${last!.medium === "course" || last!.medium === "lecture" ? "Lecture" : "Part"} ${last!.part} of ${last!.parts}` : mediumOf(last!.medium).doing;
  return (
    <Section title="Scholē" href="/schole" more="Scholē">
      <div className="bg-card flex gap-4 rounded-xl border p-4">
        <Link href={hrefOf(last!)} className="shrink-0" aria-label={last!.title}>
          <Art image={last!.image} kind={mediumOf(last!.medium).label} title={last!.title} small className="size-20" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs">{mediumOf(last!.medium).label}</span>
          <Link href={hrefOf(last!)} className="line-clamp-2 font-semibold leading-snug hover:underline hover:underline-offset-4">{last!.title}</Link>
          <span className="text-muted-foreground truncate text-sm">{[last!.by, where].filter(Boolean).join(" · ")}</span>
          {share !== null ? <span className="bg-muted mt-1 block h-1 max-w-xs overflow-hidden rounded-full"><span className="bg-primary block h-full" style={{ width: `${Math.max(2, share * 100)}%` }} /></span> : null}
          <Link href={hrefOf(last!)} className="text-primary mt-auto w-fit pt-1 text-sm font-medium hover:underline hover:underline-offset-4">Resume</Link>
        </div>
      </div>
      {rest.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
          {rest.slice(0, 2).map((i) => (
            <li key={i.id}><Link href={hrefOf(i)} className="hover:bg-accent flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm">
              <span className="truncate">{i.title}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{mediumOf(i.medium).label}</span>
            </Link></li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}
