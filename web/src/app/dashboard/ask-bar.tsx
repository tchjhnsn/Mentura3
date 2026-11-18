"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const noop = () => () => {};

/**
 * The dashboard's ask bar: one line to Ask Reflect, which answers and acts across the app. Sending opens the chat
 * with the question already asked (`/chat?q=`); a suggestion asks it in one tap. Cmd-K or Ctrl-K, or / when not
 * typing elsewhere, puts the cursor in it; wide screens show the shortcut.
 */
export function AskBar({ suggestions }: { suggestions: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  // Which key to show is known only in the browser; the server renders no hint.
  const mac = useSyncExternalStore(noop, () => /Mac|iPhone|iPad/.test(navigator.userAgent), () => null);
  const input = useRef<HTMLInputElement>(null);
  const ask = (text: string) => { const t = text.trim(); if (t) router.push(`/chat?q=${encodeURIComponent(t)}`); };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="bg-card focus-within:ring-ring/50 flex items-center gap-2 rounded-2xl border p-2 pl-4 shadow-xs focus-within:ring-[3px]">
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask Reflect or tell it what to do" aria-label="Ask Reflect" aria-keyshortcuts="Meta+K Control+K /" className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent py-2 text-base outline-none" />
        {mac !== null && !q ? (
          <kbd className="text-muted-foreground bg-muted hidden shrink-0 rounded-md border px-1.5 py-0.5 font-sans text-xs lg:inline-block" aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</kbd>
        ) : null}
        <Button type="submit" size="icon" className="rounded-full" aria-label="Ask" disabled={!q.trim()}><ArrowUpIcon /></Button>
      </form>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [&>li]:shrink-0">
        {suggestions.map((s) => (
          <li key={s}><button type="button" onClick={() => ask(s)} className="hover:bg-accent text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-sm transition">{s}</button></li>
        ))}
      </ul>
    </div>
  );
}
