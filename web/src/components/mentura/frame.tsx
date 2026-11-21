"use client";

// Mentura's frame, after Contra's (data.ts REFS.home): C1 sidebar with C2 space switcher and C3 Create, the page in the
// middle, C14 notifications panel beside the sidebar, and C8 Complete profile at the bottom right. Mentura is one of the
// three spaces of the one account (Reflect console, Village and polis, Mentura), so the switcher leads back to the other
// two. Founder and investor are attributes on the account (M15), not workspaces. A full-screen app of its own, like the
// Venture Studio (src/app/layout.tsx leaves /mentura bare).
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BellIcon, CalendarDaysIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon, CompassIcon, HashIcon, HomeIcon,
  LandmarkIcon, LayoutGridIcon, MapIcon, MenuIcon, MessageSquareIcon, PlusIcon, RadarIcon, RocketIcon, SparklesIcon, UserRoundIcon, VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Num, useNums } from "@/components/studio/bits";
import { CONVOS, ME, NOTES, personOf, REQUESTS } from "./data";
import { Face } from "./parts";
import { NotificationList } from "./notifications";
import { useMentura } from "./store";

type Item = { href: string; label: string; icon: typeof HomeIcon; n?: string; badge?: number; right?: string; exact?: boolean; panel?: boolean };

export const DISCOVERED = 62;

/** C2 Space switcher: the account's three spaces, as in Reflect's own sidebar (src/components/sidebar.tsx). */
const SPACES = [
  { id: "home", name: "Reflect console", about: "You and your household", href: "/dashboard", icon: HomeIcon },
  { id: "polis", name: "Village and polis", about: "Shared with others", href: "/v", icon: LandmarkIcon },
  { id: "mentura", name: "Mentura", about: "Founders, investors and ventures", href: "/mentura", icon: RocketIcon },
] as const;

function SpaceSwitcher() {
  const me = personOf(ME);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-accent relative flex w-full items-center gap-2.5 rounded-lg border p-2 text-left">
          <Num n="C2" className="absolute -top-2 right-2" />
          <Face handle={ME} size={32} name={false} plain />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">Mentura</span><span className="text-muted-foreground block truncate text-xs">{me.name}</span></span>
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
              {s.id === "mentura" ? <CheckIcon className="size-4" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/mentura/profile/edit">How you appear in Mentura</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/settings/account">Account, shared across spaces</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** C3 Create: a post, an event, a venture or a meeting. */
function Create({ onGo }: { onGo?: () => void }) {
  const MADE = [
    { href: "/mentura?compose=1", label: "Post", what: "Something you made or are doing", icon: HashIcon },
    { href: "/mentura/events?new=1", label: "Event", what: "A dinner, a demo day, a meetup", icon: CalendarDaysIcon },
    { href: "/studio/new", label: "Venture", what: "Start one in the Venture Studio", icon: RocketIcon },
    { href: "/meetings", label: "Meeting", what: "Notes, guests and the call", icon: VideoIcon },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative w-full rounded-full"><Num n="C3" className="absolute -top-2 right-3" /><PlusIcon />Create</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {MADE.map((m) => (
          <DropdownMenuItem key={m.label} asChild>
            <Link href={m.href} onClick={onGo} className="flex items-start gap-2"><m.icon className="mt-0.5 size-4" /><span><span className="block font-medium">{m.label}</span><span className="text-muted-foreground text-xs">{m.what}</span></span></Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Nav({ path, onGo, onNotes }: { path: string; onGo?: () => void; onNotes: () => void }) {
  const nums = useNums();
  const { read } = useMentura();
  const unread = NOTES.filter((x) => x.unread && !read.includes(x.id)).length;
  const NAV: { label?: string; items: Item[] }[] = [
    { items: [
      { href: "/mentura", label: "Home", icon: HomeIcon, n: "M1", exact: true },
      { href: "/mentura/dashboard", label: "Dashboard", icon: LayoutGridIcon, n: "M2" },
      { href: "/mentura/ai", label: "AI chat", icon: SparklesIcon, n: "M3" },
      { href: "/mentura/notifications", label: "Notifications", icon: BellIcon, n: "M4", badge: unread, panel: true },
      { href: "/mentura/messages", label: "Messages", icon: MessageSquareIcon, n: "M5", badge: [...CONVOS, ...REQUESTS].reduce((s, c) => s + c.unread, 0) },
      { href: "/mentura/profile", label: "My profile", icon: UserRoundIcon, n: "M6" },
      { href: "/mentura/discovered", label: "Get discovered", icon: RadarIcon, n: "M8", right: `${DISCOVERED}%` },
    ] },
    { label: "Build", items: [
      { href: "/studio", label: "Venture Studio", icon: RocketIcon },
      { href: "/mentura/meetings", label: "Meetings", icon: VideoIcon, n: "M14" },
    ] },
    { label: "Discovery", items: [
      { href: "/mentura/discover", label: "Discover", icon: CompassIcon, n: "M9" },
      { href: "/mentura/events", label: "Events", icon: CalendarDaysIcon, n: "M10" },
      { href: "/mentura/map", label: "Screen map", icon: MapIcon, n: "M0" },
    ] },
    { label: "Your other spaces", items: [
      { href: "/dashboard", label: "Reflect console", icon: HomeIcon },
      { href: "/v", label: "Village and polis", icon: LandmarkIcon },
    ] },
  ];
  const row = (it: Item, active: boolean) => cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm", active ? "bg-background font-medium shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground");
  const inner = (it: Item) => (
    <>
      <it.icon className="size-4 shrink-0" /><span className="flex-1 truncate">{it.label}</span>
      {it.badge ? <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">{it.badge}</span> : null}
      {it.right ? <span className="text-muted-foreground text-xs tabular-nums">{it.right}</span> : null}
      {it.n ? <Num n={it.n} /> : null}
    </>
  );
  return (
    <div className="flex h-full flex-col gap-4">
      <Link href="/mentura" onClick={onGo} className="px-1 text-lg font-semibold tracking-tight">Mentura</Link>
      <SpaceSwitcher />
      <Create onGo={onGo} />
      <nav className="space-y-4">
        {NAV.map((g, i) => (
          <div key={i}>
            {g.label ? <div className="text-muted-foreground px-2 pb-1 text-[11px] font-medium uppercase tracking-wide">{g.label}</div> : null}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`);
                return (
                  <li key={it.href}>
                    {it.panel ? (
                      // Contra opens notifications as a panel beside the sidebar, not a page (data.ts REFS.notifications).
                      <button type="button" onClick={onNotes} className={cn(row(it, active), "max-md:hidden")}>{inner(it)}</button>
                    ) : null}
                    <Link href={it.href} onClick={onGo} aria-current={active ? "page" : undefined} className={cn(row(it, active), it.panel && "md:hidden")}>{inner(it)}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <button type="button" onClick={() => nums.set(!nums.on)} aria-pressed={nums.on} className="text-muted-foreground hover:text-foreground mt-auto flex items-center gap-2 px-2 text-xs"><HashIcon className="size-3.5" />{nums.on ? "Numbers on" : "Numbers off"}</button>
    </div>
  );
}

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
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [notes, setNotes] = useState(false);
  return (
    <div className="bg-muted/40 flex min-h-dvh">
      <aside className="relative hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-dvh overflow-y-auto p-4"><Num n="C1" className="absolute top-1 right-1" /><Nav path={path} onNotes={() => setNotes(true)} /></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="bg-background sticky top-0 z-20 flex h-12 items-center gap-2 border-b px-3 md:hidden">
          <Button variant="ghost" size="icon-sm" onClick={() => setMenu(true)} aria-label="Menu"><MenuIcon /></Button>
          <Link href="/mentura" className="font-semibold">Mentura</Link>
          <div className="flex-1" />
          <Link href="/mentura/ai" aria-label="AI chat" className="p-1.5"><SparklesIcon className="size-5" /></Link>
          <Link href="/mentura/notifications" aria-label="Notifications" className="p-1.5"><BellIcon className="size-5" /></Link>
          <Link href="/mentura/messages" aria-label="Messages" className="p-1.5"><MessageSquareIcon className="size-5" /></Link>
        </header>
        <main className="bg-background min-h-dvh md:my-2 md:mr-2 md:min-h-[calc(100dvh-1rem)] md:rounded-xl md:border">{children}</main>
      </div>
      {path.startsWith("/mentura/ai") ? null : <CompleteProfile />}
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetTitle className="sr-only">Mentura</SheetTitle>
          <Nav path={path} onGo={() => setMenu(false)} onNotes={() => { setMenu(false); router.push("/mentura/notifications"); }} />
        </SheetContent>
      </Sheet>
      {/* C14 Notifications panel, beside the sidebar as in Contra. */}
      <Sheet open={notes} onOpenChange={setNotes}>
        <SheetContent side="left" className="w-[26rem] max-w-[calc(100vw-2rem)] gap-0 p-0 md:left-64">
          <SheetTitle className="sr-only">Notifications</SheetTitle>
          <div className="relative h-full overflow-y-auto"><Num n="C14" className="absolute top-2 right-12" /><NotificationList onGo={() => setNotes(false)} panel /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
