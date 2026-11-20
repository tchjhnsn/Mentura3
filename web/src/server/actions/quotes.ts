// Quotes and their tags as the app's actions (docs/design/REFLECT_QUOTES_2026-11-20.md). Declared in the core
// (@reflect/core/vault-actions), which a vault's CLI and MCP server run too; here they get zod inputs and the app's
// Postgres (../quotes-store). A quote or tag the person makes on a page is theirs; one a model makes in the chat or
// over MCP comes in proposed until the person confirms it, and a model never confirms or withdraws.
import { z } from "zod";
import { claimView, liveTags, QUOTE_SOURCE_KINDS, quoteStatus, SCHEME_IDS, type QuoteSourceKind, type TagCreator } from "@reflect/core/quotes";
import { KEEP_QUOTE, READ_QUOTES, TAG_QUOTE } from "@reflect/core/vault-actions";
import { claimFor } from "../claims-store";
import { tx } from "../learn-store";
import { insertQuote, insertTag, loadQuotes } from "../quotes-store";
import { action } from "./types";

const creatorOf = (origin: string | undefined): TagCreator => (origin === "page" ? "person" : "assistant");
const isId = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const SOURCES = QUOTE_SOURCE_KINDS.map((k) => k.id) as [QuoteSourceKind, ...QuoteSourceKind[]];

export const keepQuoteAction = action({
  ...KEEP_QUOTE,
  input: z.object({
    text: z.string().min(1).max(20000).describe("the exact words"),
    speaker: z.string().min(1).max(200).optional().describe("who said it, when not the person"),
    source: z.enum(SOURCES).optional().describe("where it was said; journal when left out"),
    ref: z.string().min(1).max(500).optional().describe("the source record or work, such as a journal file or a book"),
    title: z.string().min(1).max(300).optional().describe("the source's title"),
    locator: z.string().min(1).max(200).optional().describe("the place in the source: page, paragraph, timestamp"),
    said_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("when it was said, YYYY-MM-DD"),
    claim: z.string().min(1).max(2000).optional().describe("what it says: an existing claim's id, or a short wording for a new claim"),
    act: z.string().min(1).max(40).optional().describe("what the words do: asserting, agreeing, disagreeing, pure-questioning, assertive-questioning, rhetorical-questioning, challenging, restating, retracting, none"),
  }),
  run: async ({ userId, origin }, input) => {
    const by = creatorOf(origin);
    return tx(async (q) => {
      const quote = await insertQuote(q, userId, { text: input.text, speaker: input.speaker, source: input.source ?? "journal", ref: input.ref, title: input.title, locator: input.locator, saidAt: input.said_at, recordedBy: by === "person" ? "stated" : "conversation" });
      let claim: string | undefined;
      if (input.claim?.trim()) {
        claim = isId(input.claim.trim()) ? input.claim.trim() : await claimFor(q, userId, input.claim);
        await insertTag(q, userId, { quote }, { scheme: "claim", value: claim, creator: by });
      }
      if (input.act?.trim()) await insertTag(q, userId, { quote }, { scheme: "act", value: input.act.trim(), creator: by });
      return { quote, ...(claim ? { claim } : {}) };
    });
  },
  change: (r) => ({ after: r }),
});

export const tagQuoteAction = action({
  ...TAG_QUOTE,
  input: z.object({
    id: z.string().min(1).max(60).describe("the quote's or claim's id"),
    scheme: z.enum(SCHEME_IDS).describe("the vocabulary: act, claim, relation, subject, domain, kind, origin, note (status is the person's)"),
    value: z.string().min(1).max(2000).describe("a concept of the scheme, a claim's id for a claim tag, or the note's words"),
    object: z.string().min(1).max(60).optional().describe("for relation, the quote or claim it bears on; for kind practical, the ideal it serves"),
    exact: z.string().min(1).max(2000).optional().describe("the exact words of the quote the tag is about; left out, the whole quote"),
    prefix: z.string().max(200).optional().describe("the words just before exact"),
    suffix: z.string().max(200).optional().describe("the words just after exact"),
  }),
  run: async ({ userId, origin }, { id, scheme, value, object, exact, prefix, suffix }) => {
    const by = creatorOf(origin);
    if (scheme === "status" && by !== "person") throw new Error("only the person confirms or withdraws");
    return tx(async (q) => {
      const isQuote = Boolean((await q.query("SELECT 1 FROM quote WHERE id = $1 AND user_id = $2", [id, userId]).catch(() => ({ rows: [] }))).rows[0]);
      await insertTag(q, userId, isQuote ? { quote: id } : { claim: id }, { scheme, value, creator: by, ...(object ? { object } : {}), ...(exact ? { selector: { exact, ...(prefix ? { prefix } : {}), ...(suffix ? { suffix } : {}) } } : {}) });
      return { id, scheme, value };
    });
  },
  change: (r) => ({ after: r }),
});

export const readQuotesAction = action({
  ...READ_QUOTES,
  input: z.object({ claim: z.string().min(1).max(60).optional().describe("a claim's id, for what the person said about it") }),
  run: async ({ userId }, { claim }) => {
    const { quotes, claims } = await loadQuotes(userId);
    const tagsOut = (r: { tags: Parameters<typeof liveTags>[0]["tags"] }) => liveTags(r).map(({ id, scheme, value, object, status }) => ({ id, scheme, value, ...(object ? { object } : {}), status }));
    if (claim) {
      const c = claims.find((x) => x.id === claim);
      if (!c) throw new Error("no such claim");
      return { ...claimView(c.id, c.record, quotes), tags: tagsOut(c.record) };
    }
    return {
      quotes: quotes.map(({ id, record: q }) => ({ id, text: q.text, speaker: "self" in q.speaker ? "the person" : q.speaker.name, source: q.source, said_at: q.said_at ?? null, status: quoteStatus(q), tags: tagsOut(q) })),
      claims: claims.map(({ id, record }) => ({ id, text: record.text })),
      problems: [] as string[],
    };
  },
});
