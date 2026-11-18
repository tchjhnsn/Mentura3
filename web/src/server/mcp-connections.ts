// A person's connectors from the marketplace (migration 0057; @reflect/core/marketplace): remote MCP servers they
// sign in to with their own account. Reflect is the MCP client. Signing in follows the MCP authorization spec through
// the SDK's `auth`: discovery of the server's authorization server, dynamic registration (or Reflect's own client for
// a server that needs one), PKCE, and refresh. Every secret is sealed with the person's key and never logged.
import { randomBytes } from "node:crypto";
import { lookup as dnsLookup } from "node:dns/promises";
import { auth, Client, StreamableHTTPClientTransport, type OAuthClientMetadata, type OAuthClientProvider, type OAuthDiscoveryState, type StoredOAuthClientInformation, type StoredOAuthTokens } from "@modelcontextprotocol/client";
import { MARKET, marketById, marketReady, nameFromUrl, type MarketConnector, type ToolLike } from "@reflect/core/marketplace";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import { privateAddress, urlProblem } from "./link-back";
import { siteUrl } from "./site";

export type Connection = { id: string; connector: string; name: string; serverUrl: string; status: "pending" | "connected"; connectedAt: string | null; catalog: MarketConnector | null };

type Row = {
  id: string; user_id: string; connector: string; name: string; server_url: string; state: string | null;
  client_ct: string | null; tokens_ct: string | null; verifier_ct: string | null; discovery_ct: string | null;
  status: string; connected_at: Date | null;
};

const newId = () => randomBytes(9).toString("base64url");
export const callbackUrl = () => `${siteUrl()}/api/connectors/callback`;
const toConnection = (r: Row): Connection => ({
  id: r.id, connector: r.connector, name: r.name, serverUrl: r.server_url, status: r.status === "connected" ? "connected" : "pending",
  connectedAt: r.connected_at ? r.connected_at.toISOString() : null, catalog: marketById(r.connector) ?? null,
});

/** The person's connectors, connected and pending, newest first. */
export async function connectionsOf(userId: string): Promise<Connection[]> {
  const r = await db().query("SELECT * FROM mcp_connection WHERE user_id = $1 AND status <> 'removed' ORDER BY created_at DESC", [userId]);
  return (r.rows as Row[]).map(toConnection);
}

/** The person's connected connector of one catalog id, if any. */
export async function connectedTo(userId: string, connector: string): Promise<Connection | null> {
  const r = await db().query("SELECT * FROM mcp_connection WHERE user_id = $1 AND connector = $2 AND status = 'connected' ORDER BY connected_at DESC LIMIT 1", [userId, connector]);
  return r.rows[0] ? toConnection(r.rows[0] as Row) : null;
}

async function rowOf(userId: string, id: string): Promise<Row | null> {
  const r = await db().query("SELECT * FROM mcp_connection WHERE id = $1 AND user_id = $2 AND status <> 'removed'", [id, userId]);
  return (r.rows[0] as Row | undefined) ?? null;
}

/** Refuses an address that resolves to a private network, so a typed address cannot reach inside Reflect's own. */
export async function checkServerHost(url: string): Promise<void> {
  const p = urlProblem(url);
  if (p) throw new Error(p);
  const addrs = (await dnsLookup(new URL(url).hostname, { all: true, verbatim: true }).catch(() => [])).map((a) => a.address);
  if (!addrs.length) throw new Error("That address could not be found.");
  if (addrs.some(privateAddress)) throw new Error("A connector on a private network cannot be added.");
}

/** A provider for the SDK's sign-in and transport, backed by one row. Writes go straight to the row, sealed. */
function providerFor(r: Row, onRedirect: (u: URL) => void = () => undefined): OAuthClientProvider {
  const uid = r.user_id;
  const read = <T,>(ct: string | null): T | undefined => (ct ? (JSON.parse(open(uid, ct)) as T) : undefined);
  const write = async (col: "client_ct" | "tokens_ct" | "verifier_ct" | "discovery_ct", v: unknown) => {
    const ct = v === undefined || v === null ? null : seal(uid, typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v));
    r[col] = ct;
    await db().query(`UPDATE mcp_connection SET ${col} = $2 WHERE id = $1`, [r.id, ct]);
  };
  const cat = marketById(r.connector);
  const metadata: OAuthClientMetadata = {
    client_name: "Reflect",
    client_uri: siteUrl(),
    redirect_uris: [callbackUrl()],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };
  return {
    get redirectUrl() {
      return callbackUrl();
    },
    get clientMetadata() {
      return metadata;
    },
    state: () => r.state ?? "",
    clientInformation: () => {
      // A server that needs Reflect registered with it once uses Reflect's own client from the deployment's variables.
      if (cat?.auth === "oauth-app" && cat.clientEnv) {
        const [idVar, secretVar] = cat.clientEnv;
        const client_id = process.env[idVar];
        if (client_id) return { client_id, client_secret: process.env[secretVar] } as StoredOAuthClientInformation;
      }
      return read<StoredOAuthClientInformation>(r.client_ct);
    },
    saveClientInformation: (info) => write("client_ct", info),
    tokens: () => read<StoredOAuthTokens>(r.tokens_ct),
    saveTokens: (t) => write("tokens_ct", t),
    redirectToAuthorization: (u) => onRedirect(u),
    saveCodeVerifier: (v) => write("verifier_ct", v),
    codeVerifier: () => {
      const v = read<string>(r.verifier_ct);
      if (!v) throw new Error("This sign-in has expired. Connect again.");
      return v;
    },
    saveDiscoveryState: (s) => write("discovery_ct", s),
    discoveryState: () => read<OAuthDiscoveryState>(r.discovery_ct),
    invalidateCredentials: async (scope) => {
      if (scope === "all" || scope === "client") await write("client_ct", null);
      if (scope === "all" || scope === "tokens") await write("tokens_ct", null);
      if (scope === "all" || scope === "verifier") await write("verifier_ct", null);
      if (scope === "all" || scope === "discovery") await write("discovery_ct", null);
    },
  };
}

/**
 * Starts connecting: a pending row and the address of the server's sign-in page, where the person approves Reflect.
 * Returns null for the address when the server needs no sign-in (then it is connected at once).
 */
export async function startConnect(userId: string, target: { connector: string } | { url: string; name?: string }): Promise<{ id: string; redirect: string | null }> {
  let connector: string;
  let url: string;
  let name: string;
  if ("connector" in target) {
    const c = marketById(target.connector);
    if (!c) throw new Error("No such connector.");
    if (!marketReady(c, process.env)) throw new Error(`${c.name} needs Reflect registered with it first.`);
    connector = c.id;
    url = c.url;
    name = c.name;
  } else {
    url = target.url;
    await checkServerHost(url);
    const known = MARKET.find((c) => c.url === url);
    connector = known?.id ?? `custom:${newId()}`;
    name = known?.name ?? (target.name?.trim().slice(0, 60) || nameFromUrl(url));
  }
  await db().query("UPDATE mcp_connection SET status = 'removed', removed_at = now(), tokens_ct = NULL, verifier_ct = NULL WHERE user_id = $1 AND server_url = $2 AND status = 'pending'", [userId, url]);
  const live = await db().query("SELECT id FROM mcp_connection WHERE user_id = $1 AND server_url = $2 AND status = 'connected'", [userId, url]);
  if (live.rows[0]) return { id: live.rows[0].id as string, redirect: null };
  const id = newId();
  const state = randomBytes(24).toString("base64url");
  await db().query("INSERT INTO mcp_connection (id, user_id, connector, name, server_url, state) VALUES ($1, $2, $3, $4, $5, $6)", [id, userId, connector, name, url, state]);
  const r = (await rowOf(userId, id))!;
  let redirect: string | null = null;
  const result = await auth(providerFor(r, (u) => { redirect = u.toString(); }), { serverUrl: url }).catch((e: unknown) => {
    throw new Error(e instanceof Error && /register/i.test(e.message) ? `${name} would not let Reflect sign in on its own. It may need Reflect registered with it first.` : `${name} did not answer the way a connector should.`);
  });
  if (result === "AUTHORIZED") {
    await db().query("UPDATE mcp_connection SET status = 'connected', connected_at = now(), state = NULL WHERE id = $1", [id]);
    return { id, redirect: null };
  }
  return { id, redirect };
}

/** The sign-in came back with a code: trade it for tokens and mark the connector connected. Returns its id. */
export async function finishConnect(userId: string, state: string, code: string, iss?: string | null): Promise<string> {
  const r = (await db().query("SELECT * FROM mcp_connection WHERE state = $1 AND user_id = $2 AND status = 'pending'", [state, userId])).rows[0] as Row | undefined;
  if (!r) throw new Error("This sign-in has expired. Connect again.");
  const result = await auth(providerFor(r), { serverUrl: r.server_url, authorizationCode: code, ...(iss ? { iss } : {}) });
  if (result !== "AUTHORIZED") throw new Error("The sign-in did not finish.");
  await db().query("UPDATE mcp_connection SET status = 'connected', connected_at = now(), state = NULL, verifier_ct = NULL WHERE id = $1", [r.id]);
  return r.id;
}

/** Disconnect: the tokens and registration are cleared and the row marked removed. */
export async function disconnect(userId: string, id: string): Promise<Connection | null> {
  const r = await rowOf(userId, id);
  if (!r) return null;
  await db().query("UPDATE mcp_connection SET status = 'removed', removed_at = now(), tokens_ct = NULL, client_ct = NULL, verifier_ct = NULL, discovery_ct = NULL, state = NULL WHERE id = $1", [id]);
  return toConnection(r);
}

/** Runs `use` with a connected MCP client for one connection, closing it after. */
export async function withClient<T>(userId: string, id: string, use: (c: Client) => Promise<T>): Promise<T> {
  const r = await rowOf(userId, id);
  if (!r || r.status !== "connected") throw new Error("That connector is not connected.");
  const client = new Client({ name: "Reflect", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(r.server_url), { authProvider: providerFor(r) });
  try {
    await client.connect(transport);
    return await use(client);
  } catch (e) {
    if (e instanceof Error && /unauthori[sz]ed|401/i.test(e.message)) throw new Error(`${r.name} needs you to connect it again.`);
    throw e;
  } finally {
    await client.close().catch(() => undefined);
  }
}

/** The tools a connection offers. */
export async function toolsOf(userId: string, id: string): Promise<ToolLike[]> {
  return withClient(userId, id, async (c) => (await c.listTools()).tools as ToolLike[]);
}

/** Calls one tool and returns its text, or throws with the tool's own error text. */
export async function callTool(userId: string, id: string, name: string, args: Record<string, unknown>): Promise<{ text: string; structured: unknown }> {
  return withClient(userId, id, async (c) => {
    const r = await c.callTool({ name, arguments: args });
    const text = ((r.content ?? []) as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").slice(0, 20_000);
    if (r.isError) throw new Error(text || `${name} failed.`);
    return { text, structured: r.structuredContent ?? null };
  });
}
