import type { Metadata } from "next";
import Link from "next/link";
import { CRAFTS, CRAFT_STATES, STAGES, craftPhoto, type Craft } from "@reflect/core/crafts";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CraftPhoto } from "@/app/schole/craft-photo";
import { requireUser } from "@/server/session";
import { workFit } from "@/server/fit-store";
import { lifeActs } from "@/server/life-store";
import type { MyCraft } from "@/server/crafts-store";

export const metadata: Metadata = { title: "Your crafts" };
export const dynamic = "force-dynamic";

/** Practising first, then trying, then drawn. */
const ORDER: Record<string, number> = { practising: 0, trying: 1, drawn: 2 };

/** Where the person is with a craft: the Dreyfus stage once practising and set, else the state. */
function whereOf(c: MyCraft): string {
  const stage = STAGES.find((s) => s.id === c.record.body.stage || s.label === c.record.body.stage);
  if (c.state === "practising" && stage) return stage.label;
  return CRAFT_STATES.find((s) => s.id === c.state)?.label ?? "Drawn to it";
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Three crafts from different worlds that have a photo, for the empty state. */
function samples(): Craft[] {
  const seen = new Set<string>();
  const out: Craft[] = [];
  for (const c of CRAFTS) {
    if (out.length === 3) break;
    if (seen.has(c.group) || !craftPhoto(c.id)) continue;
    seen.add(c.group);
    out.push(c);
  }
  return out;
}

const QUIET = "text-muted-foreground hover:text-foreground underline-offset-4 hover:underline";

/**
 * Your crafts (Work app design, 2026-11-21): the one inventory of a person's crafts and techniques, paid or not. Each
 * row shows where the person is and the three ways out: jobs it leads to, a venture, or the craft for its own sake.
 */
export default async function CraftsPage() {
  const user = await requireUser();
  const [fit, acts] = await Promise.all([workFit(user.id), lifeActs(user.id)]);
  const crafts = [...fit.crafts].sort((a, b) => (ORDER[a.state ?? "drawn"] ?? 3) - (ORDER[b.state ?? "drawn"] ?? 3));
  const ventures = new Set(fit.ventures.map((v) => v.craft.id));
  const projects: Record<string, number> = {};
  for (const a of acts) if (a.kind === "tried" || a.kind === "made") projects[a.record] = (projects[a.record] ?? 0) + 1;
  const add = (
    <Button asChild>
      <Link href="/life/work/discover">Add a craft</Link>
    </Button>
  );

  return (
    <main className={PAGE}>
      <ThingHeader back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title="Your crafts" action={add} />
      <div className="mx-auto grid w-full max-w-2xl gap-6 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h1 id="page-title" className="text-[28px] leading-tight font-semibold tracking-tight">Your crafts</h1>
          <div className="shrink-0">{add}</div>
        </div>

        {crafts.length ? (
          <ul className="divide-y rounded-2xl border" aria-label="Crafts you keep">
            {crafts.map((c) => {
              const jobs = fit.byCraft[c.ref] ?? 0;
              const n = projects[c.record.id] ?? 0;
              const href = `/life/work/crafts/${c.ref}`;
              return (
                <li key={c.record.id} className="flex items-start gap-3 p-3 sm:gap-4 sm:p-4">
                  <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden>
                    <CraftPhoto id={c.ref} alt="" className="size-14 rounded-lg sm:size-16" />
                  </Link>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <Link href={href} className="font-semibold leading-snug break-words hover:underline underline-offset-4">{c.title}</Link>
                    <p className="text-muted-foreground text-sm">
                      {whereOf(c)}
                      {n ? `, ${count(n, "project", "projects")}` : ""}
                    </p>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {jobs ? (
                        <Link href={`/life/work/matches?craft=${encodeURIComponent(c.ref)}`} className={QUIET}>{count(jobs, "job", "jobs")}</Link>
                      ) : (
                        <span className="text-muted-foreground">No jobs name it</span>
                      )}
                      {ventures.has(c.ref) ? <Link href="/life/ventures" className={QUIET}>Explore as a venture</Link> : null}
                      <Link href={href} className={QUIET}>For its own sake</Link>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <section aria-label="No crafts yet" className="grid justify-items-center gap-4 rounded-2xl border p-6 text-center">
            <div className="flex gap-2" aria-hidden>
              {samples().map((c) => <CraftPhoto key={c.id} id={c.id} alt="" className="size-20 rounded-xl sm:size-24" />)}
            </div>
            <p className="max-w-sm text-sm">Name the crafts you have, paid or not. In a minute you will have three to try.</p>
          </section>
        )}

        <p className="text-muted-foreground text-sm">
          Crafts are kept here and read by Work and Scholē.{" "}
          <Link href="/life/work/making" className="text-foreground underline-offset-4 hover:underline">See every craft</Link>
        </p>
      </div>
    </main>
  );
}
