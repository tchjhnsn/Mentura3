// Every Greek term the Aristotle courses teach, gathered by transliteration, with the lessons that teach it.
import { COURSES, lessonsOf } from "@reflect/core/aristotle/index";

export type GlossTerm = { greek: string; translit: string; english: string; gloss: string; where: { course: string; courseTitle: string; lesson: string; lessonTitle: string }[] };

export function glossary(): GlossTerm[] {
  const by = new Map<string, GlossTerm>();
  for (const c of COURSES) for (const { lesson: l } of lessonsOf(c)) for (const t of l.terms) {
    const k = t.translit.toLowerCase();
    const g = by.get(k) ?? { ...t, where: [] };
    g.where.push({ course: c.id, courseTitle: c.title, lesson: l.id, lessonTitle: l.title });
    by.set(k, g);
  }
  return [...by.values()].sort((a, b) => a.translit.normalize("NFD").replace(/\p{M}/gu, "").localeCompare(b.translit.normalize("NFD").replace(/\p{M}/gu, "")));
}
