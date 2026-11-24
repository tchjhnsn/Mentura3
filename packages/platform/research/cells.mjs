// The research cell generator (architecture section 1). Confidential (Mentura).
// Cells are the cross product ventures x functions x frames x times x aspects. Functions come from
// packages/naive/src/functions/departments.json, frames from packages/naive/library/packages/*/frames, times from the lifecycle phases. A
// cell already answered and still fresh is skipped. No model is called here.
//
//   node platform/research/cells.mjs --venture nike --function marketing-and-sales [--limit 50]

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { naiveCode, naivePhases } from "../naive.ts";

// Functions, phases and frames are Naive's records, read from the installed package.
const repo = naiveCode;
const load = (p) => JSON.parse(readFileSync(join(repo, p), "utf8"));
// The aspects the pilots use: what the situation was, what was decided, who decided, the evidence
// at the time, and what came of it.
export const ASPECTS = ["state", "decision", "decider", "evidence", "outcome"];

export function functions() { return load("packages/naive/src/functions/departments.json").departments.map((d) => d.id); }
export function phases() { return naivePhases().map((p) => p.id); }
export function frames() {
  const dir = join(repo, "packages/naive/library", "packages");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((p) => existsSync(join(dir, p, "frames"))).flatMap((p) =>
    readdirSync(join(dir, p, "frames")).filter((f) => f.endsWith(".frame.json")).map((f) => load(`packages/naive/library/packages/${p}/frames/${f}`)))
    .map((f) => ({ id: f.id, functions: f.functions ?? [] }));
}

export const cellId = (c) => [c.venture, c.function, c.frame, c.time, c.aspect].join(":");

// answered: a Map of cell id to its stored cell; a cell counts as done when answered and fresh.
/** @param {{ ventures: string[], functions?: string[], frames?: { id: string, functions: string[] }[], times?: string[], aspects?: string[], answered?: Map<string, any>, now?: number, limit?: number }} o */
export function generate({ ventures, functions: fns = functions(), frames: frs = frames(), times = phases(), aspects = ASPECTS, answered = new Map(), now = Date.now(), limit = Infinity }) {
  const out = [];
  for (const venture of ventures) for (const fn of fns) for (const fr of frs) {
    // A frame that names known functions only crosses those; one naming none we know crosses all.
    const known = (fr.functions ?? []).filter((f) => fns.includes(f));
    if (known.length && !known.includes(fn)) continue;
    for (const time of times) for (const aspect of aspects) {
      const cell = { id: "", venture, function: fn, frame: fr.id, time, aspect, status: "open" };
      cell.id = cellId(cell);
      const prior = answered.get(cell.id);
      if (prior?.status === "answered" && (!prior.fresh_until || Date.parse(prior.fresh_until) > now)) continue;
      out.push(cell);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
  const cells = generate({ ventures: [arg("--venture") ?? "example"], functions: arg("--function") ? [arg("--function")] : undefined, limit: Number(arg("--limit") ?? Infinity) });
  for (const c of cells) console.log(JSON.stringify(c));
}
