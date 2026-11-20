// The app's presentations (Reflect framework plan, step 6): the person's presentation policy and one record per
// appearance, the same JSON a vault keeps in `presentation-policy.json` and `presentations/<id>.json`
// (@reflect/core/files-presentations), here kept in `person_fact` so no migration is needed. Each file is one key,
// `presentation-policy` or `presentation/<id>`, its JSON sealed with the person's key. A new version closes the open
// row and adds one, as every person_fact does, so every draft is kept and none is overwritten (the table is
// append-only, migration 0004). The rows are written as `stated`, the only source person_fact has: the change log
// (action_change) says whether the person or an agent drafted each version.
import { defaultPolicy, gateFor, ID, parsePresentation, parsePresentationPolicy, type GateVerdict, type Presentation, type PresentationPolicy } from "@reflect/core/presentation";
import type { Presentations } from "@reflect/core/files-presentations";
import { db, transaction } from "@/db/pool";
import { open, seal } from "./crypto";
import { currentName } from "./person-store";

export type { Presentations };

export const POLICY_KEY = "presentation-policy";
const RECORD_PREFIX = "presentation/";
const keyOf = (id: string) => `${RECORD_PREFIX}${id}`;

async function currentText(userId: string, key: string): Promise<string | null> {
  const r = await db().query("SELECT value_ct FROM person_fact WHERE user_id = $1 AND key = $2 AND valid_to IS NULL", [userId, key]);
  const row = r.rows[0] as { value_ct: string } | undefined;
  return row ? open(userId, row.value_ct) : null;
}

/** Keeps a new version under `key`: the open row is closed today and the new one opens today, in one transaction. */
async function keep(userId: string, key: string, text: string, now: Date): Promise<void> {
  const day = now.toISOString().slice(0, 10);
  await transaction(async () => {
    await db().query("UPDATE person_fact SET valid_to = $3 WHERE user_id = $1 AND key = $2 AND valid_to IS NULL", [userId, key, day]);
    await db().query("INSERT INTO person_fact (user_id, key, value_ct, valid_from, source) VALUES ($1, $2, $3, $4, 'stated')", [userId, key, seal(userId, text), day]);
  });
}

function parseRecord(text: string, where: string): Presentation {
  const r = parsePresentation(JSON.parse(text));
  if (!r.presentation) throw new Error(`${where}: ${r.problems.join("; ")}`);
  return r.presentation;
}

/** The person's presentations in Postgres, as the core's `Presentations` interface gives them. */
export function postgresPresentations(userId: string, opts: { now?: () => Date } = {}): Presentations {
  const now = opts.now ?? (() => new Date());
  const person = async () => (await currentName(userId).catch(() => null))?.trim() || "you";
  async function get(id: string): Promise<Presentation | null> {
    if (!ID.test(id)) throw new Error("a presentation id is lower case letters, digits and hyphens");
    const text = await currentText(userId, keyOf(id));
    return text === null ? null : parseRecord(text, `presentation ${id}`);
  }
  return {
    async policy(): Promise<PresentationPolicy> {
      const text = await currentText(userId, POLICY_KEY);
      if (text === null) return defaultPolicy(await person());
      const r = parsePresentationPolicy(JSON.parse(text));
      if (!r.policy) throw new Error(`your presentation policy: ${r.problems.join("; ")}`);
      return r.policy;
    },
    async ensurePolicy() {
      if ((await currentText(userId, POLICY_KEY)) !== null) return { written: false };
      await keep(userId, POLICY_KEY, JSON.stringify(defaultPolicy(await person())), now());
      return { written: true };
    },
    get,
    async put(p) {
      const r = parsePresentation(p);
      if (!r.presentation) throw new Error(r.problems.join("; "));
      await keep(userId, keyOf(p.id), JSON.stringify(p), now());
    },
    async list() {
      const r = await db().query("SELECT key, value_ct FROM person_fact WHERE user_id = $1 AND key LIKE 'presentation/%' AND valid_to IS NULL", [userId]);
      const all = (r.rows as { key: string; value_ct: string }[]).map((x) => parseRecord(open(userId, x.value_ct), x.key));
      return all.sort((a, b) => b.created.localeCompare(a.created) || b.id.localeCompare(a.id));
    },
  };
}

/**
 * The gate for a publishing action's run, as the runner asks it: the record the input's `presentation` field names,
 * against the person's policy. A missing record is said in the app's words, not the CLI's.
 */
export async function presentationGate(store: Presentations, id: unknown, channelId: string): Promise<GateVerdict> {
  const policy = await store.policy();
  const record = typeof id === "string" && ID.test(id) ? await store.get(id) : null;
  const g = gateFor(policy, record, channelId);
  if (g.ready) return g;
  return { ready: false, missing: g.missing.map((m) => (m.item === "presentation" ? { ...m, message: "a presentation record: draft one on the Publish sheet, or with draft_presentation, and name it in presentation" } : m)) };
}
