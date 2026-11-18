"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The dashboard's ask bar: one line to Ask Reflect, which answers and acts across the app. Sending opens the chat
 * with the question already asked (`/chat?q=`); a suggestion asks it in one tap.
 */
export function AskBar({ suggestions }: { suggestions: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const ask = (text: string) => { const t = text.trim(); if (t) router.push(`/chat?q=${encodeURIComponent(t)}`); };
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="bg-card focus-within:ring-ring/50 flex items-center gap-2 rounded-2xl border p-2 pl-4 shadow-xs focus-within:ring-[3px]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask Reflect or tell it what to do" aria-label="Ask Reflect" className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent py-2 text-base outline-none" />
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
