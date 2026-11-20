import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { claimView } from "@reflect/core/quotes";
import { seal, tag } from "./crypto";
import { beliefs, claimWorks } from "./book-store";
import { listClaims, setStance } from "./claims-store";
import { insertQuote, insertTag, loadQuotes, resetBackfilled } from "./quotes-store";

const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

async function newUser(name: string): Promise<string> {
  const id = randomUUID();
  await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [id, name, `${id}@example.test`]);
  return id;
}

describe.skipIf(!live)("quotes on Neon", () => {
  afterAll(() => db().end());

  it("turns the older claim tables into quotes and tags once, in order, and reads the book from them", async () => {
    const user = await newUser("Quote Backfill");
    const claim = randomUUID();
    const ideal = randomUUID();
    const work = randomUUID();
    const at = (m: number) => new Date(Date.UTC(2026, 2, 1, 10, m)).toISOString();
    for (const [id, text] of [[claim, "We both work part time."], [ideal, "Children are best raised by both parents."]] as const)
      await db().query("INSERT INTO learn_claim (id, user_id, text_tag, text_ct, holders_ct, created_at) VALUES ($1, $2, $3, $4, $5, $6)", [id, user, tag(user, text.toLowerCase()), seal(user, text), seal(user, "[]"), at(0)]);
    await db().query("INSERT INTO work (id, user_id, kind, template) VALUES ($1, $2, 'entry', 'blank')", [work, user]);
    await db().query("INSERT INTO work_version (work_id, seq, title_ct, body_ct) VALUES ($1, 0, $2, $3)", [work, seal(user, "Thursday"), seal(user, "We both work part time.")]);
    await db().query("INSERT INTO learn_claim_stance (id, user_id, claim_id, stance, note_ct, created_at) VALUES ($1, $2, $3, 'belief', NULL, $4), ($5, $2, $3, 'suspension', $6, $7), ($8, $2, $9, 'belief', NULL, $4)", [randomUUID(), user, claim, at(1), randomUUID(), seal(user, "not sure now"), at(5), randomUUID(), ideal]);
    await db().query("INSERT INTO claim_source (id, user_id, claim_id, work_id, passage_ct, created_at) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), user, claim, work, seal(user, "We both work part time."), at(2)]);
    await db().query("INSERT INTO claim_domain (id, user_id, claim_id, domain, created_at) VALUES ($1, $2, $3, 'household', $4), ($5, $2, $3, 'line', $6), ($7, $2, $8, 'line', $4)", [randomUUID(), user, claim, at(2), randomUUID(), at(3), randomUUID(), ideal]);
    await db().query("INSERT INTO claim_kind (id, user_id, claim_id, kind, created_at) VALUES ($1, $2, $3, 'ideal', $4)", [randomUUID(), user, ideal, at(2)]);
    await db().query("INSERT INTO claim_kind (id, user_id, claim_id, kind, serves_claim_id, circumstances_ct, created_at) VALUES ($1, $2, $3, 'practical', $4, $5, $6)", [randomUUID(), user, claim, ideal, seal(user, "while the baby is under one"), at(3)]);
    await db().query("INSERT INTO claim_origin (id, user_id, claim_id, origins, created_at) VALUES ($1, $2, $3, $4, $5), ($6, $2, $3, $7, $8)", [randomUUID(), user, claim, ["nature"], at(3), randomUUID(), ["compulsion", "anger"], at(4)]);

    const [c] = (await listClaims(user)).filter((x) => x.id === claim);
    expect(c!.history.map((h) => [h.stance, h.note ?? null])).toEqual([["belief", null], ["suspension", "not sure now"]]);
    const b = (await beliefs(user)).find((x) => x.id === claim)!;
    expect(b).toMatchObject({ domain: "line", kind: "practical", serves: { id: ideal }, circumstances: "while the baby is under one", origins: ["compulsion", "spirit"], source: { workId: work } });
    expect((await claimWorks(user)).get(claim)?.workId).toBe(work);

    const count = async () => Number((await db().query("SELECT (SELECT count(*) FROM quote WHERE user_id = $1) + (SELECT count(*) FROM quote_tag WHERE user_id = $1) AS n", [user])).rows[0].n);
    const before = await count();
    resetBackfilled();
    await loadQuotes(user);
    expect(await count()).toBe(before);

    // A new stance is a quote, and the view shows what was said, oldest first.
    await setStance(user, claim, "disbelief", "we changed our minds");
    const { quotes, claims } = await loadQuotes(user);
    const v = claimView(claim, claims.find((x) => x.id === claim)!.record, quotes);
    expect(v.mine.map((s) => s.said)).toEqual(["said-so", null, "asked", "said-not"]);
    await expect(db().query("UPDATE quote SET said_at = now() WHERE user_id = $1", [user])).rejects.toThrow(/append-only/);
    const stored = (await db().query("SELECT text_ct FROM quote WHERE user_id = $1", [user])).rows.map((r) => r.text_ct as string).join(" ");
    expect(stored).not.toContain("changed");
  }, 30_000);

  it("refuses a tag the core refuses, and counts an assistant's tag only once the person confirms it", async () => {
    const user = await newUser("Quote Tags");
    const quote = await db().connect().then(async (c) => {
      try {
        return await insertQuote(c, user, { text: "I keep the sabbath.", source: "conversation", recordedBy: "conversation" });
      } finally {
        c.release();
      }
    });
    await expect(insertTag(db(), user, { quote }, { scheme: "domain", value: "line" })).rejects.toThrow(/goes on a claim/);
    await insertTag(db(), user, { quote }, { scheme: "act", value: "asserting", creator: "assistant" });
    await expect(insertTag(db(), user, { quote }, { scheme: "status", value: "confirmed", object: "t1", creator: "assistant" })).rejects.toThrow(/only the person/);
    await insertTag(db(), user, { quote }, { scheme: "status", value: "confirmed", object: "t1" });
    const [q] = (await loadQuotes(user)).quotes;
    expect(q!.record.tags.map((t) => [t.id, t.scheme, t.creator])).toEqual([["t1", "act", "assistant"], ["t2", "status", "person"]]);
  });
});
