// Every Aristotle course, by subject. Each subject's courses live in their own file (logic.ts, nature.ts, ...);
// this file gathers them so Scholē reads one list.
import type { Course, Lesson, Unit } from "./types";
import { SUBJECTS } from "./subjects";
import { LOGIC } from "./logic";
import { NATURE } from "./nature";
import { SOUL_AND_LIFE } from "./soul-and-life";
import { FIRST_PHILOSOPHY } from "./first-philosophy";
import { ETHICS } from "./ethics";
import { POLITICS_RHETORIC_POETICS } from "./politics-rhetoric-poetics";

export * from "./types";
export { SUBJECTS, DIVISIONS, subjectOf } from "./subjects";

export const COURSES: Course[] = [...LOGIC, ...NATURE, ...SOUL_AND_LIFE, ...FIRST_PHILOSOPHY, ...ETHICS, ...POLITICS_RHETORIC_POETICS];

export const courseOf = (id: string): Course | undefined => COURSES.find((c) => c.id === id);
export const coursesIn = (subject: string): Course[] => {
  const s = SUBJECTS.find((x) => x.id === subject);
  return s ? s.path.map((id) => courseOf(id)).filter((c): c is Course => !!c) : [];
};
export const lessonsOf = (c: Course): { unit: Unit; lesson: Lesson }[] => c.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })));
export const lessonOf = (c: Course, id: string) => lessonsOf(c).find((x) => x.lesson.id === id);
/** The lesson before and after, across units, for the lesson page's prev and next. */
export const neighbours = (c: Course, id: string) => {
  const all = lessonsOf(c);
  const i = all.findIndex((x) => x.lesson.id === id);
  return { prev: i > 0 ? all[i - 1] : undefined, next: i >= 0 && i < all.length - 1 ? all[i + 1] : undefined };
};
export const minutesOf = (c: Course): number => lessonsOf(c).reduce((n, x) => n + x.lesson.minutes, 0);

/** The address an Aristotle course is kept under in an examination record, beside the Yale and MIT courses. */
export const SCHOLE_COURSE_BASE = "https://mentura.xyz/schole/c/";
export const scholeCourseUrl = (id: string): string => `${SCHOLE_COURSE_BASE}${id}`;
/** An examinable Scholē course from its address, or null. */
export function scholeCourse(raw: string | null | undefined): { site: "schole"; url: string; id: string } | null {
  if (!raw || !raw.startsWith(SCHOLE_COURSE_BASE)) return null;
  const id = raw.slice(SCHOLE_COURSE_BASE.length).split(/[/?#]/)[0] ?? "";
  return courseOf(id) ? { site: "schole", url: scholeCourseUrl(id), id } : null;
}
