import Link from "next/link";
import { WAYS } from "@reflect/core/ways";
import { BROWSE_MEDIA } from "@reflect/core/browse-media";

const chip = "hover:bg-muted inline-flex h-8 items-center rounded-full border px-3 text-sm whitespace-nowrap";

/**
 * By way and By medium (doc "Scholē landing design guide"): the four ways of learning and every medium Browse has,
 * as outline chips that open Browse filtered to that way or medium. Below the rest of the landing, for looking around.
 */
export function ByWay() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <section aria-labelledby="by-way" className="grid grid-cols-1 gap-3">
        <h2 id="by-way" className="text-lg font-semibold tracking-tight">By way</h2>
        <ul className="flex flex-wrap gap-2">
          {WAYS.map((w) => (
            <li key={w.id}><Link href={`/schole/browse?way=${w.id}`} title={w.about} className={chip}>{w.label}</Link></li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="by-medium" className="grid grid-cols-1 gap-3">
        <h2 id="by-medium" className="text-lg font-semibold tracking-tight">By medium</h2>
        <ul className="flex flex-wrap gap-2">
          {BROWSE_MEDIA.map((m) => (
            <li key={m.id}><Link href={`/schole/browse?m=${m.id}`} className={chip}>{m.label}</Link></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
