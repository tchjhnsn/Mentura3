"use client";

// L3.4 Match the terms, after Brilliant's practice (learning by doing, not only choosing): tap a Greek term, then the
// meaning that is its own. A right pair stays together; a wrong one shakes and lets go. No score, as in the check.
import { useMemo, useState } from "react";
import type { Term } from "@reflect/core/aristotle/types";
import { cn } from "@/lib/utils";

/** A fixed shuffle from the terms themselves, so the meanings never sit beside their terms by default. */
function order(n: number, seed: string): number[] {
  const ix = [...Array(n).keys()];
  let h = [...seed].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
  for (let i = n - 1; i > 0; i--) { h = (h * 1103 + 12345) % 9973; const j = h % (i + 1); [ix[i], ix[j]] = [ix[j]!, ix[i]!]; }
  if (n > 1 && ix.every((v, i) => v === i)) ix.push(ix.shift()!);
  return ix;
}

export function Match({ terms, onDone }: { terms: Term[]; onDone: () => void }) {
  const meanings = useMemo(() => order(terms.length, terms.map((t) => t.translit).join()), [terms]);
  const [term, setTerm] = useState<number | null>(null);
  const [paired, setPaired] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const pick = (m: number) => {
    if (term === null || paired.includes(m)) return;
    if (m === term) {
      const next = [...paired, m];
      setPaired(next); setTerm(null);
      if (next.length === terms.length) onDone();
    } else { setWrong(m); setTimeout(() => setWrong(null), 500); }
  };
  const cell = "w-full rounded-xl border p-3 text-left text-sm transition";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ul className="space-y-2" aria-label="Terms">
        {terms.map((t, k) => (
          <li key={t.translit}>
            <button type="button" disabled={paired.includes(k)} aria-pressed={term === k} onClick={() => setTerm(k)}
              className={cn(cell, "hover:bg-accent", term === k && "ring-foreground ring-2", paired.includes(k) && "border-emerald-600 bg-emerald-50 opacity-70 dark:bg-emerald-950/40")}>
              <span className="font-serif text-base">{t.greek}</span> <span className="text-muted-foreground italic">{t.translit}</span>
            </button>
          </li>
        ))}
      </ul>
      <ul className="space-y-2" aria-label="Meanings">
        {meanings.map((m) => (
          <li key={m}>
            <button type="button" disabled={paired.includes(m)} onClick={() => pick(m)}
              className={cn(cell, term !== null && "hover:bg-accent", paired.includes(m) && "border-emerald-600 bg-emerald-50 opacity-70 dark:bg-emerald-950/40", wrong === m && "animate-pulse border-rose-600 bg-rose-50 dark:bg-rose-950/40")}>
              <span className="font-medium">{terms[m]!.english}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
