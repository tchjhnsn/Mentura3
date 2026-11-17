import { NextResponse, type NextRequest } from "next/server";
import { connectGoogle, googleReady } from "@/server/google-calendar";
import { currentUser } from "@/server/session";

// Google Calendar's OAuth 2.0 web flow, step two: Google sends the person back here with a code and the state.
// The state must match the cookie set at `/api/connect/google/start`; the code is traded for tokens, which are
// sealed (`connectGoogle`). Either way the person lands on the connector's page.
export const dynamic = "force-dynamic";

const BACK = "/settings/connections/google-calendar";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = (error?: string) => {
    const res = NextResponse.redirect(new URL(error ? `${BACK}?error=${encodeURIComponent(error)}` : BACK, url.origin));
    res.cookies.delete({ name: "google_oauth_state", path: "/api/connect/google" });
    return res;
  };
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", url.origin));
  if (!googleReady()) return back();
  const state = url.searchParams.get("state");
  if (!state || state !== req.cookies.get("google_oauth_state")?.value) return back("The sign-in expired. Try again.");
  if (url.searchParams.get("error")) return back("Google Calendar was not connected.");
  const code = url.searchParams.get("code");
  if (!code) return back("Google sent no sign-in code. Try again.");
  try {
    await connectGoogle(user.id, code, url.origin);
  } catch (e) {
    return back(e instanceof Error ? e.message : "Google Calendar was not connected.");
  }
  return back();
}
