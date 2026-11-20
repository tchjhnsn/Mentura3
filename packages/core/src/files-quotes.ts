// Quotes and claims in a vault folder (./quotes.ts): `quotes/<id>.json` and `claims/<id>.json`, each holding its own
// tags. Reading checks every file and the references between them (a claim tag names a claim that exists; a relation
// names a quote or claim that exists). Writing checks the record first and logs it in memory.jsonl.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { readRecord, writeRecord } from "./record-io.ts";
import { addTag, appendOnlyProblems, CLAIMS_DIR, claimPath, claimProblems, newClaimId, newQuote, newQuoteId, QUOTES_DIR, quotePath, quoteProblems, recordOfPath, type ClaimRecord, type Known, type NewTag, type QuoteRecord, type QuoteSourceKind, type TagCreator, type VaultClaim, type VaultQuote } from "./quotes.ts";

async function filesIn(root: string, dir: string): Promise<string[]> {
  try {
    return (await readdir(join(root, dir), { withFileTypes: true }))
      .map((n) => (n.isDirectory() ? `${dir}/${n.name}/` : `${dir}/${n.name}`))
      .sort();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function readJson(root: string, rel: string, problems: string[]): Promise<unknown> {
  try {
    return JSON.parse((await readRecord(root, rel)) ?? "");
  } catch {
    problems.push(`${rel} is not JSON`);
    return undefined;
  }
}

/** Every quote and claim in the vault, with the problems of any that fail, references between them included. */
export async function readQuotesAndClaims(root: string): Promise<{ quotes: VaultQuote[]; claims: VaultClaim[]; problems: string[] }> {
  const problems: string[] = [];
  const raw: { dir: "quotes" | "claims"; id: string; rel: string; value: unknown }[] = [];
  for (const dir of [QUOTES_DIR, CLAIMS_DIR] as const) {
    for (const rel of await filesIn(root, dir)) {
      if (rel.endsWith(".md") || rel.endsWith(".draft.json")) continue;
      const r = recordOfPath(rel);
      if (!r) {
        problems.push(`${rel}: a ${dir === "quotes" ? "quote" : "claim"} is one file, ${dir}/<id>.json, with a lowercase id`);
        continue;
      }
      const value = await readJson(root, rel, problems);
      if (value !== undefined) raw.push({ ...r, rel, value });
    }
  }
  const known: Known = { quotes: new Set(raw.filter((r) => r.dir === "quotes").map((r) => r.id)), claims: new Set(raw.filter((r) => r.dir === "claims").map((r) => r.id)) };
  const quotes: VaultQuote[] = [];
  const claims: VaultClaim[] = [];
  for (const r of raw) {
    const p = r.dir === "quotes" ? quoteProblems(r.value, r.rel, known) : claimProblems(r.value, r.rel, known);
    if (p.length) problems.push(...p);
    else if (r.dir === "quotes") quotes.push({ id: r.id, record: r.value as QuoteRecord });
    else claims.push({ id: r.id, record: r.value as ClaimRecord });
  }
  return { quotes, claims, problems };
}

/** Write one quote, logged in memory.jsonl, after its check passes against the vault's claims and quotes. A rewrite only adds tags. */
export async function writeQuote(root: string, id: string, record: QuoteRecord, known?: Known, now = new Date()): Promise<{ path: string }> {
  const path = quotePath(id);
  const old = await readRecord(root, path);
  const p = [...quoteProblems(record, path, known), ...(old === null ? [] : appendOnlyProblems(JSON.parse(old), record, path))];
  if (p.length) throw new Error(p.join("; "));
  await writeRecord(root, path, `${JSON.stringify(record, null, 2)}\n`, old === null ? "create" : "append", now.toISOString());
  return { path };
}

/** Write one claim, logged in memory.jsonl, after its check passes. A rewrite only adds tags. */
export async function writeClaim(root: string, id: string, record: ClaimRecord, known?: Known, now = new Date()): Promise<{ path: string }> {
  const path = claimPath(id);
  const old = await readRecord(root, path);
  const p = [...claimProblems(record, path, known), ...(old === null ? [] : appendOnlyProblems(JSON.parse(old), record, path))];
  if (p.length) throw new Error(p.join("; "));
  await writeRecord(root, path, `${JSON.stringify(record, null, 2)}\n`, old === null ? "create" : "append", now.toISOString());
  return { path };
}

/** The ids a write is checked against. */
export async function knownIds(root: string): Promise<Known> {
  const ids = async (dir: string) => new Set((await filesIn(root, dir)).map(recordOfPath).filter((r) => r !== null).map((r) => r.id));
  return { quotes: await ids(QUOTES_DIR), claims: await ids(CLAIMS_DIR) };
}

/** What a new quote says, as the CLI and the keep_quote action take it. `claim` is a claim's id or a new wording. */
export type KeepQuote = {
  text: string;
  speaker?: string;
  source?: QuoteSourceKind;
  ref?: string;
  title?: string;
  locator?: string;
  said_at?: string;
  claim?: string;
  act?: string;
};

/**
 * A vault's quotes/ and claims/ folders, for the CLI and the actions. The person's own writes are stated and their
 * tags count at once; an assistant's (`by: "assistant"`) come in proposed until the person confirms them, and an
 * assistant never confirms or withdraws.
 */
export function filesQuotes(root: string) {
  return {
    read: () => readQuotesAndClaims(root),
    async keep(k: KeepQuote, by: TagCreator, now = new Date()): Promise<{ quote: string; path: string; claim?: string; madeClaim: boolean }> {
      const known = await knownIds(root);
      let q = newQuote(
        {
          text: k.text,
          ...(k.speaker?.trim() ? { speaker: { name: k.speaker.trim() } } : {}),
          source: { kind: k.source ?? "journal", ...(k.ref ? { ref: k.ref } : {}), ...(k.title ? { title: k.title } : {}), ...(k.locator ? { locator: k.locator } : {}) },
          ...(k.said_at ? { said_at: k.said_at } : {}),
          recorded_by: by === "person" ? "stated" : "conversation",
        },
        now,
      );
      let claim: string | undefined;
      let madeClaim = false;
      if (k.claim?.trim()) {
        claim = known.claims.has(k.claim.trim()) ? k.claim.trim() : newClaimId(k.claim, known.claims);
        if (!known.claims.has(claim)) {
          await writeClaim(root, claim, { text: k.claim.trim(), created: now.toISOString(), tags: [] }, known, now);
          known.claims = new Set([...known.claims, claim]);
          madeClaim = true;
        }
        q = addTag(q, { scheme: "claim", value: claim, creator: by }, now);
      }
      if (k.act?.trim()) q = addTag(q, { scheme: "act", value: k.act.trim(), creator: by }, now);
      const quote = newQuoteId(q.said_at ?? now.toISOString().slice(0, 10), known.quotes);
      const w = await writeQuote(root, quote, q, known, now);
      return { quote, path: w.path, ...(claim ? { claim } : {}), madeClaim };
    },
    async tag(id: string, t: NewTag, now = new Date()): Promise<{ path: string; tag: string }> {
      if (t.scheme === "status" && t.creator === "assistant") throw new Error("only the person confirms or withdraws");
      const { quotes, claims, problems } = await readQuotesAndClaims(root);
      const q = quotes.find((x) => x.id === id);
      const c = claims.find((x) => x.id === id);
      if (!q && !c) throw new Error(`no quote or claim ${id}${problems.length ? `; problems: ${problems.join("; ")}` : ""}`);
      const known = await knownIds(root);
      const next = addTag(q ? q.record : c!.record, t, now);
      const w = q ? await writeQuote(root, id, next as QuoteRecord, known, now) : await writeClaim(root, id, next as ClaimRecord, known, now);
      return { path: w.path, tag: next.tags.at(-1)!.id };
    },
  };
}
export type QuotesFolder = ReturnType<typeof filesQuotes>;
