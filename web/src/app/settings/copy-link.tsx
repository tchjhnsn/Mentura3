"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** An invite link, shown once, with a button that copies it. */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  // The full address once in the browser; the path first, so the server and the first paint agree.
  const [url, setUrl] = useState(path);
  useEffect(() => setUrl(`${window.location.origin}${path}`), [path]);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-3 py-2 text-xs">{url}</code>
      <Button type="button" variant="outline" size="icon" aria-label={copied ? "Copied" : "Copy link"} onClick={() => { void navigator.clipboard.writeText(url).then(() => setCopied(true)); }}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
