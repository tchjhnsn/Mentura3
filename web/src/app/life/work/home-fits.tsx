import Link from "next/link";
import { CRAFT_STATES, STAGES } from "@reflect/core/crafts";
import type { Fit, VentureCandidate } from "@reflect/core/job-fit";
import type { MyCraft } from "@/server/crafts-store";

const ROW = "hover:bg-accent grid gap-0.5 py-2.5 transition";

/**
 * Jobs that fit you (Work home, P2): up to three fits, each with its reasons from the data, and one craft worth
 * trying as a venture when there is one. Labelled "From your interests so far" when no crafts are kept.
 */
export function HomeFits({ fits, venture, keepsCrafts }: { fits: readonly Fit[]; venture: VentureCandidate | null; keepsCrafts: boolean }) {
  if (!fits.length && !keepsCrafts) return null;
  const rows = fits.slice(0, 3);
  return (
    <section aria-labelledby="fits" className="grid content-start gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="fits" className="text-lg font-semibold tracking-tight">{keepsCrafts ? "Jobs that fit you" : "From your interests so far"}</h2>
        <Link href="/life/work/matches" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">All</Link>
      </div>
      {rows.length || venture ? (
        <ul className="divide-y border-y">
          {rows.map((f) => (
            <li key={f.job.code}>
              <Link href={`/life/work/jobs/${f.job.code}`} className={ROW}>
                <span className="text-sm leading-snug font-medium">{f.job.title}</span>
                {f.reasons.length ? <span className="text-muted-foreground line-clamp-1 text-xs">{f.reasons.join(" · ")}</span> : null}
              </Link>
            </li>
          ))}
          {venture ? (
            <li>
              <Link href="/life/ventures" className={ROW}>
                <span className="text-sm leading-snug font-medium">{venture.craft.label}, as a venture</span>
                <span className="text-muted-foreground line-clamp-1 text-xs">Few jobs pay for it</span>
              </Link>
            </li>
          ) : null}
        </ul>
      ) : <p className="text-muted-foreground text-sm">No job matches your crafts yet. <Link href="/life/work/browse" className="underline underline-offset-2">Browse work</Link>.</p>}
    </section>
  );
}

/** Where the person is with a craft: the Dreyfus stage once set, else its state. */
function whereOf(c: MyCraft): string {
  const stage = STAGES.find((s) => s.id === c.record.body.stage);
  if (stage) return stage.label;
  return CRAFT_STATES.find((s) => s.id === c.state)?.label ?? "Drawn to it";
}

/** Your crafts (Work home, P2): outline chips, each opening the craft, and where they are kept. */
export function HomeCrafts({ crafts }: { crafts: readonly MyCraft[] }) {
  if (!crafts.length) return null;
  return (
    <section aria-labelledby="your-crafts" className="grid content-start gap-2">
      <h2 id="your-crafts" className="text-lg font-semibold tracking-tight">Your crafts</h2>
      <ul className="flex flex-wrap gap-2">
        {crafts.map((c) => (
          <li key={c.record.id}>
            <Link href={`/life/work/crafts/${c.ref}`} className="hover:bg-accent inline-flex items-center rounded-full border px-3 py-1 text-sm transition">
              {c.title}<span className="text-muted-foreground">&nbsp;· {whereOf(c)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/me/crafts" className="text-muted-foreground hover:text-foreground w-fit text-xs underline-offset-4 hover:underline">Kept on your profile</Link>
    </section>
  );
}
