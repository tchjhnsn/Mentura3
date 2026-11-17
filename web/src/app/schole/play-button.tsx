"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useListen } from "./player";

/**
 * Play a free recording in Scholē's own player (Torian, 2026-11-16 04:02Z: music "we can actually play ourselves"),
 * the same player that plays audiobooks and podcasts, on the web and on a phone. `src` is the file itself.
 */
export function PlayButton({ src, title, by, href, image, label, variant = "default", className }: { src: string; title: string; by: string; href: string; image?: string | null; /** Words beside the icon; none for an icon button. */ label?: string; /** Outline when another button on the screen is the filled one. */ variant?: "default" | "outline"; className?: string }) {
  const listen = useListen();
  if (!listen) return null;
  const id = `free:${src}`;
  const on = listen.track?.id === id;
  const playing = on && listen.playing;
  const act = () => (on ? listen.toggle() : listen.playTrack({ id, src, title, show: by, href, image: image ?? null, item: null, unit: "" }));
  return label ? (
    <Button onClick={act} variant={variant} aria-label={`${playing ? "Pause" : "Play"} ${title}`} className={className}>
      {playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}{playing ? "Pause" : label}
    </Button>
  ) : (
    <Button size="icon" variant={on ? "default" : "secondary"} onClick={act} aria-label={`${playing ? "Pause" : "Play"} ${title}`} className={cn("size-9 rounded-full", className)}>
      {playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}
    </Button>
  );
}
