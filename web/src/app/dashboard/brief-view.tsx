"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Brief } from "@/server/dashboard-brief";
import { refreshBriefAction } from "./actions";

/** The brief's sentences, each followed by links to the records it came from, and a Refresh that writes it again. */
export function BriefView({ initial }: { initial: Brief }) {
  const [brief, setBrief] = useState(initial);
  const [pending, start] = useTransition();
  const refresh = () => start(async () => { try { setBrief(await refreshBriefAction()); } catch { /* keep the one shown */ } });
  return (
    <div className="flex max-w-2xl items-start gap-2">
      <p className={cn("text-muted-foreground min-w-0 flex-1 text-base leading-relaxed text-pretty", pending && "opacity-60")} aria-live="polite">
        {brief.lines.map((l, i) => (
          <span key={i}>
            {i ? " " : ""}{l.text}
            {l.links.map((k) => (
              <Link key={k.href + k.label} href={k.href} className="text-foreground/80 hover:text-foreground ml-1 text-sm font-medium underline decoration-dotted underline-offset-4 hover:decoration-solid">{k.label}</Link>
            ))}
          </span>
        ))}
      </p>
      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground size-8 shrink-0" onClick={refresh} disabled={pending} aria-label="Write the brief again" title={brief.by === "plain" ? "Ask Reflect to write it" : "Write it again"}>
        <RefreshCwIcon className={cn("size-4", pending && "animate-spin")} />
      </Button>
    </div>
  );
}
