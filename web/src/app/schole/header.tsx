import { CompassIcon, LibraryIcon } from "lucide-react";
import { TileHeader, TileIcon } from "@/app/life/tile-header";

export type LearnPart = "space" | "shelves" | "reading" | "claims" | "highlights" | "browse";
const PART: Record<LearnPart, string | null> = { space: null, shelves: "My shelves", reading: "Reading", claims: "Claims", highlights: "Highlights", browse: "Browse" };

/**
 * Learn's header, a tile's like the rest (Torian, 2026-11-14 18:21Z: "The only thing needed is the workspace and the
 * icons"): Learn, or the part open in it, with icons for browsing, your shelves, the journal and Learn's calendar.
 * Reading, highlights and claims open from the workspace. One thing's page and a page where you are doing something
 * have their own headers (`@/components/headers`).
 */
export function LearnHeader({ on }: { on: LearnPart }) {
  return (
    <TileHeader tile="learn" label="Scholē" part={PART[on]} workspace="/schole" icons={<>
      <TileIcon label="Browse" href="/schole/browse" here={on === "browse"}><CompassIcon /></TileIcon>
      <TileIcon label="My shelves" href="/schole/shelves" here={on === "shelves"}><LibraryIcon /></TileIcon>
    </>} />
  );
}
