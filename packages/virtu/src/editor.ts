// virtu editor, the engine: what the theme panel shows, what an edit changes,
// and whether the result passes check. It takes a loaded declaration and
// imports nothing from Node, so a host can run it anywhere: the CLI command
// `virtu editor` (editor-io.ts), a route handler, or a hosted site's server.
// docs/design/EDITOR.md is the design; the panel itself is src/editor/ui.ts,
// and the two speak the protocol below.

import { previewCss } from "./build.ts";
import { analyze, check, type Analysis } from "./check.ts";
import { contextList } from "./carriers.ts";
import { cssName, cssValue } from "./build.ts";
import { isObject } from "./json.ts";
import type { DomainId, Finding, Json, JsonObject, Loaded, Permutation, Source } from "./model.ts";
import { parseValue, type TokenType } from "./tokens.ts";

export const EDITOR_PROTOCOL = "virtu-editor/1";

/**
 * One change a person makes in the panel: a token's new $value, for one value
 * of one context (such as theme=dark) or, with context null, for the set every
 * permutation shares.
 */
export type EditorEdit = { token: string; context: { name: string; value: string } | null; value: Json };

/** A token the panel can show: one per token in a governed domain's vocabulary. */
export type EditorToken = {
  path: string;
  type: TokenType | null;
  domain: DomainId;
  property: string;
  /** The context whose values change this token, if one does. Edits then name a value of it. */
  scope: string | null;
  /**
   * The token's written $value (an alias stays an alias) and its CSS value,
   * by value of scope, or under the key "" when scope is null.
   */
  values: Record<string, { value: Json | null; css: string | null }>;
  /** False when the panel cannot write this type, or the token lives only in a source it cannot change. */
  editable: boolean;
};

/** A token a color role may alias: a color outside every vocabulary, such as a palette step. */
export type EditorSwatch = { path: string; css: string };

export type EditorState = {
  protocol: typeof EDITOR_PROTOCOL;
  system: string;
  contexts: Array<{ name: string; dialect: string | null; values: string[]; default: string | null }>;
  tokens: EditorToken[];
  swatches: EditorSwatch[];
  verdict: "pass" | "fail";
  findings: Finding[];
  /** virtu.css for the declaration with the edits, passing or not. The panel puts it on the page. */
  css: string | null;
  /** Edits refused before check, with why. */
  refused: Array<{ edit: EditorEdit; why: string }>;
};

/** The token files an accepted set of edits changes, by origin (relative to the resolver document). */
export type EditorFile = { origin: string; tree: JsonObject };

/** The types the panel has a control for. */
export const EDITABLE_TYPES: ReadonlySet<TokenType> = new Set<TokenType>(["color", "dimension", "fontFamily", "fontWeight", "number", "duration"]);

const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** The panel's view of a declaration. */
export function editorState(loaded: Loaded, refused: EditorState["refused"] = []): EditorState {
  const a = analyze(loaded);
  const outcome = check(loaded);
  const contexts = contextList(a).filter((c) => c.values.length > 0);
  const def = a.defaultPermutation;
  const tokens: EditorToken[] = [];
  const swatches: EditorSwatch[] = [];
  const seen = new Set<string>();
  for (const p of a.permutations) {
    for (const path of a.resolution(p).tokens.keys()) seen.add(path);
  }
  for (const path of [...seen].sort(byCodeUnit)) {
    const domain = a.domainOfToken(path);
    const base = a.resolution(def).tokens.get(path);
    if (domain === null) {
      if (base?.type === "color") {
        const css = cssValue(base).css;
        if (css !== null) swatches.push({ path, css });
      }
      continue;
    }
    const scope = contexts.find((c) => c.values.some((v) => written(loaded, path, { ...def, [c.name]: v }) !== written(loaded, path, def) || definedIn(loaded, path, { name: c.name, value: v })))?.name ?? null;
    const values: EditorToken["values"] = {};
    const keys = scope === null ? [""] : (contexts.find((c) => c.name === scope)?.values ?? []);
    for (const key of keys) {
      const p: Permutation = scope === null ? def : { ...def, [scope]: key };
      const token = a.resolution(p).tokens.get(path);
      values[key] = { value: writtenValue(loaded, path, p), css: token ? cssValue(token).css : null };
    }
    const type = base?.type ?? null;
    const editable = type !== null && EDITABLE_TYPES.has(type) && keys.every((k) => target(loaded, path, scope === null ? null : { name: scope, value: k }) !== null);
    tokens.push({ path, type, domain, property: cssName(path), scope, values, editable });
  }
  return {
    protocol: EDITOR_PROTOCOL,
    system: loaded.name,
    contexts: contexts.map((c) => ({ name: c.name, dialect: c.dialect, values: c.values, default: c.default })),
    tokens,
    swatches,
    verdict: outcome.verdict,
    findings: outcome.findings,
    css: previewCss(loaded),
    refused,
  };
}

/**
 * The declaration with the edits applied, in order, and the token files they
 * change. An edit is refused, and the rest still apply, when its token is not
 * in a governed vocabulary, its context value does not exist, its type has no
 * control, or its value does not parse as that type (an alias to a token of
 * the same type is accepted). The input is not changed.
 */
export function applyEdits(loaded: Loaded, edits: EditorEdit[]): { loaded: Loaded; files: EditorFile[]; refused: EditorState["refused"] } {
  const next = structuredClone(loaded);
  const a = analyze(loaded);
  const refused: EditorState["refused"] = [];
  const changed = new Map<string, Source>();
  for (const edit of edits) {
    const why = refusal(a, edit);
    if (why !== null) {
      refused.push({ edit, why });
      continue;
    }
    const source = target(next, edit.token, edit.context);
    if (source === null) {
      refused.push({ edit, why: edit.context === null ? "no token set holds this token; edit it for a context value" : `no source of ${edit.context.name}=${edit.context.value} or of any set holds this token` });
      continue;
    }
    if (source.origin.startsWith("inline ")) {
      refused.push({ edit, why: "the token is written inline in the resolver document, which the editor does not change" });
      continue;
    }
    const type = a.resolution(a.defaultPermutation).tokens.get(edit.token)?.type ?? null;
    setValue(source.tree, edit.token, edit.value, type);
    changed.set(source.origin, source);
  }
  const files = [...changed.values()].map((s) => ({ origin: s.origin, tree: s.tree })).sort((x, y) => byCodeUnit(x.origin, y.origin));
  return { loaded: next, files, refused };
}

/** The panel's view after the edits: editorState of the edited declaration, with the refusals. */
export function previewEdits(loaded: Loaded, edits: EditorEdit[]): EditorState {
  const r = applyEdits(loaded, edits);
  return editorState(r.loaded, r.refused);
}

/** A token file's text as the editor writes it: two-space JSON and a final newline. */
export function fileText(tree: JsonObject): string {
  return `${JSON.stringify(tree, null, 2)}\n`;
}

function refusal(a: Analysis, edit: EditorEdit): string | null {
  if (typeof edit.token !== "string" || a.domainOfToken(edit.token) === null) return `${String(edit.token)} is not a token in a governed vocabulary`;
  if (edit.context !== null) {
    const c = a.contexts.find((x) => x.name === edit.context?.name);
    if (!c || !c.values.includes(edit.context.value)) return `${edit.context.name}=${edit.context.value} is not a context value of this system`;
  }
  const token = a.resolution(a.defaultPermutation).tokens.get(edit.token) ?? [...a.permutations].map((p) => a.resolution(p).tokens.get(edit.token)).find((t) => t !== undefined);
  const type = token?.type ?? null;
  if (type === null || !EDITABLE_TYPES.has(type)) return `the editor has no control for a ${type ?? "untyped"} token`;
  if (typeof edit.value === "string" && /^\{[^{}]+\}$/.test(edit.value)) {
    const to = edit.value.slice(1, -1);
    const aliased = a.resolution(a.defaultPermutation).tokens.get(to);
    if (!aliased) return `${edit.value} names no token`;
    if (aliased.type !== type) return `${edit.value} is a ${aliased.type ?? "untyped"} token, not a ${type} token`;
    return null;
  }
  const parsed = parseValue(type, edit.value);
  return typeof parsed === "string" ? parsed : null;
}

/** The sources an edit may write: a context value's, or every set's in resolution order. */
function sourcesFor(loaded: Loaded, context: EditorEdit["context"]): Source[] {
  if (context !== null) return loaded.resolver.modifiers[context.name]?.values.find((v) => v.name === context.value)?.sources ?? [];
  return loaded.resolver.order.flatMap((item) => (item.kind === "set" ? item.sources : []));
}

/**
 * The source an edit writes. For a context value: the last of its sources that
 * holds the token, else the last of its sources, where the token is added, so
 * the edit stays with that value. A context value with no sources (such as a
 * default that changes nothing) and an edit with no context write the last set
 * source that holds the token. Null when there is none.
 */
function target(loaded: Loaded, path: string, context: EditorEdit["context"]): Source | null {
  if (context !== null) {
    const own = sourcesFor(loaded, context);
    const holding = [...own].reverse().find((s) => node(s.tree, path) !== null);
    if (holding) return holding;
    if (own.length > 0) return own.at(-1) ?? null;
  }
  return [...sourcesFor(loaded, null)].reverse().find((s) => node(s.tree, path) !== null) ?? null;
}

function definedIn(loaded: Loaded, path: string, context: { name: string; value: string }): boolean {
  return sourcesFor(loaded, context).some((s) => node(s.tree, path) !== null);
}

/** The token's node in a tree: the object that holds its $value. */
function node(tree: JsonObject, path: string): JsonObject | null {
  let at: Json | undefined = tree;
  for (const seg of path.split(".")) {
    if (!isObject(at)) return null;
    at = at[seg];
  }
  return isObject(at) && "$value" in at ? at : null;
}

/** The $value as written in the last source that holds the token under a permutation. */
function writtenValue(loaded: Loaded, path: string, p: Permutation): Json | null {
  let found: Json | null = null;
  for (const item of loaded.resolver.order) {
    const sources = item.kind === "set" ? item.sources : (loaded.resolver.modifiers[item.name]?.values.find((v) => v.name === p[item.name])?.sources ?? []);
    for (const s of sources) {
      const n = node(s.tree, path);
      if (n !== null) found = n["$value"] ?? null;
    }
  }
  return found;
}

function written(loaded: Loaded, path: string, p: Permutation): string {
  return JSON.stringify(writtenValue(loaded, path, p));
}

function setValue(tree: JsonObject, path: string, value: Json, type: TokenType | null): void {
  const segs = path.split(".");
  let at: JsonObject = tree;
  for (const seg of segs.slice(0, -1)) {
    const child = at[seg];
    if (isObject(child)) at = child;
    else {
      const made: JsonObject = {};
      at[seg] = made;
      at = made;
    }
  }
  const last = segs.at(-1) ?? "";
  const existing = at[last];
  if (isObject(existing)) existing["$value"] = value;
  else at[last] = type === null ? { $value: value } : { $type: type, $value: value };
}
