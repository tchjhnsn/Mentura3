// SEC EDGAR: a company's filings by CIK (primary sources for public companies), including the
// older filing pages, and full-text search across every company's filings. SEC asks for a
// descriptive user agent and at most 10 requests a second.
import { getWithRetry, json } from "./http.mjs";
/** @typedef {import("./http.mjs").HttpOpts} HttpOpts */

const rows = (cik, r) => (r.accessionNumber ?? []).map((acc, i) => ({
  form: r.form[i], filed: r.filingDate[i], accession: acc,
  url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${acc.replace(/-/g, "")}/${r.primaryDocument[i]}`,
}));

// all: also read the older pages listed under filings.files (default true). from/to: filing dates.
/** @param {string | number} cik @param {HttpOpts & { forms?: string[], all?: boolean, from?: string, to?: string }} [opts] */
export async function filings(cik, { forms, all = true, from, to, ...opts } = {}) {
  const id = String(cik).padStart(10, "0");
  const d = await json(await getWithRetry(`https://data.sec.gov/submissions/CIK${id}.json`, opts));
  let out = rows(cik, d.filings?.recent ?? {});
  if (all) for (const f of d.filings?.files ?? []) {
    if (from && f.filingTo && f.filingTo < from) continue;
    if (to && f.filingFrom && f.filingFrom > to) continue;
    out = out.concat(rows(cik, await json(await getWithRetry(`https://data.sec.gov/submissions/${f.name}`, opts))));
  }
  return out.filter((f) => (!forms || forms.includes(f.form)) && (!from || f.filed >= from) && (!to || f.filed <= to));
}

// Full-text search (EDGAR FTS, filings from 2001 on) across all companies.
/** @param {string} query @param {HttpOpts & { forms?: string[], from?: string, to?: string }} [opts] */
export async function search(query, { forms, from, to, ...opts } = {}) {
  const p = new URLSearchParams({ q: `"${query}"` });
  if (forms) p.set("forms", forms.join(","));
  if (from || to) { p.set("dateRange", "custom"); if (from) p.set("startdt", from); if (to) p.set("enddt", to); }
  const d = await json(await getWithRetry(`https://efts.sec.gov/LATEST/search-index?${p}`, opts));
  return (d.hits?.hits ?? []).map((h) => {
    const s = h._source ?? {}; const [acc, doc] = String(h._id ?? "").split(":");
    const cik = Number(s.ciks?.[0]);
    return { form: s.form ?? s.file_type, filed: s.file_date, accession: acc, company: s.display_names?.[0], cik, url: cik && acc && doc ? `https://www.sec.gov/Archives/edgar/data/${cik}/${acc.replace(/-/g, "")}/${doc}` : null };
  });
}
