import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authUrl, microsoftReady, pkce } from "@/server/microsoft-calendar";
import { currentUser } from "@/server/session";

// Outlook Calendar's OAuth 2.0 authorization code flow with PKCE, step one (`src/server/microsoft-calendar.ts`): sends
// the signed-in person to Microsoft's sign-in with a one-time state and the PKCE verifier kept in an httpOnly cookie.
// Without MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET on the deployment it goes back to the connector's page,
// which says it needs setup.
export const dynamic = "force-dynamic";

const BACK = "/settings/connections/microsoft-calendar";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!(await currentUser())) return NextResponse.redirect(new URL("/sign-in", origin));
  if (!microsoftReady()) return NextResponse.redirect(new URL(BACK, origin));
  const state = randomBytes(24).toString("base64url");
  const { verifier, challenge } = pkce();
  const res = NextResponse.redirect(authUrl(origin, state, challenge));
  res.cookies.set("microsoft_oauth", `${state}.${verifier}`, { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax", path: "/api/connect/microsoft", maxAge: 600 });
  return res;
}
