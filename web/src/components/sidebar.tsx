"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, HourglassIcon, MessageSquareIcon, NotebookPenIcon, PanelLeftIcon, PinIcon, PinOffIcon, PlusIcon, ScrollTextIcon, SettingsIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SidebarGroup = { label: string; tiles: { id: string; label: string; href: string; glyph: string }[] };
export type SidebarChat = { id: string; title: string };

const KEY = "reflect.sidebar.pinned";
const WIDE = "(min-width: 1600px)";
const ROW = "hover:bg-accent flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition";

type State = { open: boolean; toggle: () => void };
const Ctx = createContext<State | null>(null);

/**
 * The sidebar (Torian, 2026-11-17 08:52Z, on every page from 09:23Z): kept once for the whole app, opened from the
 * button at the left of every page's header. It slides over the empty left margin without moving the page. On a
 * phone it covers the page with a light dim behind; a tap outside, Esc or opening another page closes it. At 1600 px
 * and wider, where the margin holds it, it can be pinned open, remembered in this browser only.
 */
export function SidebarProvider({ groups, chats, children }: { groups: SidebarGroup[]; chats: SidebarChat[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const path = usePathname();
  useEffect(() => {
    try { if (localStorage.getItem(KEY) === "1" && window.matchMedia(WIDE).matches) { setPinned(true); setOpen(true); } } catch {}
  }, []);
  // Opening another page closes it, unless it is pinned.
  useEffect(() => { if (!pinned) setOpen(false); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pinned) setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);
  const pin = (on: boolean) => { setPinned(on); try { localStorage.setItem(KEY, on ? "1" : "0"); } catch {} };
  const shut = () => { pin(false); setOpen(false); };
  const close = () => { if (!pinned) setOpen(false); };

  return (
    <Ctx.Provider value={{ open, toggle: () => (open ? shut() : setOpen(true)) }}>
      {children}
      {open && !pinned ? <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-black/20 min-[1600px]:bg-transparent" /> : null}
      <nav id="sidebar" aria-label="Reflect" inert={!open} className={cn("bg-background fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r shadow-lg transition-transform duration-200 min-[1600px]:shadow-none", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-2">
          <Button variant="ghost" size="icon" aria-label="Close the sidebar" onClick={shut}><PanelLeftIcon /></Button>
          <Button variant="ghost" size="icon" className="hidden min-[1600px]:inline-flex" aria-label={pinned ? "Unpin the sidebar" : "Keep the sidebar open"} aria-pressed={pinned} onClick={() => pin(!pinned)}>{pinned ? <PinOffIcon /> : <PinIcon />}</Button>
        </div>

        <div className="grid flex-1 content-start gap-5 overflow-y-auto px-3 pb-4">
          <div className="grid gap-0.5">
            <Link href="/" className={cn(ROW, "font-medium")}><HomeIcon className="size-4" />Home</Link>
            <Link href="/chat" className={cn(ROW, "font-medium")}><PlusIcon className="size-4" />Ask Reflect</Link>
          </div>

          <Section title="Tools">
            <Link href="/journal" className={ROW}><NotebookPenIcon className="text-muted-foreground size-4" />Journal</Link>
            <Link href="/calendar" className={ROW}><CalendarIcon className="text-muted-foreground size-4" />Calendar</Link>
          </Section>

          <Section title="Lenses">
            <Link href="/journal/log" className={ROW}><ScrollTextIcon className="text-muted-foreground size-4" />Log</Link>
            <Link href="/life/legacy" className={ROW}><HourglassIcon className="text-muted-foreground size-4" />Legacy</Link>
            <Link href="/journal/qualities" className={ROW}><SparklesIcon className="text-muted-foreground size-4" />Qualities</Link>
          </Section>

          {groups.map((g) => (
            <Section key={g.label} title={g.label}>
              {g.tiles.map((t) => (
                <Link key={t.id} href={t.href} className={ROW}>
                  <svg viewBox="0 0 100 100" aria-hidden="true" className="text-muted-foreground size-4 shrink-0"><path d={t.glyph} className="fill-current" fillRule="evenodd" /></svg>
                  {t.label}
                </Link>
              ))}
            </Section>
          ))}

          {chats.length ? (
            <Section title="Recent chats">
              {chats.map((c) => (
                <Link key={c.id} href={`/chat/history/${c.id}`} className={ROW}><MessageSquareIcon className="text-muted-foreground size-4 shrink-0" /><span className="truncate">{c.title}</span></Link>
              ))}
              <Link href="/chat/history" className={cn(ROW, "text-muted-foreground")}>All chats</Link>
            </Section>
          ) : null}
        </div>

        <div className="border-t p-3">
          <Link href="/settings" className={ROW}><SettingsIcon className="text-muted-foreground size-4" />Settings</Link>
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
    <Button variant="ghost" size="icon" className={className} aria-label={s.open ? "Close the sidebar" : "Open the sidebar"} aria-expanded={s.open} aria-controls="sidebar" onClick={s.toggle}>
      <PanelLeftIcon />
    </Button>
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
