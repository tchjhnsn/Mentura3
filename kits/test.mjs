#!/usr/bin/env node
// Tests for Mentura's kits: the agent-run upgrade (U-3) with the offline stand-in agent, and a kit's
// automation (M-12) that waits until the package it needs is complete. Everything runs in temporary
// folders; the repository is never written to.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { entries } from "naive-framework/src/core/provenance.mjs";
import { snapshot } from "naive-framework/src/engine/upgrades.mjs";
import { naivePath } from "../../scripts/naive.ts";

const repo = new URL("../..", import.meta.url).pathname;
let failed = 0;
const expect = (name, ok, detail = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`); if (!ok) failed++; };
// Naive finds Mentura's kits only through NAIVE_KITS (EE-118), so every run names this folder.
const KITS = new URL(".", import.meta.url).pathname;
// The upgrade lands on the framework version the installed Naive's upgrades.json names.
const NAIVE_VERSION = JSON.parse(readFileSync(naivePath("packages/naive/src/engine/upgrades.json"), "utf8")).framework;
const node = (args, env = {}) => spawnSync("node", args, { cwd: repo, encoding: "utf8", env: { ...process.env, NAIVE_KITS: KITS, ...env } });
const naive = (args, env) => node([naivePath("packages/naive/src/interfaces/cli/naive.mjs"), ...args], env);
const mentura = (args, env) => node([naivePath("packages/naive/src/interfaces/cli/mentura.mjs"), ...args], env);
const ws = mkdtempSync(join(tmpdir(), "kits-test-"));
const STAND_IN = "node platform/kits/agent-upgrade/stand-in-agent.mjs";
const make = (id) => { const d = join(ws, id); node([naivePath("packages/naive/src/engine/init-venture.mjs"), d, id]); return d; };

// U-3: the agent-run upgrade.
const v = make("agentic");
writeFileSync(join(v, "AGENTS.md"), readFileSync(join(v, "AGENTS.md"), "utf8") + "- Use the validation kit for interviews.\n");
const before = snapshot(v);
const run = naive(["upgrade", v, "--agent"], { MENTURA_AGENT_CMD: STAND_IN });
expect("naive upgrade --agent finds the kit and stages an upgrade the checks pass", run.status === 0 && /: ready/.test(run.stdout), run.stdout + run.stderr);
expect("nothing in the venture changes until the founder accepts", JSON.stringify(snapshot(v)) === JSON.stringify(before));
const draft = JSON.parse(readFileSync(join(v, ".naive/upgrade/draft.json"), "utf8"));
expect("the draft says which files the agent changed, found by hash", draft.agent?.changed?.includes("AGENTS.md") && draft.agent.kit === "agent-upgrade", JSON.stringify(draft.agent));
const staged = entries(join(v, ".naive/upgrade/venture"));
expect("the agent's edit is an agent's write in the copy's provenance", staged.some((e) => e.entity === "AGENTS.md" && e.activity === "write" && e.agent.kind === "agent" && e.agent.id === "agent-upgrade"));
expect("every check ran and passed on the copy", draft.checks.length >= 9 && draft.checks.every((c) => c.passed), JSON.stringify(draft.checks.filter((c) => !c.passed)));
const noConfirm = naive(["upgrade", v, "--accept"]);
expect("accepting without the typed confirmation is refused", noConfirm.status === 1 && /--confirm upgrade/.test(noConfirm.stderr) && JSON.stringify(snapshot(v)) === JSON.stringify(before));
const twice = naive(["upgrade", v, "--agent"], { MENTURA_AGENT_CMD: STAND_IN });
expect("a second upgrade cannot be staged over one waiting", twice.status === 1 && /already staged/.test(twice.stderr));
const ok = naive(["upgrade", v, "--accept", "--confirm", "upgrade", "--by", "Founder"]);
expect("the founder accepts and the upgrade lands", ok.status === 0 && ok.stdout.includes(`is on Naive ${NAIVE_VERSION}`), ok.stdout + ok.stderr);
expect("the agent's edit landed", /validation package for interviews/.test(readFileSync(join(v, "AGENTS.md"), "utf8")));
expect("the migrations landed (foundation/ and decisions/ in place, pins written)", existsSync(join(v, "naive.config.json")) && !existsSync(join(v, "pillars")) && existsSync(join(v, "_private/pillars/product.md")));
const log = entries(v);
expect("the venture's provenance chain holds and ends with the person's acceptance", node([naivePath("packages/naive/src/checks/check-provenance.mjs"), v]).status === 0 && log.at(-1).activity === "accept" && log.at(-1).agent.kind === "person" && log.at(-1).agent.id === "Founder");
expect("the staged copy is gone", !existsSync(join(v, ".naive/upgrade")));

// The checks stop a bad upgrade: the stand-in breaks a record.
const b = make("broken");
const bad = naive(["upgrade", b, "--agent"], { MENTURA_AGENT_CMD: STAND_IN, STAND_IN_BREAK: "1" });
expect("an agent that breaks a record leaves the upgrade failing its checks", bad.status === 1 && /checks-failed/.test(bad.stdout) && /records match their schemas/.test(bad.stdout), bad.stdout + bad.stderr);
const refused = naive(["upgrade", b, "--accept", "--confirm", "upgrade"]);
expect("an upgrade whose checks fail cannot be accepted, even when confirmed", refused.status === 1 && /checks fail/.test(refused.stderr) && !existsSync(join(b, "naive.config.json")));
const fixedRec = { venture: "broken", id: "broken", who: "Solo founders" };
writeFileSync(join(b, ".naive/upgrade/venture/foundation/icp/broken.json"), JSON.stringify(fixedRec, null, 2) + "\n");
const status = naive(["upgrade", b, "--status"]);
expect("fixing the copy and running --status runs the checks again", /: ready/.test(status.stdout), status.stdout + status.stderr);
writeFileSync(join(b, "profile.md"), "# broken\n\nChanged while the upgrade waited.\n");
const drift = naive(["upgrade", b, "--accept", "--confirm", "upgrade"]);
expect("a venture that changed since the copy was made is not overwritten", drift.status === 1 && /changed since the upgrade was staged/.test(drift.stderr));
const rej = naive(["upgrade", b, "--reject"]);
expect("rejecting discards the copy and leaves the venture as it was", rej.status === 0 && !existsSync(join(b, ".naive/upgrade")) && !existsSync(join(b, "naive.config.json")));

// An agent that cannot run leaves the migrations' copy staged, saying so.
const c = make("noagent");
const down = naive(["upgrade", c, "--agent"], { MENTURA_AGENT_CMD: "node -e process.exit(3)" });
expect("an agent that fails is reported, and the copy waits without its work", down.status === 1 && /the agent stopped with status 3/.test(down.stderr) && existsSync(join(c, ".naive/upgrade/draft.json")));
expect("the error is kept in the draft", /status 3/.test(JSON.parse(readFileSync(join(c, ".naive/upgrade/draft.json"), "utf8")).agent?.error ?? ""));

// M-12: a kit's automation, which waits until the foundation package is complete.
const k = make("kickoff");
naive(["upgrade", k]);
const cfg = JSON.parse(readFileSync(join(k, "naive.config.json"), "utf8"));
writeFileSync(join(k, "naive.config.json"), JSON.stringify({ ...cfg, kits: ["validation-kickoff"] }, null, 2));
const env = { MENTURA_WORKSPACE: ws };
const put = (route, rec, extra = []) => { const f = join(ws, `${route.replace(/\//g, "-")}.json`); writeFileSync(f, JSON.stringify(rec)); return mentura([route, "write", "--venture", "kickoff", "--input", f, "--as", "person", ...extra], env); };
put("foundation/problem", { venture: "kickoff", statement: "Cafes run out of milk on Saturdays", segment: "Independent cafes", evidence: [] });
const waiting = JSON.parse(mentura(["triggers", "--venture", "kickoff", "--json"], env).stdout);
expect("the kit's automation is listed with the package it needs", waiting.triggers.some((t) => t.id === "validation-kickoff-start" && t.from === "kit validation-kickoff" && t.needs === "foundation" && t.needs_complete === false));
expect("before the foundation is complete, the automation waits and proposes nothing", waiting.waiting.some((w) => w.trigger === "validation-kickoff-start") && !existsSync(join(k, "decisions/start-validation.decision.json")));
put("foundation/icp/cafes", { venture: "kickoff", id: "cafes", who: "Independent cafe owners" });
mentura(["decide", "product-exists", "--venture", "kickoff", "--by", "Founder", "--answer", "No: it is still an idea", "--confirm", "product-exists"], env);
put("product/milk-alert", { id: "milk-alert", name: "Milk alert", description: "Tells a cafe when milk runs low" });
const after = JSON.parse(mentura(["triggers", "--venture", "kickoff", "--json"], env).stdout);
expect("once the foundation is complete, the automation runs: the next step is proposed as a decision", existsSync(join(k, "decisions/start-validation.decision.json")) && after.runs.some((r) => r.trigger === "validation-kickoff-start" && r.outcome === "ran"), JSON.stringify(after.runs));
const d = JSON.parse(readFileSync(join(k, "decisions/start-validation.decision.json"), "utf8"));
expect("the proposed decision is open, for a person, drafted by the trigger", d.status === "open" && d.provenance.drafted_by.kind === "agent" && d.provenance.drafted_by.id === "trigger-validation-kickoff-start");
put("foundation/problem", { venture: "kickoff", statement: "Cafes run out of milk on Saturdays and Sundays", segment: "Independent cafes", evidence: [] });
const again = JSON.parse(mentura(["triggers", "--venture", "kickoff", "--json"], env).stdout);
expect("a once automation does not run again on later events", again.runs.filter((r) => r.trigger === "validation-kickoff-start").length === 1);

// A kit's automation that names no package never runs, and says why.
const kitsDir = join(ws, "kits");
mkdirSync(join(kitsDir, "loose"), { recursive: true });
writeFileSync(join(kitsDir, "loose/kit.json"), JSON.stringify({ name: "loose", title: "Loose", purpose: "test", extends: { package: "validation" }, automations: [{ id: "x", on: { activity: "write" }, run: { route: "system/need-now", action: "run" } }], use_model: [], status: "experimental" }));
writeFileSync(join(k, "naive.config.json"), JSON.stringify({ ...cfg, kits: ["loose", "missing-kit"] }, null, 2));
const loose = JSON.parse(mentura(["triggers", "--venture", "kickoff", "--json"], { ...env, NAIVE_KITS: kitsDir }).stdout);
expect("an automation with no package it needs is a problem, not a run", loose.problems.some((p) => /names no package it needs/.test(p)) && !loose.triggers.some((t) => t.id === "loose-x"));
expect("a kit that is not installed is a problem", loose.problems.some((p) => /missing-kit .*not installed/.test(p)));

console.log(failed ? `\n${failed} failing` : "\nall passing");
process.exit(failed ? 1 : 0);
