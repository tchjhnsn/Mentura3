"use client";

import { useState } from "react";
import { ArrowUpIcon, PaperclipIcon } from "lucide-react";
import { Num } from "./bits";

/** C6 Prompt box: write what you want; Enter sends. Suggestions fill the box. */
export function PromptBox({ placeholder = "Ask for anything", suggestions = [], onSubmit, autoFocus }: { placeholder?: string; suggestions?: string[]; onSubmit?: (text: string) => void; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const send = () => { const t = text.trim(); if (!t) return; onSubmit?.(t); setText(""); };
  return (
    <div className="space-y-2">
      <div className="bg-card relative rounded-xl border shadow-xs focus-within:ring-2 focus-within:ring-ring/30">
        <Num n="C6" className="absolute -top-2 left-3" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} autoFocus={autoFocus} rows={2} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="placeholder:text-muted-foreground block w-full resize-none bg-transparent px-3 pt-3 text-sm outline-none" />
        <div className="flex items-center justify-between px-2 pb-2">
          <button type="button" className="text-muted-foreground hover:bg-accent rounded-md p-1.5" aria-label="Attach a file"><PaperclipIcon className="size-4" /></button>
          <button type="button" onClick={send} disabled={!text.trim()} className="bg-foreground text-background grid size-7 place-items-center rounded-full disabled:opacity-30" aria-label="Send"><ArrowUpIcon className="size-4" /></button>
        </div>
      </div>
      {suggestions.length ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => <button key={s} type="button" onClick={() => setText(s)} className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-2.5 py-1 text-xs">{s}</button>)}
        </div>
      ) : null}
    </div>
  );
}
