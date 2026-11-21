import type { Metadata } from "next";
import { SUBJECTS } from "@reflect/core/aristotle/index";
import { courseIndex } from "@/components/schole/index";
import { ScholeHome } from "@/components/schole/home";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Scholē" };

/** S1 Home (schole.inventory.json). Scholē's earlier front page (shelves, collections, doors) gave way to this one,
 * after Uxcel's, on 2026-11-21; Browse and Your library keep what it showed. */
export default async function ScholeHomePage() {
  await requireUser();
  return <ScholeHome courses={courseIndex()} subjects={SUBJECTS.map((s) => ({ id: s.id, title: s.title, path: s.path }))} />;
}
