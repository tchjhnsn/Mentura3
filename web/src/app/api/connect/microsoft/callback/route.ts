import { NextResponse, type NextRequest } from "next/server";
import { connectMicrosoft, microsoftReady } from "@/server/microsoft-calendar";
import { currentUser } from "@/server/session";

// Outlook Calendar's OAuth 2.0 flow, step two: Microsoft sends the person back here with a code and the state. The
// state must match the cookie set at `/api/connect/microsoft/start`; the code is traded for tokens with the PKCE
// verifier from the same cookie, and the tokens are sealed (`connectMicrosoft`). Either way the person lands on the
// connector's page.
export const dynamic = "force-dynamic";

const BACK = "/settings/connections/microsoft-calendar";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = (error?: string) => {
    const res = NextResponse.redirect(new URL(error ? `${BACK}?error=${encodeURIComponent(error)}` : BACK, url.origin));
    res.cookies.delete({ name: "microsoft_oauth", path: "/api/connect/microsoft" });
    return res;
  };
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", url.origin));
  if (!microsoftReady()) return back();
  const [kept, verifier] = (req.cookies.get("microsoft_oauth")?.value ?? "").split(".");
  const state = url.searchParams.get("state");
  if (!state || !kept || !verifier || state !== kept) return back("The sign-in expired. Try again.");
  if (url.searchParams.get("error")) return back("Outlook Calendar was not connected.");
  const code = url.searchParams.get("code");
  if (!code) return back("Microsoft sent no sign-in code. Try again.");
  try {
    await connectMicrosoft(user.id, code, verifier, url.origin);
  } catch (e) {
    return back(e instanceof Error ? e.message : "Outlook Calendar was not connected.");
  }
  return back();
}
