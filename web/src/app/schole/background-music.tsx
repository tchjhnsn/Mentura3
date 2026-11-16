"use client";

import { useEffect, useRef, useState } from "react";
import { INTERLUDE, LEVELS, type Level } from "@reflect/core/background-music";
import type { CollectionItem } from "@reflect/core/collections";
import { audioOf } from "@reflect/core/media";

/** The person's choices for background music, kept in this browser. Off until they turn it on. */
export type BgSettings = { on: boolean; level: Level; interludes: boolean; hinted: boolean };
export const BG_DEFAULT: BgSettings = { on: false, level: "medium", interludes: true, hinted: false };
export const BG_KEY = "reflect:background-music";

const FADE = 1.5;

/**
 * Plays an era's instrumental recordings under an audiobook (Torian, 2026-11-16 06:36Z), one after another, through
 * the browser's audio mixer so its loudness can be set on phones too (iPhones ignore an audio element's volume).
 * It sounds only while the narration plays, sits at the chosen level under the voice, fades in and out, and comes
 * forward during an interlude between chapters. Wikimedia sends the CORS headers the mixer needs.
 */
export function BackgroundMusicLayer({ items, sounding, interlude, level, onNow }: {
  items: readonly CollectionItem[];
  /** The narration is playing, or an interlude is. */
  sounding: boolean;
  interlude: boolean;
  level: Level;
  /** Tells the player which recording is on, for its credit. */
  onNow: (i: CollectionItem | null) => void;
}) {
  const el = useRef<HTMLAudioElement>(null);
  const mix = useRef<{ ctx: AudioContext; gain: GainNode; el: HTMLAudioElement } | null>(null);
  const [at, setAt] = useState(0);
  // Recordings that failed to load in a row; after a whole round of failures the music stops trying.
  const [failed, setFailed] = useState(0);
  const playable = items.filter((i) => i.kind === "find" && audioOf(i.url));
  const now = playable.length ? playable[at % playable.length]! : null;
  const src = now && now.kind === "find" && failed < playable.length ? audioOf(now.url)!.src : null;

  useEffect(() => { onNow(now); }, [now, onNow]);
  useEffect(() => () => onNow(null), [onNow]);

  // Wire the element into the mixer once.
  useEffect(() => {
    const a = el.current;
    if (!a || mix.current?.el === a) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(a).connect(gain);
      gain.connect(ctx.destination);
      mix.current = { ctx, gain, el: a };
    } catch { mix.current = null; }
    return () => { void mix.current?.ctx.close(); mix.current = null; };
  }, []);

  // Fade to where the music should be: forward in an interlude, under the voice while it plays, silent otherwise.
  useEffect(() => {
    const a = el.current; const m = mix.current;
    if (!a || !src) return;
    const target = interlude ? INTERLUDE.gain : sounding ? LEVELS.find((l) => l.id === level)!.gain : 0;
    if (target > 0) { void m?.ctx.resume(); if (a.paused) void a.play().catch(() => {}); }
    if (m) {
      const g = m.gain.gain; const t = m.ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(target, t + FADE);
    } else a.volume = target;
    if (target === 0) { const id = setTimeout(() => a.pause(), FADE * 1000); return () => clearTimeout(id); }
  }, [sounding, interlude, level, src]);

  if (!src) return null;
  return <audio ref={el} src={src} crossOrigin="anonymous" preload="auto" onPlaying={() => setFailed(0)} onEnded={() => setAt((n) => n + 1)} onError={() => { setFailed((n) => n + 1); setAt((n) => n + 1); }} />;
}
