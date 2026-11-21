import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { courseOf, lessonOf, neighbours } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Done } from "./done";

export const metadata: Metadata = { title: "Lesson complete" };

/** L4 Lesson complete (schole.inventory.json). */
export default async function DonePage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  await requireUser();
  const { course, lesson } = await params;
  const c = courseOf(course);
  const found = c && lessonOf(c, lesson);
  if (!c || !found) notFound();
  const { next } = neighbours(c, lesson);
  const sameUnit = next && next.unit.id === found.unit.id;
  return <Done course={c.id} courseTitle={c.title} lesson={{ id: found.lesson.id, title: found.lesson.title, terms: found.lesson.terms, journal: found.lesson.journal }}
    next={next ? { id: next.lesson.id, title: next.lesson.title, unit: next.unit.title, sameUnit: !!sameUnit } : null} unit={found.unit.title} />;
}
