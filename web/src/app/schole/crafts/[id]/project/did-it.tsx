"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { craftActAction } from "../../actions";

/** "I did it": shows the payoff at once and keeps the tried act in the background (drawn to it becomes trying it). */
export function DidIt({ craftId, label, practising }: { craftId: string; label: string; practising: boolean }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [, start] = useTransition();

  const did = () => {
    setDone(true);
    setError(false);
    start(async () => {
      try { await craftActAction(craftId, "tried"); } catch { setDone(false); setError(true); }
    });
  };

  if (!done) {
    return (
      <div className="bg-background sticky bottom-0 -mx-6 grid gap-2 border-t px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error ? <p className="text-destructive text-sm" role="alert">That did not save. Try again.</p> : null}
        <Button type="button" size="lg" className="mx-auto w-full max-w-sm" onClick={did}>I did it</Button>
      </div>
    );
  }
  return (
    <div role="status" className="bg-primary/10 animate-in fade-in zoom-in-95 grid gap-3 rounded-2xl p-4 duration-200 motion-reduce:animate-none">
      <p className="flex items-center gap-2 font-semibold">
        <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-full"><CheckIcon className="size-4" strokeWidth={3} /></span>
        {practising ? `Tried. ${label} stays Practising.` : `Tried. ${label} is now Trying it.`}
      </p>
      <p className="text-muted-foreground text-sm">Next: see what else to try in {label.toLowerCase()} on its page.</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href={`/schole/crafts/${craftId}`}>Open {label}</Link></Button>
        <Button asChild variant="ghost"><Link href="/schole">Back to Scholē</Link></Button>
      </div>
    </div>
  );
}
