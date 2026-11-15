import Link from "next/link";
import { CompassIcon, LibraryIcon } from "lucide-react";
import { TileHeader, TileIcon } from "@/app/life/tile-header";
import { cn } from "@/lib/utils";

export type LearnPart = "space" | "shelves" | "reading" | "claims" | "highlights" | "browse" | "notes" | "schedule" | "lists";
const LIBRARY: LearnPart[] = ["shelves", "highlights", "notes", "schedule", "lists"];
const PART: Record<LearnPart, string | null> = { space: null, shelves: "Your library", reading: "Reading", claims: "Claims", highlights: "Your library", browse: "Browse", notes: "Your library", schedule: "Your library", lists: "Your library" };

/**
 * Scholē's header (guide "Home, browse and library", Torian agreed 2026-11-15 23:07Z): the title, or the part open,
 * with two icons, Browse and Your library. The journal and the calendar are not icons here: they are the library's
 * Notes and Schedule tabs, filtered to Scholē. One thing's page and a page where you are doing something have their
 * own headers (`@/components/headers`).
 */
export function LearnHeader({ on }: { on: LearnPart }) {
  return (
    <TileHeader tile="learn" label="Scholē" part={PART[on]} workspace="/schole" tools={false} icons={<>
      <TileIcon label="Browse" href="/schole/browse" here={on === "browse"}><CompassIcon /></TileIcon>
      <TileIcon label="Your library" href="/schole/shelves" here={LIBRARY.includes(on)}><LibraryIcon /></TileIcon>
    </>} />
  );
}

const TABS = [["shelves", "Kept", "/schole/shelves"], ["highlights", "Highlights", "/schole/highlights"], ["notes", "Notes", "/schole/notes"], ["schedule", "Schedule", "/schole/schedule"], ["lists", "Lists", "/schole/lists"]] as const;

/** The library's tabs: what you kept, your highlights, your notes (journal entries filed under learning), your Scholē calendar, and lists. One row that swipes on a phone. */
export function LibraryTabs({ on, className }: { on: (typeof TABS)[number][0]; className?: string }) {
  return (
    <nav aria-label="Your library" className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <ul className="flex gap-5 border-b">
        {TABS.map(([id, label, href]) => (
          <li key={id} className="shrink-0">
            <Link href={href} aria-current={on === id ? "page" : undefined} className={cn("-mb-px inline-block border-b-2 py-2 text-sm whitespace-nowrap", on === id ? "border-foreground font-medium" : "text-muted-foreground hover:text-foreground border-transparent")}>{label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
