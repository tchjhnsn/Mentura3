import type { Metadata } from "next";
import { DIALECTIC_COURSE } from "@reflect/core/start-dialectic";
import { UnitCoursePage } from "../unit-course";

export const metadata: Metadata = { title: DIALECTIC_COURSE.name };
export const dynamic = "force-dynamic";

/** Reflect's course on dialectic (Torian, 2026-11-16 21:53Z, "Go"): practice lives in courses. */
export default function DialecticCoursePage() {
  return <UnitCoursePage c={DIALECTIC_COURSE} />;
}
