// A personal site's design, made with the Virtu editor on the site itself (Torian, 2026-11-18 23:45Z; Virtu's
// docs/design/EDITOR.md). The site's system is packages/virtu/site: color roles and type, three contrast rules. Reflect
// stores only the owner's edits to it (site.design, migration 0061) and runs Virtu's engine on them: every page of the
// site gets the CSS the edits make, and a save is refused unless Virtu's check passes on the edited system.
import { db } from "@/db/pool";
import { previewCss } from "@reflect/virtu/build";
import { applyEdits, previewEdits, type EditorEdit, type EditorState } from "@reflect/virtu/editor";
import type { Json, Loaded } from "@reflect/virtu/model";
import snapshot from "../../../packages/virtu/site/site.loaded.json";

const SYSTEM = snapshot as unknown as Loaded;

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

/** The owner's saved edits. */
export async function designOf(userId: string): Promise<EditorEdit[]> {
  const r = (await db().query("SELECT design FROM site WHERE user_id = $1", [userId])).rows[0];
  const read = readEdits(r?.design ?? []);
  return read.ok ? read.edits : [];
}

/** The site's CSS: Virtu's --virtu- properties for the saved design. */
export async function siteCss(userId: string): Promise<string> {
  return previewCss(applyEdits(SYSTEM, await designOf(userId)).loaded) ?? "";
}

/** The editor's state for the saved design plus unsaved edits. */
export async function designState(userId: string, extra: EditorEdit[] = []): Promise<DesignState> {
  return previewEdits(SYSTEM, [...(await designOf(userId)), ...extra]);
}

/** Saves the edits on top of the saved design, only when Virtu's check passes and no edit was refused. */
export async function saveDesign(userId: string, extra: EditorEdit[]): Promise<DesignState> {
  const before = await designOf(userId);
  const next = compact([...before, ...extra]);
  const state = previewEdits(SYSTEM, next);
  if (state.refused.length > 0) return { ...state, saved: false, why: "A change was not applied, so nothing was saved." };
  if (state.verdict === "fail") return { ...state, saved: false, why: "Fix what fails first; nothing was saved." };
  await setDesign(userId, next);
  return { ...state, saved: true, written: ["your site"] };
}

/** Replaces the saved design. Used by saveDesign and to undo a change from Ask Reflect. */
export async function setDesign(userId: string, edits: EditorEdit[]): Promise<void> {
  await db().query(
    "INSERT INTO site (user_id, design) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO UPDATE SET design = EXCLUDED.design, updated_at = now()",
    [userId, JSON.stringify(edits)],
  );
}
