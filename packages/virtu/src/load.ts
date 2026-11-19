// The boundary. Reads virtu.json, the DTCG resolver document, and the token
// files it names, and returns a Loaded value. A missing file or a file that is
// not JSON makes the declaration unreadable (exit 2). Any other shape problem
// is reported as a finding and the malformed item is dropped, so a check run
// can still report everything else it finds.

import { dayIndex } from "./calendar.ts";
import { isObject } from "./json.ts";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BACKGROUND_COSTS,
  DOMAIN_IDS,
  FILL_TYPES,
  INTERPOLATIONS,
  SHADCN_VARIABLES,
  MECHANISMS,
  TYPE_ROLES,
  MOTION_PROPERTIES,
  STACKING_DIRECTIONS,
  TARGET_LEVELS,
  type DepthDecl,
  CORNER_SHAPES,
  EDGE_STYLES,
  MOTION_ANCHORS,
  ORNAMENT_ANCHORS,
  ORNAMENT_MOTIONS,
  SHAPE_ROLES,
  type CornerShape,
  type EdgePaint,
  type EdgeStyle,
  type OrnamentAnchor,
  type OrnamentDecl,
  type OrnamentMotionKind,
  type OrnamentsResult,
  type Season,
  type SeasonDecl,
  type SeasonsResult,
  type ShapeDecl,
  type ShapeEdge,
  type ShapeNest,
  type ShapeRadius,
  type ShapeRole,
  type ShapesResult,
  type DepthLevel,
  type DepthPlacement,
  type DepthsResult,
  type ShadowLayer,
  type SpaceAmount,
  type SpaceDecl,
  type SpaceDensityValue,
  type SpacesResult,
  type SpaceStep,
  type SpaceTarget,
  type StackingDirection,
  type TargetLevel,
  type IconDecl,
  type IconNameList,
  type IconsResult,
  type MotionDecl,
  type MotionDuration,
  type MotionEasing,
  type MotionProperty,
  type MotionResult,
  type MotionTransition,
  type MotionVariant,
  type Background,
  type BackgroundCost,
  type BackgroundFill,
  type BackgroundPaint,
  type BackgroundsResult,
  type ColorRole,
  type ColorScale,
  type ColorSpecResult,
  type ShadcnMapResult,
  type FontMetrics,
  type TypeDecl,
  type TypeFace,
  type TypeRole,
  type TypeScale,
  type TypeSize,
  type TypeStep,
  type TypesResult,
  type ContextDecl,
  type Dialect,
  type DomainDecl,
  type DomainId,
  type Finding,
  type Json,
  type JsonObject,
  type LoadResult,
  type Loaded,
  type Machine,
  type Mechanism,
  type Modifier,
  type OrderItem,
  type Relation,
  type Resolver,
  type Source,
  type Subkind,
  type Transition,
  type UsageEntry,
  type VocabularyDecl,
} from "./model.ts";

export const DECLARATION_FILE = "virtu.json";
export const COLOR_FILE = "color.virtu.json";
export const SHADCN_FILE = "shadcn.virtu.json";
export const SHADCN_FORMAT_VERSION = "0";
export const BACKGROUND_SUFFIX = ".background.json";
export const BACKGROUND_FORMAT_VERSION = "0";
export const TYPE_SUFFIX = ".type.json";
export const TYPE_FORMAT_VERSION = "0";
export const MOTION_SUFFIX = ".motion.json";
export const MOTION_FORMAT_VERSION = "0";
export const SPACE_SUFFIX = ".space.json";
export const SPACE_FORMAT_VERSION = "0";
export const DEPTH_SUFFIX = ".depth.json";
export const DEPTH_FORMAT_VERSION = "0";
export const SHAPE_SUFFIX = ".shape.json";
export const ORNAMENT_SUFFIX = ".ornament.json";
export const SEASON_SUFFIX = ".season.json";
/** The format version of shape, ornament, and season declarations. */
export const LOOK_FORMAT_VERSION = "0";
export const ICONS_SUFFIX = ".icons.json";
export const ICONS_FORMAT_VERSION = "0";
/** Where the committed icon name lists are: data/icon-names/ at the repository's or the package's root. */
export const ICON_NAMES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data", "icon-names");
export const COLOR_FORMAT_VERSION = "0";
export const FORMAT_VERSION = "0";
export const RESOLVER_VERSION = "2025.10";

/** Thrown inside this module only, and turned into an unreadable LoadResult by load(). */
class Unreadable extends Error {}

/**
 * Files read in place of the ones on disk, keyed by absolute path. virtu color
 * loads the system with the files it is about to write, so check proves
 * exactly what would be written, and nothing is written when it fails.
 */
export type Overlay = ReadonlyMap<string, Json>;

const NO_OVERLAY: Overlay = new Map();

export function load(dir: string, overlay: Overlay = NO_OVERLAY): LoadResult {
  try {
    return { ok: true, loaded: loadOrThrow(resolve(dir), overlay) };
  } catch (error) {
    if (error instanceof Unreadable) return { ok: false, error: error.message };
    throw error;
  }
}

function readJson(path: string, what: string, overlay: Overlay = NO_OVERLAY): Json {
  const given = overlay.get(path);
  if (given !== undefined) return given;
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new Unreadable(`${what} not found: ${path}`);
  }
  try {
    // JSON.parse only ever produces values of the Json type.
    const value: unknown = JSON.parse(text);
    return value as Json;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Unreadable(`${what} is not JSON: ${path}: ${detail}`);
  }
}

export { isObject };

function isDomainId(value: string): value is DomainId {
  return (DOMAIN_IDS as readonly string[]).includes(value);
}

// Shape readers. Each reports a load.invalid finding and returns null when the
// value does not have the expected shape.
type InvalidRule = "load.invalid" | "color.invalid" | "build.shadcn-invalid" | "background.invalid" | "type.invalid" | "motion.invalid" | "icons.invalid" | "space.invalid" | "depth.invalid" | "shape.invalid" | "ornament.invalid" | "season.invalid";
const INVALID_LAYER = {
  "load.invalid": "load",
  "color.invalid": "color",
  "build.shadcn-invalid": "build",
  "background.invalid": "background",
  "type.invalid": "type",
  "motion.invalid": "motion",
  "icons.invalid": "icons",
  "space.invalid": "space",
  "depth.invalid": "depth",
  "shape.invalid": "shape",
  "ornament.invalid": "ornament",
  "season.invalid": "season",
} as const;

function makeReader(findings: Finding[], file: string, rule: InvalidRule = "load.invalid") {
  const invalid = (where: string, message: string): null => {
    findings.push({
      severity: "error",
      layer: INVALID_LAYER[rule],
      rule,
      message: `${file} ${where}: ${message}`,
      entities: [where],
    });
    return null;
  };
  const object = (value: Json | undefined, where: string): JsonObject | null =>
    isObject(value) ? value : invalid(where, "must be an object");
  const keys = (obj: JsonObject, where: string, allowed: readonly string[], required: readonly string[]): boolean => {
    let ok = true;
    for (const key of Object.keys(obj)) {
      if (!allowed.includes(key)) invalid(`${where}.${key}`, "is not a known key");
    }
    for (const key of required) {
      if (!(key in obj)) {
        invalid(where, `is missing required key "${key}"`);
        ok = false;
      }
    }
    return ok;
  };
  const string = (value: Json | undefined, where: string, nonEmpty = true): string | null => {
    if (typeof value !== "string") return invalid(where, "must be a string");
    if (nonEmpty && value.trim() === "") return invalid(where, "must not be empty");
    return value;
  };
  const optionalString = (value: Json | undefined, where: string): string | null =>
    value === undefined ? null : string(value, where, false);
  const strings = (value: Json | undefined, where: string): string[] | null => {
    if (!Array.isArray(value) || value.length === 0) return invalid(where, "must be a non-empty array of strings");
    const out: string[] = [];
    for (const [i, item] of value.entries()) {
      const s = string(item, `${where}[${i}]`);
      if (s === null) return null;
      out.push(s);
    }
    return out;
  };
  const number = (value: Json | undefined, where: string, min: number, integer = false): number | null => {
    if (typeof value !== "number" || !Number.isFinite(value)) return invalid(where, "must be a number");
    if (integer && !Number.isInteger(value)) return invalid(where, "must be an integer");
    if (value < min) return invalid(where, `must be at least ${min}`);
    return value;
  };
  return { invalid, object, keys, string, optionalString, strings, number };
}

const NAME = /^[A-Za-z0-9_-]+$/;
const RELATION_KINDS = ["contrast", "ratio", "count", "nested-radius"] as const;
const RELATION_FIELDS: Record<(typeof RELATION_KINDS)[number], readonly string[]> = {
  contrast: ["foreground", "background", "min"],
  ratio: ["tokens", "ratio", "tolerance"],
  count: ["group", "max"],
  "nested-radius": ["outer", "inset", "inner"],
};
/** Fields a relation kind may leave out. */
const RELATION_OPTIONAL: Record<(typeof RELATION_KINDS)[number], readonly string[]> = { contrast: [], ratio: [], count: [], "nested-radius": ["border", "tolerance"] };

function loadOrThrow(dir: string, overlay: Overlay): Loaded {
  const declPath = join(dir, DECLARATION_FILE);
  const decl = readJson(declPath, "declaration");
  if (!isObject(decl)) throw new Unreadable(`declaration is not a JSON object: ${declPath}`);
  const tokens = decl["tokens"];
  if (typeof tokens !== "string" || tokens === "") {
    throw new Unreadable(`${DECLARATION_FILE} must name its DTCG resolver document in "tokens"`);
  }

  const findings: Finding[] = [];
  const r = makeReader(findings, DECLARATION_FILE);
  r.keys(
    decl,
    "root",
    ["$schema", "virtu", "name", "description", "medium", "tokens", "domains", "vocabularies", "contexts", "machines", "relations", "usage"],
    ["virtu", "name", "medium", "tokens", "domains"],
  );
  if ("virtu" in decl && decl["virtu"] !== FORMAT_VERSION) {
    r.invalid("virtu", `must be "${FORMAT_VERSION}", the only format version`);
  }
  if ("medium" in decl && decl["medium"] !== "screen") {
    r.invalid("medium", `must be "screen", the only medium in version 0`);
  }
  const name = (decl["name"] !== undefined ? r.string(decl["name"], "name") : null) ?? "unnamed";
  const description = r.optionalString(decl["description"], "description");

  const resolverPath = resolve(dir, tokens);
  return {
    dir,
    name,
    description,
    medium: "screen",
    domains: readDomains(decl["domains"], r),
    vocabularies: readVocabularies(decl["vocabularies"], r),
    contexts: readContexts(decl["contexts"], r),
    machines: readMachines(decl["machines"], r),
    relations: readRelations(decl["relations"], r),
    usage: readUsage(decl["usage"], r),
    resolver: loadResolver(resolverPath, findings, overlay),
    findings,
  };
}

type Reader = ReturnType<typeof makeReader>;

function readDomains(value: Json | undefined, r: Reader): Partial<Record<DomainId, DomainDecl>> {
  const out: Partial<Record<DomainId, DomainDecl>> = {};
  if (value === undefined) return out;
  const obj = r.object(value, "domains");
  if (obj === null) return out;
  for (const [id, raw] of Object.entries(obj)) {
    const where = `domains.${id}`;
    if (!isDomainId(id)) {
      r.invalid(where, `is not a screen domain; version 0 has ${DOMAIN_IDS.join(", ")}`);
      continue;
    }
    const d = r.object(raw, where);
    if (d === null) continue;
    if ("excluded" in d) {
      if (!r.keys(d, where, ["excluded"], ["excluded"])) continue;
      const excluded = d["excluded"];
      if (typeof excluded === "string") out[id] = { kind: "excluded", reason: excluded };
      else if (excluded === true) out[id] = { kind: "excluded", reason: "" };
      else r.invalid(`${where}.excluded`, "must be a string giving the reason");
      continue;
    }
    r.keys(d, where, MECHANISMS, []);
    const cells: Partial<Record<Mechanism, string | null>> = {};
    for (const m of MECHANISMS) {
      if (!(m in d)) continue;
      const cell = d[m];
      if (cell === null) cells[m] = null;
      else if (typeof cell === "string" && cell !== "") cells[m] = cell;
      else r.invalid(`${where}.${m}`, "must be a name, or null for deliberately nothing");
    }
    out[id] = { kind: "governed", cells };
  }
  return out;
}

function readVocabularies(value: Json | undefined, r: Reader): Record<string, VocabularyDecl> {
  const out: Record<string, VocabularyDecl> = {};
  if (value === undefined) return out;
  const obj = r.object(value, "vocabularies");
  if (obj === null) return out;
  for (const [name, raw] of Object.entries(obj)) {
    const where = `vocabularies.${name}`;
    if (!NAME.test(name)) {
      r.invalid(where, "name may hold only letters, digits, hyphens, and underscores");
      continue;
    }
    const v = r.object(raw, where);
    if (v === null || !r.keys(v, where, ["domain", "description", "members"], ["domain", "members"])) continue;
    const domain = r.string(v["domain"], `${where}.domain`);
    if (domain === null) continue;
    if (!isDomainId(domain)) {
      r.invalid(`${where}.domain`, `is not a screen domain`);
      continue;
    }
    const membersObj = r.object(v["members"], `${where}.members`);
    if (membersObj === null) continue;
    const members: Record<string, string> = {};
    let ok = true;
    for (const [member, definition] of Object.entries(membersObj)) {
      const def = r.string(definition, `${where}.members.${member}`);
      if (def === null) ok = false;
      else members[member] = def;
    }
    if (!ok) continue;
    out[name] = { domain, description: r.optionalString(v["description"], `${where}.description`), members };
  }
  return out;
}

function readContexts(value: Json | undefined, r: Reader): Record<string, ContextDecl> {
  const out: Record<string, ContextDecl> = {};
  if (value === undefined) return out;
  const obj = r.object(value, "contexts");
  if (obj === null) return out;
  for (const [name, raw] of Object.entries(obj)) {
    const where = `contexts.${name}`;
    const c = r.object(raw, where);
    if (c === null || !r.keys(c, where, ["dialect", "description"], ["dialect"])) continue;
    const dialect = c["dialect"];
    if (dialect !== "ambient" && dialect !== "propagating") {
      r.invalid(`${where}.dialect`, `must be "ambient" or "propagating"`);
      continue;
    }
    const d: Dialect = dialect;
    out[name] = { dialect: d, description: r.optionalString(c["description"], `${where}.description`) };
  }
  return out;
}

function readMachines(value: Json | undefined, r: Reader): Record<string, Machine> {
  const out: Record<string, Machine> = {};
  if (value === undefined) return out;
  const obj = r.object(value, "machines");
  if (obj === null) return out;
  for (const [name, raw] of Object.entries(obj)) {
    const where = `machines.${name}`;
    const m = r.object(raw, where);
    if (m === null || !r.keys(m, where, ["description", "initial", "states", "transitions"], ["initial", "states", "transitions"])) {
      continue;
    }
    const initial = r.string(m["initial"], `${where}.initial`);
    const states = r.strings(m["states"], `${where}.states`);
    if (initial === null || states === null) continue;
    if (new Set(states).size !== states.length) {
      r.invalid(`${where}.states`, "must not list a state twice");
      continue;
    }
    const rawTransitions = m["transitions"];
    if (!Array.isArray(rawTransitions)) {
      r.invalid(`${where}.transitions`, "must be an array");
      continue;
    }
    const transitions: Transition[] = [];
    for (const [i, rawT] of rawTransitions.entries()) {
      const tw = `${where}.transitions[${i}]`;
      const t = r.object(rawT, tw);
      if (t === null || !r.keys(t, tw, ["from", "event", "to"], ["from", "event", "to"])) continue;
      const from = r.string(t["from"], `${tw}.from`);
      const event = r.string(t["event"], `${tw}.event`);
      const to = r.string(t["to"], `${tw}.to`);
      if (from !== null && event !== null && to !== null) transitions.push({ from, event, to });
    }
    out[name] = { description: r.optionalString(m["description"], `${where}.description`), initial, states, transitions };
  }
  return out;
}

function readRelations(value: Json | undefined, r: Reader): Relation[] {
  const out: Relation[] = [];
  if (value === undefined) return out;
  if (!Array.isArray(value)) {
    r.invalid("relations", "must be an array");
    return out;
  }
  const seen = new Set<string>();
  for (const [i, raw] of value.entries()) {
    const where = `relations[${i}]`;
    const o = r.object(raw, where);
    if (o === null) continue;
    const kind = RELATION_KINDS.find((k) => k === o["kind"]);
    if (kind === undefined) {
      r.invalid(`${where}.kind`, `must be one of ${RELATION_KINDS.join(", ")}`);
      continue;
    }
    const fields = RELATION_FIELDS[kind];
    if (!r.keys(o, where, ["id", "kind", "subkind", "description", ...fields, ...RELATION_OPTIONAL[kind]], ["id", "subkind", ...fields])) continue;
    const id = r.string(o["id"], `${where}.id`);
    const subkindRaw = o["subkind"];
    let subkind: Subkind | null = null;
    if (subkindRaw === "stated" || subkindRaw === "compiled") subkind = subkindRaw;
    else r.invalid(`${where}.subkind`, `must be "stated" or "compiled"`);
    const description = r.optionalString(o["description"], `${where}.description`);
    if (id === null || subkind === null) continue;
    if (!NAME.test(id)) {
      r.invalid(`${where}.id`, "may hold only letters, digits, hyphens, and underscores");
      continue;
    }
    if (seen.has(id)) {
      r.invalid(`${where}.id`, `"${id}" is used by another relation`);
      continue;
    }
    let relation: Relation | null = null;
    if (kind === "contrast") {
      const foreground = r.strings(o["foreground"], `${where}.foreground`);
      const background = r.strings(o["background"], `${where}.background`);
      const min = r.number(o["min"], `${where}.min`, 1);
      if (foreground !== null && background !== null && min !== null) {
        relation = { id, subkind, description, kind, foreground, background, min };
      }
    } else if (kind === "ratio") {
      const tokens = r.strings(o["tokens"], `${where}.tokens`);
      const ratio = r.number(o["ratio"], `${where}.ratio`, Number.MIN_VALUE);
      const tolerance = r.number(o["tolerance"], `${where}.tolerance`, 0);
      if (tokens !== null && ratio !== null && tolerance !== null) {
        relation = { id, subkind, description, kind, tokens, ratio, tolerance };
      }
    } else if (kind === "nested-radius") {
      const outer = r.string(o["outer"], `${where}.outer`);
      const inset = r.string(o["inset"], `${where}.inset`);
      const inner = r.string(o["inner"], `${where}.inner`);
      const border = o["border"] === undefined ? null : r.string(o["border"], `${where}.border`);
      const tolerance = o["tolerance"] === undefined ? 0.5 : r.number(o["tolerance"], `${where}.tolerance`, 0);
      if (outer !== null && inset !== null && inner !== null && (o["border"] === undefined || border !== null) && tolerance !== null) {
        relation = { id, subkind, description, kind, outer, inset, inner, border, tolerance };
      }
    } else {
      const group = r.string(o["group"], `${where}.group`);
      const max = r.number(o["max"], `${where}.max`, 0, true);
      if (group !== null && max !== null) {
        relation = { id, subkind, description, kind, group, max };
      }
    }
    if (relation !== null) {
      seen.add(relation.id);
      out.push(relation);
    }
  }
  return out;
}

function readUsage(value: Json | undefined, r: Reader): UsageEntry[] {
  const out: UsageEntry[] = [];
  if (value === undefined) return out;
  if (!Array.isArray(value)) {
    r.invalid("usage", "must be an array");
    return out;
  }
  for (const [i, raw] of value.entries()) {
    const where = `usage[${i}]`;
    const o = r.object(raw, where);
    if (o === null || !r.keys(o, where, ["situation", "entry"], ["situation", "entry"])) continue;
    const situation = r.string(o["situation"], `${where}.situation`);
    const entry = r.string(o["entry"], `${where}.entry`);
    if (situation !== null && entry !== null) out.push({ situation, entry });
  }
  return out;
}

// The DTCG resolver document. Supports sets, modifiers with contexts and a
// default, resolutionOrder with references or inline items, and sources that
// are a relative file reference, a same-document set reference, or inline
// tokens.
function loadResolver(path: string, findings: Finding[], overlay: Overlay): Resolver {
  const file = path.split("/").pop() ?? path;
  const r = makeReader(findings, file);
  const doc = readJson(path, "DTCG resolver document", overlay);
  if (!isObject(doc)) throw new Unreadable(`DTCG resolver document is not a JSON object: ${path}`);
  r.keys(doc, "root", ["$schema", "name", "version", "description", "sets", "modifiers", "resolutionOrder", "$extensions", "$defs"], ["version", "resolutionOrder"]);
  if ("version" in doc && doc["version"] !== RESOLVER_VERSION) {
    r.invalid("version", `must be "${RESOLVER_VERSION}"`);
  }
  const base = dirname(path);
  const files = new Map<string, JsonObject | null>();
  const rawSets = isObject(doc["sets"]) ? doc["sets"] : {};
  if (doc["sets"] !== undefined && !isObject(doc["sets"])) r.invalid("sets", "must be an object");
  const rawModifiers = isObject(doc["modifiers"]) ? doc["modifiers"] : {};
  if (doc["modifiers"] !== undefined && !isObject(doc["modifiers"])) r.invalid("modifiers", "must be an object");

  const setCache = new Map<string, Source[]>();
  const expanding = new Set<string>();

  const readTokenFile = (ref: string, where: string): Source[] => {
    const full = resolve(base, ref);
    if (!files.has(full)) {
      const tree = readJson(full, "token file", overlay);
      if (isObject(tree)) files.set(full, tree);
      else {
        r.invalid(where, `${ref} is not a DTCG token tree (a JSON object)`);
        files.set(full, null);
      }
    }
    const tree = files.get(full);
    return tree ? [{ origin: ref, tree }] : [];
  };

  const setSources = (name: string, where: string): Source[] => {
    const cached = setCache.get(name);
    if (cached) return cached;
    if (expanding.has(name)) {
      r.invalid(where, `set "${name}" refers to itself`);
      return [];
    }
    const raw = rawSets[name];
    if (raw === undefined) {
      r.invalid(where, `refers to set "${name}", which is not declared`);
      return [];
    }
    const set = r.object(raw, `sets.${name}`);
    if (set === null || !r.keys(set, `sets.${name}`, ["sources", "description", "$extensions"], ["sources"])) return [];
    expanding.add(name);
    const sources = readSources(set["sources"], `sets.${name}.sources`);
    expanding.delete(name);
    setCache.set(name, sources);
    return sources;
  };

  const readSources = (value: Json | undefined, where: string): Source[] => {
    if (!Array.isArray(value)) {
      r.invalid(where, "must be an array of token sources");
      return [];
    }
    const out: Source[] = [];
    for (const [i, item] of value.entries()) {
      const iw = `${where}[${i}]`;
      if (!isObject(item)) {
        r.invalid(iw, "must be a reference object or inline tokens");
        continue;
      }
      const ref = item["$ref"];
      if (ref === undefined) {
        out.push({ origin: `inline ${iw}`, tree: item });
        continue;
      }
      if (typeof ref !== "string") {
        r.invalid(`${iw}.$ref`, "must be a string");
        continue;
      }
      if (Object.keys(item).length > 1) r.invalid(iw, "keys beside $ref are not supported in version 0");
      if (ref.startsWith("#/sets/")) out.push(...setSources(ref.slice("#/sets/".length), iw));
      else if (ref.startsWith("#/modifiers/")) r.invalid(iw, "a token source must not refer to a modifier");
      else if (ref.includes("#")) r.invalid(iw, `"${ref}": JSON Pointer fragments are not supported in version 0`);
      else out.push(...readTokenFile(ref, iw));
    }
    return out;
  };

  const readModifier = (raw: Json | undefined, where: string, inline: boolean): Modifier | null => {
    const m = r.object(raw, where);
    if (m === null) return null;
    const allowed = ["contexts", "default", "description", "$extensions", ...(inline ? ["type", "name"] : [])];
    if (!r.keys(m, where, allowed, ["contexts"])) return null;
    const contexts = r.object(m["contexts"], `${where}.contexts`);
    if (contexts === null) return null;
    const values = Object.entries(contexts).map(([name, sources]) => ({
      name,
      sources: readSources(sources, `${where}.contexts.${name}`),
    }));
    let def: string | null = null;
    if (m["default"] !== undefined) def = r.string(m["default"], `${where}.default`);
    return { values, default: def };
  };

  const modifiers: Record<string, Modifier> = {};
  const order: OrderItem[] = [];
  const orderNames = new Set<string>();
  const rawOrder = doc["resolutionOrder"];
  if (rawOrder !== undefined && !Array.isArray(rawOrder)) r.invalid("resolutionOrder", "must be an array");
  const orderItems = Array.isArray(rawOrder) ? rawOrder : [];
  for (const [i, item] of orderItems.entries()) {
    const where = `resolutionOrder[${i}]`;
    if (!isObject(item)) {
      r.invalid(where, "must be a reference object or an inline set or modifier");
      continue;
    }
    let name: string;
    let entry: OrderItem | null = null;
    const ref = item["$ref"];
    if (typeof ref === "string") {
      if (ref.startsWith("#/sets/")) {
        name = ref.slice("#/sets/".length);
        entry = { kind: "set", name, sources: setSources(name, where) };
      } else if (ref.startsWith("#/modifiers/")) {
        name = ref.slice("#/modifiers/".length);
        if (rawModifiers[name] === undefined) {
          r.invalid(where, `refers to modifier "${name}", which is not declared`);
          continue;
        }
        const modifier = readModifier(rawModifiers[name], `modifiers.${name}`, false);
        if (modifier === null) continue;
        modifiers[name] = modifier;
        entry = { kind: "modifier", name };
      } else {
        r.invalid(where, `"${ref}" must point to #/sets/<name> or #/modifiers/<name>`);
        continue;
      }
    } else {
      const type = item["type"];
      const inlineName = r.string(item["name"], `${where}.name`);
      if (inlineName === null) continue;
      name = inlineName;
      if (type === "set") {
        if (!r.keys(item, where, ["type", "name", "sources", "description", "$extensions"], ["sources"])) continue;
        entry = { kind: "set", name, sources: readSources(item["sources"], `${where}.sources`) };
      } else if (type === "modifier") {
        if (rawModifiers[name] !== undefined) {
          r.invalid(where, `inline modifier "${name}" has the name of a declared modifier`);
          continue;
        }
        const modifier = readModifier(item, where, true);
        if (modifier === null) continue;
        modifiers[name] = modifier;
        entry = { kind: "modifier", name };
      } else {
        r.invalid(`${where}.type`, `must be "set" or "modifier"`);
        continue;
      }
    }
    if (orderNames.has(name)) {
      r.invalid(where, `"${name}" appears twice in resolutionOrder`);
      continue;
    }
    orderNames.add(name);
    order.push(entry);
  }
  for (const name of Object.keys(rawModifiers)) {
    if (!(name in modifiers)) {
      findings.push({
        severity: "warning",
        layer: "load",
        rule: "load.unused",
        message: `${file}: modifier "${name}" is not in resolutionOrder, so it changes no token`,
        entities: [name],
      });
    }
  }
  return { path, modifiers, order };
}

// color.virtu.json, the color generator's file. A missing file or one that is
// not JSON is unreadable. Any other shape problem is a color.invalid finding,
// and the generator refuses while there is one.

const STEP_NAME = /^[A-Za-z0-9_-]+$/;
const TOKEN_PATH = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/;

export function loadColorSpec(dir: string): ColorSpecResult {
  const base = resolve(dir);
  const path = join(base, COLOR_FILE);
  let raw: Json;
  try {
    raw = readJson(path, "color generator file");
  } catch (error) {
    if (error instanceof Unreadable) return { ok: false, error: error.message };
    throw error;
  }
  if (!isObject(raw)) return { ok: false, error: `color generator file is not a JSON object: ${path}` };
  const findings: Finding[] = [];
  const r = makeReader(findings, COLOR_FILE, "color.invalid");
  r.keys(raw, "root", ["$schema", "virtu-color", "description", "gamut", "ladder", "margin", "scales", "output", "roles"], ["virtu-color", "ladder", "scales", "output", "roles"]);
  if ("virtu-color" in raw && raw["virtu-color"] !== COLOR_FORMAT_VERSION) {
    r.invalid("virtu-color", `must be "${COLOR_FORMAT_VERSION}", the only generator format version`);
  }
  if (raw["description"] !== undefined) r.optionalString(raw["description"], "description");

  // The ladder.
  let steps: string[] = [];
  let lightest = 1;
  let darkest = 0;
  const ladder = raw["ladder"] === undefined ? null : r.object(raw["ladder"], "ladder");
  if (ladder !== null && r.keys(ladder, "ladder", ["steps", "lightest", "darkest"], ["steps", "lightest", "darkest"])) {
    const names = r.strings(ladder["steps"], "ladder.steps");
    if (names !== null) {
      const bad = names.find((n) => !STEP_NAME.test(n));
      if (bad !== undefined) r.invalid("ladder.steps", `"${bad}" may hold only letters, digits, hyphens, and underscores`);
      else if (new Set(names).size !== names.length) r.invalid("ladder.steps", "must not list a step twice");
      else if (names.length < 2) r.invalid("ladder.steps", "must have at least two steps");
      else steps = names;
    }
    const top = r.number(ladder["lightest"], "ladder.lightest", 0);
    const bottom = r.number(ladder["darkest"], "ladder.darkest", 0);
    if (top !== null && top > 1) r.invalid("ladder.lightest", "is a relative luminance, at most 1");
    else if (top !== null) lightest = top;
    if (bottom !== null) darkest = bottom;
    if (top !== null && bottom !== null && !(top > bottom)) r.invalid("ladder", "lightest must be greater than darkest");
  }

  let gamut: "srgb" | "p3" = "srgb";
  if (raw["gamut"] !== undefined) {
    const g = raw["gamut"];
    if (g === "srgb" || g === "p3") gamut = g;
    else r.invalid("gamut", 'must be "srgb" or "p3"');
  }

  let margin = 0.05;
  if (raw["margin"] !== undefined) {
    const m = r.number(raw["margin"], "margin", 0);
    if (m !== null) margin = m;
  }

  // The scales.
  const scales: ColorScale[] = [];
  const scalesObj = raw["scales"] === undefined ? null : r.object(raw["scales"], "scales");
  if (scalesObj !== null) {
    if (Object.keys(scalesObj).length === 0) r.invalid("scales", "must declare at least one scale");
    for (const [name, value] of Object.entries(scalesObj)) {
      const where = `scales.${name}`;
      if (!STEP_NAME.test(name)) {
        r.invalid(where, "name may hold only letters, digits, hyphens, and underscores");
        continue;
      }
      const o = r.object(value, where);
      if (o === null || !r.keys(o, where, ["hue", "chroma", "description"], ["hue", "chroma"])) continue;
      if (o["description"] !== undefined) r.optionalString(o["description"], `${where}.description`);
      const hue = r.number(o["hue"], `${where}.hue`, 0);
      const chroma = r.number(o["chroma"], `${where}.chroma`, 0);
      if (hue !== null && hue >= 360) r.invalid(`${where}.hue`, "is in degrees, below 360");
      else if (chroma !== null && chroma > 0.5) r.invalid(`${where}.chroma`, "is OKLCH chroma, at most 0.5");
      else if (hue !== null && chroma !== null) scales.push({ name, hue, chroma });
    }
  }

  // Where the files go. Paths stay inside the system folder.
  const insideFile = (value: Json | undefined, where: string): string | null => {
    const s = r.string(value, where);
    if (s === null) return null;
    const rel = relative(base, resolve(base, s));
    if (isAbsolute(s) || rel.startsWith("..") || rel === "") return r.invalid(where, `"${s}" must be a file inside the system folder`);
    if (!s.endsWith(".json")) return r.invalid(where, `"${s}" must be a .json file`);
    return s;
  };
  let scalesFile = "";
  let group = "";
  const roleFiles: Record<string, string> = {};
  const output = raw["output"] === undefined ? null : r.object(raw["output"], "output");
  if (output !== null && r.keys(output, "output", ["scales", "roles"], ["scales", "roles"])) {
    const so = r.object(output["scales"], "output.scales");
    if (so !== null && r.keys(so, "output.scales", ["file", "group"], ["file", "group"])) {
      scalesFile = insideFile(so["file"], "output.scales.file") ?? "";
      const g = r.string(so["group"], "output.scales.group");
      if (g !== null && !TOKEN_PATH.test(g)) r.invalid("output.scales.group", `"${g}" must be a token path: names of letters, digits, hyphens, and underscores, joined by dots`);
      else if (g !== null) group = g;
    }
    const ro = r.object(output["roles"], "output.roles");
    if (ro !== null) {
      for (const [value, file] of Object.entries(ro)) {
        const f = insideFile(file, `output.roles.${value}`);
        if (f !== null) roleFiles[value] = f;
      }
    }
    const files = [scalesFile, ...Object.values(roleFiles)].filter((f) => f !== "").map((f) => resolve(base, f));
    if (new Set(files).size !== files.length) r.invalid("output", "names one file twice; each output file holds one thing");
  }

  // The roles.
  const roles: ColorRole[] = [];
  const rolesObj = raw["roles"] === undefined ? null : r.object(raw["roles"], "roles");
  if (rolesObj !== null) {
    if (Object.keys(rolesObj).length === 0) r.invalid("roles", "must declare at least one role");
    const scaleNames = new Set(scales.map((sc) => sc.name));
    for (const [path, value] of Object.entries(rolesObj)) {
      const where = `roles.${path}`;
      if (!TOKEN_PATH.test(path)) {
        r.invalid(where, "must be a token path: names of letters, digits, hyphens, and underscores, joined by dots");
        continue;
      }
      if (group !== "" && (path === group || path.startsWith(`${group}.`))) {
        r.invalid(where, `is inside ${group}, the group the scales are written to`);
        continue;
      }
      const o = r.object(value, where);
      if (o === null || !r.keys(o, where, ["scale", "steps", "description"], ["scale", "steps"])) continue;
      if (o["description"] !== undefined) r.optionalString(o["description"], `${where}.description`);
      const scale = r.string(o["scale"], `${where}.scale`);
      if (scale !== null && scalesObj !== null && !scaleNames.has(scale)) {
        r.invalid(`${where}.scale`, `names scale "${scale}", which is not declared`);
        continue;
      }
      const stepsObj = r.object(o["steps"], `${where}.steps`);
      if (scale === null || stepsObj === null) continue;
      const chosen: Record<string, string> = {};
      let ok = true;
      for (const [value, step] of Object.entries(stepsObj)) {
        const sname = r.string(step, `${where}.steps.${value}`);
        if (sname === null) ok = false;
        else if (steps.length > 0 && !steps.includes(sname)) {
          r.invalid(`${where}.steps.${value}`, `names step "${sname}", which is not in the ladder`);
          ok = false;
        } else chosen[value] = sname;
      }
      if (ok) roles.push({ path, scale, steps: chosen });
    }
    const paths = roles.map((x) => x.path);
    for (const p of paths) {
      const inner = paths.find((q) => q.startsWith(`${p}.`));
      if (inner !== undefined) r.invalid(`roles.${p}`, `is a role and also the group that holds ${inner}; a token cannot be both`);
    }
  }

  return {
    ok: true,
    spec: { path, gamut, ladder: { steps, lightest, darkest }, margin, scales, output: { scales: { file: scalesFile, group }, roles: roleFiles }, roles },
    findings,
  };
}

// shadcn.virtu.json, the shadcn/ui adapter's file. A missing file or one that
// is not JSON is unreadable. Any other shape problem is a build.shadcn-invalid
// finding, and virtu build --target shadcn refuses while there is one.

export function loadShadcnMap(dir: string): ShadcnMapResult {
  const path = join(resolve(dir), SHADCN_FILE);
  let raw: Json;
  try {
    raw = readJson(path, "shadcn map file");
  } catch (error) {
    if (error instanceof Unreadable) return { ok: false, error: error.message };
    throw error;
  }
  if (!isObject(raw)) return { ok: false, error: `shadcn map file is not a JSON object: ${path}` };
  const findings: Finding[] = [];
  const r = makeReader(findings, SHADCN_FILE, "build.shadcn-invalid");
  r.keys(raw, "root", ["$schema", "virtu-shadcn", "description", "dark", "variables"], ["virtu-shadcn", "variables"]);
  if ("virtu-shadcn" in raw && raw["virtu-shadcn"] !== SHADCN_FORMAT_VERSION) {
    r.invalid("virtu-shadcn", `must be "${SHADCN_FORMAT_VERSION}", the only adapter format version`);
  }
  if (raw["description"] !== undefined) r.optionalString(raw["description"], "description");
  const dark = raw["dark"] === undefined ? null : r.string(raw["dark"], "dark");
  const given = new Map<string, string>();
  const vars = raw["variables"] === undefined ? null : r.object(raw["variables"], "variables");
  if (vars !== null) {
    for (const [name, value] of Object.entries(vars)) {
      const where = `variables.${name}`;
      if (!SHADCN_VARIABLES.includes(name)) {
        r.invalid(where, `is not a shadcn/ui theme variable; they are ${SHADCN_VARIABLES.join(", ")}`);
        continue;
      }
      const token = r.string(value, where);
      if (token === null) continue;
      if (!TOKEN_PATH.test(token)) r.invalid(where, `"${token}" must be a token path: names of letters, digits, hyphens, and underscores, joined by dots`);
      else given.set(name, token);
    }
  }
  const variables = SHADCN_VARIABLES.filter((n) => given.has(n)).map((name) => ({ name, token: given.get(name) ?? "" }));
  return { ok: true, map: { path, dark, variables }, findings };
}

// Background declarations, <name>.background.json. The shape follows
// schema/background.schema.json; token paths are checked against the system
// in background.ts. A missing path or a file that is not JSON is unreadable.
// A declaration with any shape problem is reported and dropped.

/** Every *.background.json in the files and folders given, folders searched recursively, in sorted order. */
export function findBackgrounds(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, BACKGROUND_SUFFIX);
}

/** Every file ending in suffix in the files and folders given, folders searched recursively, in sorted order. */
function findFiles(paths: string[], suffix: string): { ok: true; files: string[] } | { ok: false; error: string } {
  const files: string[] = [];
  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules" && !entry.name.startsWith(".")) walk(full);
      else if (entry.isFile() && entry.name.endsWith(suffix)) files.push(full);
    }
  };
  for (const given of paths) {
    const path = resolve(given);
    let isDir: boolean;
    try {
      isDir = statSync(path).isDirectory();
    } catch {
      return { ok: false, error: `not found: ${given}` };
    }
    if (isDir) walk(path);
    else if (path.endsWith(suffix)) files.push(path);
    else return { ok: false, error: `${given} is not a ${suffix} file` };
  }
  return { ok: true, files: [...new Set(files)] };
}

const BACKGROUND_KEYS = ["$schema", "virtu-background", "name", "description", "cost", "fills", "foreground", "fallback"] as const;
const BACKGROUND_REQUIRED = ["virtu-background", "name", "cost", "fills", "foreground", "fallback"] as const;
const FILL_KEYS: Record<(typeof FILL_TYPES)[number], { allowed: readonly string[]; required: readonly string[] }> = {
  solid: { allowed: ["type", "color", "opacity"], required: ["type", "color"] },
  gradient: { allowed: ["type", "interpolation", "stops", "opacity"], required: ["type", "interpolation", "stops"] },
  pattern: { allowed: ["type", "color", "opacity"], required: ["type", "color", "opacity"] },
  noise: { allowed: ["type", "color", "opacity"], required: ["type", "color", "opacity"] },
};

export function loadBackgrounds(files: string[]): BackgroundsResult {
  const backgrounds: Background[] = [];
  const findings: Finding[] = [];
  const names = new Map<string, string>();
  for (const path of files) {
    let raw: Json;
    try {
      raw = readJson(path, "background declaration");
    } catch (error) {
      if (error instanceof Unreadable) return { ok: false, error: error.message };
      throw error;
    }
    const own: Finding[] = [];
    const bg = readBackground(raw, path, own);
    findings.push(...own);
    if (bg === null || own.length > 0) continue;
    const prev = names.get(bg.name);
    if (prev !== undefined) {
      findings.push({
        severity: "error",
        layer: "background",
        rule: "background.invalid",
        message: `${path} name: "${bg.name}" is also the name of ${prev}`,
        entities: [bg.name],
      });
      continue;
    }
    names.set(bg.name, path);
    backgrounds.push(bg);
  }
  return { ok: true, backgrounds, findings };
}

function readBackground(raw: Json, path: string, findings: Finding[]): Background | null {
  const file = path.slice(path.lastIndexOf("/") + 1);
  const r = makeReader(findings, path, "background.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", BACKGROUND_KEYS, BACKGROUND_REQUIRED);
  if ("virtu-background" in raw && raw["virtu-background"] !== BACKGROUND_FORMAT_VERSION) {
    r.invalid("virtu-background", `must be "${BACKGROUND_FORMAT_VERSION}", the only background format version`);
  }
  const name = raw["name"] === undefined ? null : r.string(raw["name"], "name");
  const want = file.slice(0, -BACKGROUND_SUFFIX.length);
  if (name !== null && name !== want) r.invalid("name", `"${name}" must be the file's name without ${BACKGROUND_SUFFIX}, "${want}"`);
  const description = r.optionalString(raw["description"], "description");
  let cost: BackgroundCost | null = null;
  if (raw["cost"] !== undefined) {
    const c = r.string(raw["cost"], "cost");
    const known = BACKGROUND_COSTS.find((k) => k === c);
    if (c !== null && known === undefined) r.invalid("cost", `"${c}" is not a cost class; they are ${BACKGROUND_COSTS.join(", ")}`);
    cost = known ?? null;
  }
  const tokenPath = (value: Json | undefined, where: string): string | null => {
    const s = r.string(value, where);
    if (s === null) return null;
    if (!TOKEN_PATH.test(s)) return r.invalid(where, `"${s}" must be a token path (names joined by dots); a background names colors by token, never as literals`);
    return s;
  };
  const opacity = (value: Json | undefined, where: string, fallback: number | null): number | null => {
    if (value === undefined) return fallback;
    const n = r.number(value, where, 0);
    if (n !== null && n > 1) return r.invalid(where, "must be at most 1");
    return n;
  };
  const paint = (value: Json | undefined, where: string, required: boolean): BackgroundPaint | null => {
    const color = tokenPath(isObject(value) ? value["color"] : undefined, `${where}.color`);
    const o = opacity(isObject(value) ? value["opacity"] : undefined, `${where}.opacity`, required ? null : 1);
    return color === null || o === null ? null : { color, opacity: o };
  };
  const fills: BackgroundFill[] = [];
  if (raw["fills"] !== undefined) {
    const list = raw["fills"];
    if (!Array.isArray(list) || list.length === 0) r.invalid("fills", "must be a non-empty array");
    else {
      for (const [i, item] of list.entries()) {
        const where = `fills[${i}]`;
        const fill = r.object(item, where);
        if (fill === null) continue;
        const type = FILL_TYPES.find((t) => t === fill["type"]);
        if (type === undefined) {
          r.invalid(`${where}.type`, `must be one of ${FILL_TYPES.join(", ")}`);
          continue;
        }
        r.keys(fill, where, FILL_KEYS[type].allowed, FILL_KEYS[type].required);
        if (type === "gradient") {
          const interpolation = INTERPOLATIONS.find((s) => s === fill["interpolation"]);
          if (fill["interpolation"] !== undefined && interpolation === undefined) {
            r.invalid(`${where}.interpolation`, `must be one of ${INTERPOLATIONS.join(", ")}`);
          }
          const stops: BackgroundPaint[] = [];
          const given = fill["stops"];
          if (!Array.isArray(given) || given.length < 2) r.invalid(`${where}.stops`, "must be an array of at least two stops");
          else {
            for (const [j, stop] of given.entries()) {
              const sw = `${where}.stops[${j}]`;
              const so = r.object(stop, sw);
              if (so === null) continue;
              r.keys(so, sw, ["color", "opacity"], ["color"]);
              const p = paint(so, sw, false);
              if (p !== null) stops.push(p);
            }
          }
          const o = opacity(fill["opacity"], `${where}.opacity`, 1);
          if (interpolation !== undefined && o !== null) fills.push({ type, interpolation, stops, opacity: o });
        } else {
          const p = paint(fill, where, type !== "solid");
          if (p !== null) fills.push({ type, ...p });
        }
      }
    }
  }
  const foreground: Array<{ token: string; min: number }> = [];
  if (raw["foreground"] !== undefined) {
    const fg = r.object(raw["foreground"], "foreground");
    if (fg !== null && Object.keys(fg).length === 0) r.invalid("foreground", "must name at least one token");
    for (const [token, min] of Object.entries(fg ?? {})) {
      const where = `foreground.${token}`;
      if (!TOKEN_PATH.test(token)) {
        r.invalid(where, `"${token}" must be a token path (names joined by dots)`);
        continue;
      }
      const n = r.number(min, where, 1);
      if (n !== null) foreground.push({ token, min: n });
    }
  }
  const fallback = raw["fallback"] === undefined ? null : tokenPath(raw["fallback"], "fallback");
  if (name === null || cost === null || fallback === null) return null;
  return { path, name, description, cost, fills, foreground, fallback };
}

// Type declarations, <name>.type.json. The shape follows
// schema/type.schema.json; token paths are checked against the system in
// type.ts. A missing path or a file that is not JSON is unreadable. A
// declaration with any shape problem is reported and dropped.

/** Every *.type.json in the files and folders given, folders searched recursively, in sorted order. */
export function findTypes(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, TYPE_SUFFIX);
}

const TYPE_KEYS = ["$schema", "virtu-type", "name", "description", "roles", "scale"] as const;
const TYPE_REQUIRED = ["virtu-type", "name", "roles", "scale"] as const;
const FACE_KEYS = ["family", "fallback", "license", "source", "weights", "metrics", "token"] as const;
const FACE_REQUIRED = ["family", "fallback", "license", "source", "weights", "metrics"] as const;
const METRIC_KEYS = ["unitsPerEm", "capHeight", "xHeight", "ascender", "descender"] as const;
const SCALE_KEYS = ["ratio", "tolerance", "viewport", "body", "measure", "steps"] as const;
const STEP_KEYS = ["name", "size", "lineHeight", "token"] as const;
const GOOGLE_IMPORT = /^[A-Z][A-Za-z0-9_]*$/;
const FONTSOURCE = /^@fontsource(-variable)?\/[a-z0-9-]+$/;
const SPDX = /^[A-Za-z0-9.+-]+$/;

export function loadTypes(files: string[]): TypesResult {
  const types: TypeDecl[] = [];
  const findings: Finding[] = [];
  const names = new Map<string, string>();
  for (const path of files) {
    let raw: Json;
    try {
      raw = readJson(path, "type declaration");
    } catch (error) {
      if (error instanceof Unreadable) return { ok: false, error: error.message };
      throw error;
    }
    const own: Finding[] = [];
    const decl = readType(raw, path, own);
    findings.push(...own);
    if (decl === null || own.length > 0) continue;
    const prev = names.get(decl.name);
    if (prev !== undefined) {
      findings.push({ severity: "error", layer: "type", rule: "type.invalid", message: `${path} name: "${decl.name}" is also the name of ${prev}`, entities: [decl.name] });
      continue;
    }
    names.set(decl.name, path);
    types.push(decl);
  }
  return { ok: true, types, findings };
}

function readType(raw: Json, path: string, findings: Finding[]): TypeDecl | null {
  const file = path.slice(path.lastIndexOf("/") + 1);
  const r = makeReader(findings, path, "type.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", TYPE_KEYS, TYPE_REQUIRED);
  if ("virtu-type" in raw && raw["virtu-type"] !== TYPE_FORMAT_VERSION) r.invalid("virtu-type", `must be "${TYPE_FORMAT_VERSION}", the only type format version`);
  const name = raw["name"] === undefined ? null : r.string(raw["name"], "name");
  const want = file.slice(0, -TYPE_SUFFIX.length);
  if (name !== null && name !== want) r.invalid("name", `"${name}" must be the file's name without ${TYPE_SUFFIX}, "${want}"`);
  const description = r.optionalString(raw["description"], "description");

  const bound = new Map<string, string>();
  const token = (value: Json | undefined, where: string): string | null => {
    if (value === undefined) return null;
    const s = r.string(value, where);
    if (s === null) return null;
    if (!TOKEN_PATH.test(s)) return r.invalid(where, `"${s}" must be a token path (names joined by dots)`);
    const prev = bound.get(s);
    if (prev !== undefined) return r.invalid(where, `binds ${s}, which ${prev} also binds; one token takes one value`);
    bound.set(s, where);
    return s;
  };
  const positive = (value: Json | undefined, where: string): number | null => {
    const n = r.number(value, where, 0);
    if (n !== null && n <= 0) return r.invalid(where, "must be above 0");
    return n;
  };
  const pair = (value: Json | undefined, where: string): { min: number; max: number } | null => {
    const o = r.object(value, where);
    if (o === null) return null;
    r.keys(o, where, ["min", "max"], ["min", "max"]);
    const min = positive(o["min"], `${where}.min`);
    const max = positive(o["max"], `${where}.max`);
    return min === null || max === null ? null : { min, max };
  };

  const roles: Partial<Record<TypeRole, TypeFace>> = {};
  const rolesRaw = raw["roles"] === undefined ? null : r.object(raw["roles"], "roles");
  if (rolesRaw !== null) {
    r.keys(rolesRaw, "roles", TYPE_ROLES, ["display", "body"]);
    for (const role of TYPE_ROLES) {
      if (rolesRaw[role] === undefined) continue;
      const face = readFace(rolesRaw[role], `roles.${role}`, r, token);
      if (face !== null) roles[role] = face;
    }
  }

  let scale: TypeScale | null = null;
  const s = raw["scale"] === undefined ? null : r.object(raw["scale"], "scale");
  if (s !== null) {
    r.keys(s, "scale", SCALE_KEYS, ["body", "steps"]);
    const viewport = s["viewport"] === undefined ? null : pair(s["viewport"], "scale.viewport");
    if (viewport !== null && viewport.min >= viewport.max) r.invalid("scale.viewport", "min must be below max");
    const fluid = s["viewport"] !== undefined;
    let ratio: TypeScale["ratio"] = null;
    if (typeof s["ratio"] === "number") {
      ratio = positive(s["ratio"], "scale.ratio");
    } else if (s["ratio"] !== undefined) {
      if (!fluid) r.invalid("scale.ratio", "must be a number; a ratio at each end needs a fluid scale (scale.viewport)");
      else ratio = pair(s["ratio"], "scale.ratio");
    }
    let tolerance = 0;
    if (s["ratio"] !== undefined) {
      if (s["tolerance"] === undefined) r.invalid("scale", 'is missing required key "tolerance", which a ratio needs');
      else tolerance = r.number(s["tolerance"], "scale.tolerance", 0) ?? 0;
    } else if (s["tolerance"] !== undefined) r.invalid("scale.tolerance", "means nothing without a ratio");
    const measure = s["measure"] === undefined ? null : positive(s["measure"], "scale.measure");
    const steps: TypeStep[] = [];
    const list = s["steps"];
    if (list !== undefined && (!Array.isArray(list) || list.length === 0)) r.invalid("scale.steps", "must be a non-empty array");
    const seen = new Set<string>();
    for (const [i, item] of (Array.isArray(list) ? list : []).entries()) {
      const where = `scale.steps[${i}]`;
      const step = r.object(item, where);
      if (step === null) continue;
      r.keys(step, where, STEP_KEYS, ["name", "size", "lineHeight"]);
      const stepName = r.string(step["name"], `${where}.name`);
      if (stepName !== null && !NAME.test(stepName)) r.invalid(`${where}.name`, `"${stepName}" must be letters, digits, hyphens, and underscores`);
      if (stepName !== null && seen.has(stepName)) r.invalid(`${where}.name`, `"${stepName}" names two steps`);
      if (stepName !== null) seen.add(stepName);
      let size: TypeSize | null = null;
      if (fluid) {
        if (typeof step["size"] === "number") r.invalid(`${where}.size`, "must be { min, max } in a fluid scale");
        else size = pair(step["size"], `${where}.size`);
      } else if (isObject(step["size"])) r.invalid(`${where}.size`, "must be a number of px; { min, max } needs a fluid scale (scale.viewport)");
      else size = positive(step["size"], `${where}.size`);
      const lineHeight = positive(step["lineHeight"], `${where}.lineHeight`);
      if (lineHeight !== null && lineHeight > 3) r.invalid(`${where}.lineHeight`, "must be at most 3, a unitless multiple of the size");
      const t = token(step["token"], `${where}.token`);
      if (stepName !== null && size !== null && lineHeight !== null) steps.push({ name: stepName, size, lineHeight, token: t });
    }
    const body = r.string(s["body"], "scale.body");
    if (body !== null && Array.isArray(list) && !seen.has(body)) r.invalid("scale.body", `"${body}" is not the name of a step`);
    if (body !== null) scale = { ratio, tolerance, viewport, body, measure, steps };
  }

  if (name === null || scale === null || roles.display === undefined || roles.body === undefined) return null;
  return { path, name, description, roles, scale };
}

function readFace(value: Json | undefined, where: string, r: Reader, token: (value: Json | undefined, where: string) => string | null): TypeFace | null {
  const o = r.object(value, where);
  if (o === null) return null;
  r.keys(o, where, FACE_KEYS, FACE_REQUIRED);
  const family = r.string(o["family"], `${where}.family`);
  const fallback = r.strings(o["fallback"], `${where}.fallback`);
  const license = r.string(o["license"], `${where}.license`);
  if (license !== null && !SPDX.test(license)) r.invalid(`${where}.license`, `"${license}" must be an SPDX license id, such as OFL-1.1`);
  let source: TypeFace["source"] | null = null;
  const so = r.object(o["source"], `${where}.source`);
  if (so !== null) {
    r.keys(so, `${where}.source`, ["google", "fontsource"], ["google", "fontsource"]);
    const google = r.string(so["google"], `${where}.source.google`);
    const fontsource = r.string(so["fontsource"], `${where}.source.fontsource`);
    if (google !== null && !GOOGLE_IMPORT.test(google)) r.invalid(`${where}.source.google`, `"${google}" must be a next/font/google import name, such as JetBrains_Mono`);
    if (fontsource !== null && !FONTSOURCE.test(fontsource)) r.invalid(`${where}.source.fontsource`, `"${fontsource}" must be a Fontsource package, such as @fontsource-variable/inter`);
    if (google !== null && fontsource !== null) source = { google, fontsource };
  }
  const weights: number[] = [];
  const wl = o["weights"];
  if (!Array.isArray(wl) || wl.length === 0) r.invalid(`${where}.weights`, "must be a non-empty array of weights");
  else {
    for (const [i, w] of wl.entries()) {
      const n = r.number(w, `${where}.weights[${i}]`, 1, true);
      if (n !== null && n > 1000) r.invalid(`${where}.weights[${i}]`, "must be at most 1000");
      else if (n !== null && weights.includes(n)) r.invalid(`${where}.weights[${i}]`, `${n} is listed twice`);
      else if (n !== null) weights.push(n);
    }
  }
  let metrics: FontMetrics | null = null;
  const mo = r.object(o["metrics"], `${where}.metrics`);
  if (mo !== null) {
    r.keys(mo, `${where}.metrics`, METRIC_KEYS, METRIC_KEYS);
    const unitsPerEm = r.number(mo["unitsPerEm"], `${where}.metrics.unitsPerEm`, 16, true);
    const capHeight = r.number(mo["capHeight"], `${where}.metrics.capHeight`, 1);
    const xHeight = r.number(mo["xHeight"], `${where}.metrics.xHeight`, 1);
    const ascender = r.number(mo["ascender"], `${where}.metrics.ascender`, 1);
    const d = mo["descender"];
    const descender = typeof d === "number" && d > 0 ? r.invalid(`${where}.metrics.descender`, "must be 0 or below, as hhea gives it") : r.number(d, `${where}.metrics.descender`, -Infinity);
    if (unitsPerEm !== null && capHeight !== null && xHeight !== null && ascender !== null && descender !== null) {
      if (xHeight >= capHeight) r.invalid(`${where}.metrics`, "xHeight must be below capHeight");
      else metrics = { unitsPerEm, capHeight, xHeight, ascender, descender };
    }
  }
  const t = token(o["token"], `${where}.token`);
  if (family === null || fallback === null || license === null || source === null || metrics === null || weights.length === 0) return null;
  return { family, fallback, license, source, weights, metrics, token: t };
}

// Motion declarations, <name>.motion.json. The shape follows
// schema/motion.schema.json; token paths are checked against the system in
// motion.ts. A missing path or a file that is not JSON is unreadable. A
// declaration with any shape problem is reported and dropped.

/** Every *.motion.json in the files and folders given, folders searched recursively, in sorted order. */
export function findMotions(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, MOTION_SUFFIX);
}

const MOTION_KEYS = ["$schema", "virtu-motion", "name", "description", "bounds", "durations", "easings", "transitions"] as const;
const MOTION_REQUIRED = ["virtu-motion", "name", "bounds", "durations", "easings", "transitions"] as const;
const TRANSITION_KEYS = ["duration", "easing", "properties", "iterations", "pausable", "reduced"] as const;
const VARIANT_KEYS = ["duration", "easing", "properties"] as const;

export function loadMotions(files: string[]): MotionResult {
  const motions: MotionDecl[] = [];
  const findings: Finding[] = [];
  const names = new Map<string, string>();
  for (const path of files) {
    let raw: Json;
    try {
      raw = readJson(path, "motion declaration");
    } catch (error) {
      if (error instanceof Unreadable) return { ok: false, error: error.message };
      throw error;
    }
    const own: Finding[] = [];
    const decl = readMotion(raw, path, own);
    findings.push(...own);
    if (decl === null || own.length > 0) continue;
    const prev = names.get(decl.name);
    if (prev !== undefined) {
      findings.push({ severity: "error", layer: "motion", rule: "motion.invalid", message: `${path} name: "${decl.name}" is also the name of ${prev}`, entities: [decl.name] });
      continue;
    }
    names.set(decl.name, path);
    motions.push(decl);
  }
  return { ok: true, motions, findings };
}

function readMotion(raw: Json, path: string, findings: Finding[]): MotionDecl | null {
  const file = path.slice(path.lastIndexOf("/") + 1);
  const r = makeReader(findings, path, "motion.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", MOTION_KEYS, MOTION_REQUIRED);
  if ("virtu-motion" in raw && raw["virtu-motion"] !== MOTION_FORMAT_VERSION) r.invalid("virtu-motion", `must be "${MOTION_FORMAT_VERSION}", the only motion format version`);
  const name = raw["name"] === undefined ? null : r.string(raw["name"], "name");
  const want = file.slice(0, -MOTION_SUFFIX.length);
  if (name !== null && name !== want) r.invalid("name", `"${name}" must be the file's name without ${MOTION_SUFFIX}, "${want}"`);
  const description = r.optionalString(raw["description"], "description");

  const bound = new Map<string, string>();
  const token = (value: Json | undefined, where: string): string | null => {
    if (value === undefined) return null;
    const s = r.string(value, where);
    if (s === null) return null;
    if (!TOKEN_PATH.test(s)) return r.invalid(where, `"${s}" must be a token path (names joined by dots)`);
    const prev = bound.get(s);
    if (prev !== undefined) return r.invalid(where, `binds ${s}, which ${prev} also binds; one token takes one value`);
    bound.set(s, where);
    return s;
  };
  const named = (value: Json | undefined, where: string): Array<[string, JsonObject]> => {
    const o = value === undefined ? null : r.object(value, where);
    if (o === null) return [];
    const entries = Object.entries(o);
    if (entries.length === 0) r.invalid(where, "must name at least one entry");
    const out: Array<[string, JsonObject]> = [];
    for (const [key, v] of entries) {
      if (!NAME.test(key)) {
        r.invalid(`${where}.${key}`, "a name must be letters, digits, hyphens, and underscores");
        continue;
      }
      const entry = r.object(v, `${where}.${key}`);
      if (entry !== null) out.push([key, entry]);
    }
    return out;
  };

  let bounds: MotionDecl["bounds"] | null = null;
  const bo = raw["bounds"] === undefined ? null : r.object(raw["bounds"], "bounds");
  if (bo !== null) {
    r.keys(bo, "bounds", ["min", "max"], ["min", "max"]);
    const min = r.number(bo["min"], "bounds.min", 0);
    const max = r.number(bo["max"], "bounds.max", 0);
    if (min !== null && max !== null && min >= max) r.invalid("bounds", "min must be below max");
    else if (min !== null && max !== null) bounds = { min, max };
  }

  const durations: MotionDuration[] = [];
  for (const [key, o] of named(raw["durations"], "durations")) {
    const where = `durations.${key}`;
    r.keys(o, where, ["ms", "token"], ["ms"]);
    const ms = r.number(o["ms"], `${where}.ms`, 0);
    const t = token(o["token"], `${where}.token`);
    if (ms !== null) durations.push({ name: key, ms, token: t });
  }

  const easings: MotionEasing[] = [];
  for (const [key, o] of named(raw["easings"], "easings")) {
    const where = `easings.${key}`;
    r.keys(o, where, ["cubicBezier", "token"], ["cubicBezier"]);
    const list = o["cubicBezier"];
    const t = token(o["token"], `${where}.token`);
    if (!Array.isArray(list) || list.length !== 4 || list.some((x) => typeof x !== "number" || !Number.isFinite(x))) {
      r.invalid(`${where}.cubicBezier`, "must be an array of four numbers, x1, y1, x2, y2, as DTCG's cubicBezier type");
      continue;
    }
    const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = list as number[];
    easings.push({ name: key, points: [x1, y1, x2, y2], token: t });
  }

  const durationNames = new Set(durations.map((d) => d.name));
  const easingNames = new Set(easings.map((e) => e.name));
  const ref = (value: Json | undefined, where: string, known: Set<string>, what: string): string | null => {
    const s = r.string(value, where);
    if (s === null) return null;
    if (!known.has(s)) return r.invalid(where, `"${s}" is not one of the declaration's ${what}`);
    return s;
  };
  const properties = (value: Json | undefined, where: string, allowEmpty: boolean): MotionProperty[] | null => {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return r.invalid(where, allowEmpty ? "must be an array of CSS properties" : "must be a non-empty array of CSS properties");
    const out: MotionProperty[] = [];
    for (const [i, p] of value.entries()) {
      if (typeof p !== "string" || !(MOTION_PROPERTIES as readonly string[]).includes(p)) {
        r.invalid(`${where}[${i}]`, `must be one of ${MOTION_PROPERTIES.join(", ")}`);
        return null;
      }
      if (out.includes(p as MotionProperty)) {
        r.invalid(`${where}[${i}]`, `${p} is listed twice`);
        return null;
      }
      out.push(p as MotionProperty);
    }
    return out;
  };

  const transitions: MotionTransition[] = [];
  for (const [key, o] of named(raw["transitions"], "transitions")) {
    const where = `transitions.${key}`;
    r.keys(o, where, TRANSITION_KEYS, ["duration", "easing", "properties", "reduced"]);
    const duration = ref(o["duration"], `${where}.duration`, durationNames, "durations");
    const easing = ref(o["easing"], `${where}.easing`, easingNames, "easings");
    const props = properties(o["properties"], `${where}.properties`, false);
    let iterations: MotionTransition["iterations"] | null = 1;
    const it = o["iterations"];
    if (it === "infinite") iterations = "infinite";
    else if (it !== undefined) iterations = r.number(it, `${where}.iterations`, 1, true);
    let pausable = false;
    if (o["pausable"] !== undefined) {
      if (typeof o["pausable"] !== "boolean") r.invalid(`${where}.pausable`, "must be true or false");
      else pausable = o["pausable"];
    }
    let reduced: MotionVariant | null = null;
    const ro = o["reduced"] === undefined ? null : r.object(o["reduced"], `${where}.reduced`);
    if (ro !== null) {
      r.keys(ro, `${where}.reduced`, VARIANT_KEYS, ["properties"]);
      const rp = properties(ro["properties"], `${where}.reduced.properties`, true);
      if (rp !== null && rp.length === 0) {
        if (ro["duration"] !== undefined || ro["easing"] !== undefined) r.invalid(`${where}.reduced`, "animates nothing, so it takes no duration or easing");
        else reduced = { duration: null, easing: null, properties: [] };
      } else if (rp !== null) {
        if (iterations !== 1) {
          r.invalid(`${where}.reduced.properties`, "must be empty for a repeating transition: its keyframes are the app's, so CSS cannot take movement out of them, only stop them");
        } else {
          if (ro["duration"] === undefined) r.invalid(`${where}.reduced`, 'is missing required key "duration", which a variant that animates needs');
          if (ro["easing"] === undefined) r.invalid(`${where}.reduced`, 'is missing required key "easing", which a variant that animates needs');
          const rd = ro["duration"] === undefined ? null : ref(ro["duration"], `${where}.reduced.duration`, durationNames, "durations");
          const re = ro["easing"] === undefined ? null : ref(ro["easing"], `${where}.reduced.easing`, easingNames, "easings");
          if (rd !== null && re !== null) reduced = { duration: rd, easing: re, properties: rp };
        }
      }
    }
    if (duration !== null && easing !== null && props !== null && iterations !== null && reduced !== null) {
      transitions.push({ name: key, duration, easing, properties: props, iterations, pausable, reduced });
    }
  }

  if (name === null || bounds === null) return null;
  return { path, name, description, bounds, durations, easings, transitions };
}

// Icon declarations, <name>.icons.json. The shape follows
// schema/icons.schema.json; token paths are checked against the system, and
// icon names against the package's name list, in icons.ts. A missing path or a
// file that is not JSON is unreadable. A declaration with any shape problem is
// reported and dropped.

/** Every *.icons.json in the files and folders given, folders searched recursively, in sorted order. */
export function findIcons(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, ICONS_SUFFIX);
}

const ICONS_KEYS = ["$schema", "virtu-icons", "name", "description", "set", "grid", "stroke", "sizes", "colors", "surfaces", "meanings"] as const;
const ICONS_REQUIRED = ["virtu-icons", "name", "set", "grid", "sizes", "colors", "surfaces", "meanings"] as const;
const SET_KEYS = ["library", "package", "version", "license"] as const;
const NPM_PACKAGE = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;
const MEANING = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
const COMPONENT = /^[A-Z][A-Za-z0-9]*$/;

export function loadIcons(files: string[]): IconsResult {
  const icons: IconDecl[] = [];
  const findings: Finding[] = [];
  const names = new Map<string, string>();
  for (const path of files) {
    let raw: Json;
    try {
      raw = readJson(path, "icon declaration");
    } catch (error) {
      if (error instanceof Unreadable) return { ok: false, error: error.message };
      throw error;
    }
    const own: Finding[] = [];
    // JSON.parse keeps the last of two equal keys, so a meaning listed twice is found in the text.
    for (const dup of duplicateKeys(readFileSync(path, "utf8"))) {
      own.push({ severity: "error", layer: "icons", rule: "icons.invalid", message: `${path} ${dup}: is listed twice; JSON keeps only the last`, entities: [dup] });
    }
    const decl = readIcons(raw, path, own);
    findings.push(...own);
    if (decl === null || own.length > 0) continue;
    const prev = names.get(decl.name);
    if (prev !== undefined) {
      findings.push({ severity: "error", layer: "icons", rule: "icons.invalid", message: `${path} name: "${decl.name}" is also the name of ${prev}`, entities: [decl.name] });
      continue;
    }
    names.set(decl.name, path);
    icons.push(decl);
  }
  return { ok: true, icons, findings };
}

/** The dotted path of every key that appears twice in one object of a JSON text, which must parse. */
export function duplicateKeys(text: string): string[] {
  type Frame = { object: boolean; path: string; keys: Set<string>; expectKey: boolean; last: string };
  const stack: Frame[] = [];
  const out: string[] = [];
  const child = (): string => {
    const top = stack[stack.length - 1];
    if (top === undefined) return "";
    const own = top.object ? top.last : "[]";
    return top.path === "" ? own : `${top.path}.${own}`;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "{" || c === "[") stack.push({ object: c === "{", path: child(), keys: new Set(), expectKey: c === "{", last: "" });
    else if (c === "}" || c === "]") stack.pop();
    else if (c === ",") {
      const top = stack[stack.length - 1];
      if (top?.object === true) top.expectKey = true;
    } else if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      const top = stack[stack.length - 1];
      if (top?.object === true && top.expectKey) {
        const key = JSON.parse(text.slice(i, j + 1)) as string;
        if (top.keys.has(key)) out.push(top.path === "" ? key : `${top.path}.${key}`);
        top.keys.add(key);
        top.last = key;
        top.expectKey = false;
      }
      i = j;
    }
  }
  return out;
}

function readIcons(raw: Json, path: string, findings: Finding[]): IconDecl | null {
  const file = path.slice(path.lastIndexOf("/") + 1);
  const r = makeReader(findings, path, "icons.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", ICONS_KEYS, ICONS_REQUIRED);
  if ("virtu-icons" in raw && raw["virtu-icons"] !== ICONS_FORMAT_VERSION) r.invalid("virtu-icons", `must be "${ICONS_FORMAT_VERSION}", the only icons format version`);
  const name = raw["name"] === undefined ? null : r.string(raw["name"], "name");
  const want = file.slice(0, -ICONS_SUFFIX.length);
  if (name !== null && name !== want) r.invalid("name", `"${name}" must be the file's name without ${ICONS_SUFFIX}, "${want}"`);
  const description = r.optionalString(raw["description"], "description");

  let set: IconDecl["set"] | null = null;
  const so = raw["set"] === undefined ? null : r.object(raw["set"], "set");
  if (so !== null) {
    r.keys(so, "set", SET_KEYS, SET_KEYS);
    const library = r.string(so["library"], "set.library");
    const pkg = r.string(so["package"], "set.package");
    const version = r.string(so["version"], "set.version");
    const license = r.string(so["license"], "set.license");
    if (pkg !== null && !NPM_PACKAGE.test(pkg)) r.invalid("set.package", `"${pkg}" must be an npm package name`);
    if (version !== null && !EXACT_VERSION.test(version)) r.invalid("set.version", `"${version}" must be an exact version, such as 1.75.0, so the names it exports are known`);
    if (license !== null && !SPDX.test(license)) r.invalid("set.license", `"${license}" must be an SPDX license id, such as MIT`);
    if (library !== null && pkg !== null && version !== null && license !== null) set = { library, package: pkg, version, license };
  }
  const grid = raw["grid"] === undefined ? null : r.number(raw["grid"], "grid", 1, true);
  let stroke: number | null = null;
  if (raw["stroke"] !== undefined) {
    stroke = r.number(raw["stroke"], "stroke", 0);
    if (stroke !== null && stroke <= 0) stroke = r.invalid("stroke", "must be above 0; leave it out for a set drawn in fills");
  }
  const tokenPath = (value: Json | undefined, where: string): string | null => {
    const s = r.string(value, where);
    if (s !== null && !TOKEN_PATH.test(s)) return r.invalid(where, `"${s}" must be a token path (names joined by dots)`);
    return s;
  };
  const sizes: IconDecl["sizes"] = [];
  const sz = raw["sizes"] === undefined ? null : r.object(raw["sizes"], "sizes");
  if (sz !== null) {
    if (Object.keys(sz).length === 0) r.invalid("sizes", "must name at least one size");
    for (const [key, v] of Object.entries(sz)) {
      if (!NAME.test(key)) r.invalid(`sizes.${key}`, "a name must be letters, digits, hyphens, and underscores");
      const t = tokenPath(v, `sizes.${key}`);
      if (t !== null) sizes.push({ name: key, token: t });
    }
  }
  const tokenList = (value: Json | undefined, where: string): string[] => {
    const list = value === undefined ? null : r.strings(value, where);
    const out: string[] = [];
    for (const [i, s] of (list ?? []).entries()) {
      const t = tokenPath(s, `${where}[${i}]`);
      if (t !== null && out.includes(t)) r.invalid(`${where}[${i}]`, `${t} is listed twice`);
      else if (t !== null) out.push(t);
    }
    return out;
  };
  const colors = tokenList(raw["colors"], "colors");
  const tones = new Map<string, string>();
  for (const c of colors) {
    const tone = c.slice(c.lastIndexOf(".") + 1);
    const prev = tones.get(tone);
    if (prev !== undefined) r.invalid("colors", `${c} and ${prev} end in the same name, ${tone}, which the implementation uses as the tone's name`);
    tones.set(tone, c);
  }
  const surfaces = tokenList(raw["surfaces"], "surfaces");
  const meanings: IconDecl["meanings"] = [];
  const mo = raw["meanings"] === undefined ? null : r.object(raw["meanings"], "meanings");
  if (mo !== null) {
    if (Object.keys(mo).length === 0) r.invalid("meanings", "must map at least one meaning");
    for (const [meaning, v] of Object.entries(mo)) {
      const where = `meanings.${meaning}`;
      if (!MEANING.test(meaning)) r.invalid(where, "a meaning is lowercase names joined by dots, such as action.delete");
      if (Array.isArray(v)) {
        r.invalid(where, "maps to more than one icon; each meaning maps to exactly one");
        continue;
      }
      const icon = r.string(v, where);
      if (icon !== null && !COMPONENT.test(icon)) r.invalid(where, `"${icon}" must be the component name the package exports, such as Trash`);
      else if (icon !== null) meanings.push({ meaning, icon });
    }
  }
  if (name === null || set === null || grid === null) return null;
  return { path, name, description, set, grid, stroke, sizes, colors, surfaces, meanings };
}

/** The file name of a package's committed name list: @scope/name@1.0.0 is scope+name@1.0.0.json. */
export function iconListName(pkg: string, version: string): string {
  return `${pkg.replace(/^@/, "").replace("/", "+")}@${version}.json`;
}

/** The committed name list of a package at a version, or null when Virtu has none. Throws nothing: a list that is not valid is null too. */
export function loadIconNames(pkg: string, version: string, dir = ICON_NAMES_DIR): IconNameList | null {
  let raw: Json;
  try {
    raw = JSON.parse(readFileSync(join(dir, iconListName(pkg, version)), "utf8")) as Json;
  } catch {
    return null;
  }
  if (!isObject(raw)) return null;
  const { library, package: p, version: v, license, grid, stroke, names } = raw;
  if (typeof library !== "string" || p !== pkg || v !== version || typeof license !== "string" || typeof grid !== "number" || !isObject(stroke) || !Array.isArray(names)) return null;
  let s: IconNameList["stroke"];
  if (stroke["adjustable"] === true && typeof stroke["default"] === "number") s = { adjustable: true, default: stroke["default"] };
  else if (isObject(stroke["weights"])) {
    const weights: Record<string, number> = {};
    for (const [k, w] of Object.entries(stroke["weights"])) if (typeof w === "number") weights[k] = w;
    s = { weights };
  } else return null;
  return { library, package: pkg, version, license, grid, stroke: s, names: new Set(names.filter((n): n is string => typeof n === "string")) };
}

// Space declarations, <name>.space.json, and depth declarations,
// <name>.depth.json. Their shapes follow schema/space.schema.json and
// schema/depth.schema.json; token paths and contexts are checked against the
// system in space.ts and depth.ts. A missing path or a file that is not JSON
// is unreadable. A declaration with any shape problem is reported and dropped.

/** Every *.space.json in the files and folders given, folders searched recursively, in sorted order. */
export function findSpaces(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, SPACE_SUFFIX);
}

/** Every *.depth.json in the files and folders given, folders searched recursively, in sorted order. */
export function findDepths(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, DEPTH_SUFFIX);
}

/** The space scale's default maximum step count, when a declaration states none. */
export const SPACE_MAX_STEPS = 12;

/** Reads each file with read, dropping a declaration with any finding and one whose name another has. */
function loadEach<T extends { name: string }>(
  files: string[],
  what: string,
  rule: "space.invalid" | "depth.invalid" | "shape.invalid" | "ornament.invalid" | "season.invalid",
  read: (raw: Json, path: string, findings: Finding[]) => T | null,
): { ok: true; decls: T[]; findings: Finding[] } | { ok: false; error: string } {
  const decls: T[] = [];
  const findings: Finding[] = [];
  const names = new Map<string, string>();
  for (const path of files) {
    let raw: Json;
    try {
      raw = readJson(path, what);
    } catch (error) {
      if (error instanceof Unreadable) return { ok: false, error: error.message };
      throw error;
    }
    const own: Finding[] = [];
    const decl = read(raw, path, own);
    findings.push(...own);
    if (decl === null || own.length > 0) continue;
    const prev = names.get(decl.name);
    if (prev !== undefined) {
      findings.push({ severity: "error", layer: INVALID_LAYER[rule], rule, message: `${path} name: "${decl.name}" is also the name of ${prev}`, entities: [decl.name] });
      continue;
    }
    names.set(decl.name, path);
    decls.push(decl);
  }
  return { ok: true, decls, findings };
}

/** The header every registry declaration shares: the format version, the name (its file's name), and the description. */
function readHeader(
  raw: JsonObject,
  path: string,
  r: ReturnType<typeof makeReader>,
  versionKey: string,
  version: string,
  suffix: string,
): { name: string | null; description: string | null } {
  const file = path.slice(path.lastIndexOf("/") + 1);
  if (versionKey in raw && raw[versionKey] !== version) r.invalid(versionKey, `must be "${version}", the only format version`);
  const name = raw["name"] === undefined ? null : r.string(raw["name"], "name");
  const want = file.slice(0, -suffix.length);
  if (name !== null && name !== want) r.invalid("name", `"${name}" must be the file's name without ${suffix}, "${want}"`);
  return { name, description: r.optionalString(raw["description"], "description") };
}

/** A token path a declaration names. With bound, a path it binds, which it may bind once. */
function tokenReader(r: ReturnType<typeof makeReader>, bound?: Map<string, string>) {
  return (value: Json | undefined, where: string): string | null => {
    if (value === undefined) return null;
    const s = r.string(value, where);
    if (s === null) return null;
    if (!TOKEN_PATH.test(s)) return r.invalid(where, `"${s}" must be a token path (names joined by dots)`);
    if (bound !== undefined) {
      const prev = bound.get(s);
      if (prev !== undefined) return r.invalid(where, `binds ${s}, which ${prev} also binds; one token takes one value`);
      bound.set(s, where);
    }
    return s;
  };
}

const SPACE_KEYS = ["$schema", "virtu-space", "name", "description", "base", "grid", "tolerance", "maxSteps", "density", "steps", "targets"] as const;
const SPACE_REQUIRED = ["virtu-space", "name", "base", "steps"] as const;

export function loadSpaces(files: string[]): SpacesResult {
  const r = loadEach(files, "space declaration", "space.invalid", readSpace);
  return r.ok ? { ok: true, spaces: r.decls, findings: r.findings } : r;
}

function readSpace(raw: Json, path: string, findings: Finding[]): SpaceDecl | null {
  const r = makeReader(findings, path, "space.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", SPACE_KEYS, SPACE_REQUIRED);
  const { name, description } = readHeader(raw, path, r, "virtu-space", SPACE_FORMAT_VERSION, SPACE_SUFFIX);
  const positive = (value: Json | undefined, where: string): number | null => {
    const n = r.number(value, where, 0);
    if (n !== null && n <= 0) return r.invalid(where, "must be above 0");
    return n;
  };
  const base = raw["base"] === undefined ? null : positive(raw["base"], "base");
  const grid = raw["grid"] === undefined ? base : positive(raw["grid"], "grid");
  const tolerance = raw["tolerance"] === undefined ? 0 : r.number(raw["tolerance"], "tolerance", 0);
  const maxSteps = raw["maxSteps"] === undefined ? SPACE_MAX_STEPS : r.number(raw["maxSteps"], "maxSteps", 1, true);

  let density: SpaceDecl["density"] = null;
  let densityOk = true;
  if (raw["density"] !== undefined) {
    densityOk = false;
    const d = r.object(raw["density"], "density");
    if (d !== null) {
      r.keys(d, "density", ["context", "default", "values"], ["context", "default", "values"]);
      const context = d["context"] === undefined ? null : r.string(d["context"], "density.context");
      const def = d["default"] === undefined ? null : r.string(d["default"], "density.default");
      const vo = d["values"] === undefined ? null : r.object(d["values"], "density.values");
      const values: Record<string, SpaceDensityValue> = {};
      if (vo !== null) {
        if (Object.keys(vo).length < 2) r.invalid("density.values", "must name at least two density values");
        for (const [key, v] of Object.entries(vo)) {
          const where = `density.values.${key}`;
          const o = r.object(v, where);
          if (o === null) continue;
          r.keys(o, where, ["scale", "grid"], ["scale"]);
          const scale = positive(o["scale"], `${where}.scale`);
          const g = o["grid"] === undefined ? null : positive(o["grid"], `${where}.grid`);
          if (scale !== null) values[key] = { scale, grid: g };
        }
      }
      if (def !== null && vo !== null) {
        const dv = values[def];
        if (!(def in vo)) r.invalid("density.default", `"${def}" is not one of density.values`);
        else if (dv !== undefined && (dv.scale !== 1 || (dv.grid !== null && dv.grid !== grid))) {
          r.invalid(`density.values.${def}`, "is the default, so its scale is 1 and its grid, if stated, is the top-level grid");
        }
      }
      if (context !== null && def !== null && vo !== null) {
        density = { context, default: def, values };
        densityOk = true;
      }
    }
  }
  const densities = density === null ? null : Object.keys(density.values);

  const amount = (o: JsonObject, where: string): SpaceAmount | null => {
    const hasMultiple = o["multiple"] !== undefined;
    const hasPx = o["px"] !== undefined;
    if (hasMultiple === hasPx) return r.invalid(where, 'states exactly one of "multiple" and "px"');
    if (hasMultiple) {
      const m = positive(o["multiple"], `${where}.multiple`);
      return m === null ? null : { multiple: m };
    }
    const px = o["px"];
    if (typeof px === "number") {
      const n = positive(px, `${where}.px`);
      return n === null ? null : { px: n };
    }
    const po = r.object(px, `${where}.px`);
    if (po === null) return null;
    if (densities === null) return r.invalid(`${where}.px`, "gives a value per density, but the declaration states no density");
    const out: Record<string, number> = {};
    for (const key of Object.keys(po)) if (!densities.includes(key)) r.invalid(`${where}.px.${key}`, `is not one of density.values`);
    for (const key of densities) {
      if (!(key in po)) {
        r.invalid(`${where}.px`, `is missing a value for density ${key}`);
        continue;
      }
      const n = positive(po[key], `${where}.px.${key}`);
      if (n !== null) out[key] = n;
    }
    return Object.keys(out).length === densities.length ? { px: out } : null;
  };

  const bound = new Map<string, string>();
  const token = tokenReader(r, bound);
  const names = new Set<string>();
  const steps: SpaceStep[] = [];
  const list = raw["steps"];
  if (list !== undefined) {
    if (!Array.isArray(list) || list.length === 0) r.invalid("steps", "must be a non-empty array of steps, smallest first");
    else {
      for (const [i, item] of list.entries()) {
        const where = `steps[${i}]`;
        const o = r.object(item, where);
        if (o === null) continue;
        r.keys(o, where, ["name", "multiple", "px", "token"], ["name"]);
        const n = o["name"] === undefined ? null : r.string(o["name"], `${where}.name`);
        if (n !== null && !NAME.test(n)) r.invalid(`${where}.name`, "a name must be letters, digits, hyphens, and underscores");
        else if (n !== null && names.has(n)) r.invalid(`${where}.name`, `"${n}" names another step`);
        if (n !== null) names.add(n);
        const a = amount(o, where);
        const t = token(o["token"], `${where}.token`);
        if (n !== null && a !== null) steps.push({ name: n, amount: a, token: t });
      }
    }
  }

  const targets: SpaceTarget[] = [];
  if (raw["targets"] !== undefined) {
    const to = r.object(raw["targets"], "targets");
    if (to !== null) {
      for (const [key, v] of Object.entries(to)) {
        const where = `targets.${key}`;
        if (!NAME.test(key)) {
          r.invalid(where, "a name must be letters, digits, hyphens, and underscores");
          continue;
        }
        const o = r.object(v, where);
        if (o === null) continue;
        r.keys(o, where, ["multiple", "px", "level", "token"], []);
        let level: TargetLevel | null = "minimum";
        if (o["level"] !== undefined) {
          const l = o["level"];
          if (typeof l !== "string" || !(TARGET_LEVELS as readonly string[]).includes(l)) level = r.invalid(`${where}.level`, `must be one of ${TARGET_LEVELS.join(", ")}`);
          else level = l as TargetLevel;
        }
        const a = amount(o, where);
        const t = token(o["token"], `${where}.token`);
        if (a !== null && level !== null) targets.push({ name: key, amount: a, level, token: t });
      }
    }
  }

  if (name === null || base === null || grid === null || tolerance === null || maxSteps === null || !densityOk) return null;
  return { path, name, description, base, grid, tolerance, maxSteps, density, steps, targets };
}

const DEPTH_KEYS = ["$schema", "virtu-depth", "name", "description", "theme", "stacking", "foreground", "levels", "placements", "stacks"] as const;
const DEPTH_REQUIRED = ["virtu-depth", "name", "stacking", "foreground", "levels"] as const;
const LEVEL_KEYS = ["name", "surface", "shadow", "token", "border", "boundary"] as const;
const LAYER_KEYS = ["color", "alpha", "offsetX", "offsetY", "blur", "spread"] as const;
/** A DTCG alias: a token path in braces. */
const ALIAS = /^\{([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)\}$/;

export function loadDepths(files: string[]): DepthsResult {
  const r = loadEach(files, "depth declaration", "depth.invalid", readDepth);
  return r.ok ? { ok: true, depths: r.decls, findings: r.findings } : r;
}

function readDepth(raw: Json, path: string, findings: Finding[]): DepthDecl | null {
  const r = makeReader(findings, path, "depth.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", DEPTH_KEYS, DEPTH_REQUIRED);
  const { name, description } = readHeader(raw, path, r, "virtu-depth", DEPTH_FORMAT_VERSION, DEPTH_SUFFIX);

  let theme: DepthDecl["theme"] = null;
  let themeOk = true;
  if (raw["theme"] !== undefined) {
    themeOk = false;
    const t = r.object(raw["theme"], "theme");
    if (t !== null) {
      r.keys(t, "theme", ["context", "default"], ["context", "default"]);
      const context = t["context"] === undefined ? null : r.string(t["context"], "theme.context");
      const def = t["default"] === undefined ? null : r.string(t["default"], "theme.default");
      if (context !== null && def !== null) {
        theme = { context, default: def };
        themeOk = true;
      }
    }
  }

  // A value per theme: an object keyed by theme value, which must name the default and agree across the declaration, or one value for every theme.
  let themeValues: string[] | null = null;
  const perTheme = <T>(value: Json | undefined, where: string, one: (v: Json, where: string) => T | null, isOne: (v: Json) => boolean): Record<string, T> | null => {
    if (value === undefined) return null;
    if (isOne(value)) {
      const v = one(value, where);
      return v === null ? null : { "*": v };
    }
    const o = r.object(value, where);
    if (o === null) return null;
    if (theme === null) return r.invalid(where, "gives a value per theme, but the declaration states no theme context");
    const keys = Object.keys(o);
    if (!keys.includes(theme.default)) return r.invalid(where, `is missing a value for the default theme ${theme.default}`);
    if (themeValues === null) themeValues = keys;
    else if (keys.length !== themeValues.length || keys.some((k) => !themeValues?.includes(k))) {
      return r.invalid(where, `names the themes ${keys.join(", ")}, but the declaration elsewhere names ${themeValues.join(", ")}`);
    }
    const out: Record<string, T> = {};
    for (const key of keys) {
      const v = one(o[key] ?? null, `${where}.${key}`);
      if (v === null) return null;
      out[key] = v;
    }
    return out;
  };

  const direction = (v: Json, where: string): StackingDirection | null =>
    typeof v === "string" && (STACKING_DIRECTIONS as readonly string[]).includes(v) ? (v as StackingDirection) : r.invalid(where, `must be one of ${STACKING_DIRECTIONS.join(", ")}`);
  const stacking = perTheme(raw["stacking"], "stacking", direction, (v) => typeof v === "string");

  const names = tokenReader(r);
  const foreground: DepthDecl["foreground"] = [];
  const fl = raw["foreground"];
  if (fl !== undefined) {
    if (!Array.isArray(fl) || fl.length === 0) r.invalid("foreground", "must be a non-empty array of { token, min }");
    else {
      for (const [i, item] of fl.entries()) {
        const where = `foreground[${i}]`;
        const o = r.object(item, where);
        if (o === null) continue;
        r.keys(o, where, ["token", "min"], ["token", "min"]);
        const t = names(o["token"], `${where}.token`);
        const min = r.number(o["min"], `${where}.min`, 1);
        if (t !== null && min !== null) foreground.push({ token: t, min });
      }
    }
  }

  const layer = (v: Json, where: string): ShadowLayer | null => {
    const o = r.object(v, where);
    if (o === null) return null;
    r.keys(o, where, LAYER_KEYS, LAYER_KEYS);
    const c = o["color"];
    const m = typeof c === "string" ? ALIAS.exec(c) : null;
    const color = m === null ? r.invalid(`${where}.color`, 'must be a token reference in braces, such as "{palette.gray.12}"') : (m[1] ?? null);
    const alpha = r.number(o["alpha"], `${where}.alpha`, 0);
    if (alpha !== null && alpha > 1) r.invalid(`${where}.alpha`, "must be at most 1");
    const num = (key: string, min: number): number | null => {
      const x = o[key];
      if (typeof x !== "number" || !Number.isFinite(x)) return r.invalid(`${where}.${key}`, "must be a number of px");
      if (x < min) return r.invalid(`${where}.${key}`, `must be at least ${min}`);
      return x;
    };
    const offsetX = num("offsetX", -Infinity);
    const offsetY = num("offsetY", -Infinity);
    const blur = num("blur", 0);
    const spread = num("spread", -Infinity);
    if (color === null || alpha === null || alpha > 1 || offsetX === null || offsetY === null || blur === null || spread === null) return null;
    return { color, alpha, offsetX, offsetY, blur, spread };
  };
  const layers = (v: Json, where: string): ShadowLayer[] | null => {
    if (!Array.isArray(v)) return r.invalid(where, "must be an array of shadow layers");
    const out: ShadowLayer[] = [];
    for (const [i, item] of v.entries()) {
      const l = layer(item, `${where}[${i}]`);
      if (l === null) return null;
      out.push(l);
    }
    return out;
  };

  const bound = new Map<string, string>();
  const binds = tokenReader(r, bound);
  const levelNames = new Set<string>();
  const levels: DepthLevel[] = [];
  const ll = raw["levels"];
  if (ll !== undefined) {
    if (!Array.isArray(ll) || ll.length < 2) r.invalid("levels", "must be an array of at least two levels, lowest first");
    else {
      for (const [i, item] of ll.entries()) {
        const where = `levels[${i}]`;
        const o = r.object(item, where);
        if (o === null) continue;
        r.keys(o, where, LEVEL_KEYS, ["name", "surface", "shadow"]);
        const n = o["name"] === undefined ? null : r.string(o["name"], `${where}.name`);
        if (n !== null && !NAME.test(n)) r.invalid(`${where}.name`, "a name must be letters, digits, hyphens, and underscores");
        else if (n !== null && levelNames.has(n)) r.invalid(`${where}.name`, `"${n}" names another level`);
        if (n !== null) levelNames.add(n);
        const surface = o["surface"] === undefined ? null : names(o["surface"], `${where}.surface`);
        const shadow = perTheme(o["shadow"], `${where}.shadow`, layers, (v) => Array.isArray(v));
        const t = binds(o["token"], `${where}.token`);
        const border = names(o["border"], `${where}.border`);
        let boundary = false;
        if (o["boundary"] !== undefined) {
          if (typeof o["boundary"] !== "boolean") r.invalid(`${where}.boundary`, "must be true or false");
          else boundary = o["boundary"];
        }
        if (i === 0 && boundary) r.invalid(`${where}.boundary`, "the lowest level has no level below to stand out from");
        if (n !== null && surface !== null && shadow !== null) levels.push({ name: n, surface, shadow, token: t, border, boundary });
      }
    }
  }
  // Every per-theme value names the same themes; a single value applies to all of them.
  if (stacking !== null && theme === null && !("*" in stacking)) return null;

  // Placements: a surface offset levels above whatever it sits on, optionally keeping one level's shadow (src/elevation.ts).
  const placements: DepthPlacement[] = [];
  if (raw["placements"] !== undefined) {
    const o = r.object(raw["placements"], "placements");
    if (o !== null) {
      for (const [pn, pv] of Object.entries(o)) {
        const where = `placements.${pn}`;
        if (!NAME.test(pn)) {
          r.invalid(where, "a name must be letters, digits, hyphens, and underscores");
          continue;
        }
        const po = r.object(pv, where);
        if (po === null) continue;
        r.keys(po, where, ["offset", "shadow"], ["offset"]);
        const offset = r.number(po["offset"], `${where}.offset`, 1, true);
        let shadow: string | null = null;
        if (po["shadow"] !== undefined) {
          shadow = r.string(po["shadow"], `${where}.shadow`);
          if (shadow !== null && !levelNames.has(shadow)) {
            r.invalid(`${where}.shadow`, `names no level; the levels are ${[...levelNames].join(", ")}`);
            shadow = null;
            continue;
          }
        }
        if (offset !== null) placements.push({ name: pn, offset, shadow });
      }
    }
  }
  const stacks: string[][] = [];
  if (raw["stacks"] !== undefined) {
    const sl = raw["stacks"];
    if (!Array.isArray(sl)) r.invalid("stacks", "must be an array of arrays of placement names");
    else {
      const known = new Set(placements.map((p) => p.name));
      for (const [i, item] of sl.entries()) {
        const where = `stacks[${i}]`;
        const st = r.strings(item, where);
        if (st === null) continue;
        if (st.length === 0) {
          r.invalid(where, "must name at least one placement");
          continue;
        }
        const unknown = st.filter((x) => !known.has(x));
        if (unknown.length > 0) {
          r.invalid(where, `names ${unknown.join(", ")}, which no placement is`);
          continue;
        }
        stacks.push(st);
      }
    }
  }

  if (name === null || !themeOk || stacking === null) return null;
  return { path, name, description, theme, stacking, foreground, levels, placements, stacks };
}

// Shape, ornament, and season declarations: <name>.shape.json,
// <name>.ornament.json, and <name>.season.json. Their shapes follow
// schema/shape.schema.json, schema/ornament.schema.json, and
// schema/season.schema.json; token paths are checked against the system in
// shape.ts and ornament.ts, and a season's ornaments in season.ts.

export function findShapes(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, SHAPE_SUFFIX);
}
export function findOrnaments(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, ORNAMENT_SUFFIX);
}
export function findSeasons(paths: string[]): { ok: true; files: string[] } | { ok: false; error: string } {
  return findFiles(paths, SEASON_SUFFIX);
}

const SHAPE_KEYS = ["$schema", "virtu-shape", "name", "description", "corner", "radius", "nest", "edge"] as const;
const SHAPE_REQUIRED = ["virtu-shape", "name", "radius"] as const;
const EDGE_KEYS = ["width", "style", "color", "on", "boundary", "paint"] as const;

export function loadShapes(files: string[]): ShapesResult {
  const r = loadEach(files, "shape declaration", "shape.invalid", readShape);
  return r.ok ? { ok: true, shapes: r.decls, findings: r.findings } : r;
}

function oneOf<T extends string>(r: Reader, value: Json | undefined, where: string, allowed: readonly T[]): T | null {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
  return r.invalid(where, `must be one of ${allowed.join(", ")}`);
}

function readShape(raw: Json, path: string, findings: Finding[]): ShapeDecl | null {
  const r = makeReader(findings, path, "shape.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", SHAPE_KEYS, SHAPE_REQUIRED);
  const { name, description } = readHeader(raw, path, r, "virtu-shape", LOOK_FORMAT_VERSION, SHAPE_SUFFIX);
  const corner: CornerShape | null = raw["corner"] === undefined ? "round" : oneOf(r, raw["corner"], "corner", CORNER_SHAPES);

  const radius: Partial<Record<ShapeRole, ShapeRadius>> = {};
  const ro = raw["radius"] === undefined ? null : r.object(raw["radius"], "radius");
  if (ro !== null) {
    r.keys(ro, "radius", SHAPE_ROLES, []);
    for (const role of SHAPE_ROLES) {
      const v = ro[role];
      if (v === undefined) continue;
      if (v === "full") radius[role] = "full";
      else if (typeof v === "number" && Number.isFinite(v) && v >= 0) radius[role] = v;
      else r.invalid(`radius.${role}`, 'must be a number of px, at least 0, or "full"');
    }
  }

  const nest: ShapeNest[] = [];
  if (raw["nest"] !== undefined) {
    const nl = raw["nest"];
    if (!Array.isArray(nl)) r.invalid("nest", "must be an array of { outer, inner, inset }");
    else {
      for (const [i, item] of nl.entries()) {
        const where = `nest[${i}]`;
        const o = r.object(item, where);
        if (o === null) continue;
        r.keys(o, where, ["outer", "inner", "inset"], ["outer", "inner", "inset"]);
        const outer = oneOf(r, o["outer"], `${where}.outer`, SHAPE_ROLES);
        const inner = oneOf(r, o["inner"], `${where}.inner`, SHAPE_ROLES);
        const inset = r.number(o["inset"], `${where}.inset`, 0);
        if (outer !== null && inner !== null && outer === inner) r.invalid(where, "a role cannot nest inside itself");
        else if (outer !== null && inner !== null && inset !== null) {
          if (radius[outer] === undefined || radius[inner] === undefined) r.invalid(where, `names a role the radius does not give: ${[outer, inner].filter((x) => radius[x] === undefined).join(", ")}`);
          else nest.push({ outer, inner, inset });
        }
      }
    }
  }

  let edge: ShapeEdge | null = null;
  let edgeOk = true;
  if (raw["edge"] !== undefined) {
    edgeOk = false;
    const eo = r.object(raw["edge"], "edge");
    if (eo !== null) {
      r.keys(eo, "edge", EDGE_KEYS, ["width", "color", "on"]);
      const token = tokenReader(r);
      const width = r.number(eo["width"], "edge.width", 0);
      const style: EdgeStyle | null = eo["style"] === undefined ? "solid" : oneOf(r, eo["style"], "edge.style", EDGE_STYLES);
      const color = token(eo["color"], "edge.color");
      const on = token(eo["on"], "edge.on");
      let boundary = false;
      if (eo["boundary"] !== undefined) {
        if (typeof eo["boundary"] !== "boolean") r.invalid("edge.boundary", "must be true or false");
        else boundary = eo["boundary"];
      }
      let paint: EdgePaint | null = { kind: "solid" };
      if (eo["paint"] !== undefined) {
        paint = null;
        const po = r.object(eo["paint"], "edge.paint");
        if (po !== null) {
          const kind = oneOf(r, po["kind"], "edge.paint.kind", ["solid", "gradient", "spin"] as const);
          if (kind === "solid") {
            r.keys(po, "edge.paint", ["kind"], ["kind"]);
            paint = { kind: "solid" };
          } else if (kind !== null) {
            r.keys(po, "edge.paint", kind === "gradient" ? ["kind", "colors", "angle"] : ["kind", "colors", "duration"], ["kind", "colors"]);
            const colors: string[] = [];
            const cl = po["colors"];
            if (!Array.isArray(cl) || cl.length < 2) r.invalid("edge.paint.colors", "must be an array of at least two color token paths");
            else for (const [i, c] of cl.entries()) {
              const t = token(c, `edge.paint.colors[${i}]`);
              if (t !== null) colors.push(t);
            }
            const ok = Array.isArray(cl) && cl.length >= 2 && colors.length === cl.length;
            if (kind === "gradient") {
              const angle = po["angle"] === undefined ? 135 : r.number(po["angle"], "edge.paint.angle", -360);
              if (ok && angle !== null) paint = { kind: "gradient", colors, angle };
            } else {
              const duration = po["duration"] === undefined ? 6000 : r.number(po["duration"], "edge.paint.duration", 1, true);
              if (ok && duration !== null) paint = { kind: "spin", colors, duration };
            }
          }
        }
      }
      if (paint !== null && paint.kind !== "solid" && style !== null && style !== "solid") {
        r.invalid("edge.style", `a ${paint.kind} paint is drawn under a transparent solid border, so the style must be solid`);
        paint = null;
      }
      if (width !== null && style !== null && color !== null && on !== null && paint !== null) {
        edge = { width, style, color, on, boundary, paint };
        edgeOk = true;
      }
    }
  }

  if (name === null || corner === null || ro === null || !edgeOk) return null;
  return { path, name, description, corner, radius, nest, edge };
}

const ORNAMENT_KEYS = ["$schema", "virtu-ornament", "name", "description", "anchor", "asset", "size", "outset", "gutter", "slice", "color", "motion", "still", "budget"] as const;
const ORNAMENT_REQUIRED = ["virtu-ornament", "name", "anchor", "asset", "size"] as const;
/** The default and the largest byte budget of an ornament's SVG. */
export const ORNAMENT_BUDGET = 8192;
export const ORNAMENT_BUDGET_MAX = 32768;
const ASSET = /^[A-Za-z0-9_-]+\.svg$/;

export function loadOrnaments(files: string[]): OrnamentsResult {
  const r = loadEach(files, "ornament declaration", "ornament.invalid", readOrnament);
  return r.ok ? { ok: true, ornaments: r.decls, findings: r.findings } : r;
}

function readOrnament(raw: Json, path: string, findings: Finding[]): OrnamentDecl | null {
  const r = makeReader(findings, path, "ornament.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", ORNAMENT_KEYS, ORNAMENT_REQUIRED);
  const { name, description } = readHeader(raw, path, r, "virtu-ornament", LOOK_FORMAT_VERSION, ORNAMENT_SUFFIX);
  const anchor: OrnamentAnchor | null = raw["anchor"] === undefined ? null : oneOf(r, raw["anchor"], "anchor", ORNAMENT_ANCHORS);
  let asset = raw["asset"] === undefined ? null : r.string(raw["asset"], "asset");
  if (asset !== null && !ASSET.test(asset)) asset = r.invalid("asset", "must be the file name of an SVG beside the declaration, such as holly.svg");
  const size = raw["size"] === undefined ? null : r.number(raw["size"], "size", 1);
  const outset = raw["outset"] === undefined ? 0 : r.number(raw["outset"], "outset", 0);
  const gutter = raw["gutter"] === undefined ? 0 : r.number(raw["gutter"], "gutter", 0);
  const color = tokenReader(r)(raw["color"], "color");
  const colorOk = raw["color"] === undefined || color !== null;
  // An edges ornament in the SVG's own colors is a 9-slice frame (border-image), which needs the slice; one painted in a token repeats the drawing along each edge through a mask, which takes none.
  let slice: number | null = null;
  let sliceOk = true;
  if (raw["slice"] !== undefined) {
    slice = r.number(raw["slice"], "slice", 1);
    sliceOk = slice !== null;
    if (anchor !== null && anchor !== "edges") sliceOk = r.invalid("slice", "only an edges ornament is sliced") !== null;
    else if (raw["color"] !== undefined) sliceOk = r.invalid("slice", "an edges ornament painted in a color repeats its drawing along each edge and takes no slice") !== null;
  } else if (anchor === "edges" && raw["color"] === undefined) sliceOk = r.invalid("slice", "an edges ornament in the SVG's own colors is a 9-slice frame and needs the border-image slice, in the SVG's units") !== null;
  let motion: OrnamentDecl["motion"] = null;
  let motionOk = true;
  if (raw["motion"] !== undefined) {
    motionOk = false;
    const mo = r.object(raw["motion"], "motion");
    if (mo !== null) {
      r.keys(mo, "motion", ["kind", "duration"], ["kind", "duration"]);
      const kind: OrnamentMotionKind | null = oneOf(r, mo["kind"], "motion.kind", ORNAMENT_MOTIONS);
      const duration = r.number(mo["duration"], "motion.duration", 1, true);
      if (kind !== null && anchor !== null && !MOTION_ANCHORS[kind].includes(anchor)) r.invalid("motion.kind", `${kind} runs on ${MOTION_ANCHORS[kind].join(", ")}, not ${anchor}`);
      else if (kind !== null && duration !== null) {
        motion = { kind, duration };
        motionOk = true;
      }
    }
  }
  const still: "show" | "hide" | null = raw["still"] === undefined ? "show" : oneOf(r, raw["still"], "still", ["show", "hide"] as const);
  const budget = raw["budget"] === undefined ? ORNAMENT_BUDGET : r.number(raw["budget"], "budget", 1, true);
  if (budget !== null && budget > ORNAMENT_BUDGET_MAX) r.invalid("budget", `must be at most ${ORNAMENT_BUDGET_MAX} bytes`);
  if (name === null || anchor === null || asset === null || size === null || outset === null || gutter === null || !sliceOk || !colorOk || !motionOk || still === null || budget === null || budget > ORNAMENT_BUDGET_MAX) return null;
  return { path, name, description, anchor, asset, size, outset, gutter, slice, color, motion, still, budget };
}

const SEASON_KEYS = ["$schema", "virtu-season", "name", "description", "seasons"] as const;
const SEASON_REQUIRED = ["virtu-season", "name", "seasons"] as const;

export function loadSeasons(files: string[]): SeasonsResult {
  const r = loadEach(files, "season declaration", "season.invalid", readSeason);
  return r.ok ? { ok: true, seasons: r.decls, findings: r.findings } : r;
}

function readSeason(raw: Json, path: string, findings: Finding[]): SeasonDecl | null {
  const r = makeReader(findings, path, "season.invalid");
  if (!isObject(raw)) return r.invalid("root", "must be an object");
  r.keys(raw, "root", SEASON_KEYS, SEASON_REQUIRED);
  const { name, description } = readHeader(raw, path, r, "virtu-season", LOOK_FORMAT_VERSION, SEASON_SUFFIX);
  const seasons: Season[] = [];
  const sl = raw["seasons"];
  const seen = new Set<string>();
  if (sl !== undefined) {
    if (!Array.isArray(sl) || sl.length === 0) r.invalid("seasons", "must be a non-empty array of seasons");
    else {
      for (const [i, item] of sl.entries()) {
        const where = `seasons[${i}]`;
        const o = r.object(item, where);
        if (o === null) continue;
        r.keys(o, where, ["name", "from", "to", "slots"], ["name", "from", "to", "slots"]);
        let n = o["name"] === undefined ? null : r.string(o["name"], `${where}.name`);
        if (n !== null && !NAME.test(n)) n = r.invalid(`${where}.name`, "a name must be letters, digits, hyphens, and underscores");
        else if (n !== null && seen.has(n)) n = r.invalid(`${where}.name`, `"${n}" names another season`);
        if (n !== null) seen.add(n);
        const day = (key: "from" | "to"): string | null => {
          const v = o[key];
          if (v === undefined) return null;
          if (typeof v !== "string" || dayIndex(v) === null) return r.invalid(`${where}.${key}`, 'must be a day of the year as "MM-DD", such as "12-01"');
          return v;
        };
        const from = day("from");
        const to = day("to");
        const slots: Record<string, string> = {};
        let slotsOk = false;
        const so = o["slots"] === undefined ? null : r.object(o["slots"], `${where}.slots`);
        if (so !== null) {
          slotsOk = true;
          if (Object.keys(so).length === 0) slotsOk = r.invalid(`${where}.slots`, "must give at least one slot an ornament") !== null;
          for (const [k, v] of Object.entries(so)) {
            if (!NAME.test(k)) {
              slotsOk = r.invalid(`${where}.slots.${k}`, "a slot name must be letters, digits, hyphens, and underscores") !== null;
              continue;
            }
            const orn = r.string(v, `${where}.slots.${k}`);
            if (orn === null || !NAME.test(orn)) {
              if (orn !== null) r.invalid(`${where}.slots.${k}`, "must name an ornament");
              slotsOk = false;
            } else slots[k] = orn;
          }
        }
        if (n !== null && from !== null && to !== null && slotsOk) seasons.push({ name: n, from, to, slots });
      }
    }
  }
  if (name === null || !Array.isArray(sl)) return null;
  return { path, name, description, seasons };
}
