"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSchole } from "@/components/schole/store";

/** Remembers this lesson as the one the person is on, for Continue. Renders nothing. */
export function OpenMark({ course, lesson }: { course: string; lesson: string }) {
  const { open, ready } = useSchole();
  useEffect(() => { if (ready) open(course, lesson); }, [ready, course, lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** L2.4 The unit's lessons beside the reading, this one in bold, done ones ticked, then Answer the questions. */
export function UnitContents({ course, lesson, unit, lessons }: { course: string; lesson: string; unit: string; lessons: { id: string; title: string }[] }) {
  const { isDone } = useSchole();
  return (
    <div>
      <div className="font-semibold">Contents</div>
      <div className="text-muted-foreground text-xs">{unit}</div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {lessons.map((x) => (
          <li key={x.id}>
            <Link href={`/schole/c/${course}/${x.id}`} aria-current={x.id === lesson ? "page" : undefined} className={cn("flex items-start gap-2 hover:underline", x.id === lesson ? "font-semibold" : "text-muted-foreground")}>
              {isDone(course, x.id) ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <span className="mt-1.5 size-2 shrink-0 rounded-full border" />}
              {x.title}
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-4 w-full"><Link href={`/schole/c/${course}/${lesson}/check`}>{isDone(course, lesson) ? "Answer again" : "Answer the questions"}</Link></Button>
    </div>
  );
}
