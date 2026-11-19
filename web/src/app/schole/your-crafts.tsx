import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { CRAFT_STATES, STAGES } from "@reflect/core/crafts";
import type { MyCraft } from "@/server/crafts-store";

const initials = (s: string) => s.split(/[\s-]+/).filter(Boolean).map((w) => w[0]!.toUpperCase()).slice(0, 2).join("");

/** Where the person is with a craft, in words: the Dreyfus stage once practising and set, else its state. */
function whereOf(c: MyCraft): string {
  const stage = STAGES.find((s) => s.id === c.record.body.stage);
  if (c.state === "practising" && stage) return stage.label;
  return CRAFT_STATES.find((s) => s.id === c.state)?.label ?? "Drawn to it";
}

/**
 * Your crafts (doc "Scholē landing design guide"): the first row of the landing. Each craft the person keeps is a
 * round tile, like a face, with its name and where they are with it; a tap opens the craft. With none kept yet, one
 * sentence invites Discover crafts.
 */
export function YourCrafts({ crafts }: { crafts: readonly MyCraft[] }) {
  return (
    <section aria-labelledby="your-crafts" className="grid grid-cols-1 gap-3">
      <h2 id="your-crafts" className="text-xl font-semibold tracking-tight">Your crafts</h2>
      {crafts.length ? (
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {crafts.map((c) => (
            <li key={c.record.id} className="w-20 shrink-0 snap-start">
              <Link href={`/schole/crafts/${c.ref}`} className="group grid justify-items-center gap-1.5 text-center">
                <span aria-hidden className="bg-muted flex size-16 items-center justify-center rounded-full border text-base font-semibold transition-opacity group-hover:opacity-90">{initials(c.title)}</span>
                <span className="line-clamp-2 text-sm leading-tight font-medium group-hover:underline">{c.title}</span>
                <span className="text-muted-foreground text-xs leading-tight">{whereOf(c)}</span>
              </Link>
            </li>
          ))}
          <li className="w-20 shrink-0 snap-start">
            <Link href="/schole/discover" className="group grid justify-items-center gap-1.5 text-center">
              <span aria-hidden className="text-muted-foreground flex size-16 items-center justify-center rounded-full border border-dashed group-hover:bg-muted"><PlusIcon className="size-5" /></span>
              <span className="text-sm leading-tight font-medium group-hover:underline">Discover crafts</span>
            </Link>
          </li>
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          The crafts you keep will show here, with where you are in each.{" "}
          <Link href="/schole/discover" className="text-foreground font-medium underline underline-offset-4">Discover crafts</Link> that suit you, or open Making below.
        </p>
      )}
    </section>
  );
}
