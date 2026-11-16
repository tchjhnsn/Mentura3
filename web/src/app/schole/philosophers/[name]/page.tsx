import { notFound, permanentRedirect } from "next/navigation";
import { personById, personHref } from "@reflect/core/historical-people";

/** Philosopher pages became person pages (Torian, 2026-11-16 04:02Z); old links land on the new page and tab. */
export default async function OldPhilosopher({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const x = personById((await params).name);
  if (!x) notFound();
  const tab = (await searchParams).tab;
  permanentRedirect(personHref(x, tab === "read" ? "about" : typeof tab === "string" && tab !== "works" ? tab : undefined));
}
