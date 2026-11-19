import Link from "next/link";
import { CalendarIcon, ChevronRightIcon, NotebookPenIcon } from "lucide-react";

/** Reflect's tools, the ones every tile uses (Torian, 2026-11-14: journal and calendar are tools). */
export const TOOLS = [
  { href: "/journal", name: "Journal", about: "What you write, and the log of what you did", icon: NotebookPenIcon },
  { href: "/calendar", name: "Calendar", about: "Your days across every tile, synced with your other calendars", icon: CalendarIcon },
];

/** The tools as large rows, each opening its tool. Shared by /tools and Settings, Tools (2026-11-19). */
export function ToolsList() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {TOOLS.map((t) => (
        <li key={t.href}>
          <Link href={t.href} className="hover:bg-accent flex items-center gap-4 rounded-xl border p-4 transition">
            <span className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-lg"><t.icon className="size-5" /></span>
            <span className="grid min-w-0 flex-1">
              <span className="font-medium">{t.name}</span>
              <span className="text-muted-foreground text-sm">{t.about}</span>
            </span>
            <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
