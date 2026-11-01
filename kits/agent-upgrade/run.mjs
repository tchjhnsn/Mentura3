#!/usr/bin/env node
// The agent-run upgrade (U-3, I-29), a Mentura kit over the framework's staged upgrade. Next.js's
// `next upgrade --agent` has a coding agent perform and verify the upgrade; here the work is split the
// System 1 way. Code runs the migrations on a copy (schema/upgrades.mjs stage). The agent does only what
// the version guides leave to a person, in the copy. Code then finds every file the agent changed (by
// hash, not by its word), logs each as an agent's write, and runs the framework's checks. The upgrade
// stays a draft until the checks pass and the founder types the confirmation:
//
//   node platform/kits/agent-upgrade/run.mjs <venture dir> [--json]      (naive upgrade <dir> --agent)
//   node interface/cli/naive.mjs upgrade <dir> --accept --confirm upgrade
//
// The agent is `claude -p` with file tools only, working in the copy, or MENTURA_AGENT_CMD (a command that
// reads the prompt on stdin, works in its current directory and answers as claude -p --output-format json).

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { agentFromEnv, record } from "../../../interface/provenance.mjs";
import { annotate, check, CONFIRM, snapshot, stage, STAGED } from "../../../schema/upgrades.mjs";

const repo = new URL("../../..", import.meta.url).pathname;
const kit = JSON.parse(readFileSync(new URL("./kit.json", import.meta.url), "utf8"));
const dirArg = process.argv[2];
const json = process.argv.includes("--json");
if (!dirArg || !existsSync(join(dirArg, "venture.json"))) { console.error("usage: node platform/kits/agent-upgrade/run.mjs <venture dir> [--json]"); process.exit(2); }
const dir = resolve(dirArg);

/** Runs the agent in the staged copy and returns its answer (an object), or throws saying why. */
export function runAgent(prompt, cwd) {
  const cmd = process.env.MENTURA_AGENT_CMD ? process.env.MENTURA_AGENT_CMD.split(" ") : kit.agent.command;
  // A relative program path in MENTURA_AGENT_CMD is relative to where naive was run, not to the copy.
  const args = cmd.slice(1).map((a) => (/\.m?js$/.test(a) && !a.startsWith("/") && existsSync(resolve(a)) ? resolve(a) : a));
  const p = spawnSync(cmd[0], args, { cwd, input: prompt, encoding: "utf8", maxBuffer: 1 << 26, env: { ...process.env, NAIVE_STAGE: cwd, NAIVE_TRIGGERS_ACTIVE: "upgrade" } });
  if (p.error) throw new Error(`could not run the agent (${cmd[0]}): ${p.error.message}`);
  let text = p.stdout;
  try { const r = JSON.parse(p.stdout); if (r && typeof r.result === "string") { if (r.is_error) throw new Error(`the agent stopped: ${r.result}`); text = r.result; } }
  catch (e) { if (e.message.startsWith("the agent stopped")) throw e; }
  if (p.status !== 0) throw new Error(`the agent stopped with status ${p.status}: ${(p.stderr || text).trim().slice(0, 500)}${/login/i.test(p.stderr + text) ? " (run claude, then /login)" : ""}`);
  const m = text.match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : { summary: text.trim() }; } catch { return { summary: text.trim().slice(0, 2000) }; }
}

const staged = await stage(dir, { by: kit.name }).catch((e) => { console.error(e.message); process.exit(1); });
const copy = join(dir, STAGED);
const guides = staged.guides.map((g) => `--- ${g}\n${readFileSync(join(repo, g), "utf8")}`).join("\n\n");
const prompt = [
  `You are upgrading the venture in your current directory from Naive ${staged.from} to ${staged.to}. It is a copy: nothing you do reaches the venture until its founder accepts it.`,
  "The framework's migrations have already run. Do only what the guides below leave to a person (their \"By hand\" sections) and what the migrations escalated, by editing files in this directory.",
  "Rules: never open anything under _private/. Do not edit provenance.jsonl, naive.config.json, or anything under .release/ or .naive/. Do not delete files. Keep every JSON record valid against its schema. When something needs the founder's judgment, leave it and say so.",
  `Escalated by the migrations:\n${staged.escalated.length ? staged.escalated.map((e) => `- ${e}`).join("\n") : "- nothing"}`,
  `The guides:\n\n${guides || "(none)"}`,
  'When you are done, answer with JSON only: {"summary": "<one sentence>", "edits": [{"path": "<file>", "why": "<the guide step>"}], "left": [{"what": "<item>", "why": "<why it needs the founder>"}]}',
].join("\n\n");

const before = snapshot(copy);
let answer;
try { answer = runAgent(prompt, copy); }
catch (e) {
  annotate(dir, { agent: { kit: kit.name, error: e.message } });
  const d = check(dir);
  console.error(`${e.message}\nThe migrations' copy is staged without the agent's work (${d.status}). Accept it with --accept --confirm ${CONFIRM}, or --reject.`);
  process.exit(1);
}
// What the agent changed, by hash. Each change is an agent's write in the copy's provenance.
const after = snapshot(copy);
const changed = Object.keys(after).filter((f) => f !== "provenance.jsonl" && after[f] !== before[f]).sort();
const deleted = Object.keys(before).filter((f) => !(f in after)).sort();
const who = agentFromEnv("agent", "cli", { id: kit.name, ...(process.env.MENTURA_AGENT_CMD ? {} : { harness: "Claude Code" }) });
const why = new Map((answer.edits ?? []).map((e) => [e.path, e.why]));
for (const f of changed) record(copy, /** @type {Parameters<typeof record>[1]} */ ({ entity: f, activity: "write", agent: who, note: `agent-run upgrade to Naive ${staged.to}: ${why.get(f) ?? "changed by the agent (it did not say why)"}` }));
annotate(dir, { agent: { kit: kit.name, summary: answer.summary ?? null, changed, deleted, reported: [...why.keys()], left: answer.left ?? [] } });
const d = check(dir);

if (json) { console.log(JSON.stringify(d, null, 2)); process.exit(d.status === "ready" ? 0 : 1); }
console.log(`staged upgrade of ${staged.from} to ${staged.to}, worked by an agent: ${d.status}`);
if (answer.summary) console.log(`agent     ${answer.summary}`);
for (const f of changed) console.log(`edited    ${f}${why.has(f) ? `: ${why.get(f)}` : " (not reported by the agent)"}`);
for (const f of deleted) console.log(`deleted   ${f} (the agent was told not to delete; the founder decides)`);
for (const l of answer.left ?? []) console.log(`left      ${l.what}: ${l.why}`);
for (const c of d.checks) console.log(`${c.passed ? "pass" : "FAIL"}      ${c.check}${c.passed ? "" : `: ${c.output.split("\n").slice(-2).join(" / ")}`}`);
console.log(d.status === "ready" ? `Nothing has landed. To land it: node interface/cli/naive.mjs upgrade ${dirArg} --accept --confirm ${CONFIRM}` : `Nothing has landed, and it cannot until the checks pass. Fix the copy in ${dirArg}/${STAGED}, then run --status; or --reject.`);
process.exit(d.status === "ready" ? 0 : 1);
