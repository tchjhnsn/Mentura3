import type { Metadata } from "next";
import Link from "next/link";
import { GROUPS, type Line, type Stage } from "@reflect/core/plan";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { planOf } from "@/server/plan";

export const metadata: Metadata = { title: "Income plan" };
export const dynamic = "force-dynamic";
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const LINK = "underline underline-offset-2";
const BY: Record<string, string> = { kin: "family", polis: "the polis", gifts: "gifts", nature: "nature" };

/** Where a cost's figure comes from, in a few words, linking the source when it is published. */
function From({ l }: { l: Line }) {
  if (l.from === "estimate" && l.source) return <><a href={l.source.url} className={LINK} target="_blank" rel="noreferrer">{l.source.name}</a>{l.note ? `, ${l.note}` : ""}</>;
  if (l.from === "yours") return <>yours</>;
  if (l.from === "carried") return <>carried from the step before</>;
  if (l.from === "covered") return <>covered by {BY[l.by ?? ""] ?? l.by}</>;
  return <>no figure yet</>;
}

function Row({ label, value, note, quiet }: { label: string; value: string; note: React.ReactNode; quiet?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-4 py-2.5">
      <span className="grid min-w-0"><span className={cn(quiet && "text-muted-foreground")}>{label}</span><span className="text-muted-foreground text-xs">{note}</span></span>
      <span className={cn("shrink-0 font-semibold tabular-nums", quiet && "text-muted-foreground font-normal")}>{value}</span>
    </li>
  );
}

/**
 * The income plan (doc "Already and Not yet design guide", Income plan): what must be earned a year to live as the
 * chosen step would have you live, every cost under it with where its figure came from, and the floor beside it.
 */
export default async function PlanPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const want = (await searchParams).step;
  const user = await requireUser();
  const { plan } = await planOf(user.id);
  const stages: Stage[] = [plan.already, ...plan.steps];
  const s = stages.find((x) => x.id === want) ?? plan.next ?? plan.already;
  const change = s.id === "already" ? "/group/household" : `/plan/steps/${s.id}`;
  return (
    <main className={PAGE}>
      <ThingHeader back="/" backLabel="Home" crumbs={[{ label: "Home", href: "/" }]} title="Income plan" />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid content-start gap-8">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 id="page-title" className="text-lg font-semibold tracking-tight">Income plan</h1>
              <Button asChild><Link href={change}>Change a cost</Link></Button>
            </div>
            <nav aria-label="Step" className="flex flex-wrap gap-2 text-sm">
              {stages.map((x) => <Link key={x.id} href={`/plan?step=${x.id}`} aria-current={x.id === s.id ? "page" : undefined} className={cn("rounded-full border px-3 py-1 transition", x.id === s.id ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>{x.id === "already" ? "Now" : x.name}</Link>)}
            </nav>
            <div>
              <p className="text-[28px] leading-tight font-semibold">{s.leftToEarn !== null ? money(s.leftToEarn) : "Not known yet"}</p>
              <p className="text-muted-foreground text-sm">left to earn a year{s.id === "already" ? " to live as you do now" : ` for ${s.name.toLowerCase()}`}{s.toEarn !== null ? `, of ${money(s.toEarn)} before taxes` : ""}</p>
            </div>
          </div>

          {GROUPS.map((g) => {
            const lines = s.lines.filter((l) => l.group === g.id && l.from !== "covered");
            const tax = g.id === "village" ? s.tax : null;
            if (!lines.length && !tax) return null;
            return (
              <section key={g.id} aria-labelledby={`g-${g.id}`} className="grid gap-1">
                <h2 id={`g-${g.id}`} className="font-semibold">{g.label}</h2>
                <ul className="divide-y border-y text-sm">
                  {lines.map((l) => <Row key={l.key} label={l.label} value={l.month !== null ? `${money(l.month)} a month` : "Not set"} note={<From l={l} />} quiet={l.month === null} />)}
                  {tax ? <Row label="Taxes" value={`${money((tax.federal + tax.payroll) / 12)} a month`} note={<>federal income and payroll tax, filing {tax.filing === "joint" ? "jointly" : "single"}; {tax.sources.map((x, i) => <span key={x.url}>{i ? ", " : ""}<a href={x.url} className={LINK} target="_blank" rel="noreferrer">{x.name}</a></span>)}; state tax and credits not counted</>} /> : null}
                </ul>
              </section>
            );
          })}

          <section aria-labelledby="g-in" className="grid gap-1">
            <h2 id="g-in" className="font-semibold">Coming in and covered</h2>
            <ul className="divide-y border-y text-sm">
              <Row label="Your income" value={`${money(s.income)} a year`} note={<Link href="/life/work?k=income" className={LINK}>your income records</Link>} />
              {s.lines.filter((l) => l.from === "covered").map((l) => <Row key={l.key} label={l.label} value={l.month !== null ? `${money(l.month)} a month` : "Not set"} note={<From l={l} />} quiet />)}
            </ul>
            {s.unknown.length ? <p className="text-muted-foreground text-xs">No figure yet for {s.unknown.join(", ").toLowerCase()}, so they are not counted.</p> : null}
          </section>
        </div>

        <aside className="text-muted-foreground grid content-start gap-1 text-sm">
          <h2 className="text-foreground font-semibold">The floor</h2>
          {plan.floor ? <p>A livable wage for your intended household: <span className="text-foreground font-medium">{money(plan.floor.year)}</span> a year ({plan.floor.source}).</p> : <p>Enter a livable wage from <a href="https://livingwage.mit.edu" className={LINK} target="_blank" rel="noreferrer">MIT&apos;s Living Wage Calculator</a> on your <Link href="/life/work?k=household" className={LINK}>intended household</Link> to see it here.</p>}
        </aside>
      </div>
    </main>
  );
}
