// The light index of the courses that client screens need (titles and lesson order, no lesson text), made on the
// server from @reflect/core/aristotle so the full course text never ships to the browser.
import { COURSES, SUBJECTS, lessonsOf, minutesOf, type Course } from "@reflect/core/aristotle/index";

export type CourseCardData = { id: string; title: string; greek: string; subject: string; subjectTitle: string; level: string; about: string; minutes: number; lessons: number; units: number };
export type CourseIndex = CourseCardData & { order: { id: string; title: string; unit: string; minutes: number }[] };

export const cardOf = (c: Course): CourseCardData => ({
  id: c.id, title: c.title, greek: c.greek, subject: c.subject, subjectTitle: SUBJECTS.find((s) => s.id === c.subject)?.title ?? c.subject,
  level: c.level, about: c.about, minutes: minutesOf(c), lessons: lessonsOf(c).length, units: c.units.length,
});
export const indexOf = (c: Course): CourseIndex => ({ ...cardOf(c), order: lessonsOf(c).map(({ unit, lesson }) => ({ id: lesson.id, title: lesson.title, unit: unit.title, minutes: lesson.minutes })) });
export const courseIndex = (): CourseIndex[] => COURSES.map(indexOf);
export const hours = (minutes: number): string => (minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 6) / 10} h`);
