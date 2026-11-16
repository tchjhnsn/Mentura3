import { WORKS } from "@reflect/core/topic-pages";
import type { LearnItem } from "./ways-store";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|of|a|an)\b/g, " ").replace(/\s+/g, " ").trim();

/** The Scholē works among what the person keeps: by its recording, or by its title and author. */
export function keptWorks(items: readonly LearnItem[]): Set<string> {
  const out = new Set<string>();
  for (const i of items) {
    const ab = i.url ? /\/audiobooks\/(\d+)/.exec(i.url)?.[1] : undefined;
    const t = norm(i.title);
    for (const w of WORKS) {
      const wt = norm(w.title);
      const last = norm(w.by).split(" ").pop() ?? "";
      if ((ab && w.audiobooks.includes(ab)) || (wt && (t === wt || ` ${t} `.includes(` ${wt} `)) && (!i.by || !last || norm(i.by).includes(last)))) out.add(w.id);
    }
  }
  return out;
}
