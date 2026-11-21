import type { Metadata } from "next";
import { SUBJECTS } from "@reflect/core/aristotle/index";
import { requireUser } from "@/server/session";
import { courseIndex } from "@/components/schole/index";
import { Growth } from "./growth";

export const metadata: Metadata = { title: "Your growth" };

export default async function GrowthPage() {
  await requireUser();
  return <Growth subjects={SUBJECTS.map((s) => ({ id: s.id, title: s.title }))} courses={courseIndex().map((c) => ({ id: c.id, subject: c.subject, lessons: c.lessons }))} />;
}
