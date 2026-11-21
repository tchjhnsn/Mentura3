"use client";

// Scholē's frame, after Uxcel's (Mobbin, Uxcel Home 68933767): C1 sidebar with C2 space switcher, C3 search bar and the
// week of study along the top, and the page. Scholē is an app inside the Reflect console, so the switcher leads to the
// account's three spaces. A lesson check and a finished lesson take the whole screen, as Uxcel's do. The frame marks
// each inventory screen with data-virtu-screen so Virtu's checkScreens can read the build.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  BookmarkIcon, BookOpenIcon, CheckIcon, ChevronsUpDownIcon, CompassIcon, GraduationCapIcon, HashIcon, HomeIcon, LandmarkIcon, LanguagesIcon,
  LibraryIcon, MapIcon, MenuIcon, NotebookPenIcon, RocketIcon, RouteIcon, SearchIcon, SproutIcon, UsersRoundIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Num, useNums } from "@/components/studio/bits";
import { screenAt } from "./inventory";
import { useSchole, weekOf } from "./store";

type Item = { href: string; label: string; icon: typeof HomeIcon; n?: string; exact?: boolean };

const SPACES = [
  { id: "home", name: "Reflect console", about: "You and your household; Scholē is here", href: "/dashboard", icon: HomeIcon },
  { id: "polis", name: "Village and polis", about: "Shared with others", href: "/v", icon: LandmarkIcon },
  { id: "mentura", name: "Mentura", about: "Founders, investors and ventures", href: "/mentura", icon: RocketIcon },
] as const;

/** C2 Space switcher: Scholē sits in the Reflect console; the other two spaces are one tap away. */
function SpaceSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-accent relative flex w-full items-center gap-2.5 rounded-lg border p-2 text-left">
          <Num n="C2" className="absolute -top-2 right-2" />
          <span className="bg-foreground text-background grid size-8 place-items-center rounded-md font-serif text-lg">σ</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">Scholē</span><span className="text-muted-foreground block truncate text-xs">In the Reflect console</span></span>
          <ChevronsUpDownIcon className="text-muted-foreground size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Spaces</DropdownMenuLabel>
        {SPACES.map((s) => (
          <DropdownMenuItem key={s.id} asChild className="gap-2 p-2">
            <Link href={s.href}>
              <span className="flex size-7 items-center justify-center rounded-md border"><s.icon className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm">{s.name}</span><span className="text-muted-foreground block text-xs">{s.about}</span></span>
              {s.id === "home" ? <CheckIcon className="size-4" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/life/work">Work: your crafts and paid work</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAV: { label?: string; items: Item[] }[] = [
  { items: [
    { href: "/schole", label: "Home", icon: HomeIcon, n: "S1", exact: true },
    { href: "/schole/saved", label: "Saved", icon: BookmarkIcon, n: "S7" },
    { href: "/schole/growth", label: "Your growth", icon: SproutIcon, n: "S6" },
  ] },
  { label: "Learn", items: [
    { href: "/schole/courses", label: "Courses", icon: GraduationCapIcon, n: "S3" },
    { href: "/schole/subjects", label: "Subjects", icon: RouteIcon, n: "S4" },
    { href: "/schole/glossary", label: "Glossary", icon: LanguagesIcon, n: "S9" },
    { href: "/schole/examinations/new", label: "Examination", icon: UsersRoundIcon, n: "S10" },
  ] },
  { label: "Yours", items: [
    { href: "/schole/shelves", label: "Your library", icon: LibraryIcon, n: "S11" },
    { href: "/schole/browse", label: "Browse", icon: CompassIcon, n: "S12" },
    { href: "/journal", label: "Journal", icon: NotebookPenIcon },
  ] },
  { label: "Your other spaces", items: [
    { href: "/dashboard", label: "Reflect console", icon: HomeIcon },
    { href: "/v", label: "Village and polis", icon: LandmarkIcon },
    { href: "/mentura", label: "Mentura", icon: RocketIcon },
  ] },
];

function Nav({ path, onGo }: { path: string; onGo?: () => void }) {
  const nums = useNums();
  const row = (active: boolean) => cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm", active ? "bg-background font-medium shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground");
  return (
    <div className="flex h-full flex-col gap-4">
      <Link href="/schole" onClick={onGo} className="px-1 font-serif text-xl font-semibold tracking-tight">Scholē</Link>
      <SpaceSwitcher />
      <nav className="space-y-4">
        {NAV.map((g, i) => (
          <div key={i}>
            {g.label ? <div className="text-muted-foreground px-2 pb-1 text-[11px] font-medium uppercase tracking-wide">{g.label}</div> : null}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`) || (it.href === "/schole/courses" && path.startsWith("/schole/c/"));
                return (
                  <li key={it.href}>
                    <Link href={it.href} onClick={onGo} aria-current={active ? "page" : undefined} className={row(active)}>
                      <it.icon className="size-4 shrink-0" /><span className="flex-1 truncate">{it.label}</span>{it.n ? <Num n={it.n} /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-1">
        <Link href="/schole/map" onClick={onGo} className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-2 text-xs"><MapIcon className="size-3.5" />Screen map<Num n="S0" /></Link>
        <button type="button" onClick={() => nums.set(!nums.on)} aria-pressed={nums.on} className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-2 text-xs"><HashIcon className="size-3.5" />{nums.on ? "Numbers on" : "Numbers off"}</button>
      </div>
    </div>
  );
}

/** C3 Search bar: Enter opens S8 with the words. */
function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (e: FormEvent) => { e.preventDefault(); router.push(`/schole/search?q=${encodeURIComponent(q.trim())}`); };
  return (
    <form onSubmit={go} role="search" className={cn("relative", className)}>
      <Num n="C3" className="absolute -top-2 left-2 z-10" />
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses, lessons, terms" aria-label="Search Scholē" className="bg-muted/60 focus:bg-background h-9 w-full rounded-lg border pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
    </form>
  );
}

/** The days studied this week, small, in the top bar; it opens Your growth. */
function WeekChip() {
  const { days } = useSchole();
  const n = weekOf(days).filter((d) => d.on).length;
  return (
    <Link href="/schole/growth" className="hover:bg-accent flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm" title="Days you studied this week">
      <BookOpenIcon className="size-4" /><span className="tabular-nums">{n}</span><span className="text-muted-foreground max-sm:hidden">{n === 1 ? "day this week" : "days this week"}</span>
    </Link>
  );
}

export function ScholeFrame({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/schole";
  const [menu, setMenu] = useState(false);
  const screen = screenAt(path);
  // The check and the finished lesson take the whole screen (Uxcel, Completing a lesson).
  if (screen && (screen.id === "L3" || screen.id === "L4")) return <div data-virtu-screen={screen.id} className="bg-background min-h-dvh">{children}</div>;
  return (
    <div className="bg-muted/40 flex min-h-dvh">
      <aside className="relative hidden w-60 shrink-0 md:block">
        <div className="sticky top-0 h-dvh overflow-y-auto p-4"><Num n="C1" className="absolute top-1 right-1" /><Nav path={path} /></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="bg-muted/40 sticky top-0 z-20 flex h-14 items-center gap-2 px-3 backdrop-blur md:px-4">
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMenu(true)} aria-label="Menu"><MenuIcon /></Button>
          <Link href="/schole" className="font-serif text-lg font-semibold md:hidden">Scholē</Link>
          <SearchBar className="max-w-sm flex-1 max-md:hidden" />
          <div className="flex-1" />
          <Link href="/schole/search" aria-label="Search" className="p-1.5 md:hidden"><SearchIcon className="size-5" /></Link>
          <WeekChip />
        </header>
        <main data-virtu-screen={screen?.id} className="bg-background min-h-[calc(100dvh-3.5rem)] md:mr-2 md:mb-2 md:rounded-xl md:border">{children}</main>
      </div>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetTitle className="sr-only">Scholē</SheetTitle>
          <Nav path={path} onGo={() => setMenu(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
