import { currentUser } from "@/server/session";
import { designState, readEdits, saveDesign } from "@/server/site-design";

export const dynamic = "force-dynamic";

/**
 * The Virtu editor's endpoint for the signed-in person's own site (protocol virtu-editor/1): POST {edits, publish}.
 * Without publish it answers with the state for the saved design plus the edits; with publish it saves them, only
 * when Virtu's check passes.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { edits?: unknown; publish?: unknown } | null;
  const read = readEdits(body?.edits ?? []);
  if (!read.ok) return Response.json({ error: read.error }, { status: 400 });
  return Response.json(body?.publish === true ? await saveDesign(user.id, read.edits) : await designState(user.id, read.edits));
}
