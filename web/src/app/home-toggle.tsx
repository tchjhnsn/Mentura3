"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Home's two views, Already and Not yet (Torian, 2026-11-17 02:47Z). The plain pairs rotate in as the words, at most
 * once per visit, with a slow cross-fade when Home opens (doc "Already and Not yet design guide", shared rules). The
 * positions never move, and screen readers always hear Already and Not yet.
 */
const PAIRS: readonly (readonly [string, string])[] = [
  ["Already", "Not yet"],
  ["Life as it is", "Life as it could be"],
  ["Today", "Someday"],
  ["Have", "Hope"],
  ["Real", "Dream"],
];
const KEY = "reflect.home.words";

export function HomeToggle({ notYet }: { notYet: boolean }) {
  const [pair, setPair] = useState(0);
  const [shown, setShown] = useState(true);
  useEffect(() => {
    let n = 0;
    try {
      // One turn per visit: the count moves on when a new tab session starts.
      if (!sessionStorage.getItem(KEY)) {
        n = (Number(localStorage.getItem(KEY) ?? "0") + 1) % PAIRS.length;
        localStorage.setItem(KEY, String(n));
        sessionStorage.setItem(KEY, String(n));
      } else n = Number(sessionStorage.getItem(KEY)) % PAIRS.length;
    } catch {
      return;
    }
    if (!n) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return setPair(n);
    setShown(false);
    const t = setTimeout(() => {
      setPair(n);
      setShown(true);
    }, 500);
    return () => clearTimeout(t);
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
