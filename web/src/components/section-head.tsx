import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Actions on a page (Torian, 2026-11-15 04:25Z): tapping a thing opens it, a + adds, and words are kept only for the
// act a page exists for. So a section's heading is itself the link to all of it (with a chevron), and adding to it is
// a + beside the heading, named for screen readers.

export type Add = { label: string; href: string };

/** A + that adds to a section: an icon, with its name for screen readers and on hover. */
export function AddIcon({ add }: { add: Add }) {
  return (
    <Button asChild variant="ghost" size="icon" className="size-8 shrink-0 rounded-full" title={add.label}>
      <Link href={add.href} aria-label={add.label}><PlusIcon /></Link>
    </Button>
  );
}

/** A section's heading: its title (a link with a chevron when the section has a page of its own), a + to add, a note. */
export function SectionHead({ title, note, href, add, className = "" }: { title: ReactNode; note?: ReactNode; href?: string; add?: Add; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <h2 className="min-w-0 text-lg font-semibold tracking-tight">
          {href ? <Link href={href} className="group inline-flex items-center gap-0.5 hover:underline hover:underline-offset-4">{title}<ChevronRightIcon className="text-muted-foreground size-5 shrink-0 transition group-hover:translate-x-0.5" /></Link> : title}
        </h2>
        {add ? <AddIcon add={add} /> : null}
      </div>
      {note ? <p className="text-muted-foreground text-sm">{note}</p> : null}
    </div>
  );
}
