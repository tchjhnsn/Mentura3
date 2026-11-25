// Step one of device sign-in for the Naive command line (RFC 8628 sections 3.1 and 3.2; offline sync contract,
// EE-174). The command line posts `{ business, client }` and gets back the device code it polls with, the user code the
// person types, and where to type it. The rules and the reply's words are in src/server/device-auth.ts; this handler
// reads the body and writes the answer.
import { codeReply, createDeviceCode, readCodeRequest } from "@/server/device-auth";
import { siteUrl } from "@/server/site";

export const dynamic = "force-dynamic";
const NO_STORE = { "cache-control": "no-store" };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const asked = readCodeRequest(body);
  if (typeof asked === "string") return Response.json({ error: "invalid_request", error_description: asked }, { status: 400, headers: NO_STORE });
  return Response.json(codeReply(await createDeviceCode(asked), siteUrl()), { headers: NO_STORE });
}
