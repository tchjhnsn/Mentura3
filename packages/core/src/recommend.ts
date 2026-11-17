/**
 * Scholē's one ranker (doc "Scholē subjects by ICP and recommendations", How the ranker works). Home, Browse's For you
 * and Up next all call it, so they agree. It ranks what people chose (playlists and the books exemplars name) by what
 * the person wants to become and by what they did, gives every pick one reason line, and never uses popularity or
 * what other people watch. Pure: no I/O.
 */
import { COLLECTIONS, itemKey, servedAim, type Collection, type CollectionItem } from "./collections";
import { EXEMPLARS, traitById, traitsWanted, type Admired } from "./formation";

/** Points for each signal. A first guess, kept here so it can be tuned in one place. */
export const WEIGHTS = { aim: 5, trait: 5, source: 6, follow: 3, finished: 3, kept: 2, liked: 2 } as const;

export type Signals = {
  /** What the person wants in Work, by name ("Teacher", "Electrician"). */
  aims: readonly string[];
  /** People they keep as inspirations, with the traits they chose. */
  admired: readonly Admired[];
  /** Names of people they follow, any case. */
  follows: readonly string[];
  /** Collection keys (`itemKey`) of what they keep in their Library, and of what they finished. */
  kept: ReadonlySet<string>;
  finished: ReadonlySet<string>;
  /** Keys they like and dislike: an item's `itemKey`, its link, or "medium|title" (the reaction key). */
  liked: ReadonlySet<string>;
  disliked: ReadonlySet<string>;
  /** LibriVox ids in the editors' canon: the tie-break. */
  canon?: ReadonlySet<string>;
};

export type Pick = { item: CollectionItem; reason: string; score: number; collection: Collection | null };

/** Every key a thing may be known by: its collection key, its link, and the reaction key "medium|title". */
export function keysOf(i: CollectionItem): string[] {
  const medium = i.kind === "find" ? i.medium : i.kind;
  const keys = [itemKey(i), `${medium}|${i.title.trim().toLowerCase()}`];
  if (i.kind === "find" && i.url) keys.push(i.url);
  if (i.kind === "course") keys.push(i.url);
  return keys;
}

const hasAny = (set: ReadonlySet<string>, i: CollectionItem) => keysOf(i).some((k) => set.has(k));

type Reason = { points: number; line: string };

/**
 * Ranks what people chose for this person. Finished, kept and disliked things leave the list; the rest is scored by the signals, ties broken by the editors' canon, then mixed so a new
 * playlist follows each one the person already knows. Things with no reason are left out: with no signals at all the
 * list is empty and the page shows the editors' rows instead.
 */
export function recommend(s: Signals, all: readonly Collection[] = COLLECTIONS, max = 24): Pick[] {
  const follows = s.follows.map((f) => f.trim().toLowerCase()).filter(Boolean);
  const traits = traitsWanted(s.admired);
  const best = new Map<string, Pick>();
  const consider = (item: CollectionItem, collection: Collection | null, reasons: Reason[]) => {
    if (!reasons.length || hasAny(s.finished, item) || hasAny(s.kept, item) || hasAny(s.disliked, item)) return;
    const score = reasons.reduce((n, r) => n + r.points, 0);
    const top = [...reasons].sort((a, b) => b.points - a.points)[0]!;
    const k = itemKey(item);
    const had = best.get(k);
    if (!had || score > had.score) best.set(k, { item, reason: top.line, score, collection });
  };

  // The books where the people they admire name the traits they chose come first: the source itself.
  for (const a of s.admired) {
    const e = EXEMPLARS.find((x) => x.id === a.exemplar);
    if (!e || !a.traits.length) continue;
    const named = e.traits.filter((t) => a.traits.includes(t.trait));
    if (named.length) consider(e.book, null, [{ points: WEIGHTS.source, line: `Where ${e.name} names ${traitById(named[0]!.trait)!.name.toLowerCase()}` }]);
  }

  for (const c of all) {
    const items = c.items;
    const aim = servedAim(c, s.aims);
    const trait = traits.find((t) => t.trait.playlists.includes(c.id));
    const finished = items.find((i) => hasAny(s.finished, i));
    const kept = items.find((i) => hasAny(s.kept, i));
    const liked = items.find((i) => hasAny(s.liked, i));
    for (const i of items) {
      const r: Reason[] = [];
      if (aim) r.push({ points: WEIGHTS.aim, line: `For your aim: ${aim}` });
      if (trait) r.push({ points: WEIGHTS.trait - trait.trait.playlists.indexOf(c.id), line: `For ${trait.trait.name.toLowerCase()}, as ${trait.from.name} practised it` });
      const by = i.by.toLowerCase();
      const followed = follows.find((f) => by.includes(f));
      if (followed) r.push({ points: WEIGHTS.follow, line: `Because you follow ${i.by}` });
      if (finished) r.push({ points: WEIGHTS.finished, line: `You finished ${finished.title}` });
      if (kept) r.push({ points: WEIGHTS.kept, line: `Like ${kept.title} in your Library` });
      if (liked) r.push({ points: WEIGHTS.liked, line: `You liked ${liked.title}` });
      consider(i, c, r);
    }
  }

  const canon = s.canon ?? new Set<string>();
  const inCanon = (p: Pick) => (p.item.kind === "audiobook" && canon.has(p.item.id) ? 1 : 0);
  // Order within a playlist is kept: a playlist is a path, so its earlier items rank first on a tie.
  const order = new Map<string, number>();
  for (const c of all) c.items.forEach((i, n) => { if (!order.has(itemKey(i))) order.set(itemKey(i), n); });
  const ranked = [...best.values()].sort((a, b) => b.score - a.score || inCanon(b) - inCanon(a) || (order.get(itemKey(a.item)) ?? 0) - (order.get(itemKey(b.item)) ?? 0));
  return mix(ranked, s).slice(0, max);
}

/**
 * One from a playlist the person already knows for every one from a new playlist, so the list never narrows to what
 * they began, nor leaves it. Either side runs on alone when the other runs out.
 */
function mix(ranked: readonly Pick[], s: Signals): Pick[] {
  const knows = (p: Pick) => Boolean(p.collection?.items.some((i) => hasAny(s.kept, i) || hasAny(s.finished, i)));
  const known = ranked.filter(knows), fresh = ranked.filter((p) => !knows(p));
  if (!known.length || !fresh.length) return [...ranked];
  const out: Pick[] = [];
  while (known.length || fresh.length) {
    if (known.length) out.push(known.shift()!);
    if (fresh.length) out.push(fresh.shift()!);
  }
  return out;
}

/**
 * Up next on a watch page, re-ranked: what comes next in the playlist stays first (a playlist is a path), and after it
 * the things that serve the person move up, each with its reason; disliked things leave.
 */
export function rerank(next: readonly CollectionItem[], s: Signals): { item: CollectionItem; reason: string | null }[] {
  const picks = new Map(recommend(s, COLLECTIONS, 500).map((p) => [itemKey(p.item), p]));
  const kept = next.filter((i) => !hasAny(s.disliked, i));
  const [first, ...rest] = kept;
  if (!first) return [];
  return [{ item: first, reason: null }, ...rest
    .map((item, n) => ({ item, n, p: picks.get(itemKey(item)) }))
    .sort((a, b) => (b.p?.score ?? 0) - (a.p?.score ?? 0) || a.n - b.n)
    .map(({ item, p }) => ({ item, reason: p?.reason ?? null }))];
}
