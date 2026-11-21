import type { Metadata } from "next";
import Link from "next/link";
import { COURSES, SUBJECTS } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Num } from "@/components/studio/bits";
import { cardOf } from "@/components/schole/index";
import { CourseCard, Head, PAGE } from "@/components/schole/parts";
import { cn } from "@/lib/utils";
import { CourseView } from "./course-view";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const LEVELS = ["Start here", "Intermediate", "Advanced"] as const;

/** S3 Courses, after Uxcel's (Mobbin flows 19e96245 and 6f01f893): subject tabs, a level filter and the grid. A link
 * with ?u= is one of the Yale or MIT lecture courses Scholē already plays, and opens it as before. */
export default async function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  if (one(sp.u)) return <CourseView userId={user.id} u={one(sp.u)} t={one(sp.t)} by={one(sp.by)} />;
  const subject = one(sp.subject);
  const level = one(sp.level);
  const href = (s: string, l: string) => `/schole/courses?${new URLSearchParams({ ...(s ? { subject: s } : {}), ...(l ? { level: l } : {}) })}`;
  const shown = COURSES.filter((c) => (!subject || c.subject === subject) && (!level || c.level === level))
    .sort((a, b) => SUBJECTS.findIndex((s) => s.id === a.subject) - SUBJECTS.findIndex((s) => s.id === b.subject) || SUBJECTS.find((s) => s.id === a.subject)!.path.indexOf(a.id) - SUBJECTS.find((s) => s.id === b.subject)!.path.indexOf(b.id));
  const pill = (on: boolean) => cn("shrink-0 rounded-lg border px-3 py-1.5 text-sm", on ? "bg-foreground text-background border-foreground" : "hover:bg-accent");
  return (
    <div className={PAGE}>
      <Head n="S3" title="Courses" job={`One course for each of Aristotle's works: ${COURSES.length} so far, a lesson at a time, each lesson in his own words.`} />
      <nav aria-label="Subjects" className="relative -mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <Num n="S3.1" className="absolute top-0 right-0" />
        <ul className="flex gap-2">
          <li><Link href={href("", level)} className={pill(!subject)}>All</Link></li>
          {SUBJECTS.map((s) => <li key={s.id}><Link href={href(s.id, level)} className={pill(subject === s.id)}>{s.title}</Link></li>)}
        </ul>
      </nav>
      <div className="relative flex flex-wrap items-center gap-2 border-b pb-4">
        <Num n="S3.2" className="absolute -top-2 right-0" />
        <span className="text-muted-foreground text-sm">Level</span>
        <Link href={href(subject, "")} className={pill(!level)}>Any</Link>
        {LEVELS.map((l) => <Link key={l} href={href(subject, l)} className={pill(level === l)}>{l}</Link>)}
      </div>
      <section className="relative pt-6">
        <Num n="S3.3" className="absolute top-2 right-0" />
        {shown.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((c) => <CourseCard key={c.id} c={cardOf(c)} />)}</div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">No course at that level in this subject</p>
            <Link href={href(subject, "")} className="text-muted-foreground mt-2 inline-block text-sm underline">Show every level</Link>
          </div>
        )}
      </section>
      <section className="relative mt-10 rounded-xl border p-4">
        <Num n="S3.4" className="absolute -top-2 left-4" />
        <div className="font-semibold">Lecture courses</div>
        <p className="text-muted-foreground mt-0.5 text-sm">Whole university courses from Yale and MIT, taken lecture by lecture with the transcript beside you.</p>
        <Link href="/schole/browse?m=courses" className="mt-2 inline-block text-sm underline underline-offset-4">Browse lecture courses</Link>
      </section>
    </div>
  );
}
