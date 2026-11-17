// Who an MCP request is for. requireMcpAuth (@better-auth/mcp) checks the bearer token against Reflect's JWKS
// (signature, issuer, audience /api/mcp, expiry) and answers a missing or bad token with a 401 whose
// WWW-Authenticate names the protected resource metadata, so Claude and ChatGPT start the sign-in. Then the token
// must name a Reflect user (`sub`) who still allows the client (`azp`); Disconnect in Settings ends that at once.
import { requireMcpAuth } from "@better-auth/mcp";
import { stillConnected, type AuthWithContext } from "./connected-assistants";

export type McpCaller = { userId: string; clientId: string; scopes: string[] };

/** Claims to a caller, or the reason the token names no one. */
export function callerOf(claims: Record<string, unknown>): McpCaller | string {
  const userId = typeof claims.sub === "string" ? claims.sub : "";
  if (!userId) return "token names no person";
  const clientId = String(claims.azp ?? claims.client_id ?? "");
  if (!clientId) return "token names no client";
  return { userId, clientId, scopes: String(claims.scope ?? "").split(" ").filter(Boolean) };
}

/** Wraps a handler that serves one Reflect user's MCP request. */
export function mcpAuthHandler(auth: Parameters<typeof requireMcpAuth>[0] & AuthWithContext, resource: string, serve: (request: Request, caller: McpCaller) => Promise<Response> | Response) {
  return requireMcpAuth(
    auth,
    async (request, claims) => {
      const caller = callerOf(claims as Record<string, unknown>);
      if (typeof caller === "string") return new Response(caller, { status: 401 });
      if (!(await stillConnected(auth, caller.userId, caller.clientId))) return new Response("this assistant was disconnected from Reflect; connect it again", { status: 401, headers: { "WWW-Authenticate": `Bearer error="invalid_token", resource_metadata="${new URL("/.well-known/oauth-protected-resource", resource).href}"` } });
      return serve(request, caller);
    },
    { resource },
  );
}
