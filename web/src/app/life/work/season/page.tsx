import type { Metadata } from "next";
import Link from "next/link";
import { ThingHeader } from "@/components/headers";
import { PAGE } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/session";
import { workspace } from "@/server/work-space";
import { hoursAction } from "../space-actions";

export const metadata: Metadata = { title: "This season" };
export const dynamic = "force-dynamic";
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const BY: Record<string, string> = { kin: "family", polis: "the polis", gifts: "gifts", nature: "nature" };
const LINK = "underline underline-offset-2";

/**
 * This season (doc "Work design guide": the money and hours forms leave the workspace and open from its season strip):
 * what Home's needs cost, what others cover, what is left to earn, and the hours there are for work.
 */
export default async function SeasonPage() {
  const user = await requireUser();
  const s = await workspace(user.id);
  const needNote = s.need.from === "home" ? "What your needs from Home cost you a year." : s.need.from === "household" ? "What your intended household needs a year." : null;
  return (
    <main className={PAGE}>
      <ThingHeader back="/life/work" backLabel="Work" crumbs={[{ label: "Home", href: "/" }, { label: "Work", href: "/life/work" }]} title="This season" />
      <div className="mt-4 grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8">
        <div className="grid gap-1">
          <h1 id="page-title" className="text-3xl font-semibold tracking-tight">This season</h1>
          <p className="text-muted-foreground">What your other tiles say about the work you need now.</p>
        </div>

        <section id="earn" className="grid scroll-mt-20 gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Left to earn a year</h2>
          <p className="text-3xl font-semibold">{s.left !== null ? money(s.left) : "Not known"}</p>
          <p className="text-muted-foreground text-sm">
            Needs a year: <span className="text-foreground font-medium">{s.need.pay !== null ? money(s.need.pay) : "not known"}</span>. {needNote ?? <>Give what your needs cost in <Link href="/group/household" className={LINK}>the household</Link>, or your <Link href="/life/work?k=household" className={LINK}>intended household</Link>.</>}
            {s.need.unknown.length && s.need.from === "home" ? ` No cost given yet for ${s.need.unknown.join(", ").toLowerCase()}.` : ""}
            {" "}Coming in: {money(s.income.year)} a year (<Link href="/life/work?k=income" className={LINK}>income</Link>){s.income.unknown ? `, ${s.income.unknown} not counted` : ""}.
          </p>
        </section>

        <section id="covered" className="grid scroll-mt-20 gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Covered by others</h2>
          {s.need.covered.length ? (
            <ul className="divide-y border-y text-sm">{s.need.covered.map((c) => <li key={c.label} className="flex justify-between gap-3 py-2"><span>{c.label}</span><span className="text-muted-foreground">by {BY[c.by] ?? c.by}</span></li>)}</ul>
          ) : <p className="text-muted-foreground text-sm">None recorded.</p>}
          <p className="text-muted-foreground text-sm">From who meets each need in <Link href="/group/household" className={LINK}>the household</Link>.</p>
        </section>

        <section id="hours" className="grid scroll-mt-20 gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Hours a week for work</h2>
          <form action={hoursAction} className="flex flex-wrap items-center gap-2 text-sm">
            <Input name="hours" type="number" min={0} max={100} defaultValue={s.hours ?? ""} className="h-9 w-20" aria-label="Hours a week you can give to work" />
            <span>hours a week</span>
            <Button type="submit" variant="outline" size="sm">Save</Button>
          </form>
          <p className="text-muted-foreground text-sm">
            {s.learningHours ? <>Learning takes {s.learningHours} hours a week, from your sessions in <Link href="/schole" className={LINK}>Scholē</Link> over four weeks.</> : <>No learning sessions kept in <Link href="/schole" className={LINK}>Scholē</Link> these four weeks.</>}
            {s.careHours ? <> Caring for <Link href="/life/kin" className={LINK}>kin</Link> takes {s.careHours} hours a week.</> : null}
          </p>
        </section>
      </div>
    </main>
  );
}
