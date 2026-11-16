"use client";

import { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { ROUND_ACTION } from "./watch-classes";

/** Share: the device's own share sheet where there is one (phones), else the link copied. */
export function ShareButton({ title, path }: { title: string; path?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = new URL(path ?? window.location.pathname + window.location.search, window.location.origin).toString();
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* the person closed the sheet */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no clipboard */ }
  };
  return (
    <button type="button" onClick={share} className={ROUND_ACTION} aria-label={`Share ${title}`}>
      {copied ? <CheckIcon /> : <Share2Icon />}{copied ? "Link copied" : "Share"}
    </button>
  );
}
