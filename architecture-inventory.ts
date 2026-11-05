#!/usr/bin/env node
// Repository architecture inventory. Reads the tree, docs/ontology.json, and schema/terms/admitted.json,
// and writes docs/reviews/2026-11-03-architecture-inventory.md.
//
//   node scripts/architecture-inventory.ts           write the review
//   node scripts/architecture-inventory.ts --check   exit 1 when the review differs from a fresh run
//   node scripts/architecture-inventory.ts --stdout  print the review
//
// The script lives in scripts/ because that directory holds repository tooling. schema/ holds the
// checkers a venture runs. This report describes the repository. It is not a venture check.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const reviewPath = join(repo, "docs/reviews/2026-11-03-architecture-inventory.md");
const SKIP_DIR = new Set([".git", "node_modules", ".lake", ".next"]);
const TEXT_EXT = new Set([".md", ".mdx", ".json", ".mjs", ".cjs", ".js", ".ts", ".tsx", ".jsx", ".py", ".rb", ".yml", ".yaml", ".toml", ".lean", ".tla", ".cfg", ".mmd", ".html", ".css", ".txt", ".feature", ".md"]);
const LAYER_IDS = ["purpose", "knowledge", "operations", "evidence", "governance", "interface"];
const PACKAGE_KINDS = new Set(["handoff", "core", "data", "folder", "raw"]);
const FURNITURE = new Set(["README.md", "LICENSE", ".gitignore", ".gitattributes"]);
const HIDDEN_SAMPLE = /polity|anthropic|openai|spacex|thinking-machines/i;

type Bucket = "product" | "library" | "company" | "other";
type Status = "clean" | "different" | "several" | "none";

type Hit = { noun: string; concept: string; because: string };

type FileInfo = {
  rel: string;
  base: string;
  ext: string;
  bytes: number;
  head: string;
  json: unknown;
};

type Noun = { noun: string; level: string; status: string; meaning: string; function: string | null };

type Row = {
  path: string;
  depth: number;
  files: number;
  direct: number;
  kind: string;
  nouns: string;
  status: Status;
  because: string;
  buckets: Bucket[];
  bucketWhy: string;
};

const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const asArray = (x: unknown): unknown[] => Array.isArray(x) ? x : [];

function extOf(base: string): string {
  const i = base.lastIndexOf(".");
  if (i <= 0) return "";
  return base.slice(i).toLowerCase();
}

function countWord(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function readHead(abs: string, base: string, bytes: number): { head: string; json: unknown } {
  const ext = extOf(base);
  const textish = ext === "" || TEXT_EXT.has(ext) || base.endsWith(".schema.json") || base.endsWith(".steps.mjs");
  if (!textish || bytes > 400_000) return { head: "", json: null };
  let raw = "";
  try { raw = readFileSync(abs, "utf8"); } catch { return { head: "", json: null }; }
  const head = raw.slice(0, 1200);
  let json: unknown = null;
  if ((ext === ".json" || base.endsWith(".json")) && bytes < 400_000) {
    try { json = JSON.parse(raw) as unknown; } catch { json = null; }
  }
  return { head, json };
}

function walkFiles(): FileInfo[] {
  const out: FileInfo[] = [];
  const walk = (dir: string) => {
    let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[] = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIR.has(e.name)) continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.isFile()) {
        if (e.name.startsWith(".env")) continue;
        const rel = relative(repo, abs);
        if (rel === "docs/reviews" || rel.startsWith("docs/reviews/")) continue;
        const st = statSync(abs);
        const { head, json } = readHead(abs, e.name, st.size);
        out.push({ rel, base: e.name, ext: extOf(e.name), bytes: st.size, head, json });
      }
    }
  };
  walk(repo);
  out.sort((a, b) => a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0);
  return out;
}

function walkDirs(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: { name: string; isDirectory: () => boolean }[] = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || SKIP_DIR.has(e.name)) continue;
      const abs = join(dir, e.name);
      const rel = relative(repo, abs);
      if (rel === "docs/reviews" || rel.startsWith("docs/reviews/")) continue;
      out.push(rel);
      walk(abs);
    }
  };
  walk(repo);
  out.sort();
  return out;
}

function withoutIgnored(paths: string[]): string[] {
  if (paths.length === 0) return [];
  const r = spawnSync("git", ["check-ignore", "--stdin"], { cwd: repo, input: `${paths.join("\n")}\n`, encoding: "utf8" });
  if (r.status !== 0 && r.status !== 1) throw new Error(r.stderr || "git check-ignore failed");
  const ignored = new Set((r.stdout ?? "").split("\n").filter(Boolean));
  return paths.filter((p) => !ignored.has(p));
}

function inScope(path: string): boolean {
  const n = path.split("/").length;
  if (n <= 2) return true;
  return path.startsWith("schema/") && n === 3;
}

function frontMatter(head: string): string {
  if (!head.startsWith("---")) return "";
  const end = head.indexOf("\n---", 3);
  return end === -1 ? head.slice(0, 400) : head.slice(0, end);
}

function jsonRecord(f: FileInfo): Record<string, unknown> | null {
  return isRecord(f.json) ? f.json : null;
}

function loadNouns(): Noun[] {
  const raw = JSON.parse(readFileSync(join(repo, "docs/ontology.json"), "utf8")) as unknown;
  if (!isRecord(raw) || !Array.isArray(raw.nouns)) throw new Error("docs/ontology.json has no nouns");
  return raw.nouns.filter(isRecord).map((n) => ({
    noun: typeof n.noun === "string" ? n.noun : "",
    level: typeof n.level === "string" ? n.level : "",
    status: typeof n.status === "string" ? n.status : "",
    meaning: typeof n.meaning === "string" ? n.meaning : "",
    function: n.function === null ? null : typeof n.function === "string" ? n.function : null,
  })).filter((n) => n.noun);
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function nameMatches(folder: string, noun: string): boolean {
  const a = norm(folder);
  const b = norm(noun);
  if (!a || !b) return false;
  if (a === b || a === `${b}s` || a === `${b}es`) return true;
  if (b === `${a}s` || b === `${a}es`) return true;
  return false;
}

function requireText(rel: string, needle: string): void {
  const text = readFileSync(join(repo, rel), "utf8");
  if (!text.includes(needle)) throw new Error(`${rel} no longer contains ${JSON.stringify(needle)}`);
}

function requireAbsent(rel: string): void {
  if (existsSync(join(repo, rel))) throw new Error(`${rel} is present`);
}

function decisionText(decisions: unknown, id: string, status: string, needle: string): void {
  if (!isRecord(decisions)) throw new Error("decisions.json has no decisions");
  const found = asArray(decisions.decisions).find((d) => isRecord(d) && d.id === id);
  if (!isRecord(found) || found.status !== status || typeof found.decision !== "string" || !found.decision.includes(needle)) {
    throw new Error(`${id} is not ${status} or no longer contains ${JSON.stringify(needle)}`);
  }
}

function companyRoots(files: FileInfo[]): { root: string; id: string }[] {
  return files.filter((f) => f.rel.startsWith("instance/") && f.base === "venture.json").map((f) => {
    const rec = jsonRecord(f);
    const id = rec && typeof rec.id === "string" ? rec.id : "";
    return { root: dirname(f.rel), id };
  }).filter((v) => v.id);
}

function under(rel: string, root: string): boolean {
  return rel === root || rel.startsWith(`${root}/`);
}

function skillRoots(files: FileInfo[]): string[] {
  return files.filter((f) => f.base === "SKILL.md").map((f) => dirname(f.rel));
}

function frameworkDirs(files: FileInfo[]): Set<string> {
  const s = new Set<string>();
  for (const f of files) {
    const rec = jsonRecord(f);
    if (f.base === "framework.json" && rec && "maps_to" in rec && "vocabulary" in rec) s.add(dirname(f.rel));
  }
  return s;
}

function packageDirs(files: FileInfo[]): Set<string> {
  const s = new Set<string>();
  for (const f of files) {
    const rec = jsonRecord(f);
    if (f.base !== "package.json" || !rec || typeof rec.kind !== "string" || !PACKAGE_KINDS.has(rec.kind)) continue;
    if ("dependencies" in rec || "devDependencies" in rec) continue;
    s.add(dirname(f.rel));
  }
  return s;
}

function templateRoots(files: FileInfo[]): string[] {
  return files.filter((f) => {
    const rec = jsonRecord(f);
    return f.base === "decision-rights.json" && rec?.template === true && rec.register === "decision-rights";
  }).map((f) => dirname(f.rel));
}

function kitDirs(files: FileInfo[]): Set<string> {
  const s = new Set<string>();
  for (const f of files) {
    const rec = jsonRecord(f);
    if (f.base === "kit.json" && rec && typeof rec.package === "string") s.add(dirname(f.rel));
  }
  return s;
}

type Index = {
  files: FileInfo[];
  company: { root: string; id: string }[];
  skills: string[];
  frameworks: Set<string>;
  packages: Set<string>;
  templates: string[];
  kits: Set<string>;
};

function buildIndex(files: FileInfo[]): Index {
  return {
    files,
    company: companyRoots(files),
    skills: skillRoots(files),
    frameworks: frameworkDirs(files),
    packages: packageDirs(files),
    templates: templateRoots(files),
    kits: kitDirs(files),
  };
}

function ancestor(rel: string, roots: readonly string[]): boolean {
  return roots.some((r) => r !== "." && under(rel, r));
}

function isTemplateFile(f: FileInfo): boolean {
  if (/^type:\s*template\s*$/m.test(frontMatter(f.head))) return true;
  const rec = jsonRecord(f);
  return rec?.template === true;
}

function isPlaybook(f: FileInfo): boolean {
  const rec = jsonRecord(f);
  return !!rec && Array.isArray(rec.steps) && typeof rec.title === "string" && typeof rec.purpose === "string";
}

function isCode(f: FileInfo): boolean {
  return /\.(mjs|cjs|js|ts|tsx|jsx|py|rb)$/.test(f.base) || f.base.endsWith(".d.ts");
}

function bucketOf(f: FileInfo, ix: Index): Bucket {
  if (FURNITURE.has(f.base)) return "other";
  if (f.base === "AGENTS.md" && /ships open source/i.test(f.head)) return "library";
  if (ix.company.some((c) => under(f.rel, c.root))) return "company";
  if (f.rel === "instance/workspace.json") return "company";
  if (ancestor(f.rel, ix.skills)) return "library";
  if (ix.frameworks.has(dirname(f.rel)) && f.base.endsWith(".mjs")) return "library";
  if (isTemplateFile(f) || isPlaybook(f)) return "library";
  if (ix.packages.has(dirname(f.rel)) && !isCode(f)) return "library";
  if (ancestor(f.rel, ix.templates) && !isCode(f)) return "library";
  if (ix.kits.has(dirname(f.rel)) && !isCode(f)) return "library";
  if (f.base.endsWith(".schema.json") || isCode(f) || f.base.endsWith(".feature")) return "product";
  if (ix.packages.has(dirname(f.rel))) return "library";
  return "other";
}

function safePath(rel: string): string | null {
  if (HIDDEN_SAMPLE.test(rel)) return null;
  return rel;
}

function sample(files: FileInfo[], pred: (_f: FileInfo) => boolean): string | null {
  for (const f of files) if (pred(f)) {
    const p = safePath(f.rel);
    if (p) return p;
  }
  return null;
}

function hitsFor(dir: string, files: FileInfo[], ix: Index): Hit[] {
  const hits: Hit[] = [];
  const add = (noun: string, concept: string, because: string) => {
    if (!hits.some((h) => h.noun === noun && h.concept === concept)) hits.push({ noun, concept, because });
  };
  const direct = files.filter((f) => dirname(f.rel) === dir);

  const layer = direct.find((f) => f.base === "layer.json");
  const layerRec = layer ? jsonRecord(layer) : null;
  const layerValue = layerRec && typeof layerRec.layer === "string" ? layerRec.layer : "";
  if (layerValue && (LAYER_IDS.includes(layerValue) || layerValue === "system")) {
    add("layer", "layer", `${layer?.rel} has layer ${layerValue}`);
    add("layer manifest", "layer", `${layer?.rel} is the manifest the noun names`);
  }

  const schemas = files.filter((f) => f.base.endsWith(".schema.json"));
  if (schemas.length >= 10 || (schemas.length > 0 && schemas.length * 2 >= files.length)) {
    const shown = sample(files, (f) => f.base.endsWith(".schema.json"));
    add("schema", "schema", `${schemas.length} JSON Schema files${shown ? `, including ${shown}` : ""}`);
    add("record type", "schema", "those schema files are the record types");
  }

  const skills = files.filter((f) => f.base === "SKILL.md");
  if (skills.length > 0) {
    const shown = sample(files, (f) => f.base === "SKILL.md");
    add("tooling", "tooling", `${skills.length} SKILL.md files${shown ? `, including ${shown}` : ""}. The tooling noun names skills. No skill noun exists.`);
  }

  const genericTemplates = files.filter((f) => isTemplateFile(f) && !ancestor(f.rel, ix.templates));
  if (genericTemplates.length > 0) {
    const shown = sample(genericTemplates, () => true);
    add("template", "template", shown ? `${shown} has type template or template true` : "a file is marked as a template");
  }
  const ventureTemplate = files.find((f) => ancestor(f.rel, ix.templates) || ix.templates.includes(dirname(f.rel)));
  if (ventureTemplate) {
    const marker = ix.templates.find((r) => ancestor(ventureTemplate.rel, [r]) || dirname(ventureTemplate.rel) === r);
    add("venture template", "venture-template", `${marker ?? dirname(ventureTemplate.rel)}/decision-rights.json has template true and register decision-rights`);
  }

  if ([...ix.kits].some((k) => under(k, dir) || k === dir)) {
    const shown = sample(files, (f) => f.base === "kit.json");
    add("kit", "kit", shown ? `${shown} names a package` : "a kit.json names a package");
  }
  if (files.some((f) => /^#\s+.+\bkit\b/im.test(f.head))) {
    const shown = sample(files, (f) => /^#\s+.+\bkit\b/im.test(f.head));
    if (shown) add("kit", "kit", `${shown} is headed as a kit`);
  }

  if (files.some((f) => f.base === "integrations.json" && Array.isArray(f.json) && asArray(f.json).some(isRecord))) {
    const shown = sample(files, (f) => f.base === "integrations.json");
    add("integration", "integration", shown ? `${shown} is a list of tools` : "integrations.json lists tools");
  }
  if (files.some((f) => {
    const rec = jsonRecord(f);
    return f.base === "references.json" && !!rec && Array.isArray(rec.references);
  })) {
    const shown = sample(files, (f) => f.base === "references.json");
    add("reference", "reference", shown ? `${shown} lists sources` : "references.json lists sources");
  }

  if (files.some((f) => {
    const rec = jsonRecord(f);
    return f.base === "decisions.json" && !!rec && Array.isArray(rec.decisions);
  })) add("decision", "decision", "decisions.json holds decision records");

  if (files.some((f) => {
    const rec = jsonRecord(f);
    return !!rec && Array.isArray(rec.evals) && asArray(rec.evals).some((e) => isRecord(e) && "prompt" in e);
  })) {
    const shown = sample(files, (f) => {
      const rec = jsonRecord(f);
      return !!rec && Array.isArray(rec.evals);
    });
    add("eval", "eval", shown ? `${shown} holds eval prompts` : "an evals array is present");
  }

  if (files.some((f) => {
    const rec = jsonRecord(f);
    return !!rec && asArray(rec.capabilities).some((c) => isRecord(c) && typeof c.task === "string");
  })) {
    const shown = sample(files, (f) => {
      const rec = jsonRecord(f);
      return !!rec && asArray(rec.capabilities).some((c) => isRecord(c) && typeof c.task === "string");
    });
    add("capability register", "capability-register", shown ? `${shown} lists tasks and status` : "a capability list is present");
  }

  const workspace = direct.find((f) => f.base === "workspace.json" && jsonRecord(f)?.schema === "everything-ecosystem");
  if (workspace) add("workspace", "workspace", `${workspace.rel} declares the workspace`);
  const company = ix.company.find((c) => dir === c.root || under(dir, c.root) || under(c.root, dir));
  if (company) add("venture", "venture", `${company.root}/venture.json has id ${company.id}`);

  if (direct.some((f) => f.base === "page.tsx")) add("view", "view", "page.tsx renders a route");
  if (direct.some((f) => f.base === "layout.tsx")) add("layout", "layout", "layout.tsx wraps routes");

  const dataModel = files.find((f) => f.base === "data-model.json" && (dirname(f.rel) === dir || dir === "schema"));
  if (dataModel && (dirname(dataModel.rel) === dir || dir === "schema")) add("data model", "data-model", `${dataModel.rel} lists record types`);

  const consoleReadme = files.find((f) => f.base === "README.md" && /custom workbench/i.test(f.head) && /operator console/i.test(f.head));
  if (consoleReadme && files.filter((f) => !FURNITURE.has(f.base)).every((f) => f.base.endsWith(".md"))) {
    add("console", "console", `${consoleReadme.rel} calls this a custom workbench, which is the console noun's meaning`);
  }
  const nextApp = direct.find((f) => f.base === "package.json" && isRecord(jsonRecord(f)?.dependencies) && typeof (jsonRecord(f)?.dependencies as Record<string, unknown>).next === "string");
  if (nextApp) {
    const rec = jsonRecord(nextApp);
    const desc = rec && typeof rec.description === "string" ? rec.description : "";
    if (/console/i.test(desc) || /console/i.test(nextApp.head)) add("console", "console", `${nextApp.rel} depends on next and describes the console`);
  }

  if (files.some((f) => f.base === "records.d.ts")) add("record type", "record-type", "records.d.ts is the generated record types");

  const shippedAgent = files.find((f) => f.base === "AGENTS.md" && /ships open source/i.test(f.head));
  if (shippedAgent) add("tooling", "tooling", `${shippedAgent.rel} is an agent rule that ships with Naive, which is the tooling noun`);

  const plugin = files.find((f) => f.base === "marketplace.json" && /plugin/i.test(f.head));
  if (plugin) add("agent harness", "agent-harness", `${plugin.rel} describes a plugin for an agent harness`);

  const harnessFiles = files.filter((f) => /\bharness\b/i.test(f.head) && isCode(f));
  if (dir.endsWith("/harness") || dir === "harness") {
    if (harnessFiles.length > 0) {
      const shown = sample(harnessFiles, () => true);
      if (shown) add("harness", "harness", `${shown} speaks about a harness`);
    }
  }

  const dept = files.find((f) => {
    const rec = jsonRecord(f);
    return f.base === "departments.json" && !!rec && Array.isArray(rec.departments);
  });
  if (dept) add("function", "function", `${dept.rel} lists departments, and the function noun is a business function`);

  const bm = files.find((f) => jsonRecord(f)?.vocabulary === "business-models");
  if (bm) add("business model", "business-model", `${bm.rel} is the controlled vocabulary for business_model`);

  const sf = files.find((f) => f.base === "strategic-foundation.json" && Array.isArray(jsonRecord(f)?.questions));
  if (sf) add("strategic foundation", "strategic-foundation", `${sf.rel} lists the questions of the strategic foundation`);

  return hits.filter((h) => h.because);
}

function statusOf(dir: string, hits: Hit[]): Status {
  const concepts = [...new Set(hits.map((h) => h.concept))];
  if (concepts.length === 0) return "none";
  if (concepts.length > 1) return "several";
  const base = dir.split("/").pop() ?? dir;
  const nouns = hits.map((h) => h.noun);
  if (nouns.some((n) => nameMatches(base, n))) return "clean";
  if (hits.every((h) => h.concept === "layer") && (LAYER_IDS.includes(base) || base === "schema")) return "clean";
  return "different";
}

function kindOf(files: FileInfo[], direct: FileInfo[], ix: Index): string {
  const bits: string[] = [];
  const layer = direct.find((f) => f.base === "layer.json");
  const layerValue = layer && typeof jsonRecord(layer)?.layer === "string" ? String(jsonRecord(layer)?.layer) : "";
  if (layer && layerValue) bits.push(`a layer.json whose layer is ${layerValue}`);
  const skills = files.filter((f) => f.base === "SKILL.md").length;
  if (skills) bits.push(`${countWord(skills, "SKILL.md file")}`);
  const schemas = files.filter((f) => f.base.endsWith(".schema.json")).length;
  if (schemas) bits.push(`${countWord(schemas, "JSON Schema file")}`);
  const templates = files.filter(isTemplateFile).length;
  if (templates === 1) bits.push("1 file marked as a template");
  else if (templates) bits.push(`${templates} files marked as templates`);
  const playbooks = files.filter(isPlaybook).length;
  if (playbooks) bits.push(`${countWord(playbooks, "playbook record")} (steps, title, purpose)`);
  const packages = files.filter((f) => f.base === "package.json" && ix.packages.has(dirname(f.rel))).length;
  if (packages) bits.push(`${countWord(packages, "venture package manifest")}`);
  const fws = files.filter((f) => f.base === "framework.json" && ix.frameworks.has(dirname(f.rel))).length;
  if (fws) bits.push(`${countWord(fws, "framework.json file")} with vocabulary and maps_to`);
  const kits = files.filter((f) => f.base === "kit.json" && ix.kits.has(dirname(f.rel))).length;
  if (kits) bits.push(`${countWord(kits, "kit.json file")}`);
  const lean = files.filter((f) => f.ext === ".lean").length;
  if (lean) bits.push(`${countWord(lean, "Lean file")}`);
  const tla = files.filter((f) => f.ext === ".tla").length;
  if (tla) bits.push(`${countWord(tla, "TLA+ specification")}`);
  const code = files.filter((f) => isCode(f) && bucketOf(f, ix) === "product").length;
  if (code) bits.push(`${countWord(code, "product source file")}`);
  const company = files.filter((f) => bucketOf(f, ix) === "company").length;
  if (company) bits.push(`${countWord(company, "file")} in the company venture or its workspace file`);
  const examples = files.filter((f) => f.base === "venture.json" && !f.rel.startsWith("instance/")).length;
  if (examples) bits.push(`${countWord(examples, "example venture.json file")} outside instance/`);
  if (bits.length === 0) {
    const exts = new Map<string, number>();
    for (const f of files) exts.set(f.ext || "(none)", (exts.get(f.ext || "(none)") ?? 0) + 1);
    const top = [...exts.entries()].sort((a, b) => b[1] - a[1])[0];
    const shown = sample(direct.length ? direct : files, (f) => !HIDDEN_SAMPLE.test(f.rel));
    bits.push(top ? `${countWord(files.length, "file")}, mostly ${top[0]} (${top[1]})` : "no files");
    if (shown) bits.push(`for example ${shown}`);
  }
  const exts = new Map<string, number>();
  for (const f of files) exts.set(f.ext || "(none)", (exts.get(f.ext || "(none)") ?? 0) + 1);
  const types = [...exts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${v}`).join(", ");
  if (types && bits.length > 0 && !bits[0].includes("mostly")) bits.push(`types ${types}`);
  const sentence = `Holds ${bits.join(", ")}.`;
  return sentence.replace(/\|/g, "/").replace(/\s+/g, " ");
}

function bucketSummary(files: FileInfo[], ix: Index): { buckets: Bucket[]; why: string } {
  const present = new Set<Bucket>();
  const example = new Map<Bucket, string>();
  for (const f of files) {
    if (FURNITURE.has(f.base)) continue;
    const b = bucketOf(f, ix);
    present.add(b);
    if (!example.has(b)) {
      const p = safePath(f.rel);
      if (p) example.set(b, p);
    }
  }
  const order: Bucket[] = ["product", "library", "company", "other"];
  const buckets = order.filter((b) => present.has(b));
  const why = buckets.map((b) => `${b} (${example.get(b) ?? "files present"})`).join(", ");
  return { buckets, why };
}

function buildRows(dirs: string[], files: FileInfo[], ix: Index): Row[] {
  return dirs.filter(inScope).map((path) => {
    const underFiles = files.filter((f) => under(f.rel, path));
    const direct = underFiles.filter((f) => dirname(f.rel) === path);
    const meaningful = direct.filter((f) => !FURNITURE.has(f.base));
    const judged = meaningful.length > 0 ? meaningful : underFiles;
    const hits = hitsFor(path, judged, ix);
    const nouns = [...new Set(hits.map((h) => h.noun))];
    const { buckets, why } = bucketSummary(underFiles, ix);
    return {
      path,
      depth: path.split("/").length,
      files: underFiles.length,
      direct: direct.length,
      kind: kindOf(underFiles, direct, ix),
      nouns: nouns.length ? nouns.join(", ") : "none",
      status: statusOf(path, hits),
      because: hits.map((h) => h.because).join(" ") || "No detector matched an ontology noun.",
      buckets,
      bucketWhy: why || "no files",
    };
  });
}

const STATUS_LABEL: Record<Status, string> = {
  clean: "maps cleanly",
  different: "maps to a noun with a different name",
  several: "maps to several nouns",
  none: "no noun exists",
};

function cell(s: string): string {
  return s.replace(/\|/g, "/").replace(/\n/g, " ");
}

function threeOf(buckets: Bucket[]): Bucket[] {
  return buckets.filter((b) => b === "product" || b === "library" || b === "company");
}

function patternReport(files: FileInfo[]): string[] {
  const patterns: { name: string; test: (_f: FileInfo) => boolean }[] = [
    { name: "README.md", test: (f) => f.base === "README.md" },
    { name: "readme.md", test: (f) => f.base === "readme.md" },
    { name: "AGENTS.md", test: (f) => f.base === "AGENTS.md" },
    { name: "SKILL.md", test: (f) => f.base === "SKILL.md" },
    { name: "layer.json", test: (f) => f.base === "layer.json" },
    { name: "package.json", test: (f) => f.base === "package.json" },
    { name: "*.schema.json", test: (f) => f.base.endsWith(".schema.json") },
    { name: "*-test.mjs", test: (f) => /-test\.mjs$/.test(f.base) },
    { name: "*-test.ts", test: (f) => /-test\.ts$/.test(f.base) },
    { name: "*.test.ts", test: (f) => /\.test\.ts$/.test(f.base) },
    { name: "*.test.mjs", test: (f) => /\.test\.mjs$/.test(f.base) },
    { name: "test.mjs", test: (f) => f.base === "test.mjs" },
    { name: "*.steps.mjs", test: (f) => f.base.endsWith(".steps.mjs") },
    { name: "*.feature", test: (f) => f.base.endsWith(".feature") },
    { name: "dated YYYY-MM-DD in the filename", test: (f) => /20\d\d-\d\d-\d\d/.test(f.base) },
    { name: "*.lean", test: (f) => f.ext === ".lean" },
    { name: "*.tla", test: (f) => f.ext === ".tla" },
    { name: "*.decision.json", test: (f) => f.base.endsWith(".decision.json") },
    { name: "decisions.json", test: (f) => f.base === "decisions.json" },
    { name: "*.mdx", test: (f) => f.ext === ".mdx" },
    { name: "*.mjs", test: (f) => f.ext === ".mjs" },
    { name: "*.ts", test: (f) => f.ext === ".ts" && !f.base.endsWith(".d.ts") },
    { name: "*.tsx", test: (f) => f.ext === ".tsx" },
  ];
  const lines: string[] = [];
  lines.push("| Pattern | Count | Where the files sit |");
  lines.push("| --- | ---: | --- |");
  const locate = (list: FileInfo[]) => {
    const by = new Map<string, number>();
    for (const f of list) {
      const top = f.rel.includes("/") ? f.rel.split("/")[0] : "(root)";
      by.set(top, (by.get(top) ?? 0) + 1);
    }
    return [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(", ");
  };
  for (const p of patterns) {
    const hit = files.filter(p.test);
    lines.push(`| \`${p.name}\` | ${hit.length} | ${cell(locate(hit) || "nowhere")} |`);
  }
  return lines;
}

function conflicts(files: FileInfo[]): string[] {
  const out: string[] = [];
  const dirsOf = (pred: (_f: FileInfo) => boolean) => {
    const s = new Set<string>();
    for (const f of files) if (pred(f)) s.add(dirname(f.rel) === "." ? "(root)" : dirname(f.rel));
    return s;
  };
  const both = (a: Set<string>, b: Set<string>) => [...a].filter((d) => b.has(d)).sort();
  const starMjs = dirsOf((f) => /-test\.mjs$/.test(f.base));
  const starTs = dirsOf((f) => /-test\.ts$/.test(f.base));
  const plain = dirsOf((f) => f.base === "test.mjs");
  const dotTest = files.filter((f) => /\.test\.(mjs|ts)$/.test(f.base)).length;
  const share = both(starMjs, starTs);
  out.push(`\`*-test.mjs\` and \`*-test.ts\` both occur${share.length ? ` in ${share.join(", ")}` : ""}. \`*.test.ts\` and \`*.test.mjs\` occur ${dotTest} times.`);
  const sharePlain = both(starMjs, plain);
  if (sharePlain.length) out.push(`\`test.mjs\` and \`*-test.mjs\` both occur in ${sharePlain.join(", ")}.`);
  const dated = files.filter((f) => /20\d\d-\d\d-\d\d/.test(f.base));
  const datedWhere = new Map<string, number>();
  for (const f of dated) {
    const key = f.rel.split("/").slice(0, 2).join("/");
    datedWhere.set(key, (datedWhere.get(key) ?? 0) + 1);
  }
  const datedTop = [...datedWhere.entries()].sort((a, b) => b[1] - a[1]);
  out.push(`Dated filenames (YYYY-MM-DD) occur ${dated.length} times. ${datedTop.map(([k, v]) => `${k} has ${v}`).join(". ")}.`);
  const mjsDirs = new Map<string, number>();
  const tsDirs = new Map<string, number>();
  for (const f of files) {
    const top = f.rel.includes("/") ? f.rel.split("/")[0] : "(root)";
    if (f.ext === ".mjs") mjsDirs.set(top, (mjsDirs.get(top) ?? 0) + 1);
    if ((f.ext === ".ts" || f.ext === ".tsx") && !f.base.endsWith(".d.ts")) tsDirs.set(top, (tsDirs.get(top) ?? 0) + 1);
  }
  const mixedLang = [...mjsDirs.keys()].filter((d) => (mjsDirs.get(d) ?? 0) >= 5 && (tsDirs.get(d) ?? 0) >= 5).sort();
  if (mixedLang.length) {
    out.push(`These top-level directories hold at least five \`.mjs\` files and five \`.ts\` or \`.tsx\` files: ${mixedLang.map((d) => `${d} (${mjsDirs.get(d)} .mjs, ${tsDirs.get(d)} .ts or .tsx)`).join("; ")}.`);
  }
  const decisionFiles = files.filter((f) => f.base.endsWith(".decision.json")).length;
  const decisionLogs = files.filter((f) => f.base === "decisions.json").length;
  out.push(`Decision records use \`*.decision.json\` ${countWord(decisionFiles, "time")} and \`decisions.json\` ${countWord(decisionLogs, "time")}.`);
  const agents = files.filter((f) => f.base === "AGENTS.md").length;
  const skills = files.filter((f) => f.base === "SKILL.md").length;
  out.push(`Instruction files use two names. \`SKILL.md\` occurs ${skills} times and \`AGENTS.md\` occurs ${agents} times. \`readme.md\` occurs ${files.filter((f) => f.base === "readme.md").length} times, and \`README.md\` is the form in use.`);
  return out;
}

function gapSignals(files: FileInfo[], ix: Index): { signal: string; count: number; example: string }[] {
  const groups: { signal: string; test: (_f: FileInfo) => boolean }[] = [
    { signal: "thinking framework (framework.json with vocabulary and maps_to)", test: (f) => f.base === "framework.json" && ix.frameworks.has(dirname(f.rel)) },
    { signal: "venture package (package.json kind is handoff, core, data, folder, or raw)", test: (f) => f.base === "package.json" && ix.packages.has(dirname(f.rel)) },
    { signal: "playbook (JSON with steps, title, and purpose)", test: isPlaybook },
    { signal: "Lean proof", test: (f) => f.ext === ".lean" },
    { signal: "TLA+ specification", test: (f) => f.ext === ".tla" },
    { signal: "connector module under knowledge/connectors or platform/connectors", test: (f) => /^(knowledge|platform)\/connectors\/.+\.mjs$/.test(f.rel) },
    { signal: "term engine source under schema/terms", test: (f) => f.rel.startsWith("schema/terms/") && f.ext === ".ts" },
    { signal: "Gherkin feature", test: (f) => f.ext === ".feature" },
    { signal: "GitHub Actions workflow", test: (f) => f.rel.startsWith(".github/workflows/") && f.ext === ".yml" },
  ];
  return groups.map((g) => {
    const hit = files.filter(g.test);
    const example = sample(hit, () => true) ?? "(no citable path)";
    return { signal: g.signal, count: hit.length, example };
  }).filter((g) => g.count > 0);
}

function render(files: FileInfo[], dirs: string[], nouns: Noun[]): string {
  requireText("platform/README.md", "everything in this repository outside `platform/`");
  requireText("console/README.md", "It is platform work (Mentura), not framework");
  requireText("docs/design/NAIVE_SYSTEMS_2026-11-01.md", "mapping Naive's kinds to its classes is still to do");
  requireText("docs/design/NAIVE_SYSTEMS_2026-11-01.md", "information content entity");
  requireText("docs/design/NAIVE_SYSTEMS_2026-11-01.md", "realizable entity");
  requireText("schema/terms/engine.ts", "EE-095");
  requireText("schema/terms/engine.ts", "no check may read");
  requireText("lean/README.md", "Proofs that settle Naive's definitions");
  const decisions = JSON.parse(readFileSync(join(repo, "docs/decisions/decisions.json"), "utf8")) as unknown;
  const ee095 = isRecord(decisions) ? asArray(decisions.decisions).find((d) => isRecord(d) && d.id === "EE-095") : null;
  if (!isRecord(ee095) || typeof ee095.decision !== "string") throw new Error("EE-095 is missing");
  const ee095Text = ee095.decision;
  const layerNoun = nouns.find((n) => n.noun === "layer");
  if (!layerNoun || !LAYER_IDS.every((id) => layerNoun.meaning.includes(id))) throw new Error("layer noun does not name the six layers");
  const admitted = JSON.parse(readFileSync(join(repo, "schema/terms/admitted.json"), "utf8")) as unknown;
  const terms = isRecord(admitted) ? asArray(admitted.terms).filter(isRecord) : [];
  const termIds = terms.map((t) => String(t.id));

  const ix = buildIndex(files);
  const rows = buildRows(dirs, files, ix);
  const top = withoutIgnored(readdirSync(repo, { withFileTypes: true }).filter((e) => e.name !== ".git" && !SKIP_DIR.has(e.name)).map((e) => e.name).sort());
  const topDirs = top.filter((n) => existsSync(join(repo, n)) && statSync(join(repo, n)).isDirectory());
  const topFiles = top.filter((n) => !topDirs.includes(n));

  const counts: Record<Status, number> = { clean: 0, different: 0, several: 0, none: 0 };
  for (const r of rows) counts[r.status]++;

  const live = nouns.filter((n) => n.status !== "retired");
  const retired = nouns.filter((n) => n.status === "retired");
  const schemaStems = new Set(files.filter((f) => f.base.endsWith(".schema.json")).map((f) => norm(f.base.replace(/\.schema\.json$/, ""))));
  const folderBases = new Set(dirs.map((d) => norm(d.split("/").pop() ?? "")));
  const hitNouns = new Set(rows.flatMap((r) => r.nouns === "none" ? [] : r.nouns.split(", ")));
  const homes = live.map((n) => {
    const key = norm(n.noun);
    const folder = folderBases.has(key) || [...folderBases].some((b) => b === `${key}s` || b === `${key}es` || key === `${b}s`);
    const schema = schemaStems.has(key);
    const detected = hitNouns.has(n.noun);
    return { noun: n, folder, schema, detected };
  });
  const noHome = homes.filter((h) => !h.folder && !h.schema && !h.detected);

  const lines: string[] = [];
  lines.push("# Architecture inventory, 2026-11-03");
  lines.push("");
  lines.push("This file is generated by `scripts/architecture-inventory.ts`. From the repository root, `node scripts/architecture-inventory.ts` rewrites it. `node scripts/architecture-inventory.ts --check` exits 1 when the committed file differs from a fresh run.");
  lines.push("");
  lines.push("The script lives in `scripts/` next to `scripts/diagnose-transcripts.mjs` and `scripts/pr-review/`. Those are repository tools. `schema/` holds the checkers a venture runs. This report describes the repository tree. It is not one of those checkers.");
  lines.push("");
  lines.push("## What was counted");
  lines.push("");
  lines.push(`The walk skips \`.git\`, \`node_modules\`, \`.lake\`, \`.next\`, filenames that start with \`.env\`, paths git ignores, and \`docs/reviews/\` so this generated file is not part of its own count. It found ${files.length} files and ${dirs.length} directories.`);
  lines.push("");
  lines.push(`Top-level entries besides \`.git\` are ${top.length}. ${topDirs.length} are directories and ${topFiles.length} are files. A count of ${top.length - 1} is one short of this listing.`);
  lines.push("");
  lines.push(`Directories: ${topDirs.map((d) => `\`${d}\``).join(", ")}.`);
  lines.push("");
  lines.push(`Files: ${topFiles.map((d) => `\`${d}\``).join(", ")}.`);
  lines.push("");
  lines.push("A folder row's file count is recursive. It includes files in child folders that also have their own rows. Direct is the count of files in that folder itself. Summing the files column double counts.");
  lines.push("");
  lines.push("The table covers every directory at depth 1 and depth 2, and depth 3 under `schema/` only. Deeper directories are counted in their parents and are not separate rows.");
  lines.push("");
  lines.push("Kind is judged from file contents. The detectors read JSON fields, front matter, filenames such as `SKILL.md` and `*.schema.json`, and source files. They do not treat the directory name as the kind. The directory name is used only afterwards, to decide whether a matched noun uses the same name.");
  lines.push("");
  lines.push("Nouns come from `docs/ontology.json`. Admitted terms come from `schema/terms/admitted.json`. A row maps cleanly when one concept matched and the folder name is that noun, or a plural of it, or one of the six layer names the layer noun lists, or `schema` for the system layer. A row maps to a noun with a different name when one concept matched and the folder name does not. A row maps to several nouns when two concepts matched. Layer and layer manifest count as one concept, and schema and record type count as one concept, because each pair is the folder and the file the ontology already ties together. A row has no noun when no detector matched.");
  lines.push("");
  lines.push(`Of the ${rows.length} folders, ${counts.clean} map cleanly, ${counts.different} map to a noun with a different name, ${counts.several} map to several nouns, and ${counts.none} have no noun.`);
  lines.push("");
  lines.push("## 1. Folders");
  lines.push("");
  lines.push("| Path | Files | Direct | What it holds | Nouns | Status |");
  lines.push("| --- | ---: | ---: | --- | --- | --- |");
  for (const r of rows) {
    lines.push(`| \`${cell(r.path)}\` | ${r.files} | ${r.direct} | ${cell(r.kind)} | ${cell(r.nouns)} | ${STATUS_LABEL[r.status]} |`);
  }
  lines.push("");
  lines.push("## 2. File naming patterns");
  lines.push("");
  lines.push(...patternReport(files));
  lines.push("");
  lines.push("Conflicts, from those counts:");
  lines.push("");
  for (const c of conflicts(files)) lines.push(`- ${c}`);
  lines.push("");
  lines.push("## 3. Product code, shipped library, and company records");
  lines.push("");
  lines.push("The three kinds are product code, the library shipped to users (frameworks, playbooks, and templates, plus skills, venture packages, and kits that travel with them), and the company's own records. A file is a company record when it sits in the directory of a `venture.json` under `instance/`, or it is `instance/workspace.json`. The script found these company ventures:");
  lines.push("");
  if (ix.company.length === 0) lines.push("None. `instance/` has no `venture.json`.");
  for (const c of ix.company) lines.push(`- \`${c.root}\`, id \`${c.id}\`.`);
  lines.push("");
  lines.push("A file is library when it is marked `type: template`, has `\"template\": true`, is a playbook (`steps`, `title`, and `purpose`), is a `SKILL.md` or a file under that skill directory, is `framework.json` with `vocabulary` and `maps_to` or a `.mjs` file in that same directory, is a venture `package.json` whose `kind` is handoff, core, data, folder, or raw, sits in the tree of a `decision-rights.json` with `template` true, or is a non-code file beside `kit.json`. Other `.mjs`, `.ts`, `.tsx`, `.py`, `*.schema.json`, and `*.feature` files are product code. Anything else is other. `README.md`, `LICENSE`, and `.gitignore` do not decide the kind.");
  lines.push("");
  lines.push("The six directories that were expected to be the company's records, checked against those rules:");
  lines.push("");
  lines.push("| Path | Kinds present | Example file for each kind | Company records |");
  lines.push("| --- | --- | --- | --- |");
  for (const name of ["purpose", "governance", "evidence", "operations", "knowledge", "instance"]) {
    const row = rows.find((r) => r.path === name);
    if (!row) {
      lines.push(`| \`${name}\` | missing | | no |`);
      continue;
    }
    const company = row.buckets.includes("company");
    lines.push(`| \`${name}\` | ${row.buckets.join(", ")} | ${cell(row.bucketWhy)} | ${company ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("`instance/` is the company workspace. The other five are framework layers. Each of their `layer.json` files describes the layer for a venture in general. Their files are skills, templates, frameworks, package manifests, checkers, or study outputs. They are not the filled-in records of the venture under `instance/`.");
  lines.push("");
  lines.push("Top-level directories by the three kinds. Other material is listed and does not by itself count as a mix of the three.");
  lines.push("");
  lines.push("| Path | Product, library, company | Also other | Mix of the three |");
  lines.push("| --- | --- | --- | --- |");
  for (const d of topDirs) {
    const row = rows.find((r) => r.path === d);
    if (!row) continue;
    const three = threeOf(row.buckets);
    const other = row.buckets.includes("other");
    lines.push(`| \`${d}\` | ${three.length ? three.join(", ") : "none of the three"} | ${other ? "yes" : "no"} | ${three.length > 1 ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push("In-scope folders that mix two or more of the three kinds:");
  lines.push("");
  lines.push("| Path | Kinds | Examples |");
  lines.push("| --- | --- | --- |");
  const mixes = rows.filter((r) => threeOf(r.buckets).length > 1);
  if (mixes.length === 0) lines.push("| (none) | | |");
  for (const r of mixes) lines.push(`| \`${r.path}\` | ${threeOf(r.buckets).join(", ")} | ${cell(r.bucketWhy)} |`);
  lines.push("");
  lines.push("`package.json` lists the published package's `files`. That list includes `interface/`, `schema/`, `library/packages/`, `purpose/`, `knowledge/`, `operations/`, `governance/`, `evidence/`, `platform/`, and `frameworks/`. The published package therefore ships product code, the library, and the layer manifests together. It does not list `instance/`, `console/`, or `site/`.");
  lines.push("");
  lines.push("`platform/README.md` says the framework is everything in this repository outside `platform/`. `console/README.md` says the console is platform work and not framework, and the console directory is not under `platform/`. Those two READMEs disagree about where platform work lives.");
  lines.push("");
  lines.push("`site/scripts/venture-facts.mjs` is product code. `site/AGENTS.md` says it reads this venture's marketing facts. The company records stay in `instance/`. The site reads them.");
  lines.push("");
  lines.push("## 4. Gaps");
  lines.push("");
  lines.push("Content that shows up in the tree and matched no ontology noun:");
  lines.push("");
  lines.push("| Signal | Files | Example |");
  lines.push("| --- | ---: | --- |");
  for (const g of gapSignals(files, ix)) lines.push(`| ${cell(g.signal)} | ${g.count} | \`${cell(g.example)}\` |`);
  lines.push("");
  lines.push(`\`docs/ontology.json\` has ${nouns.length} nouns. ${retired.length} are retired and are left out of the homeless list. ${live.length} are kept, new, or proposed.`);
  lines.push("");
  lines.push("A live noun has a home in this report when a folder row named it, a directory basename matches it, or a `*.schema.json` stem matches it. Matching a schema file means the record type is defined. It does not mean a directory of those records exists at depth 2. The company venture's own folders sit below `instance/ventures/` and are past the depth cut, so a record can exist there without a row of its own.");
  lines.push("");
  const byLevel = new Map<string, string[]>();
  for (const h of noHome) {
    const list = byLevel.get(h.noun.level) ?? [];
    list.push(h.noun.noun);
    byLevel.set(h.noun.level, list);
  }
  lines.push(`Live nouns with no folder match, no schema-file stem, and no detector hit: ${noHome.length}.`);
  lines.push("");
  for (const [level, list] of [...byLevel.entries()].sort()) {
    lines.push(`- ${level} (${list.length}): ${list.sort().join(", ")}.`);
  }
  lines.push("");
  lines.push(`Admitted terms in \`schema/terms/admitted.json\`: ${termIds.length} (${termIds.join(", ")}). None of these ids is a top-level directory. The term engine currently admits roles and acts. It does not admit architecture folders.`);
  lines.push("");
  lines.push("Two kit locations exist. `platform/kits/` holds `kit.json` files, which is the path `platform/kits/README.md` states. `purpose/kits/` holds the validation kit, headed as a kit in `purpose/kits/validation/README.md`, with templates and skills and no `kit.json` in that tree. The kit noun has two homes, and they are not the same shape.");
  lines.push("");
  decisionText(decisions, "EE-090", "in-force", "functions/");
  decisionText(decisions, "EE-091", "in-force", "identity/");
  decisionText(decisions, "EE-010", "in-force", "governance/company-template/");
  requireAbsent("functions");
  requireAbsent("identity");
  requireAbsent("governance/company-template");
  if (!existsSync(join(repo, "governance/venture-template"))) throw new Error("governance/venture-template is missing");
  lines.push("Some in-force decisions name directories the walk does not find. EE-090 says every venture has a `functions/` folder and says that folder is not built yet. There is no `functions` directory. EE-091 moves `foundation/` records to `identity/` and says that move is not built yet. There is no `identity` directory. EE-010 names `governance/company-template/`. The tree has `governance/venture-template/` instead.");
  lines.push("");
  lines.push("## 5. Candidate category sets");
  lines.push("");
  lines.push("These are candidates the current tree can support. This inventory does not choose one.");
  lines.push("");
  lines.push("`docs/design/NAIVE_SYSTEMS_2026-11-01.md` cites Basic Formal Ontology (ISO/IEC 21838-2). It says a record is an information content entity, a generically dependent continuant. It says a function is a realizable entity. It also says mapping Naive's kinds to BFO classes is still to do. None of the sets below is that mapping. Under the sentences the design doc does state, the files in every set are information content entities. The company venture is the continuant those company records are about. Departments in `operations/departments.json` are closer to the realizable side, and they are a catalog file, not a top-level directory.");
  lines.push("");
  lines.push("### Layers, the system layer, and a remainder");
  lines.push("");
  lines.push("The layer noun in `docs/ontology.json` names six layers. `schema/layer.json` sets `layer` to `system`, and the layer manifest noun names that path. This set follows those two nouns and leaves every other top-level directory in a remainder.");
  lines.push("");
  const layerRows = rows.filter((r) => r.depth === 1);
  const six = layerRows.filter((r) => LAYER_IDS.includes(r.path) && r.kind.includes("layer.json"));
  lines.push(`The six layer directories: ${six.map((r) => `\`${r.path}\``).join(", ")}.`);
  lines.push("");
  decisionText(decisions, "EE-001", "in-force", "Execution");
  decisionText(decisions, "EE-013", "in-force", "seven layers");
  decisionText(decisions, "EE-038", "proposed", "six layers");
  requireAbsent("execution");
  lines.push("EE-001 and EE-013 are in force and still say seven layers, including Execution. EE-038, which says six layers and folds execution into operations, is still proposed. The walk finds no `execution` directory. This candidate follows the noun and the tree, while those two in-force decisions still name a seventh layer.");
  lines.push("");
  lines.push("`schema` is the system layer by `schema/layer.json`, and it also holds most of the checker source.");
  lines.push("");
  const remainder = topDirs.filter((d) => !LAYER_IDS.includes(d) && d !== "schema");
  lines.push(`Remainder: ${remainder.map((d) => `\`${d}\``).join(", ")}.`);
  lines.push("");
  lines.push("BFO does not separate these directories. The design doc gives a record one class and a function another. It does not give a layer a class. A layer directory that mixes skills, templates, and checkers is several information artifacts in one folder.");
  lines.push("");
  lines.push("### Framework, platform, and workspace");
  lines.push("");
  lines.push("`platform/README.md` states the framework and platform split. The framework is everything outside `platform/`. The platform is `platform/`. `instance/workspace.json` declares the workspace, which is the ontology noun workspace. `console/README.md` puts the console on the platform side and keeps it outside `platform/`.");
  lines.push("");
  lines.push("- Platform, by `platform/README.md`: `platform`.");
  lines.push("- Platform, by `console/README.md`, stored outside `platform/`: `console`.");
  lines.push("- Workspace: `instance`.");
  lines.push(`- Framework, if the platform README is applied to the rest: ${topDirs.filter((d) => d !== "platform" && d !== "console" && d !== "instance").map((d) => `\`${d}\``).join(", ")}.`);
  lines.push("");
  lines.push("BFO does not draw the framework and platform line. Both sides are files. The workspace adds the continuant, the venture, and the information content entities about it. The console exception shows the split is not yet a single directory boundary.");
  lines.push("");
  lines.push("### Product code, shipped library, and company records");
  lines.push("");
  lines.push("This set uses the file rules in section 3. A top-level directory goes where its files go. A directory that mixes kinds would have to be split before it could sit in one category.");
  lines.push("");
  const groups: Record<string, string[]> = { product: [], library: [], company: [], mixed: [], other: [] };
  for (const d of topDirs) {
    const row = rows.find((r) => r.path === d);
    if (!row) continue;
    const three = threeOf(row.buckets);
    if (three.length > 1) groups.mixed.push(d);
    else if (three.length === 1) groups[three[0]].push(d);
    else groups.other.push(d);
  }
  lines.push(`- Product code only: ${groups.product.map((d) => `\`${d}\``).join(", ") || "none"}.`);
  lines.push(`- Library only: ${groups.library.map((d) => `\`${d}\``).join(", ") || "none"}.`);
  lines.push(`- Company records only: ${groups.company.map((d) => `\`${d}\``).join(", ") || "none"}.`);
  lines.push(`- Mixed: ${groups.mixed.map((d) => `\`${d}\``).join(", ") || "none"}.`);
  lines.push(`- None of the three (proofs, docs, CI, plugin manifests, or similar): ${groups.other.map((d) => `\`${d}\``).join(", ") || "none"}.`);
  lines.push("");
  lines.push("BFO would not make these three into top categories. Product code, the library, and the company records are all files, so the design doc's record sentence puts them in one class, information content entity. What differs is whose artifact the file is. The company records are about the venture continuant. The library and the product code are about the framework. The design doc has not assigned those roles to BFO classes.");
  lines.push("");
  lines.push("## A future check, not built here");
  lines.push("");
  lines.push("EE-095 is in force. Its decision text in `docs/decisions/decisions.json` says:");
  lines.push("");
  lines.push(`> ${ee095Text}`);
  lines.push("");
  lines.push("A rule that every folder resolves to an ontology term would have to enter through that admission. The properties would be checks in `schema/terms/engine.ts`, frozen and cross-run by `schema/terms/admit.ts`, with the Lean theorems named and present in `lean/Naive`. `lean/README.md` says those proofs settle definitions. `schema/ontology-gate.ts` is the membership gate for a handoff package. It does not look at directories.");
  lines.push("");
  lines.push("Admission records a theorem name when that name appears in `lean/Naive`. The same EE-095 text says admission does not yet check that the named theorem proves the current properties. A folder rule admitted the same way would have that same gap.");
  lines.push("");
  lines.push("A side script that only compares folder names to `docs/ontology.json` would not be that admission. EE-095 says a dispute is settled by running the checks and the proofs, not by asking, and not by a check that sits beside the engine. The engine's own header says no check may read the label. This inventory is evidence. It is not that check.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function main(): void {
  const walked = walkFiles();
  const kept = new Set(withoutIgnored(walked.map((f) => f.rel)));
  const files = walked.filter((f) => kept.has(f.rel));
  const dirs = withoutIgnored(walkDirs());
  const nouns = loadNouns();
  for (const n of nouns) if (!n.noun) throw new Error("blank noun");
  const text = render(files, dirs, nouns);
  const arg = process.argv[2];
  if (arg === "--stdout") {
    process.stdout.write(text);
    return;
  }
  if (arg === "--check") {
    if (!existsSync(reviewPath)) {
      console.error("missing review");
      process.exit(1);
    }
    const have = readFileSync(reviewPath, "utf8");
    if (have !== text) {
      console.error("review differs from a fresh run");
      process.exit(1);
    }
    console.log("check ok");
    return;
  }
  if (arg) {
    console.error("unknown argument");
    process.exit(2);
  }
  mkdirSync(dirname(reviewPath), { recursive: true });
  writeFileSync(reviewPath, text);
  console.log(`wrote ${relative(repo, reviewPath)}`);
}

main();
