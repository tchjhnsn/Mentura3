// USPTO: patent search through the PatentsView API (trademark filings date a brand's first use).
// PatentsView needs an API key, read from PATENTSVIEW_API_KEY when run, never in tests.
import { getWithRetry, json } from "./http.mjs";

export async function patents(assignee, { key = process.env.PATENTSVIEW_API_KEY, size = 25, ...opts } = {}) {
  const q = encodeURIComponent(JSON.stringify({ assignees: { assignee_organization: assignee } }));
  const f = encodeURIComponent(JSON.stringify(["patent_id", "patent_title", "patent_date"]));
  const d = await json(await getWithRetry(`https://search.patentsview.org/api/v1/patent/?q=${q}&f=${f}&o=${encodeURIComponent(JSON.stringify({ size }))}`, { ...opts, headers: key ? { "X-Api-Key": key } : {} }));
  return (d.patents ?? []).map((p) => ({ id: p.patent_id, title: p.patent_title, date: p.patent_date, url: `https://patents.google.com/patent/US${p.patent_id}` }));
}
