// Quotes and their tags in the app's Postgres (migration 0065; docs/design/REFLECT_QUOTES_2026-11-20.md, step 2). The
// rules are the core's (@reflect/core/quotes): a quote is the exact words with who, where and when; everything else is
// a tag on a quote or on a claim (learn_claim stays the claim); tags are only added; the person's status tags confirm
// or withdraw; an assistant's tag, or a quote the person did not state, counts only once confirmed. Rows are turned
// into the core's records and checked by the core before anything is written.
import { randomUUID } from "node:crypto";
import type { PoolClient } from "@neondatabase/serverless";
import { addTag, claimProblems, liveTags, quoteProblems, type Known, type NewTag, type QuoteRecord, type QuoteSource, type QuoteSourceKind, type Speaker, type Tag, type TagCreator, type VaultClaim, type VaultQuote } from "@reflect/core/quotes";
import type { SourceKind } from "@reflect/core/value-source";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";

type Q = Pick<PoolClient, "query">;
const isId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

type TagRow = { quote_id: string | null; claim_id: string | null; seq: number; scheme: string; purpose: string; value: string | null; value_ct: string | null; object: string | null; selector_ct: string | null; detail_ct: string | null; creator: string; created_at: string };

const tagOf = (userId: string, r: TagRow): Tag => ({
  id: `t${r.seq}`,
  purpose: r.purpose as Tag["purpose"],
  scheme: r.scheme as Tag["scheme"],
  value: r.value ?? open(userId, r.value_ct!),
  ...(r.object ? { object: r.object } : {}),
  ...(r.selector_ct ? { selector: JSON.parse(open(userId, r.selector_ct)) as Tag["selector"] } : {}),
  created: new Date(r.created_at).toISOString(),
  creator: r.creator as TagCreator,
});

/** A quote as the app keeps it: the core's record, and the work it came from when it came from one. */
export type AppQuote = VaultQuote & { workId: string | null; createdAt: string };

/** Every quote and claim of the person, as the core's records, with the tags of each in order. */
export async function loadQuotes(userId: string, q: Q = db(), only?: string): Promise<{ quotes: AppQuote[]; claims: VaultClaim[]; details: Map<string, string> }> {
  if (!only) await ensureBackfilled(q, userId);
  // With `only`, just that quote or claim and its tags (a write checks one holder, not the whole collection).
  const one = only ? " AND id = $2" : "";
  const oneTag = only ? " AND (quote_id = $2 OR claim_id = $2)" : "";
  const args = only ? [userId, only] : [userId];
  const [quotes, claims, tags] = await Promise.all([
    q.query(`SELECT id, text_ct, speaker_ct, source_kind, source_ct, work_id, said_at, recorded_by, created_at FROM quote WHERE user_id = $1${one} ORDER BY created_at, id`, args),
    q.query(`SELECT id, text_ct, created_at FROM learn_claim WHERE user_id = $1${one} ORDER BY created_at, id`, args),
    q.query(`SELECT quote_id, claim_id, seq, scheme, purpose, value, value_ct, object, selector_ct, detail_ct, creator, created_at FROM quote_tag WHERE user_id = $1${oneTag} ORDER BY seq`, args),
  ]);
  const by = new Map<string, Tag[]>();
  // A practical claim's circumstances, kept beside its kind tag (the core's tag has no field for them), by `<holder>/t<n>`.
  const details = new Map<string, string>();
  for (const r of tags.rows as TagRow[]) {
    const k = (r.quote_id ?? r.claim_id)!;
    by.set(k, [...(by.get(k) ?? []), tagOf(userId, r)]);
    if (r.detail_ct) details.set(`${k}/t${r.seq}`, open(userId, r.detail_ct));
  }
  return {
    details,
    quotes: quotes.rows.map((r) => {
      const src = r.source_ct ? (JSON.parse(open(userId, r.source_ct as string)) as Omit<QuoteSource, "kind">) : {};
      const record: QuoteRecord = {
        text: open(userId, r.text_ct as string),
        speaker: r.speaker_ct ? (JSON.parse(open(userId, r.speaker_ct as string)) as Speaker) : { self: true },
        source: { kind: r.source_kind as QuoteSourceKind, ...src },
        ...(r.said_at ? { said_at: typeof r.said_at === "string" ? (r.said_at as string).slice(0, 10) : (r.said_at as Date).toISOString().slice(0, 10) } : {}),
        recorded_at: new Date(r.created_at as string).toISOString(),
        recorded_by: r.recorded_by as SourceKind,
        tags: by.get(r.id as string) ?? [],
      };
      return { id: r.id as string, record, workId: (r.work_id as string | null) ?? null, createdAt: record.recorded_at };
    }),
    claims: claims.rows.map((r) => ({ id: r.id as string, record: { text: open(userId, r.text_ct as string), created: new Date(r.created_at as string).toISOString(), tags: by.get(r.id as string) ?? [] } })),
  };
}

async function knownOf(userId: string, q: Q): Promise<Known> {
  const [a, b] = await Promise.all([q.query("SELECT id FROM quote WHERE user_id = $1", [userId]), q.query("SELECT id FROM learn_claim WHERE user_id = $1", [userId])]);
  return { quotes: new Set(a.rows.map((r) => r.id as string)), claims: new Set(b.rows.map((r) => r.id as string)) };
}

/** What a new quote says. A work's passage names its work; `legacy` names the older row it stands for. */
export type NewQuote = { text: string; speaker?: string; source: QuoteSourceKind; ref?: string; title?: string; locator?: string; workId?: string; saidAt?: string; recordedBy?: SourceKind; legacy?: string; createdAt?: string };

/** Keep a quote, checked by the core first. With `legacy`, a second call returns the first one's id. */
export async function insertQuote(q: Q, userId: string, n: NewQuote): Promise<string> {
  await ensureBackfilled(q, userId);
  const text = n.text.trim();
  const speaker: Speaker = n.speaker?.trim() ? { name: n.speaker.trim() } : { self: true };
  const source = { ...(n.ref ? { ref: n.ref } : {}), ...(n.title ? { title: n.title } : {}), ...(n.locator ? { locator: n.locator } : {}) };
  const record: QuoteRecord = { text, speaker, source: { kind: n.source, ...source }, ...(n.saidAt ? { said_at: n.saidAt } : {}), recorded_at: new Date().toISOString(), recorded_by: n.recordedBy ?? "stated", tags: [] };
  const p = quoteProblems(record, "quote");
  if (p.length) throw new Error(p.join("; "));
  if (n.workId && !isId(n.workId)) throw new Error("no such work");
  const id = randomUUID();
  await q.query(
    "INSERT INTO quote (id, user_id, text_ct, speaker_ct, source_kind, source_ct, work_id, said_at, recorded_by, legacy, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::timestamptz, now())) ON CONFLICT (user_id, legacy) DO NOTHING",
    [id, userId, seal(userId, text), "self" in speaker ? null : seal(userId, JSON.stringify(speaker)), n.source, Object.keys(source).length ? seal(userId, JSON.stringify(source)) : null, n.workId ?? null, n.saidAt ?? null, record.recorded_by, n.legacy ?? null, n.createdAt ?? null],
  );
  if (!n.legacy) return id;
  return (await q.query("SELECT id FROM quote WHERE user_id = $1 AND legacy = $2", [userId, n.legacy])).rows[0].id as string;
}

/**
 * Add one tag to a quote or claim of the person's, checked by the core against the holder's tags so far. `detail` is
 * a practical claim's circumstances, kept on its kind tag. With `legacy`, a second call adds nothing.
 */
export async function insertTag(q: Q, userId: string, on: { quote: string } | { claim: string }, t: NewTag & { detail?: string; legacy?: string }, at?: Date): Promise<string> {
  const quoteId = "quote" in on ? on.quote : null;
  const claimId = "claim" in on ? on.claim : null;
  const holder = (quoteId ?? claimId)!;
  if (!isId(holder)) throw new Error(`no such ${quoteId ? "quote" : "claim"}`);
  await ensureBackfilled(q, userId);
  if (t.legacy && (await q.query("SELECT 1 FROM quote_tag WHERE user_id = $1 AND legacy = $2", [userId, t.legacy])).rows[0]) return holder;
  const { quotes, claims } = await loadQuotes(userId, q, holder);
  // Only a tag that names another record is checked against the person's ids.
  const known = t.scheme === "claim" || t.scheme === "relation" || (t.scheme === "kind" && t.object) ? await knownOf(userId, q) : undefined;
  const now = at ?? new Date();
  if (quoteId) {
    const found = quotes.find((x) => x.id === quoteId);
    if (!found) throw new Error("no such quote");
    const next = addTag(found.record, t, now);
    const p = quoteProblems(next, "quote", known);
    if (p.length) throw new Error(p.join("; "));
    await writeTag(q, userId, { quoteId, claimId: null }, next.tags.at(-1)!, t);
  } else {
    const found = claims.find((x) => x.id === claimId);
    if (!found) throw new Error("no such claim");
    const next = addTag(found.record, t, now);
    const p = claimProblems(next, "claim", known);
    if (p.length) throw new Error(p.join("; "));
    await writeTag(q, userId, { quoteId: null, claimId }, next.tags.at(-1)!, t);
  }
  return holder;
}

async function writeTag(q: Q, userId: string, on: { quoteId: string | null; claimId: string | null }, tag: Tag, t: { detail?: string; legacy?: string }) {
  const note = tag.scheme === "note";
  await q.query(
    "INSERT INTO quote_tag (id, user_id, quote_id, claim_id, seq, scheme, purpose, value, value_ct, object, selector_ct, detail_ct, creator, legacy, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
    [randomUUID(), userId, on.quoteId, on.claimId, Number(tag.id.slice(1)), tag.scheme, tag.purpose, note ? null : tag.value, note ? seal(userId, tag.value) : null, tag.object ?? null, tag.selector ? seal(userId, JSON.stringify(tag.selector)) : null, t.detail?.trim() ? seal(userId, t.detail.trim()) : null, tag.creator, t.legacy ?? null, tag.created],
  );
}

/** Withdraw every live tag of one scheme on a claim (the person re-marking its origins), as status tags. */
export async function withdrawScheme(q: Q, userId: string, claimId: string, scheme: Tag["scheme"]): Promise<void> {
  if (!isId(claimId)) throw new Error("no such claim");
  const { claims } = await loadQuotes(userId, q, claimId);
  const c = claims.find((x) => x.id === claimId);
  if (!c) throw new Error("no such claim");
  for (const t of liveTags(c.record).filter((x) => x.scheme === scheme)) await insertTag(q, userId, { claim: claimId }, { scheme: "status", value: "withdrawn", object: t.id });
}

/** The live tags of a claim, the latest of each single-valued scheme, as the book reads them. */
export function claimTags(c: VaultClaim, details?: ReadonlyMap<string, string>) {
  const live = liveTags(c.record).filter((t) => t.status === "confirmed");
  const latest = (s: Tag["scheme"]) => live.filter((t) => t.scheme === s).at(-1) ?? null;
  const kind = latest("kind");
  return { domain: latest("domain"), kind, circumstances: kind ? (details?.get(`${c.id}/${kind.id}`) ?? null) : null, origins: live.filter((t) => t.scheme === "origin").map((t) => t.value), subject: latest("subject") };
}

// The backfill (design step 3). Before migration 0065 a stance was a learn_claim_stance row, the passage a claim came
// from a claim_source row, and a claim's domain, kind and origins rows of claim_domain, claim_kind and claim_origin.
// Those tables are no longer written. The first time a person's quotes are read or written, each old row becomes a
// quote or a tag, in the order the rows were made and with their times, named by `legacy` so it is done once. It runs
// inside the app because only the app holds the key the rows are sealed with; web/scripts/backfill-quotes.ts runs it
// for every person.
const backfilled = new Set<string>();

const PENDING = `SELECT
  EXISTS (SELECT 1 FROM learn_claim_stance s WHERE s.user_id = $1 AND NOT EXISTS (SELECT 1 FROM quote x WHERE x.user_id = $1 AND x.legacy = 'stance:' || s.id)) OR
  EXISTS (SELECT 1 FROM claim_source s WHERE s.user_id = $1 AND NOT EXISTS (SELECT 1 FROM quote x WHERE x.user_id = $1 AND x.legacy = 'source:' || s.id)) OR
  EXISTS (SELECT 1 FROM claim_domain s WHERE s.user_id = $1 AND NOT EXISTS (SELECT 1 FROM quote_tag x WHERE x.user_id = $1 AND x.legacy = 'domain:' || s.id)) OR
  EXISTS (SELECT 1 FROM claim_kind s WHERE s.user_id = $1 AND NOT EXISTS (SELECT 1 FROM quote_tag x WHERE x.user_id = $1 AND x.legacy = 'kind:' || s.id)) OR
  EXISTS (SELECT 1 FROM claim_origin s WHERE s.user_id = $1 AND NOT EXISTS (SELECT 1 FROM quote_tag x WHERE x.user_id = $1 AND x.legacy LIKE 'origin:' || s.id || '%')) AS pending`;

/** Turn the person's rows in the older claim tables into quotes and tags, once. */
export async function ensureBackfilled(q: Q, userId: string): Promise<void> {
  if (backfilled.has(userId)) return;
  backfilled.add(userId);
  try {
    if (!(await q.query(PENDING, [userId])).rows[0]?.pending) return;
    await backfillUser(q, userId);
  } catch (e) {
    backfilled.delete(userId);
    throw e;
  }
}

/** Forget which people were backfilled in this process (tests). */
export const resetBackfilled = () => backfilled.clear();

const ACT_OF_STANCE: Record<string, string> = { belief: "asserting", disbelief: "disagreeing", suspension: "pure-questioning" };

async function backfillUser(q: Q, userId: string): Promise<void> {
  // A pool gets its own client and transaction; a client passed in is already inside the caller's transaction.
  const client = "release" in q ? null : await db().connect();
  const c: Q = client ?? q;
  try {
    if (client) await client.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`reflect-quotes:${userId}`]);
    const iso = (d: unknown) => new Date(d as string).toISOString();
    const claimText = new Map((await c.query("SELECT id, text_ct FROM learn_claim WHERE user_id = $1", [userId])).rows.map((r) => [r.id as string, open(userId, r.text_ct as string)]));
    // Quotes first: stances and sources, in the order they were made.
    const stances = await c.query("SELECT id, claim_id, stance, note_ct, created_at FROM learn_claim_stance WHERE user_id = $1 ORDER BY created_at, id", [userId]);
    const sources = await c.query("SELECT id, claim_id, work_id, passage_ct, created_at FROM claim_source WHERE user_id = $1 ORDER BY created_at, id", [userId]);
    const said = [
      ...stances.rows.map((r) => ({ at: iso(r.created_at), kind: "stance" as const, r })),
      ...sources.rows.map((r) => ({ at: iso(r.created_at), kind: "source" as const, r })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    for (const { at, kind, r } of said) {
      const legacy = `${kind}:${r.id as string}`;
      const claim = r.claim_id as string;
      if (!claimText.has(claim)) continue;
      const quote =
        kind === "stance"
          ? await insertQuote(c, userId, { text: (r.note_ct ? open(userId, r.note_ct as string) : "") || claimText.get(claim)!, source: "reflect", legacy, createdAt: at })
          : await insertQuote(c, userId, { text: open(userId, r.passage_ct as string), source: "journal", workId: r.work_id as string, legacy, createdAt: at });
      await insertTag(c, userId, { quote }, { scheme: "claim", value: claim, legacy: `${legacy}:claim` }, new Date(at));
      if (kind === "stance" && ACT_OF_STANCE[r.stance as string]) await insertTag(c, userId, { quote }, { scheme: "act", value: ACT_OF_STANCE[r.stance as string]!, legacy: `${legacy}:act` }, new Date(at));
    }
    // Then the tags on each claim, in the order they were made.
    const domains = await c.query("SELECT id, claim_id, domain, created_at FROM claim_domain WHERE user_id = $1", [userId]);
    const kinds = await c.query("SELECT id, claim_id, kind, serves_claim_id, circumstances_ct, created_at FROM claim_kind WHERE user_id = $1", [userId]);
    const origins = await c.query("SELECT id, claim_id, origins, created_at FROM claim_origin WHERE user_id = $1", [userId]);
    const marks = [
      ...domains.rows.map((r) => ({ at: iso(r.created_at), kind: "domain" as const, r })),
      ...kinds.rows.map((r) => ({ at: iso(r.created_at), kind: "kind" as const, r })),
      ...origins.rows.map((r) => ({ at: iso(r.created_at), kind: "origin" as const, r })),
    ].sort((a, b) => a.at.localeCompare(b.at) || String(a.r.id).localeCompare(String(b.r.id)));
    for (const { at, kind, r } of marks) {
      const claim = r.claim_id as string;
      if (!claimText.has(claim)) continue;
      const legacy = `${kind}:${r.id as string}`;
      const when = new Date(at);
      if (kind === "domain") await insertTag(c, userId, { claim }, { scheme: "domain", value: r.domain as string, legacy }, when);
      else if (kind === "kind")
        await insertTag(c, userId, { claim }, { scheme: "kind", value: r.kind as string, ...(r.kind === "practical" && r.serves_claim_id ? { object: r.serves_claim_id as string } : {}), ...(r.circumstances_ct ? { detail: open(userId, r.circumstances_ct as string) } : {}), legacy }, when);
      else {
        if ((await c.query("SELECT 1 FROM quote_tag WHERE user_id = $1 AND legacy LIKE $2 LIMIT 1", [userId, `${legacy}:%`])).rows[0]) continue;
        const { claims } = await loadQuotes(userId, c, claim);
        let n = 0;
        for (const t of liveTags(claims[0]!.record).filter((x) => x.scheme === "origin")) await insertTag(c, userId, { claim }, { scheme: "status", value: "withdrawn", object: t.id, legacy: `${legacy}:w${n++}` }, when);
        for (const o of (r.origins as string[]).map((x) => (x === "anger" ? "spirit" : x))) await insertTag(c, userId, { claim }, { scheme: "origin", value: o, legacy: `${legacy}:${o}` }, when);
      }
    }
    if (client) await client.query("COMMIT");
  } catch (e) {
    if (client) await client.query("ROLLBACK");
    throw e;
  } finally {
    client?.release();
  }
}
