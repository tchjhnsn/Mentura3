"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDaysIcon, CalendarIcon, CompassIcon, HomeIcon, LandmarkIcon, LayoutDashboardIcon, HourglassIcon, MessageSquareIcon, NotebookPenIcon, PanelLeftIcon, PlusIcon, ScrollTextIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Face } from "./dash";
import { SIDE_COOKIE, SIDE_DEFAULT, SIDE_MAX, SIDE_MIN, type SideState } from "./sidebar-state";
import { hrefOn, sideOfPath, type Side } from "@/lib/sides";

export type SidebarGroup = { label: string; tiles: { id: string; label: string; href: string; glyph: string }[] };
export type SidebarChat = { id: string; title: string };
export type SidebarTile = SidebarGroup["tiles"][number];
/** Where the two sides are served (src/lib/sides.ts): `polis` is null when both share one host. */
export type SidebarPlaces = { hostSide: Side; home: string; polis: string | null; cookieDomain: string | null };

const ROW = "hover:bg-accent flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition";
const STEP = 16;
/** From this width the sidebar sits beside the page; narrower, it slides over it. */
const DOCK = "(min-width: 1024px)";

type State = { open: boolean; toggle: () => void };
const Ctx = createContext<State | null>(null);

/**
 * The sidebar (Torian, 2026-11-17; docked and resizable from 2026-11-19, "the experience the third pane operates by
 * needs to be how our entire sidebar operates"). At 1024 px and wider it sits at the left and the page narrows to make
 * room (`--side-w` on the root, read by the page's wrapper below; never `body`, whose padding and margins a menu's or
 * dialog's scroll lock takes over while it is open, which slid the page under the sidebar, 2026-11-19); the handle on its right edge resizes it between 220
 * and 420 (arrow keys too), and a double click puts it back to 272. The button at the left of every page's header and
 * the one in the sidebar open and close it. Open or shut and the width are kept in a cookie, so the server paints the
 * first frame with them and it stays as the person left it. Narrower than 1024 it slides over the page with a light
 * dim behind; a tap outside, Esc or opening another page closes it there.
 */
export function SidebarProvider({ groups, polisTiles, places, chats, me, initial, children }: { groups: SidebarGroup[]; /** Standing and Polis, on the shared side. */ polisTiles: SidebarTile[]; places: SidebarPlaces; chats: SidebarChat[]; /** The person's name and profile, for their face at the foot. */ me?: { name: string; href: string } | null; /** From the cookie (./sidebar-state.ts). */ initial: SideState; children: ReactNode }) {
  // Docked: beside the page on a wide screen, kept in the cookie. Over: slid over the page on a narrow one, for a moment.
  const [docked, setDocked] = useState(initial.open);
  const [over, setOver] = useState(false);
  const [width, setWidth] = useState(initial.width);
  const [wide, setWide] = useState(true);
  const path = usePathname();
  const live = useRef({ docked, width });
  live.current = { docked, width };
  useEffect(() => {
    const m = window.matchMedia(DOCK);
    const on = () => { setWide(m.matches); if (m.matches) setOver(false); };
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  // On a narrow screen, opening another page closes it.
  useEffect(() => { setOver(false); }, [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOver(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // The page narrows by the sidebar's width while it is docked.
  useEffect(() => {
    document.documentElement.style.setProperty("--side-w", docked ? `${width}px` : "0px");
  }, [docked, width]);
  const save = (o: boolean, w: number) => { document.cookie = `${SIDE_COOKIE}=${o ? 1 : 0}.${w}; path=/; max-age=31536000; samesite=lax${places.cookieDomain ? `; domain=${places.cookieDomain}` : ""}`; };
  // Which side this page is on (doc "Private and shared Reflect plan", 2026-11-19): everything on the polis host is
  // the shared side; on a shared host the path says, and a page on neither side keeps Home's sidebar.
  const side: Side = places.hostSide === "polis" ? "polis" : sideOfPath(path) ?? "home";
  const to = (p: string) => hrefOn(p, places.hostSide, places);
  const dock = (o: boolean) => { setDocked(o); save(o, live.current.width); };
  const open = wide ? docked : over;
  const toggle = () => (wide ? dock(!docked) : setOver((v) => !v));
  const shut = () => (wide ? dock(false) : setOver(false));
  const clamp = (w: number) => Math.round(Math.max(SIDE_MIN, Math.min(SIDE_MAX, w)));
  const resize = (w: number) => { const n = clamp(w); setWidth(n); save(live.current.docked, n); };
  const drag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    const move = (ev: PointerEvent) => setWidth(clamp(ev.clientX));
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      resize(ev.clientX);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  return (
    <Ctx.Provider value={{ open, toggle }}>
      <div data-page="" className="lg:pl-[var(--side-w,0px)]">{children}</div>
      {over && !wide ? <div aria-hidden="true" onClick={() => setOver(false)} className="fixed inset-0 z-40 bg-black/20" /> : null}
      <nav id="sidebar" aria-label="Reflect" inert={!open}
        style={{ ["--side" as string]: `${width}px` }}
        className={cn(
          "bg-background fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r shadow-lg transition-transform duration-200",
          "lg:z-30 lg:w-[var(--side)] lg:shadow-none",
          over ? "translate-x-0" : "-translate-x-full",
          docked ? "lg:translate-x-0" : "lg:-translate-x-full",
        )}>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the sidebar"
          aria-valuemin={SIDE_MIN}
          aria-valuemax={SIDE_MAX}
          aria-valuenow={width}
          tabIndex={open ? 0 : -1}
          onPointerDown={drag}
          onDoubleClick={() => resize(SIDE_DEFAULT)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); resize(width + STEP); }
            if (e.key === "ArrowLeft") { e.preventDefault(); resize(width - STEP); }
          }}
          className="group absolute inset-y-0 -right-1.5 z-10 hidden w-3 cursor-col-resize touch-none outline-none lg:block"
        >
          <span className="group-hover:bg-primary/50 group-focus-visible:bg-primary absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors group-hover:w-0.5 group-focus-visible:w-0.5" />
          <span className="bg-muted-foreground/40 absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </div>
        <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-2">
          <Button variant="ghost" size="icon" aria-label="Close the sidebar" onClick={shut}><PanelLeftIcon /></Button>
        </div>

        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-3 pb-4">
          {side === "polis" ? (
            <>
              <div className="grid gap-0.5">
                <Go href={to("/v")} className={cn(ROW, "font-medium")}><LandmarkIcon className="size-4" />Village and polis</Go>
                <Go href={to("/chat")} className={cn(ROW, "font-medium")}><PlusIcon className="size-4" />New Chat</Go>
              </div>
              <Section title="Gather">
                <Go href={to("/events")} className={ROW}><CalendarDaysIcon className="text-muted-foreground size-4" />Events</Go>
                <Go href={to("/adventures")} className={ROW}><CompassIcon className="text-muted-foreground size-4" />Adventures</Go>
              </Section>
              <Section title="The polis">
                {polisTiles.map((t) => <TileRow key={t.id} t={t} href={to(t.href)} />)}
              </Section>
            </>
          ) : (
            <>
              <div className="grid gap-0.5">
                <Go href={to("/")} className={cn(ROW, "font-medium")}><HomeIcon className="size-4" />Home</Go>
                <Go href={to("/dashboard")} className={cn(ROW, "font-medium")}><LayoutDashboardIcon className="size-4" />Dashboard</Go>
                <Go href={to("/chat")} className={cn(ROW, "font-medium")}><PlusIcon className="size-4" />New Chat</Go>
              </div>

              <Section title="Tools">
                <Go href={to("/journal")} className={ROW}><NotebookPenIcon className="text-muted-foreground size-4" />Journal</Go>
                <Go href={to("/calendar")} className={ROW}><CalendarIcon className="text-muted-foreground size-4" />Calendar</Go>
              </Section>

              <Section title="Lenses">
                <Go href={to("/journal/log")} className={ROW}><ScrollTextIcon className="text-muted-foreground size-4" />Log</Go>
                <Go href={to("/life/legacy")} className={ROW}><HourglassIcon className="text-muted-foreground size-4" />Legacy</Go>
                <Go href={to("/journal/qualities")} className={ROW}><SparklesIcon className="text-muted-foreground size-4" />Qualities</Go>
              </Section>

              {groups.map((g) => (
                <Section key={g.label} title={g.label}>
                  {g.tiles.map((t) => <TileRow key={t.id} t={t} href={to(t.href)} />)}
                </Section>
              ))}
            </>
          )}

          {chats.length ? (
            <Section title="Recent chats">
              {chats.map((c) => (
                <Go key={c.id} href={to(`/chat/history/${c.id}`)} className={ROW}><MessageSquareIcon className="text-muted-foreground size-4 shrink-0" /><span className="truncate">{c.title}</span></Go>
              ))}
              <Go href={to("/chat/history")} className={cn(ROW, "text-muted-foreground")}>All chats</Go>
            </Section>
          ) : null}
        </div>

        <div className="grid gap-0.5 border-t p-3">
          {me ? <Go href={to(me.href)} className={ROW} title="Your profile"><Face name={me.name} size={24} /><span className="truncate">{me.name}</span></Go> : null}
          {/* The other side, like Cursor's Dashboard item: a different experience on its own host. */}
          {side === "polis"
            ? <Go href={to("/")} className={ROW}><HomeIcon className="text-muted-foreground size-4" />Home</Go>
            : <Go href={to("/v")} className={ROW}><LandmarkIcon className="text-muted-foreground size-4" />Village and polis</Go>}
          <Go href={to("/settings")} className={ROW}><SettingsIcon className="text-muted-foreground size-4" />Settings</Go>
        </div>
      </nav>
    </Ctx.Provider>
  );
}

/** The button that opens the sidebar, at the left of every page's header; nothing where there is no sidebar (signed out). */
export function SidebarButton({ className }: { className?: string }) {
  const s = useContext(Ctx);
  if (!s) return null;
  return (
    <Button variant="ghost" size="icon" className={cn(className, s.open && "lg:hidden")} aria-label={s.open ? "Close the sidebar" : "Open the sidebar"} aria-expanded={s.open} aria-controls="sidebar" onClick={s.toggle}>
      <PanelLeftIcon />
    </Button>
  );
}

/** A link that stays in the app on its own host and is a plain link to the other host. */
function Go({ href, className, title, children }: { href: string; className?: string; title?: string; children: ReactNode }) {
  return /^https?:/.test(href) ? <a href={href} className={className} title={title}>{children}</a> : <Link href={href} className={className} title={title}>{children}</Link>;
}

function TileRow({ t, href }: { t: SidebarTile; href: string }) {
  return (
    <Go href={href} className={ROW}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="text-muted-foreground size-4 shrink-0"><path d={t.glyph} className="fill-current" fillRule="evenodd" /></svg>
      {t.label}
    </Go>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-0.5">
      <h2 className="text-muted-foreground px-3 pb-1 text-xs font-medium">{title}</h2>
      {children}
    </section>
  );
}
