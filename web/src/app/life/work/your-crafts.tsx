import Link from "next/link";
import { CRAFT_STATES, STAGES, firstProjectOf } from "@reflect/core/crafts";
import type { MyCraft } from "@/server/crafts-store";
import { cn } from "@/lib/utils";
import { CraftPhoto } from "@/app/schole/craft-photo";

/** Where the person is with a craft, in words: the Dreyfus stage once practising and set, else its state, with the projects tried. */
function whereOf(c: MyCraft, tried: number): string {
  const stage = STAGES.find((s) => s.id === c.record.body.stage);
  const state = c.state === "practising" && stage ? stage.label : CRAFT_STATES.find((s) => s.id === c.state)?.label ?? "Drawn to it";
  return tried ? `${state}, ${tried} ${tried === 1 ? "project" : "projects"}` : state;
}

/**
 * Your crafts (Scholē picker design guide, front page): with crafts kept, one row of photo cards. The first is wider
 * and says what is next, its first project; the others show photo, name and where the person is. Tune opens the
 * picker again. Shown only when the person keeps at least one craft (else Find your crafts stands in its place).
 */
export function YourCrafts({ crafts, tried }: { crafts: readonly MyCraft[]; tried: Readonly<Record<string, number>> }) {
  if (!crafts.length) return null;
  return (
    <section aria-labelledby="your-crafts" className="grid grid-cols-1 gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="your-crafts" className="text-xl font-semibold tracking-tight">Your crafts</h2>
        <Link href="/life/work/discover" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">Tune</Link>
      </div>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {crafts.map((c, i) => {
          const first = i === 0;
          const project = first ? firstProjectOf(c.ref) : undefined;
          return (
            <li key={c.record.id} className={cn("shrink-0 snap-start", first ? "w-60" : "w-32")}>
              <Link href={`/life/work/crafts/${c.ref}`} className="group bg-card hover:bg-accent/40 flex h-full flex-col overflow-hidden rounded-xl border transition-colors">
                <CraftPhoto id={c.ref} alt={c.title} sizes={first ? "240px" : "128px"} className={cn("w-full", first ? "aspect-[16/9]" : "aspect-square")} />
                <span className="grid gap-0.5 p-3">
                  <span className="line-clamp-2 text-sm leading-tight font-semibold group-hover:underline">{c.title}</span>
                  <span className="text-muted-foreground text-xs leading-tight">{whereOf(c, tried[c.record.id] ?? 0)}</span>
                  {project ? (
                    <span className="mt-2 grid gap-0.5 border-t pt-2">
                      <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">Next</span>
                      <span className="line-clamp-2 text-sm leading-tight">{project.name}</span>
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
