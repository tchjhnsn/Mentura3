// A venture's files in Naive's layout (Torian, 2026-11-18: "Ventures may need a file tree. It could use Naive's file
// tree", and on the card, "In Reflect, exportable"). Reflect keeps each venture's files; the person sees them as a
// tree, can start a Naive venture from a Ventures record, and can download the folder to keep working in Naive.
//
// The layout is Naive's src layout (EE-118 step 8, what `naive init` writes): venture.json and profile.md at the top,
// raw/, ideas/, decisions/, evidence/ and public/ beside them, and each package folder under src/<function>/. The
// fields and their allowed values follow Naive's packages/naive/src/records/venture.schema.json, the functions its
// packages/naive/src/functions/departments.json and the package homes its core/venture-paths.mjs PACKAGE_FUNCTION,
// all as of tchjhnsn/naive commit NAIVE_COMMIT. Change them together when Naive changes.

export const NAIVE_COMMIT = "fa8e9c3";

/** One file a venture keeps: its path in the venture folder and its text. An empty folder holds a `.gitkeep`. */
export type VentureFile = { path: string; body: string };

/** The thirteen functions a venture can import (Naive's departments.json, from APQC's process classification). */
export const NAIVE_FUNCTIONS = [
  { id: "strategy", label: "Strategy" },
  { id: "products", label: "Products and services" },
  { id: "marketing-and-sales", label: "Marketing and sales" },
  { id: "supply-chain", label: "Supply chain" },
  { id: "service-delivery", label: "Service delivery" },
  { id: "customer-service", label: "Customer service" },
  { id: "human-capital", label: "Human capital (HR)" },
  { id: "it", label: "Information technology" },
  { id: "finance", label: "Finance and accounting" },
  { id: "assets", label: "Assets and facilities" },
  { id: "risk-and-compliance", label: "Legal, risk and compliance" },
  { id: "external-relationships", label: "External relationships" },
  { id: "capabilities", label: "Business capabilities" },
] as const;

/** The packages an untyped venture starts with (init-venture.mjs) and the function each lives under (PACKAGE_FUNCTION). */
export const STARTING_PACKAGES: readonly { id: string; fn: string }[] = [
  { id: "foundation", fn: "strategy" },
  { id: "validation", fn: "strategy" },
  { id: "product", fn: "products" },
  { id: "marketing", fn: "marketing-and-sales" },
  { id: "customers", fn: "marketing-and-sales" },
  { id: "finance", fn: "finance" },
  { id: "money", fn: "finance" },
  { id: "people", fn: "human-capital" },
  { id: "investors", fn: "external-relationships" },
];

const PHASES = ["discovery", "validation", "beachhead", "scale", "platform"] as const;
const LAYERS = ["purpose", "knowledge", "operations", "evidence", "governance", "interface"] as const;
const REQUIRED = ["id", "name", "parent", "phase", "owner", "status", "layers"] as const;
const KEYS = new Set([
  "id", "name", "kind", "type", "layout", "functions", "parent", "phase", "timeZone", "lifecycle_playbook", "ambition", "form", "industry", "core", "departments",
  "packages", "kits", "brand", "owner", "members", "governed_by", "status", "opened", "closed", "profile", "layers", "links", "tags", "repos", "regulation",
]);
const ID = /^[a-z0-9-]+$/;

/** A venture id Naive accepts, from a name: lower case, words joined by hyphens. */
export function ventureId(name: string): string {
  const id = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return id || "venture";
}

/**
 * What is wrong with a venture.json, as Naive's schema would say it, for the fields this module writes and the ones
 * a person might add: required fields, the id pattern, the enums, the layers' shape and known function ids.
 * An empty list means Naive accepts it.
 */
export function ventureJsonProblems(v: unknown): string[] {
  if (!v || typeof v !== "object" || Array.isArray(v)) return ["venture.json must be an object."];
  const o = v as Record<string, unknown>;
  const out: string[] = [];
  for (const k of REQUIRED) if (!(k in o)) out.push(`venture.json needs "${k}".`);
  for (const k of Object.keys(o)) if (!KEYS.has(k)) out.push(`venture.json has "${k}", which Naive does not know.`);
  if ("id" in o && (typeof o.id !== "string" || !ID.test(o.id))) out.push(`"id" must be lower-case letters, digits and hyphens.`);
  if ("name" in o && typeof o.name !== "string") out.push(`"name" must be text.`);
  if ("parent" in o && o.parent !== null && typeof o.parent !== "string") out.push(`"parent" must be a venture id or null.`);
  const oneOf = (k: string, allowed: readonly string[]) => {
    if (k in o && !allowed.includes(o[k] as string)) out.push(`"${k}" must be one of ${allowed.join(", ")}.`);
  };
  oneOf("phase", PHASES);
  oneOf("owner", ["self", "shared", "other"]);
  oneOf("status", ["active", "paused", "closed", "archived"]);
  oneOf("kind", ["venture", "product"]);
  oneOf("layout", ["flat", "structured", "src"]);
  oneOf("ambition", ["hobby", "survival", "lifestyle", "managed-growth", "aggressive-growth"]);
  if ("layers" in o) {
    const l = o.layers;
    if (!l || typeof l !== "object" || Array.isArray(l)) out.push(`"layers" must be an object.`);
    else {
      const layers = l as Record<string, unknown>;
      for (const k of ["purpose", "knowledge", "operations", "evidence"]) if (!(k in layers)) out.push(`"layers" needs "${k}".`);
      for (const [k, x] of Object.entries(layers)) {
        if (!(LAYERS as readonly string[]).includes(k)) out.push(`"layers" has "${k}", which is not a layer.`);
        else if (x !== false && !(x && typeof x === "object" && typeof (x as Record<string, unknown>).location === "string")) out.push(`layer "${k}" must be false or have a location.`);
      }
    }
  }
  const fnIds = NAIVE_FUNCTIONS.map((f) => f.id as string);
  if ("departments" in o) {
    const d = o.departments;
    if (!Array.isArray(d) || d.some((x) => typeof x !== "string" || !ID.test(x))) out.push(`"departments" must be a list of function ids.`);
    else {
      for (const x of d) if (!fnIds.includes(x)) out.push(`"${x}" is not one of Naive's functions.`);
      if (new Set(d).size !== d.length) out.push(`"departments" lists a function twice.`);
    }
  }
  if ("functions" in o) {
    const f = o.functions;
    if (!f || typeof f !== "object" || Array.isArray(f)) out.push(`"functions" must be an object.`);
    else for (const [k, x] of Object.entries(f as Record<string, unknown>)) {
      if (!fnIds.includes(k)) out.push(`"${k}" is not one of Naive's functions.`);
      if (!x || typeof x !== "object" || typeof (x as Record<string, unknown>).owner !== "string") out.push(`function "${k}" needs an owner.`);
    }
  }
  return out;
}

/** What a Ventures record holds that a Naive venture starts from. */
export type VentureSeed = { name: string; what?: string; where?: string; link?: string; started?: string; revenue?: number; costs?: number; note?: string; state?: string | null };

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/**
 * The files of a new Naive venture drafted from a Ventures record: venture.json (Discovery, the src layout, the
 * starting packages' functions), profile.md, the record's own words in raw/dump/ and the empty folders Naive makes.
 * Nothing here is invented: what the person did not write is left out.
 */
export function draftVenture(seed: VentureSeed): VentureFile[] {
  const name = seed.name.trim() || "Venture";
  const id = ventureId(name);
  const departments = [...new Set(STARTING_PACKAGES.map((p) => p.fn))];
  const venture = {
    id, name, parent: null, phase: "discovery", layout: "src", owner: "self",
    status: seed.state === "paused" ? "paused" : seed.state === "closed" ? "closed" : "active",
    profile: "profile.md",
    departments,
    // Discovery uses the knowledge layer only (Naive's scaffold/defaults.json); the rest are added as they are needed.
    layers: { purpose: false, knowledge: { location: "knowledge/" }, operations: false, evidence: false },
  };
  const facts = [
    seed.what ? `- What it sells: ${seed.what}` : null,
    seed.where ? `- Where it sells: ${seed.where}` : null,
    seed.link ? `- Store or site: ${seed.link}` : null,
    seed.started ? `- Started: ${seed.started}` : null,
    seed.revenue !== undefined ? `- Brings in a month: ${money(seed.revenue)}` : null,
    seed.costs !== undefined ? `- Costs a month: ${money(seed.costs)}` : null,
  ].filter((x): x is string => x !== null);
  const notes = [`# ${name}, from Reflect`, "", "What was kept about this venture in Reflect's Ventures tile when it was started in Naive.", "", ...(facts.length ? [...facts, ""] : []), ...(seed.note?.trim() ? ["## Notes", "", seed.note.trim(), ""] : [])].join("\n");
  const keep = (dir: string): VentureFile => ({ path: `${dir}/.gitkeep`, body: "" });
  return [
    { path: "venture.json", body: JSON.stringify(venture, null, 2) + "\n" },
    { path: "profile.md", body: `# ${name}\n\n${seed.what?.trim() ? `${seed.what.trim()}.` : "What this venture is, in a few sentences."} Its machine fields are in venture.json.\n\n## Changelog\n` },
    { path: "knowledge/README.md", body: "# knowledge\n\nMemory: every record the venture keeps, including notes, specs, decisions and references.\n" },
    { path: "raw/dump/from-reflect.md", body: notes },
    keep("raw/sources"),
    keep("ideas"),
    ...STARTING_PACKAGES.map((p) => keep(`src/${p.fn}/${p.id}`)),
    keep("decisions"),
    keep("evidence"),
    keep("public"),
  ];
}

const SAFE_PATH = /^(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;

/** Whether a path may be kept in a venture folder: relative, no `.` or `..` parts, plain names, at most 300 characters. */
export const isVenturePath = (p: string) => p.length <= 300 && SAFE_PATH.test(p);

/** What is wrong with a file before it is kept: a bad path, too much text, or a venture.json Naive would refuse. */
export function fileProblems(f: VentureFile): string[] {
  if (!isVenturePath(f.path)) return [`"${f.path}" is not a path a venture can keep.`];
  if (f.body.length > 200_000) return [`${f.path} is too long to keep.`];
  if (f.path !== "venture.json") return [];
  try {
    return ventureJsonProblems(JSON.parse(f.body));
  } catch {
    return ["venture.json is not valid JSON."];
  }
}

/** A venture's files as a tree, folders first then files, each by name; `.gitkeep` files are left out of the view. */
export type FileNode = { type: "file"; name: string; path: string } | { type: "folder"; name: string; path: string; children: FileNode[] };

export function fileTree(paths: readonly string[]): FileNode[] {
  type Dir = { dirs: Map<string, Dir>; files: string[] };
  const root: Dir = { dirs: new Map(), files: [] };
  for (const p of paths) {
    const parts = p.split("/");
    let d = root;
    for (const part of parts.slice(0, -1)) {
      if (!d.dirs.has(part)) d.dirs.set(part, { dirs: new Map(), files: [] });
      d = d.dirs.get(part)!;
    }
    const leaf = parts[parts.length - 1]!;
    if (leaf !== ".gitkeep") d.files.push(leaf);
  }
  const build = (d: Dir, at: string): FileNode[] => [
    ...[...d.dirs.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, sub]): FileNode => ({ type: "folder", name, path: at + name, children: build(sub, `${at}${name}/`) })),
    ...[...d.files].sort((a, b) => a.localeCompare(b)).map((name): FileNode => ({ type: "file", name, path: at + name })),
  ];
  return build(root, "");
}
