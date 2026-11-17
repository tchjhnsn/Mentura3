// The assistants a person has connected to Reflect over MCP (Claude, ChatGPT or any MCP client), from Better Auth's
// OAuth tables: a connection is the person's consent to a client. Settings, Connections lists them, and Disconnect
// removes the consent and every token the client holds for the person. Access tokens are JWTs that would otherwise
// stay valid until they expire, so /api/mcp also refuses a token whose consent is gone (`stillConnected`).
// Everything goes through Better Auth's adapter, so it runs on Postgres in the app and in memory in tests.
import type { DBAdapter } from "better-auth";

/** The part of a Better Auth instance this needs. */
export type AuthWithContext = { $context: Promise<{ adapter: Pick<DBAdapter, "findMany" | "findOne" | "deleteMany"> }> };

export type ConnectedAssistant = { clientId: string; name: string; scopes: string[]; since: Date };

type ConsentRow = { id: string; clientId: string; userId?: string | null; scopes?: string[] | string | null; createdAt?: Date | string | null };
type ClientRow = { clientId: string; name?: string | null };

const scopeList = (v: ConsentRow["scopes"]): string[] => (Array.isArray(v) ? v : typeof v === "string" ? (v.trim().startsWith("[") ? (JSON.parse(v) as string[]) : v.split(" ").filter(Boolean)) : []);

/** The person's connected assistants, most recent first. An assistant names itself when it registers. */
export async function connectedAssistants(auth: AuthWithContext, userId: string): Promise<ConnectedAssistant[]> {
  if (!userId) return [];
  const { adapter } = await auth.$context;
  const consents = await adapter.findMany<ConsentRow>({ model: "oauthConsent", where: [{ field: "userId", value: userId }] });
  if (!consents.length) return [];
  const ids = [...new Set(consents.map((c) => c.clientId))];
  const clients = await adapter.findMany<ClientRow>({ model: "oauthClient", where: [{ field: "clientId", operator: "in", value: ids }] });
  const names = new Map(clients.map((c) => [c.clientId, c.name?.trim() || "An assistant with no name"]));
  return consents
    .map((c) => ({ clientId: c.clientId, name: names.get(c.clientId) ?? "An assistant with no name", scopes: scopeList(c.scopes), since: new Date(c.createdAt ?? 0) }))
    .sort((a, b) => b.since.getTime() - a.since.getTime());
}

/** Whether the person still allows this client. A token for a client the person disconnected is refused. */
export async function stillConnected(auth: AuthWithContext, userId: string, clientId: string): Promise<boolean> {
  if (!userId || !clientId) return false;
  const { adapter } = await auth.$context;
  const row = await adapter.findOne<ConsentRow>({ model: "oauthConsent", where: [{ field: "userId", value: userId }, { field: "clientId", value: clientId }] });
  return Boolean(row);
}

/** Disconnect an assistant: its consent and every access and refresh token it holds for this person. Only the person's own. */
export async function disconnectAssistant(auth: AuthWithContext, userId: string, clientId: string): Promise<boolean> {
  if (!userId || !clientId) return false;
  const { adapter } = await auth.$context;
  const mine = [{ field: "userId", value: userId }, { field: "clientId", value: clientId }];
  const had = await adapter.findOne<ConsentRow>({ model: "oauthConsent", where: mine });
  // Access tokens first: they may name a refresh token.
  await adapter.deleteMany({ model: "oauthAccessToken", where: mine });
  await adapter.deleteMany({ model: "oauthRefreshToken", where: mine });
  await adapter.deleteMany({ model: "oauthConsent", where: mine });
  return Boolean(had);
}
