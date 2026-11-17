// Home cards (Ask Reflect, 2026-11-17): small cards Ask Reflect places on Home for a time, like a vocabulary
// widget. Each belongs to a tile, shows from its start day through its end day, and is one of four kinds: a word
// (one a day from a list, or always the same one), a checklist, a figure, or a streak of days. At most three show
// at once, newest first. Pure: no I/O. The web app keeps each card as a hidden `card` life record in the home app
// (web/src/server/home-cards-store.ts).
import { GROUPS } from "./plan";

export const HOME_CARD_KINDS = ["word", "checklist", "figure", "streak"] as const;
export type HomeCardKind = (typeof HOME_CARD_KINDS)[number];

/** The tiles a card can belong to: Home's tiles, in Home's order. */
export const HOME_CARD_TILES: readonly string[] = GROUPS.flatMap((g) => g.tiles);
/** Cards shown on Home at once. */
export const MAX_SHOWN = 3;
/** How long a card shows when no end day is given, and the longest it may show. */
export const DEFAULT_DAYS = 30;
export const MAX_DAYS = 366;
/** Words a word card keeps, enough for two months of one a day. */
export const MAX_WORDS = 60;

/** A word and its meaning. `source` names a dictionary only when the model actually has one; it is never invented. */
export type WordEntry = { word: string; meaning: string; example?: string; source?: string };
export type ChecklistItem = { text: string; done: boolean };
export type CardContent =
  | { kind: "word"; words: WordEntry[] }
  | { kind: "checklist"; items: ChecklistItem[] }
  | { kind: "figure"; value: string; label: string; source?: string }
  | { kind: "streak"; label: string; days: string[] };

/** How a word card picks its word: `daily` shows one word a day from the list, rotating by date; null shows the first. */
export type Schedule = "daily" | null;

export type HomeCard = { id: string; tile: string; title: string; start: string; end: string; schedule: Schedule; content: CardContent; /** When it was placed, ISO. */ created: string };

const DAY_MS = 86400_000;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v: unknown): v is string => typeof v === "string" && DAY.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const at = (d: string) => Date.parse(`${d}T00:00:00Z`);
const plus = (d: string, n: number) => new Date(at(d) + n * DAY_MS).toISOString().slice(0, 10);
const daysFrom = (from: string, to: string) => Math.round((at(to) - at(from)) / DAY_MS);
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** One word entry cleaned, or null without both a word and a meaning. */
function cleanWord(v: unknown): WordEntry | null {
  const o = obj(v);
  const word = text(o.word, 80);
  const meaning = text(o.meaning, 400);
  if (!word || !meaning) return null;
  const example = text(o.example, 400);
  const source = text(o.source, 200);
  return { word, meaning, ...(example ? { example } : {}), ...(source ? { source } : {}) };
}

/** A card's content cleaned to its kind, or null when nothing of it is left. */
export function cleanContent(v: unknown): CardContent | null {
  const o = obj(v);
  if (o.kind === "word") {
    const words = (Array.isArray(o.words) ? o.words : []).map(cleanWord).filter((w): w is WordEntry => w !== null).slice(0, MAX_WORDS);
    return words.length ? { kind: "word", words } : null;
  }
  if (o.kind === "checklist") {
    const items = (Array.isArray(o.items) ? o.items : []).map((i) => {
      const t = text(typeof i === "string" ? i : obj(i).text, 140);
      return t ? { text: t, done: obj(i).done === true } : null;
    }).filter((i): i is ChecklistItem => i !== null).slice(0, 30);
    return items.length ? { kind: "checklist", items } : null;
  }
  if (o.kind === "figure") {
    const value = text(typeof o.value === "number" ? String(o.value) : o.value, 40);
    const label = text(o.label, 140);
    if (!value || !label) return null;
    const source = text(o.source, 200);
    return { kind: "figure", value, label, ...(source ? { source } : {}) };
  }
  if (o.kind === "streak") {
    const label = text(o.label, 140);
    if (!label) return null;
    const days = [...new Set((Array.isArray(o.days) ? o.days : []).filter(isDay))].sort().slice(-400);
    return { kind: "streak", label, days };
  }
  return null;
}

export type NewCard = { tile: string; title: string; content: unknown; start?: string; end?: string; schedule?: Schedule };

/**
 * A new card from what a model gave, or an error in words. It starts today unless a start is given, and ends
 * DEFAULT_DAYS later unless an end is given; it shows at most MAX_DAYS. Only a word card with more than one word
 * keeps a daily schedule.
 */
export function newCard(input: NewCard, today: string, id: string, created: string): HomeCard | { error: string } {
  if (!HOME_CARD_TILES.includes(input.tile)) return { error: `No such tile. Tiles: ${HOME_CARD_TILES.join(", ")}.` };
  const title = text(input.title, 80);
  if (!title) return { error: "Give the card a title." };
  const content = cleanContent(input.content);
  if (!content) return { error: "The card has nothing to show: a word needs a word and a meaning, a checklist an item, a figure a value and a label, a streak a label." };
  const start = input.start === undefined ? today : input.start;
  if (!isDay(start)) return { error: "Give the start as YYYY-MM-DD." };
  const end = input.end === undefined ? plus(start, DEFAULT_DAYS - 1) : input.end;
  if (!isDay(end)) return { error: "Give the end as YYYY-MM-DD." };
  if (end < start) return { error: "The end comes before the start." };
  if (end < today) return { error: "That card would already have ended." };
  if (daysFrom(start, end) >= MAX_DAYS) return { error: `A card shows at most ${MAX_DAYS} days.` };
  const schedule: Schedule = input.schedule === "daily" && content.kind === "word" && content.words.length > 1 ? "daily" : null;
  return { id, tile: input.tile, title, start, end, schedule, content, created };
}

/** A stored card read back, or null when it is not one (a stored card is trusted no more than input). */
export function readCard(v: unknown): HomeCard | null {
  const o = obj(v);
  const content = cleanContent(o.content);
  if (typeof o.id !== "string" || typeof o.tile !== "string" || !content || !isDay(o.start) || !isDay(o.end) || typeof o.created !== "string") return null;
  const title = text(o.title, 80);
  if (!title) return null;
  return { id: o.id, tile: o.tile, title, start: o.start, end: o.end, schedule: o.schedule === "daily" && content.kind === "word" ? "daily" : null, content, created: o.created };
}

/** Whether a card shows on a day: from its start through its end. */
export const showsOn = (c: HomeCard, today: string) => c.start <= today && today <= c.end;

/** The cards Home shows today: started and not ended, newest first, at most MAX_SHOWN. */
export function cardsToday(cards: readonly HomeCard[], today: string, max = MAX_SHOWN): HomeCard[] {
  return cards.filter((c) => showsOn(c, today)).sort((a, b) => b.created.localeCompare(a.created) || b.id.localeCompare(a.id)).slice(0, max);
}

/** Today's word from a list: with a daily schedule, one a day from the start, going round; otherwise the first. */
export function wordToday(words: readonly WordEntry[], start: string, today: string, schedule: Schedule = "daily"): WordEntry | null {
  if (!words.length) return null;
  if (schedule !== "daily") return words[0]!;
  const n = words.length;
  return words[(((daysFrom(start, today)) % n) + n) % n]!;
}

/** A card's word today, or null when it is not a word card. */
export const cardWord = (c: HomeCard, today: string) => (c.content.kind === "word" ? wordToday(c.content.words, c.start, today, c.schedule) : null);

/** A checklist card with one item done or undone; any other card, or an item that is not there, unchanged. */
export function toggleItem(c: HomeCard, index: number): HomeCard {
  if (c.content.kind !== "checklist" || !Number.isInteger(index) || index < 0 || index >= c.content.items.length) return c;
  return { ...c, content: { kind: "checklist", items: c.content.items.map((it, i) => (i === index ? { ...it, done: !it.done } : it)) } };
}

/** A streak card with today marked, or unmarked when it was; any other card unchanged. */
export function markToday(c: HomeCard, today: string): HomeCard {
  if (c.content.kind !== "streak") return c;
  const had = c.content.days.includes(today);
  return { ...c, content: { ...c.content, days: had ? c.content.days.filter((d) => d !== today) : [...c.content.days, today].sort() } };
}

/** Days in a row marked, ending today, or yesterday when today is not marked yet. */
export function streakOf(days: readonly string[], today: string): number {
  const set = new Set(days);
  let d = set.has(today) ? today : plus(today, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = plus(d, -1);
  }
  return n;
}

/** A card in one line of words, for the chat and MCP. */
export function cardSummary(c: HomeCard, today: string): string {
  const when = `${c.start} to ${c.end}`;
  const k = c.content;
  if (k.kind === "word") {
    const w = cardWord(c, today);
    return `${c.title} (word, ${c.tile}, ${when}${c.schedule ? `, one a day from ${k.words.length}` : ""}): ${w ? `${w.word}, ${w.meaning}${w.source ? ` (${w.source})` : ""}` : "no word"}`;
  }
  if (k.kind === "checklist") return `${c.title} (checklist, ${c.tile}, ${when}): ${k.items.map((i, n) => `${n}. [${i.done ? "x" : " "}] ${i.text}`).join("; ")}`;
  if (k.kind === "figure") return `${c.title} (figure, ${c.tile}, ${when}): ${k.value} ${k.label}${k.source ? ` (${k.source})` : ""}`;
  return `${c.title} (streak, ${c.tile}, ${when}): ${k.label}, ${streakOf(k.days, today)} days in a row`;
}

/** What a card shows, a line each: today's word with its meaning, example and source; the checklist; the figure; the streak. */
export function cardLines(c: HomeCard, today: string): string[] {
  const k = c.content;
  if (k.kind === "word") {
    const w = cardWord(c, today);
    return w ? [`${w.word}: ${w.meaning}`, ...(w.example ? [w.example] : []), ...(w.source ? [`Source: ${w.source}`] : [])] : [];
  }
  if (k.kind === "checklist") return k.items.map((i) => `${i.done ? "Done" : "To do"}: ${i.text}`);
  if (k.kind === "figure") return [`${k.value} ${k.label}`, ...(k.source ? [`Source: ${k.source}`] : [])];
  const n = streakOf(k.days, today);
  return [`${k.label}: ${n} ${n === 1 ? "day" : "days"} in a row`];
}
