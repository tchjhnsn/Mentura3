// The people of podcasts (Torian, 2026-11-15 16:47Z): a show's hosts, a person's own shows and accounts, from
// Wikidata and Apple's podcast search; and the people a person follows (migration 0034).
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { SPARQL, feedForms, feedHosts, hostsQuery, namedShows, personQuery, readHosts, readPerson, type Host, type HostedShow, type Link } from "@reflect/core/people";
import type { Show } from "@reflect/core/podcasts";

// Good answers are kept a day in memory; a failure (a timeout, Wikidata's rate limit) is asked again next time.
const kept = new Map<string, { at: number; text: string }>();
const day = async (url: string, accept?: string) => {
  const had = kept.get(url);
  if (had && Date.now() - had.at < 86_400_000) return had.text;
  try {
    const r = await fetch(url, { headers: { "user-agent": "reflect-app/1.0 (podcast pages)", ...(accept ? { accept } : {}) }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const text = await r.text();
    if (kept.size > 2000) kept.delete(kept.keys().next().value!);
    kept.set(url, { at: Date.now(), text });
    return text;
  } catch { return null; }
};
const sparql = (q: string) => day(`${SPARQL}?query=${encodeURIComponent(q)}`, "application/sparql-results+json");

/** A show's Apple Podcasts id: from its Apple link, else Apple's search by its title, matched on its feed. */
async function appleIdOf(show: Pick<Show, "feed" | "title">, link?: string | null): Promise<string | null> {
  const fromLink = link?.match(/podcasts\.apple\.com\/.*\/id(\d+)/)?.[1];
  if (fromLink) return fromLink;
  if (!show.title) return null;
  const forms = new Set(feedForms(show.feed));
  try {
    const j = JSON.parse((await day(`https://itunes.apple.com/search?media=podcast&entity=podcast&limit=10&term=${encodeURIComponent(show.title)}`)) ?? "{}") as { results?: { collectionId?: number; feedUrl?: string }[] };
    const hit = (j.results ?? []).find((r) => r.feedUrl && feedForms(r.feedUrl).some((f) => forms.has(f)));
    return hit?.collectionId ? String(hit.collectionId) : null;
  } catch { return null; }
}

/** A show's hosts: Wikidata's presenters of it, by its Apple id or feed, else those its feed names. */
export async function hostsOf(show: Pick<Show, "author" | "people" | "episodes" | "feed" | "title">, link?: string | null): Promise<Host[]> {
  const apple = await appleIdOf(show, link);
  // By Apple id alone when there is one: matching feeds is slow on Wikidata's side.
  const q = hostsQuery(apple ? { apple } : { feed: show.feed });
  const found = q ? readHosts(await sparql(q)) : [];
  return found.length ? found : feedHosts(show);
}

export type OwnShow = HostedShow & { image?: string; by?: string };

/** What Wikidata says of a person (their accounts, the shows they host), with each show's artwork from Apple; and shows carrying their name. */
export async function personFacts(qid: string | null | undefined, name: string): Promise<{ links: Link[]; shows: OwnShow[] }> {
  const q = qid ? personQuery(qid) : null;
  const [facts, named] = await Promise.all([
    q ? sparql(q).then(readPerson) : Promise.resolve({ links: [], shows: [] }),
    day(`https://itunes.apple.com/search?media=podcast&entity=podcast&limit=10&term=${encodeURIComponent(name)}`).then((t) => namedShows(t, name)),
  ]);
  const shows: OwnShow[] = [...facts.shows];
  for (const n of named) if (!shows.some((s) => (s.apple && s.apple === n.apple) || s.title.toLowerCase() === n.title.toLowerCase())) shows.push(n);
  const missing = shows.filter((s) => s.apple && !s.image).map((s) => s.apple!);
  if (missing.length) {
    try {
      const j = JSON.parse((await day(`https://itunes.apple.com/lookup?id=${missing.slice(0, 10).join(",")}&entity=podcast`)) ?? "{}") as { results?: { collectionId?: number; artworkUrl600?: string; artistName?: string; feedUrl?: string }[] };
      for (const r of j.results ?? []) {
        const s = shows.find((x) => x.apple === String(r.collectionId));
        if (!s) continue;
        if (r.artworkUrl600) s.image = r.artworkUrl600;
        if (r.artistName && !s.by) s.by = r.artistName;
        if (r.feedUrl && !s.feed) s.feed = r.feedUrl;
      }
    } catch { /* artwork is a nicety */ }
  }
  return { links: facts.links, shows: shows.slice(0, 6) };
}

export type Followed = { name: string; qid: string | null; since: string };

/** Follows a guest or host, or stops. Each change is a new row; the latest for a name counts. */
export async function setFollow(userId: string, p: { name: string; qid?: string | null }, follow: boolean): Promise<void> {
  const name = p.name.replace(/\s+/g, " ").trim().slice(0, 120);
  if (name.length < 3) throw new Error("No such person.");
  const qid = p.qid && /^Q\d{1,12}$/.test(p.qid) ? p.qid : null;
  await db().query("INSERT INTO person_follow (id, user_id, name, qid, follow) VALUES ($1, $2, $3, $4, $5)", [randomUUID(), userId, name, qid, follow]);
}

/** The people a person follows now, most recently followed first. Empty before migration 0034 runs. */
export async function followed(userId: string): Promise<Followed[]> {
  try {
    const r = await db().query<{ name: string; qid: string | null; follow: boolean; created_at: Date }>(
      "SELECT DISTINCT ON (lower(name)) name, qid, follow, created_at FROM person_follow WHERE user_id = $1 ORDER BY lower(name), created_at DESC, id DESC",
      [userId],
    );
    return r.rows.filter((x) => x.follow).sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).map((x) => ({ name: x.name, qid: x.qid, since: x.created_at.toISOString() }));
  } catch {
    return [];
  }
}
