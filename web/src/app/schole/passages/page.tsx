import { redirect } from "next/navigation";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Search inside your books is now a mode of Highlights' search (the Scholē design guide); old links land there. */
export default async function PassagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = one((await searchParams).q);
  redirect(`/schole/highlights?in=books${q ? `&q=${encodeURIComponent(q)}` : ""}`);
}
