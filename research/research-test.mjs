// Tests for the research engine (confidential, Mentura). Stubs only: no network, no model.
//   node platform/research/research-test.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generate, functions, phases, frames, cellId } from "./cells.mjs";
import { judgeClaim, sourceCredibility, independent, credibilityFor } from "./credibility.mjs";
import { jsonlStore } from "./store.mjs";
import { runCell, runQueue, personalAllowed, verifyCells, applyVerification } from "./run.mjs";
import { getWithRetry } from "./adapters/http.mjs";
import { closest, search as cdx } from "./adapters/wayback.mjs";
import { filings, search as edgarSearch } from "./adapters/sec-edgar.mjs";
import { ASPECTS } from "./cells.mjs";
import { patents } from "./adapters/uspto.mjs";
import { reports } from "./adapters/nasa.mjs";

const here = new URL(".", import.meta.url).pathname;
let failed = 0;
const expect = (name, ok) => { console.log(`${ok ? "ok  " : "FAIL"}  ${name}`); if (!ok) failed++; };
const tmp = mkdtempSync(join(tmpdir(), "research-"));
Object.assign(globalThis, { fetch: () => { throw new Error("network used in a test"); } });

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
const S = (id, n, access_level = "fetched", extra = {}) => ({ id, kind: "contemporaneous", access_level, factors: f(n), ...extra });
const cite = (source_id, supports = "supports") => ({ claim_id: "c", source_id, locator: "p. 1", supports });
const J = (cs, ss, claim = {}) => judgeClaim({ id: "c", cell_id: "x", text: "t", ...claim }, cs, ss);
expect("verdict: two independent fetched credible sources confirm", J([cite("a"), cite("b")], [S("a", 4), S("b", 3)]).verdict === "confirmed");
expect("verdict: retellings of one original count once", J([cite("a"), cite("b")], [S("a", 4), S("b", 3, "fetched", { derived_from: "a" })]).verdict === "acceptable");
expect("independence: one entry per original", independent([S("a", 4), S("b", 3, "fetched", { derived_from: "a" })].map((s) => ({ ...s, credibility: 3 }))).length === 1);
expect("verdict: Wikipedia never counts as a supporter", J([cite("a"), cite("w")], [S("a", 4), S("w", 4, "fetched", { url: "https://en.wikipedia.org/wiki/Nike" })]).verdict === "acceptable");
expect("verdict: a tertiary kind never counts either", J([cite("w")], [S("w", 4, "fetched", { kind: "tertiary" })]).verdict === "possible");
expect("verdict: a stronger read contradiction blocks confirmed and acceptable (problem 8)", J([cite("a"), cite("b"), cite("z", "contradicts")], [S("a", 3), S("b", 3), S("z", 4)]).verdict === "possible");
expect("verdict: two supporters and two equally credible read contradictions are contested, not confirmed", J([cite("a"), cite("b"), cite("y", "contradicts"), cite("z", "contradicts")], [S("a", 3, "fetched", { kind: "contemporaneous" }), S("b", 3), S("y", 3), S("z", 3)]).verdict === "possible");
expect("verdict: a weaker contradiction does not", J([cite("a"), cite("b"), cite("z", "contradicts")], [S("a", 4), S("b", 3), S("z", 2)]).verdict === "confirmed");
expect("verdict: one fetched credible source is acceptable", J([cite("a")], [S("a", 3)]).verdict === "acceptable");
expect("verdict: fetched but not credible is possible", J([cite("a"), cite("b")], [S("a", 2), S("b", 2)]).verdict === "possible");
expect("verdict: credible but unread is available", J([cite("a")], [S("a", 4, "unread")]).verdict === "available");
const snip = J([cite("a"), cite("b")], [S("a", 4, "snippet"), S("b", 4, "snippet")]);
expect("verdict: snippet-only is capped at possible", snip.verdict === "possible" && snip.confidence <= 1.5);
const h = J([cite("a")], [S("a", 4)], { hindsight_risk: true });
// Pilot 3 problems.
const own = (id) => ({ id, kind: "contemporaneous", access_level: "fetched", published_at: "2003-06-01", about_time: "2003", factors: { access: 4, proximity: 4, publisher_standards: 2, internal_sourcing: 2, interest: 2, track_record: 3 } });
expect("p1: a dated first-party record is credible for a decision", credibilityFor(own("o"), { aspect: "decision" }) >= 3 && J([cite("o")], [own("o")], {}).verdict === "possible" && judgeClaim({ id: "c", cell_id: "x", text: "t" }, [cite("o")], [own("o")], { aspect: "decision" }).verdict === "acceptable");
expect("p1: a citation's interest overrides the source's for that claim", J([{ ...cite("o"), interest: 4 }], [own("o")]).verdict === "acceptable");
const late = (id, n) => S(id, n, "fetched", { kind: "retrospective", published_at: "2026-01-01", about_time: "2008" });
const lateTwo = J([cite("a"), cite("b")], [late("a", 4), late("b", 4)]);
expect("p2: confirmed needs a supporter from the time", lateTwo.verdict === "acceptable" && J([cite("a"), cite("b")], [late("a", 4), S("b", 3)]).verdict === "confirmed");
expect("p2: a primary record published within a year of the time counts as from the time", J([cite("a"), cite("b")], [late("a", 4), S("b", 3, "fetched", { kind: "primary", published_at: "2008-12-23", about_time: "2008" })]).verdict === "confirmed");
expect("p8: a read contradiction at 2.67 against one credible supporter drops acceptable", J([cite("a"), cite("z", "contradicts")], [S("a", 3), S("z", 3, "fetched", { factors: { access: 3, proximity: 3, publisher_standards: 2 } })]).verdict === "possible");
expect("p8: a snippet contradiction does not", J([cite("a"), cite("z", "contradicts")], [S("a", 3), S("z", 4, "snippet")]).verdict === "acceptable");
expect("p10: a source with no scores is unscored, not 1", sourceCredibility({ factors: {} }) === null);
const judged = J([cite("a")], [S("a", 3)]);
expect("p10: judgeClaim returns only claim-schema fields", Object.keys(judged).every((k) => ["id", "cell_id", "text", "personal", "hindsight_risk", "confidence", "verdict", "verified_by", "verifier_agrees"].includes(k)));
expect("p7: aspects match the pilots", ASPECTS.join() === "state,decision,decider,evidence,outcome");
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
const emptyAgent = async (step, input) => step === "extract" ? { output: { claims: [], citations: [] } } : agent(step, input);
const empty = await runCell({ ...cells[5], id: "empty" }, { agent: emptyAgent, store, env: {} });
expect("p5: a cell with no claims is failed, not answered, and the generator offers it again", empty.status === "failed" && store.get("cells", "empty").status === "failed");
expect("p10: claims stored by runCell fit the claim schema", (() => { const f = join(tmp, "c.json"); writeFileSync(f, JSON.stringify(store.get("claims", "rej#1")));
  return spawnSync("python3", ["-I", "-c", "import json,sys,jsonschema;jsonschema.validate(json.load(open(sys.argv[2])),json.load(open(sys.argv[1])))", join(here, "schemas", "claim.schema.json"), f]).status === 0; })());
// p6: a separate verifier with fresh fetches, a sample rate and the 90% gate.
const vstore = jsonlStore(join(tmp, "verify"));
for (const c of cells.slice(0, 4)) await runCell(c, { agent, store: vstore, env: {}, verify: false });
expect("p6: runCell can skip the inline verifier", !vstore.all("claims").some((c) => "verifier_agrees" in c));
const vroles = []; let seenFinderSources = false;
const vagent = async (step, input) => { vroles.push(`${step}:${input.role}`); if (input.sources?.some((s) => s.id === "a")) seenFinderSources = true;
  if (step === "find") return { cost: 1, output: { sources: [S("fresh", 3)] } };
  return { cost: 1, output: { agrees: Object.fromEntries(input.claims.map((c, i) => [c.id, !c.id.startsWith(cells[3].id)])) } }; };
let r = 0; const vr = await verifyCells(cells.slice(0, 4), { agent: vagent, store: vstore, rate: 1, random: () => (r++, 0) });
expect("p6: verifyCells refetches as the verifier and never sees the finder's sources", vroles.includes("find:verifier") && !vroles.some((x) => x.endsWith(":researcher")) && !seenFinderSources);
expect("p6: agreement below 90% fails the gate; a rejected claim falls to possible", vr.sampled === 4 && vr.agreement === 0.75 && !vr.passed && vstore.get("claims", `${cells[3].id}#1`).verdict === "possible");
const half = await verifyCells(cells.slice(0, 4), { agent: async (s, i) => s === "find" ? { output: { sources: [] } } : { output: { agrees: Object.fromEntries(i.claims.map((c) => [c.id, true])) } }, store: vstore, rate: 0.5, random: (() => { const xs = [0.1, 0.9, 0.2, 0.8]; return () => xs.shift(); })() });
expect("p6: the sample rate picks a share of cells; full agreement passes", half.sampled === 2 && half.passed);
expect("p6: the rejection rule is one shared function", applyVerification({ verdict: "confirmed" }, false).verdict === "possible" && applyVerification({ verdict: "confirmed" }, undefined).verdict === "confirmed");
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

// p9: timeouts, network-error retry, Wayback CDX, SEC older pages and full-text search, NASA filters.
slept.length = 0;
let calls = 0;
const flaky = async () => { calls++; if (calls === 1) throw new TypeError("fetch failed"); if (calls === 2) return new Promise(() => {}); return res(200, { ok: 1 }); };
expect("p9: http retries network errors and aborts a hanging try", (await getWithRetry("u", { fetch: flaky, sleep, timeout: 20 })).status === 200 && calls === 3 && slept.length === 2);
let hung = false; try { await getWithRetry("u", { fetch: () => new Promise(() => {}), sleep, retries: 1, timeout: 10 }); } catch (e) { hung = /timed out/.test(e.message); }
expect("p9: a host that always hangs fails with a timeout", hung);
q = queue([res(200, { archived_snapshots: { closest: { available: true, url: "http://web.archive.org/web/2003/spacex.com", timestamp: "20030601" } } })]);
expect("p9: wayback archive links are https", (await closest("spacex.com", "2003", { fetch: q.fetch, sleep })).archive_url.startsWith("https://"));
q = queue([res(200, [["urlkey", "timestamp", "original", "mimetype", "statuscode", "digest", "length"], ["com,spacex)/updates", "20031201000000", "http://www.spacex.com/updates.php", "text/html", "200", "D", "1234"]])]);
const caps = await cdx("spacex.com", { from: 2003, to: 2008, fetch: q.fetch, sleep });
expect("p9: wayback CDX search finds pages under a site in a date range", q.urls[0].includes("/cdx/search/cdx?") && q.urls[0].includes("matchType=prefix") && q.urls[0].includes("from=2003") && caps.length === 1 && caps[0].archive_url === "https://web.archive.org/web/20031201000000/http://www.spacex.com/updates.php");
q = queue([res(200, { filings: { recent: { accessionNumber: ["0001-26-000001"], form: ["424B4"], filingDate: ["2026-06-01"], primaryDocument: ["p.htm"] }, files: [{ name: "CIK0001181412-submissions-001.json", filingFrom: "2002-01-01", filingTo: "2010-01-01" }] } }),
  res(200, { accessionNumber: ["0001-09-000001"], form: ["D"], filingDate: ["2009-03-01"], primaryDocument: ["d.xml"] })]);
const old = await filings(1181412, { fetch: q.fetch, sleep });
expect("p9: sec-edgar reads the older filing pages", old.length === 2 && old[1].form === "D" && q.urls[1].endsWith("CIK0001181412-submissions-001.json"));
q = queue([res(200, { hits: { hits: [{ _id: "0000950123-08-017480:d8k.htm", _source: { ciks: ["0000820736"], form: "8-K", file_date: "2008-12-23", display_names: ["Orbital Sciences"] } }] } })]);
const fts = await edgarSearch("Commercial Resupply Services", { forms: ["8-K"], from: "2008-12-01", to: "2008-12-31", fetch: q.fetch, sleep });
expect("p9: sec-edgar full-text search across companies", q.urls[0].startsWith("https://efts.sec.gov/") && fts[0].url === "https://www.sec.gov/Archives/edgar/data/820736/000095012308017480/d8k.htm");
q = queue([res(200, { results: [{ id: 1, title: "COTS", created: "2008", subjectCategories: ["Launch Vehicles And Launch Operations"] }, { id: 2, title: "Other", created: "2019", subjectCategories: ["Launch Vehicles"] }, { id: 3, title: "X", created: "2007", subjectCategories: ["Optics"] }] })]);
const nr = await reports("SpaceX", { from: 2002, to: 2008, subject: "launch", fetch: q.fetch, sleep });
expect("p9: nasa reports filter by date and subject", nr.length === 1 && nr[0].id === "1" && q.urls[0].includes("published.gte=2002-01-01"));

rmSync(tmp, { recursive: true, force: true });
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("research engine: all passed");
