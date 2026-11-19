"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UIMessage } from "ai";
import { CARRY_KEY, Chat } from "@/app/chat/chat";
import { cn } from "@/lib/utils";

import { PaneCtx } from "./pane-context";
import { PANE_COOKIE, PANE_DEFAULT, PANE_MAX as MAX, PANE_MIN as MIN, type PaneState } from "./pane-state";

/** The page keeps at least this much room beside the pane. */
const PAGE_MIN = 480;
const STEP = 16;

/** What the pane holds now: a chat, new or carried on from another page. A new key starts it afresh. */
type Session = { key: number; ask?: string; chatId?: string };

const clamp = (w: number) => Math.round(Math.max(MIN, Math.min(MAX, typeof window === "undefined" ? MAX : window.innerWidth - PAGE_MIN, w)));

/**
 * The second pane (Panes design guide, The shell): a chat beside the page you are on. At 1024 px and wider it sits at
 * the right and the page narrows to make room (`--pane-w` on the root, read by `body` in globals.css); the handle on
 * its left edge resizes it between 320 and 720, and a double click puts it back to 400. Narrower, it slides over the
 * page from the right; on a phone it is a sheet from the bottom. Every link to a new chat (`/chat`, `/chat?q=`,
 * `/chat?c=`) opens here instead of leaving the page; Cmd-click still opens the page. The chat page itself has no
 * pane. Open or shut and the width are kept in a cookie, so the server paints the first frame with them.
 */
export function PaneProvider({ initial, children }: { initial: PaneState; children: ReactNode }) {
  const [open, setOpen] = useState(initial.open);
  const [width, setWidth] = useState(initial.width);
  const [session, setSession] = useState<Session>({ key: 0 });
  const [full, setFull] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const onChatPage = path === "/chat";
  const shown = open && !onChatPage;
  const live = useRef({ open, width });
  live.current = { open, width };

  const save = useCallback((o: boolean, w: number) => {
    document.cookie = `${PANE_COOKIE}=${o ? 1 : 0}.${w}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  const openChat = useCallback((from?: { ask?: string; chatId?: string }) => {
    if (from?.ask || from?.chatId || !live.current.open) setSession((s) => ({ key: s.key + 1, ask: from?.ask, chatId: from?.chatId }));
    setOpen(true);
    save(true, live.current.width);
  }, [save]);
  const close = useCallback(() => {
    setOpen(false);
    setFull(false);
    save(false, live.current.width);
  }, [save]);

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
  // Links to a new chat open it here. Captured before Next's Link sees the click, so the page does not change.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || a.hasAttribute("data-pane-own") || a.getAttribute("target") === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.getAttribute("href") ?? "", window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/chat" || window.location.pathname === "/chat") return;
      e.preventDefault();
      e.stopPropagation();
      openChat({ ask: url.searchParams.get("q")?.trim().slice(0, 500) || undefined, chatId: url.searchParams.get("c") || undefined });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [openChat]);

  const resize = (w: number) => {
    const next = clamp(w);
    setWidth(next);
    save(live.current.open, next);
  };
  const drag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    const move = (ev: PointerEvent) => setWidth(clamp(window.innerWidth - ev.clientX));
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
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
  const expand = (id: string, messages: UIMessage[]) => {
    if (messages.length) {
      try {
        sessionStorage.setItem(CARRY_KEY, JSON.stringify({ id, messages }));
      } catch {
        // No storage: the chat page reads the words from the chat history instead.
      }
    }
    close();
    router.push(messages.length ? `/chat?c=${encodeURIComponent(id)}` : "/chat");
  };

  return (
    <PaneCtx.Provider value={{ open: shown, openChat, close }}>
      {children}
      {shown ? (
        <aside
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
          <button type="button" onPointerDown={grab} aria-label={full ? "Make the chat smaller" : "Make the chat full screen"} className="mx-auto mt-2 mb-1 h-1.5 w-10 shrink-0 touch-none rounded-full bg-muted-foreground/30 sm:hidden" />
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
          <div className="min-h-0 flex-1">
            <Chat key={session.key} ask={session.ask} chatId={session.chatId} pane={{ onClose: close, onExpand: expand, onNew: () => setSession((s) => ({ key: s.key + 1 })) }} />
          </div>
        </aside>
      ) : null}
    </PaneCtx.Provider>
  );
}
