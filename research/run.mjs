// The research queue (architecture sections 1-2). Confidential (Mentura).
// One cell at a time: find -> extract -> judge -> verify -> store, with a spend cap per run.
// Every agent and model call goes through `agent(step, input)`, injected, so tests use stubs and
// nothing here names a vendor SDK. It returns { output, cost }. Steps and their outputs:
//   find     { sources: [source] }                    sources with factors and access_level
//   extract  { claims: [claim], citations: [citation] }
//   judge    { factors?, supports? }  per typed judgment: Jev when TYPESAFE_API_KEY is set and a
//            `jev` function is given, else the default model through `agent`
//   verify   { agrees: { [claim id]: boolean } }      run as a different role; never the finder
// Verdicts are computed in code (credibility.mjs), never taken from a model.
//
// Personal-life cells (personal: true) are refused unless RESEARCH_PERSONAL=on and the subject is
// marked public_figure with a legal_basis recorded (architecture section 6).

import { judgeClaim, sourceCredibility } from "./credibility.mjs";

export const VERIFY_GATE = 0.9;

// The one rule for a verifier's answer: a rejected claim cannot stand above possible.
export function applyVerification(claim, agrees, role = "verifier") {
  if (agrees === undefined) return claim;
  const out = { ...claim, verified_by: role, verifier_agrees: agrees };
  if (agrees === false) out.verdict = "possible";
  return out;
}
const withCredibility = (s, factors) => { const c = sourceCredibility({ ...s, factors }); const { credibility, ...rest } = s; return c == null ? { ...rest, factors } : { ...rest, factors, credibility: c }; };

export function personalAllowed(cell, env = process.env) {
  if (!cell.personal) return { ok: true };
  if (env.RESEARCH_PERSONAL !== "on") return { ok: false, why: "personal-life research is off (RESEARCH_PERSONAL is not on)" };
  if (cell.subject?.public_figure !== true) return { ok: false, why: "the subject is not marked a public figure" };
  if (!cell.subject?.legal_basis) return { ok: false, why: "no legal basis recorded for this subject" };
  return { ok: true };
}

// verify: run the same-cell verifier call inline (default on). The independent check is
// verifyCell below, which fetches again; run it over a sample of answered cells.
/** @param {any} cell @param {{ agent: any, jev?: any, store: any, env?: Record<string, string | undefined>, budget?: { cap: number, spent: number }, now?: () => string, verify?: boolean }} deps */
export async function runCell(cell, { agent, jev, store, env = process.env, budget = { cap: Infinity, spent: 0 }, now = () => new Date().toISOString(), verify = true }) {
  const allowed = personalAllowed(cell, env);
  if (!allowed.ok) return store.put("cells", { ...cell, status: "refused", note: allowed.why });
  let spend = 0;
  const call = async (step, input, role = "researcher") => {
    if (budget.spent >= budget.cap) throw Object.assign(new Error(`spend cap ${budget.cap} reached`), { cap: true });
    const { output, cost = 0 } = await agent(step, { ...input, role });
    budget.spent += cost; spend += cost;
    return output;
  };
  const useJev = Boolean(env.TYPESAFE_API_KEY && jev);
  try {
    const { sources = [] } = await call("find", { cell });
    const { claims = [], citations = [] } = await call("extract", { cell, sources });
    const scored = [];
    for (const s of sources) {
      // A failed Jev call falls back to the default model.
      let j = null;
      if (useJev) { try { j = await jev("factors", { source: s }); } catch { j = null; } }
      if (!j) j = await call("judge", { judgment: "factors", source: s });
      const factors = { ...s.factors, ...(j?.factors ?? {}) };
      scored.push(withCredibility(s, factors));
    }
    // A cell with no claims is not answered: store it as failed so the generator offers it again.
    if (!claims.length) {
      for (const s of scored) store.put("sources", s);
      return store.put("cells", { ...cell, status: "failed", note: "no claims found", spend });
    }
    const { agrees = {} } = verify ? await call("verify", { cell, sources: scored, claims, citations }, "verifier") : {};
    for (const s of scored) store.put("sources", s);
    for (const c of citations) store.put("citations", c);
    const ids = [];
    for (const c of claims) {
      const judged = applyVerification(judgeClaim({ ...c, cell_id: cell.id }, citations, scored, { aspect: cell.aspect }), agrees[c.id]);
      store.put("claims", judged); ids.push(judged.id);
    }
    return store.put("cells", { ...cell, status: "answered", answered_at: now(), claims: ids, spend });
  } catch (e) {
    if (e.cap) throw e;
    return store.put("cells", { ...cell, status: "failed", note: String(e.message ?? e), spend });
  }
}

// Runs cells in order until done or the cap is reached; resumes by skipping answered cells.
export async function runQueue(cells, deps) {
  const budget = deps.budget ?? { cap: Number(process.env.RESEARCH_SPEND_CAP ?? Infinity), spent: 0 };
  const done = deps.store.answered();
  const results = [];
  for (const cell of cells) {
    if (done.get(cell.id)?.status === "answered") continue;
    try { results.push(await runCell(cell, { ...deps, budget })); }
    catch (e) { if (e.cap) return { results, stopped: e.message, spent: budget.spent }; throw e; }
  }
  return { results, stopped: null, spent: budget.spent };
}

// The separate verifier step: a sample of answered cells, fetched again by a fresh "verifier" role
// that never sees the finder's sources, then asked to agree or not with each stored claim. Rejected
// claims fall to possible (applyVerification). Passes when agreement reaches the 90% gate.
//   rate: share of answered cells to sample; random: injectable for tests.
export async function verifyCells(cells, { agent, store, rate = 0.3, random = Math.random, gate = VERIFY_GATE, budget = { cap: Infinity, spent: 0 } }) {
  const answered = cells.filter((c) => store.get("cells", c.id)?.status === "answered");
  const sample = answered.filter(() => random() < rate);
  if (answered.length && !sample.length) sample.push(answered[0]);
  let agreed = 0, total = 0, cellsAgreed = 0;
  const results = [];
  for (const cell of sample) {
    const r = await verifyCell(cell, { agent, store, budget });
    agreed += r.agreed; total += r.total; if (r.total && r.agreed === r.total) cellsAgreed++;
    results.push(r);
  }
  const agreement = total ? agreed / total : null;
  return { sampled: sample.length, claims: total, agreement, cell_agreement: sample.length ? cellsAgreed / sample.length : null, passed: agreement != null && agreement >= gate, results };
}

export async function verifyCell(cell, { agent, store, budget = { cap: Infinity, spent: 0 } }) {
  const call = async (step, input) => {
    if (budget.spent >= budget.cap) throw Object.assign(new Error(`spend cap ${budget.cap} reached`), { cap: true });
    const { output, cost = 0 } = await agent(step, { ...input, role: "verifier" });
    budget.spent += cost; return output;
  };
  const claims = store.all("claims").filter((c) => c.cell_id === cell.id);
  const { sources = [] } = await call("find", { cell, fresh: true });
  const { agrees = {} } = await call("verify", { cell, sources, claims });
  let agreed = 0, total = 0;
  for (const c of claims) {
    if (!(c.id in agrees)) continue;
    total++; if (agrees[c.id]) agreed++;
    store.put("claims", applyVerification(c, agrees[c.id], "verifier-refetch"));
  }
  return { cell: cell.id, agreed, total, fetched: sources.length };
}
