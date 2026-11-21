import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SUBJECTS } from "@reflect/core/aristotle/index";
import { courseIndex } from "@/components/schole/index";
import { ScholeHome } from "@/components/schole/home";
import { requireUser } from "@/server/session";
import { ListenHome } from "./listen-home";

export const metadata: Metadata = { title: "Scholē" };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
// The shelves' own parameters, from links made before the library had its own page.
const SHELF_KEYS = ["tab", "book", "filled", "show", "sort", "removed"];

/** S1 Home (schole.inventory.json): listening first (S1.0, S1.6), then courses (S1.1 to S1.5). Torian, 2026-11-21:
 * Scholē is a podcast and audiobook platform as much as a course app, and Home leads with what you are listening to. */
export default async function ScholeHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  if (/^[0-9a-f-]{36}$/.test(one(sp.item))) redirect(`/schole/items/${one(sp.item)}`);
  if (one(sp.tab) === "library") redirect(`/schole/browse${one(sp.q) ? `?q=${encodeURIComponent(one(sp.q))}` : ""}`);
  if (SHELF_KEYS.some((k) => one(sp[k]))) {
    const p = new URLSearchParams();
    for (const k of SHELF_KEYS) if (one(sp[k])) p.set(k, one(sp[k]));
    redirect(`/schole/shelves?${p}`);
  }
  const user = await requireUser();
  return <ScholeHome courses={courseIndex()} subjects={SUBJECTS.map((s) => ({ id: s.id, title: s.title, path: s.path }))} listen={<ListenHome userId={user.id} />} />;
}
