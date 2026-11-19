import { currentUser } from "@/server/session";
import { frameVerdict, siteUrl } from "@/server/frame-check";

// Whether a site may be shown in the pane's browser tab (src/components/pane.tsx): ?url=<address>. It reads only the
// site's headers and answers { ok, url, reason? }; nothing of the page comes back. Public http(s) sites only, each
// redirect checked again, for a signed-in person.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });
  const here = new URL(req.url);
  let url = siteUrl(here.searchParams.get("url") ?? "");
  if (!url) return Response.json({ ok: false, reason: "That is not a public website address." }, { status: 400 });
  const headers = { "cache-control": "no-store" };
  try {
    for (let hop = 0; hop < 4; hop++) {
      const res = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(5000), headers: { "user-agent": "Mozilla/5.0 (compatible; Reflect frame check)" } });
      res.body?.cancel().catch(() => {});
      const to = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (to) {
        const next = siteUrl(new URL(to, url).href);
        if (!next) return Response.json({ ok: false, url: url.href, reason: "The site redirects somewhere Reflect will not open." }, { headers });
        url = next;
        continue;
      }
      return Response.json({ ...frameVerdict(res.headers, here.origin), url: url.href }, { headers });
    }
    return Response.json({ ok: false, url: url.href, reason: "The site redirects too many times." }, { headers });
  } catch {
    return Response.json({ ok: false, url: url.href, reason: "The site did not answer." }, { headers });
  }
}
