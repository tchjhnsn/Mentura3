"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Home's two views, Already and Not yet (Torian, 2026-11-17 02:47Z). Home always opens on Already and Not yet. After
 * a while with no input the plain pairs rotate in as the words, like a screensaver, with a slow cross-fade; any input
 * brings Already and Not yet back (Torian, 03:17Z). The positions never move, screen readers always hear Already and
 * Not yet, and with reduced motion the words never rotate.
 */
export const PAIRS: readonly (readonly [string, string])[] = [
  ["Already", "Not yet"],
  ["Life as it is", "Life as it could be"],
  ["Today", "Someday"],
  ["Have", "Hope"],
  ["Real", "Dream"],
];
/** How long with no input before the words begin to rotate, and how long each pair stays. */
export const IDLE_MS = 30_000;
export const TURN_MS = 6_000;
const FADE_MS = 500;
const INPUT = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

export function HomeToggle({ notYet }: { notYet: boolean }) {
  const [pair, setPair] = useState(0);
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let current = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let turn: ReturnType<typeof setInterval> | undefined;
    let fade: ReturnType<typeof setTimeout> | undefined;
    const go = (n: number) => {
      if (n === current) return;
      current = n;
      clearTimeout(fade);
      setShown(false);
      fade = setTimeout(() => {
        setPair(n);
        setShown(true);
      }, FADE_MS);
    };
    const wake = () => {
      clearTimeout(idle);
      clearInterval(turn);
      turn = undefined;
      go(0);
      idle = setTimeout(() => {
        turn = setInterval(() => go((current + 1) % PAIRS.length), TURN_MS);
        go(1);
      }, IDLE_MS);
    };
    wake();
    for (const e of INPUT) window.addEventListener(e, wake, { passive: true });
    return () => {
      clearTimeout(idle);
      clearInterval(turn);
      clearTimeout(fade);
      for (const e of INPUT) window.removeEventListener(e, wake);
    };
  }, []);
  const words = PAIRS[pair] ?? PAIRS[0]!;
  const items = [
    { name: "Already", label: words[0], href: "/", on: !notYet },
    { name: "Not yet", label: words[1], href: "/?view=not-yet", on: notYet },
  ];
  return (
    <nav aria-label="Already or not yet" className="bg-muted text-muted-foreground grid h-9 w-full sm:max-w-sm grid-cols-2 items-center rounded-lg p-[3px]">
      {items.map((it) => (
        <Link key={it.href} href={it.href} aria-label={it.name} aria-current={it.on ? "page" : undefined} className={cn("min-w-0 truncate rounded-md px-2 py-1 text-center text-sm font-medium whitespace-nowrap transition sm:px-3", it.on ? "bg-background text-foreground shadow-sm" : "hover:text-foreground")}>
          <span className={cn("transition-opacity duration-500", shown ? "opacity-100" : "opacity-0")}>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
