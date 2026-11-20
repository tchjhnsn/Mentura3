import { randomUUID } from "node:crypto";
import type { PoolClient } from "@neondatabase/serverless";
import { cleanClaim, currentStance, isStance, STANCES, type Holder, type Stance, type StanceLine } from "@reflect/core/claims";
import { liveTags, quoteStatus, saidAsOf } from "@reflect/core/quotes";
import { db } from "@/db/pool";
import { open, seal, tag } from "./crypto";
import { subjectId, tx } from "./learn-store";
import { insertQuote, insertTag, loadQuotes, type AppQuote, type NewQuote } from "./quotes-store";

/**
 * Claims and the person's stance on each (migration 0012). Since migration 0065 a stance is a quote: the person's
 * words (the note, or the claim's own wording when they gave none), said in Reflect or in the work it came from,
 * tagged with the claim and with what the words do (docs/design/REFLECT_QUOTES_2026-11-20.md). The stance history is
 * read back from those quotes; learn_claim_stance is no longer written, and the backfill turned its rows into quotes.
 */

export type ClaimOut = { id: string; text: string; holders: Holder[]; subject: { id: string; name: string } | null; stance: StanceLine | null; history: StanceLine[] };

/** The act a stance is said with (Inference Anchoring Theory), and back. */
export const ACT_OF: Record<Stance, string> = { belief: "asserting", disbelief: "disagreeing", suspension: "pure-questioning" };
const STANCE_OF = { "said-so": "belief", "said-not": "disbelief", asked: "suspension" } as const;

/** Where a stance was said: in Reflect, or in a passage of one of the person's works. */
export type SaidIn = { workId: string; passage: string } | null;

/** Write a stance as the person's quote with its claim and act tags. */
export async function stanceQuote(q: Pick<PoolClient, "query">, userId: string, claimId: string, claimText: string, stance: Stance, note?: string | null, said: SaidIn = null, legacy?: string): Promise<string> {
  const n: NewQuote = said ? { text: said.passage, source: "journal", workId: said.workId, legacy } : { text: note?.trim() || claimText, source: "reflect", legacy };
  const quote = await insertQuote(q, userId, n);
  await insertTag(q, userId, { quote }, { scheme: "claim", value: claimId, legacy: legacy ? `${legacy}:claim` : undefined });
  await insertTag(q, userId, { quote }, { scheme: "act", value: ACT_OF[stance], legacy: legacy ? `${legacy}:act` : undefined });
  if (said && note?.trim()) await insertTag(q, userId, { quote }, { scheme: "note", value: note.trim(), legacy: legacy ? `${legacy}:note` : undefined });
  return quote;
}

/** A claim's id by its words, keeping it first when the person has none with those words. */
export async function claimFor(q: Pick<PoolClient, "query">, userId: string, words: string, holders: Holder[] = [], subjectId: string | null = null): Promise<string> {
  const { text, holders: clean } = cleanClaim(words, holders);
  const t = tag(userId, text.toLowerCase());
  await q.query("INSERT INTO learn_claim (id, user_id, subject_id, text_tag, text_ct, holders_ct) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, text_tag) DO NOTHING", [randomUUID(), userId, subjectId, t, seal(userId, text), seal(userId, JSON.stringify(clean))]);
  return (await q.query("SELECT id FROM learn_claim WHERE user_id = $1 AND text_tag = $2", [userId, t])).rows[0].id as string;
}

/** Keep a claim, or find it again by its words, and record the person's stance on it as a quote. */
export async function keepClaim(userId: string, c: { text: string; holders?: Holder[]; subject?: string; stance: string; note?: string; said?: SaidIn }): Promise<string> {
  if (!isStance(c.stance)) throw new Error(`a stance is one of ${STANCES.map((s) => s.id).join(", ")}`);
  const stance = c.stance;
  const { text, holders } = cleanClaim(c.text, c.holders ?? []);
  const note = c.note?.trim();
  if (note && note.length > 5000) throw new Error("the note is too long");
  return tx(async (q) => {
    const sid = c.subject?.trim() ? await subjectId(q, userId, c.subject) : null;
    const claimId = await claimFor(q, userId, text, holders, sid);
    await stanceQuote(q, userId, claimId, text, stance, note, c.said ?? null);
    return claimId;
  });
}

/** A new stance on a claim the person already keeps. */
export async function setStance(userId: string, claimId: string, stance: string, note?: string): Promise<void> {
  if (!isStance(stance)) throw new Error(`a stance is one of ${STANCES.map((s) => s.id).join(", ")}`);
  if (!/^[0-9a-f-]{36}$/.test(claimId)) throw new Error("no such claim");
  const own = await db().query("SELECT text_ct FROM learn_claim WHERE id = $1 AND user_id = $2", [claimId, userId]);
  if (!own.rows[0]) throw new Error("no such claim");
  await tx((q) => stanceQuote(q, userId, claimId, open(userId, own.rows[0].text_ct as string), stance, note));
}

/** A claim's stance history from the person's own confirmed quotes: what they said, by when they said it. */
export function historyFrom(claimId: string, claimText: string, quotes: readonly AppQuote[]): StanceLine[] {
  const out: StanceLine[] = [];
  for (const { record: q, createdAt } of quotes) {
    if (!("self" in q.speaker) || quoteStatus(q) !== "confirmed") continue;
    const live = liveTags(q).filter((t) => t.status === "confirmed");
    if (!live.some((t) => t.scheme === "claim" && t.value === claimId)) continue;
    const act = live.filter((t) => t.scheme === "act").at(-1)?.value;
    const said = act ? saidAsOf(act) : null;
    if (!said || said === "took-back") continue;
    const note = q.source.kind === "reflect" ? (q.text !== claimText ? q.text : undefined) : live.filter((t) => t.scheme === "note").at(-1)?.value;
    out.push({ stance: STANCE_OF[said], at: createdAt, ...(note ? { note } : {}) });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export async function listClaims(userId: string): Promise<ClaimOut[]> {
  const [claims, { quotes }] = await Promise.all([
    db().query("SELECT c.id, c.text_ct, c.holders_ct, c.subject_id, s.name_ct FROM learn_claim c LEFT JOIN learn_subject s ON s.id = c.subject_id WHERE c.user_id = $1 ORDER BY c.created_at", [userId]),
    loadQuotes(userId),
  ]);
  return claims.rows.map((c) => {
    const text = open(userId, c.text_ct as string);
    const history = historyFrom(c.id as string, text, quotes);
    return {
      id: c.id as string,
      text,
      holders: JSON.parse(open(userId, c.holders_ct as string)) as Holder[],
      subject: c.subject_id ? { id: c.subject_id as string, name: open(userId, c.name_ct as string) } : null,
      stance: currentStance(history),
      history,
    };
  });
}
