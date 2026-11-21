import Link from "next/link";
import { craftOf } from "@reflect/core/crafts";
import { Button } from "@/components/ui/button";
import { CraftPhoto } from "@/app/schole/craft-photo";

// Three crafts whose photos the doors below do not already use.
const SHOWN = ["carpentry", "knitting", "gardening"];

/**
 * Find your crafts (Scholē picker design guide, front page): the hero when the person keeps no crafts yet. Three
 * craft photos, the promise, and the screen's one filled button, Start, which opens the picker.
 */
export function FindCrafts() {
  return (
    <section aria-labelledby="find-crafts" className="bg-primary/5 border-primary/30 grid gap-4 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5">
      <div className="grid grid-cols-3 gap-2 sm:order-2 sm:w-80">
        {SHOWN.map((id) => (
          <CraftPhoto key={id} id={id} alt={craftOf(id)?.label ?? id} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-1.5 sm:order-1">
        <h2 id="find-crafts" className="text-xl font-semibold tracking-tight">Find your crafts</h2>
        <p className="text-muted-foreground text-sm">Pick the worlds and crafts that pull you. In a minute you will have three crafts to try this week, each with a first project of about ten minutes.</p>
        <div className="pt-2">
          <Button asChild size="lg" className="h-10 w-full sm:w-auto sm:px-8"><Link href="/life/work/discover">Start</Link></Button>
        </div>
      </div>
    </section>
  );
}
