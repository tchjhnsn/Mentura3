// Food's spending (doc "Food design guide", revision 2): receipts the person adds, read by a model and confirmed by
// them, split into groceries and eating out; this month against what they set aside for food; and an estimate for
// the next grocery run from the prices on their own receipts. Pure: no I/O.
import type { ListItem } from "./meals";

export type SpendKind = "groceries" | "eating-out";
export type ReceiptLine = { name: string; price: number };
export type Receipt = { id: string; store: string; day: string; total: number; kind: SpendKind; items: ReceiptLine[]; confirmed: boolean };

export const SPEND_KINDS: readonly { id: SpendKind; label: string }[] = [{ id: "groceries", label: "Groceries" }, { id: "eating-out", label: "Eating out" }];

const OUT = /restaurant|cafe|café|coffee|grill|pizza|burger|diner|kitchen|bistro|tavern|bar\b|pub\b|bbq|barbecue|taqueria|sushi|wings|mcdonald|chick-fil-a|taco bell|starbucks|wendy|subway|chipotle|popeyes|domino|whataburger|sonic|dunkin|panera|kfc|arby|jack in the box|five guys|shake shack|doordash|uber eats|grubhub/i;
/** Groceries or eating out, guessed from the store's name; the person changes it with a tap. */
export const guessKind = (store: string): SpendKind => (OUT.test(store) ? "eating-out" : "groceries");

/** A receipt's lines as kept on its record: one a line, "name | price". */
export const linesText = (items: readonly ReceiptLine[]): string => items.map((i) => `${i.name.replace(/\|/g, "/")} | ${i.price.toFixed(2)}`).join("\n");
export function parseLines(text: string): ReceiptLine[] {
  return text.split(/\r?\n/).map((l) => { const m = /^(.+?)\s*\|\s*(-?\d+(?:\.\d+)?)$/.exec(l.trim()); return m ? { name: m[1]!.trim(), price: Number(m[2]) } : null; }).filter((x): x is ReceiptLine => x !== null);
}

const money = (v: unknown): number | null => { if (v === undefined || v === null || v === "") return null; const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[$,\s]/g, "")); return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : null; };

/**
 * What a model read from a receipt, as JSON somewhere in its answer: store, date, total and lines. Anything it could
 * not read is left out; a receipt with no total takes the sum of its lines.
 */
export function parseRead(text: string, today: string): { store: string; day: string; total: number; items: ReceiptLine[] } | null {
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return null;
  let j: Record<string, unknown>;
  try { j = JSON.parse(m[0]) as Record<string, unknown>; } catch { return null; }
  const items = (Array.isArray(j.items) ? j.items : []).map((x) => { const o = (x ?? {}) as Record<string, unknown>; const price = money(o.price); const name = String(o.name ?? "").trim().slice(0, 80); return name && price !== null ? { name, price } : null; }).filter((x): x is ReceiptLine => x !== null).slice(0, 200);
  const day = typeof j.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(j.date) && j.date <= today ? j.date : today;
  const total = money(j.total) ?? Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100;
  const store = String(j.store ?? "").trim().slice(0, 80) || "A store";
  if (!total && !items.length) return null;
  return { store, day, total, items };
}

/** What was spent on food in a month ("2026-11"), from confirmed receipts. */
export function monthSpend(receipts: readonly Receipt[], month: string): { groceries: number; eatingOut: number; total: number; count: number } {
  const r = receipts.filter((x) => x.confirmed && x.day.startsWith(month));
  const sum = (k: SpendKind) => Math.round(r.filter((x) => x.kind === k).reduce((s, x) => s + x.total, 0) * 100) / 100;
  const groceries = sum("groceries"), eatingOut = sum("eating-out");
  return { groceries, eatingOut, total: Math.round((groceries + eatingOut) * 100) / 100, count: r.length };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 2).map((w) => w.replace(/(es|s)$/, "")).join(" ");

/** The latest price paid for each thing on the person's grocery receipts. */
export function priceBook(receipts: readonly Receipt[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of [...receipts].filter((x) => x.confirmed && x.kind === "groceries").sort((a, b) => a.day.localeCompare(b.day))) for (const i of r.items) if (i.price > 0) out.set(norm(i.name), i.price);
  return out;
}

/** A list item's price from the book: the line whose words hold the item's words, or the other way round. */
function priceOf(name: string, book: Map<string, number>): number | null {
  const n = norm(name);
  if (!n) return null;
  if (book.has(n)) return book.get(n)!;
  const words = n.split(" ");
  for (const [k, v] of book) { const kw = k.split(" "); if (words.every((w) => kw.includes(w)) || (kw.length && kw.every((w) => words.includes(w)))) return v; }
  return null;
}

/** An estimate for a shopping list from past prices: the total of the items with a price, and how many had one. */
export function estimate(list: readonly ListItem[], book: Map<string, number>): { total: number; priced: number; items: number } {
  let total = 0, priced = 0;
  for (const i of list) { const p = priceOf(i.name, book); if (p !== null) { total += p; priced++; } }
  return { total: Math.round(total * 100) / 100, priced, items: list.length };
}
