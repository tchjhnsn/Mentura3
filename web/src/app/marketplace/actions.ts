"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanServerUrl } from "@reflect/core/marketplace";
import { requireUser } from "@/server/session";
import { disconnect, startConnect } from "@/server/mcp-connections";
import { addPlugin, removePlugin } from "@/server/plugins";
import { removeSkill, saveSkill, setSkillEnabled } from "@/server/skills";

// The marketplace's acts (2026-11-18). Connecting is a sign-in in the person's own browser at the service, and
// disconnecting clears that sign-in, so both stay taps on the connector's page (page-actions.test.ts says why).

const fail = (to: string, e: unknown) => redirect(`${to}?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not connect.")}`);

/** Connect a catalog connector: off to its sign-in page, or straight back when it needs none. */
export async function connectAction(connector: string): Promise<void> {
  const user = await requireUser();
  const page = `/marketplace/${encodeURIComponent(connector)}`;
  let to: string | null = null;
  try {
    to = (await startConnect(user.id, { connector })).redirect;
  } catch (e) {
    fail(page, e);
  }
  redirect(to ?? `${page}?connected=1`);
}

/** Add any MCP server by its address. */
export async function addCustomAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const url = cleanServerUrl(form.get("url"));
  if (!url) redirect(`/marketplace/add?error=${encodeURIComponent("Use the server's https address, like https://example.com/mcp.")}`);
  let r: { id: string; redirect: string | null } | null = null;
  try {
    r = await startConnect(user.id, { url: url!, name: String(form.get("name") ?? "") });
  } catch (e) {
    fail("/marketplace/add", e);
  }
  revalidatePath("/marketplace");
  redirect(r!.redirect ?? `/marketplace?connected=1`);
}

/** Disconnect: Reflect forgets the sign-in. */
export async function disconnectAction(id: string, back: string): Promise<void> {
  const user = await requireUser();
  await disconnect(user.id, String(id));
  revalidatePath("/marketplace");
  redirect(back.startsWith("/") && !back.startsWith("//") ? back : "/marketplace");
}

/** Add a plugin: its skill joins Ask Reflect's instructions. */
export async function addPluginAction(id: string): Promise<void> {
  const user = await requireUser();
  await addPlugin(user.id, String(id));
  revalidatePath("/marketplace");
  redirect(`/marketplace/plugins/${encodeURIComponent(id)}?added=1`);
}

/** Remove a plugin; its connectors stay connected. */
export async function removePluginAction(id: string): Promise<void> {
  const user = await requireUser();
  await removePlugin(user.id, String(id));
  revalidatePath("/marketplace");
  redirect(`/marketplace/plugins/${encodeURIComponent(id)}`);
}

/** Write a skill, or save changes to one. */
export async function saveSkillAction(id: string | null, form: FormData): Promise<void> {
  const user = await requireUser();
  let saved = "";
  try {
    saved = await saveSkill(user.id, id ? String(id) : null, { name: form.get("name"), description: form.get("description"), instructions: form.get("instructions") });
  } catch (e) {
    fail(id ? `/marketplace/skills/${encodeURIComponent(id)}` : "/marketplace/skills/new", e);
  }
  revalidatePath("/marketplace");
  redirect(`/marketplace/skills/${saved}?saved=1`);
}

/** Turn a skill on or off. */
export async function toggleSkillAction(id: string, enabled: boolean): Promise<void> {
  const user = await requireUser();
  await setSkillEnabled(user.id, String(id), !!enabled);
  revalidatePath("/marketplace");
}

/** Remove a skill. */
export async function removeSkillAction(id: string): Promise<void> {
  const user = await requireUser();
  await removeSkill(user.id, String(id));
  revalidatePath("/marketplace");
  redirect("/marketplace?tab=skills");
}
