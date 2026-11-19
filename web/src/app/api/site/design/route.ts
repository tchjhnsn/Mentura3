import { currentUser } from "@/server/session";
import { readLookChoice, type LookChoice } from "@reflect/virtu/looks";
import { designState, readEdits, saveDesign } from "@/server/site-design";

export const dynamic = "force-dynamic";

/**
 * The Virtu editor's endpoint for the signed-in person's own site (protocol virtu-editor/1): POST {edits, looks?, publish}.
 * looks (a shape, an ornament per slot, a season calendar) is optional; without it the saved look stays.
 * Without publish it answers with the state for the saved design plus the edits; with publish it saves them, only
 * when Virtu's check passes.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { edits?: unknown; looks?: unknown; publish?: unknown } | null;
  const read = readEdits(body?.edits ?? []);
  if (!read.ok) return Response.json({ error: read.error }, { status: 400 });
  let looks: LookChoice | undefined;
  if (body?.looks !== undefined) {
    const l = readLookChoice(body.looks as never);
    if (!l.ok) return Response.json({ error: l.error }, { status: 400 });
    looks = l.choice;
  }
  return Response.json(body?.publish === true ? await saveDesign(user.id, read.edits, looks) : await designState(user.id, read.edits, looks));
}
