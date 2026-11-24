// Mentura as Naive's platform adapter (Z-4): Naive lists it beside the harness adapters when NAIVE_PLATFORM_ADAPTER
// names platform/adapter.json, refuses to adapt it into a venture, and verifies it by running the tests the
// adapter names (the connector contract, the webhooks and the kits). This was the real-adapter half of Naive's
// schema/upgrades-test.mjs Z-4 before EE-118; Naive now tests a stand-in.
//
//   node platform/adapter-test.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { naivePath } from "./naive.ts";

const adapter = new URL("./adapter.json", import.meta.url).pathname;
const ws = mkdtempSync(join(tmpdir(), "adapter-test-"));
const env = { ...process.env, MENTURA_WORKSPACE: ws, NAIVE_PLATFORM_ADAPTER: adapter };
const mentura = (args) => spawnSync("node", [naivePath("packages/naive/src/interfaces/cli/mentura.mjs"), ...args], { encoding: "utf8", env, timeout: 900000 });

let failed = 0;
const expect = (name, ok, detail = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`); if (!ok) failed++; };

const list = JSON.parse(mentura(["adapters", "--json"]).stdout);
expect("Mentura is listed as the platform adapter beside the harness adapters", list[0]?.name === "mentura" && list[0].kind === "platform" && ["claude-code", "codex", "cursor"].every((x) => list.some((l) => l.name === x && l.kind === "harness")));

spawnSync("node", [naivePath("packages/naive/src/engine/init-venture.mjs"), join(ws, "harnessed"), "harnessed"], { encoding: "utf8", env });
expect("adapting the platform adapter into a venture is refused", mentura(["adapt", "mentura", "--venture", "harnessed"]).status === 1);

const m = mentura(["adapters", "verify", "mentura", "--json"]);
let mr = null;
try { mr = JSON.parse(m.stdout)[0]; } catch { /* reported below */ }
expect("the Mentura adapter is verified: it passes the tests it names (connector contract, webhooks, kits)", mr?.verified === true && mr.results.length === 3, mr ? JSON.stringify(mr.results.filter((x) => !x.passed)).slice(0, 600) : (m.stdout + m.stderr).slice(0, 600));

console.log(failed ? `\n${failed} failing` : "\nall passing");
process.exit(failed ? 1 : 0);
