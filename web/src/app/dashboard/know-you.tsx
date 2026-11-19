import Link from "next/link";
import { Check } from "lucide-react";
import { AREAS, becauseOf, itemOf, itemsIn, MIN_PICKS, type AreaId } from "@reflect/core/interest-catalogue";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { myAreas, myInterests, type MyAreas, type MyInterest } from "@/server/interests-store";
import { Cover } from "../me/cover";
import { NotNow } from "./know-you-later";
import { safe, type Ctx } from "./parts";

const NONE: MyAreas = { done: [], skipped: [], sorted: false, later: null };

/** Where Start goes: the first area neither done nor skipped, then Sort once there are three picks to sort. */
export function nextStep(areas: MyAreas, picks: number): { href: string; label: string } | null {
  const area = AREAS.find((a) => !areas.done.includes(a.id) && !areas.skipped.includes(a.id));
  if (area) return { href: `/me/get-to-know-you/${area.id}`, label: area.label };
  if (!areas.sorted && picks >= MIN_PICKS) return { href: "/me/get-to-know-you/sort", label: "Make, Do, Know" };
  return null;
}

/**
 * Get to know you on the dashboard (design guide "Get to know you: person dashboard", page 1): the card with its
 * promise and Start until every area is done or skipped and the picks are sorted, then each done area's row,
 * "Your reading" and the rest, with what the picks lead to.
 */
export async function KnowYou({ ctx }: { ctx: Ctx }) {
  const [areas, mine] = await Promise.all([safe(myAreas(ctx.userId), NONE), safe(myInterests(ctx.userId), [] as MyInterest[])]);
  const next = nextStep(areas, mine.length);
  const waiting = areas.later && areas.later > ctx.today;
  const card = next && !waiting;
  const rows = AREAS.filter((a) => areas.done.includes(a.id));
  if (!card && !rows.length) return null;
  const picksIn = (id: AreaId) => mine.filter((i) => i.area === id);
  const handled = AREAS.filter((a) => areas.done.includes(a.id) || areas.skipped.includes(a.id)).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      {card ? (
        <section aria-label="Get to know you" className="bg-card grid gap-4 rounded-xl border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid min-w-0 flex-1 gap-1">
              <h2 className="text-2xl font-bold tracking-tight">Get to know you</h2>
              <p className="text-muted-foreground text-[15px]">
                {handled === 0
                  ? "Tell Reflect what you love. This page fills with things to read, hear and follow."
                  : `${handled} of ${AREAS.length} done. Next: ${next.label}.`}
              </p>
            </div>
            <Button asChild><Link href={next.href}>{handled === 0 ? "Start" : "Continue"}</Link></Button>
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {AREAS.map((a) => {
              const done = areas.done.includes(a.id), skipped = areas.skipped.includes(a.id);
              const picks = picksIn(a.id).slice(0, 3);
              const faces = picks.length ? picks.map((p) => ({ id: p.ref, image: p.item?.image ?? null, title: p.title })) : itemsIn(a.id).slice(0, 3).map((i) => ({ id: i.id, image: i.image, title: i.title }));
              return (
                <li key={a.id} className="shrink-0">
                  <Link href={`/me/get-to-know-you/${a.id}`} className={cn("hover:bg-muted/60 grid w-36 gap-2 rounded-lg border p-2.5", done && "border-primary/40")}>
                    <span className="flex -space-x-3">
                      {faces.map((f) => <Cover key={f.id} src={f.image} name={f.title} className={cn("ring-card size-11 ring-2", !done && !picks.length && "opacity-80")} />)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      {done ? <Check aria-label="done" className="text-primary size-4" /> : null}
                      {a.label}
                      {skipped ? <span className="text-muted-foreground text-xs font-normal">skipped</span> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div><NotNow today={ctx.today} /></div>
        </section>
      ) : null}

      {rows.map((a) => {
        const picks = picksIn(a.id);
        const more = becauseOf(picks.map((p) => p.ref), 6);
        return (
          <section key={a.id} aria-label={a.row} className="grid grid-cols-[minmax(0,1fr)] gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{a.row}</h2>
              <Link href={`/me/get-to-know-you/${a.id}`} className="text-muted-foreground hover:text-foreground text-sm">Change picks</Link>
            </div>
            <ul className="flex gap-4 overflow-x-auto pb-1">
              {more.map(({ item, because }) => (
                <li key={item.id} className="w-32 shrink-0">
                  <Link href={`/me/interests/${item.id}`} className="grid gap-1.5">
                    <Cover src={item.image} name={item.title} className="aspect-square w-full" />
                    <span className="line-clamp-2 text-sm leading-tight font-medium">{item.title}</span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">Because you picked {because.title}</span>
                  </Link>
                </li>
              ))}
              {picks.map((p) => (
                <li key={p.ref} className="w-32 shrink-0">
                  <Link href={`/me/interests/${p.ref}`} className="grid gap-1.5">
                    <Cover src={p.item?.image ?? itemOf(p.ref)?.image} name={p.title} className="aspect-square w-full" />
                    <span className="line-clamp-2 text-sm leading-tight font-medium">{p.title}</span>
                    <span className="text-muted-foreground text-xs">Your pick</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
