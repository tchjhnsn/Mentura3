// The bridge's syncPush with a working copy's provenance (the offline sync contract, 2026-11-25; Naive EE-177):
// the lines are written again on top of the store's log after the push's own writes, the log still checks, and a
// line whose hash no longer matches its content refuses the whole push and writes nothing.
//
//   node bridge/sync-push-test.ts

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { lineHash } from "naive-framework/src/core/provenance.mjs";
import { blobSha } from "naive-framework/src/store/connectors/contract.mjs";
import { signAssertion } from "./assertion.ts";
import { naiveFile } from "./naive-file.mjs";

const here = import.meta.dirname;
const naive = dirname(fileURLToPath(import.meta.resolve("naive-framework/package.json")));
const scratch = mkdtempSync(join(tmpdir(), "sync-push-test-"));
const shared = join(scratch, "ws");
const workspace = join(shared, ".accounts/acct-ada");
const temp = join(scratch, "tmp");
mkdirSync(temp);
const key = "sync-push-test-key";
const ada = { userId: "acct-ada", name: "Ada", email: "ada@example.test", organizationId: "acct-ada", organizationRole: "owner" };

type Answer = { ok: boolean; error?: string; result: { id: string; folder: string; accepted?: { path: string; version: string }[]; stale?: unknown[] } };
function bridge(input: { op: string; [k: string]: unknown }): Answer {
  const env: NodeJS.ProcessEnv = { ...process.env, NAIVE_CONSOLE_WORKSPACE: shared, TMPDIR: temp, NAIVE_BRIDGE_KEY: key };
  for (const k of ["TYPESAFE_API_KEY", "TYPESAFEAI_API_KEY", "NAIVE_JUDGE_CMD", "MENTURA_ACTOR", "MENTURA_MODEL", "MENTURA_ACTOR_ID", "NAIVE_RUNTIME"]) delete env[k];
  const r = spawnSync(process.execPath, [join(here, "bridge.mjs"), signAssertion(ada, input, key)], { encoding: "utf8", env, timeout: 60_000 });
  if (r.error) throw new Error(`the bridge did not answer: ${r.error.message}`);
  return JSON.parse(r.stdout);
}

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok" : "FAIL"}  ${name}${ok ? "" : ` ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
};

type Line = Record<string, unknown> & { hash: string; prev: string };
/** A working copy's own log: lines chained from genesis, as `naive sync push` sends them. */
function workingCopyLog(at: string[]): Line[] {
  let prev = "genesis";
  return at.map((time) => {
    const fields: Record<string, unknown> = { at: time, entity: "foundation/problem.json", activity: "write", agent: { kind: "person", id: "Ada", via: "cli" }, prev };
    const line: Line = { ...fields, prev, hash: lineHash(prev, fields) };
    prev = line.hash;
    return line;
  });
}

try {
  const made = bridge({ op: "create", name: "Harbor", description: "Coffee for dock workers" });
  expect("create works", made.ok, made);
  const id = made.result.id;
  const dir = join(workspace, made.result.folder);
  const file = ventureFile(dir, "foundation/problem.json");
  const logFile = ventureFile(dir, "provenance.jsonl");
  // The record is new to the store, so its base is null.
  const base = null;
  const problem = { venture: id, updated: "2026-11-25", statement: "Dock workers wait too long for coffee.", segment: "Dock workers on the early shift", evidence: [] };

  // An edited line: its content no longer matches its hash. The whole push is refused.
  const edited = workingCopyLog(["2026-11-25T10:00:00.000Z"]);
  edited[0].entity = "foundation/other.json";
  const logBefore = readFileSync(logFile, "utf8");
  const refused = bridge({ op: "syncPush", venture: id, working_copy: "laptop", changes: [{ path: "foundation/problem.json", base, content: problem }], provenance: edited });
  expect("an edited working copy line refuses the push", !refused.ok && /provenance could not be written/.test(refused.error ?? ""), refused);
  expect("a refused push leaves the log as it was", readFileSync(logFile, "utf8") === logBefore);
  expect("a refused push writes no record", !existsSync(file));

  // A push with lines but no working copy is refused too.
  const unnamed = bridge({ op: "syncPush", venture: id, changes: [{ path: "foundation/problem.json", base, content: problem }], provenance: workingCopyLog(["2026-11-25T10:00:00.000Z"]) });
  expect("provenance with no working copy is refused", !unnamed.ok && /names no working copy/.test(unnamed.error ?? ""), unnamed);

  // A good push: the lines land after the router's own, each re-chained, and the log checks.
  const lines = workingCopyLog(["2026-11-25T10:00:00.000Z", "2026-11-25T10:05:00.000Z"]);
  const pushed = bridge({ op: "syncPush", venture: id, working_copy: "laptop", changes: [{ path: "foundation/problem.json", base, content: problem }], provenance: lines });
  expect("the push is accepted", pushed.ok && pushed.result.accepted?.length === 1, pushed);
  const log = readFileSync(logFile, "utf8").trim().split("\n").map((l) => JSON.parse(l) as Line & { rechained_from?: { hash: string; working_copy: string } });
  const tail = log.slice(-2);
  expect("the working copy's lines are the last two in the store's log", tail.every((l, i) => l.rechained_from?.hash === lines[i].hash && l.rechained_from.working_copy === "laptop"), tail);
  expect("the first re-chained line follows the router's line for this push", tail[0].prev === log[log.length - 3].hash && log[log.length - 3].entity === "foundation/problem.json", log.slice(-3));
  const check = spawnSync(process.execPath, [naiveFile(naive, "packages/naive/src/checks/check-provenance.mjs"), dir], { encoding: "utf8" });
  expect("the store's log still checks", check.status === 0, check.stdout + check.stderr);

  // A line that was already re-chained cannot be pushed again.
  const again = bridge({ op: "syncPush", venture: id, working_copy: "laptop", changes: [{ path: "foundation/problem.json", base: blobSha(readFileSync(file)), content: { ...problem, updated: "2026-11-26" } }], provenance: [tail[0]] });
  expect("a re-chained line is refused", !again.ok, again);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("sync push: all passing");
