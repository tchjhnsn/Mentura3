// Step two of device sign-in for the Naive command line (RFC 8628 section 3.4 and 3.5; offline sync contract, EE-174).
// The command line polls with its device code and gets the token once the person has approved it, or one of
// `authorization_pending`, `slow_down`, `expired_token` and `access_denied` with status 400. A body with no device code
// is `invalid_request`. The rules, the polling interval and the slow down are in src/server/device-auth.ts.
import { exchangeDeviceCode, readTokenRequest, tokenReply } from "@/server/device-auth";

export const dynamic = "force-dynamic";
const NO_STORE = { "cache-control": "no-store" };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const deviceCode = readTokenRequest(body);
  if (deviceCode === null) return Response.json({ error: "invalid_request", error_description: "Send the device_code you were given." }, { status: 400, headers: NO_STORE });
  const r = await exchangeDeviceCode(deviceCode);
  if (typeof r === "string") return Response.json({ error: r }, { status: 400, headers: NO_STORE });
  return Response.json(tokenReply(r), { headers: NO_STORE });
}
