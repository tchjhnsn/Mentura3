"use client";

// The Venture Studio frame: C1 top bar. Ventures are switched at the top of the app's one sidebar (./switcher.tsx), and
// the C3 studio nav and C4 venture nav (./nav.ts) are drawn there in place of Mentura's (src/components/sidebar.tsx).
// Modeled on OpenAI Platform (project switcher, grouped nav), Replit and Base44.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { HashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarButton } from "@/components/sidebar";
import { Num, useNums } from "./bits";
import { ventureHref, ventureOf } from "./data";
import { slugOf } from "./nav";

/** "Ask the agent" from any venture screen opens the chief of staff in the Agents view (V6). */
export function useChat() {
  const router = useRouter();
  const slug = slugOf(usePathname() ?? "");
  return { open: false, setOpen: (v: boolean) => { if (v && slug) router.push(ventureHref(slug, "agents")); } };
}

/** C1 Top bar for every Studio screen. Its pages are in the app's one sidebar, under Mentura's (StudioNav in
 * src/components/sidebar.tsx: C3 studio pages, C4 a venture's pages), in place of Mentura's, under the switcher. */
export function StudioFrame({ children }: { children: ReactNode }) {
  const slug = slugOf(usePathname() ?? "/studio");
  const nums = useNums();
  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden md:h-[calc(100dvh-1rem)]">
      <header className="relative flex h-12 shrink-0 items-center gap-1 border-b px-2 md:px-3">
        <Num n="C1" className="absolute top-0.5 left-0.5" />
        <SidebarButton className="-ml-1" />
        <Link href={slug ? ventureHref(slug) : "/studio"} className="hover:bg-accent truncate rounded-md px-2 py-1.5 text-sm font-medium">{slug ? ventureOf(slug).name : "Venture Studio"}</Link>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => nums.set(!nums.on)} aria-pressed={nums.on} title="Show screen and component numbers">
          <HashIcon />
          <span className="hidden sm:inline">{nums.on ? "Numbers on" : "Numbers off"}</span>
        </Button>
      </header>
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export function ScreenHead({ n, title, job, children }: { n: string; title: string; job?: string; children?: ReactNode }) {
  return (
    <div data-virtu-screen={n} className="flex flex-wrap items-start justify-between gap-3 px-4 pt-5 pb-4 md:px-8 md:pt-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><Num n={n} /><h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{title}</h1></div>
        {job ? <p className="text-muted-foreground mt-1 text-sm">{job}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
