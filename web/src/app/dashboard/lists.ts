// The dashboard's list logic, pure so it can be tested: folding repeated calendar items into one line, folding
// planned meals into one Food line, choosing which events to show, and keeping one of each chat title.

/** A calendar item as the Today card reads it (an agenda line from `@reflect/core/calendar`). */
export type DayItem = { id: string; day: string; title: string; when: string; starts: string | null; tile: string | null; href: string };

/** One line of the Today list: an item on its own, or several alike shown once with how many there are. */
export type DayLine<T extends DayItem> = { kind: "one"; item: T } | { kind: "group"; key: string; label: string; count: number; first: T; items: T[] };

// Long runs of digits and long hex or uuid-like tokens are ids, not words a person wrote.
const ID_TOKEN = /\b(?:\d{4,}|[0-9a-f]{8,}(?:-[0-9a-f]{4,})*)\b/gi;

/** What makes two titles alike: the title in lower case with every digit and id-like token taken out. */
export function repeatKey(title: string): string {
  return title.toLowerCase().replace(ID_TOKEN, " ").replace(/\d+/g, " ").replace(/[^\p{L}\s]+/gu, " ").replace(/\s+/g, " ").trim();
}

/** A group's title: the first item's title without its ids. */
export function repeatLabel(title: string): string {
  const t = title.replace(ID_TOKEN, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
  return t || title;
}

/**
 * Whether two keys are alike: the same, or the same number of words (three or more) differing in one place, as test
 * runs on a phone and a desktop leave "renew a permit phone due" beside "renew a permit desktop due".
 */
export function alikeKeys(a: string, b: string): boolean {
  if (a === b) return true;
  const x = a.split(" "), y = b.split(" ");
  if (x.length !== y.length || x.length < 3) return false;
  return x.filter((w, i) => w !== y[i]).length <= 1;
}

/** The words every title shares in place, once ids are out: "Renew a permit due" from the phone and desktop ones. */
function sharedLabel(titles: readonly string[]): string {
  const first = repeatLabel(titles[0]!);
  const words = titles.map((t) => repeatLabel(t).split(" "));
  if (words.some((w) => w.length !== words[0]!.length)) return first;
  const kept = words[0]!.filter((w, i) => words.every((x) => x[i]!.toLowerCase() === w.toLowerCase()));
  return kept.length >= 2 ? kept.join(" ") : first;
}

/**
 * Folds items that are alike (the same day and tile, and titles that match once digits and ids are taken out, or
 * differ in one word of three or more) into one line, at the place of the first of them. `min` is how many alike it
 * takes to fold; fewer stay as they are.
 */
export function groupRepeats<T extends DayItem>(items: readonly T[], min = 2): DayLine<T>[] {
  const clusters: { scope: string; key: string; items: T[] }[] = [];
  const of = new Map<T, (typeof clusters)[number]>();
  for (const e of items) {
    const scope = `${e.day}|${e.tile ?? ""}`;
    const key = repeatKey(e.title);
    let c = key ? clusters.find((x) => x.scope === scope && alikeKeys(x.key, key)) : undefined;
    if (!c) { c = { scope, key, items: [] }; clusters.push(c); }
    c.items.push(e);
    of.set(e, c);
  }
  const out: DayLine<T>[] = [];
  const done = new Set<(typeof clusters)[number]>();
  for (const e of items) {
    const c = of.get(e)!;
    if (c.items.length < min || !c.key) { out.push({ kind: "one", item: e }); continue; }
    if (done.has(c)) continue;
    done.add(c);
    out.push({ kind: "group", key: `${c.scope}|${c.key}`, label: sharedLabel(c.items.map((x) => x.title)), count: c.items.length, first: e, items: c.items });
  }
  return out;
}

/** What the store keeps for a calendar event, enough to tell a planned meal. */
export type StoredEvent = { id: string; tile: string | null; recordId: string | null };

/**
 * A planned meal: Food puts a meal on a day as the person's own event on the Home tile pointing at the meal record
 * (`server/meals-store.ts` planMeal). Events made from a record's own date have ids starting `record:` and are not meals.
 */
export const isMealEvent = (e: StoredEvent) => e.tile === "home" && !!e.recordId && !e.id.startsWith("record:");

/** The one Food line for a day's planned meals: the meal by name, or how many with their names. */
export function mealLine(names: readonly string[]): { title: string; detail: string } | null {
  const list = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!names.length) return null;
  if (list.length <= 1) return { title: list[0] ?? "A meal planned", detail: names.length > 1 ? `${names.length} meals planned` : "Meal planned" };
  return { title: `${names.length} meals planned`, detail: list.join(", ") };
}

/** An event as the Events card reads it. */
export type DatedEvent = { id: string; startsAt: string | null };

/**
 * The events worth showing now: none that started more than a day ago (a festival that began days before), those
 * starting from now first in order, then any that started within the last day and still run.
 */
export function pickEvents<T extends DatedEvent>(list: readonly T[], now: Date, n: number): T[] {
  const t = now.getTime();
  const at = (e: T) => (e.startsAt ? Date.parse(e.startsAt) : NaN);
  const kept = list.filter((e) => Number.isFinite(at(e)) && at(e) >= t - 86400_000);
  const ahead = kept.filter((e) => at(e) >= t).sort((a, b) => at(a) - at(b));
  const running = kept.filter((e) => at(e) < t).sort((a, b) => at(b) - at(a));
  return [...ahead, ...running].slice(0, n);
}

/** The first `n` chats with different titles (ignoring case and spacing), newest first as given. */
export function distinctChats<T extends { title: string }>(chats: readonly T[], n: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const c of chats) {
    const k = c.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= n) break;
  }
  return out;
}
