"use client";

import { useTransition } from "react";
import { CalendarArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { moveToNextDayAction } from "../actions";
import { useDashToast } from "../instant";

/** Moves one of the person's own one-off events on Today to tomorrow (change_event); the toast offers Undo. */
export function MoveToTomorrow({ id, title, className }: { id: string; title: string; className?: string }) {
  const toast = useDashToast();
  const [busy, start] = useTransition();
  return (
    <Button variant="ghost" size="icon" className={cn("size-8 shrink-0", className)} disabled={busy} aria-label={`Move ${title} to tomorrow`} title="Move to tomorrow"
      onClick={() => start(async () => toast(await moveToNextDayAction(id)))}>
      <CalendarArrowRightIcon />
    </Button>
  );
}
