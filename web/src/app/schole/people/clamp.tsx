"use client";

import { useState } from "react";

/** A passage shown to two lines, with More to read it whole. */
export function Clamp({ text, children }: { text: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-prose space-y-1 text-sm leading-relaxed">
      <p className={open ? "" : "line-clamp-2"}>{text}</p>
      <p className="text-muted-foreground text-xs">
        {text.length > 160 ? <button type="button" className="text-foreground mr-2 font-medium underline-offset-4 hover:underline" onClick={() => setOpen((v) => !v)}>{open ? "Less" : "More"}</button> : null}
        {children}
      </p>
    </div>
  );
}
