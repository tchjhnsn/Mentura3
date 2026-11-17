import { createMcpHandler } from "@modelcontextprotocol/server";
import { auth } from "@/server/auth";
import { mcpAuthHandler } from "@/server/mcp-auth";
import { reflectServer } from "@/server/mcp-tools";
import { mcpResource } from "@/server/site";

// The MCP endpoint a person's own AI connects to. The token names the person (`sub`), and every tool acts
// only for them (src/server/mcp-auth.ts). Requests are stateless: each one gets a fresh server for its person.
const mcp = createMcpHandler(({ authInfo }) => reflectServer(String(authInfo?.extra?.userId ?? "")), { responseMode: "json" });

const handler = mcpAuthHandler(auth, mcpResource(), (request, caller) =>
  mcp.fetch(request, { authInfo: { token: "", clientId: caller.clientId, scopes: caller.scopes, extra: { userId: caller.userId } } }),
);

export const POST = handler;
export const GET = handler;
