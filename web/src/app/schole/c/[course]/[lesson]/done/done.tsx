"use client";

// L4 Lesson complete, after the end of Uxcel's lesson and its Share lesson (Mobbin flows 0faf91f9 and ed7e20c6): what
// you now know in place of points and accuracy, the week of study, the journal question, Share and Continue.
import Link from "next/link";
import { CheckIcon, LinkIcon } from "lucide-react";
import type { Term } from "@reflect/core/aristotle/types";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { JournalQuestion, TermChip, Week } from "@/components/schole/parts";
import { useSchole } from "@/components/schole/store";

export function Done({ course, courseTitle, lesson, next, unit }: { course: string; courseTitle: string; lesson: { id: string; title: string; terms: Term[]; journal: string }; next: { id: string; title: string; unit: string; sameUnit: boolean } | null; unit: string }) {
  const { say } = useSchole();
  const share = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/schole/c/${course}/${lesson.id}`); say("Link copied. Send it to a friend."); } catch { say("Could not copy here. The address bar has the link."); }
  };
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-12 text-center">
        <Num n="L4" />
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-600 text-white"><CheckIcon className="size-10" /></span>
        <h1 className="mt-5 text-2xl font-semibold">Lesson complete</h1>
        <p className="text-muted-foreground mt-1">{lesson.title} · {courseTitle}</p>

        <section className="relative mt-8 rounded-xl border p-4 text-left">
          <Num n="L4.1" className="absolute -top-2 left-4" />
          <div className="font-semibold">What you now know</div>
          <p className="text-muted-foreground mt-0.5 text-sm">{lesson.title}, and {lesson.terms.length === 1 ? "this term" : "these terms"}:</p>
          <div className="mt-3 flex flex-wrap gap-2">{lesson.terms.map((t) => <TermChip key={t.translit} greek={t.greek} translit={t.translit} english={t.english} />)}</div>
        </section>
        <Week className="mt-4 text-left" />
        <div className="mt-4 text-left"><JournalQuestion q={lesson.journal} /></div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 px-4 py-4">
          <div className="relative"><Num n="L4.3" className="absolute -top-3 left-0" /><Button variant="outline" onClick={share}><LinkIcon />Share lesson</Button></div>
          <div className="relative"><Num n="L4.2" className="absolute -top-3 right-0" />
            {next ? (
              <Button asChild size="lg"><Link href={next.sameUnit ? `/schole/c/${course}/${next.id}` : `/schole/c/${course}`}>{next.sameUnit ? `Next: ${next.title}` : `${unit} done. Back to the course`}</Link></Button>
            ) : <Button asChild size="lg"><Link href={`/schole/examinations/new?course=${course}`}>Course done. Be examined</Link></Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
