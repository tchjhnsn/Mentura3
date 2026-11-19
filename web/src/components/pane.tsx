"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { CalendarIcon, CalendarDaysIcon, FileTextIcon, GlobeIcon, LayoutDashboardIcon, Maximize2Icon, MessageSquareIcon, NotebookPenIcon, PlusIcon, XIcon } from "lucide-react";
import { CARRY_KEY, Chat } from "@/app/chat/chat";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BrowserTab } from "./pane-browser";
import { PaneCtx } from "./pane-context";
import { PANE_COOKIE, PANE_DEFAULT, PANE_MAX as MAX, PANE_MIN as MIN, type PaneState } from "./pane-state";

/** The page keeps at least this much room beside the pane. */
const PAGE_MIN = 480;
const STEP = 16;
/** Tabs kept at once; opening one more drops the oldest that is not showing. */
const MAX_TABS = 8;

/** One tab of the pane: a chat (new, or carried on from another page) or one of Reflect's own pages. */
type Tab =
  | { id: string; kind: "chat"; title: string; ask?: string; chatId?: string }
  | { id: string; kind: "page"; title: string; path: string }
  | { id: string; kind: "site"; title: string; url: string | null };

/** Places the + menu offers besides a new chat. */
const PLACES = [
  { path: "/dashboard", title: "Dashboard", Icon: LayoutDashboardIcon },
  { path: "/journal", title: "Journal", Icon: NotebookPenIcon },
  { path: "/calendar", title: "Calendar", Icon: CalendarIcon },
  { path: "/events", title: "Events", Icon: CalendarDaysIcon },
];

let seq = 0;
const tabId = () => `t${++seq}`;
const newChat = (from?: { ask?: string; chatId?: string }): Tab => ({ id: tabId(), kind: "chat", title: "New Chat", ask: from?.ask, chatId: from?.chatId });
const clamp = (w: number) => Math.round(Math.max(MIN, Math.min(MAX, typeof window === "undefined" ? MAX : window.innerWidth - PAGE_MIN, w)));
/** A path inside Reflect that can show in the pane: same site, not an API route, not the chat page. */
const pagePath = (href: string): string | null => {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return null;
  return url.pathname + url.search + url.hash;
};
/** True inside the pane's own page tab (an iframe of Reflect), where there is no second pane of its own. */
const embedded = () => typeof window !== "undefined" && window.self !== window.top;

/**
 * The second pane (Panes design guide, The shell): a chat, and pages of Reflect, beside the page you are on. At 1024
 * px and wider it sits at the right and the page narrows to make room (`--pane-w` on the root, read by `body` in
 * globals.css); the handle on its left edge resizes it between 320 and 720, and a double click puts it back to 400.
 * Narrower, it slides over the page from the right; on a phone it is a sheet from the bottom.
 *
 * It holds tabs (PR 2): chats and pages. + opens a new chat, a place or a website (PR 3, ./pane-browser.tsx); Alt-click on any link opens that
 * page, or that outside site, here; the chat's `open_pane` tool opens a record beside it. A page tab is Reflect itself in a frame, so links
 * inside it stay in the tab. Every link to a new chat (`/chat`, `/chat?q=`, `/chat?c=`) opens a chat tab instead of
 * leaving the page; Cmd-click still opens the page. Open as a page takes the tab to the main window. The chat page
 * itself has no pane. Open or shut and the width are kept in a cookie, so the server paints the first frame with them.
 */
export function PaneProvider({ initial, children }: { initial: PaneState; children: ReactNode }) {
  const [open, setOpen] = useState(initial.open);
  const [width, setWidth] = useState(initial.width);
  // The first tab has a fixed id, so the server and the browser draw it alike.
  const [tabs, setTabs] = useState<Tab[]>(() => [{ ...newChat(), id: "t0" }]);
  const [active, setActive] = useState<string>(() => "");
  const [full, setFull] = useState(false);
  const [inFrame, setInFrame] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const onChatPage = path === "/chat";
  const shown = open && !onChatPage && !inFrame;
  const live = useRef({ open, width, onChatPage });
  live.current = { open, width, onChatPage };
  // Each chat tab's id and words, for Open as a page; each page tab's frame, to read where it has got to.
  const chats = useRef(new Map<string, { id: string; messages: UIMessage[] }>());
  const frames = useRef(new Map<string, HTMLIFrameElement>());
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  useEffect(() => setInFrame(embedded()), []);
  const save = useCallback((o: boolean, w: number) => {
    document.cookie = `${PANE_COOKIE}=${o ? 1 : 0}.${w}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  const show = useCallback(() => {
    setOpen(true);
    save(true, live.current.width);
  }, [save]);
  /** Adds a tab and shows it, dropping the oldest when there are too many. */
  const add = useCallback((t: Tab) => {
    setTabs((list) => {
      const next = [...list, t];
      return next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next;
    });
    setActive(t.id);
  }, []);
  const openChat = useCallback((from?: { ask?: string; chatId?: string }) => {
    // A plain New Chat shows the pane as it was; a question or a carried chat starts a tab of its own.
    if (from?.ask || from?.chatId || !live.current.open) {
      // An empty chat tab is used for it rather than leaving one behind.
      const t = newChat(from);
      setTabs((list) => {
        const last = list.at(-1);
        const empty = last?.kind === "chat" && !last.ask && !last.chatId && !(chats.current.get(last.id)?.messages.length);
        if (!empty) return [...list, t].slice(-MAX_TABS);
        chats.current.delete(last.id);
        return [...list.slice(0, -1), t];
      });
      setActive(t.id);
    }
    show();
  }, [add, show]);
  const openPage = useCallback((p: string, title?: string) => {
    if (live.current.onChatPage) return router.push(p);
    add({ id: tabId(), kind: "page", title: title || "Page", path: p });
    show();
  }, [add, show, router]);
  const openSite = useCallback((url: string | null) => {
    add({ id: tabId(), kind: "site", title: url ? new URL(url).hostname.replace(/^www\./, "") : "Website", url });
    show();
  }, [add, show]);
  const close = useCallback(() => {
    setOpen(false);
    setFull(false);
    save(false, live.current.width);
  }, [save]);
  const shut = (id: string) => {
    chats.current.delete(id);
    frames.current.delete(id);
    const left = tabs.filter((t) => t.id !== id);
    if (!left.length) {
      setTabs([newChat()]);
      close();
      return;
    }
    setTabs(left);
    if (current?.id === id) setActive(left[Math.max(0, tabs.findIndex((t) => t.id === id) - 1)]!.id);
  };

  // The page narrows by the pane's width only while the pane is shown.
  useEffect(() => {
    document.documentElement.style.setProperty("--pane-w", shown ? `${width}px` : "0px");
  }, [shown, width]);
  // A window made narrower keeps room for the page.
  useEffect(() => {
    const fit = () => setWidth((w) => clamp(w));
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  // Links to a new chat open a chat tab, and Alt-click opens any page here. Captured before Next's Link sees the click.
  useEffect(() => {
    if (inFrame) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || a.hasAttribute("data-pane-own") || a.getAttribute("target") === "_blank" || a.hasAttribute("download")) return;
      if ((a as HTMLElement).closest("aside[data-pane]")) return;
      const href = a.getAttribute("href") ?? "";
      const url = new URL(href, window.location.href);
      if (window.location.pathname === "/chat") return;
      if (url.origin === window.location.origin && url.pathname === "/chat") {
        e.preventDefault();
        e.stopPropagation();
        return openChat({ ask: url.searchParams.get("q")?.trim().slice(0, 500) || undefined, chatId: url.searchParams.get("c") || undefined });
      }
      if (!e.altKey) return;
      const p = pagePath(href);
      e.preventDefault();
      e.stopPropagation();
      if (p) openPage(p, a.textContent?.trim().slice(0, 40) || undefined);
      else if (/^https?:$/.test(url.protocol)) openSite(url.href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [openChat, openPage, openSite, inFrame]);

  const resize = (w: number) => {
    const next = clamp(w);
    setWidth(next);
    save(live.current.open, next);
  };
  const drag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    // Frames swallow pointer moves; let the drag pass over them.
    document.body.style.userSelect = "none";
    document.documentElement.dataset.paneDrag = "1";
    const move = (ev: PointerEvent) => setWidth(clamp(window.innerWidth - ev.clientX));
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      delete document.documentElement.dataset.paneDrag;
      resize(window.innerWidth - ev.clientX);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
  // The sheet's grabber: up for the whole screen, down far enough to close.
  const grab = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    const y0 = e.clientY;
    el.setPointerCapture(e.pointerId);
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointerup", up);
      const dy = ev.clientY - y0;
      if (dy > 120) close();
      else if (dy < -40) setFull(true);
      else if (dy > 40) setFull(false);
      else setFull((f) => !f);
    };
    el.addEventListener("pointerup", up);
  };
  /** Takes the showing tab to the main window: a chat with its whole conversation, a page where its frame has got to. */
  const expand = () => {
    if (!current) return;
    let to = "/chat";
    if (current.kind === "chat") {
      const c = chats.current.get(current.id);
      if (c?.messages.length) {
        try {
          sessionStorage.setItem(CARRY_KEY, JSON.stringify({ id: c.id, messages: c.messages }));
        } catch {
          // No storage: the chat page reads the words from the chat history instead.
        }
        to = `/chat?c=${encodeURIComponent(c.id)}`;
      }
    } else if (current.kind === "site") {
      // An outside site goes to a tab of the browser's own.
      if (current.url) window.open(current.url, "_blank", "noopener,noreferrer");
      shut(current.id);
      return;
    } else {
      const loc = frames.current.get(current.id)?.contentWindow?.location;
      to = loc ? loc.pathname + loc.search + loc.hash : current.path;
    }
    shut(current.id);
    close();
    router.push(to);
  };
  const named = (id: string, title: string) => setTabs((list) => (list.find((t) => t.id === id)?.title === title ? list : list.map((t) => (t.id === id ? { ...t, title } : t))));

  return (
    <PaneCtx.Provider value={{ open: shown, openChat, openPage, close }}>
      {children}
      {shown ? (
        <aside
          data-pane=""
          aria-label="Second pane"
          onKeyDown={(e) => { if (e.key === "Escape" && !e.defaultPrevented) close(); }}
          style={{ ["--w" as string]: `${width}px` }}
          className={cn(
            "bg-background fixed z-30 flex flex-col",
            // Phone: a sheet from the bottom.
            "inset-x-0 bottom-0 rounded-t-2xl border-t shadow-2xl",
            full ? "top-0 rounded-none" : "top-[12dvh]",
            // From 640: over the page from the right.
            "sm:inset-y-0 sm:top-0 sm:right-0 sm:left-auto sm:w-[min(var(--w),calc(100vw-48px))] sm:rounded-none sm:border-t-0 sm:border-l",
            // From 1024: beside the page, which narrows to make room.
            "lg:shadow-none",
          )}
        >
          <button type="button" onPointerDown={grab} aria-label={full ? "Make the pane smaller" : "Make the pane full screen"} className="mx-auto mt-2 mb-1 h-1.5 w-10 shrink-0 touch-none rounded-full bg-muted-foreground/30 sm:hidden" />
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the pane"
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuenow={width}
            tabIndex={0}
            onPointerDown={drag}
            onDoubleClick={() => resize(PANE_DEFAULT)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") { e.preventDefault(); resize(width + STEP); }
              if (e.key === "ArrowRight") { e.preventDefault(); resize(width - STEP); }
            }}
            className="group absolute inset-y-0 -left-1.5 z-10 hidden w-3 cursor-col-resize touch-none outline-none sm:block"
          >
            <span className="bg-border group-hover:bg-primary/50 group-focus-visible:bg-primary absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors group-hover:w-0.5 group-focus-visible:w-0.5" />
            <span className="bg-muted-foreground/40 absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </div>

          {/* The tab bar: tabs, + for a new one, Open as a page and Close. */}
          <div className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
            <div role="tablist" aria-label="Open in the pane" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
              {tabs.map((t) => {
                const on = t.id === current?.id;
                return (
                  <div key={t.id} ref={on ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined} className={cn("group/tab flex max-w-44 min-w-24 items-center rounded-md text-sm", on ? "bg-muted font-medium" : "text-muted-foreground hover:bg-accent")}>
                    <button type="button" role="tab" aria-selected={on} aria-controls={`pane-${t.id}`} onClick={() => setActive(t.id)} className="flex min-w-0 items-center gap-1.5 py-1 pr-1 pl-2.5">
                      {t.kind === "chat" ? <MessageSquareIcon className="size-3.5 shrink-0" /> : t.kind === "site" ? <GlobeIcon className="size-3.5 shrink-0" /> : <FileTextIcon className="size-3.5 shrink-0" />}
                      <span className="truncate">{t.title}</span>
                    </button>
                    {tabs.length > 1 ? (
                      <button type="button" aria-label={`Close ${t.title}`} onClick={() => shut(t.id)} className={cn("hover:bg-background mr-1 grid size-5 shrink-0 place-items-center rounded", on ? "" : "opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100")}>
                        <XIcon className="size-3" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Open something in a new tab" title="New tab"><PlusIcon /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => add(newChat())}><MessageSquareIcon />New Chat</DropdownMenuItem>
                <DropdownMenuSeparator />
                {PLACES.map((p) => (
                  <DropdownMenuItem key={p.path} onSelect={() => openPage(p.path, p.title)}><p.Icon />{p.title}</DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => openSite(null)}><GlobeIcon />Open a website</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Alt-click any link to open it here</DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon-sm" aria-label="Open as a page" title="Open as a page" onClick={expand}><Maximize2Icon /></Button>
            <Button variant="ghost" size="icon-sm" aria-label="Close the pane" title="Close" onClick={close}><XIcon /></Button>
          </div>

          {/* Every tab stays mounted, so a chat keeps its words and a page its place while another tab shows. */}
          {tabs.map((t) => (
            <div key={t.id} id={`pane-${t.id}`} role="tabpanel" hidden={t.id !== current?.id} className="min-h-0 flex-1">
              {t.kind === "chat" ? (
                <Chat
                  ask={t.ask}
                  chatId={t.chatId}
                  pane={{
                    onState: (s) => {
                      chats.current.set(t.id, { id: s.id, messages: s.messages });
                      named(t.id, s.title);
                    },
                  }}
                />
              ) : t.kind === "site" ? (
                <BrowserTab url={t.url} onUrl={(u, title) => setTabs((list) => list.map((x) => (x.id === t.id ? { ...x, url: u, title } : x)))} />
              ) : (
                <iframe
                  ref={(el) => { if (el) frames.current.set(t.id, el); }}
                  src={t.path}
                  title={t.title}
                  onLoad={(e) => { const d = e.currentTarget.contentDocument; if (d?.title) named(t.id, d.title.replace(/ [·|–-] Reflect$/, "").slice(0, 40)); }}
                  className="size-full border-0 [html[data-pane-drag]_&]:pointer-events-none"
                />
              )}
            </div>
          ))}
        </aside>
      ) : null}
    </PaneCtx.Provider>
  );
}
