import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarIcon, NotebookPenIcon } from "lucide-react";
import type { CalTile } from "@reflect/core/calendar";
import { SectionHeader } from "@/components/headers";
import { Button } from "@/components/ui/button";

/** One of a tile header's icons: a link with its name as its label, pressed when the page is where it leads. */
export function TileIcon({ label, href, here = false, children }: { label: string; href: string; here?: boolean; children: ReactNode }) {
  return <Button asChild variant={here ? "secondary" : "ghost"} size="icon" aria-label={label} title={label}><Link href={href} aria-current={here ? "page" : undefined}>{children}</Link></Button>;
}

/**
 * A tile's header (Torian, 2026-11-14 18:21Z, of Work: "The only thing needed is the workspace and the icons"): the
 * tile's name, or the part open in it, and icons for the tools, the journal and the tile's calendar, after any the
 * tile adds (Work: browse). No search and no tabs; the tile's parts open from its workspace, and back returns to it.
 */
export function TileHeader({ tile, label, part, icons, workspace = `/life/${tile}`, tools = true }: { tile: CalTile; label: string; part?: string | null; icons?: ReactNode; workspace?: string; /** The journal and calendar icons; off where the tile keeps them inside (Scholē's library). */ tools?: boolean }) {
  return (
    <SectionHeader back={part ? workspace : "/"} backLabel={part ? label : "Home"} title={part ?? label} icons={
      <div className="flex items-center gap-1">
        {icons}
        {tools ? <TileIcon label="Journal" href="/journal"><NotebookPenIcon /></TileIcon> : null}
        {tools ? <TileIcon label={`${label}'s calendar`} href={`/calendar?tile=${tile}`}><CalendarIcon /></TileIcon> : null}
      </div>
    } />
  );
}
