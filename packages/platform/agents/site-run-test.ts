// A site agent run, offline with a scripted model: products-it builds its container under /site/, its writes to the
// design system and to a function record are refused before they land, and what it changed is committed with an
// Agent trailer that check-containers accepts. Refusals: an unstaffed role (with its team-plan entry), a role the
// manifest does not name, uncommitted changes in the agent's paths, and an unsound manifest. Then the CLI.
//
//   node agents/site-run-test.ts

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { AIMessage } from "@langchain/core/messages";
import { fakeModel } from "@langchain/core/testing";
import { naivePath } from "../naive.ts";
import { checkRange } from "./check-containers.ts";
import type { Manifest } from "./containers.ts";
import type { ModelSource } from "./function-agent.ts";
import { runIdOf } from "./function-agent.ts";
import { runSiteAgent, siteTeamPlanEntry } from "./site-run.ts";

let passed = 0;
const check = async (name: string, fn: () => void | Promise<void>) => { await fn(); passed++; console.log(`ok ${name}`); };
const BIN = fileURLToPath(new URL("./bin.ts", import.meta.url));

const ws = mkdtempSync(join(tmpdir(), "mentura-site-run-"));
const init = spawnSync("node", [naivePath("packages/naive/src/engine/init-venture.mjs"), join(ws, "kettle"), "kettle", "--layers", "purpose"], { encoding: "utf8" });
if (init.status !== 0) throw new Error(init.stderr);
const dir = join(ws, "kettle");
process.env.MENTURA_WORKSPACE = ws;
for (const k of ["NAIVE_TRACES", "MENTURA_TRACE_ID", "MENTURA_SPAN_ID", "MENTURA_SESSION", "MENTURA_ACTOR", "MENTURA_ACTOR_ID", "MENTURA_MODEL", "MENTURA_HARNESS"]) delete process.env[k];
writeFileSync(join(dir, "naive.config.json"), JSON.stringify({}));
mkdirSync(join(dir, "operations"), { recursive: true });
writeFileSync(join(dir, "operations/team-plan.json"), JSON.stringify({ venture: "kettle", roles: [{ id: "founder", occupant: "person", needed_by: "discovery", status: "filled" }, siteTeamPlanEntry("products-it")] }, null, 2));

const site = join(ws, "site");
const m: Manifest = {
  design_system: { paths: ["components/**"], owner: "design-system-agent" },
  containers: [
    { id: "features/time-travel", paths: ["app/features/time-travel/**"], owner: "time-travel-agent", category: "records-and-history-agent", function: "products", builder: "products-it", may: ["copy", "order", "props"] },
    { id: "hero", paths: ["app/hero/**"], owner: "marketing-and-sales-agent", function: "marketing-and-sales", builder: "marketing-and-sales-it", may: ["copy"] },
  ],
};
const put = (p: string, s: string) => { mkdirSync(join(site, p, ".."), { recursive: true }); writeFileSync(join(site, p), s); };
const sh = (...a: string[]) => execFileSync("git", ["-C", site, ...a], { encoding: "utf8" });
put("containers.json", JSON.stringify(m, null, 2));
put("components/button.tsx", "export const Button = () => null;\n");
put("app/features/time-travel/page.tsx", "export default () => 'old';\n");
sh("init", "-q"); sh("config", "user.email", "t@example.com"); sh("config", "user.name", "t"); sh("add", "-A"); sh("commit", "-qm", "start");
const base = sh("rev-parse", "HEAD").trim();

const step = (name: string, args: Record<string, unknown>, id: string) => new AIMessage({ content: "", tool_calls: [{ name, args, id, type: "tool_call" }] });
const scripted = (fm: ReturnType<typeof fakeModel>): ModelSource => ({ name: "fake:scripted", load: async () => fm });
const none: ModelSource = { name: "fake:none", load: async () => { throw new Error("the model was loaded"); } };
const ctx = { venture: "kettle", site, trace: { session: "site-1", trace_id: randomUUID() } };

await check("products-it builds its container; the design system and a record are refused; the change is committed as its own", async () => {
  const model = fakeModel()
    .respond(step("read_file", { file_path: "/site/containers.json" }, "c1"))
    .respond(step("write_file", { file_path: "/site/app/features/time-travel/section.tsx", content: "export default () => 'Go back to any day';\n" }, "c2"))
    .respond(step("edit_file", { file_path: "/site/app/features/time-travel/page.tsx", old_string: "'old'", new_string: "'Time travel'" }, "c3"))
    .respond(step("write_file", { file_path: "/site/components/button.tsx", content: "hacked" }, "c4"))
    .respond(step("write_file", { file_path: "/foundation/telos", content: "{}" }, "c5"))
    .respond(new AIMessage("I built the time-travel section."));
  const r = await runSiteAgent("products-it", "Build the time-travel section from the approved copy.", { ...ctx, model: scripted(model), runId: runIdOf(randomUUID()) });
  assert.equal(r.status, "done", JSON.stringify(r));
  if (r.status !== "done") return;
  assert.deepEqual([...r.changed].sort(), ["app/features/time-travel/page.tsx", "app/features/time-travel/section.tsx"]);
  assert.deepEqual(r.problems, []);
  assert.ok(r.commit);
  assert.equal(readFileSync(join(site, "components/button.tsx"), "utf8"), "export const Button = () => null;\n");
  assert.ok(!existsSync(join(dir, "foundation/telos.json")) || readFileSync(join(dir, "foundation/telos.json"), "utf8") !== "{}");
  assert.equal(r.wrote.length, 0);
  assert.match(sh("log", "-1", "--format=%B"), /Agent: products-it/);
  assert.equal(sh("status", "--porcelain"), "");
  assert.deepEqual(checkRange(site, m, `${base}..HEAD`), []);
});

await check("refusals: unstaffed (with its entry), not in the manifest, not a site role, someone's changes in its paths, an unsound manifest", async () => {
  const unstaffed = await runSiteAgent("marketing-and-sales-it", "x", { ...ctx, model: none });
  assert.ok(unstaffed.status === "refused" && /not in kettle's team plan/.test(unstaffed.reason) && /operations\/handoff/.test(unstaffed.fix ?? ""));
  const absent = await runSiteAgent("finance-it", "x", { ...ctx, model: none });
  assert.ok(absent.status === "refused" && /owns and builds nothing/.test(absent.reason), JSON.stringify(absent));
  const notSite = await runSiteAgent("products-agent", "x", { ...ctx, model: none });
  assert.ok(notSite.status === "refused" && /not a site agent/.test(notSite.reason));
  put("app/features/time-travel/page.tsx", "export default () => 'a person was here';\n");
  const busy = await runSiteAgent("products-it", "x", { ...ctx, model: none });
  assert.ok(busy.status === "refused" && /uncommitted changes/.test(busy.reason), JSON.stringify(busy));
  sh("checkout", "--", "app/features/time-travel/page.tsx");
  const bad = { ...m, design_system: { ...m.design_system, owner: "products-it" } };
  writeFileSync(join(site, "containers.json"), JSON.stringify(bad));
  const unsound = await runSiteAgent("products-it", "x", { ...ctx, model: none });
  assert.ok(unsound.status === "refused" && /not a sound manifest/.test(unsound.reason));
  sh("checkout", "--", "containers.json");
});

await check("the CLI runs site and refuses usage errors", () => {
  const usage = spawnSync(process.execPath, [BIN, "site", "products-it", "--venture", "kettle"], { input: "x", encoding: "utf8" });
  assert.equal(usage.status, 2);
  assert.match(usage.stdout, /site needs --venture and --site/);
  const unstaffed = spawnSync(process.execPath, [BIN, "site", "marketing-and-sales-it", "--venture", "kettle", "--site", site], { input: "Build the hero.", encoding: "utf8", env: { ...process.env, MENTURA_MODEL: "fake:none" } });
  assert.equal(unstaffed.status, 2, unstaffed.stderr);
  assert.equal(JSON.parse(unstaffed.stdout).status, "refused");
});

console.log(`${passed} checks passed`);
