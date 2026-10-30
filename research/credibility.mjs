// Source credibility and claim verdicts for the research engine (architecture section 9).
// Confidential (Mentura). Models only score the six factors; everything here is plain code, so
// the same evidence always gets the same verdict.
//
// Source factors, each 1-4 on described levels:
//   access              4 the subject in their own words or an authorized biographer with access;
//                       3 a journalist with named sources; 2 an analyst; 1 an aggregator or unknown
//   proximity           4 written at the time; 3 within 5 years; 2 within 20; 1 later
//   publisher_standards 4 an editorial and fact-check record; 1 none known
//   internal_sourcing   4 cites its sources or interviews; 1 cites nothing
//   interest            4 independent; 2 the subject's own account (self-serving risk); 1 a rival's
//   track_record        4 no known errors; 1 known errors elsewhere
// A source's credibility is the mean of the factors it has.
//
// Claim verdicts (the must-hold rules are checked one by one; averaging never hides them):
//   confirmed   >= 2 independent fetched supporters with credibility >= 3, and no contradiction
//               more credible than the best supporter
//   acceptable  >= 1 fetched supporter with credibility >= 3
//   available   a credible supporter exists but nobody has read it yet (unread)
//   possible    anything else; a claim resting only on search snippets is capped here
// Tertiary sources (Wikipedia and other encyclopedias) never count as supporters: follow them to
// what they cite. Retellings of one original (derived_from) count as one independent supporter.

export const FACTORS = ["access", "proximity", "publisher_standards", "internal_sourcing", "interest", "track_record"];
export const CREDIBLE = 3;
export const CONFIRM_MIN = 2;
export const VERDICTS = ["possible", "available", "acceptable", "confirmed"];

const TERTIARY = /(^|\.)(wikipedia\.org|britannica\.com|wikiwand\.com|fandom\.com)$/i;
export const isTertiary = (s) => s.kind === "tertiary" || (s.url ? TERTIARY.test(safeHost(s.url)) : false);
function safeHost(u) { try { return new URL(u).hostname; } catch { return ""; } }

export function sourceCredibility(s) {
  const f = s.factors ?? {};
  const vals = FACTORS.map((k) => f[k]).filter((v) => v != null);
  for (const v of vals) if (!Number.isInteger(v) || v < 1 || v > 4) throw new Error(`${s.id}: factor out of range 1-4: ${v}`);
  if (!vals.length) return 1;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

// One entry per original: the strongest retelling stands for the group.
export function independent(list) {
  const groups = new Map();
  for (const s of list) {
    const key = s.derived_from ?? s.id;
    const prev = groups.get(key);
    if (!prev || rank(s) > rank(prev)) groups.set(key, s);
  }
  return [...groups.values()];
}
const ACCESS_RANK = { fetched: 2, unread: 1, snippet: 0 };
const rank = (s) => (ACCESS_RANK[s.access_level] ?? 0) * 10 + s.credibility;

export function judgeClaim(claim, citations, sources) {
  const byId = new Map(sources.map((s) => [s.id, { ...s, credibility: s.credibility ?? sourceCredibility(s) }]));
  const mine = citations.filter((c) => c.claim_id === claim.id && byId.has(c.source_id));
  const side = (kind) => independent(mine.filter((c) => c.supports === kind).map((c) => byId.get(c.source_id)).filter((s) => !isTertiary(s)));
  const supporters = side("supports");
  const contradictions = side("contradicts");
  const fetched = supporters.filter((s) => s.access_level === "fetched");
  const fetchedCredible = fetched.filter((s) => s.credibility >= CREDIBLE);
  const best = Math.max(0, ...fetched.map((s) => s.credibility));
  const strongestAgainst = Math.max(0, ...contradictions.filter((s) => s.access_level !== "snippet").map((s) => s.credibility));
  const reasons = [];
  let verdict = "possible";
  if (fetchedCredible.length >= CONFIRM_MIN && strongestAgainst <= best) verdict = "confirmed";
  else if (fetchedCredible.length >= 1) {
    verdict = "acceptable";
    if (fetchedCredible.length >= CONFIRM_MIN) reasons.push("held below confirmed: a stronger source contradicts it");
  } else if (supporters.some((s) => s.access_level === "unread" && s.credibility >= CREDIBLE)) verdict = "available";
  if (supporters.length && supporters.every((s) => s.access_level === "snippet")) { verdict = "possible"; reasons.push("snippet-only: capped at possible until read"); }
  // Confidence: the best fetched supporter, plus a little for each further independent one, less
  // for contradictions and hindsight. Kept in 0-4 so it reads on the factor scale.
  let confidence = best + 0.25 * Math.max(0, fetchedCredible.length - 1) - (strongestAgainst ? 0.5 : 0) - (claim.hindsight_risk ? 0.25 : 0);
  if (!fetched.length) confidence = Math.min(1.5, Math.max(0, ...supporters.map((s) => s.credibility)) / 2);
  confidence = Math.round(Math.min(4, Math.max(0, confidence)) * 100) / 100;
  return { ...claim, confidence, verdict, _supporters: supporters.length, _reasons: reasons };
}
