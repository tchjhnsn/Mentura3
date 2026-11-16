import type { Metadata } from "next";
import Link from "next/link";
import { ARGUMENT_COURSE } from "@reflect/core/start-argument";
import { scholarHref, scholarNamed } from "@reflect/core/scholars";
import { UnitCoursePage } from "../unit-course";

export const metadata: Metadata = { title: ARGUMENT_COURSE.name };
export const dynamic = "force-dynamic";

/**
 * The course on argument and speech acts (Torian, 2026-11-16 22:33Z): the modern work behind the practice, unit by unit,
 * then the people it reads, each opening their page of books, articles, talks and podcasts.
 */
export default function ArgumentCoursePage() {
  const people = ARGUMENT_COURSE.people.map((id) => scholarNamed(id)!).filter(Boolean);
  return (
    <UnitCoursePage c={ARGUMENT_COURSE} after={(
      <section className="space-y-3" aria-labelledby="people">
        <h2 id="people" className="text-lg font-semibold tracking-tight">The people this course reads</h2>
        <ul className="divide-y">
          {people.map((x) => (
            <li key={x.id}>
              <Link href={scholarHref(x)} className="hover:bg-muted/60 -mx-2 block rounded-md px-2 py-2.5">
                <span className="text-[15px] font-medium">{x.name}</span>
                <span className="text-muted-foreground block text-sm">{x.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )} />
  );
}
