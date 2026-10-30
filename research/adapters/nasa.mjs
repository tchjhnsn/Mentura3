// NASA: the NTRS technical reports server (contracts and reports naming a venture, such as SpaceX).
import { getWithRetry, json } from "./http.mjs";

export async function reports(query, { size = 25, ...opts } = {}) {
  const d = await json(await getWithRetry(`https://ntrs.nasa.gov/api/citations/search?q=${encodeURIComponent(query)}&page.size=${size}`, opts));
  return (d.results ?? []).map((r) => ({ id: String(r.id), title: r.title, published_at: r.publications?.[0]?.publicationDate ?? r.created, url: `https://ntrs.nasa.gov/citations/${r.id}` }));
}
