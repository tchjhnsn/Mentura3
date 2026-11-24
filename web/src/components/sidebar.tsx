"use client";

import { forwardRef, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, RocketIcon, ChevronRightIcon, ChevronsUpDownIcon, CompassIcon, GraduationCapIcon, HomeIcon, LandmarkIcon, LayoutDashboardIcon, ListMusicIcon, ListTodoIcon, MessageSquareIcon, MessagesSquareIcon, NotebookPenIcon, PanelLeftIcon, PlusIcon, SettingsIcon, UserRoundIcon, UsersRoundIcon, UtensilsIcon, VideoIcon } from "lucide-react";
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
import { hrefOn, isFullScreen, spaceOfPath, type Side, type Space } from "@/lib/sides";
import { VENTURES, ventureHref } from "@/components/studio/data";
import { STUDIO_NAV, ventureNav, type NavGroup } from "@/components/studio/nav";
import { ModeSwitcher, modeOf } from "@/components/studio/switcher";

export type SidebarGroup = { label: string; tiles: { id: string; label: string; href: string; glyph: string }[] };
export type SidebarChat = { id: string; title: string };
export type SidebarTile = SidebarGroup["tiles"][number];
/** Where the two sides are served (src/lib/sides.ts): `polis` is null when both share one host. */
export type SidebarPlaces = { hostSide: Side; home: string; polis: string | null; cookieDomain: string | null };

const STEP = 16;

/**
 * The sidebar, rebuilt on shadcn/ui's Sidebar (Torian, 2026-11-19: "rebuild the sidebar using one of the sidebars from
 * ShadCN"), after its block that collapses to icons (sidebar-07), in the inset variant: a switcher at the top for the two sides (Home, and
 * Village and polis, like a team switcher), the side's navigation in groups (the tile groups fold), recent chats, and
 * the person at the foot with their profile and Settings. On a wide screen it sits beside the page and, shut, leaves the
 * screen entirely (Torian, 2026-11-19: "the sidebar needs to completely disappear when it's collapsed"; the button in
 * every header, or Cmd/Ctrl-B, brings it back); its right edge still resizes it between 220 and 420 (arrow keys
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
  // A full-screen app brings its own frame, so the sidebar steps aside, checked on every navigation.
  if (isFullScreen(usePathname() ?? "")) return <>{children}</>;
  return (
    <Provider open={open} onOpenChange={onOpen} style={{ "--sidebar-width": `${width}px` } as CSSProperties}>
      <Nav groups={groups} polisTiles={polisTiles} places={places} chats={chats} me={me} width={width} onWidth={setWidth} onResized={resize} />
      {/* The page beside it. Not a <main>: every page has its own. */}
      {/* The page, inset as a rounded card beside the sidebar (shadcn's inset variant, 2026-11-19: "it matches the radius
          design of the rest of our system"). Not a <main>: every page has its own. overflow-clip: a header's
          background reaches past its sides (BAR in ./headers.tsx); clipped here it stops at the card's rounded edge. */}
      <div data-page="" data-slot="sidebar-inset" className="bg-background relative isolate flex min-w-0 w-full flex-1 flex-col overflow-clip md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2">{children}</div>
    </Provider>
  );
}

function Nav({ groups, polisTiles, places, chats, me, width, onWidth, onResized }: { groups: SidebarGroup[]; polisTiles: SidebarTile[]; places: SidebarPlaces; chats: SidebarChat[]; me?: { name: string; href: string } | null; width: number; onWidth: (w: number) => void; onResized: (w: number) => void }) {
  const path = usePathname();
  // Which side this page is on (doc "Private and shared Reflect plan", 2026-11-19): everything on the polis host is
  // the shared side; on a shared host the path says, and a page on neither side keeps Home's sidebar.
  // Mentura's pages show Mentura's navigation (Torian, 2026-11-21).
  const side: Space = places.hostSide === "polis" ? "polis" : spaceOfPath(path) ?? "home";
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
    <Sidebar variant="inset" collapsible="offcanvas" aria-label="Reflect">
      <SidebarHeader>
        {side === "mentura" ? <ModeSwitcher path={path} done={done} /> : <ProductHead side={side} to={to} />}
      </SidebarHeader>

      <SidebarContent>
        {side === "mentura" ? (
          (() => {
            // Personal shows Mentura's social side; the Studio and a venture show the console in its place (spec
            // "Venture console spec", 2026-11-24: crossing modes swaps the sidebar, it never stacks).
            const mode = modeOf(path);
            return mode.kind === "personal"
              ? <MenturaNav item={item} to={to} done={done} />
              : <StudioNav groups={mode.kind === "venture" ? ventureNav(mode.slug) : STUDIO_NAV} path={path} done={done} />;
          })()
        ) : side === "polis" ? (
          <>
            <Group>
              <SidebarMenu>
                {item("/v", "Village and polis", <LandmarkIcon />)}
                <CreateMenu to={to} done={done} />
              </SidebarMenu>
            </Group>
            <Fold label="Gather">
              {item("/adventures", "Adventures", <CompassIcon />)}
              {item("/v/people", "People you've met", <UsersRoundIcon />)}
            </Fold>
            <Fold label="The village and polis">{polisTiles.map(tile)}</Fold>
          </>
        ) : (
          <>
            <Group>
              <SidebarMenu>
                {/* The dashboard is Home's front page for now (Torian, 2026-11-19); the journal and the calendar are in Settings. */}
                <CreateMenu to={to} done={done} />
                {item("/dashboard", "Dashboard", <LayoutDashboardIcon />)}
              </SidebarMenu>
            </Group>
            {groups.map((g) => <Fold key={g.label} label={g.label}>{g.tiles.map(tile)}</Fold>)}
          </>
        )}

        {chats.length && side !== "mentura" ? (
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
          {me ? <Person me={me} to={to} profile={side === "mentura" ? "/mentura/profile" : "/settings/profile"} /> : null}
        </SidebarMenu>
      </SidebarFooter>

      <Resize width={width} onWidth={onWidth} onResized={onResized} />
    </Sidebar>
  );
}

/** The product this sidebar belongs to, at its top. Reflect, Village and polis, and Mentura are separate products
 * (Torian, 2026-11-24), so there is no switcher between them; the name leads to the product's front page. */
function ProductHead({ side, to }: { side: Space; to: (p: string) => string }) {
  const PRODUCTS = {
    home: { name: "Reflect", about: "You and your household", href: "/dashboard", icon: <HomeIcon className="size-4" /> },
    polis: { name: "Village and polis", about: "Shared with others", href: "/v", icon: <LandmarkIcon className="size-4" /> },
    mentura: { name: "Mentura", about: "Businesses, meetings and people", href: "/mentura", icon: <RocketIcon className="size-4" /> },
  };
  const now = PRODUCTS[side];
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Go href={to(now.href)}>
            <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">{now.icon}</span>
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{now.name}</span>
              <span className="text-muted-foreground truncate text-xs">{now.about}</span>
            </span>
          </Go>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The person at the foot: their face and name, opening their profile and Settings. */
function Person({ me, to, profile }: { me: { name: string; href: string }; to: (p: string) => string; /** Your profile in the product you are in. */ profile: string }) {
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
        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side="top" align="start" sideOffset={4}>
          <DropdownMenuLabel className="flex items-center gap-2 font-normal"><Face name={me.name} size={32} /><span className="truncate font-medium">{me.name}</span></DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Go href={to(profile)}><UserRoundIcon />Your profile</Go></DropdownMenuItem>
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

/** What Create can make (Torian, 2026-11-19: "instead of the new chat button being new chat, it should actually be a
 * create button ... create a new journal, create a new plan, create a new playlist"). Each says what it opens: a page
 * of its own, or a chat that drafts it with the person (plans, playlists and courses are made by the chat's actions). */
const MAKES: { href: string; label: string; what: string; icon: ReactNode }[] = [
  { href: "/chat", label: "Chat", what: "Ask Reflect or tell it what to do", icon: <MessageSquareIcon /> },
  { href: "/journal/new", label: "Journal entry", what: "Write, blank or from a prompt", icon: <NotebookPenIcon /> },
  { href: `/chat?q=${encodeURIComponent("Help me make a plan.")}`, label: "Plan", what: "Draft it in a chat, step by step", icon: <ListTodoIcon /> },
  { href: `/chat?q=${encodeURIComponent("Make me a playlist.")}`, label: "Playlist", what: "Videos, episodes and books on a subject", icon: <ListMusicIcon /> },
  { href: `/chat?q=${encodeURIComponent("Build me a course.")}`, label: "Course", what: "A course on anything you want to learn", icon: <GraduationCapIcon /> },
  { href: "/schole/dialectic/debates/new", label: "Debate", what: "Argue a question with others", icon: <MessagesSquareIcon /> },
  { href: "/adventures/new", label: "Adventure", what: "A trip or an experience to plan", icon: <CompassIcon /> },
  { href: "/meals/new", label: "Meal", what: "A recipe or a dish for your week", icon: <UtensilsIcon /> },
];

/** The sidebar's first button: Create, a menu of what Reflect can make. */
/** Mentura's navigation (Torian, 2026-11-21: "use the 5-step algorithm on it, then use Contra for reference"): one flat
 * list like Contra's sidebar, not a rail of tabs with a panel each. The rail held ten links behind two levels; a flat
 * list shows all of them at once. Create first, then the pages you use daily, then the ventures in their own group. */
function MenturaNav({ item, to, done }: { item: (href: string, label: string, icon: ReactNode) => ReactNode; to: (p: string) => string; done: () => void }) {
  return (
    <>
      <Group>
        <SidebarMenu>
          <MenturaCreate to={to} done={done} />
          {item("/mentura", "Home", <HomeIcon />)}
          {item("/meetings", "Meetings", <VideoIcon />)}
          {item("/mentura/discover", "People", <UsersRoundIcon />)}
          {item("/mentura/profile", "My profile", <UserRoundIcon />)}
        </SidebarMenu>
      </Group>
      <Group>
        <SidebarGroupLabel>Businesses</SidebarGroupLabel>
        <SidebarMenu>
          {/* One door per venture, into its console (Whop's "Your businesses"). */}
          {VENTURES.map((v) => item(ventureHref(v.slug), v.name, <span aria-hidden className="size-4 shrink-0 rounded" style={{ background: `oklch(0.65 0.14 ${v.hue})` }} />))}
          {item("/studio", "All businesses", <LayoutDashboardIcon />)}
        </SidebarMenu>
      </Group>
      <Group>
        <SidebarGroupLabel>Discover</SidebarGroupLabel>
        <SidebarMenu>
          {item("/mentura/events", "Events", <CalendarDaysIcon />)}
        </SidebarMenu>
      </Group>
    </>
  );
}

/** The console: the Venture Studio's pages, or one venture's, in place of Mentura's own. */
function StudioNav({ groups, path, done }: { groups: NavGroup[]; path: string; done: () => void }) {
  return (
    <Group>
      {groups.map((g, i) => (
        <SidebarMenu key={i} className={i ? "mt-3" : undefined}>
          {g.label ? <SidebarGroupLabel>{g.label}</SidebarGroupLabel> : null}
          {g.items.map((it) => {
            const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`) || (it.n === "V5" && path.includes("/decks/"));
            return (
              <SidebarMenuItem key={it.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                  <Link href={it.href} onClick={done}><it.icon /><span>{it.label}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      ))}
    </Group>
  );
}

/** Mentura's Create: a meeting or a venture. */
function MenturaCreate({ to, done }: { to: (p: string) => string; done: () => void }) {
  const MADE = [
    { href: "/meetings", label: "Meeting", what: "Notes, guests and the call", icon: <VideoIcon /> },
    { href: "/studio/new", label: "Business", what: "Start one in the Business Studio", icon: <RocketIcon /> },
  ];
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Create" className="font-medium"><PlusIcon /><span>Create</span></SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="w-72">
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Create in Mentura</DropdownMenuLabel>
          {MADE.map((m) => (
            <DropdownMenuItem key={m.label} asChild>
              <Go href={to(m.href)} onClick={done} className="flex items-start gap-2">
                {m.icon}
                <span className="flex flex-col"><span className="font-medium">{m.label}</span><span className="text-muted-foreground text-xs">{m.what}</span></span>
              </Go>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function CreateMenu({ to, done }: { to: (p: string) => string; done: () => void }) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Create" className="font-medium"><PlusIcon /><span>Create</span></SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="w-72">
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Create something new</DropdownMenuLabel>
          {MAKES.map((m) => (
            <DropdownMenuItem key={m.label} asChild>
              <Go href={to(m.href)} onClick={done} className="flex items-start gap-2">
                <span className="mt-0.5 [&>svg]:size-4">{m.icon}</span>
                <span className="flex flex-col"><span className="font-medium">{m.label}</span><span className="text-muted-foreground text-xs">{m.what}</span></span>
              </Go>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

/** A link that stays in the app on its own host and is a plain link to the other host. Passes every prop on, so shadcn's `asChild` buttons keep their data attributes and refs. */
const Go = forwardRef<HTMLAnchorElement, ComponentProps<"a"> & { href: string }>(function Go({ href, ...rest }, ref) {
  return /^https?:/.test(href) ? <a ref={ref} href={href} {...rest} /> : <Link ref={ref} href={href} {...rest} />;
});
