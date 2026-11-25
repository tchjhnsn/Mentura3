// Naive's mcp connector asks here for the records a business reads from a connected service (src/server/naive-mcp.ts).
// Only Reflect's own bridge can ask: the body is signed with the bridge key, and the person and business it names
// are the ones the bridge's signed request was for.
import { bridgeKey } from "@/server/naive";
import { callTool, connectionsOf } from "@/server/mcp-connections";
import { answerMcp, McpRefusal, verifyMcpRequest } from "@/server/naive-mcp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  try {
    const r = verifyMcpRequest(body, req.headers.get("x-naive-signature"), bridgeKey());
    const items = await answerMcp(r, { connections: connectionsOf, call: callTool });
    return Response.json({ items });
  } catch (e) {
    const status = e instanceof McpRefusal ? e.status : 502;
    return Response.json({ error: e instanceof Error ? e.message : "Mentura could not read the service." }, { status });
  }
}
