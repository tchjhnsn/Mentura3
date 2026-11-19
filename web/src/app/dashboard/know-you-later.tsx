"use client";

import { useTransition } from "react";
import { setAreaAction } from "../me/actions";

/** Not now: puts the Get to know you card off for seven days. */
export function NotNow({ today }: { today: string }) {
  const [pending, start] = useTransition();
  const later = new Date(`${today}T12:00:00Z`);
  later.setUTCDate(later.getUTCDate() + 7);
  return (
    <button type="button" disabled={pending} onClick={() => start(() => setAreaAction({ later: later.toISOString().slice(0, 10) }))} className="text-muted-foreground hover:text-foreground text-sm">
      Not now
    </button>
  );
}
