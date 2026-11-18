"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition, type DragEvent } from "react";
import { CalendarArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { moveToNextDayAction } from "../actions";
import { useDashToast } from "../instant";
import { Empty } from "../parts";
import { minutesBetween } from "../urgency";

/** One thing on Today or Tomorrow as the card hands it over. */
export type TodayItem = { key: string; id: string; day: string; title: string; when: string; starts: string | null; href: string; label: string | null; movable: boolean };

const byTime = (a: TodayItem, b: TodayItem) => (a.starts ?? "").localeCompare(b.starts ?? "");

/**
 * Today's list, moving the person's own one-off events to tomorrow in place: the item moves at once (useOptimistic)
 * while change_event runs, and the toast offers Undo. Drag onto Tomorrow on a wide screen; the icon on a phone.
 */
export function TodayList({ today, tomorrow, clock, moreHref }: { today: TodayItem[]; tomorrow: TodayItem[]; clock: string; moreHref: string }) {
  const toast = useDashToast();
  const [, start] = useTransition();
  const [lists, moveNow] = useOptimistic({ today, tomorrow }, (s, key: string) => {
    const it = s.today.find((x) => x.key === key);
    return it ? { today: s.today.filter((x) => x.key !== key), tomorrow: [...s.tomorrow, { ...it, key: `${it.key}-moved` }].sort(byTime) } : s;
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const move = (it: TodayItem) => start(async () => {
    moveNow(it.key);
    toast(await moveToNextDayAction(it.id));
  });

  // The next timed thing still to come (or begun under an hour ago) leads; then what is still to come, then the
  // all-day items, then what has passed.
  const ahead = (e: TodayItem) => !!e.starts && minutesBetween(clock, e.starts) >= -60;
  const sorted = [...lists.today.filter(ahead), ...lists.today.filter((e) => !e.starts), ...lists.today.filter((e) => e.starts && !ahead(e))];
  const nextUp = sorted[0] ?? null;
  const rest = sorted.slice(1);
  const drag = (it: TodayItem) => it.movable ? {
    draggable: true,
    onDragStart: (e: DragEvent) => { e.dataTransfer.setData("text/plain", it.key); e.dataTransfer.effectAllowed = "move"; setDragging(it.key); },
    onDragEnd: () => { setDragging(null); setOver(false); },
  } : {};
  const drop = {
    onDragOver: (e: DragEvent) => { if (dragging) { e.preventDefault(); setOver(true); } },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const it = lists.today.find((x) => x.key === (e.dataTransfer.getData("text/plain") || dragging));
      setDragging(null);
      setOver(false);
      if (it?.movable) move(it);
    },
  };
  // Render helpers called as functions, not components, so a re-render mid-drag keeps the dragged element.
  const moveButton = (it: TodayItem, className?: string) => it.movable ? (
    <Button variant="ghost" size="icon" className={cn("size-8 shrink-0 lg:hidden", className)} aria-label={`Move ${it.title} to tomorrow`} title="Move to tomorrow" onClick={() => move(it)}>
      <CalendarArrowRightIcon />
    </Button>
  ) : null;
  const row = (it: TodayItem) => (
    <li key={it.key} className={cn("flex min-w-0 items-center gap-1", dragging === it.key && "opacity-50")} {...drag(it)}>
      <Link href={it.href} draggable={false} className={cn("hover:bg-accent grid min-w-0 flex-1 grid-cols-[6rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-1.5 text-sm", it.movable && "lg:cursor-grab")}>
        <span className="text-muted-foreground">{it.when}</span><span className="truncate">{it.title}</span>
      </Link>
      {moveButton(it)}
    </li>
  );

  return (
    <>
      {nextUp ? (
        <div className={cn("bg-card relative grid rounded-xl border transition", dragging === nextUp.key && "opacity-50")} {...drag(nextUp)}>
          <Link href={nextUp.href} draggable={false} className="hover:bg-accent grid gap-1 rounded-xl p-4 pr-12">
            <span className="text-muted-foreground text-sm font-medium">{nextUp.starts ? `Next · ${nextUp.when}` : "All day"}</span>
            <span className="text-xl font-semibold">{nextUp.title}</span>
            {nextUp.label ? <span className="text-muted-foreground text-sm">{nextUp.label}</span> : null}
          </Link>
          {moveButton(nextUp, "absolute top-3 right-3")}
        </div>
      ) : <Empty>Nothing on your calendar today.</Empty>}
      {rest.length || lists.tomorrow.length || dragging ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
          {rest.slice(0, 5).map(row)}
          {rest.length > 5 ? <li><Link href={moreHref} className="text-muted-foreground hover:text-foreground block px-2 py-1.5 text-sm">{rest.length - 5} more today</Link></li> : null}
          <li {...drop} className={cn("grid gap-1 rounded-lg", dragging && "border border-dashed p-1", over && "border-primary bg-accent/50")}>
            {lists.tomorrow.length || dragging ? <span className="text-muted-foreground px-2 pt-2 text-xs font-medium tracking-wide uppercase">Tomorrow</span> : null}
            {dragging && !lists.tomorrow.length ? <span className="text-muted-foreground px-2 pb-1.5 text-sm">Drop here to move it to tomorrow</span> : null}
            {lists.tomorrow.length ? (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {lists.tomorrow.slice(0, 3).map((it) => (
                  <li key={it.key}><Link href={it.href} className="hover:bg-accent grid grid-cols-[6rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-1.5 text-sm"><span className="text-muted-foreground">{it.when}</span><span className="truncate">{it.title}</span></Link></li>
                ))}
                {lists.tomorrow.length > 3 ? <li className="text-muted-foreground px-2 py-1 text-sm">{lists.tomorrow.length - 3} more tomorrow</li> : null}
              </ul>
            ) : null}
          </li>
        </ul>
      ) : null}
    </>
  );
}
