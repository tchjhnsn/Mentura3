"use server";

import { revalidatePath } from "next/cache";
import type { LinkedinFiles } from "@reflect/core/profile";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { exportPreview, importLinkedinAction, removeLinkedinConnectionsAction } from "@/server/actions/linkedin";

// LinkedIn's export on Settings, Profile, LinkedIn (doc "Profiles and accounts design guide", 2026-11-18). The browser
// unzips the export and sends only the five files Reflect reads. Reading them for the preview keeps nothing; Keep and
// Remove run the registry's entries, so they are in the change log (Keep can be undone).

const PAGE = "/settings/profile/linkedin";
const why = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export type Preview = ReturnType<typeof exportPreview>;

/** What the uploaded files hold, read on the server and returned without saving anything. */
export async function previewLinkedinAction(files: LinkedinFiles): Promise<{ preview: Preview } | { error: string }> {
  await requireUser();
  try {
    const preview = exportPreview(files);
    if (!preview.files.length) return { error: "None of LinkedIn's files were in that upload. Choose the zip LinkedIn sent, or its CSV files." };
    return { preview };
  } catch (e) {
    return { error: why(e, "Those files could not be read.") };
  }
}

/** Keep: the ticked positions and schools as Experience, and the connections, sealed and private. */
export async function keepLinkedinAction(files: LinkedinFiles, keep: { positions: number[]; schools: number[] }): Promise<{ added: number; connections: number } | { error: string }> {
  const user = await requireUser();
  try {
    const r = await fromPage(importLinkedinAction, user.id, { files, keep: { ...keep, connections: true } });
    revalidatePath(PAGE);
    revalidatePath("/life/work");
    return { added: r.experience_added, connections: r.connections_kept };
  } catch (e) {
    return { error: why(e, "Could not keep that.") };
  }
}

/** Remove your LinkedIn connections (the second tap of the muted row). */
export async function removeLinkedinConnectionsFromPage(): Promise<void> {
  const user = await requireUser();
  await fromPage(removeLinkedinConnectionsAction, user.id, {});
  revalidatePath(PAGE);
  revalidatePath("/life/work");
}
