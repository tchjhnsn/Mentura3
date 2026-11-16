"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { writeTurnAction } from "../../actions";

/** The seat holder's turn, with what is left of its character count. */
export function TurnForm({ id, step, side, max }: { id: string; step: string; side: string; max: number }) {
  const [n, setN] = useState(0);
  return (
    <form action={writeTurnAction} className="border-primary space-y-2 rounded-lg border-2 p-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="turn" className="block text-sm font-semibold">Your turn: {side}, {step.toLowerCase()}</label>
      <Textarea id="turn" name="body" required rows={6} maxLength={max} onChange={(e) => setN(e.target.value.length)} />
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs tabular-nums ${max - n < 50 ? "text-destructive" : "text-muted-foreground"}`}>{(max - n).toLocaleString("en-US")} characters left</span>
        <Button type="submit">Post your turn</Button>
      </div>
    </form>
  );
}
