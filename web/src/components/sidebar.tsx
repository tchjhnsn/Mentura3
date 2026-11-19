"use client";

import { forwardRef, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, CalendarIcon, CheckIcon, ChevronRightIcon, ChevronsUpDownIcon, CompassIcon, HomeIcon, LandmarkIcon, LayoutDashboardIcon, MessageSquareIcon, NotebookPenIcon, PanelLeftIcon, PlusIcon, SettingsIcon, UserRoundIcon, UsersRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup as Group, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider as Provider, useSidebar, useSidebarMaybe,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Face } from "./dash";
import { SIDE_COOKIE, SIDE_DEFAULT, SIDE_MAX, SIDE_MIN, type SideState } from "./sidebar-state";
import { hrefOn, sideOfPath, type Side } from "@/lib/sides";

export type SidebarGroup = { label: string; tiles: { id: string; label: string; href: string; glyph: string }[] };
export type SidebarChat = { id: string; title: string };
export type SidebarTile = SidebarGroup["tiles"][number];
/** Where the two sides are served (src/lib/sides.ts): `polis` is null when both share one host. */
export type SidebarPlaces = { hostSide: Side; home: string; polis: string | null; cookieDomain: string | null };

const STEP = 16;

/**
 * The sidebar, rebuilt on shadcn/ui's Sidebar (Torian, 2026-11-19: "rebuild the sidebar using one of the sidebars from
 * ShadCN"), after its block that collapses to icons (sidebar-07): a switcher at the top for the two sides (Home, and
 * Village and polis, like a team switcher), the side's navigation in groups (the tile groups fold), recent chats, and
 * the person at the foot with their profile and Settings. On a wide screen it sits beside the page and collapses to
 * icons (the button in every header, or Cmd/Ctrl-B); its right edge still resizes it between 220 and 420 (arrow keys
 * too; a double click puts it back to 272). On a phone it opens as a sheet over the page. Open or shut and the width
 * are kept in a cookie on the parent domain, so the server paints the first frame with them on both hosts.
 */
export function SidebarProvider({ groups, polisTiles, places, chats, me, initial, children }: { groups: SidebarGroup[]; /** Standing and Polis, on the shared side. */ polisTiles: SidebarTile[]; places: SidebarPlaces; chats: SidebarChat[]; /** The person's name and profile, for their face at the foot. */ me?: { name: string; href: string } | null; /** From the cookie (./sidebar-state.ts). */ initial: SideState; children: ReactNode }) {
  const [open, setOpen] = useState(initial.open);
  const [width, setWidth] = useState(initial.width);
  const live = useRef({ open, width });
  live.current = { open, width };
  const save = (o: boolean, w: number) => { document.cookie = `${SIDE_COOKIE}=${o ? 1 : 0}.${w}; path=/; max-age=31536000; samesite=lax${places.cookieDomain ? `; domain=${places.cookieDomain}` : ""}`; };
  const onOpen = (o: boolean) => { setOpen(o); save(o, live.current.width); };
  const resize = (w: number) => { setWidth(w); save(live.current.open, w); };
  return (
    <Provider open={open} onOpenChange={onOpen} style={{ "--sidebar-width": `${width}px` } as CSSProperties}>
      <Nav groups={groups} polisTiles={polisTiles} places={places} chats={chats} me={me} width={width} onWidth={setWidth} onResized={resize} />
      {/* The page beside it. Not a <main>: every page has its own. */}
      {/* overflow-x-clip: a header's background reaches past its sides (BAR in ./headers.tsx); clipped here it stops at the
          sidebar's edge instead of painting over the sidebar's top (2026-11-19). */}
      <div data-page="" className="relative flex min-w-0 flex-1 flex-col overflow-x-clip">{children}</div>
    </Provider>
  );
}

function Nav({ groups, polisTiles, places, chats, me, width, onWidth, onResized }: { groups: SidebarGroup[]; polisTiles: SidebarTile[]; places: SidebarPlaces; chats: SidebarChat[]; me?: { name: string; href: string } | null; width: number; onWidth: (w: number) => void; onResized: (w: number) => void }) {
  const path = usePathname();
  // Which side this page is on (doc "Private and shared Reflect plan", 2026-11-19): everything on the polis host is
  // the shared side; on a shared host the path says, and a page on neither side keeps Home's sidebar.
  const side: Side = places.hostSide === "polis" ? "polis" : sideOfPath(path) ?? "home";
  const to = (p: string) => hrefOn(p, places.hostSide, places);
  const here = (p: string) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`));
  const { isMobile, setOpenMobile } = useSidebar();
  // On a phone, choosing a page closes the sheet.
  const done = () => { if (isMobile) setOpenMobile(false); };
  const item = (href: string, label: string, icon: ReactNode) => (
    <SidebarMenuItem key={href}>
      <SidebarMenuButton asChild isActive={here(href)} tooltip={label}>
        <Go href={to(href)} onClick={done}>{icon}<span>{label}</span></Go>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
  const tile = (t: SidebarTile) => item(t.href, t.label, <svg viewBox="0 0 100 100" aria-hidden="true"><path d={t.glyph} className="fill-current" fillRule="evenodd" /></svg>);

  return (
    <Sidebar collapsible="icon" aria-label="Reflect">
      <SidebarHeader>
        <SideSwitcher side={side} to={to} />
      </SidebarHeader>

      <SidebarContent>
        {side === "polis" ? (
          <>
            <Group>
              <SidebarMenu>
                {item("/v", "Village and polis", <LandmarkIcon />)}
                {item("/chat", "New Chat", <PlusIcon />)}
              </SidebarMenu>
            </Group>
            <Fold label="Gather">
              {item("/events", "Events", <CalendarDaysIcon />)}
              {item("/adventures", "Adventures", <CompassIcon />)}
              {item("/v/people", "People you've met", <UsersRoundIcon />)}
            </Fold>
            <Fold label="The polis">{polisTiles.map(tile)}</Fold>
          </>
        ) : (
          <>
            <Group>
              <SidebarMenu>
                {item("/", "Home", <HomeIcon />)}
                {item("/dashboard", "Dashboard", <LayoutDashboardIcon />)}
                {item("/chat", "New Chat", <PlusIcon />)}
              </SidebarMenu>
            </Group>
            <Fold label="Tools">
              {item("/journal", "Journal", <NotebookPenIcon />)}
              {item("/calendar", "Calendar", <CalendarIcon />)}
            </Fold>
            {groups.map((g) => <Fold key={g.label} label={g.label}>{g.tiles.map(tile)}</Fold>)}
          </>
        )}

        {chats.length ? (
          <Group className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
            <SidebarMenu>
              {chats.map((c) => item(`/chat/history/${c.id}`, c.title, <MessageSquareIcon />))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-sidebar-foreground/70"><Go href={to("/chat/history")} onClick={done}><span>All chats</span></Go></SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Group>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {item("/settings", "Settings", <SettingsIcon />)}
          {me ? <Person me={me} to={to} /> : null}
        </SidebarMenu>
      </SidebarFooter>

      <Resize width={width} onWidth={onWidth} onResized={onResized} />
    </Sidebar>
  );
}

/** The two sides, like a team switcher: Home (the person and the household, private) and Village and polis (shared). */
function SideSwitcher({ side, to }: { side: Side; to: (p: string) => string }) {
  const { isMobile } = useSidebar();
  const SIDES = [
    { id: "home" as const, name: "Home", about: "You and your household", href: "/", icon: <HomeIcon className="size-4" /> },
    { id: "polis" as const, name: "Village and polis", about: "Shared with others", href: "/v", icon: <LandmarkIcon className="size-4" /> },
  ];
  const now = SIDES.find((s) => s.id === side)!;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">{now.icon}</span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{now.name}</span>
                <span className="text-muted-foreground truncate text-xs">{now.about}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="start" side={isMobile ? "bottom" : "right"} sideOffset={4}>
            <DropdownMenuLabel className="text-muted-foreground text-xs">Reflect</DropdownMenuLabel>
            {SIDES.map((s) => (
              <DropdownMenuItem key={s.id} asChild className="gap-2 p-2">
                <Go href={to(s.href)}>
                  <span className="flex size-6 items-center justify-center rounded-md border">{s.icon}</span>
                  {s.name}
                  {s.id === side ? <CheckIcon className="ml-auto size-4" /> : null}
                </Go>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The person at the foot: their face and name, opening their profile and Settings. */
function Person({ me, to }: { me: { name: string; href: string }; to: (p: string) => string }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <span className="ring-sidebar-border shrink-0 rounded-full ring-1"><Face name={me.name} size={32} /></span>
            <span className="truncate text-sm font-medium">{me.name}</span>
            <ChevronsUpDownIcon className="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
          <DropdownMenuLabel className="flex items-center gap-2 font-normal"><Face name={me.name} size={32} /><span className="truncate font-medium">{me.name}</span></DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Go href={to(me.href)}><UserRoundIcon />Your profile</Go></DropdownMenuItem>
          <DropdownMenuItem asChild><Go href={to("/settings")}><SettingsIcon />Settings</Go></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

/** A labelled group that folds (shadcn's collapsible group); collapsed to icons, its items show without the label. */
function Fold({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Collapsible defaultOpen className="group/fold">
      <Group>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full">
            {label}
            <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/fold:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>{children}</SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Group>
    </Collapsible>
  );
}

/** The sidebar's right edge: drag to resize between 220 and 420, arrow keys too, a double click back to 272. */
function Resize({ width, onWidth, onResized }: { width: number; onWidth: (w: number) => void; onResized: (w: number) => void }) {
  const { state, isMobile } = useSidebar();
  if (isMobile || state === "collapsed") return null;
  const clamp = (w: number) => Math.round(Math.max(SIDE_MIN, Math.min(SIDE_MAX, w)));
  const drag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    const move = (ev: PointerEvent) => onWidth(clamp(ev.clientX));
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      onResized(clamp(ev.clientX));
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the sidebar"
      aria-valuemin={SIDE_MIN}
      aria-valuemax={SIDE_MAX}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={drag}
      onDoubleClick={() => onResized(SIDE_DEFAULT)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); onResized(clamp(width + STEP)); }
        if (e.key === "ArrowLeft") { e.preventDefault(); onResized(clamp(width - STEP)); }
      }}
      className="group/resize absolute inset-y-0 -right-1.5 z-20 w-3 cursor-col-resize touch-none outline-none"
    >
      <span className="group-hover/resize:bg-sidebar-border group-focus-visible/resize:bg-sidebar-ring absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors" />
    </div>
  );
}

/** The button that opens and closes the sidebar, at the left of every page's header; nothing where there is no sidebar (signed out). */
export function SidebarButton({ className }: { className?: string }) {
  const s = useSidebarMaybe();
  if (!s) return null;
  const open = s.isMobile ? s.openMobile : s.open;
  return (
    <Button variant="ghost" size="icon" className={cn(className)} aria-label={open ? "Close the sidebar" : "Open the sidebar"} aria-expanded={open} onClick={s.toggleSidebar}>
      <PanelLeftIcon />
    </Button>
  );
}

/** A link that stays in the app on its own host and is a plain link to the other host. Passes every prop on, so shadcn's `asChild` buttons keep their data attributes and refs. */
const Go = forwardRef<HTMLAnchorElement, ComponentProps<"a"> & { href: string }>(function Go({ href, ...rest }, ref) {
  return /^https?:/.test(href) ? <a ref={ref} href={href} {...rest} /> : <Link ref={ref} href={href} {...rest} />;
});
