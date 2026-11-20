import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { filesQuotes, knownIds, readQuotesAndClaims, writeClaim, writeQuote } from "./files-quotes.ts";
import { filesChanges } from "./files-changes.ts";
import { filesJournal } from "./files-journal.ts";
import { filesPresentations } from "./files-presentations.ts";
import { runVaultAction, type VaultContext } from "./vault-actions.ts";
import { checkInstance, initInstance } from "./instance.ts";
import { addTag, appearances, appendOnlyProblems, claimProblems, claimView, liveTags, newClaimId, newQuote, newQuoteId, quoteProblems, quoteStatus, saidAsOf, SCHEMES, type ClaimRecord, type QuoteRecord, type VaultQuote } from "./quotes.ts";

const T1 = new Date("2026-03-02T10:00:00.000Z");
const T2 = new Date("2026-10-14T10:00:00.000Z");
const known = { quotes: new Set(["2026-03-02-1", "2026-10-14-1", "aristotle-1"]), claims: new Set(["marriage-is-a-covenant", "keep-the-sabbath"]) };

const claim: ClaimRecord = { text: "Marriage is a covenant.", created: T1.toISOString(), tags: [] };
const said = (text: string, act: string, at: Date, extra: Partial<QuoteRecord> = {}): QuoteRecord => {
  let q: QuoteRecord = { ...newQuote({ text, source: { kind: "journal", ref: "journal/x.md" }, said_at: at.toISOString().slice(0, 10) }, at), ...extra };
  q = addTag(q, { scheme: "claim", value: "marriage-is-a-covenant" }, at);
  return addTag(q, { scheme: "act", value: act }, at);
};

describe("quotes and their tags", () => {
  it("keeps a quote with tags as Web Annotations and checks each against its scheme", () => {
    const q = addTag(said("Marriage is a covenant, not a contract.", "asserting", T1), { scheme: "act", value: "asserting", selector: { exact: "a covenant", prefix: "Marriage is " } }, T1);
    expect(quoteProblems(q, "q", known)).toEqual([]);
    expect(q.tags.map((t) => [t.id, t.purpose, t.scheme])).toEqual([
      ["t1", "identifying", "claim"],
      ["t2", "classifying", "act"],
      ["t3", "classifying", "act"],
    ]);
    expect(q.tags[2]!.selector).toEqual({ type: "TextQuoteSelector", exact: "a covenant", prefix: "Marriage is " });
    expect(quoteProblems(addTag(q, { scheme: "act", value: "shouting" }, T1), "q")).toEqual([expect.stringMatching(/shouting is not in act/)]);
    expect(quoteProblems(addTag(q, { scheme: "domain", value: "line" }, T1), "q")).toEqual([expect.stringMatching(/a domain tag goes on a claim, not a quote/)]);
    expect(quoteProblems(addTag(q, { scheme: "claim", value: "no-such" }, T1), "q", known)).toEqual([expect.stringMatching(/no claim no-such/)]);
    expect(quoteProblems(addTag(q, { scheme: "relation", value: "supports" }, T1), "q")).toEqual([expect.stringMatching(/names what it points at/)]);
    expect(quoteProblems(addTag(q, { scheme: "act", value: "agreeing", selector: { exact: "a promise" } }, T1), "q")).toEqual([expect.stringMatching(/not in the quote's words/)]);
    expect(quoteProblems({ ...q, recorded_by: "guessed" }, "q")).toEqual([expect.stringMatching(/recorded_by/)]);
  });

  it("puts domain, kind and origin on the claim, and a practical claim names its ideal", () => {
    let c = addTag(claim, { scheme: "domain", value: "line" }, T1);
    c = addTag(c, { scheme: "origin", value: "reasoning" }, T1);
    expect(claimProblems(addTag(c, { scheme: "kind", value: "ideal" }, T1), "c", known)).toEqual([]);
    expect(claimProblems(addTag(c, { scheme: "kind", value: "practical" }, T1), "c", known)).toEqual([expect.stringMatching(/names the ideal it serves/)]);
    expect(claimProblems(addTag(c, { scheme: "kind", value: "practical", object: "keep-the-sabbath" }, T1), "c", known)).toEqual([]);
    expect(claimProblems(addTag(c, { scheme: "act", value: "asserting" }, T1), "c")).toEqual([expect.stringMatching(/an act tag goes on a quote/)]);
  });

  it("counts an assistant's tag and a noticed quote only once the person confirms them, and withdraws without deleting", () => {
    let q = newQuote({ text: "I keep the sabbath.", source: { kind: "conversation", ref: "chat-12" }, recorded_by: "conversation" }, T1);
    expect(quoteStatus(q)).toBe("proposed");
    q = addTag(q, { scheme: "claim", value: "keep-the-sabbath", creator: "assistant" }, T1);
    expect(liveTags(q).map((t) => t.status)).toEqual(["proposed"]);
    q = addTag(q, { scheme: "status", value: "confirmed", object: "t1" }, T1);
    q = addTag(q, { scheme: "status", value: "confirmed" }, T1);
    expect(quoteStatus(q)).toBe("confirmed");
    expect(liveTags(q).map((t) => [t.id, t.status])).toEqual([["t1", "confirmed"]]);
    expect(quoteProblems(addTag(q, { scheme: "status", value: "confirmed", object: "t1", creator: "assistant" }, T1), "q")).toEqual([expect.stringMatching(/only the person confirms/)]);
    expect(quoteProblems(addTag(q, { scheme: "status", value: "withdrawn", object: "t9" }, T1), "q")).toEqual([expect.stringMatching(/not an earlier tag/)]);
    const gone = addTag(q, { scheme: "status", value: "withdrawn", object: "t1" }, T1);
    expect(liveTags(gone)).toEqual([]);
    expect(gone.tags).toHaveLength(4);
    expect(quoteStatus(addTag(q, { scheme: "status", value: "withdrawn" }, T1))).toBe("withdrawn");
  });

  it("shows what the person said about a claim over time, never what they believe, with others apart", () => {
    const quotes: VaultQuote[] = [
      { id: "2026-10-14-1", record: said("I no longer think marriage is only a covenant.", "retracting", T2) },
      { id: "2026-03-02-1", record: said("Marriage is a covenant, not a contract.", "asserting", T1) },
      { id: "aristotle-1", record: said("Marriage is a covenant.", "asserting", T1, { speaker: { name: "A friend" }, source: { kind: "talk" } }) },
      { id: "proposed-1", record: said("Marriage is a covenant.", "asserting", T2, { recorded_by: "noticed" }) },
    ];
    const v = claimView("marriage-is-a-covenant", claim, quotes);
    expect(v.mine.map((s) => [s.quote, s.said])).toEqual([
      ["2026-03-02-1", "said-so"],
      ["2026-10-14-1", "took-back"],
    ]);
    expect(v.now?.said).toBe("took-back");
    expect(v.others.map((s) => s.speaker)).toEqual(["A friend"]);
    expect(appearances("marriage-is-a-covenant", quotes).map((q) => q.id)).toEqual(["2026-03-02-1", "aristotle-1", "2026-10-14-1"]);
    expect(saidAsOf("disagreeing")).toBe("said-not");
    expect(saidAsOf("pure-questioning")).toBe("asked");
    expect(saidAsOf("none")).toBeNull();
  });

  it("only adds tags: words never change and old tags stay", () => {
    const q = said("Marriage is a covenant.", "asserting", T1);
    expect(appendOnlyProblems(q, addTag(q, { scheme: "note", value: "said at dinner" }, T1), "q")).toEqual([]);
    expect(appendOnlyProblems(q, { ...q, text: "Marriage is a contract." }, "q")).toEqual([expect.stringMatching(/never change/)]);
    expect(appendOnlyProblems(q, { ...q, tags: q.tags.slice(1) }, "q")).toEqual([expect.stringMatching(/only added/)]);
  });

  it("makes ids from the day and the wording", () => {
    expect(newQuoteId("2026-11-20", new Set(["2026-11-20-1"]))).toBe("2026-11-20-2");
    expect(newClaimId("Marriage is a covenant.", new Set())).toBe("marriage-is-a-covenant");
    expect(newClaimId("Marriage is a covenant!", new Set(["marriage-is-a-covenant"]))).toBe("marriage-is-a-covenant-2");
    expect(newClaimId("¿?", new Set())).toBe("claim");
  });

  it("names a source for every scheme", () => {
    for (const s of SCHEMES) expect(s.source.length).toBeGreaterThan(3);
  });
});

const ran = async (...a: Parameters<typeof runVaultAction>) => {
  const r = await runVaultAction(...a);
  if (r.held) throw new Error("held");
  return r;
};

describe("quotes and claims in a vault", () => {
  const dirs: string[] = [];
  afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it("writes quotes/ and claims/, refuses a dangling claim tag or a rewrite, and checks the folders", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reflect-quotes-"));
    dirs.push(dir);
    await initInstance(dir, "Tester");
    await writeClaim(dir, "marriage-is-a-covenant", claim, await knownIds(dir), T1);
    const q = said("Marriage is a covenant, not a contract.", "asserting", T1);
    expect(await writeQuote(dir, "2026-03-02-1", q, await knownIds(dir), T1)).toEqual({ path: "quotes/2026-03-02-1.json" });
    await expect(writeQuote(dir, "2026-03-02-1", { ...q, text: "Changed." }, await knownIds(dir), T1)).rejects.toThrow(/never change/);
    await writeQuote(dir, "2026-03-02-1", addTag(q, { scheme: "note", value: "at dinner" }, T2), await knownIds(dir), T2);
    await expect(writeQuote(dir, "x-1", addTag(newQuote({ text: "Hi", source: { kind: "other" } }, T1), { scheme: "claim", value: "nope" }, T1), await knownIds(dir), T1)).rejects.toThrow(/no claim nope/);
    const read = await readQuotesAndClaims(dir);
    expect(read.problems).toEqual([]);
    expect(read.quotes.map((x) => x.id)).toEqual(["2026-03-02-1"]);
    expect(read.claims.map((x) => x.id)).toEqual(["marriage-is-a-covenant"]);
    expect((await readFile(join(dir, "memory.jsonl"), "utf8")).match(/quotes\/2026-03-02-1\.json/g)).toHaveLength(2);
    let r = await checkInstance(dir);
    expect(r.problems).toEqual([]);
    await mkdir(join(dir, "quotes"), { recursive: true });
    await writeFile(join(dir, "quotes", "Bad Name.json"), "{}");
    await writeFile(join(dir, "quotes", "orphan.json"), JSON.stringify(addTag(newQuote({ text: "x", source: { kind: "other" } }, T1), { scheme: "claim", value: "gone" }, T1)));
    r = await checkInstance(dir);
    expect(r.problems).toEqual(["quotes/Bad Name.json: a quote is one file, quotes/<id>.json, with a lowercase id", "quotes/orphan.json: tag t1: no claim gone in claims/"]);
  });

  it("offers keep_quote, tag_quote and read_quotes: an assistant's quote and tags come in proposed, and it never confirms", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reflect-quote-actions-"));
    dirs.push(dir);
    const c = await initInstance(dir, "Tester");
    const ctx: VaultContext = { userId: c.person, journal: filesJournal(dir, c.person, { layout: "vault" }), changes: filesChanges(dir), presentations: filesPresentations(dir, c.person), quotes: filesQuotes(dir), now: T1 };
    const kept = (await ran(ctx, "keep_quote", { text: "I keep the sabbath.", source: "conversation", claim: "Keep the sabbath.", act: "asserting" }, "mcp")).result as { quote: string; claim: string };
    expect(kept).toMatchObject({ quote: "2026-03-02-1", claim: "keep-the-sabbath", madeClaim: true });
    let view = (await ran(ctx, "read_quotes", {}, "mcp")).result as { quotes: { status: string; tags: { status: string }[] }[] };
    expect(view.quotes[0]!.status).toBe("proposed");
    expect(view.quotes[0]!.tags.map((t) => t.status)).toEqual(["proposed", "proposed"]);
    await expect(runVaultAction(ctx, "tag_quote", { id: kept.quote, scheme: "status", value: "confirmed" }, "mcp")).rejects.toThrow(/only the person/);
    await runVaultAction(ctx, "tag_quote", { id: kept.claim, scheme: "domain", value: "household" }, "mcp");
    await runVaultAction(ctx, "tag_quote", { id: kept.quote, scheme: "status", value: "confirmed" }, "cli");
    await runVaultAction(ctx, "tag_quote", { id: kept.quote, scheme: "status", value: "confirmed", object: "t1" }, "cli");
    await runVaultAction(ctx, "tag_quote", { id: kept.quote, scheme: "status", value: "confirmed", object: "t2" }, "cli");
    const said = (await ran(ctx, "read_quotes", { claim: "keep-the-sabbath" }, "mcp")).result as { now: { said: string }; tags: { scheme: string; status: string }[] };
    expect(said.now.said).toBe("said-so");
    expect(said.tags).toEqual([{ id: "t1", scheme: "domain", value: "household", status: "proposed" }]);
  });
});
