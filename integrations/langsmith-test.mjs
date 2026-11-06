// The LangSmith exporter (platform/integrations/langsmith.mjs) ships a Naive trace as runs and the vitals as
// feedback (P-4). Naive's own test checks the trace's shape; the exporter is Mentura's, so its run is tested
// here (it was the second half of Naive's interface/context-test.mjs P-4 before EE-118). Offline: the
// exporter talks to a local stand-in for LangSmith's API.
//
//   node platform/integrations/langsmith-test.mjs

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { naivePath } from "../../scripts/naive.ts";

const tmp = mkdtempSync(join(tmpdir(), "langsmith-test-"));
const ws = join(tmp, "workspace");
cpSync(naivePath("packages/naive/src/records/examples/workspace"), ws, { recursive: true });
process.env.MENTURA_WORKSPACE = ws;
process.env.NAIVE_SESSION_DIR = join(tmp, "sessions");
delete process.env.MENTURA_SESSION; delete process.env.NAIVE_INSTRUMENT;
const tandem = join(ws, "ventures/tandem");
writeFileSync(join(tandem, "naive.config.json"), JSON.stringify({ instrumentation: { events: true } }, null, 2));

const { call } = await import("naive-framework/src/router/router.mjs");

let failed = 0;
const expect = (name, ok, detail = "") => { console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`); if (!ok) failed++; };

// One session of navigation, so the trace has calls to ship.
for (const route of ["purpose/validation/problem", "purpose/validation/problem", "purpose/validation/solution", "purpose/product"]) {
  const r = await call({ venture: "tandem", route, action: "navigate", input: { session: "s1" } });
  if (!r.ok) expect(`navigate ${route}`, false, r.error);
}

const tr = spawnSync("node", [naivePath("packages/naive/src/router/vitals.mjs"), tandem, "--trace", "--session", "s1"], { encoding: "utf8" });
const file = join(tmp, "trace.json");
writeFileSync(file, tr.stdout);
const trace = JSON.parse(tr.stdout);
expect("the session's trace has runs and feedback to ship", tr.status === 0 && trace.children.length >= 4 && trace.feedback.length >= 3, tr.stderr);

const got = [];
const server = createServer((req, res) => {
  let body = "";
  req.on("data", (d) => { body += d; });
  req.on("end", () => {
    got.push({ url: req.url, body: body ? JSON.parse(body) : null });
    res.setHeader("content-type", "application/json");
    res.end(req.url.startsWith("/sessions") ? "[]" : "{}");
  });
});
await /** @type {Promise<void>} */ (new Promise((ok) => server.listen(0, "127.0.0.1", ok)));
const port = /** @type {import("node:net").AddressInfo} */ (server.address()).port;
const up = await new Promise((done) => {
  const p = spawn("node", [new URL("./langsmith.mjs", import.meta.url).pathname, file, "--project", "naive-vitals"],
    { env: { ...process.env, LANGSMITH_API_KEY: "stand-in", LANGSMITH_ENDPOINT: `http://127.0.0.1:${port}` } });
  let out = "";
  p.stdout.on("data", (d) => { out += d; });
  p.stderr.on("data", (d) => { out += d; });
  p.on("close", (code) => done({ code, out }));
});
server.close();
const batchPost = got.find((g) => g.url === "/runs/batch");
expect("the exporter ships the trace as runs and the vitals as feedback", up.code === 0 && batchPost?.body.post.length >= trace.children.length + 1 && got.filter((g) => g.url === "/feedback").length === trace.feedback.length, up.out);

console.log(failed ? `\n${failed} failing` : "\nall passing");
process.exit(failed ? 1 : 0);
