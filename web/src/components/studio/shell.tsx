"use client";

// The Venture Studio frame: C1 top bar with C2 venture switcher. The C3 studio nav and C4 venture nav are listed here
// and drawn in the app's one sidebar, under Mentura's (src/components/sidebar.tsx).
// Modeled on OpenAI Platform (project switcher, grouped nav), Replit and Base44.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CheckIcon, ChevronsUpDownIcon, HashIcon, LayoutGridIcon, LibraryIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarButton } from "@/components/sidebar";
import { Num, useNums } from "./bits";
import { VENTURES, ventureHref, ventureOf } from "./data";
import { slugOf } from "./nav";

/** C2 Venture switcher (OpenAI Platform's project switcher). */
function VentureSwitcher({ slug }: { slug: string | null }) {
  const v = slug ? ventureOf(slug) : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-accent relative flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm">
          <Num n="C2" className="absolute -top-1.5 -right-1" />
          {v ? <span className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} /> : <LibraryIcon className="size-4 shrink-0" />}
          <span className="truncate font-medium">{v ? v.name : "All ventures"}</span>
          <ChevronsUpDownIcon className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Ventures</DropdownMenuLabel>
        {VENTURES.map((x) => (
          <DropdownMenuItem key={x.slug} asChild>
            <Link href={ventureHref(x.slug)} className="flex items-center gap-2">
              <span className="size-4 rounded" style={{ background: `oklch(0.65 0.14 ${x.hue})` }} />
              <span className="flex-1 truncate">{x.name}</span>
              {x.slug === slug ? <CheckIcon className="size-4" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/studio/new"><PlusIcon className="size-4" />New venture</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/studio"><LayoutGridIcon className="size-4" />All ventures</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "Ask the agent" from any venture screen opens the chief of staff in the Agents view (V6). */
export function useChat() {
  const router = useRouter();
  const slug = slugOf(usePathname() ?? "");
  return { open: false, setOpen: (v: boolean) => { if (v && slug) router.push(ventureHref(slug, "agents")); } };
}

/** C1 Top bar for every Studio screen. Its pages are in the app's one sidebar, under Mentura's (StudioNav in
 * src/components/sidebar.tsx: C3 studio pages, C4 a venture's pages), so the Studio and Mentura share one sidebar. */
export function StudioFrame({ children }: { children: ReactNode }) {
  const slug = slugOf(usePathname() ?? "/studio");
  const nums = useNums();
  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden md:h-[calc(100dvh-1rem)]">
      <header className="relative flex h-12 shrink-0 items-center gap-1 border-b px-2 md:px-3">
        <Num n="C1" className="absolute top-0.5 left-0.5" />
        <SidebarButton className="-ml-1" />
        <Link href="/studio" className="hover:bg-accent hidden rounded-md px-2 py-1.5 text-sm md:block">Venture Studio</Link>
        <span className="text-muted-foreground hidden md:inline">/</span>
        <VentureSwitcher slug={slug} />
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
