import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UsersRoundIcon } from "lucide-react";
import { SUBJECTS, coursesIn, lessonsOf, minutesOf, subjectOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { Head, PAGE } from "@/components/schole/parts";
import { hours } from "@/components/schole/index";
import { PathDone } from "./path-done";

export const generateMetadata = async ({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> => ({ title: subjectOf((await params).subject)?.title ?? "Subject" });
export const generateStaticParams = () => SUBJECTS.map((s) => ({ subject: s.id }));

/** S5 Subject, after Uxcel's career path page (Mobbin flow a53088fe): its works as numbered steps in reading order,
 * and examination by people at the end where Uxcel puts its certification. */
export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  await requireUser();
  const s = subjectOf((await params).subject);
  if (!s) notFound();
  const cs = coursesIn(s.id);
  return (
    <div className={PAGE}>
      <Head n="S5" kicker={<Link href="/schole/subjects" className="hover:underline">Subjects</Link>} title={<>{s.title} <span className="text-muted-foreground font-serif font-normal">{s.greek}</span></>} job={s.line}>
        {cs[0] ? <Button asChild><Link href={`/schole/c/${cs[0].id}`}>Start with {cs[0].title}</Link></Button> : null}
      </Head>
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <ol className="relative space-y-4">
          <Num n="S5.1" className="absolute -top-2 right-0" />
          {cs.map((c, i) => (
            <li key={c.id} className="flex gap-4">
              <span className="bg-muted grid size-10 shrink-0 place-items-center rounded-full font-semibold">{i + 1}</span>
              <Link href={`/schole/c/${c.id}`} className="bg-card flex-1 rounded-xl border p-4 hover:shadow-md">
                <div className="font-semibold">{c.title} <span className="text-muted-foreground font-serif text-sm font-normal">{c.greek}</span></div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{c.about}</p>
                <p className="text-muted-foreground mt-2 text-xs">{c.level} · {hours(minutesOf(c))} · {lessonsOf(c).length} lessons</p>
                <PathDone course={c.id} lessons={lessonsOf(c).length} />
              </Link>
            </li>
          ))}
          {cs.length === 0 ? <li className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">The courses for this subject are being written.</li> : null}
        </ol>
        <aside className="relative h-fit rounded-xl border p-4">
          <Num n="S5.2" className="absolute -top-2 left-4" />
          <Num n="C12" className="absolute -top-2 left-14" />
          <div className="flex items-center gap-2 font-semibold"><UsersRoundIcon className="size-4" />Examination by people</div>
          <p className="text-muted-foreground mt-1 text-sm">When you have read the path, say what you will answer for in {s.title.toLowerCase()} and invite people to question you in person. No grade: each examiner writes whether they attest that you know it.</p>
          {cs[0] ? <Button asChild variant="outline" className="mt-3 w-full"><Link href={`/schole/examinations/new?course=${cs[cs.length - 1]!.id}`}>Put yourself under examination</Link></Button> : null}
        </aside>
      </div>
    </div>
  );
}
