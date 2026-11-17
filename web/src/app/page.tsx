import type { Metadata } from "next";
import Link from "next/link";
import { CalendarIcon, FolderIcon, PlusIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import { requireUser } from "@/server/session";
import { changedTiles, GROUPS, tileFact, type Stage } from "@reflect/core/plan";
import { dashboardFacts } from "@/server/dashboard";
import { GLYPHS, hrefOf, MINE, toneOf, type Tone } from "./home-tiles";
import { HomeToggle } from "./home-toggle";

export const metadata: Metadata = { title: "Reflect" };
export const dynamic = "force-dynamic";

const FILL: Record<Tone, string> = { action: "fill-foreground", thought: "fill-neutral-400", unstated: "fill-neutral-200" };
const DOT: Record<Tone, string> = { action: "bg-foreground", thought: "bg-neutral-400", unstated: "bg-neutral-200" };
const SAY: Record<Tone, string> = { action: "in action", thought: "in thought", unstated: "unstated" };
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The steps still to be reached, in order, the chosen one heavy; Add a step is the screen's one filled element. */
function Steps({ steps, chosen }: { steps: Stage[]; chosen: Stage | null }) {
  if (!steps.length) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
        <p className="font-medium">What is the next thing you want your life to hold?</p>
        <Button asChild><Link href="/plan/steps/new"><PlusIcon />Add a step</Link></Button>
      </div>
    );
  }
  return (
    <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible [&>li]:shrink-0 [&>li]:snap-start">
      {steps.map((s) => (
        <li key={s.id}>
          <Link href={`/?view=not-yet&step=${s.id}`} aria-current={s.id === chosen?.id ? "true" : undefined} className={cn("hover:bg-accent grid w-[7.5rem] gap-0.5 rounded-xl px-3 py-2.5 transition", s.id === chosen?.id ? "border-foreground border-2" : "border")}>
            <span className="line-clamp-2 leading-snug font-semibold first-letter:uppercase">{s.name}</span>
            <span className="text-muted-foreground text-xs">{s.year ?? "Someday"}</span>
            <span className="text-xs">{s.toEarn !== null ? `${money(s.toEarn)} a year` : "Not costed yet"}</span>
          </Link>
        </li>
      ))}
      <li className="flex">
        <Button asChild className="h-auto min-h-16 w-[5.5rem] flex-col gap-0.5 px-2 whitespace-normal"><Link href="/plan/steps/new"><PlusIcon /><span className="text-center leading-tight">Add a step</span></Link></Button>
      </li>
    </ul>
  );
}

/**
 * Home (doc "Already and Not yet design guide"): the tiles in three groups, after Aristotle's order of association.
 * Already is life as it is; Not yet lays out the steps still to be reached, with what each would cost and the tiles
 * it would change. Each tile opens its app, and each group's heading opens that group's dashboard (`/group/<id>`).
 */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const notYet = one(sp.view) === "not-yet";
  const { facts, plan } = await dashboardFacts(user.id);
  const chosen = notYet ? plan.steps.find((s) => s.id === one(sp.step)) ?? plan.next : null;
  const stage = chosen ?? plan.already;
  const changed = chosen ? changedTiles(plan.already, chosen) : null;
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {/* The toggle sits under the header on a phone, full width, so the longer pairs of words fit. */}
        <Button asChild variant="outline" size="icon" aria-label="Ask Reflect">
          <Link href="/chat"><PlusIcon /></Link>
        </Button>
        <div className="col-span-3 row-start-2 flex min-w-0 justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1"><HomeToggle notYet={notYet} /></div>
        <div className="col-start-3 row-start-1 flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Your calendar" title="Calendar">
            <Link href="/calendar"><CalendarIcon /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Your journal" title="Journal">
            <Link href="/journal"><FolderIcon /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Settings" title="Settings">
            <Link href="/settings"><UserIcon /></Link>
          </Button>
        </div>
      </header>

      {notYet ? (
        <section aria-label="Steps still to be reached" className="mt-6 grid gap-4">
          <Steps steps={plan.steps} chosen={chosen} />
          {chosen ? (
            <Link href={`/plan?step=${chosen.id}`} className="group grid w-fit">
              <span className="text-xl font-semibold group-hover:underline">{chosen.toEarn !== null ? `${money(chosen.toEarn)} a year` : "Not costed yet"}</span>
              <span className="text-muted-foreground text-sm">{chosen.toEarn !== null ? `to earn before taxes to live this way, ${money(chosen.leftToEarn ?? 0)} more than comes in` : "Give its costs on the step"}</span>
            </Link>
          ) : null}
        </section>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_4fr_2fr]">
        {GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`group-${g.id}`} className="grid content-start gap-3">
            <h2 id={`group-${g.id}`} className={cn("font-semibold", changed && !g.tiles.some((t) => changed.has(t)) && "text-muted-foreground")}><Link href={`/group/${g.id}`} className="inline-flex items-center gap-1 hover:underline">{g.label}<ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4" /></Link></h2>
            <ul className={cn("grid grid-cols-3 gap-3", g.id === "household" ? "sm:grid-cols-4" : g.id === "person" ? "sm:grid-cols-4 lg:grid-cols-2" : "lg:grid-cols-2")}>
              {g.tiles.map((id) => {
                const t = MINE.find((x) => x.id === id);
                if (!t) return null;
                const dim = changed ? !changed.has(id) : false;
                const tone: Tone = changed ? (dim ? "unstated" : "action") : toneOf(t, facts);
                const fact = tileFact(stage, id);
                const href = hrefOf(t);
                const box = cn("flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border bg-card p-2 text-center shadow-xs transition", dim && "opacity-50");
                const body = (
                  <>
                    <svg viewBox="0 0 100 100" className="size-11" aria-hidden="true"><path d={GLYPHS[t.id]} className={FILL[tone]} fillRule="evenodd" /></svg>
                    <span className="text-sm font-medium">{t.label}</span>
                    {fact ? <span className="text-muted-foreground line-clamp-1 text-[11px] leading-tight">{fact}</span> : null}
                  </>
                );
                return (
                  <li key={id}>
                    {href ? <Link href={href} className={cn(box, "hover:bg-accent")} aria-label={`${t.label}${fact ? `, ${fact}` : ""}, ${SAY[tone]}`}>{body}</Link> : <span className={box}>{body}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {!notYet && plan.next && plan.next.leftToEarn !== null ? (
        <p className="text-muted-foreground mt-8 text-sm"><Link href="/plan" className="hover:text-foreground">Left to earn for your next step, {plan.next.name.toLowerCase()}: {money(plan.next.leftToEarn)} a year</Link></p>
      ) : !notYet ? (
        <p className="text-muted-foreground mt-8 text-sm"><Link href="/plan" className="hover:text-foreground">Your income plan{plan.already.leftToEarn !== null ? `: ${money(plan.already.leftToEarn)} a year left to earn` : ""}</Link></p>
      ) : null}

      {!notYet ? (
        <footer className="text-muted-foreground mt-auto flex justify-center gap-6 pt-8 text-xs">
          {(["unstated", "thought", "action"] as const).map((t) => (
            <span key={t} className="flex items-center gap-2"><i className={cn("inline-block size-2.5 rounded-full", DOT[t])} />{SAY[t].replace(/^./, (c) => c.toUpperCase())}</span>
          ))}
        </footer>
      ) : null}
    </main>
  );
}
