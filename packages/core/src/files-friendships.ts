// The folder host's friendships (./friendship.ts): one record per friendship at `friendships/<id>.json`, one per
// evaluation at `friendships/evaluations/<id>.json`, and the person's question catalog at `friendships/catalog.json`.
// Each write is logged in memory.jsonl like every other record. Private: nothing here is published.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readRecord, writeRecord } from "./record-io.ts";
import {
  DEFAULT_CATALOG,
  ID,
  parseCatalog,
  parseEvaluation,
  parseFriendship,
  questionById,
  type FriendshipCatalog,
  type FriendshipEvaluation,
  type Friendship,
} from "./friendship.ts";

export const FRIENDSHIPS_DIR = "friendships";
export const EVALUATIONS_DIR = join(FRIENDSHIPS_DIR, "evaluations");
export const CATALOG_FILE = join(FRIENDSHIPS_DIR, "catalog.json");
const SCHEMA_DIR = "https://github.com/tchjhnsn/reflect/blob/main/packages/core/schemas";

const json = (v: unknown, schema: string): string => `${JSON.stringify({ $schema: `${SCHEMA_DIR}/${schema}`, ...(v as object) }, null, 2)}\n`;
const strip = (v: unknown): unknown => {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const { $schema: _drop, ...rest } = v as Record<string, unknown>;
    return rest;
  }
  return v;
};

async function idsIn(root: string, dir: string): Promise<string[]> {
  try {
    return (await readdir(join(root, dir))).filter((f) => f.endsWith(".json") && f !== "catalog.json" && ID.test(f.replace(/\.json$/, ""))).map((f) => f.replace(/\.json$/, "")).sort();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

function parseText<T>(text: string, rel: string, parse: (raw: unknown, at: string) => { problems: string[] } & Record<string, unknown>, key: string): T {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`${rel} is not JSON`);
  }
  const r = parse(strip(raw), rel);
  if (!r[key]) throw new Error(r.problems.join("; "));
  return r[key] as T;
}

/** Where a vault keeps friendships, their evaluations and the question catalog. */
export interface FriendshipsFolder {
  catalog(): Promise<FriendshipCatalog>;
  putCatalog(c: FriendshipCatalog): Promise<void>;
  get(id: string): Promise<Friendship | null>;
  put(f: Friendship): Promise<void>;
  list(): Promise<Friendship[]>;
  getEvaluation(id: string): Promise<FriendshipEvaluation | null>;
  putEvaluation(e: FriendshipEvaluation): Promise<void>;
  /** Every evaluation, or one friendship's, newest first. */
  evaluations(friendship?: string): Promise<FriendshipEvaluation[]>;
}

export function filesFriendships(root: string, opts: { now?: () => Date } = {}): FriendshipsFolder {
  const now = opts.now ?? (() => new Date());
  const checkId = (id: string, what: string) => {
    if (!ID.test(id)) throw new Error(`a ${what} id is lower case letters, digits and hyphens`);
  };
  async function write(rel: string, bytes: string) {
    const old = await readRecord(root, rel);
    await writeRecord(root, rel, bytes, old === null ? "create" : "append", now().toISOString());
  }
  async function get(id: string): Promise<Friendship | null> {
    checkId(id, "friendship");
    const rel = join(FRIENDSHIPS_DIR, `${id}.json`);
    const text = await readRecord(root, rel);
    return text === null ? null : parseText<Friendship>(text, rel, (raw, at) => parseFriendship(raw, at), "friendship");
  }
  async function getEvaluation(id: string): Promise<FriendshipEvaluation | null> {
    checkId(id, "evaluation");
    const rel = join(EVALUATIONS_DIR, `${id}.json`);
    const text = await readRecord(root, rel);
    return text === null ? null : parseText<FriendshipEvaluation>(text, rel, (raw, at) => parseEvaluation(raw, at), "evaluation");
  }
  return {
    async catalog() {
      const text = await readRecord(root, CATALOG_FILE);
      return text === null ? { ...DEFAULT_CATALOG } : parseText<FriendshipCatalog>(text, CATALOG_FILE, (raw, at) => parseCatalog(raw, at), "catalog");
    },
    async putCatalog(c) {
      const r = parseCatalog(c);
      if (!r.catalog) throw new Error(r.problems.join("; "));
      await write(CATALOG_FILE, json(c, "friendship-catalog.schema.json"));
    },
    get,
    async put(f) {
      const r = parseFriendship(f);
      if (!r.friendship) throw new Error(r.problems.join("; "));
      await write(join(FRIENDSHIPS_DIR, `${f.id}.json`), json(f, "friendship.schema.json"));
    },
    async list() {
      const all = await Promise.all((await idsIn(root, FRIENDSHIPS_DIR)).map(get));
      return all.filter((f): f is Friendship => f !== null).sort((a, b) => a.friend.name.localeCompare(b.friend.name) || a.id.localeCompare(b.id));
    },
    getEvaluation,
    async putEvaluation(e) {
      const r = parseEvaluation(e);
      if (!r.evaluation) throw new Error(r.problems.join("; "));
      if (!(await get(e.friendship))) throw new Error(`no friendship ${e.friendship}`);
      await write(join(EVALUATIONS_DIR, `${e.id}.json`), json(e, "friendship-evaluation.schema.json"));
    },
    async evaluations(friendship) {
      const all = await Promise.all((await idsIn(root, EVALUATIONS_DIR)).map(getEvaluation));
      return all
        .filter((e): e is FriendshipEvaluation => e !== null && (!friendship || e.friendship === friendship))
        .sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created));
    },
  };
}

/** A new id from a base, with -2, -3 and so on when it is taken. */
export function freshId(base: string, taken: ReadonlySet<string>): string {
  const b = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "friend";
  if (!taken.has(b)) return b;
  for (let n = 2; ; n++) if (!taken.has(`${b}-${n}`)) return `${b}-${n}`;
}

/**
 * What `reflect check` finds wrong in friendships/: a record that is not one, a file name that is not its id, an
 * evaluation naming a friendship the vault lacks or a question the catalog lacks, and a catalog that fails its check.
 */
export async function friendshipProblems(root: string): Promise<string[]> {
  const out: string[] = [];
  const store = filesFriendships(root);
  let catalog: FriendshipCatalog = DEFAULT_CATALOG;
  try {
    catalog = await store.catalog();
  } catch (e) {
    out.push((e as Error).message);
  }
  const friendships = new Set<string>();
  for (const id of await idsIn(root, FRIENDSHIPS_DIR)) {
    try {
      const f = await store.get(id);
      if (f && f.id !== id) out.push(`${FRIENDSHIPS_DIR}/${id}.json: its id is ${f.id}`);
      friendships.add(id);
    } catch (e) {
      out.push((e as Error).message);
    }
  }
  for (const id of await idsIn(root, EVALUATIONS_DIR)) {
    const rel = `${EVALUATIONS_DIR}/${id}.json`;
    try {
      const e = await store.getEvaluation(id);
      if (!e) continue;
      if (e.id !== id) out.push(`${rel}: its id is ${e.id}`);
      if (!friendships.has(e.friendship)) out.push(`${rel}: no friendship ${e.friendship}`);
      for (const a of e.answers) {
        const q = questionById(catalog, a.question);
        if (!q) out.push(`${rel}: no question ${a.question}`);
        else if (!q.choices.some((c) => c.id === a.choice)) out.push(`${rel}: ${a.question} has no choice ${a.choice}`);
      }
    } catch (e) {
      out.push((e as Error).message);
    }
  }
  return out;
}
