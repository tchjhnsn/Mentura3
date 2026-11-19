import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarIcon, NotebookPenIcon } from "lucide-react";
import type { CalTile } from "@reflect/core/calendar";
import { SectionHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";
import { sideOfPath } from "@/lib/sides";

/** One of a tile header's icons: a link with its name as its label, pressed when the page is where it leads. */
export function TileIcon({ label, href, here = false, children }: { label: string; href: string; here?: boolean; children: ReactNode }) {
  return <Button asChild variant={here ? "secondary" : "ghost"} size="icon" aria-label={label} title={label}><Link href={href} aria-current={here ? "page" : undefined}>{children}</Link></Button>;
}

/**
 * A tile's header (Torian, 2026-11-14 18:21Z, of Work: "The only thing needed is the workspace and the icons"): the
 * tile's name (always, Torian 2026-11-16) and icons for the tools, the journal and the tile's calendar, after any the
 * tile adds (Work: browse). No search and no tabs; the tile's parts open from its workspace and its icons, and the name returns to the workspace.
 * A tile on the shared side (Polis) goes back to Village and polis rather than Home (src/lib/sides.ts).
 */
export function TileHeader({ tile, label, part, icons, workspace = `/life/${tile}`, tools = true }: { tile: CalTile; label: string; part?: string | null; icons?: ReactNode; workspace?: string; /** The journal and calendar icons; off where the tile keeps them inside (Scholē's library). */ tools?: boolean }) {
  const shared = sideOfPath(workspace) === "polis";
  return (
    <SectionHeader back={part ? workspace : shared ? "/v" : "/"} backLabel={part ? label : shared ? "Village and polis" : "Home"} title={label} icons={
      <div className="flex items-center gap-1">
        {icons}
        {tools ? <TileIcon label="Journal" href="/journal"><NotebookPenIcon /></TileIcon> : null}
        {tools ? <TileIcon label={`${label}'s calendar`} href={`/calendar?tile=${tile}`}><CalendarIcon /></TileIcon> : null}
      </div>
    } />
  );
}
