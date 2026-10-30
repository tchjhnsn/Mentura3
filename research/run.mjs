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

export function personalAllowed(cell, env = process.env) {
  if (!cell.personal) return { ok: true };
  if (env.RESEARCH_PERSONAL !== "on") return { ok: false, why: "personal-life research is off (RESEARCH_PERSONAL is not on)" };
  if (cell.subject?.public_figure !== true) return { ok: false, why: "the subject is not marked a public figure" };
  if (!cell.subject?.legal_basis) return { ok: false, why: "no legal basis recorded for this subject" };
  return { ok: true };
}

export async function runCell(cell, { agent, jev, store, env = process.env, budget = { cap: Infinity, spent: 0 }, now = () => new Date().toISOString() }) {
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
      scored.push({ ...s, factors, credibility: sourceCredibility({ ...s, factors }) });
    }
    const { agrees = {} } = await call("verify", { cell, sources: scored, claims, citations }, "verifier");
    for (const s of scored) store.put("sources", s);
    for (const c of citations) store.put("citations", c);
    const ids = [];
    for (const c of claims) {
      const { _supporters, _reasons, ...judged } = judgeClaim({ ...c, cell_id: cell.id }, citations, scored);
      if (c.id in agrees) { judged.verified_by = "verifier"; judged.verifier_agrees = agrees[c.id]; }
      // A claim the verifier rejects cannot stand above possible.
      if (agrees[c.id] === false) judged.verdict = "possible";
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
