#!/usr/bin/env node
// A stand-in for the upgrade agent, for tests and docs that run offline
// (MENTURA_AGENT_CMD="node platform/kits/agent-upgrade/stand-in-agent.mjs"). It does the 0.3.0 guide's
// by-hand step the way an agent would: in every AGENTS.md of the copy it is working in (its current
// directory), it says package where the text says kit. It answers as claude -p --output-format json does.
// STAND_IN_BREAK=1 also breaks a record, so tests can show the checks stop a bad upgrade.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let prompt = "";
for await (const c of process.stdin) prompt += c;
const cwd = process.cwd();
const edits = [];
const walk = (rel) => {
  for (const e of readdirSync(join(cwd, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!e.name.startsWith(".") && e.name !== "_private") walk(r); continue; }
    if (e.name !== "AGENTS.md") continue;
    const text = readFileSync(join(cwd, r), "utf8");
    const next = text.replace(/\bkits\b/g, "packages").replace(/\bkit\b/g, "package");
    if (next !== text) { writeFileSync(join(cwd, r), next); edits.push({ path: r, why: "0.3.0 by hand: say package where the text says kit" }); }
  }
};
if (/say package where you wrote kit/.test(prompt)) walk("");
if (process.env.STAND_IN_BREAK === "1") {
  mkdirSync(join(cwd, "foundation"), { recursive: true });
  writeFileSync(join(cwd, "foundation/icp.json"), JSON.stringify({ broken: true }) + "\n");
  edits.push({ path: "foundation/icp.json", why: "rewrote the ICP" });
}
const answer = { summary: edits.length ? `Updated ${edits.length} file(s) by the guides' by-hand steps.` : "Nothing in the guides' by-hand steps applied to this venture.", edits, left: [] };
console.log(JSON.stringify({ type: "result", is_error: false, result: JSON.stringify(answer) }));
