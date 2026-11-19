import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { DOORS } from "@reflect/core/crafts";

/**
 * The three doors (doc "Scholē landing design guide"): Making, Doing and Knowing, Aristotle's craft, practical wisdom
 * and science. Each is a card, never a filled button: its name turning through its languages, one line on what is
 * behind it, and the source small. The names start a little apart so the three do not turn together.
 */
export function Doors() {
  return (
    <section aria-labelledby="doors" className="grid grid-cols-1 gap-3">
      <h2 id="doors" className="text-xl font-semibold tracking-tight">Ways in</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DOORS.map((d, i) => (
          <li key={d.id}>
            <Link href={`/schole/${d.id}`} className="hover:bg-accent flex h-full items-start gap-3 rounded-xl border p-4 transition sm:flex-col sm:gap-2">
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-lg leading-snug font-semibold tracking-tight">
                  {d.label}
                </span>
                <span className="text-muted-foreground block text-sm">{d.line}</span>
                <span className="text-muted-foreground block text-xs">{d.source}</span>
              </span>
              <ChevronRightIcon aria-hidden className="text-muted-foreground mt-1 size-4 shrink-0 sm:hidden" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
