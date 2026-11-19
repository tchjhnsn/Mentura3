import type { ReactNode } from "react";
import { SearchButton } from "./search-button";
import { SidebarButton } from "./sidebar";

/** The page width every screen shares, so the header sits in the same place as you move between pages. */
export const PAGE = "mx-auto w-full max-w-5xl px-6 py-6";

/**
 * The header of the journal's, the log's and the chat's pages (Learn's are in `./headers`): the title at the left (no back button, 2026-11-19), the page's actions at the right.
 * Same height, type and spacing everywhere, so only the words change as you move around.
 */
export function PageHeader({ title, children }: { /** Kept for callers; no back button shows. */ back?: string; backLabel?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="bg-background sticky top-0 z-30 shadow-[0_0_0_100vmax_var(--background)] [clip-path:inset(-100vmax_-100vmax_0)] flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-0">
        <SidebarButton className="-ml-2" />
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight">{title}</h1>
        <span className="sm:hidden"><SearchButton keys={false} /></span>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}<span className="hidden sm:inline-flex"><SearchButton /></span></div>
    </header>
  );
}
