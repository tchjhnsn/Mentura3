import Link from "next/link";
import { DOORS, type DoorId } from "@reflect/core/crafts";
import { CraftPhoto } from "./craft-photo";

/** The photo behind each door, a world's: pottery for Making, bread (the household) for Doing, a circuit for Knowing. */
const PHOTO: Record<DoorId, { id?: string; world?: string }> = {
  making: { world: "materials" },
  doing: { world: "food" },
  knowing: { world: "technical" },
};

/**
 * The two doors (Work and Scholē guide, 2026-11-21: Making moved to Work). Formerly the three doors (doc "Scholē landing design guide", photos from the picker design guide): Making, Doing and
 * Knowing, Aristotle's craft, practical wisdom and science. Each is a photo card, never a filled button: the photo,
 * its name, one line on what is behind it, and the source small.
 */
export function Doors() {
  return (
    <section aria-labelledby="doors" className="grid grid-cols-1 gap-3">
      <h2 id="doors" className="text-xl font-semibold tracking-tight">Ways in</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DOORS.filter((d) => d.id !== "making").map((d) => (
          <li key={d.id}>
            <Link href={`/schole/${d.id}`} className="group bg-card hover:bg-accent/40 flex h-full overflow-hidden rounded-xl border transition-colors sm:flex-col">
              <CraftPhoto {...PHOTO[d.id]} alt="" sizes="(min-width: 640px) 50vw, 96px" className="aspect-square w-24 shrink-0 sm:aspect-[16/9] sm:w-full" />
              <span className="min-w-0 flex-1 space-y-1 p-3 sm:p-4">
                <span className="block text-lg leading-snug font-semibold tracking-tight group-hover:underline">{d.label}</span>
                <span className="text-muted-foreground block text-sm">{d.line}</span>
                <span className="text-muted-foreground block text-xs">{d.source}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">Making things? <Link href="/life/work" className="text-foreground underline underline-offset-4">Your crafts are in Work</Link>.</p>
    </section>
  );
}
