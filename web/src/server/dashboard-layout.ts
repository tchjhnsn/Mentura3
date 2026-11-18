// The person's dashboard layout (Dashboard, 2026-11-18; migration 0055): for each card id in DASH_CARDS
// (../app/dashboard/cards/index.ts), its place in the order, whether it is hidden and its size. One row per person in
// `dashboard_layout`, the layout as JSON. No row means the default: every card in DASH_CARDS order, none hidden, each
// its default size.
//
// For the layout builder and anyone else: read with `layoutOf(userId)`, change with `setLayout(userId, changes)`, and
// lay the cards out with `arrange(cards, layout)`. The rules (applyChanges, arrange, readLayout) are pure, so they are
// tested without a database. Ask Reflect changes the layout through the registry (./actions/dashboard.ts), which also
// puts a layout back on Undo with `putLayout`.
import { db } from "@/db/pool";

export const CARD_SIZES = ["small", "medium", "large"] as const;
export type CardSize = (typeof CARD_SIZES)[number];

/**
 * A person's layout. `order` lists card ids in the order the person set; ids not in it (a card added since) come
 * after, in DASH_CARDS order. `hidden` are cards not shown. `sizes` holds only sizes the person set.
 */
export type DashLayout = { order: string[]; hidden: string[]; sizes: Record<string, CardSize> };

/**
 * One change to one card. `hidden` shows or hides it; `size` sets its size (null puts back the default); `to` moves it:
 * "top" or "bottom", a position counted from 0 in the order as shown, or `{ before }` / `{ after }` another card's id.
 */
export type LayoutChange = {
  id: string;
  hidden?: boolean;
  size?: CardSize | null;
  to?: "top" | "bottom" | number | { before: string } | { after: string };
};

export const EMPTY_LAYOUT: DashLayout = { order: [], hidden: [], sizes: {} };

const isSize = (v: unknown): v is CardSize => typeof v === "string" && (CARD_SIZES as readonly string[]).includes(v);
const ids = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 60))] : []);

/** A layout from stored JSON, dropping anything that is not one. */
export function readLayout(v: unknown): DashLayout {
  if (!v || typeof v !== "object") return { ...EMPTY_LAYOUT, sizes: {} };
  const o = v as Record<string, unknown>;
  const sizes: Record<string, CardSize> = {};
  if (o.sizes && typeof o.sizes === "object") for (const [k, s] of Object.entries(o.sizes as Record<string, unknown>)) if (isSize(s)) sizes[k] = s;
  return { order: ids(o.order), hidden: ids(o.hidden), sizes };
}

/** Every known card id in the person's order: their order first (known ids only), then the rest in default order. */
export function orderOf(known: readonly string[], layout: DashLayout): string[] {
  const set = new Set(known);
  const mine = layout.order.filter((id) => set.has(id));
  const seen = new Set(mine);
  return [...mine, ...known.filter((id) => !seen.has(id))];
}

/**
 * Applies changes in turn to a layout, for the cards `known` (DASH_CARDS ids in default order). Throws, naming the id,
 * when a change is for a card that does not exist, so nothing is half applied. The order kept is always whole.
 */
export function applyChanges(layout: DashLayout, changes: readonly LayoutChange[], known: readonly string[]): DashLayout {
  const set = new Set(known);
  let order = orderOf(known, layout);
  const hidden = new Set(layout.hidden.filter((id) => set.has(id)));
  const sizes: Record<string, CardSize> = Object.fromEntries(Object.entries(layout.sizes).filter(([id]) => set.has(id)));
  for (const c of changes) {
    if (!set.has(c.id)) throw new Error(`There is no dashboard card "${c.id}". The cards are: ${known.join(", ")}.`);
    if (c.hidden === true) hidden.add(c.id);
    if (c.hidden === false) hidden.delete(c.id);
    if (c.size === null) delete sizes[c.id];
    else if (c.size !== undefined) sizes[c.id] = c.size;
    if (c.to !== undefined) {
      const rest = order.filter((id) => id !== c.id);
      let at: number;
      if (c.to === "top") at = 0;
      else if (c.to === "bottom") at = rest.length;
      else if (typeof c.to === "number") at = Math.max(0, Math.min(rest.length, Math.floor(c.to)));
      else {
        const other = "before" in c.to ? c.to.before : c.to.after;
        const i = rest.indexOf(other);
        if (i < 0) throw new Error(`There is no dashboard card "${other}" to move it next to.`);
        at = "before" in c.to ? i : i + 1;
      }
      order = [...rest.slice(0, at), c.id, ...rest.slice(at)];
    }
  }
  return { order, hidden: known.filter((id) => hidden.has(id)), sizes };
}

/** The cards to show, in the person's order, hidden ones left out, each with its size (the card's own default when unset). */
export function arrange<C extends { id: string; size?: CardSize }>(cards: readonly C[], layout: DashLayout): (C & { size: CardSize })[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const hidden = new Set(layout.hidden);
  return orderOf(cards.map((c) => c.id), layout)
    .filter((id) => !hidden.has(id))
    .map((id) => {
      const c = byId.get(id)!;
      return { ...c, size: layout.sizes[id] ?? c.size ?? "medium" };
    });
}

/** The person's layout; the default (empty) when they never changed it or it cannot be read. */
export async function layoutOf(userId: string): Promise<DashLayout> {
  const r = await db().query("SELECT layout FROM dashboard_layout WHERE user_id = $1", [userId]);
  return readLayout(r.rows[0]?.layout);
}

/** Writes a whole layout, as Undo does. */
export async function putLayout(userId: string, layout: DashLayout): Promise<void> {
  await db().query(
    "INSERT INTO dashboard_layout (user_id, layout) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET layout = $2, updated_at = now()",
    [userId, JSON.stringify(readLayout(layout))],
  );
}

/** Every card the dashboard has, in default order: DASH_CARDS, read when asked so this module does not load the cards. */
export async function dashCards(): Promise<{ id: string; title: string; column: "main" | "side" }[]> {
  const { DASH_CARDS } = await import("@/app/dashboard/cards");
  return DASH_CARDS.map(({ id, title, column }) => ({ id, title, column }));
}

/**
 * Applies changes to the person's layout and keeps it; returns the layout before and after. `known` is the card ids in
 * default order, read from DASH_CARDS when left out. A change for a card that does not exist throws and keeps nothing.
 */
export async function setLayout(userId: string, changes: readonly LayoutChange[], known?: readonly string[]): Promise<{ before: DashLayout; after: DashLayout }> {
  const cardIds = known ?? (await dashCards()).map((c) => c.id);
  const before = await layoutOf(userId);
  const after = applyChanges(before, changes, cardIds);
  await putLayout(userId, after);
  return { before, after };
}
