import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from "lucide-react";
import { COURSES, courseOf, lessonOf, lessonsOf, neighbours, subjectOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { Art, JournalQuestion, PAGE, SaveButton, TermChip } from "@/components/schole/parts";
import { OpenMark, UnitContents } from "./lesson-bits";

type P = { params: Promise<{ course: string; lesson: string }> };
export const generateMetadata = async ({ params }: P): Promise<Metadata> => {
  const { course, lesson } = await params;
  const c = courseOf(course);
  return { title: (c && lessonOf(c, lesson)?.lesson.title) ?? "Lesson" };
};
export const generateStaticParams = () => COURSES.flatMap((c) => lessonsOf(c).map(({ lesson }) => ({ course: c.id, lesson: lesson.id })));

/** L2 Lesson, after Uxcel's Read theory and Lesson detail (Mobbin flows 007c3248 and dfc9a583): the reading in the
 * middle, the unit's contents and Answer the questions beside it, the journal question below. */
export default async function LessonPage({ params }: P) {
  await requireUser();
  const { course, lesson } = await params;
  const c = courseOf(course);
  const found = c && lessonOf(c, lesson);
  if (!c || !found) notFound();
  const { unit, lesson: l } = found;
  const { prev, next } = neighbours(c, l.id);
  const s = subjectOf(c.subject)!;
  return (
    <div className={PAGE}>
      <OpenMark course={c.id} lesson={l.id} />
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <article className="min-w-0">
          <div className="text-muted-foreground text-xs"><Link href={`/schole/c/${c.id}`} className="hover:underline">{c.title}</Link> / {unit.title}</div>
          <div className="mt-2 flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{l.title}</h1><Num n="L2" /></div>
          <p className="text-muted-foreground mt-1 flex items-center gap-3 text-sm"><span className="flex items-center gap-1"><ClockIcon className="size-4" />{l.minutes} min</span><span>Bekker {l.bekker}</span></p>

          <figure className="bg-muted/40 relative mt-6 rounded-2xl border p-5 md:p-8">
            <Num n="L2.1" className="absolute -top-2 right-4" />
            <blockquote className="font-serif text-xl leading-relaxed md:text-2xl">&ldquo;{l.passage.text}&rdquo;</blockquote>
            <figcaption className="text-muted-foreground mt-4 text-sm">Aristotle, <cite>{c.title}</cite> {l.passage.ref}, translated by {c.translation.translator} ({c.translation.year})</figcaption>
          </figure>
          <div className="mt-2 flex items-center gap-1"><SaveButton k={`${c.id}/${l.id}`} /></div>

          <section className="relative mt-6">
            <Num n="L2.2" className="absolute -top-2 right-0" />
            <h2 className="text-lg font-semibold">What it says</h2>
            <p className="mt-2 text-[17px] leading-relaxed">{l.summary}</p>
          </section>

          {l.terms.length ? (
            <section className="relative mt-6">
              <Num n="L2.3" className="absolute -top-2 right-0" />
              <h2 className="text-lg font-semibold">Terms</h2>
              <ul className="mt-2 space-y-2">
                {l.terms.map((t) => <li key={t.translit} className="flex flex-wrap items-baseline gap-2"><TermChip greek={t.greek} translit={t.translit} english={t.english} /><span className="text-muted-foreground text-sm">{t.gloss}</span></li>)}
              </ul>
            </section>
          ) : null}

          <section className="bg-foreground text-background relative mt-8 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold md:text-2xl">Check that you have it</h2>
            <p className="mt-1 opacity-80">{l.checks.length} questions on this passage. Each answer comes with why. Nothing is scored.</p>
            <Button asChild variant="secondary" size="lg" className="mt-4"><Link href={`/schole/c/${c.id}/${l.id}/check`}>Answer the questions</Link></Button>
          </section>

          <div className="relative mt-6"><Num n="L2.5" className="absolute -top-2 right-4 z-10" /><JournalQuestion q={l.journal} /></div>

          <nav className="relative mt-8 grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Lessons">
            <Num n="L2.6" className="absolute top-2 right-0" />
            {prev ? <Link href={`/schole/c/${c.id}/${prev.lesson.id}`} className="hover:bg-accent rounded-xl border p-3 text-sm"><span className="text-muted-foreground flex items-center gap-1 text-xs"><ArrowLeftIcon className="size-3" />Previous</span><span className="font-medium">{prev.lesson.title}</span></Link> : <span />}
            {next ? <Link href={`/schole/c/${c.id}/${next.lesson.id}`} className="hover:bg-accent rounded-xl border p-3 text-right text-sm"><span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">Next<ArrowRightIcon className="size-3" /></span><span className="font-medium">{next.lesson.title}</span></Link> : null}
          </nav>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Link href={`/schole/c/${c.id}`} className="hover:bg-accent flex items-center gap-3 rounded-xl border p-3">
            <Art subject={c.subject} small className="size-12" />
            <span className="min-w-0"><span className="text-muted-foreground block text-xs">From course · {s.title}</span><span className="block truncate font-medium">{c.title}</span></span>
          </Link>
          <div className="relative rounded-xl border p-4">
            <Num n="L2.4" className="absolute -top-2 left-4" />
            <UnitContents course={c.id} lesson={l.id} unit={unit.title} lessons={unit.lessons.map((x) => ({ id: x.id, title: x.title }))} />
          </div>
        </aside>
      </div>
    </div>
  );
}
