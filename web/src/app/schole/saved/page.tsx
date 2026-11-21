import type { Metadata } from "next";
import { COURSES, lessonsOf } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { cardOf } from "@/components/schole/index";
import { Saved } from "./saved";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  await requireUser();
  return <Saved courses={COURSES.map(cardOf)} lessons={COURSES.flatMap((c) => lessonsOf(c).map(({ lesson: l, unit }) => ({ key: `${c.id}/${l.id}`, course: c.id, courseTitle: c.title, id: l.id, title: l.title, minutes: l.minutes, unit: unit.title })))} />;
}
