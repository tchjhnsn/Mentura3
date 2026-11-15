"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { followPersonAction } from "./actions";

/** Follow a host or guest, or stop: at the top right beside their name, as a show's Follow is (Torian, 2026-11-15 17:07Z). */
export function PersonFollowButton({ name, qid, following }: { name: string; qid: string | null; following: boolean }) {
  const [on, setOn] = useState(following);
  const [pending, run] = useTransition();
  const toggle = () => {
    const next = !on;
    setOn(next);
    run(async () => {
      const f = new FormData();
      f.set("name", name); if (qid) f.set("qid", qid); f.set("follow", next ? "1" : "0");
      try { await followPersonAction(f); } catch { setOn(!next); }
    });
  };
  return (
    <Button size="sm" variant={on ? "secondary" : "outline"} className="shrink-0" disabled={pending} aria-pressed={on} onClick={toggle}>
      {on ? <CheckIcon /> : <PlusIcon />}{on ? "Following" : "Follow"}
    </Button>
  );
}
