import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, writeSync } from "node:fs";
import { join } from "node:path";

export interface DriverResult {
  readonly bodyHash: string;
  readonly summary: string;
}

function filesOf(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const st = lstatSync(path);
    if (st.isSymbolicLink()) throw new Error("outside: fixture contains a symlink");
    if (st.isFile() && st.nlink !== 1) throw new Error("outside: fixture contains a hard link");
    if (prefix === "" && name === "outbox.jsonl") continue;
    const rel = prefix === "" ? name : join(prefix, name);
    if (st.isDirectory()) out.push(...filesOf(path, rel));
    else if (st.isFile()) out.push(rel);
  }
  return out;
}

function ownDirectory(dir: string): void {
  let st;
  try {
    st = lstatSync(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("outside: fixture directory is missing");
    throw new Error("outside: fixture directory must not be a symlink");
  }
  if (st.isSymbolicLink() || !st.isDirectory()) throw new Error("outside: fixture directory must not be a symlink");
}

/** Hash the fixture directory. Outbox lines are not part of the reading. */
export function readFixture(dir: string): DriverResult {
  ownDirectory(dir);
  const hash = createHash("sha256");
  const names = filesOf(dir);
  for (const name of names) {
    hash.update(name);
    hash.update("\0");
    hash.update(readFileSync(join(dir, name)));
    hash.update("\0");
  }
  return { bodyHash: hash.digest("hex"), summary: `${names.length} fixture file(s)` };
}

/**
 * Append one outbox line for this intent. A second call with the same intent id does not append again.
 * The line holds the payload hash, not the payload.
 */
function outboxIntent(line: string): string | undefined {
  try {
    const row = JSON.parse(line) as { intentId?: string };
    return row.intentId;
  } catch {
    throw new Error("outside: outbox is not valid");
  }
}

export function writeFixture(dir: string, intentId: string, payloadHash: string): DriverResult {
  try {
    ownDirectory(dir);
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "outside: fixture directory is missing") throw error;
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    ownDirectory(dir);
  }
  const file = join(dir, "outbox.jsonl");
  try {
    const st = lstatSync(file);
    if (st.isSymbolicLink()) throw new Error("outside: outbox must not be a symlink");
    if (!st.isFile() || st.nlink !== 1) throw new Error("outside: outbox must not be a hard link");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const fd = openSync(file, constants.O_RDWR | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
  try {
    const st = fstatSync(fd);
    if (!st.isFile() || st.nlink !== 1) throw new Error("outside: outbox must not be a hard link");
    const size = st.size;
    const prior = Buffer.alloc(size);
    if (size > 0) readSync(fd, prior, 0, size, 0);
    const text = prior.toString("utf8");
    const already = text.split("\n").some((line) => line.length > 0 && outboxIntent(line) === intentId);
    if (!already) writeSync(fd, JSON.stringify({ intentId, payloadHash }) + "\n", size);
  } finally {
    closeSync(fd);
  }
  const hash = createHash("sha256").update(intentId).update("\0").update(payloadHash).digest("hex");
  return { bodyHash: hash, summary: "fixture outbox" };
}
