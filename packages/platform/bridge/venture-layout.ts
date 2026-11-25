// Where a business's records sit on disk under its layout, worked out from a list of paths instead of a folder.
//
// Naive names every record by its logical path (foundation/problem.json, provenance.jsonl) and keeps it on disk at a
// physical path that depends on the layout venture.json names: flat, structured (records under k-base/, or knowledge/
// in a business made by Naive 0.3.0, with optional (group)/ folders, and the logs and config in meta/) or src
// (package folders under src/<function>/). Naive's own rules are `physical` and `logical` in
// naive-framework/src/core/venture-paths.ts, and they look at the disk. The hosted business store has no disk: it is
// rows in naive_records, each with a physical path. So this file says the same rules over the paths the store holds,
// and imports nothing, so the web app can use it without resolving the framework.
//
// It is a copy of Naive's rules, so bridge/venture-layout-test.ts pins it against Naive's own `physical` and
// `logical`, over every path Naive's route table and venture template name, in each layout. A change in Naive that
// this file does not follow fails there.

/** A business's layout on disk, as venture.json names it. Anything else is flat. */
export type Layout = "flat" | "structured" | "src";

/** What the rules need to know about one business: its layout, its knowledge-base folder, and which packages sit
 *  in a (group)/ folder inside it. */
export interface StoreLayout {
  layout: Layout;
  kbase: "k-base" | "knowledge";
  /** Package folder to the (group) folder it sits in, for a structured business that mirrors functions on disk. */
  groups: ReadonlyMap<string, string>;
}

/** What stays at the top of a structured business. Naive's TOP. */
const TOP = new Set(["venture.json", "AGENTS.md", "README.md", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", ".gitignore", ".vscode"]);
/** The files a structured business keeps in meta/. Naive's META. */
const META: Readonly<Record<string, string>> = { "provenance.jsonl": "meta/provenance.jsonl", "knowledge/sources.json": "meta/sources.json", "sources.json": "meta/sources.json", "naive.config.json": "meta/naive.config.json", "operating-rules.json": "meta/operating-rules.json" };
const CODEBASE = "codebase";
/** The function that owns each package folder in the src layout. Naive's PACKAGE_FUNCTION. */
const PACKAGE_FUNCTION: Readonly<Record<string, string>> = {
  foundation: "strategy", validation: "strategy",
  product: "products", engineering: "products",
  marketing: "marketing-and-sales", customers: "marketing-and-sales", deals: "marketing-and-sales", sales: "marketing-and-sales",
  support: "customer-service",
  operations: "service-delivery",
  people: "human-capital", cofounder: "human-capital",
  finance: "finance", fund: "finance", money: "finance",
  legal: "risk-and-compliance", counsel: "risk-and-compliance",
  relationships: "external-relationships", investor: "external-relationships", investors: "external-relationships", partner: "external-relationships",
  "investor-relations": "external-relationships",
  it: "it",
  "supply-chain": "supply-chain", "service-delivery": "service-delivery",
  capabilities: "capabilities",
  assets: "assets",
};

const functionOf = (pkg: string | undefined): string | undefined =>
  pkg !== undefined && Object.hasOwn(PACKAGE_FUNCTION, pkg) ? PACKAGE_FUNCTION[pkg] : undefined;

/** The layout venture.json names, read from its text. A missing or broken venture.json is flat, as in Naive. */
export function layoutIn(ventureJson: string | undefined): Layout {
  if (ventureJson === undefined) return "flat";
  try {
    const l = (JSON.parse(ventureJson) as { layout?: unknown }).layout;
    return l === "structured" || l === "src" ? l : "flat";
  } catch {
    return "flat";
  }
}

/** One business's layout, from its venture.json and every physical path it holds (relative to its folder). A folder
 *  exists in a store when some path sits under it, which is how Naive's existence checks are read here. */
export function storeLayout(ventureJson: string | undefined, paths: readonly string[]): StoreLayout {
  const layout = layoutIn(ventureJson);
  const under = (folder: string) => paths.some((p) => p.startsWith(`${folder}/`));
  // Naive's kbaseOf: knowledge/ only when there is no k-base/ and knowledge/foundation/ exists.
  const kbase = !under("k-base") && under("knowledge/foundation") ? "knowledge" : "k-base";
  // Naive's groupOf: a package sits in a (group)/ folder only when it is not directly in the knowledge base.
  const direct = new Set<string>();
  const grouped = new Map<string, string>();
  // Naive takes the first group its folder listing gives; a sorted listing stands in for it.
  for (const p of [...paths].sort()) {
    if (!p.startsWith(`${kbase}/`)) continue;
    const parts = p.slice(kbase.length + 1).split("/");
    const [first, second] = parts;
    if (first === undefined) continue;
    direct.add(first);
    if (/^\(.+\)$/.test(first) && second !== undefined && !grouped.has(second)) grouped.set(second, first);
  }
  const groups = new Map([...grouped].filter(([pkg]) => !direct.has(pkg)));
  return { layout, kbase, groups };
}

/** The physical path of a logical path, relative to the business folder. Naive's `physical`. */
export function physicalPath(at: StoreLayout, rel: string): string {
  const r = rel.replace(/^\.\//, "");
  const first = r.split("/")[0] ?? "";
  if (at.layout === "src") {
    const f = functionOf(first);
    return f ? `src/${f}/${r}` : r;
  }
  if (at.layout !== "structured") return r;
  if (TOP.has(first)) return r;
  if (r === "profile.md") return "README.md";
  if (Object.hasOwn(META, r)) return META[r] ?? r;
  if (r === ".release" || r.startsWith(".release/")) return `meta/releases${r.slice(".release".length)}`;
  if (r.startsWith(".naive/") || r === ".naive" || r.startsWith("node_modules") || r.startsWith(".git")) return r;
  const kb = at.kbase;
  if (r.startsWith(`${kb}/`) || r === kb || r.startsWith("meta/") || r.startsWith(`${CODEBASE}/`) || r.startsWith("repo/")) return r;
  const g = first ? at.groups.get(first) : undefined;
  return `${kb}/${g ? `${g}/` : ""}${r}`;
}

/** The logical path of a physical path relative to the business folder. Naive's `logical`. */
export function logicalPath(at: StoreLayout, rel: string): string {
  if (at.layout === "src") {
    const m = rel.match(/^src\/([^/]+)\/(([^/]+)(\/.*)?)$/);
    return m && m[2] !== undefined && functionOf(m[3]) === m[1] ? m[2] : rel;
  }
  if (at.layout !== "structured") return rel;
  if (rel === "README.md") return "profile.md";
  for (const [l, p] of Object.entries(META)) if (rel === p) return l === "sources.json" ? "knowledge/sources.json" : l;
  if (rel === "meta/releases" || rel.startsWith("meta/releases/")) return `.release${rel.slice("meta/releases".length)}`;
  const kb = at.kbase;
  if (rel.startsWith(`${kb}/`)) return rel.slice(kb.length + 1).replace(/^\([^/]+\)\//, "");
  return rel;
}

/** The logical path Naive reads a physical path as, or null when Naive would not find it there: a stray file a
 *  structured business keeps at the top, or a second copy of a package beside the one Naive reads. */
export function recordAt(at: StoreLayout, rel: string): string | null {
  const l = logicalPath(at, rel);
  return physicalPath(at, l) === rel ? l : null;
}
