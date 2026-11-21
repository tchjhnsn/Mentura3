import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenTextIcon, ClockIcon, LanguagesIcon, ListIcon, SignalIcon } from "lucide-react";
import { COURSES, courseOf, lessonsOf, minutesOf, subjectOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Num } from "@/components/studio/bits";
import { indexOf, hours } from "@/components/schole/index";
import { Art, ExamCard, PAGE, SaveButton } from "@/components/schole/parts";
import { CourseActions, CourseProgress, Units } from "./units";

export const generateMetadata = async ({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> => ({ title: courseOf((await params).course)?.title ?? "Course" });
export const generateStaticParams = () => COURSES.map((c) => ({ course: c.id }));

/** L1 Course, after Uxcel's course page (Mobbin flows 2eedd9fc and 371f86d9): the head with Start course, About this
 * course, one level per book with its lessons, and beside them progress and examination by people. */
export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  await requireUser();
  const c = courseOf((await params).course);
  if (!c) notFound();
  const s = subjectOf(c.subject)!;
  const idx = indexOf(c);
  const units = c.units.map((u) => ({ id: u.id, title: u.title, line: u.line, bekker: u.bekker, lessons: u.lessons.map((l) => ({ id: l.id, title: l.title, minutes: l.minutes, checks: l.checks.length })) }));
  return (
    <div className={PAGE}>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <section className="relative border-b pb-6">
            <Num n="L1.1" className="absolute -top-2 right-0" />
            <div className="text-muted-foreground text-xs"><Link href="/schole/courses" className="hover:underline">Courses</Link> / <Link href={`/schole/subjects/${s.id}`} className="hover:underline">{s.title}</Link></div>
            <div className="mt-2 flex items-center gap-2"><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{c.title}</h1><Num n="L1" /></div>
            <p className="text-muted-foreground mt-1 font-serif text-lg">{c.greek} <span className="text-sm italic">· {c.latin}</span></p>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1"><SignalIcon className="size-4" />{c.level}</span>
              <span className="flex items-center gap-1"><ClockIcon className="size-4" />{hours(minutesOf(c))}</span>
              <span className="flex items-center gap-1"><ListIcon className="size-4" />{lessonsOf(c).length} lessons in {c.units.length} {c.units.length === 1 ? "unit" : "units"}</span>
              {c.bekker ? <span className="flex items-center gap-1"><BookOpenTextIcon className="size-4" />Bekker {c.bekker}</span> : null}
            </div>
            <div className="mt-4 flex items-center gap-2"><CourseActions course={idx} /><SaveButton k={c.id} /></div>
          </section>

          <section className="relative border-b py-6">
            <Num n="L1.2" className="absolute top-4 right-0" />
            <h2 className="text-lg font-semibold">About this course</h2>
            <p className="mt-2 leading-relaxed">{c.about}</p>
            {c.caveat ? <p className="bg-muted/50 mt-3 rounded-lg border p-3 text-sm"><span className="font-medium">Note on the text: </span>{c.caveat}</p> : null}
            <dl className="text-muted-foreground mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2"><LanguagesIcon className="size-4" /><span>Read in {c.translation.translator}&apos;s translation ({c.translation.year}), public domain</span></div>
              <div className="flex items-center gap-2"><BookOpenTextIcon className="size-4" /><a href={c.translation.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">The whole text</a></div>
              {c.before.length ? <div className="sm:col-span-2">Read first: {c.before.map((b, i) => { const x = courseOf(b); return x ? <span key={b}>{i ? ", " : ""}<Link href={`/schole/c/${b}`} className="underline underline-offset-4">{x.title}</Link></span> : null; })}</div> : null}
            </dl>
          </section>

          <section className="relative pt-6">
            <Num n="L1.3" className="absolute top-4 right-0" />
            <Units course={c.id} units={units} />
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="relative overflow-hidden rounded-xl border">
            <Art subject={c.subject} className="aspect-[16/9] w-full rounded-none" />
            <div className="p-4"><Num n="L1.4" className="absolute top-2 right-2" /><CourseProgress course={idx} /></div>
          </div>
          <div className="relative"><Num n="L1.5" className="absolute -top-2 right-4 z-10" /><ExamCard title={`the ${c.title}`} course={c.id} /></div>
        </aside>
      </div>
    </div>
  );
}
