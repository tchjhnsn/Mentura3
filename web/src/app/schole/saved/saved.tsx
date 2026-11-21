"use client";

// S7 Saved, after Uxcel's Bookmarks (Mobbin flow f0a078e3): tabs for lessons and courses, newest first, and an empty
// state that says how to save.
import Link from "next/link";
import { useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { Num } from "@/components/studio/bits";
import { cn } from "@/lib/utils";
import { CourseCard, Head, LessonRow, PAGE } from "@/components/schole/parts";
import { useSchole } from "@/components/schole/store";
import type { CourseCardData } from "@/components/schole/index";

type L = { key: string; course: string; courseTitle: string; id: string; title: string; minutes: number; unit: string };

export function Saved({ courses, lessons }: { courses: CourseCardData[]; lessons: L[] }) {
  const { saved } = useSchole();
  const [tab, setTab] = useState<"lessons" | "courses">("lessons");
  const ls = saved.map((k) => lessons.find((l) => l.key === k)).filter((l): l is L => !!l);
  const cs = saved.map((k) => courses.find((c) => c.id === k)).filter((c): c is CourseCardData => !!c);
  const empty = tab === "lessons" ? !ls.length : !cs.length;
  return (
    <div className={PAGE}>
      <Head n="S7" title="Saved" job={`${saved.length} ${saved.length === 1 ? "thing" : "things"} you saved to come back to.`} />
      <div className="mb-6 flex gap-2 border-b pb-4">
        {(["lessons", "courses"] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={cn("rounded-lg border px-3 py-1.5 text-sm capitalize", tab === t ? "bg-foreground text-background border-foreground" : "hover:bg-accent")}>{t} <span className="opacity-70">{t === "lessons" ? ls.length : cs.length}</span></button>)}
      </div>
      {empty ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <BookmarkIcon className="text-muted-foreground mx-auto size-8" />
          <p className="mt-2 font-medium">Nothing saved here yet</p>
          <p className="text-muted-foreground mt-1 text-sm">Tap Save under a lesson&apos;s passage, or beside a course&apos;s Start button.</p>
          <Link href="/schole/courses" className="mt-3 inline-block text-sm underline">Find a course</Link>
        </div>
      ) : tab === "lessons" ? (
        <ul className="relative space-y-2"><Num n="C5" className="absolute -top-2 right-0" />{ls.map((l) => <li key={l.key}><LessonRow course={l.course} id={l.id} title={l.title} minutes={l.minutes} sub={`${l.courseTitle} · ${l.unit}`} /></li>)}</ul>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cs.map((c) => <CourseCard key={c.id} c={c} />)}</div>
      )}
    </div>
  );
}
