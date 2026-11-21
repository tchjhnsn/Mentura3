"use client";

import { Progress } from "@/components/schole/parts";
import { useSchole } from "@/components/schole/store";

/** How far the person is in one work on a subject's path; nothing until they start it. */
export function PathDone({ course, lessons }: { course: string; lessons: number }) {
  const { done } = useSchole();
  const n = (done[course] ?? []).length;
  if (!n) return null;
  return <div className="mt-2 flex items-center gap-2 text-xs"><Progress value={n / lessons} className="w-28" /><span className="text-muted-foreground">{n} of {lessons} read</span></div>;
}
