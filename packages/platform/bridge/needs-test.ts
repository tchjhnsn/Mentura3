// The bridge's read path for "Needs you" and the briefing (round 5): open decisions in the decision index's order, the
// levels 1 and 2 briefing, a function's activities, and that none of it writes into the business.
//
//   node bridge/needs-test.ts

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { signAssertion, type Identity } from "./assertion.ts";

const here = import.meta.dirname;
const scratch = mkdtempSync(join(tmpdir(), "needs-test-"));
const shared = join(scratch, "ws");
const temp = join(scratch, "tmp");
mkdirSync(temp);
const key = "needs-test-key";
const ada: Identity = { userId: "acct-ada", name: "Ada", email: "ada@example.test", organizationId: "acct-ada", organizationRole: "owner" };
const viewer: Identity = { ...ada, userId: "acct-vic", name: "Vic", email: "vic@example.test", organizationRole: "viewer" };

type Needs = { decisions: { id: string; question: string; function: string | null; render: string; rank: number; unlocks: string[]; opens: number; due: string | null }[]; held: number; last_decided: { id: string } | null };
type Briefing = { briefing: { function: string; needs_person: number; process_groups: { id: string; performs: { id: string }[]; approves: { id: string }[]; agent: number }[] }[]; listed: string[];
  activities?: { id: string; performer: string | null; approval: string | null; source: string; process_group: string }[] };
type Answer<T> = { ok: boolean; error?: string; result: T };
function bridge<T>(input: { op: string; [k: string]: unknown }, as: Identity = ada): Answer<T> {
  const env: NodeJS.ProcessEnv = { ...process.env, NAIVE_CONSOLE_WORKSPACE: shared, TMPDIR: temp, XDG_CONFIG_HOME: join(scratch, "xdg"), NAIVE_BRIDGE_KEY: key };
  for (const k of ["TYPESAFE_API_KEY", "TYPESAFEAI_API_KEY", "NAIVE_JUDGE_CMD", "MENTURA_ACTOR", "MENTURA_MODEL", "MENTURA_ACTOR_ID"]) delete env[k];
  const r = spawnSync(process.execPath, [join(here, "bridge.mjs"), signAssertion(as, input, key)], { encoding: "utf8", env, timeout: 120_000 });
  if (r.error) throw new Error(`the bridge did not answer: ${r.error.message}`);
  return JSON.parse(r.stdout) as Answer<T>;
}

/** Every file under a folder with its size and time, to see that a read changed nothing. */
function snapshot(root: string): string {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else { const s = statSync(p); out.push(`${relative(root, p)} ${s.size} ${s.mtimeMs}`); }
    }
  };
  walk(root);
  return out.sort().join("\n");
}

let failed = 0;
const expect = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "ok" : "FAIL"}  ${name}${ok ? "" : ` ${JSON.stringify(detail)}`}`);
  if (!ok) failed++;
};

try {
  const made = bridge<{ id: string; folder: string }>({ op: "create", name: "Harbor", description: "Coffee for dock workers" });
  expect("create works", made.ok, made);
  const id = made.result.id;
  const dir = join(shared, ".accounts/acct-ada", made.result.folder);

  const before = snapshot(dir);
  const needs = bridge<Needs>({ op: "needs", venture: id });
  expect("needs answers", needs.ok, needs.error);
  const list = needs.result.decisions;
  expect("needs lists open decisions", list.length > 0, list.length);
  expect("they come in the decision index's rank order", list.every((d, i) => i === 0 || list[i - 1]!.rank < d.rank), list.map((d) => d.rank));
  expect("only decisions a person can settle now are listed", list.every((d) => ["now", "overdue", "stale"].includes(d.render)), list.map((d) => d.render));
  expect("held decisions are counted, not listed", needs.result.held > 0 && !list.some((d) => d.id === "core-product"), needs.result.held);
  const top = list.find((d) => d.id === "product-exists");
  expect("a decision says what it unlocks and how many decisions wait on it", !!top && top.unlocks.length > 0 && top.opens >= 1, top);
  expect("a decision names its function", list.every((d) => typeof d.function === "string"), list.map((d) => d.function));
  expect("nothing was decided yet", needs.result.last_decided === null, needs.result.last_decided);
  expect("reading needs leaves the business as it was (no index cache, no history)", snapshot(dir) === before);

  const decided = bridge<{ decided: string }>({ op: "decide", venture: id, id: "founding-team", answer: "Solo: I am founding it alone" });
  expect("a person decides one", decided.ok, decided.error);
  const after = bridge<Needs>({ op: "needs", venture: id });
  expect("the decided one leaves the list", after.ok && !after.result.decisions.some((d) => d.id === "founding-team"), after.result?.decisions.map((d) => d.id));
  expect("and is the last thing decided", after.result.last_decided?.id === "founding-team", after.result.last_decided);

  // A cache the CLI left stays exactly as it was.
  mkdirSync(join(dir, ".naive"), { recursive: true });
  writeFileSync(join(dir, ".naive/decision-index.json"), "{\"kept\":true}\n");
  bridge<Needs>({ op: "needs", venture: id });
  expect("an existing index cache is put back as it was", readFileSync(join(dir, ".naive/decision-index.json"), "utf8") === "{\"kept\":true}\n");
  expect("no history file is left behind", !existsSync(join(dir, ".naive/decision-index-history.jsonl")));
  rmSync(join(dir, ".naive/decision-index.json"));

  const none = bridge<Briefing>({ op: "briefing", venture: id });
  expect("a business that lists no functions has an empty briefing", none.ok && none.result.briefing.length === 0 && none.result.listed.length === 0, none);
  const v = JSON.parse(readFileSync(join(dir, "venture.json"), "utf8"));
  writeFileSync(join(dir, "venture.json"), JSON.stringify({ ...v, departments: ["strategy", "finance"] }, null, 2) + "\n");
  const all = bridge<Briefing>({ op: "briefing", venture: id });
  expect("the briefing has one entry per listed function", all.ok && all.result.briefing.map((f) => f.function).join() === "strategy,finance", all.result?.briefing.map((f) => f.function));
  expect("each function says how many activities need a person", all.result.briefing.every((f) => f.needs_person === f.process_groups.reduce((n, g) => n + g.performs.length + g.approves.length, 0)));

  const one = bridge<Briefing>({ op: "briefing", venture: id, function: "marketing-and-sales" });
  expect("one function's briefing, though the business does not list it", one.ok && one.result.briefing.length === 1 && one.result.briefing[0]!.function === "marketing-and-sales", one.error);
  expect("its activities with a rule come with it, each with who performs it", (one.result.activities ?? []).length > 0 && (one.result.activities ?? []).every((a) => a.performer === "person" || a.performer === "agent"), one.result.activities);
  expect("an activity not assigned yet is a default from its kind", (one.result.activities ?? []).every((a) => a.source === "default"));

  // The business's own assignment replaces the default.
  const first = one.result.activities![0]!;
  const file = ventureFile(dir, "operations/activity-assignments.json");
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, JSON.stringify({ venture: id, activities: { [first.id]: { performer: "agent", approval: "person" } } }, null, 2) + "\n");
  const assigned = bridge<Briefing>({ op: "briefing", venture: id, function: "marketing-and-sales" });
  const row = assigned.result.activities?.find((a) => a.id === first.id);
  expect("an assigned activity says it is assigned, done by an agent and approved by a person", row?.source === "assigned" && row.performer === "agent" && row.approval === "person", row);
  const group = assigned.result.briefing[0]!.process_groups.find((g) => g.id === row?.process_group);
  expect("the briefing counts it as approved by a person", !!group?.approves.some((a) => a.id === first.id), group);

  const bad = bridge<Briefing>({ op: "briefing", venture: id, function: "../strategy" });
  expect("a function Naive does not have is refused", !bad.ok && bad.error === "Naive has no function by that name.", bad);

  // A Viewer of the team reads both (the web server decides what a Viewer may act on).
  const shared2 = bridge<Needs>({ op: "needs", venture: id }, { ...viewer, organizationId: "acct-ada" });
  expect("a Viewer of the team reads what needs a person", shared2.ok, shared2.error);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
if (failed) { console.log(`${failed} failed`); process.exit(1); }
console.log("all passed");
