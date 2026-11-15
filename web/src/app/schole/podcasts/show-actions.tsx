"use client";

import { useTransition } from "react";
import { CheckIcon, PauseIcon, PlayIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListen, type Track } from "../player";
import { changeItemAction } from "../actions";
import { localDay } from "../items/youtube";

/**
 * A show's own acts (Torian, 2026-11-15 06:37Z): play the latest episode, or continue the one under way, in Scholē's
 * player; and follow the show or stop. A show never finishes, so it has no Heard and no dates.
 */
export function ShowActions({ item, track, resume, following }: { item: string; track: Track | null; resume: boolean; following: boolean }) {
  const listen = useListen();
  const [pending, run] = useTransition();
  const on = Boolean(track && listen?.track?.id === track.id);
  const follow = (yes: boolean) => run(async () => {
    const f = new FormData();
    f.set("item", item); f.set("status", yes ? "doing" : "want"); f.set("day", localDay());
    await changeItemAction(f);
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      {track && listen ? (
        <Button onClick={() => (on ? listen.toggle() : listen.playTrack(track))}>
          {on && listen.playing ? <PauseIcon /> : <PlayIcon />}
          {on && listen.playing ? "Pause" : resume ? "Continue" : "Play latest"}
        </Button>
      ) : null}
      <Button variant={following ? "secondary" : "outline"} disabled={pending} aria-pressed={following} onClick={() => follow(!following)}>
        {following ? <CheckIcon /> : <PlusIcon />}{following ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
