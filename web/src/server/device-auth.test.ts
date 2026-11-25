import { describe, expect, it } from "vitest";
import {
  approveDeviceCode,
  cliTokens,
  codeReply,
  createDeviceCode,
  denyDeviceCode,
  DEVICE_CODE_SECONDS,
  exchangeDeviceCode,
  hashSecret,
  memoryDeviceAuthStore,
  normalizeUserCode,
  POLL_SECONDS,
  readCodeRequest,
  readTokenRequest,
  revokeCliToken,
  showUserCode,
  tokenReply,
  verifyCliToken,
  waitingCode,
} from "./device-auth";

// Device sign-in for the Naive command line (RFC 8628; offline sync, EE-174) over the store in memory: no Postgres.
// Each test drives the same calls the route handlers and /device make, with its own clock.
const T0 = new Date("2026-11-25T10:00:00Z");
const later = (seconds: number) => new Date(T0.getTime() + seconds * 1000);

/** A sign-in asked for by the command line, ready for the person's tap. */
async function asked(business: string | null = "founder-raise") {
  const store = memoryDeviceAuthStore();
  const issued = await createDeviceCode({ business, client: "naive-cli" }, { store, now: T0 });
  return { store, issued, at: (seconds: number) => ({ store, now: later(seconds) }) };
}

describe("asking for a code", () => {
  it("gives the command line a device code and the person a code to read out", async () => {
    const { issued } = await asked();
    expect(issued.userCode).toMatch(/^[BCDFGHJKLMNPQRSTVWXZ]{8}$/);
    expect(showUserCode(issued.userCode)).toMatch(/^[BCDFGHJKLMNPQRSTVWXZ]{4}-[BCDFGHJKLMNPQRSTVWXZ]{4}$/);
    expect(issued.deviceCode).not.toBe(issued.userCode);
    expect(issued.expiresIn).toBe(DEVICE_CODE_SECONDS);
    expect(issued.interval).toBe(POLL_SECONDS);
  });

  it("keeps the device code only as its sha256, so the row signs nobody in", async () => {
    const { store, issued } = await asked();
    const row = store.codes[0]!;
    expect(JSON.stringify(row)).not.toContain(issued.deviceCode);
    expect(await store.codeByDeviceHash(hashSecret(issued.deviceCode))).not.toBeNull();
    expect(row.state).toBe("pending");
  });

  it("gives every sign-in its own pair of codes", async () => {
    const store = memoryDeviceAuthStore();
    const a = await createDeviceCode({ business: null, client: "naive-cli" }, { store, now: T0 });
    const b = await createDeviceCode({ business: null, client: "naive-cli" }, { store, now: T0 });
    expect(a.userCode).not.toBe(b.userCode);
    expect(a.deviceCode).not.toBe(b.deviceCode);
    expect(store.codes).toHaveLength(2);
  });
});

describe("the page the person opens", () => {
  it("finds a waiting code typed with or without its dash, in either case", async () => {
    const { store, issued } = await asked();
    const opts = { store, now: later(30) };
    for (const typed of [issued.userCode, showUserCode(issued.userCode), showUserCode(issued.userCode).toLowerCase(), ` ${showUserCode(issued.userCode)} `]) {
      expect(await waitingCode(typed, opts), typed).toEqual({ userCode: issued.userCode, client: "naive-cli", business: "founder-raise" });
    }
  });

  it("finds nothing for a code that is unknown, expired or already answered", async () => {
    const { store, issued, at } = await asked();
    expect(await waitingCode("ZZZZ-ZZZZ", at(30))).toBeNull();
    expect(await waitingCode("not a code", at(30))).toBeNull();
    expect(await waitingCode(issued.userCode, at(DEVICE_CODE_SECONDS + 1))).toBeNull();
    await approveDeviceCode(issued.userCode, "person-1", "founder-raise", at(30));
    expect(await waitingCode(issued.userCode, at(40))).toBeNull();
  });
});

describe("approving and denying", () => {
  it("scopes the token to the business the person approved, not the one the command line named", async () => {
    const { issued, at } = await asked("asked-for");
    expect(await approveDeviceCode(issued.userCode, "person-1", "chosen-instead", at(20))).toBe("approved");
    const grant = await exchangeDeviceCode(issued.deviceCode, at(25));
    expect(grant).toMatchObject({ business: "chosen-instead" });
    if (typeof grant === "string") throw new Error("the exchange gave back no token");
    expect(await verifyCliToken(grant.accessToken, at(26))).toEqual({ person: "person-1", business: "chosen-instead" });
  });

  it("answers a second tap, an expired code and a code nobody asked for", async () => {
    const { issued, at } = await asked();
    expect(await approveDeviceCode(issued.userCode, "person-1", "founder-raise", at(20))).toBe("approved");
    expect(await approveDeviceCode(issued.userCode, "person-2", "theirs", at(21))).toBe("already-decided");
    expect(await denyDeviceCode(issued.userCode, "person-1", at(22))).toBe("already-decided");
    expect(await approveDeviceCode("ZZZZ-ZZZZ", "person-1", "founder-raise", at(22))).toBe("no-such-code");

    const second = await asked();
    expect(await approveDeviceCode(second.issued.userCode, "person-1", "founder-raise", second.at(DEVICE_CODE_SECONDS + 1))).toBe("expired");
    expect(await approveDeviceCode(second.issued.userCode, "person-1", " ", second.at(10))).toBe("no-business");
  });

  it("stops a denied sign-in with access_denied", async () => {
    const { issued, at } = await asked();
    expect(await denyDeviceCode(issued.userCode, "person-1", at(10))).toBe("denied");
    expect(await exchangeDeviceCode(issued.deviceCode, at(15))).toBe("access_denied");
  });
});

describe("the command line polling", () => {
  it("waits while the code is pending and gives the token once it is approved", async () => {
    const { issued, at } = await asked();
    expect(await exchangeDeviceCode(issued.deviceCode, at(0))).toBe("authorization_pending");
    expect(await exchangeDeviceCode(issued.deviceCode, at(POLL_SECONDS))).toBe("authorization_pending");
    await approveDeviceCode(issued.userCode, "person-1", "founder-raise", at(POLL_SECONDS + 1));
    const grant = await exchangeDeviceCode(issued.deviceCode, at(POLL_SECONDS * 2));
    expect(grant).toMatchObject({ business: "founder-raise", expiresIn: 90 * 86_400 });
  });

  it("says slow_down to a poll inside the interval and lengthens the interval each time (RFC 8628 section 3.5)", async () => {
    const { store, issued, at } = await asked();
    expect(await exchangeDeviceCode(issued.deviceCode, at(0))).toBe("authorization_pending");
    // One second later is inside the five second interval, which then becomes ten.
    expect(await exchangeDeviceCode(issued.deviceCode, at(1))).toBe("slow_down");
    expect(store.codes[0]!.intervalSeconds).toBe(POLL_SECONDS * 2);
    // Six seconds after that is inside the new interval, which becomes fifteen.
    expect(await exchangeDeviceCode(issued.deviceCode, at(7))).toBe("slow_down");
    expect(store.codes[0]!.intervalSeconds).toBe(POLL_SECONDS * 3);
    // Waiting out the longer interval is answered plainly, and the interval stops growing.
    expect(await exchangeDeviceCode(issued.deviceCode, at(22))).toBe("authorization_pending");
    expect(store.codes[0]!.intervalSeconds).toBe(POLL_SECONDS * 3);
  });

  it("keeps the token out of the row and hands it out once", async () => {
    const { store, issued, at } = await asked();
    await approveDeviceCode(issued.userCode, "person-1", "founder-raise", at(10));
    const grant = await exchangeDeviceCode(issued.deviceCode, at(11));
    if (typeof grant === "string") throw new Error("the exchange gave back no token");
    expect(store.tokens).toHaveLength(1);
    expect(store.tokens[0]!.tokenHash).toBe(hashSecret(grant.accessToken));
    expect(JSON.stringify(store.tokens[0])).not.toContain(grant.accessToken);
    // A second poll with the same device code gets nothing, and no second token is made.
    expect(await exchangeDeviceCode(issued.deviceCode, at(12))).toBe("expired_token");
    expect(store.tokens).toHaveLength(1);
  });

  it("stops polling an unknown, a stale or an expired code", async () => {
    const { store, issued, at } = await asked();
    expect(await exchangeDeviceCode("a-device-code-nobody-ever-issued-00000000", at(5))).toBe("expired_token");
    expect(await exchangeDeviceCode("short", at(5))).toBe("expired_token");
    expect(await exchangeDeviceCode(issued.deviceCode, at(DEVICE_CODE_SECONDS + 1))).toBe("expired_token");
    // An approval that came too late is no use either: the code itself has expired.
    await approveDeviceCode(issued.userCode, "person-1", "founder-raise", at(10));
    expect(await exchangeDeviceCode(issued.deviceCode, at(DEVICE_CODE_SECONDS + 1))).toBe("expired_token");
    expect(store.tokens).toHaveLength(0);
  });
});

describe("a token in use", () => {
  /** A signed-in command line, with its token. */
  async function signedIn(business = "founder-raise", person = "person-1") {
    const store = memoryDeviceAuthStore();
    const issued = await createDeviceCode({ business, client: "naive-cli" }, { store, now: T0 });
    await approveDeviceCode(issued.userCode, person, business, { store, now: later(10) });
    const grant = await exchangeDeviceCode(issued.deviceCode, { store, now: later(11) });
    if (typeof grant === "string") throw new Error(`the exchange gave back ${grant}`);
    return { store, token: grant.accessToken, at: (seconds: number) => ({ store, now: later(seconds) }) };
  }

  it("names the person and the one business, and records when it was last used", async () => {
    const { store, token, at } = await signedIn();
    expect(await verifyCliToken(token, at(20))).toEqual({ person: "person-1", business: "founder-raise" });
    expect(store.tokens[0]!.lastUsedAt).toEqual(later(20));
    const [listed] = await cliTokens("person-1", at(21));
    expect(listed).toMatchObject({ business: "founder-raise", client: "naive-cli", lastUsedAt: later(20).toISOString() });
  });

  it("refuses a token that was never issued, one that was revoked and one that has run out", async () => {
    const { store, token, at } = await signedIn();
    expect(await verifyCliToken("a-token-nobody-ever-issued-000000000000", at(20))).toBeNull();
    expect(await verifyCliToken(token, at(91 * 86_400))).toBeNull();
    const [listed] = await cliTokens("person-1", at(20));
    expect(await revokeCliToken("person-1", listed!.id, at(30))).toBe(true);
    expect(await verifyCliToken(token, at(31))).toBeNull();
    expect(store.tokens[0]!.revokedAt).toEqual(later(30));
  });

  it("lists only this person's live sign-ins, newest first, and revokes nobody else's", async () => {
    const { store, token, at } = await signedIn();
    const second = await createDeviceCode({ business: "second-business", client: "naive-cli" }, { store, now: later(60) });
    await approveDeviceCode(second.userCode, "person-1", "second-business", { store, now: later(61) });
    await exchangeDeviceCode(second.deviceCode, { store, now: later(62) });
    const third = await createDeviceCode({ business: "not-yours", client: "naive-cli" }, { store, now: later(70) });
    await approveDeviceCode(third.userCode, "person-2", "not-yours", { store, now: later(71) });
    await exchangeDeviceCode(third.deviceCode, { store, now: later(72) });

    const mine = await cliTokens("person-1", at(80));
    expect(mine.map((t) => t.business)).toEqual(["second-business", "founder-raise"]);
    expect((await cliTokens("person-2", at(80))).map((t) => t.business)).toEqual(["not-yours"]);

    const theirs = (await cliTokens("person-2", at(80)))[0]!;
    expect(await revokeCliToken("person-1", theirs.id, at(81))).toBe(false);
    expect(await verifyCliToken(token, at(82))).not.toBeNull();

    const ours = mine[1]!;
    expect(await revokeCliToken("person-1", ours.id, at(83))).toBe(true);
    expect(await revokeCliToken("person-1", ours.id, at(84))).toBe(false);
    expect((await cliTokens("person-1", at(85))).map((t) => t.business)).toEqual(["second-business"]);
  });
});

describe("reading what the command line sent", () => {
  it("takes a business and a client, and fills in the client when it is left out", () => {
    expect(readCodeRequest({ business: "founder-raise", client: "naive-cli" })).toEqual({ business: "founder-raise", client: "naive-cli" });
    expect(readCodeRequest({ business: null, client: "naive-cli" })).toEqual({ business: null, client: "naive-cli" });
    expect(readCodeRequest({})).toEqual({ business: null, client: "naive-cli" });
    expect(readCodeRequest({ business: " founder-raise ", client: "Naive-CLI" })).toEqual({ business: "founder-raise", client: "naive-cli" });
  });

  it("says what is wrong instead of keeping a body it cannot read", () => {
    for (const body of [null, "a string", 7, []]) expect(typeof readCodeRequest(body), JSON.stringify(body)).toBe("string");
    expect(readCodeRequest({ business: { id: "x" } })).toMatch(/business/);
    expect(readCodeRequest({ business: "../../etc/passwd" })).toMatch(/business/);
    expect(readCodeRequest({ client: "a client name that goes on and on and on and on and on and on" })).toMatch(/client/);
  });

  it("takes a device code of the shape it issues, and nothing else", () => {
    expect(readTokenRequest({ device_code: "A".repeat(43) })).toBe("A".repeat(43));
    expect(readTokenRequest({ device_code: " abc_DEF-123456789012345678901234567890 " })).toBe("abc_DEF-123456789012345678901234567890");
    for (const body of [null, {}, { device_code: "" }, { device_code: "short" }, { device_code: 7 }, { device_code: `${"A".repeat(40)}!` }]) {
      expect(readTokenRequest(body), JSON.stringify(body)).toBeNull();
    }
  });

  it("answers in the words the command line reads (the contract's field names)", async () => {
    const { store, issued, at } = await asked();
    expect(codeReply(issued, "https://mentura.xyz")).toEqual({
      device_code: issued.deviceCode,
      user_code: showUserCode(issued.userCode),
      verification_uri: "https://mentura.xyz/device",
      verification_uri_complete: `https://mentura.xyz/device?user_code=${showUserCode(issued.userCode)}`,
      expires_in: 900,
      interval: 5,
    });
    expect(codeReply(issued, "http://localhost:3000/").verification_uri).toBe("http://localhost:3000/device");

    await approveDeviceCode(issued.userCode, "person-1", "founder-raise", at(10));
    const grant = await exchangeDeviceCode(issued.deviceCode, at(11));
    if (typeof grant === "string") throw new Error(`the exchange gave back ${grant}`);
    expect(tokenReply(grant)).toEqual({ access_token: grant.accessToken, token_type: "Bearer", business: "founder-raise", expires_in: 90 * 86_400 });
    expect(store.tokens).toHaveLength(1);
  });

  it("reads a user code the way the page shows it", () => {
    expect(normalizeUserCode(" bcdf-ghjk ")).toBe("BCDFGHJK");
    expect(showUserCode("BCDFGHJK")).toBe("BCDF-GHJK");
    expect(showUserCode("SHORT")).toBe("SHORT");
  });
});
