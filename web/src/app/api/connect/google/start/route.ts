import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authUrl, googleReady } from "@/server/google-calendar";
import { currentUser } from "@/server/session";

// Google Calendar's OAuth 2.0 web flow, step one (`src/server/google-calendar.ts`): sends the signed-in person to
// Google's consent screen with a one-time state kept in an httpOnly cookie. Without GOOGLE_CLIENT_ID and
// GOOGLE_CLIENT_SECRET on the deployment it goes back to the connector's page, which says it needs setup.
export const dynamic = "force-dynamic";

const BACK = "/settings/connections/google-calendar";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!(await currentUser())) return NextResponse.redirect(new URL("/sign-in", origin));
  if (!googleReady()) return NextResponse.redirect(new URL(BACK, origin));
  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authUrl(origin, state));
  res.cookies.set("google_oauth_state", state, { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax", path: "/api/connect/google", maxAge: 600 });
  return res;
}
