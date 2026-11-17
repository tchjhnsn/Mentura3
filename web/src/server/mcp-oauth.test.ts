// Reflect as an OAuth 2.1 server for other assistants (Ask Reflect plan, step 11), end to end without a server or a
// database: Reflect's own Better Auth options (./auth-options.ts) on Better Auth's in-memory store, called through
// its request handler. Covers discovery (RFC 9728, RFC 8414), dynamic client registration (RFC 7591), PKCE, the
// token naming the Reflect user, and Disconnect.
import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { getAuthTables } from "better-auth/db";
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { reflectAuthOptions } from "./auth-options";
import { connectedAssistants, disconnectAssistant } from "./connected-assistants";
import { callerOf, mcpAuthHandler } from "./mcp-auth";

const ORIGIN = "http://localhost:3000";
const RESOURCE = `${ORIGIN}/api/mcp`;
const REDIRECT = "https://claude.ai/api/mcp/auth_callback";

const SITE = { baseURL: ORIGIN, trustedOrigins: [ORIGIN], resource: RESOURCE };
// The in-memory store needs every table up front, as the migration would make them.
const tables = Object.values(getAuthTables(reflectAuthOptions(undefined, SITE))).map((t): [string, unknown[]] => [t.modelName, []]);
const auth = betterAuth({ ...reflectAuthOptions(memoryAdapter(Object.fromEntries(tables)), SITE), secret: "test-secret-test-secret-test-secret-0123" });
const call = (path: string, init?: RequestInit) => auth.handler(new Request(`${ORIGIN}${path}`, init));
const json = (body: unknown, headers: Record<string, string> = {}): RequestInit => ({ method: "POST", headers: { "content-type": "application/json", origin: ORIGIN, ...headers }, body: JSON.stringify(body) });

const b64url = (b: Buffer) => b.toString("base64url");
const pkce = () => {
  const verifier = b64url(randomBytes(32));
  return { verifier, challenge: b64url(createHash("sha256").update(verifier).digest()) };
};

/** Sign a person up and return their id and session cookie. */
async function person(email: string) {
  const res = await call("/api/auth/sign-up/email", json({ email, password: "a long password", name: "Test", adult: true }));
  expect(res.status).toBe(200);
  const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const body = (await res.json()) as { user: { id: string } };
  return { id: body.user.id, cookie };
}

async function register(name: string) {
  const res = await call("/api/auth/oauth2/register", json({ client_name: name, redirect_uris: [REDIRECT], token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"] }));
  return { res, body: (await res.json()) as Record<string, unknown> };
}

/** Authorize as the person, accept on /consent the first time (a second time goes straight back), and return the code. */
async function codeFor(clientId: string, cookie: string, challenge: string, expectConsent = true) {
  const q = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: REDIRECT, scope: "openid profile offline_access journal", state: "s1", code_challenge: challenge, code_challenge_method: "S256", resource: RESOURCE });
  const authorize = await call(`/api/auth/oauth2/authorize?${q}`, { headers: { cookie } });
  let back = new URL(authorize.headers.get("location") ?? (((await authorize.json()) as { url?: string }).url as string), ORIGIN);
  if (expectConsent) {
    expect(back.pathname).toBe("/consent");
    expect(back.searchParams.get("scope")).toContain("journal");
    const consent = await call("/api/auth/oauth2/consent", json({ accept: true, oauth_query: back.search.slice(1) }, { cookie }));
    expect(consent.status).toBe(200);
    back = new URL(((await consent.json()) as { url: string }).url);
  }
  expect(back.origin + back.pathname).toBe(REDIRECT);
  expect(back.searchParams.get("state")).toBe("s1");
  return back.searchParams.get("code")!;
}

const exchange = (clientId: string, code: string, verifier: string) =>
  call("/api/auth/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT, client_id: clientId, code_verifier: verifier, resource: RESOURCE }) });

// requireMcpAuth fetches the JWKS from Reflect's own address; here that request goes to the in-memory handler.
const realFetch = globalThis.fetch;
beforeAll(() => {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return url.startsWith(ORIGIN) ? auth.handler(new Request(input, init)) : realFetch(input, init);
  });
});
afterAll(() => vi.unstubAllGlobals());

describe("discovery", () => {
  it("serves protected resource metadata naming /api/mcp and Reflect as its authorization server", async () => {
    const res = await call("/.well-known/oauth-protected-resource");
    expect(res.status).toBe(200);
    const m = (await res.json()) as Record<string, unknown>;
    expect(m.resource).toBe(RESOURCE);
    expect(m.authorization_servers).toEqual([`${ORIGIN}/api/auth`]);
    expect(m.scopes_supported).toEqual(["journal"]);
    expect(m.bearer_methods_supported).toEqual(["header"]);
  });

  it("serves the same document at the resource's own path (RFC 9728 path form)", async () => {
    const res = await call("/.well-known/oauth-protected-resource/api/mcp");
    expect(res.status).toBe(200);
    expect(((await res.json()) as { resource: string }).resource).toBe(RESOURCE);
  });

  it("serves authorization server metadata with registration, PKCE S256 and public clients", async () => {
    const res = await oauthProviderAuthServerMetadata(auth)(new Request(`${ORIGIN}/.well-known/oauth-authorization-server`));
    expect(res.status).toBe(200);
    const m = (await res.json()) as Record<string, unknown>;
    expect(m.issuer).toBe(`${ORIGIN}/api/auth`);
    expect(m.authorization_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/authorize`);
    expect(m.token_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/token`);
    expect(m.registration_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/register`);
    expect(m.code_challenge_methods_supported).toContain("S256");
    expect(m.token_endpoint_auth_methods_supported).toContain("none");
    expect(m.scopes_supported).toEqual(expect.arrayContaining(["journal", "offline_access"]));
  });
});

describe("registration, PKCE and the token", () => {
  it("registers a public client with no sign-in, as Claude and ChatGPT do", async () => {
    const { res, body } = await register("Claude");
    expect(res.status).toBe(201);
    expect(typeof body.client_id).toBe("string");
    expect(body.client_secret).toBeUndefined();
    expect(body.redirect_uris).toEqual([REDIRECT]);
  });

  it("refuses a code exchanged with the wrong verifier, and gives a token for the right one naming the person", async () => {
    const { body } = await register("Claude");
    const clientId = String(body.client_id);
    const me = await person("pkce@example.test");

    const p = pkce();
    const code = await codeFor(clientId, me.cookie, p.challenge);
    const wrong = await exchange(clientId, code, pkce().verifier);
    expect(wrong.status).toBe(400);
    expect(((await wrong.json()) as { error: string }).error).toBe("invalid_grant");

    const p2 = pkce();
    const code2 = await codeFor(clientId, me.cookie, p2.challenge, false);
    const ok = await exchange(clientId, code2, p2.verifier);
    expect(ok.status).toBe(200);
    const tok = (await ok.json()) as { access_token: string; refresh_token?: string; token_type: string };
    expect(tok.token_type.toLowerCase()).toBe("bearer");
    expect(tok.refresh_token).toBeTruthy();
    const claims = JSON.parse(Buffer.from(tok.access_token.split(".")[1]!, "base64url").toString()) as Record<string, unknown>;
    expect(claims.sub).toBe(me.id);
    expect(claims.aud).toEqual(expect.arrayContaining([RESOURCE]));
    expect(callerOf(claims)).toEqual({ userId: me.id, clientId, scopes: expect.arrayContaining(["journal"]) });
  });

  it("serves /api/mcp only for the person the token names, and not after Disconnect", async () => {
    const { body } = await register("ChatGPT");
    const clientId = String(body.client_id);
    const me = await person("mcp@example.test");
    const p = pkce();
    const tok = (await (await exchange(clientId, await codeFor(clientId, me.cookie, p.challenge), p.verifier)).json()) as { access_token: string };

    const seen: string[] = [];
    const handler = mcpAuthHandler(auth, RESOURCE, (_req, caller) => {
      seen.push(caller.userId);
      return new Response("ok");
    });
    const mcpReq = (token?: string) => new Request(RESOURCE, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: "{}" });

    const none = await handler(mcpReq());
    expect(none.status).toBe(401);
    expect(none.headers.get("www-authenticate")).toContain("oauth-protected-resource");

    expect((await handler(mcpReq(tok.access_token))).status).toBe(200);
    expect(seen).toEqual([me.id]);

    const listed = await connectedAssistants(auth, me.id);
    expect(listed.map((a) => [a.clientId, a.name])).toEqual([[clientId, "ChatGPT"]]);
    expect(listed[0]!.scopes).toContain("journal");

    // Someone else cannot disconnect it.
    const other = await person("other@example.test");
    expect(await disconnectAssistant(auth, other.id, clientId)).toBe(false);
    expect((await connectedAssistants(auth, me.id)).length).toBe(1);

    expect(await disconnectAssistant(auth, me.id, clientId)).toBe(true);
    expect(await connectedAssistants(auth, me.id)).toEqual([]);
    const after = await handler(mcpReq(tok.access_token));
    expect(after.status).toBe(401);
    expect(seen).toEqual([me.id]);
  });
});
