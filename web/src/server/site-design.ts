// A personal site's design, made with the Virtu editor on the site itself (Torian, 2026-11-18 23:45Z; Virtu's
// docs/design/EDITOR.md). The site's system is packages/virtu/site: color roles and type, three contrast rules. Reflect
// stores only the owner's edits to it (site.design, migration 0061) and runs Virtu's engine on them: every page of the
// site gets the CSS the edits make, and a save is refused unless Virtu's check passes on the edited system.
// Since 2026-11-19 the design also holds the site's look (Torian: modular radius styles, frames, animations, seasons):
// a shape, an ornament per slot (virtu-slot-card on post rows, virtu-slot-avatar on the photo) and a season calendar,
// picked from the catalog in packages/virtu/site/{shapes,ornaments,seasons} and checked with the tokens. site.design
// is then {edits, looks}; an older row is the edits list alone.
import { db } from "@/db/pool";
import { previewCss } from "@reflect/virtu/build";
import { applyEdits, previewEdits, type EditorEdit, type EditorState } from "@reflect/virtu/editor";
import { seasonOn } from "@reflect/virtu/calendar";
import { lookCss, lookJson, NO_LOOK, readLookChoice, type LookCatalog, type LookChoice } from "@reflect/virtu/looks";
import type { Json, Loaded } from "@reflect/virtu/model";
import snapshot from "../../../packages/virtu/site/site.loaded.json";
import looksSnapshot from "../../../packages/virtu/site/looks.loaded.json";

const SYSTEM = snapshot as unknown as Loaded;
const CATALOG = looksSnapshot as unknown as LookCatalog;
/** Seasons turn over on the owner's calendar; Reflect's people are in Austin for now. */
const SEASON_TIME_ZONE = "America/Chicago";

export type DesignState = EditorState & { saved?: boolean; written?: string[]; why?: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** The edits in a request or a stored row, or an error. Context is always null: the site system has no contexts. */
export function readEdits(value: unknown): { ok: true; edits: EditorEdit[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: false, error: "edits must be a list" };
  if (value.length > 200) return { ok: false, error: "too many edits" };
  const edits: EditorEdit[] = [];
  for (const e of value) {
    if (!isObj(e) || typeof e.token !== "string" || !("value" in e)) return { ok: false, error: "each edit needs a token and a value" };
    edits.push({ token: e.token, context: null, value: (e.value ?? null) as Json });
  }
  return { ok: true, edits };
}

/** One edit per token, the last one, in the order first made. */
export function compact(edits: EditorEdit[]): EditorEdit[] {
  const last = new Map<string, EditorEdit>();
  for (const e of edits) last.set(e.token, e);
  return [...last.values()];
}

/** A stored design: the edits list (rows saved before looks) or {edits, looks}. */
export function readDesign(value: unknown): { edits: EditorEdit[]; looks: LookChoice } {
  const raw = isObj(value) ? value : { edits: value };
  const edits = readEdits(raw.edits ?? []);
  const looks = readLookChoice((raw.looks ?? null) as Json);
  return { edits: edits.ok ? edits.edits : [], looks: looks.ok ? looks.choice : NO_LOOK };
}

async function storedDesign(userId: string): Promise<{ edits: EditorEdit[]; looks: LookChoice }> {
  const r = (await db().query("SELECT design FROM site WHERE user_id = $1", [userId])).rows[0];
  return readDesign(r?.design ?? []);
}

/** The owner's saved edits. */
export async function designOf(userId: string): Promise<EditorEdit[]> {
  return (await storedDesign(userId)).edits;
}

/** The owner's saved look. */
export async function lookOf(userId: string): Promise<LookChoice> {
  return (await storedDesign(userId)).looks;
}

const looksFor = (choice: LookChoice) => ({ catalog: CATALOG, choice, timeZone: SEASON_TIME_ZONE });

/** The site's CSS (Virtu's --virtu- properties for the saved design, then its look) and today's season for data-virtu-season. */
export async function siteDesign(userId: string): Promise<{ css: string; season: string | null }> {
  const d = await storedDesign(userId);
  const loaded = applyEdits(SYSTEM, d.edits).loaded;
  const tokens = previewCss(loaded) ?? "";
  const calendar = CATALOG.seasons.find((s) => s.name === d.looks.season);
  const season = calendar === undefined ? null : (seasonOn(calendar.seasons, new Date(), SEASON_TIME_ZONE)?.name ?? null);
  return { css: [tokens, lookCss(CATALOG, d.looks)].filter(Boolean).join("\n"), season };
}

/** The site's CSS: Virtu's --virtu- properties for the saved design, and its look. */
export async function siteCss(userId: string): Promise<string> {
  return (await siteDesign(userId)).css;
}

/** The editor's state for the saved design plus unsaved edits, and the saved look or the one being tried. */
export async function designState(userId: string, extra: EditorEdit[] = [], looks?: LookChoice): Promise<DesignState> {
  const d = await storedDesign(userId);
  return previewEdits(SYSTEM, [...d.edits, ...extra], looksFor(looks ?? d.looks));
}

/** Saves the edits on top of the saved design, and the look when one is given, only when Virtu's check passes and nothing was refused. */
export async function saveDesign(userId: string, extra: EditorEdit[], looks?: LookChoice): Promise<DesignState> {
  const before = await storedDesign(userId);
  const next = compact([...before.edits, ...extra]);
  const look = looks ?? before.looks;
  const state = previewEdits(SYSTEM, next, looksFor(look));
  if (state.refused.length > 0 || (state.looks?.refused.length ?? 0) > 0) return { ...state, saved: false, why: "A change was not applied, so nothing was saved." };
  if (state.verdict === "fail") return { ...state, saved: false, why: "Fix what fails first; nothing was saved." };
  await setDesign(userId, next, look);
  return { ...state, saved: true, written: ["your site"] };
}

/** Replaces the saved design; the look stays as it is unless one is given. Used by saveDesign and to undo a change from Ask Reflect. */
export async function setDesign(userId: string, edits: EditorEdit[], looks?: LookChoice): Promise<void> {
  const look = looks ?? (await lookOf(userId));
  await db().query(
    "INSERT INTO site (user_id, design) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO UPDATE SET design = EXCLUDED.design, updated_at = now()",
    [userId, JSON.stringify({ edits, looks: lookJson(look) })],
  );
}
