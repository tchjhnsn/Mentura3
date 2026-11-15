"use client";

import { ListPlusIcon, PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListen, type Track } from "../player";

/** On a show's list of episodes: play one in Scholē's player, or put it up next. */
export function EpisodeButtons({ track }: { track: Track }) {
  const listen = useListen();
  if (!listen) return null;
  const on = listen.track?.id === track.id;
  const queued = listen.queue.some((x) => x.id === track.id);
  return (
    <span className="flex shrink-0 items-center">
      {!on && !queued ? <Button size="icon" variant="ghost" className="size-8" aria-label={`Put ${track.title} up next`} title="Up next" onClick={() => listen.enqueue(track)}><ListPlusIcon /></Button> : null}
      <Button size="icon" variant={on ? "default" : "outline"} className="size-8 rounded-full" aria-label={on && listen.playing ? `Pause ${track.title}` : `Play ${track.title}`} onClick={() => (on ? listen.toggle() : listen.playTrack(track))}>
        {on && listen.playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </span>
  );
}
