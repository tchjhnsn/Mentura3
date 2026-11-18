"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Face } from "@/components/dash";
import { Button } from "@/components/ui/button";
import { connectBackFromDashboard, notNowFromDashboard } from "../actions";
import { useDashToast } from "../instant";

type Ask = { id: string; fromId: string; name: string; line: string };

/** Connect requests with Connect back and Not now: the row leaves at once (useOptimistic) and the toast says what happened. */
export function RequestRows({ requests }: { requests: Ask[] }) {
  const toast = useDashToast();
  const [, start] = useTransition();
  const [shown, drop] = useOptimistic(requests, (s, id: string) => s.filter((r) => r.id !== id));
  const answer = (r: Ask, yes: boolean) => start(async () => {
    drop(r.id);
    toast(yes ? await connectBackFromDashboard(r.fromId) : await notNowFromDashboard(r.id));
  });
  return shown.map((r) => (
    <li key={r.id} className="flex min-w-0 items-center gap-1">
      <Link href="/life/friends" className="hover:bg-accent flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2">
        <Face name={r.name} size={40} />
        <span className="grid min-w-0"><span className="font-medium">{r.name}</span><span className="text-muted-foreground truncate text-sm">{r.line}</span></span>
      </Link>
      <Button variant="outline" size="icon" className="rounded-full" aria-label={`Connect back with ${r.name}`} title="Connect back" onClick={() => answer(r, true)}><CheckIcon /></Button>
      <Button variant="ghost" size="icon" className="rounded-full" aria-label={`Not now for ${r.name}`} title="Not now" onClick={() => answer(r, false)}><XIcon /></Button>
    </li>
  ));
}
