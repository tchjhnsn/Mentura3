// Tests for the research engine (confidential, Mentura). Stubs only: no network, no model.
//   node platform/research/research-test.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generate, functions, phases, frames, cellId } from "./cells.mjs";
import { judgeClaim, sourceCredibility, independent } from "./credibility.mjs";
import { jsonlStore } from "./store.mjs";
import { runCell, runQueue, personalAllowed } from "./run.mjs";
import { getWithRetry } from "./adapters/http.mjs";
import { closest } from "./adapters/wayback.mjs";
import { filings } from "./adapters/sec-edgar.mjs";
import { patents } from "./adapters/uspto.mjs";
import { reports } from "./adapters/nasa.mjs";

const here = new URL(".", import.meta.url).pathname;
let failed = 0;
const expect = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}`); if (!ok) failed++; };
const tmp = mkdtempSync(join(tmpdir(), "research-"));
globalThis.fetch = () => { throw new Error("network used in a test"); };

// Schemas: each one accepts a good record and rejects a bad one (python jsonschema).
const good = {
  "research-cell": { id: "nike:marketing-and-sales:f:discovery:decision", venture: "nike", function: "marketing-and-sales", frame: "f", time: "discovery", aspect: "decision", status: "open" },
  source: { id: "s1", kind: "retrospective", access_level: "fetched", factors: { access: 4, proximity: 2 } },
  claim: { id: "c1", cell_id: "x", text: "Knight sold shoes from his car", verdict: "acceptable" },
  citation: { claim_id: "c1", source_id: "s1", locator: "Shoe Dog, ch. 2", supports: "supports" },
};
const bad = { "research-cell": { ...good["research-cell"], status: "maybe" }, source: { ...good.source, factors: { access: 5 } }, claim: { ...good.claim, verdict: "certain" }, citation: { ...good.citation, quote: "x".repeat(301) } };
for (const [name, rec] of Object.entries(good)) {
  const v = (r) => { const f = join(tmp, "r.json"); writeFileSync(f, JSON.stringify(r));
    return spawnSync("python3", ["-I", "-c", "import json,sys,jsonschema;s=json.load(open(sys.argv[1]));jsonschema.Draft202012Validator.check_schema(s);jsonschema.validate(json.load(open(sys.argv[2])),s)", join(here, "schemas", `${name}.schema.json`), f]).status === 0; };
  expect(`schema ${name}: valid record passes, bad one fails`, v(rec) && !v(bad[name]));
}

// Cells.
expect("cells: functions, phases and frames come from Naive's records", functions().includes("marketing-and-sales") && phases().includes("discovery") && frames().length > 0);
const fr = [{ id: "a", functions: [] }, { id: "b", functions: ["finance"] }];
const cells = generate({ ventures: ["nike"], functions: ["marketing-and-sales", "finance"], frames: fr, times: ["discovery", "validation"], aspects: ["decision"] });
expect("cells: the cross product, a frame limited to its functions", cells.length === 6 && !cells.some((c) => c.frame === "b" && c.function !== "finance"));
const answered = new Map([[cells[0].id, { status: "answered", fresh_until: "2999-01-01T00:00:00Z" }], [cells[1].id, { status: "answered", fresh_until: "2000-01-01T00:00:00Z" }]]);
const again = generate({ ventures: ["nike"], functions: ["marketing-and-sales", "finance"], frames: fr, times: ["discovery", "validation"], aspects: ["decision"], answered });
expect("cells: answered fresh cells are skipped, stale ones come back", again.length === 5 && !again.some((c) => c.id === cells[0].id) && again.some((c) => c.id === cells[1].id));

// Credibility.
const f = (n) => ({ access: n, proximity: n, publisher_standards: n, internal_sourcing: n, interest: n, track_record: n });
expect("credibility: the mean of the factors", sourceCredibility({ factors: { access: 4, proximity: 2 } }) === 3);
let threw = false; try { sourceCredibility({ id: "x", factors: { access: 5 } }); } catch { threw = true; }
expect("credibility: a factor outside 1-4 is refused", threw);
const S = (id, n, access_level = "fetched", extra = {}) => ({ id, kind: "secondary", access_level, factors: f(n), ...extra });
const cite = (source_id, supports = "supports") => ({ claim_id: "c", source_id, locator: "p. 1", supports });
const J = (cs, ss, claim = {}) => judgeClaim({ id: "c", cell_id: "x", text: "t", ...claim }, cs, ss);
expect("verdict: two independent fetched credible sources confirm", J([cite("a"), cite("b")], [S("a", 4), S("b", 3)]).verdict === "confirmed");
expect("verdict: retellings of one original count once", J([cite("a"), cite("b")], [S("a", 4), S("b", 3, "fetched", { derived_from: "a" })]).verdict === "acceptable");
expect("independence: one entry per original", independent([S("a", 4), S("b", 3, "fetched", { derived_from: "a" })].map((s) => ({ ...s, credibility: 3 }))).length === 1);
expect("verdict: Wikipedia never counts as a supporter", J([cite("a"), cite("w")], [S("a", 4), S("w", 4, "fetched", { url: "https://en.wikipedia.org/wiki/Nike" })]).verdict === "acceptable");
expect("verdict: a tertiary kind never counts either", J([cite("w")], [S("w", 4, "fetched", { kind: "tertiary" })]).verdict === "possible");
expect("verdict: a stronger contradiction blocks confirmed", J([cite("a"), cite("b"), cite("z", "contradicts")], [S("a", 3), S("b", 3), S("z", 4)]).verdict === "acceptable");
expect("verdict: a weaker contradiction does not", J([cite("a"), cite("b"), cite("z", "contradicts")], [S("a", 4), S("b", 3), S("z", 2)]).verdict === "confirmed");
expect("verdict: one fetched credible source is acceptable", J([cite("a")], [S("a", 3)]).verdict === "acceptable");
expect("verdict: fetched but not credible is possible", J([cite("a"), cite("b")], [S("a", 2), S("b", 2)]).verdict === "possible");
expect("verdict: credible but unread is available", J([cite("a")], [S("a", 4, "unread")]).verdict === "available");
const snip = J([cite("a"), cite("b")], [S("a", 4, "snippet"), S("b", 4, "snippet")]);
expect("verdict: snippet-only is capped at possible", snip.verdict === "possible" && snip.confidence <= 1.5);
const h = J([cite("a")], [S("a", 4)], { hindsight_risk: true });
expect("confidence: hindsight lowers it", h.confidence === 3.75);

// Personal-life guard.
const pc = { id: "p", venture: "v", function: "x", frame: "f", time: "t", aspect: "family", status: "open", personal: true, subject: { name: "A", public_figure: true, legal_basis: "published memoir; counsel review D-1" } };
expect("personal: refused by default", !personalAllowed(pc, {}).ok);
expect("personal: refused for a non public figure", !personalAllowed({ ...pc, subject: { ...pc.subject, public_figure: false } }, { RESEARCH_PERSONAL: "on" }).ok);
expect("personal: refused without a legal basis", !personalAllowed({ ...pc, subject: { public_figure: true } }, { RESEARCH_PERSONAL: "on" }).ok);
expect("personal: allowed when on, public and with a legal basis", personalAllowed(pc, { RESEARCH_PERSONAL: "on" }).ok);

// The queue, with a stub agent.
const store = jsonlStore(join(tmp, "store"));
const roles = [];
const agent = async (step, input) => {
  roles.push(`${step}:${input.role}`);
  if (step === "find") return { cost: 1, output: { sources: [S("a", 3), S("b", 3)] } };
  if (step === "extract") return { cost: 1, output: { claims: [{ id: `${input.cell.id}#1`, cell_id: input.cell.id, text: "t" }], citations: [{ ...cite("a"), claim_id: `${input.cell.id}#1` }, { ...cite("b"), claim_id: `${input.cell.id}#1` }] } };
  if (step === "judge") return { cost: 0.5, output: { factors: { access: 4 } } };
  if (step === "verify") return { cost: 1, output: { agrees: {} } };
};
const one = await runCell(cells[0], { agent, store, env: {} });
const claim = store.all("claims")[0];
expect("run: find, extract, judge, verify, store; the verifier is a different role", one.status === "answered" && roles.includes("verify:verifier") && roles.includes("find:researcher") && claim.verdict === "confirmed");
expect("run: the judge's factor overrides are scored in code", store.get("sources", "a").credibility === 3.17);
expect("run: a refused personal cell is stored as refused, with no agent call", (await runCell(pc, { agent: () => { throw new Error("called"); }, store, env: {} })).status === "refused");
let jevCalls = 0;
const jev = async () => { jevCalls++; return { factors: { access: 4 } }; };
roles.length = 0;
await runCell(cells[2], { agent, jev, store, env: { TYPESAFE_API_KEY: "test" } });
expect("run: Jev judges when TYPESAFE_API_KEY is set", jevCalls === 2 && !roles.some((r) => r.startsWith("judge")));
roles.length = 0;
await runCell(cells[3], { agent, jev: async () => { throw new Error("down"); }, store, env: { TYPESAFE_API_KEY: "test" } });
expect("run: a failed Jev call falls back to the model", roles.filter((r) => r.startsWith("judge")).length === 2);
const rej = await runCell({ ...cells[4], id: "rej" }, { agent: async (s, i) => s === "verify" ? { output: { agrees: { "rej#1": false } } } : agent(s, { ...i, cell: { ...i.cell, id: "rej" } }), store, env: {} });
expect("run: a claim the verifier rejects drops to possible", rej.status === "answered" && store.get("claims", "rej#1").verdict === "possible" && store.get("claims", "rej#1").verifier_agrees === false);
const capped = await runQueue(again, { agent, store: jsonlStore(join(tmp, "cap")), env: {}, budget: { cap: 5, spent: 0 } });
expect("run: the spend cap stops the queue", capped.stopped && capped.spent >= 5 && capped.results.length < again.length);
const resume = await runQueue(again, { agent, store: jsonlStore(join(tmp, "cap")), env: {}, budget: { cap: Infinity, spent: 0 } });
expect("run: a resumed queue skips answered cells", resume.results.length === again.length - capped.results.length);
expect("store: JSONL under the given path, latest line wins", readFileSync(join(tmp, "store", "cells.jsonl"), "utf8").trim().split("\n").length >= 1 && store.answered().size >= 3);
expect("cells: id is venture:function:frame:time:aspect", cellId(cells[0]) === "nike:marketing-and-sales:a:discovery:decision");

// Adapters: stubbed fetch, retry and backoff on 429.
const res = (status, body, headers = {}) => ({ status, ok: status < 400, headers: { get: (k) => headers[k] ?? null }, json: async () => body });
const queue = (list) => { const urls = []; return { urls, fetch: async (u) => { urls.push(u); return list.shift(); } }; };
const slept = [];
const sleep = async (ms) => { slept.push(ms); };
let q = queue([res(429, {}), res(429, {}, { "retry-after": "3" }), res(200, { ok: 1 })]);
expect("http: retries 429 with backoff and Retry-After", (await getWithRetry("u", { fetch: q.fetch, sleep })).status === 200 && slept[0] === 1000 && slept[1] === 3000);
q = queue(Array(9).fill(0).map(() => res(429, {})));
let gaveUp = false; try { await getWithRetry("u", { fetch: q.fetch, sleep, retries: 2 }); } catch { gaveUp = true; }
expect("http: gives up after the retries", gaveUp && q.urls.length === 3);
q = queue([res(200, { archived_snapshots: { closest: { available: true, url: "https://web.archive.org/web/1980/x", timestamp: "19800101" } } })]);
expect("wayback: closest snapshot", (await closest("nike.com", "1980", { fetch: q.fetch, sleep })).at === "19800101");
q = queue([res(200, { filings: { recent: { accessionNumber: ["0001-23-000001"], form: ["10-K"], filingDate: ["2023-07-20"], primaryDocument: ["nke.htm"] } } })]);
const fl = await filings(320187, { fetch: q.fetch, sleep, forms: ["10-K"] });
expect("sec-edgar: filings by CIK", q.urls[0].includes("CIK0000320187") && fl[0].url.endsWith("/320187/000123000001/nke.htm"));
q = queue([res(200, { patents: [{ patent_id: "123", patent_title: "Shoe", patent_date: "1979-01-01" }] })]);
expect("uspto: patents by assignee", (await patents("Nike", { fetch: q.fetch, sleep, key: "k" }))[0].url.endsWith("US123"));
q = queue([res(200, { results: [{ id: 1, title: "COTS", created: "2008" }] })]);
expect("nasa: NTRS reports", (await reports("SpaceX", { fetch: q.fetch, sleep }))[0].url === "https://ntrs.nasa.gov/citations/1");

rmSync(tmp, { recursive: true, force: true });
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("research engine: all passed");
