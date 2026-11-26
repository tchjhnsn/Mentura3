// mentura-agent harness: the task is taken out of a naive agent prompt, the role runs through the gated agent,
// and a command with no model is refused before it can write.
//
//   node agents/harness-test.ts

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { AIMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { naivePath } from "../naive.ts";
import type { ModelSource } from "./function-agent.ts";
import { functionAgent, teamPlanEntry } from "./function-spec.ts";
import { runHarness, taskOf } from "./harness.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };
const BIN = fileURLToPath(new URL("./bin.ts", import.meta.url));
const textOf = (c: unknown): string => typeof c === "string" ? c : JSON.stringify(c);

ok("a plain task is kept whole", taskOf("Tighten the pricing decision.") === "Tighten the pricing decision.");
const prompt = ["You are strategy-agent.", "## Task", "", "Tighten the pricing decision.", "", "## How to read and write records", "", "Run naive."].join("\n");
ok("the task is the section before the write instructions", taskOf(prompt) === "Tighten the pricing decision.");

const missing = await runHarness({}, "Hello", { name: "fake:none", load: async () => { throw new Error("loaded"); } }, process.cwd());
ok("no role is refused before a model loads", missing.status === "refused" && /MENTURA_ACTOR_ID/.test(missing.reason ?? ""));

const ws = mkdtempSync(join(tmpdir(), "mentura-harness-"));
const dir = join(ws, "kettle");
const init = spawnSync(process.execPath, [naivePath("packages/naive/src/engine/init-venture.mjs"), dir, "kettle", "--layers", "purpose"], { encoding: "utf8" });
ok("the venture was created", init.status === 0, init.stderr);
const strategy = functionAgent("strategy");
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({}));
mkdirSync(join(dir, "operations"), { recursive: true });
writeFileSync(join(dir, "operations/team-plan.json"), JSON.stringify({ venture: "kettle", roles: [{ id: "founder", occupant: "person", needed_by: "discovery", status: "filled" }, teamPlanEntry(strategy, "discovery")] }, null, 2));

const model = fakeModel().respond(new AIMessage("I left the pricing question for a person."));
const source: ModelSource = { name: "fake:scripted", load: async () => model };
const ran = await runHarness({ MENTURA_ACTOR_ID: "strategy-agent", MENTURA_HARNESS: "naive-agent" }, prompt, source, dir);
ok("the role runs and answers", ran.status === "done" && ran.answer.startsWith("I left the pricing"), JSON.stringify(ran));
const calls = (model as unknown as { calls: { messages: { content: unknown, getType: () => string }[] }[] }).calls;
const human = calls.flatMap((c) => c.messages).filter((m) => m.getType() === "human").map((m) => textOf(m.content)).join("\n");
ok("the model is given the task and not the instructions to write around the gate", human.includes("Tighten the pricing decision.") && !human.includes("How to read and write records"), human.slice(0, 300));

const lead = await runHarness({ MENTURA_ACTOR_ID: "growth-lead" }, "Plan the launch.", source, dir);
ok("an unstaffed lead is refused", lead.status === "refused" && /team plan/.test(lead.reason ?? ""), JSON.stringify(lead));

const env = { ...process.env };
delete env.MENTURA_MODEL;
env.MENTURA_ACTOR_ID = "strategy-agent";
env.MENTURA_WORKSPACE = ws;
const cli = spawnSync(process.execPath, [BIN, "harness"], { cwd: dir, input: "Hello", env, encoding: "utf8" });
const body = `${cli.stdout}\n${cli.stderr}`;
ok("the command with no model is refused", cli.status === 2 && /MENTURA_MODEL/.test(body), body.slice(0, 400));

rmSync(ws, { recursive: true, force: true });
console.log(failed ? `${failed} failed` : "harness: all passing");
process.exit(failed ? 1 : 0);
