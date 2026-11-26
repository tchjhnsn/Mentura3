// mentura-agent traces reads the venture's trace files and the draft lines in provenance. Nothing is uploaded.
//
//   node agents/traces-test.ts

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { span } from "naive-framework/src/core/instrumentation.mjs";
import { LOG } from "naive-framework/src/core/provenance.mjs";
import { ventureFile } from "naive-framework/src/core/venture-paths.mjs";
import { traceView } from "./traces.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = "") => { console.log(`${cond ? "pass" : "FAIL"}  ${name}${cond || !detail ? "" : `: ${detail}`}`); if (!cond) failed++; };

const dir = mkdtempSync(join(tmpdir(), "mentura-traces-"));
writeFileSync(join(dir, "venture.json"), JSON.stringify({ id: "kettle", name: "Kettle" }));
ok("a venture with no traces is an empty list", traceView(dir).sessions.length === 0);

const common = { session: "harness-7", trace_id: "t1" };
span(dir, { ...common, span_id: "a1", name: "invoke_agent strategy", kind: "agent", status: "ok", start: "2026-11-26T00:00:00.000Z", end: "2026-11-26T00:00:05.000Z" }, { force: true });
span(dir, { ...common, span_id: "m1", parent_span_id: "a1", name: "chat fake", kind: "model", status: "ok", start: "2026-11-26T00:00:01.000Z", end: "2026-11-26T00:00:02.000Z" }, { force: true });
span(dir, { ...common, span_id: "w1", parent_span_id: "a1", name: "execute_tool naive_write", kind: "tool", status: "ok", attributes: { "gen_ai.tool.name": "naive_write", "naive.path": "/decisions/pricing" }, start: "2026-11-26T00:00:02.000Z", end: "2026-11-26T00:00:03.000Z" }, { force: true });
span(dir, { ...common, span_id: "c1", parent_span_id: "w1", name: "naive write decisions/pricing", kind: "call", status: "ok", attributes: { "naive.route": "decisions/pricing", "naive.action": "write", "naive.ok": true }, start: "2026-11-26T00:00:02.000Z", end: "2026-11-26T00:00:03.000Z" }, { force: true });
mkdirSync(join(dir, ".naive"), { recursive: true });
const prov = ventureFile(dir, LOG);
writeFileSync(prov, JSON.stringify({ activity: "draft", entity: "decisions/pricing.decision.json", route: "decisions/pricing", span: { trace_id: "t1", span_id: "c1" } }) + "\n");

const view = traceView(dir);
const run = view.sessions[0]?.runs[0];
ok("one session and one run", view.sessions.length === 1 && view.sessions[0].session === "harness-7" && view.sessions[0].runs.length === 1, JSON.stringify(view.sessions));
ok("the run is the agent span", run?.name === "invoke_agent strategy" && run.status === "ok" && run.trace_id === "t1");
ok("spans are counted by kind", run?.spans.agent === 1 && run?.spans.model === 1 && run?.spans.tool === 1 && run?.spans.call === 1, JSON.stringify(run?.spans));
ok("the tool call names the path", run?.tools.length === 1 && run.tools[0].name === "naive_write" && run.tools[0].path === "/decisions/pricing" && run.tools[0].status === "ok", JSON.stringify(run?.tools));
ok("the router write is listed", run?.writes.length === 1 && run.writes[0].route === "decisions/pricing" && run.writes[0].ok === true, JSON.stringify(run?.writes));
ok("the held draft is the provenance line that names the run", run?.drafts.length === 1 && run.drafts[0].entity === "decisions/pricing.decision.json" && run.drafts[0].route === "decisions/pricing", JSON.stringify(run?.drafts));
ok("a trace id that is not there is an empty session list", traceView(dir, { trace: "missing" }).sessions.length === 0);
ok("another session is left out", traceView(dir, { session: "other" }).sessions.length === 0);
const cli = spawnSync(process.execPath, [fileURLToPath(new URL("./bin.ts", import.meta.url)), "traces"], { encoding: "utf8" });
ok("traces without a venture is a usage refusal", cli.status === 2 && /--venture is required/.test(cli.stdout), cli.stdout.slice(0, 200));

rmSync(dir, { recursive: true, force: true });
console.log(failed ? `${failed} failed` : "traces: all passing");
process.exit(failed ? 1 : 0);
