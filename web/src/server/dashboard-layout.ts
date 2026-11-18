// The dashboard's layout per person (`dashboard_layout`, migration 0052): the order they set for its cards, the cards
// they hid and each card's size on a wide screen. An empty order means the dashboard orders its cards by urgency.
import { db } from "@/db/pool";

export type CardSize = "normal" | "wide";
export type DashLayout = { order: string[]; hidden: string[]; size: Record<string, CardSize> };
/** What setLayout changes: each part given replaces the kept one; a part left out stays as it is. */
export type LayoutChanges = Partial<DashLayout>;

export const EMPTY_LAYOUT: DashLayout = { order: [], hidden: [], size: {} };
const CARD_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MAX_CARDS = 60;

const ids = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && CARD_ID.test(x)))].slice(0, MAX_CARDS) : [];

/** A layout as kept or as a page sent it, made safe: card ids only, each once, sizes normal or wide. */
export function cleanLayout(raw: unknown): DashLayout {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const size: Record<string, CardSize> = {};
  if (o.size && typeof o.size === "object") {
    for (const [k, v] of Object.entries(o.size as Record<string, unknown>).slice(0, MAX_CARDS)) if (CARD_ID.test(k) && (v === "normal" || v === "wide")) size[k] = v;
  }
  return { order: ids(o.order), hidden: ids(o.hidden), size };
}

/** The person's layout; the empty layout when they never set one. */
export async function layoutOf(userId: string): Promise<DashLayout> {
  const r = await db().query("SELECT layout FROM dashboard_layout WHERE user_id = $1", [userId]);
  return cleanLayout(r.rows[0]?.layout);
}

/** Changes the person's layout and returns it as kept. */
export async function setLayout(userId: string, changes: LayoutChanges): Promise<DashLayout> {
  const next = cleanLayout({ ...(await layoutOf(userId)), ...changes });
  await db().query(
    `INSERT INTO dashboard_layout (user_id, layout) VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO UPDATE SET layout = EXCLUDED.layout, updated_at = now()`,
    [userId, JSON.stringify(next)],
  );
  return next;
}
