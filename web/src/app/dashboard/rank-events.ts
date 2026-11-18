// Ranks Austin's events for the person on the dashboard: by what they said they care about and by the people they
// know who are going. Pure, so it is tested on its own; the Events card fetches what it reads.

export type RankableEvent = { id: string; title: string; description: string | null; tags: readonly string[]; forWhom: string | null; startsAt: string | null };
export type KnownPerson = { id: string; name: string; image: string | null };
export type Ranked<E> = { event: E; score: number; matched: string[]; known: KnownPerson[] };

/** Points for each thing that lifts an event: a known person going counts more than a matched interest. */
export const WEIGHT = { person: 3, phrase: 2, word: 1 } as const;

const STOP = new Set(["and", "the", "for", "with", "from", "into", "about", "your", "this", "that", "what", "more", "less", "over", "they", "them", "their", "life", "things", "stuff"]);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * The person's interests as words to look for: each phrase once (profile interests, followed topic ids such as
 * "ancient-philosophy", venture names), dropping blanks and repeats.
 */
export function interestTerms(sources: readonly (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const s of sources) {
    const t = s ? norm(s) : "";
    if (t.length >= 3 && !out.includes(t)) out.push(t);
  }
  return out;
}

/** What an interest phrase matches in an event's words: the whole phrase, or failing that its longer words. */
function matchOf(term: string, hay: string): { kind: "phrase" | "word"; words: string[] } | null {
  if (` ${hay} `.includes(` ${term} `)) return { kind: "phrase", words: [term] };
  const words = term.split(" ").filter((w) => w.length >= 4 && !STOP.has(w) && ` ${hay} `.includes(` ${w} `));
  return words.length ? { kind: "word", words } : null;
}

/**
 * Orders events by score (people they know going, then interests matched), soonest first among equals. An event
 * with nothing in its favour keeps its place by time, so the list is never empty when there are events.
 */
export function rankEvents<E extends RankableEvent>(events: readonly E[], terms: readonly string[], known: ReadonlyMap<string, readonly KnownPerson[]>): Ranked<E>[] {
  const ranked = events.map((event) => {
    const hay = norm([event.title, event.description ?? "", event.forWhom ?? "", ...event.tags].join(" "));
    const people = [...(known.get(event.id) ?? [])];
    const matched: string[] = [];
    let score = people.length * WEIGHT.person;
    for (const t of terms) {
      const m = matchOf(t, hay);
      if (!m) continue;
      score += m.kind === "phrase" ? WEIGHT.phrase : WEIGHT.word;
      matched.push(t);
    }
    return { event, score, matched, known: people };
  });
  const at = (e: RankableEvent) => (e.startsAt ? Date.parse(e.startsAt) : Infinity);
  return ranked.sort((a, b) => b.score - a.score || at(a.event) - at(b.event));
}

/** Why an event is shown, in a few words: who is going, then what it matches. */
export function whyLine(r: Pick<Ranked<RankableEvent>, "matched" | "known">): string {
  const parts: string[] = [];
  if (r.known.length === 1) parts.push(`${r.known[0]!.name} is going`);
  else if (r.known.length > 1) parts.push(`${r.known[0]!.name} and ${r.known.length - 1} ${r.known.length === 2 ? "other" : "others"} going`);
  if (r.matched.length) parts.push(`for your interest in ${r.matched.slice(0, 2).join(" and ")}`);
  const line = parts.join(", ");
  return line ? line[0]!.toUpperCase() + line.slice(1) : "";
}
