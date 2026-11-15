import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { CourseView } from "./course-view";

export const metadata: Metadata = { title: "Course" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CoursePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  return <CourseView userId={user.id} u={one(sp.u)} t={one(sp.t)} by={one(sp.by)} />;
}
