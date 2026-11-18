"use client";

// The Habits card's taps: a streak's Today and a checklist's items, each one tap through the Home card action
// (checkCardItem, which runs the registry's check_home_item from the page). The check shows at once and settles when
// the page refreshes.
import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkCardItem } from "../../home-card-actions";
import type { HabitView } from "../tiles";

function Box({ on }: { on: boolean }) {
  return <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on && "bg-primary text-primary-foreground border-primary")}>{on ? <CheckIcon className="size-3.5" /> : null}</span>;
}

function Streak({ h }: { h: Extract<HabitView, { kind: "streak" }> }) {
  const [busy, start] = useTransition();
  const [marked, setMarked] = useOptimistic(h.marked);
  const days = h.days + (marked && !h.marked ? 1 : !marked && h.marked ? -1 : 0);
  return (
    <li>
      <button type="button" disabled={busy} aria-pressed={marked} onClick={() => start(async () => { setMarked(!marked); await checkCardItem(h.id, null); })}
        className={cn("bg-card hover:bg-accent flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition", busy && "opacity-70")}>
        <Box on={marked} />
        <span className="grid min-w-0 flex-1">
          <span className="truncate font-medium">{h.title}</span>
          <span className="text-muted-foreground truncate text-sm">{h.label}</span>
        </span>
        <span className="grid shrink-0 justify-items-end">
          <span className="text-lg leading-none font-semibold tabular-nums">{Math.max(0, days)}</span>
          <span className="text-muted-foreground text-xs">{days === 1 ? "day" : "days"} in a row</span>
        </span>
      </button>
    </li>
  );
}

function Checklist({ h }: { h: Extract<HabitView, { kind: "checklist" }> }) {
  const [busy, start] = useTransition();
  const [items, toggle] = useOptimistic(h.items, (list, i: number) => list.map((it, n) => (n === i ? { ...it, done: !it.done } : it)));
  const done = items.filter((i) => i.done).length;
  return (
    <li className={cn("bg-card grid gap-1 rounded-xl border p-3", busy && "opacity-70")}>
      <span className="flex items-baseline justify-between gap-3 px-1">
        <span className="truncate font-medium">{h.title}</span>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{done} of {items.length}</span>
      </span>
      <ul className="grid gap-0.5">
        {items.map((it, i) => (
          <li key={i}>
            <button type="button" disabled={busy} aria-pressed={it.done} onClick={() => start(async () => { toggle(i); await checkCardItem(h.id, i); })}
              className="hover:bg-accent flex w-full min-w-0 items-start gap-2.5 rounded-md px-1 py-1 text-left text-sm">
              <Box on={it.done} />
              <span className={cn("min-w-0 break-words", it.done && "text-muted-foreground line-through")}>{it.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function HabitTaps({ habits }: { habits: HabitView[] }) {
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
      {habits.map((h) => (h.kind === "streak" ? <Streak key={h.id} h={h} /> : <Checklist key={h.id} h={h} />))}
    </ul>
  );
}
