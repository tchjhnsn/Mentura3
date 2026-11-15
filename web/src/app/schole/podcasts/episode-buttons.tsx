"use client";

import { useState, useTransition } from "react";
import { HeartIcon, ListChecksIcon, ListPlusIcon, PauseIcon, PlayIcon } from "lucide-react";
import { clock } from "@reflect/core/media";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useListen, type Track } from "../player";
import { favoriteEpisodeAction } from "../actions";

/** A length as a person says it: "1h 25m", "56m". */
export const said = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ` ${m}m` : ""}` : `${Math.max(1, m)}m`; };

/**
 * An episode's acts in a show's list: play it in Scholē's player (the button says how long it is, or how much is
 * left when it is under way), put it up next or take it off, and mark it a favorite.
 */
export function EpisodeButtons({ track, status, favorite }: { track: Track; status: "played" | "begun" | "new"; favorite: boolean | null }) {
  const listen = useListen();
  const [fav, setFav] = useState(favorite);
  const [pending, run] = useTransition();
  if (!listen) return null;
  const on = listen.track?.id === track.id;
  const queued = listen.queue.some((x) => x.id === track.id);
  const left = track.seconds ? (status === "begun" && track.place ? Math.max(0, track.seconds - track.place) : track.seconds) : null;
  const label = on && listen.playing ? "Pause" : status === "begun" ? (left ? `${said(left)} left` : "Continue") : left ? said(left) : status === "played" ? "Play again" : "Play";
  return (
    <span className="flex items-center gap-1">
      <Button size="sm" variant={on ? "default" : "secondary"} className="h-8 rounded-full px-3" aria-label={`${on && listen.playing ? "Pause" : status === "begun" ? "Continue" : "Play"} ${track.title}`} onClick={() => (on ? listen.toggle() : listen.playTrack(track))}>
        {on && listen.playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}<span className="tabular-nums">{label}</span>
      </Button>
      {on ? null : queued
        ? <Button size="icon" variant="ghost" className="text-foreground size-8" aria-label={`${track.title} is up next; take it off`} title="Up next. Tap to take it off." onClick={() => listen.dequeue(track.id)}><ListChecksIcon /></Button>
        : <Button size="icon" variant="ghost" className="text-muted-foreground size-8" aria-label={`Put ${track.title} up next`} title="Up next" onClick={() => listen.enqueue(track)}><ListPlusIcon /></Button>}
      {fav !== null && track.item ? (
        <Button
          size="icon" variant="ghost" className={cn("size-8", fav ? "text-foreground" : "text-muted-foreground")} disabled={pending} aria-pressed={fav}
          aria-label={fav ? `${track.title} is a favorite; take it off` : `Favorite ${track.title}`} title={fav ? "Favorite" : "Favorite this episode"}
          onClick={() => { const next = !fav; setFav(next); run(async () => { try { await favoriteEpisodeAction(track.item!, track.unit, next); } catch { setFav(!next); } }); }}
        >
          <HeartIcon className={fav ? "fill-current" : ""} />
        </Button>
      ) : null}
      {status === "played" && !on ? <span className="text-muted-foreground ml-1 text-xs">Played</span> : null}
      {status === "begun" && track.place && !on ? <span className="text-muted-foreground ml-1 text-xs tabular-nums">at {clock(track.place)}</span> : null}
    </span>
  );
}
