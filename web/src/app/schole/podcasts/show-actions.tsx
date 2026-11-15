"use client";

import { useTransition } from "react";
import { CheckIcon, PauseIcon, PlayIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListen, type Track } from "../player";
import { changeItemAction } from "../actions";
import { localDay } from "../items/youtube";
import { hoursOf } from "@reflect/core/audiobooks";

/**
 * A show's own acts (Torian, 2026-11-15 06:37Z): play the latest episode, or continue the one under way, in Scholē's
 * player; and follow the show or stop. A show never finishes, so it has no Heard and no dates.
 */
export function ShowActions({ track, resume }: { track: Track | null; resume: boolean }) {
  const listen = useListen();
  const on = Boolean(track && listen?.track?.id === track.id);
  if (!track || !listen) return null;
  return (
    <Button size="lg" className="h-10 px-5" onClick={() => (on ? listen.toggle() : listen.playTrack(track))}>
      {on && listen.playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}
      {on && listen.playing ? "Pause" : resume ? "Continue" : "Play latest"}
      {track.seconds && !(on && listen.playing) ? <span className="font-normal opacity-70">{hoursOf(track.place && resume ? Math.max(60, track.seconds - track.place) : track.seconds)}{resume && track.place ? " left" : ""}</span> : null}
    </Button>
  );
}

/** Follow the show or stop following it, at the top right beside its title (Torian, 2026-11-15 07:15Z). */
export function FollowButton({ item, following }: { item: string; following: boolean }) {
  const [pending, run] = useTransition();
  const follow = (yes: boolean) => run(async () => {
    const f = new FormData();
    f.set("item", item); f.set("status", yes ? "doing" : "want"); f.set("day", localDay());
    await changeItemAction(f);
  });
  return (
    <Button size="sm" variant={following ? "secondary" : "outline"} className="shrink-0" disabled={pending} aria-pressed={following} onClick={() => follow(!following)}>
      {following ? <CheckIcon /> : <PlusIcon />}{following ? "Following" : "Follow"}
    </Button>
  );
}
