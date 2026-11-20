// The book of your life (migration 0016): beliefs are Learn claims, placed in a domain by the person and,
// when marked in the journal editor, tied to the passage they came from. Migration 0017 marks each belief an
// ideal or a practical belief (a practical one names the ideal it serves and its circumstances) and keeps its
// origins. The book itself is computed by the core (@reflect/core/book) each time; an edition is a work.
// Since migration 0065 (docs/design/REFLECT_QUOTES_2026-11-20.md) a claim's domain, kind and origins are tags on the
// claim, and the passage a belief came from is a quote from that work; claim_domain, claim_kind, claim_origin and
// claim_source are no longer written, and the backfill turned their rows into tags and quotes.
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { bookMarkdown, checkKind, compileBook, isDomain, type Belief, type BeliefKind, type Domain } from "@reflect/core/book";
import type { Holder } from "@reflect/core/claims";
import { cleanOrigins, type Origin } from "@reflect/core/origins";
import { workTitle } from "@reflect/core/works";
import { seal } from "./crypto";
import { keepClaim, listClaims } from "./claims-store";
import { tx } from "./learn-store";
import { claimTags, insertTag, loadQuotes, withdrawScheme, type AppQuote } from "./quotes-store";
import { liveTags } from "@reflect/core/quotes";
import { getWork, listWorks } from "./work-store";
import { subjectDomains } from "./subject-domain-store";

const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/** Place one of the person's claims in a chapter. */
export async function placeClaim(userId: string, claimId: string, domain: string): Promise<void> {
  if (!isDomain(domain)) throw new Error("That is not a domain of the book.");
  if (!(await own(userId, claimId))) throw new Error("No such belief.");
  await tx((q) => insertTag(q, userId, { claim: claimId }, { scheme: "domain", value: domain }));
}

const own = async (userId: string, claimId: string) =>
  isId(claimId) && Boolean((await db().query("SELECT 1 FROM learn_claim WHERE id = $1 AND user_id = $2", [claimId, userId])).rows[0]);

/** What the person says of a belief when marking it. `serves` is an ideal they keep, or the words of a new one. */
export type Marking = {
  kind: BeliefKind | string;
  serves?: { id: string } | { text: string } | null;
  circumstances?: string | null;
  origins?: readonly string[];
};

/**
 * Mark one of the person's beliefs an ideal or a practical belief, with its origins. A practical belief
 * names the ideal it serves: one they already keep, or new words that become an ideal of its own, placed
 * in the same domain.
 */
export async function markBelief(userId: string, claimId: string, m: Marking): Promise<void> {
  if (!(await own(userId, claimId))) throw new Error("No such belief.");
  let serves: string | null = null;
  if (m.kind === "practical" && m.serves) {
    if ("id" in m.serves) {
      if (!(await own(userId, m.serves.id)) || (await kindOfClaim(userId, m.serves.id)) !== "ideal") throw new Error("That is not one of your ideals.");
      serves = m.serves.id;
    } else if (m.serves.text.trim()) {
      checkKind(m.kind, "new", m.circumstances); // refuse before keeping a new ideal
      serves = await keepClaim(userId, { text: m.serves.text, stance: "belief" });
      if (serves === claimId) throw new Error("A practical belief cannot serve itself.");
      await tx((q) => insertTag(q, userId, { claim: serves! }, { scheme: "kind", value: "ideal" }));
      const d = await domainOf(userId, claimId);
      if (d) await placeClaim(userId, serves, d);
    }
  }
  if (serves === claimId) throw new Error("A practical belief cannot serve itself.");
  const { kind, circumstances } = checkKind(m.kind, serves, m.circumstances);
  await tx(async (q) => {
    await insertTag(q, userId, { claim: claimId }, { scheme: "kind", value: kind, ...(kind === "practical" && serves ? { object: serves } : {}), ...(circumstances ? { detail: circumstances } : {}) });
    if (m.origins) {
      // A new marking of origins replaces the last: the old origin tags are withdrawn, never deleted.
      await withdrawScheme(q, userId, claimId, "origin");
      for (const o of cleanOrigins(m.origins)) await insertTag(q, userId, { claim: claimId }, { scheme: "origin", value: o });
    }
  });
}

/** The latest kind a claim is marked with, from its tags. */
async function kindOfClaim(userId: string, claimId: string): Promise<BeliefKind | null> {
  const { claims } = await loadQuotes(userId, db(), claimId);
  const c = claims[0];
  return c ? ((claimTags(c).kind?.value as BeliefKind | undefined) ?? null) : null;
}

async function domainOf(userId: string, claimId: string): Promise<Domain | null> {
  const { claims } = await loadQuotes(userId, db(), claimId);
  return claims[0] ? ((claimTags(claims[0]).domain?.value as Domain | undefined) ?? null) : null;
}

/**
 * A passage the person selected in one of their works becomes a belief, marked an ideal or a practical
 * belief, placed in the domain they chose, with its origins and who else holds it, and tied back to the work.
 * The passage is the claim's words, as they wrote it.
 */
export async function beliefFromWork(userId: string, workId: string, passage: string, domain: string, m: Marking & { holders?: Holder[] }): Promise<string> {
  if (!isDomain(domain)) throw new Error("Choose a domain for it.");
  const work = await getWork(userId, workId);
  if (!work) throw new Error("No such work.");
  const text = passage.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("Select the passage first.");
  checkKind(m.kind, m.serves && ("id" in m.serves ? m.serves.id : m.serves.text.trim()) ? "given" : null, m.circumstances);
  const claimId = await keepClaim(userId, { text, stance: "belief", holders: m.holders, said: { workId, passage: text } });
  await placeClaim(userId, claimId, domain);
  await markBelief(userId, claimId, m);
  return claimId;
}

/** Every claim as the book reads it: stance history, its domain (placed itself, else its Learn subject's), and the work it was marked from. */
export async function beliefs(userId: string): Promise<Belief[]> {
  const [claims, loaded, works, bySubject] = await Promise.all([listClaims(userId), loadQuotes(userId), listWorks(userId), subjectDomains(userId)]);
  const textOf = new Map(claims.map((c) => [c.id, c.text]));
  const tagsOf = new Map(loaded.claims.map((c) => [c.id, claimTags(c, loaded.details)]));
  const titles = new Map(works.map((w) => [w.id, workTitle(w)]));
  const sourceOf = firstWorks(loaded.quotes);
  return claims.map((c) => {
    const w = sourceOf.get(c.id);
    const t = tagsOf.get(c.id);
    const k = t?.kind ?? null;
    const serves = k?.object ? { id: k.object, text: textOf.get(k.object) ?? "" } : null;
    return {
      id: c.id, text: c.text, holders: c.holders, history: c.history, domain: (t?.domain?.value as Domain | undefined) ?? (c.subject ? bySubject.get(c.subject.id) : undefined) ?? null, source: w ? { workId: w, title: titles.get(w) ?? "a work" } : null,
      kind: (k?.value as BeliefKind | undefined) ?? null, serves, circumstances: t?.circumstances ?? null, origins: cleanOrigins(t?.origins ?? []) as Origin[],
    };
  });
}

export async function bookOf(userId: string) {
  return compileBook(await beliefs(userId));
}

/** Compile an edition: the book as it stands, kept as a dated memoir in the journal. */
export async function compileEdition(userId: string): Promise<string> {
  const { chapters } = await bookOf(userId);
  const now = new Date().toISOString();
  const id = randomUUID();
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    await c.query("INSERT INTO work (id, user_id, kind, template) VALUES ($1, $2, 'memoir', 'book-edition')", [id, userId]);
    await c.query("INSERT INTO work_version (work_id, seq, title_ct, body_ct) VALUES ($1, 0, $2, $3)", [id, seal(userId, `The book of my life, ${now.slice(0, 10)}`), seal(userId, bookMarkdown(chapters, now))]);
    await c.query("COMMIT");
    return id;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}


/** The ideals the person holds now, for a practical belief to name the one it serves. */
export async function idealsOf(userId: string): Promise<{ id: string; text: string; domain: Domain | null }[]> {
  const { chapters, unplaced } = await bookOf(userId);
  const held = [...chapters.flatMap((c) => c.entries.map((e) => ({ e, domain: c.domain as Domain | null }))), ...unplaced.map((e) => ({ e, domain: null }))];
  return held.filter(({ e }) => e.state === "held" && e.kind === "ideal").map(({ e, domain }) => ({ id: e.id, text: e.text, domain }));
}

/** One domain of a life: its works, and its chapter of the book (ideals, then practical beliefs). */
export async function domainView(userId: string, domain: Domain) {
  const [book, works] = await Promise.all([bookOf(userId), listWorks(userId)]);
  return { chapter: book.chapters.find((c) => c.domain === domain)!, works: works.filter((w) => w.domain === domain) };
}

/**
 * Send a passage the person wrote to Learn: it becomes a claim with their stance, filed under a Learn
 * subject (so it reaches whatever domain the subject is placed in), and tied back to the work it came from.
 */
export async function claimFromWork(userId: string, workId: string, passage: string, subject: string, stance: string): Promise<string> {
  const work = await getWork(userId, workId);
  if (!work) throw new Error("No such work.");
  const text = passage.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("Select the passage first.");
  if (!subject.trim()) throw new Error("Name the subject it belongs under.");
  return keepClaim(userId, { text, stance, subject, said: { workId, passage: text } });
}

/** The work each claim was first sent or marked from, by claim id. */
export async function claimWorks(userId: string): Promise<Map<string, { workId: string; title: string }>> {
  const [{ quotes }, works] = await Promise.all([loadQuotes(userId), listWorks(userId)]);
  const titles = new Map(works.map((w) => [w.id, workTitle(w)]));
  return new Map([...firstWorks(quotes)].map(([claim, workId]) => [claim, { workId, title: titles.get(workId) ?? "a work" }]));
}

/** The work each claim was first said in: the earliest quote from a work whose claim tag names it. */
function firstWorks(quotes: readonly AppQuote[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const q of quotes) {
    if (!q.workId) continue;
    for (const t of liveTags(q.record)) if (t.scheme === "claim" && t.status === "confirmed" && !out.has(t.value)) out.set(t.value, q.workId);
  }
  return out;
}
