// The research store (architecture section 4). Confidential (Mentura).
// JSONL files under RESEARCH_STORE (default .naive/research/, gitignored), one file per kind; a
// later line for the same id replaces an earlier one, so writes only ever append.
//
// TODO(neon): the same interface over Neon Postgres with pgvector (tables cells, claims, sources,
// citations, judgments, verifications), one branch per research run or prompt change. A Postgres
// store implements put(kind, record), all(kind), get(kind, id) and answered(); run.mjs takes any
// object with those four methods.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const KINDS = ["cells", "sources", "claims", "citations"];
const keyOf = (kind, r) => kind === "citations" ? `${r.claim_id}>${r.source_id}` : r.id;

export function jsonlStore(dir = process.env.RESEARCH_STORE ?? ".naive/research") {
  const root = resolve(dir);
  const file = (kind) => { if (!KINDS.includes(kind)) throw new Error(`unknown kind ${kind}`); return join(root, `${kind}.jsonl`); };
  const all = (kind) => {
    if (!existsSync(file(kind))) return [];
    const m = new Map();
    for (const line of readFileSync(file(kind), "utf8").split("\n")) if (line.trim()) { const r = JSON.parse(line); m.set(keyOf(kind, r), r); }
    return [...m.values()];
  };
  return {
    root,
    put(kind, record) { mkdirSync(root, { recursive: true }); appendFileSync(file(kind), JSON.stringify(record) + "\n"); return record; },
    all,
    get: (kind, id) => all(kind).find((r) => keyOf(kind, r) === id) ?? null,
    answered: () => new Map(all("cells").map((c) => [c.id, c])),
  };
}
