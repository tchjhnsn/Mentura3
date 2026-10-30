// Source credibility and claim verdicts for the research engine (architecture section 9).
// Confidential (Mentura). Models only score the six factors; everything here is plain code, so
// the same evidence always gets the same verdict.
//
// Source factors, each 1-4 on described levels:
//   access              4 the subject in their own words or an authorized biographer with access;
//                       3 a journalist with named sources or documents (a reporter who talked to the
//                       people involved); 2 an analyst working from public material; 1 an aggregator
//                       or unknown
//   proximity           4 written at the time; 3 within 5 years; 2 within 20; 1 later
//   publisher_standards 4 an editorial and fact-check record; 1 none known
//   internal_sourcing   4 cites its sources or interviews; 1 cites nothing
//   interest            4 independent; 3 an interested party with nothing at stake in this claim
//                       (a partner, customer, regulator or investor reporting a fact); 2 the
//                       subject's own account (self-serving risk); 1 a rival's
//                       Interest is judged against the claim, not only the source: for what was
//                       decided, by whom and why (aspects in DECIDER_ASPECTS), a dated statement by
//                       the decider at the time is the best evidence, so its interest counts as 4.
//                       A citation may also carry its own `interest` for that claim.
//   track_record        4 no known errors; 1 known errors elsewhere
// A source's credibility is the mean of the factors it has; a source with none is unscored (null),
// never silently 1.
//
// Claim verdicts (the must-hold rules are checked one by one; averaging never hides them):
//   confirmed   >= 2 independent fetched supporters with credibility >= 3, at least one of them from
//               the time (contemporaneous, or published within PERIOD_YEARS of about_time)
//   acceptable  >= 1 fetched supporter with credibility >= 3
//   contested   checked before every verdict above: a read contradiction at least as credible as
//               the best supporter, or read contradictions as many as the credible supporters,
//               make the claim possible
//   available   a credible supporter exists but nobody has read it yet (unread)
//   possible    anything else; a claim resting only on search snippets is capped here
// Tertiary sources (Wikipedia and other encyclopedias) never count as supporters: follow them to
// what they cite. Retellings of one original (derived_from) count as one independent supporter.

export const FACTORS = ["access", "proximity", "publisher_standards", "internal_sourcing", "interest", "track_record"];
export const CREDIBLE = 3;
export const CONFIRM_MIN = 2;
export const VERDICTS = ["possible", "available", "acceptable", "confirmed"];
export const PERIOD_YEARS = 1;
export const DECIDER_ASPECTS = ["state", "decision", "decider", "rationale"];
const CONTEMPORANEOUS_KINDS = ["contemporaneous"];
const year = (t) => { const m = /^(\d{4})/.exec(String(t ?? "")); return m ? Number(m[1]) : null; };
export function fromTheTime(s) {
  if (CONTEMPORANEOUS_KINDS.includes(s.kind)) return true;
  const p = year(s.published_at), a = year(s.about_time);
  return p != null && a != null && Math.abs(p - a) <= PERIOD_YEARS;
}
const cred = (s) => s.credibility ?? 1;

const TERTIARY = /(^|\.)(wikipedia\.org|britannica\.com|wikiwand\.com|fandom\.com)$/i;
export const isTertiary = (s) => s.kind === "tertiary" || (s.url ? TERTIARY.test(safeHost(s.url)) : false);
function safeHost(u) { try { return new URL(u).hostname; } catch { return ""; } }

export function sourceCredibility(s) {
  const f = s.factors ?? {};
  const vals = FACTORS.map((k) => f[k]).filter((v) => v != null);
  for (const v of vals) if (!Number.isInteger(v) || v < 1 || v > 4) throw new Error(`${s.id}: factor out of range 1-4: ${v}`);
  if (!vals.length) return null;
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
const rank = (s) => (ACCESS_RANK[s.access_level] ?? 0) * 10 + cred(s);

// The source's credibility for this claim: interest judged against the claim (see the header).
export function credibilityFor(s, { aspect, citation } = {}) {
  const f = { ...(s.factors ?? {}) };
  if (citation?.interest != null) f.interest = citation.interest;
  else if (f.interest === 2 && DECIDER_ASPECTS.includes(aspect) && fromTheTime(s)) f.interest = 4;
  const c = sourceCredibility({ ...s, factors: f });
  return c ?? s.credibility ?? null;
}

const CLAIM_FIELDS = ["id", "cell_id", "text", "personal", "hindsight_risk", "confidence", "verdict", "verified_by", "verifier_agrees"];
export const cleanClaim = (c) => Object.fromEntries(Object.entries(c).filter(([k]) => CLAIM_FIELDS.includes(k)));

// Returns a claim that fits claim.schema.json; judgeClaimDetailed also gives the reasons.
export function judgeClaim(claim, citations, sources, opts = {}) { return judgeClaimDetailed(claim, citations, sources, opts).claim; }

export function judgeClaimDetailed(claim, citations, sources, { aspect } = {}) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const mine = citations.filter((c) => c.claim_id === claim.id && byId.has(c.source_id));
  const scoredFor = (c) => { const s = byId.get(c.source_id); return { ...s, credibility: credibilityFor(s, { aspect, citation: c }) }; };
  const side = (kind) => independent(mine.filter((c) => c.supports === kind).map(scoredFor).filter((s) => !isTertiary(s)));
  const supporters = side("supports");
  const contradictions = side("contradicts");
  const fetched = supporters.filter((s) => s.access_level === "fetched");
  const fetchedCredible = fetched.filter((s) => cred(s) >= CREDIBLE);
  const best = Math.max(0, ...fetched.map(cred));
  const readAgainst = contradictions.filter((s) => s.access_level !== "snippet");
  const strongestAgainst = Math.max(0, ...readAgainst.map(cred));
  const periodSupport = fetchedCredible.some(fromTheTime);
  const reasons = [];
  // Contested is checked before any verdict, so no path (confirmed included) can skip it.
  const contested = readAgainst.length > 0 && (strongestAgainst >= best || readAgainst.length >= fetchedCredible.length);
  let verdict = "possible";
  if (contested) reasons.push("contested: a read contradiction outweighs or matches the support");
  else if (fetchedCredible.length >= CONFIRM_MIN && periodSupport) verdict = "confirmed";
  else if (fetchedCredible.length >= 1) {
    verdict = "acceptable";
    if (fetchedCredible.length >= CONFIRM_MIN) reasons.push("held below confirmed: no credible supporter from the time");
  } else if (supporters.some((s) => s.access_level === "unread" && cred(s) >= CREDIBLE)) verdict = "available";
  if (supporters.length && supporters.every((s) => s.access_level === "snippet")) { verdict = "possible"; reasons.push("snippet-only: capped at possible until read"); }
  // Confidence: the best fetched supporter, plus a little for each further independent one, less
  // for contradictions and hindsight. Kept in 0-4 so it reads on the factor scale.
  let confidence = best + 0.25 * Math.max(0, fetchedCredible.length - 1) - (strongestAgainst ? 0.5 : 0) - (claim.hindsight_risk ? 0.25 : 0);
  if (!fetched.length) confidence = Math.min(1.5, Math.max(0, ...supporters.map(cred)) / 2);
  confidence = Math.round(Math.min(4, Math.max(0, confidence)) * 100) / 100;
  return { claim: cleanClaim({ ...claim, confidence, verdict }), supporters: supporters.length, reasons };
}
