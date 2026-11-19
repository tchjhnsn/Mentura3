// The folder host's presentations (./presentation.ts): the policy at `presentation-policy.json` and one record per
// appearance at `presentations/<id>.json`, each write logged in memory.jsonl like every other record.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readRecord, writeRecord } from "./record-io.ts";
import { defaultPolicy, gateFor, ID, parsePresentation, parsePresentationPolicy, type Presentation, type PresentationPolicy } from "./presentation.ts";

export const POLICY_FILE = "presentation-policy.json";
export const PRESENTATIONS_DIR = "presentations";
const SCHEMA_DIR = "https://github.com/tchjhnsn/reflect/blob/main/packages/core/schemas";

/** Where a vault keeps its presentation policy and records. */
export interface Presentations {
  /** The policy in the vault, or the default when the vault has none yet. Throws on a policy that fails its check. */
  policy(): Promise<PresentationPolicy>;
  /** Writes the default policy when the vault has none, so the person can see and edit it. */
  ensurePolicy(): Promise<{ written: boolean }>;
  get(id: string): Promise<Presentation | null>;
  put(p: Presentation): Promise<void>;
  /** Every record, newest first. */
  list(): Promise<Presentation[]>;
}

const json = (v: unknown, schema: string): string => `${JSON.stringify({ $schema: `${SCHEMA_DIR}/${schema}`, ...(v as object) }, null, 2)}\n`;
const strip = (v: unknown): unknown => {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const { $schema: _drop, ...rest } = v as Record<string, unknown>;
    return rest;
  }
  return v;
};

export function filesPresentations(root: string, person: string, opts: { now?: () => Date } = {}): Presentations {
  const now = opts.now ?? (() => new Date());
  async function policy(): Promise<PresentationPolicy> {
    const text = await readRecord(root, POLICY_FILE);
    if (text === null) return defaultPolicy(person);
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(`${POLICY_FILE} is not JSON`);
    }
    const r = parsePresentationPolicy(strip(raw));
    if (!r.policy) throw new Error(`${POLICY_FILE}: ${r.problems.join("; ")}`);
    return r.policy;
  }
  async function get(id: string): Promise<Presentation | null> {
    if (!ID.test(id)) throw new Error("a presentation id is lower case letters, digits and hyphens");
    const text = await readRecord(root, join(PRESENTATIONS_DIR, `${id}.json`));
    if (text === null) return null;
    const r = parsePresentation(strip(JSON.parse(text)));
    if (!r.presentation) throw new Error(`${PRESENTATIONS_DIR}/${id}.json: ${r.problems.join("; ")}`);
    return r.presentation;
  }
  return {
    policy,
    async ensurePolicy() {
      if ((await readRecord(root, POLICY_FILE)) !== null) return { written: false };
      await writeRecord(root, POLICY_FILE, json(defaultPolicy(person), "presentation-policy.schema.json"), "create", now().toISOString());
      return { written: true };
    },
    get,
    async put(p) {
      const r = parsePresentation(p);
      if (!r.presentation) throw new Error(r.problems.join("; "));
      const rel = join(PRESENTATIONS_DIR, `${p.id}.json`);
      const old = await readRecord(root, rel);
      await writeRecord(root, rel, json(p, "presentation.schema.json"), old === null ? "create" : "append", now().toISOString());
    },
    async list() {
      const ids = (await presentationFiles(root)).map((f) => f.replace(/\.json$/, ""));
      const all = await Promise.all(ids.map(get));
      return all.filter((p): p is Presentation => p !== null).sort((a, b) => b.created.localeCompare(a.created) || b.id.localeCompare(a.id));
    },
  };
}

async function presentationFiles(root: string): Promise<string[]> {
  try {
    return (await readdir(join(root, PRESENTATIONS_DIR))).filter((f) => f.endsWith(".json") && ID.test(f.replace(/\.json$/, ""))).sort();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

/**
 * What `reflect check` finds wrong: a policy that fails its check, a record that is not one, a record whose file name
 * is not its id, and a record on a channel the policy lacks. A record that is not ready is not a problem: a draft may
 * wait.
 */
export async function presentationProblems(root: string, person: string): Promise<string[]> {
  const out: string[] = [];
  let policy: PresentationPolicy | null = null;
  try {
    policy = await filesPresentations(root, person).policy();
  } catch (e) {
    out.push((e as Error).message);
  }
  for (const f of await presentationFiles(root)) {
    const rel = `${PRESENTATIONS_DIR}/${f}`;
    const text = (await readRecord(root, rel)) ?? "";
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      out.push(`${rel} is not JSON`);
      continue;
    }
    const r = parsePresentation(strip(raw));
    if (!r.presentation) {
      out.push(`${rel}: ${r.problems.join("; ")}`);
      continue;
    }
    if (`${r.presentation.id}.json` !== f) out.push(`${rel}: its id is ${r.presentation.id}`);
    if (policy && !policy.channels.some((c) => c.id === r.presentation!.channel)) out.push(`${rel}: the policy has no channel ${r.presentation.channel}`);
  }
  return out;
}

/** The gate for a record kept in the vault, by id, as the runner asks it. */
export async function vaultGate(store: Presentations, id: unknown, channelId: string) {
  const policy = await store.policy();
  const record = typeof id === "string" && ID.test(id) ? await store.get(id) : null;
  return gateFor(policy, record, channelId);
}
