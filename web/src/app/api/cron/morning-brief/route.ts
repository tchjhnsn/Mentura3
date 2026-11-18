import { timingSafeEqual } from "node:crypto";
import { BRIEF_SENDER_ENV, briefOf } from "@/server/dashboard-reach";
import { briefReaders } from "@/server/dashboard-event-store";
import { todayFacts } from "@/server/dashboard-today";

// The morning brief's scheduled job (Vercel cron, web/vercel.json, 12:00 UTC, which is 6 or 7 in the morning in
// Austin). Vercel calls it with `Authorization: Bearer $CRON_SECRET`. It composes the day's brief for everyone who
// turned it on. Sending is not built: Reflect has no email or push provider yet (BRIEF_SENDER_ENV names the keys one
// would need). The reply holds counts only, never anyone's brief.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function allowed(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(req: Request) {
  if (!allowed(req)) return Response.json({ error: "not allowed" }, { status: 401 });
  const readers = await briefReaders();
  let composed = 0;
  for (const r of readers) {
    try {
      briefOf(await todayFacts(r.id), r.name);
      composed++;
    } catch {
      // One person's broken records leave the others' briefs.
    }
  }
  return Response.json({ readers: readers.length, composed, sent: 0, sending: "not built: needs an email or push provider key", needs: BRIEF_SENDER_ENV }, { headers: { "cache-control": "no-store" } });
}
