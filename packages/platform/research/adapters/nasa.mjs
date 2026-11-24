// NASA: the NTRS technical reports server (contracts and reports naming a venture, such as SpaceX).
// from/to (years) and subject filter the results; the date range is also sent to the API.
import { getWithRetry, json } from "./http.mjs";
/** @typedef {import("./http.mjs").HttpOpts} HttpOpts */

const year = (t) => { const m = /^(\d{4})/.exec(String(t ?? "")); return m ? Number(m[1]) : null; };

/** @param {string} query @param {HttpOpts & { size?: number, from?: number, to?: number, subject?: string }} [opts] */
export async function reports(query, { size = 25, from, to, subject, ...opts } = {}) {
  const p = new URLSearchParams({ q: query, "page.size": String(size) });
  if (from) p.set("published.gte", `${from}-01-01`);
  if (to) p.set("published.lte", `${to}-12-31`);
  const d = await json(await getWithRetry(`https://ntrs.nasa.gov/api/citations/search?${p}`, opts));
  const want = subject?.toLowerCase();
  return (d.results ?? []).map((r) => ({ id: String(r.id), title: r.title, published_at: r.publications?.[0]?.publicationDate ?? r.created, subjects: r.subjectCategories ?? [], url: `https://ntrs.nasa.gov/citations/${r.id}` }))
    .filter((r) => { const y = year(r.published_at); return (!from || (y != null && y >= from)) && (!to || (y != null && y <= to)); })
    .filter((r) => !want || r.subjects.some((s) => s.toLowerCase().includes(want)) || r.title?.toLowerCase().includes(want));
}
