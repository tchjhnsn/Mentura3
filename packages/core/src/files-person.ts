// The folder host's person record: person.json in a vault, which keeps the person's id and name and, once any are
// said, their facts, relationships, holds and attributes (./person.ts). Each write is logged in memory.jsonl like every
// other record and keeps the file's other keys.
import { readRecord, writeRecord } from "./record-io.ts";
import { readPersonState, type PersonState } from "./person.ts";
import { personProblems, PERSON_RECORD_KEYS } from "./person-schema.ts";

/** The person record in person.json (empty lists when it holds none), and the file's other keys. */
export async function readPersonFile(root: string, rel = "person.json"): Promise<{ person: PersonState; rest: Record<string, unknown> }> {
  const text = await readRecord(root, rel);
  const raw = text === null ? {} : (JSON.parse(text) as Record<string, unknown>);
  const rest = Object.fromEntries(Object.entries(raw).filter(([k]) => !PERSON_RECORD_KEYS.includes(k)));
  return { person: readPersonState(raw), rest };
}

/** Write the person record into person.json, after it passes the person schema, keeping the file's other keys. */
export async function writePersonFile(root: string, person: PersonState, rel = "person.json", now = new Date()): Promise<void> {
  const problems = personProblems(person, rel);
  if (problems.length) throw new Error(problems.join("; "));
  const { rest } = await readPersonFile(root, rel);
  const old = await readRecord(root, rel);
  await writeRecord(root, rel, `${JSON.stringify({ ...rest, ...person }, null, 2)}\n`, old === null ? "create" : "append", now.toISOString());
}
