import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { canCheckIn, connectWith, hashToken, hereState, lapsesAt, newToken, tokenShaped, type ConnectTx, type OpenRequest } from "./connect";

// Check in and Connect (doc "Events and connections design guide", 2026-11-18): the rules over an in-memory stand-in
// for one transaction's rows.
type Row = OpenRequest & { expiresAt: Date; acceptedAt: Date | null };
function memoryTx() {
  const requests: Row[] = [];
  const links = new Map<string, string | null>();
  const kinds = new Map<string, string>();
  let n = 0;
  const tx: ConnectTx = {
    async openRequest(from, to, now) {
      for (let i = requests.length - 1; i >= 0; i--) {
        const r = requests[i]!;
        if (r.from === from && r.to === to && !r.acceptedAt && r.expiresAt <= now) requests.splice(i, 1);
      }
      return requests.find((r) => r.from === from && r.to === to && !r.acceptedAt) ?? null;
    },
    async insertRequest({ from, to, eventId, expiresAt }) {
      const r: Row = { id: `r${++n}`, from, to, eventId, expiresAt, acceptedAt: null };
      requests.push(r);
      return r;
    },
    async accept(ids, now) {
      for (const r of requests) if (ids.includes(r.id) && !r.acceptedAt) r.acceptedAt = now;
    },
    async link(a, b, met) {
      expect(a < b).toBe(true);
      const k = `${a}|${b}`;
      links.set(k, links.get(k) ?? met);
    },
    async kindIfMissing(u, o, kind) {
      if (!kinds.has(`${u}>${o}`)) kinds.set(`${u}>${o}`, kind);
    },
  };
  return { tx, requests, links, kinds };
}

const NOW = new Date("2026-11-20T01:00:00Z");
const EV = "e1";

describe("Connect is mutual", () => {
  it("keeps one tap as a request that shows nothing else", async () => {
    const m = memoryTx();
    const r = await connectWith(m.tx, "bo", "ann", EV, NOW);
    expect(r.state).toBe("requested");
    expect(m.requests).toHaveLength(1);
    expect(m.requests[0]!.expiresAt).toEqual(lapsesAt(NOW));
    expect(m.links.size).toBe(0);
    expect(m.kinds.size).toBe(0);
    // A second tap by the same person makes no second request.
    expect(await connectWith(m.tx, "bo", "ann", EV, NOW)).toEqual({ state: "requested", requestId: r.requestId });
    expect(m.requests).toHaveLength(1);
  });

  it("accepts both when the other person already asked, links the pair in order with the event, and starts both as utility", async () => {
    const m = memoryTx();
    await connectWith(m.tx, "bo", "ann", EV, NOW);
    const r = await connectWith(m.tx, "ann", "bo", EV, new Date(NOW.getTime() + 60_000));
    expect(r.state).toBe("connected");
    expect(m.requests.every((q) => q.acceptedAt)).toBe(true);
    expect([...m.links]).toEqual([["ann|bo", EV]]);
    expect(Object.fromEntries(m.kinds)).toEqual({ "ann>bo": "utility", "bo>ann": "utility" });
  });

  it("keeps a kind already chosen and the event a pair first met at", async () => {
    const m = memoryTx();
    m.links.set("ann|bo", "first");
    m.kinds.set("ann>bo", "good");
    await connectWith(m.tx, "ann", "bo", "second", NOW);
    await connectWith(m.tx, "bo", "ann", "second", NOW);
    expect(m.links.get("ann|bo")).toBe("first");
    expect(m.kinds.get("ann>bo")).toBe("good");
    expect(m.kinds.get("bo>ann")).toBe("utility");
  });

  it("lets a request lapse after CONNECT_DAYS, so a late tap is only a request again", async () => {
    const m = memoryTx();
    await connectWith(m.tx, "bo", "ann", EV, NOW);
    const late = new Date(NOW.getTime() + 8 * 24 * 60 * 60 * 1000);
    const r = await connectWith(m.tx, "ann", "bo", EV, late);
    expect(r.state).toBe("requested");
    expect(m.links.size).toBe(0);
    expect(m.requests.map((q) => q.from)).toEqual(["ann"]);
  });

  it("refuses connecting with yourself", async () => {
    await expect(connectWith(memoryTx().tx, "ann", "ann", EV, NOW)).rejects.toThrow("That is you");
  });
});

describe("tokens", () => {
  it("keeps only the sha256 hex of a random token", () => {
    const { token, hash } = newToken();
    expect(tokenShaped(token)).toBe(true);
    expect(hash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(hash);
    expect(newToken().token).not.toBe(token);
  });

  it("refuses strings that cannot be a token before looking them up", () => {
    for (const t of [undefined, "", "short", "has spaces in it at all ok", "x".repeat(65), "a/b".repeat(10)]) expect(tokenShaped(t)).toBe(false);
  });
});

describe("who sees Here, and when", () => {
  const H = 60 * 60 * 1000;
  const start = Date.parse("2026-11-20T00:00:00Z");
  const e = { startsAt: new Date(start).toISOString(), endsAt: new Date(start + 3 * H).toISOString() };
  const at = (ms: number) => new Date(start + ms);

  it("shows nothing to someone not checked in", () => {
    expect(hereState(e, false, at(H))).toBe("closed");
  });

  it("opens an hour before the start and while the event runs, then shows only Connected tonight for two hours", () => {
    expect(hereState(e, true, at(-2 * H))).toBe("closed");
    expect(hereState(e, true, at(-H))).toBe("open");
    expect(hereState(e, true, at(2 * H))).toBe("open");
    expect(hereState(e, true, at(3 * H + 1))).toBe("ended");
    expect(hereState(e, true, at(5 * H))).toBe("ended");
    expect(hereState(e, true, at(5 * H + 1))).toBe("closed");
  });

  it("reads an event with no end as six hours long, and one with no start as closed", () => {
    const open = { startsAt: e.startsAt, endsAt: null };
    expect(hereState(open, true, at(6 * H))).toBe("open");
    expect(hereState(open, true, at(7 * H))).toBe("ended");
    expect(hereState(open, true, at(9 * H))).toBe("closed");
    expect(hereState({ startsAt: null, endsAt: null }, true, at(0))).toBe("closed");
  });

  it("checks in only at a published Reflect event while it runs; an Eddy event has no door", () => {
    expect(canCheckIn({ ...e, source: "reflect", status: "published" }, at(H))).toBe(true);
    expect(canCheckIn({ ...e, source: "eddy", status: "published" }, at(H))).toBe(false);
    expect(canCheckIn({ ...e, source: "reflect", status: "draft" }, at(H))).toBe(false);
    expect(canCheckIn({ ...e, source: "reflect", status: "published" }, at(4 * H))).toBe(false);
  });
});
