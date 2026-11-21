"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keepCraftAction } from "../../crafts/actions";

/** Keep the matched crafts as Drawn to it, once, in the background (crafts already kept are left as they are). */
export function KeepOnOpen({ ids }: { ids: string[] }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !ids.length) return;
    done.current = true;
    void (async () => {
      for (const id of ids) {
        const form = new FormData();
        form.set("ref", id);
        await keepCraftAction(form).catch(() => undefined);
      }
    })();
  }, [ids]);
  return null;
}

/** Share the three crafts with the phone's share sheet, or copy the text and a link where there is none. */
export function ShareCrafts({ names }: { names: string[] }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/life/work/discover`;
    const text = `My three crafts to try this week: ${names.join(", ")}. Find yours:`;
    if (navigator.share) {
      try { await navigator.share({ title: "My three crafts", text, url }); } catch { /* closed the sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard */ }
  };
  return (
    <Button type="button" variant="outline" onClick={share} aria-live="polite">
      {copied ? <><CheckIcon />Copied</> : <><Share2Icon />Share your crafts</>}
    </Button>
  );
}
