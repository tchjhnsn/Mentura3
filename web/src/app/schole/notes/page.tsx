import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAGE } from "@/components/page-header";
import { requireUser } from "@/server/session";
import { listWorks } from "@/server/work-store";
import { LearnHeader, LibraryTabs } from "../header";
import { newNoteAction } from "./actions";

export const metadata: Metadata = { title: "Notes" };
export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** What a note is about: the quote its first line holds when it was started from a thing ("> Meno"), else null. */
const aboutOf = (body: string) => /^>\s*(.+)\n/.exec(body)?.[1]?.trim() ?? null;
const firstLine = (body: string) => body.replace(/^>.*\n+/, "").replace(/^#+\s*/gm, "").trim().split("\n")[0]?.slice(0, 120) ?? "";

/**
 * The library's Notes (guide "Home, browse and library", point 8): the journal's works filed under learning, newest
 * first, each with what it is about. They are journal works, so each opens in the journal's editor, and + starts one.
 */
export default async function NotesPage() {
  const user = await requireUser();
  const notes = (await listWorks(user.id).catch(() => [])).filter((w) => w.domain === "learn");
  return (
    <main className={PAGE}>
      <LearnHeader on="notes" />
      <LibraryTabs on="notes" className="mt-4" />
      <section className="mt-6 max-w-3xl space-y-3">
        <div className="flex items-center gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <form action={newNoteAction.bind(null, null)}>
            <Button type="submit" variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Write a note" title="Write a note"><PlusIcon /></Button>
          </form>
        </div>
        {notes.length ? (
          <ul className="divide-y">
            {notes.map((w) => {
              const about = aboutOf(w.body);
              return (
                <li key={w.id}>
                  <Link href={`/journal/w/${w.id}`} className="hover:bg-muted/60 -mx-2 block rounded-lg px-2 py-3">
                    <span className="block truncate font-medium">{w.title || firstLine(w.body) || "Untitled"}</span>
                    <span className="text-muted-foreground block truncate text-[13px]">{[about ? `On ${about}` : null, when(w.savedAt)].filter(Boolean).join(" · ")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-muted-foreground text-sm">Notes you write about what you hear, watch and read show here. Start one with +, or from a thing&apos;s page. They are kept in your <Link href="/journal" className="underline underline-offset-4">journal</Link>.</p>}
      </section>
    </main>
  );
}
