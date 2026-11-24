"use client";

// Mentura's frame: the page, with C8 Complete profile at the bottom right. Its navigation is the app's one sidebar
// (MenturaNav in src/components/sidebar.tsx), which shows Mentura's links on Mentura's pages; this frame has no sidebar
// of its own (Torian, 2026-11-24: two sidebars on one screen). On a phone the header opens that sidebar.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Num } from "@/components/studio/bits";
import { SidebarButton } from "@/components/sidebar";

export const DISCOVERED = 62;

/** C8 Complete profile: the share of your Mentura profile that is filled, with the next steps. */
function CompleteProfile() {
  const [open, setOpen] = useState(false);
  const steps = [{ t: "Add what you are looking for", done: true, href: "/mentura/profile/edit" }, { t: "Pin your best work", done: true, href: "/mentura/profile" }, { t: "Link a venture", done: true, href: "/mentura/profile" }, { t: "Add a photo", done: false, href: "/mentura/profile/edit" }, { t: "Confirm one social link", done: false, href: "/mentura/profile/edit" }];
  const pct = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  return (
    <div className="bg-background fixed right-4 bottom-4 z-30 w-72 rounded-2xl border shadow-lg max-md:hidden">
      <Num n="C8" className="absolute -top-2 left-4" />
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-3">
        <span aria-hidden className="grid size-10 place-items-center rounded-full text-[11px] font-semibold tabular-nums" style={{ background: `conic-gradient(var(--foreground) ${pct * 3.6}deg, var(--muted) 0)` }}><span className="bg-background grid size-8 place-items-center rounded-full">{pct}%</span></span>
        <span className="flex-1 text-left font-medium">Complete profile</span>
        {open ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
      </button>
      {open ? (
        <ul className="space-y-1 border-t p-3 text-sm">
          {steps.map((s) => <li key={s.t}><Link href={s.href} onClick={() => setOpen(false)} className={cn("hover:bg-accent -mx-1 flex items-center gap-2 rounded-md px-1 py-0.5", s.done && "text-muted-foreground line-through")}><span className={cn("size-3.5 rounded-full border", s.done && "bg-foreground border-foreground")} />{s.t}</Link></li>)}
        </ul>
      ) : null}
    </div>
  );
}

/** The frame every Mentura screen sits in. */
export function MenturaFrame({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/mentura";
  return (
    <>
      <header className="bg-background sticky top-0 z-20 flex h-12 items-center gap-2 border-b px-3 md:hidden">
        <SidebarButton />
        <Link href="/mentura" className="font-semibold">Mentura</Link>
      </header>
      <main className="min-h-dvh">{children}</main>
      {path.startsWith("/mentura/ai") ? null : <CompleteProfile />}
    </>
  );
}
