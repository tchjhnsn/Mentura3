import { describe, expect, it } from "vitest";
import { approveDeviceCode, createDeviceCode, exchangeDeviceCode, memoryDeviceAuthStore, revokeCliToken, cliTokens } from "./device-auth";
import { bearerToken, isSyncId, verifySyncToken } from "./sync-token";

// The bearer token every offline sync call carries (offline sync contract, EE-174), over the device sign-in store in
// memory. A sync route answers 401 whenever verifySyncToken gives back null.
const T0 = new Date("2026-11-25T10:00:00Z");
const later = (seconds: number) => new Date(T0.getTime() + seconds * 1000);
const call = (header?: string) => new Request("https://mentura.xyz/api/naive/sync/changes", header === undefined ? {} : { headers: { authorization: header } });

/** A command line signed in to one business, with its token. */
async function signedIn() {
  const store = memoryDeviceAuthStore();
  const issued = await createDeviceCode({ business: "founder-raise", client: "naive-cli" }, { store, now: T0 });
  await approveDeviceCode(issued.userCode, "person-1", "founder-raise", { store, now: later(5) });
  const grant = await exchangeDeviceCode(issued.deviceCode, { store, now: later(6) });
  if (typeof grant === "string") throw new Error(`the exchange gave back ${grant}`);
  return { store, token: grant.accessToken, at: (seconds: number) => ({ store, now: later(seconds) }) };
}

describe("bearerToken", () => {
  it("reads the token out of the header, whatever case the scheme is written in", () => {
    expect(bearerToken(call("Bearer abc123"))).toBe("abc123");
    expect(bearerToken(call("bearer abc123"))).toBe("abc123");
    expect(bearerToken(call("BEARER   abc123"))).toBe("abc123");
    expect(bearerToken(call("  Bearer abc123  "))).toBe("abc123");
  });

  it("reads nothing from a missing header, another scheme or an empty token", () => {
    expect(bearerToken(call())).toBeNull();
    expect(bearerToken(call(""))).toBeNull();
    expect(bearerToken(call("Bearer"))).toBeNull();
    expect(bearerToken(call("Bearer "))).toBeNull();
    expect(bearerToken(call("Basic abc123"))).toBeNull();
    expect(bearerToken(call("abc123"))).toBeNull();
  });
});

describe("verifySyncToken", () => {
  it("names the person and the business a live token is scoped to", async () => {
    const { token, at } = await signedIn();
    expect(await verifySyncToken(call(`Bearer ${token}`), at(10))).toEqual({ person: "person-1", business: "founder-raise" });
  });

  it("gives back null for no header, a token nobody was issued and a revoked one", async () => {
    const { token, at } = await signedIn();
    expect(await verifySyncToken(call(), at(10))).toBeNull();
    expect(await verifySyncToken(call("Bearer not-a-token-anyone-was-ever-issued-0"), at(10))).toBeNull();
    const [mine] = await cliTokens("person-1", at(10));
    await revokeCliToken("person-1", mine!.id, at(11));
    expect(await verifySyncToken(call(`Bearer ${token}`), at(12))).toBeNull();
  });

  it("refuses a token whose person or business is not a plain id, which an object key is made of", async () => {
    const { store, token, at } = await signedIn();
    for (const bad of ["../../etc", "a/b", ".hidden", "", "x".repeat(121)]) expect(isSyncId(bad), bad).toBe(false);
    for (const good of ["founder-raise", "reflect-owner", "A1", "a_b.c-d"]) expect(isSyncId(good), good).toBe(true);
    // A row written before the id shape was checked cannot reach the sync API through a live token.
    store.tokens[0]!.business = "../another-business";
    expect(await verifySyncToken(call(`Bearer ${token}`), at(10))).toBeNull();
  });
});
