// SEC EDGAR: a company's filings by CIK (primary sources for public companies). SEC asks for a
// descriptive user agent and at most 10 requests a second.
import { getWithRetry, json } from "./http.mjs";

export async function filings(cik, { forms, ...opts } = {}) {
  const id = String(cik).padStart(10, "0");
  const d = await json(await getWithRetry(`https://data.sec.gov/submissions/CIK${id}.json`, opts));
  const r = d.filings?.recent ?? {};
  return (r.accessionNumber ?? []).map((acc, i) => ({
    form: r.form[i], filed: r.filingDate[i], accession: acc,
    url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${acc.replace(/-/g, "")}/${r.primaryDocument[i]}`,
  })).filter((f) => !forms || forms.includes(f.form));
}
