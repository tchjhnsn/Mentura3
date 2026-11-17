"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** An invite link, shown once, with a button that copies it. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-3 py-2 text-xs">{url}</code>
      <Button type="button" variant="outline" size="icon" aria-label={copied ? "Copied" : "Copy link"} onClick={() => { void navigator.clipboard.writeText(url).then(() => setCopied(true)); }}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
