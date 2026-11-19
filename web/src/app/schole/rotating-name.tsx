"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Lang, Name } from "@reflect/core/crafts";
import { cn } from "@/lib/utils";
import { nextIndex, ordered } from "./names";
const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribe(on: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const q = window.matchMedia(REDUCE);
  q.addEventListener("change", on);
  return () => q.removeEventListener("change", on);
}
const reduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(REDUCE).matches;

/** About four seconds a name; the first turn comes sooner, so the first open shows the names move. */
const EVERY = 4000;
const FIRST = 1500;

/**
 * A name that fades through its languages. Screen readers hear the English only: the turning text is aria-hidden
 * and the English is said once, in a visually hidden span. Each name carries its lang, Hebrew reads right to left,
 * and Greek and Hebrew show how to say them small beneath. With reduced motion it holds the English. Every name
 * sits in the same grid cell, so the widest sets the width and nothing around it moves as they turn.
 * `advanceKey`: when it changes, the name turns at once (a door tap, say).
 */
export function RotatingName({ names, labelEn, advanceKey, delay = 0, className }: {
  names: readonly Name[]; labelEn: string; advanceKey?: string | number; delay?: number; className?: string;
}) {
  const list = ordered(names);
  const still = useSyncExternalStore(subscribe, reduced, () => false);
  const [at, setAt] = useState(0);
  const turns = list.length > 1 && !still;

  // The timer: first turn after FIRST (plus any stagger), then every EVERY.
  useEffect(() => {
    if (!turns) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = (wait: number) => {
      t = setTimeout(() => {
        setAt((i) => nextIndex(i, list.length));
        tick(EVERY);
      }, wait);
    };
    tick(FIRST + delay);
    return () => clearTimeout(t);
  }, [turns, list.length, delay, advanceKey]);

  // A set moment: turn now when advanceKey changes (not on the first render).
  const seen = useRef(advanceKey);
  useEffect(() => {
    if (seen.current === advanceKey) return;
    seen.current = advanceKey;
    if (turns) setAt((i) => nextIndex(i, list.length));
  }, [advanceKey, turns, list.length]);

  const shown = turns ? at % list.length : 0;
  const says = list.some((n) => n.say);
  return (
    <span className={cn("inline-grid align-baseline", className)}>
      <span className="sr-only">{labelEn}</span>
      {list.map((n, i) => (
        <span
          key={`${n.lang}-${i}`}
          aria-hidden
          lang={n.lang}
          dir={n.lang === "he" ? "rtl" : undefined}
          className={cn(
            "col-start-1 row-start-1 grid content-start transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
            i === shown ? "opacity-100" : "pointer-events-none opacity-0",
            n.lang === "he" ? "text-left" : undefined,
          )}
        >
          <span className="whitespace-nowrap">{n.text}</span>
          {says ? <span dir="ltr" lang={n.say ? `${n.lang}-Latn` : undefined} className="text-muted-foreground text-xs font-normal tracking-normal">{n.say ?? "\u00a0"}</span> : null}
        </span>
      ))}
    </span>
  );
}
