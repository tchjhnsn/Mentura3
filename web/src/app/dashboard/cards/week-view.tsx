"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { WeekLook } from "../week";

/** The look back as a card of tiles, each with what was done in it, and the qualities practised as chips. */
export function WeekView({ look, title, span, open: openAtFirst }: { look: WeekLook; title: string; span: string; open: boolean }) {
  const [open, setOpen] = useState(openAtFirst);
  const empty = !look.tiles.length && !look.qualities.length;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex w-fit items-baseline gap-1.5 text-left">
        <span className={cn(open ? "text-foreground text-lg font-semibold" : "text-sm font-medium")}>{title}</span>
        <span className="text-xs">{span}</span>
        <ChevronDownIcon className={cn("size-4 self-center transition", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {empty ? <p className="text-muted-foreground text-sm">Nothing kept {title === "Last week" ? "last week" : "this week"} yet. What you log in each tile shows here.</p> : null}
        {look.tiles.length ? (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {look.tiles.map((t) => (
              <li key={t.tile}>
                <Link href={t.href} className="bg-card hover:bg-accent grid h-full content-start gap-1 rounded-xl border p-3 transition">
                  <span className="text-sm font-semibold">{t.label}</span>
                  {t.lines.map((l) => <span key={l} className="text-muted-foreground text-sm">{l}</span>)}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {look.qualities.length ? (
          <div className="grid gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Qualities practised</span>
            <ul className="flex flex-wrap gap-2">
              {look.qualities.map((q) => (
                <li key={q.id}><Link href={q.href} className="hover:bg-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">{q.name}<span className="text-muted-foreground text-xs">{q.entries === 1 ? "1 entry" : `${q.entries} entries`}</span></Link></li>
              ))}
            </ul>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
