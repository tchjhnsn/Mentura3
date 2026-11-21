"use client";

// Mentura's frame, after Contra: C1 sidebar with C2 workspace switcher and C3 Create, the page in the middle, and
// C8 Complete profile at the bottom right. A full-screen app of its own, like the Venture Studio (src/app/layout.tsx
// leaves /mentura bare).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BellIcon, BotIcon, CalendarDaysIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, CompassIcon, HashIcon, HomeIcon,
  LayoutGridIcon, MapIcon, MenuIcon, MessageSquareIcon, PlusIcon, RadarIcon, RocketIcon, UserRoundIcon, VideoIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Num, useNums } from "@/components/studio/bits";
import { CONVOS, ME, NOTES, personOf, REQUESTS } from "./data";
import { Face } from "./parts";

type Item = { href: string; label: string; icon: typeof HomeIcon; n?: string; badge?: number; right?: string; exact?: boolean };

export const DISCOVERED = 62;
const NAV: { label?: string; items: Item[] }[] = [
  { items: [
    { href: "/mentura", label: "Home", icon: HomeIcon, n: "M1", exact: true },
    { href: "/mentura/dashboard", label: "Dashboard", icon: LayoutGridIcon, n: "M2" },
    { href: "/mentura/agent", label: "Chief of staff", icon: BotIcon, n: "M3" },
    { href: "/mentura/notifications", label: "Notifications", icon: BellIcon, n: "M4", badge: NOTES.filter((x) => x.unread).length },
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
];

/** C2 Workspace switcher: the same account, as a founder or as an investor. */
function Workspace() {
  const me = personOf(ME);
  const [as, setAs] = useState<"Founder" | "Investor">("Founder");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-accent relative flex w-full items-center gap-2.5 rounded-lg border p-2 text-left">
          <Num n="C2" className="absolute -top-2 right-2" />
          <Face handle={ME} size={32} name={false} />
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{as} workspace</span><span className="text-muted-foreground block truncate text-xs">{me.name}</span></span>
          <ChevronRightIcon className="text-muted-foreground size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Switch workspace</DropdownMenuLabel>
        {(["Founder", "Investor"] as const).map((w) => <DropdownMenuItem key={w} onSelect={() => setAs(w)}>{w} workspace{w === as ? " (now)" : ""}</DropdownMenuItem>)}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/mentura/profile/edit">How you appear in Mentura</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/settings/account">Account, shared with Reflect</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/dashboard">Back to Reflect</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** C3 Create: a post, an event, a venture or a meeting. */
function Create() {
  const MADE = [
    { href: "/mentura?compose=1", label: "Post", what: "Something you made or are doing", icon: HashIcon },
    { href: "/mentura/events?new=1", label: "Event", what: "A dinner, a demo day, a meetup", icon: CalendarDaysIcon },
    { href: "/studio/new", label: "Venture", what: "Start one in the Venture Studio", icon: RocketIcon },
    { href: "/mentura/meetings", label: "Meeting", what: "Notes, guests and the call", icon: VideoIcon },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative w-full rounded-full"><Num n="C3" className="absolute -top-2 right-3" /><PlusIcon />Create</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {MADE.map((m) => (
          <DropdownMenuItem key={m.label} asChild>
            <Link href={m.href} className="flex items-start gap-2"><m.icon className="mt-0.5 size-4" /><span><span className="block font-medium">{m.label}</span><span className="text-muted-foreground text-xs">{m.what}</span></span></Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Nav({ path, onGo }: { path: string; onGo?: () => void }) {
  const nums = useNums();
  return (
    <div className="flex h-full flex-col gap-4">
      <Link href="/mentura" onClick={onGo} className="px-1 text-lg font-semibold tracking-tight">Mentura</Link>
      <Workspace />
      <Create />
      <nav className="space-y-4">
        {NAV.map((g, i) => (
          <div key={i}>
            {g.label ? <div className="text-muted-foreground px-2 pb-1 text-[11px] font-medium uppercase tracking-wide">{g.label}</div> : null}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`) || (it.n === "M6" && path.startsWith("/mentura/profile"));
                return (
                  <li key={it.href}>
                    <Link href={it.href} onClick={onGo} aria-current={active ? "page" : undefined}
                      className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm", active ? "bg-background font-medium shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}>
                      <it.icon className="size-4 shrink-0" /><span className="flex-1 truncate">{it.label}</span>
                      {it.badge ? <span className="grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">{it.badge}</span> : null}
                      {it.right ? <span className="text-muted-foreground text-xs tabular-nums">{it.right}</span> : null}
                      {it.n ? <Num n={it.n} /> : null}
                    </Link>
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
  const steps = [{ t: "Add what you are looking for", done: true }, { t: "Pin your best work", done: true }, { t: "Link a venture", done: true }, { t: "Add a photo", done: false }, { t: "Confirm one social link", done: false }];
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
          {steps.map((s) => <li key={s.t} className={cn("flex items-center gap-2", s.done && "text-muted-foreground line-through")}><span className={cn("size-3.5 rounded-full border", s.done && "bg-foreground border-foreground")} />{s.t}</li>)}
          <li className="pt-2"><Link href="/mentura/profile/edit" className="text-sm font-medium underline-offset-4 hover:underline">Finish it</Link></li>
        </ul>
      ) : null}
    </div>
  );
}

/** The frame every Mentura screen sits in. */
export function MenturaFrame({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/mentura";
  const [menu, setMenu] = useState(false);
  return (
    <div className="bg-muted/40 flex min-h-dvh">
      <aside className="relative hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-dvh overflow-y-auto p-4"><Num n="C1" className="absolute top-1 right-1" /><Nav path={path} /></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="bg-background sticky top-0 z-20 flex h-12 items-center gap-2 border-b px-3 md:hidden">
          <Button variant="ghost" size="icon-sm" onClick={() => setMenu(true)} aria-label="Menu"><MenuIcon /></Button>
          <Link href="/mentura" className="font-semibold">Mentura</Link>
          <div className="flex-1" />
          <Link href="/mentura/notifications" aria-label="Notifications" className="p-1.5"><BellIcon className="size-5" /></Link>
          <Link href="/mentura/messages" aria-label="Messages" className="p-1.5"><MessageSquareIcon className="size-5" /></Link>
        </header>
        <main className="bg-background min-h-dvh md:my-2 md:mr-2 md:min-h-[calc(100dvh-1rem)] md:rounded-xl md:border">{children}</main>
      </div>
      <CompleteProfile />
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetTitle className="sr-only">Mentura</SheetTitle>
          <Nav path={path} onGo={() => setMenu(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
