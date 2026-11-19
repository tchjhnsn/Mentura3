// virtu editor, the I/O half: `virtu editor <dir> [--save]`. It reads one
// request from stdin, {"edits": [...]}, and prints the panel's state as JSON.
// With --save it writes the token files the edits change, and only after
// loading the system again with those files in place of the ones on disk and
// passing check, so what is written is exactly what was proved. A host (a
// route handler in development, a hosted site's server) runs this command, or
// calls editorRequest, and hands the JSON to the panel in src/editor/ui.ts.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEdits, editorState, fileText, previewEdits, type EditorEdit, type EditorLooks, type EditorState } from "./editor.ts";
import { isObject } from "./json.ts";
import { findOrnaments, findSeasons, findShapes, load, loadOrnaments, loadSeasons, loadShapes } from "./load.ts";
import { lookJson, readLookChoice, type LookCatalog, type LookChoice } from "./looks.ts";
import type { Json } from "./model.ts";
import { readAsset } from "./ornament.ts";

/** Where the package's own registry folders are: one level above this file, in src/ or dist/. */
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The file virtu editor keeps a system's look choice in. */
export const LOOKS_FILE = "looks.json";

/**
 * The looks a system offers: the shapes, ornaments, and season calendars in
 * its own shapes/, ornaments/, and seasons/ folders, or, when it has none of
 * those folders, the ones in Virtu's registry. Declarations with findings are
 * left out.
 */
export function lookCatalog(dir: string): LookCatalog {
  const own = ["shapes", "ornaments", "seasons"].some((f) => existsSync(join(dir, f)));
  const root = own ? dir : PACKAGE_ROOT;
  const files = (find: (p: string[]) => { ok: true; files: string[] } | { ok: false; error: string }, folder: string): string[] => {
    const path = join(root, folder);
    if (!existsSync(path)) return [];
    const r = find([path]);
    return r.ok ? r.files : [];
  };
  const shapes = loadShapes(files(findShapes, "shapes"));
  const ornaments = loadOrnaments(files(findOrnaments, "ornaments"));
  const seasons = loadSeasons(files(findSeasons, "seasons"));
  const out: LookCatalog = { shapes: shapes.ok ? shapes.shapes : [], ornaments: [], seasons: seasons.ok ? seasons.seasons : [] };
  for (const o of ornaments.ok ? ornaments.ornaments : []) {
    const svg = readAsset(o);
    if (svg !== null) out.ornaments.push({ decl: o, svg });
  }
  return out;
}

/** The choice saved in <dir>/looks.json, or none. */
export function savedLooks(dir: string): LookChoice | null {
  const path = join(dir, LOOKS_FILE);
  if (!existsSync(path)) return null;
  try {
    const r = readLookChoice(JSON.parse(readFileSync(path, "utf8")) as Json);
    return r.ok ? r.choice : null;
  } catch {
    return null;
  }
}

export type EditorResponse =
  | (EditorState & { saved?: false; why?: string })
  | (EditorState & { saved: true; written: string[] });

export type EditorRequestResult = { code: number; body: EditorResponse | { error: string } };

/** Reads the request body: an object with an optional edits array, and optional looks (a choice; absent keeps the saved one). */
export function parseEditorRequest(text: string): { ok: true; edits: EditorEdit[]; looks?: LookChoice } | { ok: false; error: string } {
  if (text.trim() === "") return { ok: true, edits: [] };
  let raw: Json;
  try {
    raw = JSON.parse(text) as Json;
  } catch {
    return { ok: false, error: "the request is not JSON" };
  }
  if (!isObject(raw)) return { ok: false, error: "the request must be a JSON object" };
  const edits = raw["edits"] ?? [];
  if (!Array.isArray(edits)) return { ok: false, error: "edits must be an array" };
  const out: EditorEdit[] = [];
  for (const [i, e] of edits.entries()) {
    if (!isObject(e) || typeof e["token"] !== "string" || !("value" in e)) return { ok: false, error: `edits[${i}] must have a token and a value` };
    const c = e["context"] ?? null;
    if (c !== null && !(isObject(c) && typeof c["name"] === "string" && typeof c["value"] === "string")) return { ok: false, error: `edits[${i}].context must be null or {"name", "value"}` };
    out.push({ token: e["token"], context: c === null ? null : { name: String(c["name"]), value: String(c["value"]) }, value: e["value"] ?? null });
  }
  if (raw["looks"] === undefined) return { ok: true, edits: out };
  const looks = readLookChoice(raw["looks"]);
  if (!looks.ok) return { ok: false, error: looks.error };
  return { ok: true, edits: out, looks: looks.choice };
}

/**
 * One editor request against the system in dir. Exit codes as check's: 0 the
 * edited declaration passes (and, with save, was written), 1 it fails or an
 * edit was refused (nothing written), 2 the system or the request is
 * unreadable.
 */
export function editorRequest(dir: string, edits: EditorEdit[], save: boolean, choice?: LookChoice, now?: Date): EditorRequestResult {
  const loadedResult = load(dir);
  if (!loadedResult.ok) return { code: 2, body: { error: `unreadable: ${loadedResult.error}` } };
  const loaded = loadedResult.loaded;
  const catalog = lookCatalog(dir);
  const offered = catalog.shapes.length + catalog.ornaments.length + catalog.seasons.length > 0;
  const kept = choice ?? savedLooks(dir);
  const looks: EditorLooks | undefined = offered ? { catalog, choice: kept ?? { shape: null, ornaments: {}, season: null }, ...(now === undefined ? {} : { now }) } : undefined;
  const lookRefused = (s: EditorState): boolean => (s.looks?.refused.length ?? 0) > 0;
  if (!save) {
    const state = edits.length === 0 ? editorState(loaded, [], looks) : previewEdits(loaded, edits, looks);
    return { code: state.verdict === "pass" && state.refused.length === 0 && !lookRefused(state) ? 0 : 1, body: state };
  }
  const applied = applyEdits(loaded, edits);
  if (applied.refused.length > 0) {
    return { code: 1, body: { ...editorState(applied.loaded, applied.refused, looks), saved: false, why: "an edit was refused; nothing was written" } };
  }
  const base = dirname(loaded.resolver.path);
  const root = resolve(dir);
  const overlay = new Map<string, Json>();
  for (const f of applied.files) {
    const full = resolve(base, f.origin);
    const rel = relative(root, full);
    if (rel.startsWith("..") || rel === "") return { code: 1, body: { ...editorState(applied.loaded), saved: false, why: `${f.origin} is outside the system directory; nothing was written` } };
    overlay.set(full, f.tree);
  }
  const proved = load(dir, overlay);
  if (!proved.ok) return { code: 2, body: { error: `unreadable: ${proved.error}` } };
  const state = editorState(proved.loaded, [], looks);
  if (lookRefused(state)) return { code: 1, body: { ...state, saved: false, why: "a look the catalog does not have was picked; nothing was written" } };
  if (state.verdict === "fail") return { code: 1, body: { ...state, saved: false, why: "check fails; nothing was written" } };
  const written: string[] = [];
  for (const [full, tree] of overlay) {
    if (!isObject(tree)) continue;
    writeFileSync(full, fileText(tree));
    written.push(relative(root, full));
  }
  if (choice !== undefined && state.looks !== undefined) {
    writeFileSync(join(root, LOOKS_FILE), fileText(lookJson(state.looks.choice) as never));
    written.push(LOOKS_FILE);
  }
  return { code: 0, body: { ...state, saved: true, written } };
}

/** The CLI command: request on stdin, JSON on stdout. */
export function editorCommand(dir: string, input: string, save: boolean): { code: number; stdout: string; stderr: string } {
  const req = parseEditorRequest(input);
  if (!req.ok) return { code: 2, stdout: "", stderr: `virtu editor: ${req.error}\n` };
  const r = editorRequest(dir, req.edits, save, req.looks);
  return { code: r.code, stdout: `${JSON.stringify(r.body)}\n`, stderr: "" };
}
