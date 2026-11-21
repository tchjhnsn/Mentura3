import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { courseOf, lessonOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { Check } from "./check";

export const metadata: Metadata = { title: "Lesson check" };

/** L3 Lesson check (schole.inventory.json): the questions and the passage, handed to the client. */
export default async function CheckPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  await requireUser();
  const { course, lesson } = await params;
  const c = courseOf(course);
  const found = c && lessonOf(c, lesson);
  if (!c || !found) notFound();
  const l = found.lesson;
  return <Check course={c.id} lesson={l.id} title={l.title} checks={l.checks} passage={{ text: l.passage.text, ref: `${c.title} ${l.passage.ref}` }} />;
}
