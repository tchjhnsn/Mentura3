"use client";

// S6 Your growth, after Uxcel's Skill graph (Mobbin flow efb89081), turned to Scholē's purpose: nature, habits and
// reason (Politics VII.13). Reason is drawn as Uxcel draws skills, one axis per subject, but from what you have read
// and checked, not from a test score, and with no ranking against other people.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { cn } from "@/lib/utils";
import { Head, PAGE, Week } from "@/components/schole/parts";
import { today, useSchole } from "@/components/schole/store";

type S = { id: string; title: string };
type C = { id: string; subject: string; lessons: number };

function Radar({ axes }: { axes: { label: string; v: number }[] }) {
  const R = 120, cx = 160, cy = 150;
  const pt = (i: number, r: number) => { const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const; };
  const ring = (f: number) => axes.map((_, i) => pt(i, R * f).join(",")).join(" ");
  return (
    <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-md" role="img" aria-label="How far you know each subject">
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} className="fill-none stroke-border" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-border" />; })}
      <polygon points={axes.map((a, i) => pt(i, R * Math.max(0.03, a.v)).join(",")).join(" ")} className="fill-foreground/15 stroke-foreground" strokeWidth={2} />
      {axes.map((a, i) => { const [x, y] = pt(i, R + 18); return <text key={a.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">{a.label}</text>; })}
    </svg>
  );
}

export function Growth({ subjects, courses }: { subjects: S[]; courses: C[] }) {
  const { done, days, picks } = useSchole();
  const axes = subjects.map((s) => {
    const cs = courses.filter((c) => c.subject === s.id);
    const total = cs.reduce((n, c) => n + c.lessons, 0);
    const read = cs.reduce((n, c) => n + (done[c.id] ?? []).length, 0);
    return { id: s.id, label: s.title, v: total ? read / total : 0, read, total };
  });
  const any = axes.some((a) => a.read);
  const last28 = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return d.toISOString().slice(0, 10); });
  return (
    <div className={PAGE}>
      <Head n="S6" title="Your growth" job="Aristotle says people become good through nature, habit and reason (Politics VII.13). Here is each, from what you have done in Scholē." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section id="reason" className="relative rounded-xl border p-4">
          <Num n="S6.1" className="absolute -top-2 left-4" />
          <div className="font-semibold">Reason: what you know</div>
          <p className="text-muted-foreground text-sm">The share of each subject&apos;s lessons you have read and checked. Knowing it well enough to teach it is shown by examination, by people.</p>
          <Radar axes={axes} />
          {!any ? <p className="text-muted-foreground text-center text-sm">Finish a lesson and its subject starts to fill. <Link href="/schole/courses" className="underline">Find a course</Link></p> : null}
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {axes.map((a) => <li key={a.id} className="flex justify-between"><Link href={`/schole/subjects/${a.id}`} className="hover:underline">{a.label}</Link><span className="text-muted-foreground tabular-nums">{a.read} of {a.total}</span></li>)}
          </ul>
        </section>
        <div className="space-y-4">
          <section id="habits" className="relative space-y-3 rounded-xl border p-4">
            <Num n="S6.2" className="absolute -top-2 left-4" />
            <div className="font-semibold">Habits: how steadily you study</div>
            <p className="text-muted-foreground text-sm">{days.length} {days.length === 1 ? "day" : "days"} of study in all. The last four weeks:</p>
            <ol className="grid grid-cols-7 gap-1.5" aria-label="The last 28 days">
              {last28.map((d) => <li key={d} title={d} className={cn("aspect-square rounded-sm border", days.includes(d) && "bg-foreground border-foreground", d === today() && "ring-ring ring-2")} />)}
            </ol>
          </section>
          <Week />
          <section id="nature" className="relative rounded-xl border p-4">
            <Num n="S6.3" className="absolute -top-2 left-4" />
            <div className="font-semibold">Nature: what draws you</div>
            <p className="text-muted-foreground text-sm">{picks.length ? "You said you want to understand:" : "You have not said yet what you want to understand."}</p>
            {picks.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{picks.map((p) => <li key={p}><Link href={`/schole/subjects/${p}`} className="hover:bg-accent rounded-lg border px-2 py-1 text-sm">{subjects.find((s) => s.id === p)?.title}</Link></li>)}</ul> : null}
            <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/schole/start">{picks.length ? "Change" : "Choose subjects"}</Link></Button>
          </section>
        </div>
      </div>
    </div>
  );
}
