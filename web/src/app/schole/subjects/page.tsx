import type { Metadata } from "next";
import Link from "next/link";
import { DIVISIONS, SUBJECTS, coursesIn, minutesOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Num } from "@/components/studio/bits";
import { Art, Head, PAGE } from "@/components/schole/parts";
import { hours } from "@/components/schole/index";

export const metadata: Metadata = { title: "Subjects" };

/** S4 Subjects, after Uxcel's Career paths (Mobbin flow df720b4d): each subject a path through its works, grouped by
 * Aristotle's division of knowing by its end (Metaphysics VI.1). */
export default async function SubjectsPage() {
  await requireUser();
  return (
    <div className={PAGE}>
      <Head n="S4" title="Subjects" job="Aristotle divided what can be known by what it is for: knowing for its own sake, doing well, and making things, with logic as the instrument of all three." />
      <div className="space-y-10">
        {DIVISIONS.map((d, i) => (
          <section key={d.id} className="relative">
            {i === 0 ? <Num n="S4.1" className="absolute -top-2 right-0" /> : null}
            <h2 className="text-lg font-semibold">{d.title}</h2>
            <p className="text-muted-foreground text-sm">{d.line}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SUBJECTS.filter((s) => s.division === d.id).map((s) => {
                const cs = coursesIn(s.id);
                return (
                  <Link key={s.id} href={`/schole/subjects/${s.id}`} className="bg-card group relative flex flex-col rounded-xl border p-3 hover:shadow-md">
                    <Num n="C13" className="absolute top-2 right-2" />
                    {i === 0 ? <Num n="S4.2" className="absolute top-2 right-12" /> : null}
                    <Art subject={s.id} className="aspect-[16/9] w-full" />
                    <div className="px-1 pt-3">
                      <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Subject</span>
                      <div className="font-semibold group-hover:underline">{s.title} <span className="text-muted-foreground font-serif font-normal">{s.greek}</span></div>
                      <p className="text-muted-foreground mt-1 text-sm">{s.line}</p>
                      <p className="text-muted-foreground mt-2 text-xs">{cs.length} {cs.length === 1 ? "work" : "works"} · {hours(cs.reduce((n, c) => n + minutesOf(c), 0))}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
