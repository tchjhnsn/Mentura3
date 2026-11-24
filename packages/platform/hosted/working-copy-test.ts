// Tests the hosted working copy against Naive's filesystem connector as the store, offline: check out, a run that
// changes a record and appends to the provenance log commits both, a derived file is never committed, a store that
// moved makes the run go again on a fresh copy, a log rewritten in place and a removed record are refused with
// nothing written, the run sees NAIVE_RUNTIME=hosted, and a kept copy refreshes only what changed.

import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connect } from "naive-framework/src/store/connectors/filesystem.mjs";
import { blobSha } from "naive-framework/src/store/connectors/contract.mjs";
import { checkout, commit, kindOf, refresh, withWorkingCopy, type Store } from "./working-copy.ts";

let failed = 0;
const expect = (name: string, cond: boolean, detail?: unknown) => {
  console.log(`${cond ? "ok  " : "FAIL"}  ${name}`);
  if (!cond) { failed++; if (detail !== undefined) console.log("      ", JSON.stringify(detail)); }
};
const throws = async (fn: () => Promise<unknown>, re: RegExp) => { try { await fn(); return false; } catch (e) { return re.test(String(e)); } };

const tmp = mkdtempSync(join(tmpdir(), "mentura-working-copy-"));
try {
  // The store: a tenant with one venture, a record, its provenance log, and a person's idea outside the venture.
  const storeDir = join(tmp, "store");
  const put = (p: string, s: string) => { mkdirSync(join(storeDir, p, ".."), { recursive: true }); writeFileSync(join(storeDir, p), s); };
  put("workspace.json", JSON.stringify({ id: "w" }) + "\n");
  put("ventures/acme/venture.json", JSON.stringify({ id: "acme", phase: "discovery" }) + "\n");
  put("ventures/acme/decisions/d1.json", JSON.stringify({ id: "d1", status: "open" }) + "\n");
  put("ventures/acme/provenance.jsonl", JSON.stringify({ n: 1 }) + "\n");
  put("people/p-1/ideas/i1.json", JSON.stringify({ id: "i1" }) + "\n");
  const store = connect({ id: "tenant", root: storeDir }) as unknown as Store;
  const read = (p: string) => readFileSync(join(storeDir, p), "utf8");

  expect("kinds: a record, a log under the venture, a derived cache, a path in no venture", (() => {
    const dir = join(tmp, "kinds"); cpSync(storeDir, dir, { recursive: true });
    return kindOf(dir, "ventures/acme/decisions/d1.json") === "record" && kindOf(dir, "ventures/acme/provenance.jsonl") === "log"
      && kindOf(dir, "ventures/acme/.naive/decision-index.json") === "derived" && kindOf(dir, "people/p-1/ideas/i1.json") === "record";
  })());

  // One request: change a record, append a provenance line, and write a derived cache.
  const wc = join(tmp, "wc");
  let sawHosted = false;
  const first = await withWorkingCopy(store, wc, (dir) => {
    sawHosted = process.env.NAIVE_RUNTIME === "hosted";
    writeFileSync(join(dir, "ventures/acme/decisions/d1.json"), JSON.stringify({ id: "d1", status: "decided" }) + "\n");
    appendFileSync(join(dir, "ventures/acme/provenance.jsonl"), JSON.stringify({ n: 2 }) + "\n");
    mkdirSync(join(dir, "ventures/acme/.naive"), { recursive: true });
    writeFileSync(join(dir, "ventures/acme/.naive/decision-index.json"), "{}\n");
  });
  expect("the run sees NAIVE_RUNTIME=hosted, and the variable is restored after", sawHosted && process.env.NAIVE_RUNTIME !== "hosted");
  expect("a changed record is written and a log is appended to", first.commit.wrote.includes("ventures/acme/decisions/d1.json") && first.commit.appended.includes("ventures/acme/provenance.jsonl"), first.commit);
  expect("the store holds the new record and both log lines", read("ventures/acme/decisions/d1.json").includes("decided") && read("ventures/acme/provenance.jsonl") === '{"n":1}\n{"n":2}\n');
  expect("a derived file is skipped, never committed", first.commit.skipped.includes("ventures/acme/.naive/decision-index.json"), first.commit);
  expect("an unchanged path is not written", !first.commit.wrote.includes("workspace.json") && first.attempts === 1);

  // A conflict: another request changes the record after check out; the run goes again on a fresh copy.
  const wc2 = join(tmp, "wc2");
  let runs = 0;
  const second = await withWorkingCopy(store, wc2, (dir) => {
    runs++;
    if (runs === 1) put("ventures/acme/decisions/d1.json", JSON.stringify({ id: "d1", status: "reopened" }) + "\n");
    const rec = JSON.parse(readFileSync(join(dir, "ventures/acme/decisions/d1.json"), "utf8"));
    writeFileSync(join(dir, "ventures/acme/decisions/d1.json"), JSON.stringify({ ...rec, note: `run ${runs}` }) + "\n");
  });
  const d1 = JSON.parse(read("ventures/acme/decisions/d1.json"));
  expect("a store that moved makes the request run again, and the second run builds on the store's change", second.attempts === 2 && runs === 2 && d1.status === "reopened" && d1.note === "run 2", { attempts: second.attempts, d1 });

  expect("conflicts past the cap are thrown, not committed", await throws(() => withWorkingCopy(store, join(tmp, "wc3"), (dir) => {
    put("ventures/acme/decisions/d1.json", JSON.stringify({ id: "d1", status: `moved ${Math.random()}` }) + "\n");
    writeFileSync(join(dir, "ventures/acme/decisions/d1.json"), "{}\n");
  }, { retries: 1 }), /changed since version/));

  // Refusals: nothing is written.
  const wc4 = join(tmp, "wc4");
  const b4 = await checkout(store, wc4);
  const logBefore = read("ventures/acme/provenance.jsonl"), ideaBefore = read("people/p-1/ideas/i1.json");
  writeFileSync(join(wc4, "people/p-1/ideas/i1.json"), JSON.stringify({ id: "i1", changed: true }) + "\n");
  writeFileSync(join(wc4, "ventures/acme/provenance.jsonl"), '{"n":"rewritten"}\n');
  expect("a log rewritten in place is refused, and no other change is written", await throws(() => commit(store, wc4, b4), /only appended to/) && read("ventures/acme/provenance.jsonl") === logBefore && read("people/p-1/ideas/i1.json") === ideaBefore);
  await refresh(store, wc4, b4);
  expect("refresh puts back what a refused run left", readFileSync(join(wc4, "ventures/acme/provenance.jsonl"), "utf8") === logBefore && readFileSync(join(wc4, "people/p-1/ideas/i1.json"), "utf8") === ideaBefore);
  unlinkSync(join(wc4, "workspace.json"));
  expect("a removed record is refused: the contract has no delete", await throws(() => commit(store, wc4, b4), /never removes a record/) && read("workspace.json").includes('"w"'));

  // A kept copy: refresh fetches only what changed.
  const wc5 = join(tmp, "wc5");
  const b5 = await checkout(store, wc5);
  put("people/p-1/ideas/i2.json", JSON.stringify({ id: "i2" }) + "\n");
  const r = await refresh(store, wc5, b5);
  expect("refresh fetches only a new or changed path", r.fetched.length === 1 && r.fetched[0] === "people/p-1/ideas/i2.json" && b5.get("people/p-1/ideas/i2.json") === blobSha(JSON.stringify({ id: "i2" }) + "\n"), r);
  expect("check out refuses a folder that is not empty", await throws(() => checkout(store, wc5), /not empty/));
} finally { rmSync(tmp, { recursive: true, force: true }); }

if (failed) { console.log(`${failed} failing`); process.exit(1); }
console.log("hosted working copy: all pass");
